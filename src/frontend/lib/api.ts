import { getBackend } from './backend.ts';

export function authenticate(password: string) { return getBackend().authenticate(password); }
export function createSession() { return getBackend().createSession(); }
export function getSession(code: string) { return getBackend().getSession(code); }
export function scoreHand(code: string, hand: any, win: any, timing?: any) { return getBackend().scoreHand(code, hand, win, timing); }
export function getAllHands() { return getBackend().getAllHands(); }
export function getSessionHands(code: string) { return getBackend().getSessionHands(code); }
export function getPlayers() { return getBackend().getPlayers(); }
export function registerPlayer(name: string) { return getBackend().registerPlayer(name); }
export function connectWebSocket(code: string, onMessage: (data: any) => void) { return getBackend().connectWebSocket(code, onMessage); }
