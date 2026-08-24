import type { Backend } from './backend.ts';
import { createSession, computeScoredHand, type Session, type ScoredHand } from '../../mahjong/session.ts';
import { registerPlayer, createRegistry, findPlayerByName, type PlayerRegistry, type RegisteredPlayer } from '../../mahjong/player-registry.ts';
import type { Hand, Win } from '../../mahjong/types.ts';

export class MemoryBackend implements Backend {
  sessions = new Map<string, Session>();
  hands: (ScoredHand & { sessionCode: string })[] = [];
  registry: PlayerRegistry = createRegistry();
  adminPassword: string;

  constructor(adminPassword = 'test-password') {
    this.adminPassword = adminPassword;
  }

  async authenticate(password: string): Promise<string> {
    if (password !== this.adminPassword) throw new Error('Unauthorized');
    return 'test-token';
  }

  async createSession(): Promise<{ code: string }> {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const session = createSession(code);
    this.sessions.set(code, session);
    return { code };
  }

  async getSession(code: string): Promise<Session> {
    const s = this.sessions.get(code);
    if (!s) throw new Error('Session not found');
    return s;
  }

  async scoreHand(code: string, hand: Hand, win: Win): Promise<{ hand: ScoredHand }> {
    await this.getSession(code);
    const scored = computeScoredHand(hand, win);
    this.hands.push({ ...scored, sessionCode: code });
    return { hand: scored };
  }

  // Like the real backend, hands are keyed by player id at write time and
  // resolved to display names at read time. Keys that aren't registry ids
  // (test fixtures inserted with plain names) pass through unchanged.
  private resolveNames(h: ScoredHand): ScoredHand {
    const names = new Map(this.registry.players.map(p => [p.id, p.name]));
    const resolve = (key: string) => names.get(key) ?? key;
    return {
      ...h,
      winner: resolve(h.winner),
      scores: Object.fromEntries(Object.entries(h.scores).map(([k, v]) => [resolve(k), v])),
    };
  }

  async getAllHands(): Promise<{ hands: ScoredHand[] }> {
    return { hands: this.hands.map(h => this.resolveNames(h)) };
  }

  async getSessionHands(code: string): Promise<{ hands: ScoredHand[] }> {
    return { hands: this.hands.filter(h => h.sessionCode === code).map(h => this.resolveNames(h)) };
  }

  async getPlayers(): Promise<{ players: RegisteredPlayer[] }> {
    return { players: this.registry.players };
  }

  async searchPlayers(query: string): Promise<{ players: RegisteredPlayer[] }> {
    const q = query.toLowerCase();
    return { players: this.registry.players.filter(p => p.name.toLowerCase().includes(q)) };
  }

  async registerPlayer(name: string): Promise<{ player: RegisteredPlayer }> {
    this.registry = registerPlayer(this.registry, name);
    return { player: findPlayerByName(this.registry, name)! };
  }

  private wsListeners: ((data: any) => void)[] = [];

  connectWebSocket(_code: string, onMessage: (data: any) => void): { close(): void } {
    this.wsListeners.push(onMessage);
    return { close: () => { this.wsListeners = this.wsListeners.filter(l => l !== onMessage); } };
  }

  broadcastWs(data: any) {
    for (const listener of this.wsListeners) listener(data);
  }

  // --- Test helpers ---

  addSession(code: string, session?: Partial<Session>) {
    this.sessions.set(code, { ...createSession(code), ...session });
  }

  addPlayer(name: string) {
    if (!findPlayerByName(this.registry, name)) {
      this.registry = registerPlayer(this.registry, name);
    }
  }

  addHand(code: string, hand: ScoredHand) {
    this.hands.push({ ...hand, sessionCode: code });
  }
}
