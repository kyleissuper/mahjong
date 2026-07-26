import { useState, useEffect, useRef } from 'react';
import { useSession } from '../lib/session-context.tsx';
import * as api from '../lib/api.ts';
import '../styles/scorer.css';

export function Landing() {
  const { join } = useSession();
  const [showAdmin, setShowAdmin] = useState(false);
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('code') ?? '').toUpperCase();
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoJoined = useRef(false);

  useEffect(() => {
    if (autoJoined.current || !code) return;
    autoJoined.current = true;
    setLoading(true);
    history.replaceState(null, '', location.pathname);
    join(code)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to join'))
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await join(code.trim().toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setError(null);
    setLoading(true);
    try {
      const token = await api.authenticate(password);
      localStorage.setItem('mj-admin-token', token);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wrong password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing">
      <div className="landing-card">
        <h1 className="landing-title">Mahjong Scorer</h1>
        <span className="ref-footer-badge">beta</span>

        {!showAdmin ? (
          <form className="landing-form" onSubmit={handleJoin}>
            <input className="landing-input" type="text" placeholder="Session code"
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={6} autoFocus />
            {error && <p className="landing-error">{error}</p>}
            <button className="scorer-btn scorer-btn-primary landing-btn" type="submit" disabled={loading}>
              {loading ? 'Joining...' : 'Join'}
            </button>
            <button className="scorer-btn landing-btn" type="button"
              onClick={() => { location.search = 'standalone'; }}>
              Try without a session
            </button>
            <div className="landing-divider" />
            <button className="landing-admin-link" type="button" onClick={() => { setShowAdmin(true); setError(null); }}>Admin</button>
          </form>
        ) : (
          <form className="landing-form" onSubmit={handleAdminLogin}>
            <input className="landing-input" type="password" placeholder="Admin password"
              value={password} onChange={e => setPassword(e.target.value)} autoFocus />
            {error && <p className="landing-error">{error}</p>}
            <button className="scorer-btn scorer-btn-primary landing-btn" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
            <button className="scorer-btn-text" type="button" onClick={() => { setShowAdmin(false); setError(null); }}>Back</button>
          </form>
        )}
      </div>
    </div>
  );
}
