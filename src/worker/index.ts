import { tracing } from 'cloudflare:workers';
import { OpenRouterVision } from '../adapters/openrouter-vision.ts';
import { matchScansToHands, parsePacificTimestamp } from './scan-match.ts';
import type { Hand, Meld, Win } from '../mahjong/types.ts';

export { AppDO } from './app-do.ts';

interface Env {
  OPENROUTER_API_KEY: string;
  ADMIN_PASSWORD: string;
  APP: DurableObjectNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SCANS: R2Bucket;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const app = getApp(env);
    await app.expireOverdueSessions();
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Force HTTPS everywhere except local dev.
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol === 'http:' && !isLocal) {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    const response = await handleRequest(request, env, url.pathname);

    // 101s carry the WebSocket and can't be rewrapped.
    if (url.protocol === 'https:' && response.status !== 101) {
      const secured = new Response(response.body, response);
      secured.headers.set('Strict-Transport-Security', 'max-age=31536000');
      return secured;
    }
    return response;
  },
};

async function handleRequest(request: Request, env: Env, pathname: string): Promise<Response> {
  if (pathname === '/api/recognize') {
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
    return recognize(request, env);
  }

  if (pathname === '/api/auth' && request.method === 'POST') {
    return authenticate(request, env);
  }

  if (pathname.startsWith('/api/')) {
    return routeApi(request, env, pathname);
  }

  return env.ASSETS.fetch(request);
}

function getApp(env: Env) {
  return env.APP.getByName('main', { locationHint: 'wnam' }) as any;
}

// --- Auth ---

