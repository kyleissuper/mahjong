import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session } from '../../mahjong/session.ts';
import * as api from './api.ts';

interface SessionContextValue {
  loading: boolean;
  session: Session | null;
  code: string | null;
  /** Bumps whenever hands changed server-side (or the socket reconnected). */
  handsVersion: number;
  join: (code: string) => Promise<void>;
  create: () => Promise<string>;
  refresh: () => Promise<void>;
  leave: () => void;
  updateSession: (session: Session) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [code, setCode] = useState<string | null>(() => localStorage.getItem('mj-code'));
  const [loading, setLoading] = useState(() =>
    !!localStorage.getItem('mj-code') || new URLSearchParams(location.search).has('code'));

  useEffect(() => {
    const stored = localStorage.getItem('mj-code');
    const urlCode = new URLSearchParams(location.search).get('code')?.toUpperCase() || null;
    if (!stored && !urlCode) return;

    (async () => {
      if (urlCode) {
        try {
          const s = await api.getSession(urlCode);
          history.replaceState(null, '', location.pathname);
          setSession(s);
          setCode(urlCode);
          localStorage.setItem('mj-code', urlCode);
          return;
        } catch {
          // Invalid link: fall back to the stored session. Without one, the
          // param is left in place so Landing's auto-join surfaces the error.
        }
      }
      if (!stored) return;
      try {
        setSession(await api.getSession(stored));
      } catch {
        setCode(null);
        localStorage.removeItem('mj-code');
      }
    })().finally(() => setLoading(false));
  }, []);

  const [handsVersion, setHandsVersion] = useState(0);

  useEffect(() => {
    if (!code) return;
    let stopped = false;
    let ws: { close(): void } | null = null;
    let timer: ReturnType<typeof setTimeout>;

    const connect = (isReconnect: boolean) => {
      ws = api.connectWebSocket(code, (data) => {
        if (data.type === 'expired') {
          setSession(s => s ? { ...s, expired: true } as Session : null);
        }
        if (data.type === 'hands-changed') {
          setHandsVersion(v => v + 1);
        }
      });
      // Anything could have happened while the socket was down.
      if (isReconnect) setHandsVersion(v => v + 1);
      const raw = ws as unknown as WebSocket;
      if (typeof raw.addEventListener === 'function') {
        raw.addEventListener('close', () => {
          if (!stopped) timer = setTimeout(() => connect(true), 3000);
        });
      }
    };
    connect(false);
    return () => { stopped = true; clearTimeout(timer); ws?.close(); };
  }, [code]);

  const join = useCallback(async (joinCode: string) => {
    const s = await api.getSession(joinCode);
    setSession(s);
    setCode(joinCode);
    localStorage.setItem('mj-code', joinCode);
  }, []);

  const create = useCallback(async () => {
    const { code: newCode } = await api.createSession();
    const s = await api.getSession(newCode);
    setSession(s);
    setCode(newCode);
    localStorage.setItem('mj-code', newCode);
    return newCode;
  }, []);

  const refresh = useCallback(async () => {
    if (!code) return;
    const s = await api.getSession(code);
    setSession(s);
  }, [code]);

  const leave = useCallback(() => {
    setSession(null);
    setCode(null);
    localStorage.removeItem('mj-code');
  }, []);

  return (
    <SessionContext.Provider value={{ loading, session, code, handsVersion, join, create, refresh, leave, updateSession: setSession }}>
      {children}
    </SessionContext.Provider>
  );
}
