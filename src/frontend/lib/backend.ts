import type { Session, ScoredHand } from '../../mahjong/session.ts';
import type { Hand, Win } from '../../mahjong/types.ts';
import type { RegisteredPlayer } from '../../mahjong/player-registry.ts';

export interface Backend {
  authenticate(password: string): Promise<string>;
  createSession(): Promise<{ code: string }>;
  getSession(code: string): Promise<Session>;
  scoreHand(code: string, hand: Hand, win: Win, timing?: any): Promise<{ hand: ScoredHand }>;
  getAllHands(): Promise<{ hands: ScoredHand[] }>;
  getSessionHands(code: string): Promise<{ hands: ScoredHand[] }>;
  getPlayers(): Promise<{ players: RegisteredPlayer[] }>;
  registerPlayer(name: string): Promise<{ player: RegisteredPlayer }>;
  connectWebSocket(code: string, onMessage: (data: any) => void): { close(): void };
}

let current: Backend;

export function setBackend(b: Backend) { current = b; }
export function getBackend(): Backend { return current; }
