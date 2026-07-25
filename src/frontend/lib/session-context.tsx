import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session } from '../../mahjong/session.ts';
import * as api from './api.ts';

interface SessionContextValue {
  loading: boolean;
  session: Session | null;
  code: string | null;
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
  const [loading, setLoading] = useState(() => !!localStorage.getItem('mj-code'));

  useEffect(() => {
    if (!code) return;
    api.getSession(code)
      .then(s => setSession(s))
      .catch(() => { setCode(null); localStorage.removeItem('mj-code'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!code) return;
    const ws = api.connectWebSocket(code, (data) => {
      if (data.type === 'expired') {
        setSession(null);
        setCode(null);
        localStorage.removeItem('mj-code');
      }
    });
    return () => ws.close();
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
    <SessionContext.Provider value={{ loading, session, code, join, create, refresh, leave, updateSession: setSession }}>
      {children}
    </SessionContext.Provider>
  );
}
