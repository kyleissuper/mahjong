import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setBackend } from './lib/backend.ts';
import { HttpBackend } from './lib/http-backend.ts';

setBackend(new HttpBackend());

(window as any).__scoreDemo = async () => {
  try {
    const code = localStorage.getItem('mj-code');
    if (!code) { console.error('No session. mj-code =', code); return; }
    console.log('Session code:', code);
    const { players } = await new HttpBackend().getPlayers();
    const names = players.map((p: any) => p.name);
    console.log('Players:', names);
    if (names.length < 2) { console.error('Need at least 2 registered players, have:', names.length); return; }
    const hand = { melds: [
      { type: 'chow', tiles: ['1b','2b','3b'], concealed: true },
      { type: 'chow', tiles: ['4d','5d','6d'], concealed: true },
      { type: 'pong', tiles: ['Rd','Rd','Rd'], concealed: false, winTile: 'Rd' },
      { type: 'pong', tiles: ['Ew','Ew','Ew'], concealed: true },
      { type: 'pair', tiles: ['9c','9c'], concealed: true },
    ]};
    const win = {
      players: [names[0], names[1], names[0], names[1]] as [string,string,string,string],
      winner: names[0], method: 'discard' as const, from: names[1],
      dealerRounds: 1, special: [] as any[],
    };
    console.log('Scoring hand...');
    const res = await new HttpBackend().scoreHand(code, hand, win);
    console.log('Done! Hand value:', res.hand.handValue);
    (window as any).__onScoreDemoComplete?.(res.hand.timestamp);
  } catch (e: any) {
    console.error('__demoHand failed:', e.message);
  }
};
import { SessionProvider, useSession } from './lib/session-context.tsx';
import { Landing } from './components/Landing.tsx';
import { SessionView } from './components/SessionView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { Scorer } from './components/Scorer.tsx';

function Root() {
  if (new URLSearchParams(location.search).has('standalone')) return <Scorer />;
  const isAdmin = !!localStorage.getItem('mj-admin-token');
  const { loading, session } = useSession();
  if (loading) return null;
  if (isAdmin && !session) return <AdminDashboard />;
  return session ? <SessionView /> : <Landing />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <Root />
    </SessionProvider>
  </StrictMode>,
);
