import { DurableObject } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/durable-sqlite';
import { eq, sql } from 'drizzle-orm';
import * as schema from './schema.ts';
import { computeScoredHand, type ScoredHand } from '../mahjong/session.ts';
import type { Hand, Win } from '../mahjong/types.ts';

interface Env {
  APP: DurableObjectNamespace<AppDO>;
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
    });
  }

  // --- Sessions ---

  async createSession(code: string): Promise<void> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await this.db.insert(schema.sessions).values({ code, createdAt: now, expiresAt, expired: false });
    await this.ctx.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1000);
  }

  async getSession(code: string) {
    const row = await this.db.select().from(schema.sessions).where(eq(schema.sessions.code, code)).get();
    if (!row) throw new Error('Session not found');
    if (row.expired) throw new Error('Session expired');
    return row;
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
  }

  async extendSession(code: string, hours: number): Promise<void> {
    const session = await this.db.select().from(schema.sessions).where(eq(schema.sessions.code, code)).get();
    if (!session) throw new Error('Session not found');
    const currentExpiry = new Date(session.expiresAt).getTime();
    const base = Number.isNaN(currentExpiry) || currentExpiry < Date.now() ? Date.now() : currentExpiry;
    const newExpiry = base + hours * 60 * 60 * 1000;
    const expiresAt = new Date(newExpiry).toISOString();
    await this.db.update(schema.sessions).set({ expired: false, expiresAt }).where(eq(schema.sessions.code, code));
    await this.ctx.storage.setAlarm(newExpiry);
  }

  async deleteSession(code: string): Promise<void> {
    await this.db.delete(schema.hands).where(eq(schema.hands.sessionCode, code));
    await this.db.delete(schema.sessions).where(eq(schema.sessions.code, code));
    this.broadcast({ type: 'expired' });
  }

  // --- Hands ---

  async scoreHand(code: string, hand: Hand, win: Win, timing?: any): Promise<ScoredHand> {
    await this.getSession(code);
    const scored = computeScoredHand(hand, win);
    await this.db.insert(schema.hands).values({
      sessionCode: code,
      timestamp: scored.timestamp,
      winner: scored.winner,
      method: scored.method,
      handValue: scored.handValue,
      appliedRules: scored.appliedRules as any,
      dealerBonus: scored.dealerBonus,
      melds: scored.melds as any,
      scores: scored.scores as any,
      timing: timing ?? null,
    });
    return scored;
  }

  async getAllHands(): Promise<ScoredHand[]> {
    const rows = await this.db.select().from(schema.hands).all();
    return rows.map(rowToScoredHand);
  }

  async getSessionHands(code: string): Promise<ScoredHand[]> {
    const rows = await this.db.select().from(schema.hands).where(eq(schema.hands.sessionCode, code)).orderBy(sql`id DESC`).all();
    return rows.map(rowToScoredHand);
  }

  async deleteHand(id: number): Promise<void> {
    await this.db.delete(schema.hands).where(eq(schema.hands.id, id));
  }

  async getTimingStats() {
    const rows = this.ctx.storage.sql.exec<{ timing: string }>(
      `SELECT timing FROM hands WHERE timing IS NOT NULL ORDER BY id DESC LIMIT 200`
    ).toArray();
    return rows.map(r => JSON.parse(r.timing)).filter(Boolean);
  }

  // --- Players ---

  async getPlayers() {
    return this.db.select().from(schema.players).all();
  }

  async registerPlayer(name: string) {
    const id = generateId();
    const now = new Date().toISOString();
    await this.db.insert(schema.players).values({ id, name, createdAt: now });
    return { id, name, createdAt: now };
  }

  async renamePlayer(id: string, newName: string) {
    const old = await this.db.select().from(schema.players).where(eq(schema.players.id, id)).get();
    if (!old) throw new Error('Player not found');
    await this.db.update(schema.players).set({ name: newName }).where(eq(schema.players.id, id));
    // Update all hands referencing old name
    const allHands = await this.db.select().from(schema.hands).all();
    for (const h of allHands) {
      const scores = h.scores as Record<string, number>;
      if (old.name in scores || h.winner === old.name) {
        const newScores = Object.fromEntries(
          Object.entries(scores).map(([k, v]) => [k === old.name ? newName : k, v])
        );
        await this.db.update(schema.hands).set({
          winner: h.winner === old.name ? newName : h.winner,
          scores: newScores as any,
        }).where(eq(schema.hands.id, h.id));
      }
    }
    return { id, name: newName, createdAt: old.createdAt };
  }

  async deletePlayer(id: string): Promise<void> {
    await this.db.delete(schema.players).where(eq(schema.players.id, id));
  }

  async mergePlayers(keepId: string, mergeId: string): Promise<void> {
    const keep = await this.db.select().from(schema.players).where(eq(schema.players.id, keepId)).get();
    const merge = await this.db.select().from(schema.players).where(eq(schema.players.id, mergeId)).get();
    if (!keep || !merge) throw new Error('Player not found');
    await this.renamePlayer(mergeId, keep.name);
    await this.deletePlayer(mergeId);
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

  async alarm(): Promise<void> {
    // Expire all sessions past their alarm
    // For now, this is a simple approach since we have one DO
  }

  // --- Helpers ---

  private broadcast(message: object) {
    const data = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(data); } catch {}
    }
  }
}

function rowToScoredHand(row: any): ScoredHand & { id?: number } {
  return {
    id: row.id,
    timestamp: row.timestamp,
    winner: row.winner,
    method: row.method,
    handValue: row.handValue,
    appliedRules: row.appliedRules as any,
    dealerBonus: row.dealerBonus,
    melds: row.melds as any,
    scores: row.scores as any,
  };
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}
