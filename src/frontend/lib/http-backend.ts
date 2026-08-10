import type { Backend } from './backend.ts';
import type { Session } from '../../mahjong/session.ts';
import type { Hand, Win } from '../../mahjong/types.ts';
import type { RegisteredPlayer } from '../../mahjong/player-registry.ts';

export class HttpBackend implements Backend {
  async authenticate(password: string): Promise<string> {
    const { token } = await this.post<{ token: string }>('/api/auth', { password });
    return token;
  }

  async createSession(): Promise<{ code: string }> {
    return this.postAdmin<{ code: string }>('/api/sessions', {});
  }

  async getSession(code: string): Promise<Session> {
    return this.get<Session>(`/api/sessions/${code}`);
  }

  async scoreHand(code: string, hand: Hand, win: Win, timing?: any): Promise<{ hand: any }> {
    return this.post<{ hand: any }>(`/api/sessions/${code}/hands`, { hand, win, timing });
  }

  async getAllHands(): Promise<{ hands: any[] }> {
    return this.get<{ hands: any[] }>('/api/hands');
  }

  async getSessionHands(code: string): Promise<{ hands: any[] }> {
    return this.get<{ hands: any[] }>(`/api/sessions/${code}/hands`);
  }

  async getPlayers(): Promise<{ players: RegisteredPlayer[] }> {
    return this.get<{ players: RegisteredPlayer[] }>('/api/players');
  }

  async searchPlayers(query: string): Promise<{ players: RegisteredPlayer[] }> {
    return this.get<{ players: RegisteredPlayer[] }>(`/api/players?q=${encodeURIComponent(query)}`);
  }

  async registerPlayer(name: string): Promise<{ player: RegisteredPlayer }> {
    return this.post<{ player: RegisteredPlayer }>('/api/players', { name });
  }

  connectWebSocket(code: string, onMessage: (data: any) => void): { close(): void } {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/api/sessions/${code}`);
    ws.addEventListener('message', (e) => onMessage(JSON.parse(e.data)));
    return ws;
  }

  // --- Helpers ---

  private async get<T>(url: string): Promise<T> {
    const res = await fetch(url);
    const body = await res.json() as T & { error?: string };
    if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
    return body;
  }

  private async post<T>(url: string, data: unknown): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json() as T & { error?: string };
    if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
    return body;
  }

  private adminHeaders(): Record<string, string> {
    const token = localStorage.getItem('mj-admin-token');
    return token ? { 'x-admin-token': token } : {};
  }

  private async postAdmin<T>(url: string, data: unknown): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...this.adminHeaders() },
      body: JSON.stringify(data),
    });
    const body = await res.json() as T & { error?: string };
    if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
    return body;
  }
}
