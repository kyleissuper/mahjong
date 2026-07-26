import { tracing } from 'cloudflare:workers';
import { OpenRouterVision } from '../adapters/openrouter-vision.ts';
import type { Hand, Win } from '../mahjong/types.ts';

export { AppDO } from './app-do.ts';

interface Env {
  OPENROUTER_API_KEY: string;
  ADMIN_PASSWORD: string;
  APP: DurableObjectNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

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
  },
};

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

    const sessionMatch = pathname.match(/^\/api\/sessions\/([A-Z0-9]+)(\/.*)?$/);
    if (sessionMatch) {
      const [, code, sub] = sessionMatch;

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

    // Players
    if (pathname === '/api/players' && request.method === 'GET') {
      const players = await app.getPlayers();
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
      return routeAdmin(app, request, pathname);
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

async function routeAdmin(app: any, request: Request, pathname: string): Promise<Response> {
  if (pathname === '/api/admin/sessions' && request.method === 'GET') {
    const sessions = await app.listSessions();
    return json({ sessions: sessions.map((s: any) => ({
      ...s,
      createdAt: formatPacific(s.createdAt),
      expiresAt: formatPacific(s.expiresAt),
    })) });
  }

  const sessionAction = pathname.match(/^\/api\/admin\/sessions\/([A-Z0-9]+)\/(extend|expire|delete)$/);
  if (sessionAction && request.method === 'POST') {
    const [, code, action] = sessionAction;
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
      await app.deleteSession(code);
      return json({ ok: true });
    }
  }

  const deleteHand = pathname.match(/^\/api\/admin\/hands\/(\d+)\/delete$/);
  if (deleteHand && request.method === 'POST') {
    await app.deleteHand(parseInt(deleteHand[1]));
    return json({ ok: true });
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
    const vision = new OpenRouterVision(env.OPENROUTER_API_KEY);
    try {
      const melds = await tracing.enterSpan('visionApi', (s) => {
        s.setAttribute('model', 'google/gemini-3.6-flash');
        return vision.recognize(body.image as string);
      });
      span.setAttribute('melds.count', melds.length);
      return json({ melds });
    } catch (err) {
      span.setAttribute('error', true);
      return json({ error: err instanceof Error ? err.message : 'Scan failed' }, 502);
    }
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