function generateToken(password: string): string {
  let hash = 0;
  const str = password + ':mahjong-admin-token';
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

async function authenticate(request: Request, env: Env): Promise<Response> {
  const { password } = await request.json() as { password?: string };
  if (password !== env.ADMIN_PASSWORD) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return json({ token: generateToken(env.ADMIN_PASSWORD) });
}

function requireAdmin(request: Request, env: Env): Response | null {
  const token = request.headers.get('x-admin-token');
  if (token !== generateToken(env.ADMIN_PASSWORD)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return null;
}

// --- API routing ---

async function routeApi(request: Request, env: Env, pathname: string): Promise<Response> {
  const app = getApp(env);

  try {
    // Sessions
    if (pathname === '/api/sessions' && request.method === 'POST') {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const sessions = await app.listSessions();
      const codes = new Set(sessions.map((s: any) => s.code));
      let code: string;
      do { code = generateCode(); } while (codes.has(code));
      await app.createSession(code);
      return json({ code }, 201);
    }

    const sessionMatch = pathname.match(/^\/api\/sessions\/([A-Za-z0-9]+)(\/.*)?$/);
    if (sessionMatch) {
      const [, rawCode, sub] = sessionMatch;
      const code = rawCode.toUpperCase();

      if (request.headers.get('upgrade') === 'websocket') {
        return app.fetch(request);
      }

      if (!sub || sub === '/') {
        const session = await app.getSession(code);
        return json({ ...session, createdAt: formatPacific(session.createdAt), expiresAt: formatPacific(session.expiresAt) });
      }

      if (sub === '/hands' && request.method === 'POST') {
        const { hand, win, timing } = await request.json() as { hand: Hand; win: Win; timing?: any };
        const scored = await app.scoreHand(code, hand, win, timing);
        return json({ hand: scored }, 201);
      }

      if (sub === '/hands' && request.method === 'GET') {
        const hands = await app.getSessionHands(code);
        return json({ hands });
      }
    }

    // All hands
    if (pathname === '/api/hands' && request.method === 'GET') {
      const hands = await app.getAllHands();
      return json({ hands });
    }

    // Scan photo behind a scored hand. The strict id pattern doubles as
    // sanitization for the LIKE lookup in hasScan.
    const scanMatch = pathname.match(/^\/api\/scans\/(\d+-[a-z0-9]+)$/);
    if (scanMatch && request.method === 'GET') {
      if (!(await app.hasScan(scanMatch[1]))) return json({ error: 'Not found' }, 404);
      const obj = await env.SCANS.get(`scans/${scanMatch[1]}.jpg`);
      if (!obj) return json({ error: 'Not found' }, 404);
      return new Response(obj.body, {
        headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=86400' },
      });
    }

    // Players
    if (pathname === '/api/players' && request.method === 'GET') {
      const q = new URL(request.url).searchParams.get('q');
      const players = q ? await app.searchPlayers(q) : await app.getPlayers();
      return json({ players });
    }

    if (pathname === '/api/players' && request.method === 'POST') {
      const { name } = await request.json() as { name: string };
      const player = await app.registerPlayer(name);
      return json({ player }, 201);
    }

    // Admin
    if (pathname.startsWith('/api/admin/')) {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      // return await: a bare `return promise` would reject outside this try.
      return await routeAdmin(app, request, pathname, env);
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('not found')) return json({ error: message }, 404);
    if (message.includes('expired')) return json({ error: message }, 410);
    if (message.includes('already taken') || message.includes('same player')) {
      return json({ error: message }, 400);
    }
    return json({ error: message }, 500);
  }
}

// --- Admin ---

async function routeAdmin(app: any, request: Request, pathname: string, env: Env): Promise<Response> {
  if (pathname === '/api/admin/sessions' && request.method === 'GET') {
    const sessions = await app.listSessions();
    const now = Date.now();
    return json({ sessions: sessions.map((s: any) => ({
      ...s,
      expired: s.expired || (s.expiresAt && new Date(s.expiresAt).getTime() < now),
      createdAt: formatPacific(s.createdAt),
      expiresAt: formatPacific(s.expiresAt),
    })) });
  }

  if (pathname === '/api/admin/rescore' && (request.method === 'GET' || request.method === 'POST')) {
    return json(await app.rescoreHands(request.method === 'POST'));
  }

  if (pathname === '/api/admin/backup-email' && request.method === 'GET') {
    const email = await app.getBackupEmail();
    return json({ email });
  }
  if (pathname === '/api/admin/backup-email' && request.method === 'POST') {
    const { email } = await request.json() as { email: string | null };
    await app.setBackupEmail(email);
    return json({ ok: true });
  }

  const sessionAction = pathname.match(/^\/api\/admin\/sessions\/([A-Za-z0-9]+)\/(extend|expire|delete)$/);
  if (sessionAction && request.method === 'POST') {
    const [, rawAdminCode, action] = sessionAction;
    const code = rawAdminCode.toUpperCase();
    if (action === 'extend') {
      const { hours = 24 } = await request.json() as { hours?: number };
      await app.extendSession(code, hours);
      return json({ ok: true });
    }
    if (action === 'expire') {
      await app.expireSession(code);
      return json({ ok: true });
    }
    if (action === 'delete') {
      const scanIds = await app.getSessionScanIds(code);
      await app.deleteSession(code);
      if (scanIds.length > 0) {
        await env.SCANS.delete(scanIds.map((id: string) => `scans/${id}.jpg`));
      }
      return json({ ok: true });
    }
  }

  const deleteHand = pathname.match(/^\/api\/admin\/hands\/(\d+)\/delete$/);
  if (deleteHand && request.method === 'POST') {
    await app.deleteHand(parseInt(deleteHand[1]));
    return json({ ok: true });
  }

  if (pathname === '/api/admin/scans/backfill' && request.method === 'POST') {
    const { commit = false } = await request.json() as { commit?: boolean };
    return backfillScans(app, env, commit);
  }

  if (pathname === '/api/admin/players' && request.method === 'GET') {
    const players = await app.getPlayers();
    return json({ players });
  }

  if (pathname === '/api/admin/players/merge' && request.method === 'POST') {
    const { keepId, mergeId } = await request.json() as { keepId: string; mergeId: string };
    await app.mergePlayers(keepId, mergeId);
    return json({ ok: true });
  }

  const playerAction = pathname.match(/^\/api\/admin\/players\/([a-z0-9]+)\/(rename|delete)$/);
  if (playerAction && request.method === 'POST') {
    const [, id, action] = playerAction;
    if (action === 'rename') {
      const { name } = await request.json() as { name: string };
      const player = await app.renamePlayer(id, name);
      return json({ player });
    }
    if (action === 'delete') {
      await app.deletePlayer(id);
      return json({ ok: true });
    }
  }

  if (pathname === '/api/admin/timing' && request.method === 'GET') {
    const timings = await app.getTimingStats();
    return json({ timings });
  }

  return json({ error: 'Not found' }, 404);
}

// --- Vision ---

async function recognize(request: Request, env: Env): Promise<Response> {
  return tracing.enterSpan('recognize', async (span) => {
    if (!env.OPENROUTER_API_KEY) {
      span.setAttribute('error', true);
      return json({ error: 'Server is missing OPENROUTER_API_KEY' }, 500);
    }
    let body: { image?: unknown };
    try {
      body = await tracing.enterSpan('parseBody', () => request.json()) as { image?: unknown };
    } catch {
      return json({ error: 'Body must be JSON: { image: "data:image/...;base64,..." }' }, 400);
    }
    if (typeof body.image !== 'string' || !body.image.startsWith('data:image/')) {
      return json({ error: 'image must be a data URL' }, 400);
    }
    const imageBytes = Math.round((body.image.length * 3) / 4);
    span.setAttribute('image.bytes', imageBytes);

    const scanId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    span.setAttribute('scan.id', scanId);

    const storeImage = tracing.enterSpan('storeImage', async () => {
      const base64 = (body.image as string).split(',')[1];
      const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const mime = (body.image as string).split(';')[0].split(':')[1];
      await env.SCANS.put(`scans/${scanId}.jpg`, binary, {
        httpMetadata: { contentType: mime },
        customMetadata: { scanId },
      });
    });

    const vision = new OpenRouterVision(env.OPENROUTER_API_KEY);
    try {
      const [melds] = await Promise.all([
        vision.recognize(body.image as string),
        storeImage,
      ]);
      span.setAttribute('melds.count', melds.length);
      return json({ melds, scanId });
    } catch (err) {
      span.setAttribute('error', true);
      return json({ error: err instanceof Error ? err.message : 'Scan failed' }, 502);
    }
  });
}

// --- Scan photo backfill ---
// Hands scored by clients that predate scanId tracking have photos in R2 but
// no link. Re-recognize orphaned photos and match them to hands by tile
// content + capture time; commit only uncontested matches.

async function backfillScans(app: any, env: Env, commit: boolean): Promise<Response> {
  // Each call recognizes at most one small batch (seconds, not minutes) and
  // caches results in the DO; the admin UI keeps calling until remaining = 0.
  const BATCH = 8;
  const WINDOW_MS = 21 * 60 * 1000;

  const hands: any[] = await app.getAllHands();
  const linked = new Set(hands.map(h => h.scanId).filter(Boolean));

  const unlinkedHands = hands
    .map(h => ({
      id: h.id,
      winner: h.winner,
      timestamp: h.timestamp,
      timeMs: parsePacificTimestamp(h.timestamp),
      tiles: (h.melds as Meld[]).flatMap(m => m.tiles),
      hasScan: !!h.scanId,
    }))
    .filter(h => !h.hasScan && h.timeMs !== null);

  // All R2 scans not linked to any hand.
  const orphans: { scanId: string; timeMs: number }[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.SCANS.list({ prefix: 'scans/', cursor });
    for (const obj of page.objects) {
      const scanId = obj.key.slice('scans/'.length).replace(/\.jpg$/, '');
      const timeMs = parseInt(scanId.split('-')[0]);
      if (!linked.has(scanId) && Number.isFinite(timeMs)) orphans.push({ scanId, timeMs });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  // Only photos near some unlinked hand are worth a vision call.
  const relevant = orphans.filter(o =>
    unlinkedHands.some(h => Math.abs((h.timeMs as number) - o.timeMs) <= WINDOW_MS)
  );

  const cache: Record<string, string[]> = await app.getScanRecognitions();
  const todo = relevant.filter(o => !(o.scanId in cache));
  const batch = commit ? [] : todo.slice(0, BATCH);

  const vision = batch.length > 0 ? new OpenRouterVision(env.OPENROUTER_API_KEY) : null;
  let batchRecognized = 0;
  let batchFailed = 0;
  const queue = [...batch];
  await Promise.all(Array.from({ length: 3 }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        const obj = await env.SCANS.get(`scans/${item.scanId}.jpg`);
        if (!obj) { batchFailed++; continue; }
        const bytes = new Uint8Array(await obj.arrayBuffer());
        let bin = '';
        for (let i = 0; i < bytes.length; i += 8192) {
          bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
        }
        const mime = obj.httpMetadata?.contentType ?? 'image/jpeg';
        const melds = await vision!.recognize(`data:${mime};base64,${btoa(bin)}`);
        const tiles = melds.flatMap((m: Meld) => m.tiles);
        await app.putScanRecognition(item.scanId, tiles);
        cache[item.scanId] = tiles;
        batchRecognized++;
      } catch {
        batchFailed++;
      }
    }
  }));

  const recognized = relevant
    .filter(o => o.scanId in cache)
    .map(o => ({ scanId: o.scanId, timeMs: o.timeMs, tiles: cache[o.scanId] }));

  const matches = matchScansToHands(
    unlinkedHands.map(h => ({ id: h.id, timeMs: h.timeMs as number, tiles: h.tiles })),
    recognized,
  );

  const byHand = new Map(unlinkedHands.map(h => [h.id, h]));
  const byScan = new Map(recognized.map(s => [s.scanId, s]));
  const proposals = matches.map(m => ({
    handId: m.handId,
    winner: byHand.get(m.handId)!.winner,
    handTime: byHand.get(m.handId)!.timestamp,
    scanId: m.scanId,
    scanTime: formatPacific(new Date(byScan.get(m.scanId)!.timeMs).toISOString()),
    score: Math.round(m.score * 100) / 100,
    contested: m.contested,
    handTiles: byHand.get(m.handId)!.tiles,
    scanTiles: byScan.get(m.scanId)!.tiles,
  }));

  let committed = 0;
  if (commit) {
    for (const p of proposals) {
      if (!p.contested) {
        await app.setHandScanId(p.handId, p.scanId);
        committed++;
      }
    }
  }

  return json({
    committed: commit ? committed : null,
    unlinkedHands: unlinkedHands.length,
    orphanScans: orphans.length,
    recognized: recognized.length,
    remaining: todo.length - batchRecognized,
    batchRecognized,
    batchFailed,
    proposals,
  });
}

// --- Helpers ---

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json' },
  });
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function formatPacific(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
}
