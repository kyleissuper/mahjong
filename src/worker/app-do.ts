import { DurableObject } from 'cloudflare:workers';
import { Resend } from 'resend';
import { drizzle } from 'drizzle-orm/durable-sqlite';
import { eq, sql } from 'drizzle-orm';
import * as schema from './schema.ts';
import { computeScoredHand, type ScoredHand } from '../mahjong/session.ts';
import { rescoreStoredHand } from '../mahjong/rescore.ts';
import type { Hand, Win } from '../mahjong/types.ts';

interface Env {
  APP: DurableObjectNamespace<AppDO>;
  RESEND_API_KEY: string;
  SCANS: R2Bucket;
}

export class AppDO extends DurableObject<Env> {
  private db;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.db = drizzle(ctx.storage, { schema });
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS sessions (
        code TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL DEFAULT '',
        expired INTEGER NOT NULL DEFAULT 0
      )`);
      ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      )`);
      ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS hands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_code TEXT NOT NULL REFERENCES sessions(code),
        timestamp TEXT NOT NULL,
        winner TEXT NOT NULL,
        method TEXT NOT NULL,
        hand_value REAL NOT NULL,
        applied_rules TEXT NOT NULL,
        dealer_bonus REAL NOT NULL DEFAULT 0,
        melds TEXT NOT NULL,
        scores TEXT NOT NULL
      )`);
      try { ctx.storage.sql.exec(`ALTER TABLE hands ADD COLUMN timing TEXT`); } catch {}
      try { ctx.storage.sql.exec(`ALTER TABLE sessions ADD COLUMN backup_email TEXT`); } catch {}
      try { ctx.storage.sql.exec(`ALTER TABLE hands ADD COLUMN winner_id TEXT`); } catch {}
      // A merged-away id submitted by a phone mid-entry resolves through here.
      ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS player_merges (
        old_id TEXT PRIMARY KEY,
        new_id TEXT NOT NULL
      )`);
      await this.rescoreOnce();
    });
  }

  /**
   * One-time: the 2026-08-24 rescore ran before the latest round of rule
   * fixes (the No Flowers and No Honors stacking rulings among them), so
   * stored hands still carry pre-fix values. Re-runs the rescore under the
   * current rules on the first wake after deploy.
   */
  private async rescoreOnce(): Promise<void> {
    const FLAG = 'rescored-2026-08-27';
    if (await this.ctx.storage.get(FLAG)) return;
    const result = await this.rescoreHands(true);
    await this.ctx.storage.put(FLAG, {
      at: new Date().toISOString(),
      total: result.total,
      unchanged: result.unchanged,
      changed: result.changed.length,
      anomalies: result.anomalies,
    });
  }

  /**
   * Recompute every stored hand under the current rules. Dry run reports what
   * would change; apply backs up each touched row (first backup wins) and
   * writes the new values. Idempotent: a second apply finds nothing to change.
   */
  async rescoreHands(apply: boolean) {
    this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS hands_rescore_backup (
      id INTEGER PRIMARY KEY,
      backed_up_at TEXT NOT NULL,
      hand_value REAL NOT NULL,
      applied_rules TEXT NOT NULL,
      scores TEXT NOT NULL
    )`);
    const rows = this.ctx.storage.sql.exec<{
      id: number; session_code: string; timestamp: string; winner_id: string | null;
      method: string; hand_value: number; applied_rules: string; melds: string; scores: string;
    }>(`SELECT id, session_code, timestamp, winner_id, method, hand_value, applied_rules, melds, scores FROM hands`).toArray();

    const changed: unknown[] = [];
    const anomalies: unknown[] = [];
    let unchanged = 0;
    for (const row of rows) {
      try {
        if (!row.winner_id) throw new Error('missing winner_id');
        const oldRules = JSON.parse(row.applied_rules) as { name: string; points: number }[];
        const oldScores = JSON.parse(row.scores) as Record<string, number>;
        const result = rescoreStoredHand({
          melds: JSON.parse(row.melds),
          method: row.method as Win['method'],
          winnerId: row.winner_id,
          handValue: row.hand_value,
          appliedRules: oldRules,
          scores: oldScores,
        });
        const same = result.handValue === row.hand_value
          && JSON.stringify(result.appliedRules) === JSON.stringify(oldRules)
          && Object.keys(oldScores).length === Object.keys(result.scores).length
          && Object.entries(result.scores).every(([player, v]) => oldScores[player] === v);
        if (same) { unchanged++; continue; }
        changed.push({
          id: row.id,
          session: row.session_code,
          timestamp: row.timestamp,
          oldValue: row.hand_value,
          newValue: result.handValue,
          oldRules: oldRules.map(r => `${r.name}:${r.points}`),
          newRules: result.appliedRules.map(r => `${r.name}:${r.points}`),
          oldScores,
          newScores: result.scores,
        });
        if (apply) {
          this.ctx.storage.sql.exec(
            `INSERT OR IGNORE INTO hands_rescore_backup (id, backed_up_at, hand_value, applied_rules, scores)
             VALUES (?, ?, ?, ?, ?)`,
            row.id, new Date().toISOString(), row.hand_value, row.applied_rules, row.scores
          );
          this.ctx.storage.sql.exec(
            `UPDATE hands SET hand_value = ?, applied_rules = ?, scores = ? WHERE id = ?`,
            result.handValue, JSON.stringify(result.appliedRules), JSON.stringify(result.scores), row.id
          );
        }
      } catch (err) {
        anomalies.push({ id: row.id, session: row.session_code, timestamp: row.timestamp,
          error: err instanceof Error ? err.message : String(err) });
      }
    }
    if (apply && changed.length > 0) this.broadcast({ type: 'hands-changed' });
    return { applied: apply, total: rows.length, unchanged, changed, anomalies };
  }

  /** Inspection: the outcome of the deploy-time one-shot rescore, if it ran. */
  async getRescoreStatus() {
    return await this.ctx.storage.get('rescored-2026-08-27') ?? null;
  }

  // --- Sessions ---

  async createSession(code: string): Promise<void> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await this.db.insert(schema.sessions).values({ code, createdAt: now, expiresAt, expired: false });
  }

  async getSession(code: string) {
    const row = await this.db.select().from(schema.sessions).where(eq(schema.sessions.code, code)).get();
    if (!row) throw new Error('Session not found');
    const isExpired = row.expired || (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now());
    return { ...row, expired: !!isExpired };
  }

  async getSessionStatus(code: string) {
    const row = await this.db.select().from(schema.sessions).where(eq(schema.sessions.code, code)).get();
    if (!row) return null;
    const handCount = await this.db.select().from(schema.hands).where(eq(schema.hands.sessionCode, code)).all();
    return { ...row, handCount: handCount.length };
  }

  async listSessions() {
    return this.db.select().from(schema.sessions).orderBy(sql`created_at DESC`).all();
  }

  async expireSession(code: string): Promise<void> {
    await this.db.update(schema.sessions).set({ expired: true }).where(eq(schema.sessions.code, code));
    this.broadcast({ type: 'expired' });
    await this.sendBackup();
  }

  async sendBackup(): Promise<{ ok: boolean; detail: string }> {
    const outcome = await this.trySendBackup();
    await this.ctx.storage.put('last-backup-result', { at: new Date().toISOString(), ...outcome });
    return outcome;
  }

  private async trySendBackup(): Promise<{ ok: boolean; detail: string }> {
    const email = await this.getBackupEmail();
    if (!email) return { ok: false, detail: 'no backup email configured' };
    try {
      const data = await this.exportAll();
      if (data.hands.length === 0) return { ok: false, detail: 'nothing to back up' };
      const date = new Date().toISOString().split('T')[0];
      const key = `backups/mahjong-backup-${date}.json`;
      await this.env.SCANS.put(key, JSON.stringify(data, null, 2));
      const summary = `${data.sessions.length} sessions, ${data.hands.length} hands, ${data.players.length} players`;
      if (!this.env.RESEND_API_KEY) return { ok: false, detail: `stored ${key}; RESEND_API_KEY is not set` };
      const resend = new Resend(this.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: 'backup@mj-backups.kyletan.com',
        to: email,
        subject: `Mahjong Backup — ${date}`,
        text: `Backup stored: ${summary}.\n\nDownload it any time from the admin panel at https://mahjong.kyletan.com/ (Settings > Download backup).`,
      });
      if (error) {
        const e = error as { name?: string; message?: string };
        return { ok: false, detail: `stored ${key}; email failed — resend: ${e.name ?? ''} ${e.message ?? JSON.stringify(error)}`.trim() };
      }
      return { ok: true, detail: `stored ${key}; notified ${email} — ${summary}` };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : String(err) };
    }
  }

  async getBackupStatus() {
    return {
      email: await this.getBackupEmail(),
      lastBackup: await this.ctx.storage.get('last-backup-result') ?? null,
      lastCronAt: await this.ctx.storage.get('last-cron-at') ?? null,
    };
  }

  async recordCronRun(): Promise<void> {
    await this.ctx.storage.put('last-cron-at', new Date().toISOString());
  }

  async extendSession(code: string, hours: number): Promise<void> {
    const session = await this.db.select().from(schema.sessions).where(eq(schema.sessions.code, code)).get();
    if (!session) throw new Error('Session not found');
    const currentExpiry = new Date(session.expiresAt).getTime();
    const base = Number.isNaN(currentExpiry) || currentExpiry < Date.now() ? Date.now() : currentExpiry;
    const newExpiry = base + hours * 60 * 60 * 1000;
    const expiresAt = new Date(newExpiry).toISOString();
    await this.db.update(schema.sessions).set({ expired: false, expiresAt }).where(eq(schema.sessions.code, code));
  }

  async getSessionScanIds(code: string): Promise<string[]> {
    const rows = this.ctx.storage.sql.exec<{ timing: string }>(
      `SELECT timing FROM hands WHERE session_code = ? AND timing IS NOT NULL`, code
    ).toArray();
    return rows
      .map(r => { try { return JSON.parse(r.timing)?.scanId; } catch { return null; } })
      .filter((id): id is string => !!id);
  }

  async setBackupEmail(email: string | null): Promise<void> {
    if (email) {
      await this.ctx.storage.put('backup-email', email);
    } else {
      await this.ctx.storage.delete('backup-email');
    }
  }

  async getBackupEmail(): Promise<string | null> {
    return await this.ctx.storage.get<string>('backup-email') ?? null;
  }

  async exportAll() {
    const sessions = await this.db.select().from(schema.sessions).all();
    const hands = await this.db.select().from(schema.hands).all();
    const players = await this.db.select().from(schema.players).all();
    const names = new Map(players.map(p => [p.id, p.name]));
    return { sessions, hands: hands.map(h => rowToScoredHand(h, names)), players };
  }

  async expireOverdueSessions(): Promise<void> {
    const rows = await this.db.select().from(schema.sessions).all();
    const overdue = rows.filter(r => !r.expired && r.expiresAt && new Date(r.expiresAt).getTime() < Date.now());
    for (const row of overdue) {
      await this.expireSession(row.code);
    }
  }

  async deleteSession(code: string): Promise<void> {
    await this.db.delete(schema.hands).where(eq(schema.hands.sessionCode, code));
    await this.db.delete(schema.sessions).where(eq(schema.sessions.code, code));
    this.broadcast({ type: 'expired' });
  }

  // --- Hands ---

  async scoreHand(code: string, hand: Hand, win: Win, timing?: any): Promise<ScoredHand> {
    await this.getSession(code);
    const resolvedWin = await this.resolveWinPlayerIds(win);
    const scored = computeScoredHand(hand, resolvedWin);
    const names = await this.playerNames();
    await this.db.insert(schema.hands).values({
      sessionCode: code,
      timestamp: scored.timestamp,
      winner: names.get(scored.winner) ?? scored.winner,
      winnerId: scored.winner,
      method: scored.method,
      handValue: scored.handValue,
      appliedRules: scored.appliedRules as any,
      dealerBonus: scored.dealerBonus,
      melds: scored.melds as any,
      scores: scored.scores as any,
      timing: timing ?? null,
    });
    this.broadcast({ type: 'hands-changed' });
    return this.resolveHandNames(scored, names);
  }


  /**
   * Win arrives keyed by player ids. Ids retired by a merge (a phone can hold
   * one mid-entry) resolve through player_merges; anything else must exist.
   */
  private async resolveWinPlayerIds(win: Win): Promise<Win> {
    const merges = new Map(
      this.ctx.storage.sql.exec<{ old_id: string; new_id: string }>(
        `SELECT old_id, new_id FROM player_merges`
      ).toArray().map(r => [r.old_id, r.new_id])
    );
    const registry = new Set((await this.getPlayers()).map(p => p.id));
    const resolve = (id: string): string => {
      let cur = id;
      for (let hops = 0; hops < 5 && !registry.has(cur); hops++) {
        const next = merges.get(cur);
        if (!next) break;
        cur = next;
      }
      if (!registry.has(cur)) throw new Error(`Unknown player: ${id}`);
      return cur;
    };
    return {
      ...win,
      winner: resolve(win.winner),
      from: win.from ? resolve(win.from) : win.from,
      dealer: win.dealer ? resolve(win.dealer) : win.dealer,
      players: win.players.map(resolve) as Win['players'],
    };
  }

  private async playerNames(): Promise<Map<string, string>> {
    const players = await this.db.select().from(schema.players).all();
    return new Map(players.map(p => [p.id, p.name]));
  }

  /** Storage keys hands by player id; the API speaks display names. */
  private resolveHandNames(scored: ScoredHand, names: Map<string, string>): ScoredHand {
    return {
      ...scored,
      winner: names.get(scored.winner) ?? scored.winner,
      scores: Object.fromEntries(
        Object.entries(scored.scores).map(([id, v]) => [names.get(id) ?? id, v])
      ),
    };
  }

  async getAllHands(): Promise<ScoredHand[]> {
    const rows = await this.db.select().from(schema.hands).all();
    const names = await this.playerNames();
    return rows.map(r => rowToScoredHand(r, names));
  }

  async getSessionHands(code: string): Promise<ScoredHand[]> {
    const rows = await this.db.select().from(schema.hands).where(eq(schema.hands.sessionCode, code)).orderBy(sql`id DESC`).all();
    const names = await this.playerNames();
    return rows.map(r => rowToScoredHand(r, names));
  }

  async deleteHand(id: number): Promise<void> {
    await this.db.delete(schema.hands).where(eq(schema.hands.id, id));
    this.broadcast({ type: 'hands-changed' });
  }

  async hasScan(scanId: string): Promise<boolean> {
    const rows = this.ctx.storage.sql.exec(
      `SELECT 1 FROM hands WHERE timing LIKE ? LIMIT 1`, `%"scanId":"${scanId}"%`
    ).toArray();
    return rows.length > 0;
  }

  async getTimingStats() {
    const rows = this.ctx.storage.sql.exec<{ timing: string; melds: string }>(
      `SELECT timing, melds FROM hands WHERE timing IS NOT NULL ORDER BY id DESC LIMIT 200`
    ).toArray();
    return rows.map(r => ({ ...JSON.parse(r.timing), submittedMelds: JSON.parse(r.melds) })).filter(Boolean);
  }

  // --- Players ---

  async getPlayers() {
    return this.db.select().from(schema.players).all();
  }

  async searchPlayers(query: string) {
    const all = await this.db.select().from(schema.players).all();
    const q = query.toLowerCase();
    return all.filter(p => p.name.toLowerCase().includes(q));
  }

  async registerPlayer(name: string) {
    const id = generateId();
    const now = new Date().toISOString();
    await this.db.insert(schema.players).values({ id, name, createdAt: now });
    this.broadcast({ type: 'player-added', name });
    return { id, name, createdAt: now };
  }

  async renamePlayer(id: string, newName: string) {
    const old = await this.db.select().from(schema.players).where(eq(schema.players.id, id)).get();
    if (!old) throw new Error('Player not found');
    // Hands reference the id, so a rename is a single registry update.
    await this.db.update(schema.players).set({ name: newName }).where(eq(schema.players.id, id));
    this.broadcast({ type: 'hands-changed' });
    return { id, name: newName, createdAt: old.createdAt };
  }

  async deletePlayer(id: string): Promise<void> {
    const referenced = this.ctx.storage.sql.exec(
      `SELECT 1 FROM hands WHERE winner_id = ? OR scores LIKE ? LIMIT 1`, id, `%"${id}"%`
    ).toArray();
    if (referenced.length > 0) {
      throw new Error('Player has recorded hands — merge into another player instead');
    }
    await this.db.delete(schema.players).where(eq(schema.players.id, id));
  }

  async mergePlayers(keepId: string, mergeId: string): Promise<void> {
    const keep = await this.db.select().from(schema.players).where(eq(schema.players.id, keepId)).get();
    const merge = await this.db.select().from(schema.players).where(eq(schema.players.id, mergeId)).get();
    if (!keep || !merge) throw new Error('Player not found');
    const allHands = await this.db.select().from(schema.hands).all();
    for (const h of allHands) {
      const scores = h.scores as Record<string, number>;
      if (mergeId in scores || h.winnerId === mergeId) {
        const newScores: Record<string, number> = {};
        for (const [k, v] of Object.entries(scores)) {
          const key = k === mergeId ? keepId : k;
          newScores[key] = (newScores[key] ?? 0) + v;
        }
        await this.db.update(schema.hands).set({
          winnerId: h.winnerId === mergeId ? keepId : h.winnerId,
          scores: newScores as any,
        }).where(eq(schema.hands.id, h.id));
      }
    }
    // A phone can still hold the retired id mid-entry; keep it resolvable.
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO player_merges (old_id, new_id) VALUES (?, ?)`, mergeId, keepId
    );
    this.ctx.storage.sql.exec(
      `UPDATE player_merges SET new_id = ? WHERE new_id = ?`, keepId, mergeId
    );
    await this.db.delete(schema.players).where(eq(schema.players.id, mergeId));
    this.broadcast({ type: 'hands-changed' });
  }

  // --- WebSocket ---

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async webSocketMessage(_ws: WebSocket, _message: string | ArrayBuffer) {}
  async webSocketClose(ws: WebSocket, code: number, reason: string) { ws.close(code, reason); }


  // --- Helpers ---

  private broadcast(message: object) {
    const data = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(data); } catch {}
    }
  }
}

function rowToScoredHand(row: any, names: Map<string, string>): ScoredHand & { id?: number } {
  // Post-migration rows key players by id; resolve to current display names.
  // Unknown ids (or legacy name keys) pass through as-is.
  const resolve = (key: string) => names.get(key) ?? key;
  const scores = row.scores as Record<string, number>;
  return {
    id: row.id,
    timestamp: row.timestamp,
    winner: row.winnerId ? resolve(row.winnerId) : row.winner,
    method: row.method,
    handValue: row.handValue,
    appliedRules: row.appliedRules as any,
    dealerBonus: row.dealerBonus,
    melds: row.melds as any,
    scores: Object.fromEntries(Object.entries(scores).map(([k, v]) => [resolve(k), v])),
    scanId: (row.timing as any)?.scanId ?? undefined,
  };
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}
