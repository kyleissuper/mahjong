import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, useEffect } from 'react';
import { SWRConfig } from 'swr';
import { setBackend } from '../src/frontend/lib/backend.ts';
import { MemoryBackend } from '../src/frontend/lib/memory-backend.ts';
import { SessionProvider, useSession } from '../src/frontend/lib/session-context.tsx';
import { SessionView } from '../src/frontend/components/SessionView.tsx';
import { Scorer } from '../src/frontend/components/Scorer.tsx';
import { computeScoredHand } from '../src/mahjong/session.ts';
import type { Meld, Win } from '../src/mahjong/types.ts';

let backend: MemoryBackend;
const user = userEvent.setup();

beforeEach(() => {
  backend = new MemoryBackend();
  setBackend(backend);
});

afterEach(cleanup);

// --- Hand fixtures ---

const dragonPongMelds: Meld[] = [
  { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
  { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
  { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
  { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '8d' },
  { type: 'pair', tiles: ['5b', '5b'], concealed: true },
];

function discardWin(winner: string, from: string, dealer: string, dealerRounds = 1): Win {
  return {
    players: [winner, from, winner, from],
    winner, from, method: 'discard',
    dealer, dealerRounds, special: [],
  };
}

// --- Rendering helpers ---

function renderScorer(roster: string[]) {
  render(<Scorer roster={roster} sessionCode="TEST1" />);
}

function AutoJoinSession({ code }: { code: string }) {
  const { join, session } = useSession();
  const [joined, setJoined] = useState(false);
  useEffect(() => {
    if (!joined) { join(code).then(() => setJoined(true)); }
  }, []);
  if (!session) return null;
  return <SessionView />;
}

async function renderSessionView(code: string) {
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <SessionProvider>
        <AutoJoinSession code={code} />
      </SessionProvider>
    </SWRConfig>
  );

  await waitFor(() => {
    expect(document.querySelector('.scorer') ?? document.querySelector('.session-view')).toBeTruthy();
  });
}

// --- UI interaction DSL ---

async function enterMeld(tiles: string[], concealed: boolean) {
  const row = concealed ? 'Concealed' : 'Exposed';
  const plus = screen.getAllByText('+').find(el =>
    el.closest('.scorer-row')?.textContent?.includes(row)
  );
  await user.click(plus!);
  for (const t of tiles) {
    await user.click(screen.getByLabelText(t));
  }
}

async function scoreAndPickWin(winTileAlt: string) {
  await user.click(screen.getByText('Score →'));
  const imgs = screen.getAllByAltText(winTileAlt);
  const pickable = imgs.find(img => img.closest('.tile-pickable'));
  await user.click(pickable!.closest('.tile-pickable')!);
}

async function pickCombo(label: string, value: string) {
  const row = (screen.getByText(label).closest('.scorer-step-row') ??
    screen.getByText(label).closest('.scorer-step-group')) as HTMLElement;
  const input = within(row).getByRole('textbox');
  await user.click(input);
  await user.type(input, value);
  const option = await within(row).findByText(value);
  await user.click(option);
}

async function pickComboNth(container: HTMLElement, index: number, value: string) {
  const inputs = within(container).getAllByRole('textbox');
  await user.click(inputs[index]);
  await user.type(inputs[index], value);
  const options = await within(container).findAllByText(value);
  await user.click(options[options.length - 1]);
}

async function setWinContext(opts: {
  method?: string; winner: string; loser?: string;
  otherPlayers?: string[]; dealer: string; dealerRounds?: number;
}) {
  if (opts.method) {
    await user.click(screen.getByText(opts.method));
  }

  await pickCombo('Winner', opts.winner);

  if (opts.otherPlayers) {
    const group = screen.getByText('Other players').closest('.scorer-step-group') as HTMLElement;
    for (let i = 0; i < opts.otherPlayers.length; i++) {
      await pickComboNth(group, i, opts.otherPlayers[i]);
    }
  } else if (opts.loser) {
    await pickCombo('Discarder', opts.loser);
  }

  await user.click(screen.getByText(opts.dealer).closest('.scorer-dealer-option')!);

  if (opts.dealerRounds && opts.dealerRounds > 1) {
    const stepper = screen.getAllByText('+').find(el => el.closest('.scorer-stepper'));
    for (let i = 1; i < opts.dealerRounds; i++) {
      await user.click(stepper!);
    }
  }
}

async function navigateToTab(tabName: string) {
  const hamburger = document.querySelector('[aria-label="Menu"]');
  if (hamburger) await user.click(hamburger);
  const item = await screen.findByText(tabName);
  await user.click(item);
  await new Promise(r => setTimeout(r, 300));
}

function scoreSessionHands(code: string, hands: { melds: Meld[]; win: Win }[]) {
  for (const h of hands) {
    const scored = computeScoredHand({ melds: h.melds }, h.win);
    backend.addHand(code, scored);
  }
}

// --- Tests ---

describe('Scoring a hand via UI', () => {
  it('transfers points from discarder to winner', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');
    renderScorer(['Kyle', 'Ming']);

    await enterMeld(['Rd', 'Rd', 'Rd'], false);
    await enterMeld(['1b', '2b', '3b'], true);
    await enterMeld(['4b', '5b', '6b'], true);
    await enterMeld(['7d', '8d', '9d'], true);
    await enterMeld(['5b', '5b'], true);

    await scoreAndPickWin('8 Dots');
    await setWinContext({ winner: 'Kyle', loser: 'Ming', dealer: 'Ming' });

    const hero = [...document.querySelectorAll('.scorer-hero-player')];
    const kyleScore = hero.find(el => el.textContent?.includes('Kyle'));
    const mingScore = hero.find(el => el.textContent?.includes('Ming'));
    expect(kyleScore?.textContent).toMatch(/\+/);
    expect(mingScore?.textContent).toMatch(/-/);
  });

  it('points sum to zero', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');
    renderScorer(['Kyle', 'Ming']);

    await enterMeld(['Rd', 'Rd', 'Rd'], false);
    await enterMeld(['1b', '2b', '3b'], true);
    await enterMeld(['4b', '5b', '6b'], true);
    await enterMeld(['7d', '8d', '9d'], true);
    await enterMeld(['5b', '5b'], true);

    await scoreAndPickWin('8 Dots');
    await setWinContext({ winner: 'Kyle', loser: 'Ming', dealer: 'Ming' });

    const deltas = [...document.querySelectorAll('.scorer-hero-delta')];
    const total = deltas.reduce((sum, el) => sum + parseInt(el.textContent ?? '0'), 0);
    expect(total).toBe(0);
  });

  it('shows dealer bonus in breakdown', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');
    renderScorer(['Kyle', 'Ming']);

    await enterMeld(['Rd', 'Rd', 'Rd'], false);
    await enterMeld(['1b', '2b', '3b'], true);
    await enterMeld(['4b', '5b', '6b'], true);
    await enterMeld(['7d', '8d', '9d'], true);
    await enterMeld(['5b', '5b'], true);

    await scoreAndPickWin('8 Dots');
    await setWinContext({ winner: 'Kyle', loser: 'Ming', dealer: 'Ming' });

    expect(screen.getByText('Dealer')).toBeDefined();
    expect(screen.getByText(/per payment/)).toBeDefined();
  });

  it('prevents selecting same player as winner and discarder', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    renderScorer(['Kyle']);

    await enterMeld(['Rd', 'Rd', 'Rd'], false);
    await enterMeld(['1b', '2b', '3b'], true);
    await enterMeld(['4b', '5b', '6b'], true);
    await enterMeld(['7d', '8d', '9d'], true);
    await enterMeld(['5b', '5b'], true);

    await scoreAndPickWin('8 Dots');
    await pickCombo('Winner', 'Kyle');

    const discarderRow = screen.getByText('Discarder').closest('.scorer-step-row') as HTMLElement;
    const input = within(discarderRow).getByRole('textbox');
    await user.click(input);
    expect(within(discarderRow).queryByText('Kyle')).toBeNull();
  });
});

describe('Hands view', () => {
  it('sorts by max points earned when no player filter', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');
    backend.addPlayer('Sarah');

    scoreSessionHands('TEST1', [
      { melds: dragonPongMelds, win: discardWin('Kyle', 'Ming', 'Ming') },
      { melds: dragonPongMelds, win: discardWin('Sarah', 'Ming', 'Ming', 2) },
    ]);

    await renderSessionView('TEST1');
    await navigateToTab('Hands');

    await waitFor(() => {
      const cards = [...document.querySelectorAll('.hcard-winner')];
      expect(cards.length).toBeGreaterThanOrEqual(2);
      // Sarah's hand should be first (higher dealer bonus = more points)
      expect(cards[0].textContent).toContain('Sarah');
      expect(cards[1].textContent).toContain('Kyle');
    });
  });

  it('sorts by filtered player points when player filter is active', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');
    backend.addPlayer('Sarah');

    scoreSessionHands('TEST1', [
      { melds: dragonPongMelds, win: discardWin('Kyle', 'Ming', 'Ming') },
      { melds: dragonPongMelds, win: discardWin('Sarah', 'Kyle', 'Kyle') },
    ]);

    await renderSessionView('TEST1');
    await navigateToTab('Hands');

    // Filter by Kyle
    const filterInput = document.querySelector('.history-filters .combo-input') as HTMLElement;
    await user.click(filterInput);
    await user.type(filterInput, 'Kyle');
    const option = await screen.findByText('Kyle');
    await user.click(option);

    await waitFor(() => {
      const cards = [...document.querySelectorAll('.hcard-winner')];
      expect(cards.length).toBe(2);
      // Kyle won hand 1 (+pts), Kyle lost hand 2 (-pts) — winner first
      expect(cards[0].textContent).toContain('Kyle');
      expect(cards[1].textContent).toContain('Sarah');
    });
  });
});

describe('Leaderboard', () => {
  it('ranks players by total points', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');
    backend.addPlayer('Sarah');

    scoreSessionHands('TEST1', [
      { melds: dragonPongMelds, win: discardWin('Kyle', 'Ming', 'Ming') },
      { melds: dragonPongMelds, win: discardWin('Kyle', 'Sarah', 'Sarah') },
    ]);

    await renderSessionView('TEST1');
    await navigateToTab('Leaderboard');

    await waitFor(() => {
      const names = [...document.querySelectorAll('.leaderboard-name')].map(el => el.textContent);
      expect(names[0]).toBe('Kyle');
    });
  });

  it('shows no rounds played yet when empty', async () => {
    backend.addSession('TEST1');
    await renderSessionView('TEST1');
    await navigateToTab('Leaderboard');

    await waitFor(() => {
      expect(screen.getByText('No rounds played yet')).toBeDefined();
    });
  });
});

describe('Player dropdown ordering', () => {
  it('sorts recently active players first in scorer dropdowns', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');
    backend.addPlayer('Sarah');

    // Score a hand involving Sarah and Ming only
    scoreSessionHands('TEST1', [
      { melds: dragonPongMelds, win: discardWin('Sarah', 'Ming', 'Ming') },
    ]);

    await renderSessionView('TEST1');

    // Enter melds to reach the scoring phase where winner dropdown appears
    await enterMeld(['Rd', 'Rd', 'Rd'], false);
    await enterMeld(['1b', '2b', '3b'], true);
    await enterMeld(['4b', '5b', '6b'], true);
    await enterMeld(['7d', '8d', '9d'], true);
    await enterMeld(['5b', '5b'], true);
    await scoreAndPickWin('8 Dots');

    // Open the winner combo
    const winnerRow = screen.getByText('Winner').closest('.scorer-step-row') as HTMLElement;
    const input = within(winnerRow).getByRole('textbox');
    await user.click(input);

    // Wait for server-side search results to load
    await waitFor(() => {
      const opts = [...document.querySelectorAll('.combo-option')]
        .map(el => el.textContent)
        .filter(t => t && t !== '+ Add player');
      expect(opts.length).toBeGreaterThanOrEqual(3);
    });

    const options = [...document.querySelectorAll('.combo-option')]
      .map(el => el.textContent)
      .filter(t => t && t !== '+ Add player');

    // Sarah and Ming should appear before Kyle (they were in the recent hand)
    const sarahIdx = options.indexOf('Sarah');
    const mingIdx = options.indexOf('Ming');
    const kyleIdx = options.indexOf('Kyle');
    expect(sarahIdx).toBeLessThan(kyleIdx);
    expect(mingIdx).toBeLessThan(kyleIdx);
  });
});

describe('Self-pick scoring', () => {
  it('collects from all other players', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');
    backend.addPlayer('Sarah');
    backend.addPlayer('Jun');
    renderScorer(['Kyle', 'Ming', 'Sarah', 'Jun']);

    await enterMeld(['2b', '3b', '4b'], false);
    await enterMeld(['5b', '6b', '7b'], true);
    await enterMeld(['2d', '3d', '4d'], false);
    await enterMeld(['5d', '6d', '7d'], true);
    await enterMeld(['8b', '8b'], true);

    await scoreAndPickWin('8 Bamboo');

    await user.click(screen.getByText('self-pick'));
    await pickCombo('Winner', 'Kyle');

    const group = screen.getByText('Other players').closest('.scorer-step-group') as HTMLElement;
    await pickComboNth(group, 0, 'Ming');
    await pickComboNth(group, 1, 'Sarah');
    await pickComboNth(group, 2, 'Jun');

    await user.click(screen.getByText('Ming').closest('.scorer-dealer-option')!);

    const hero = [...document.querySelectorAll('.scorer-hero-player')];
    const kyle = hero.find(el => el.textContent?.includes('Kyle'));
    expect(kyle?.textContent).toMatch(/\+/);

    const deltas = [...document.querySelectorAll('.scorer-hero-delta')];
    const total = deltas.reduce((sum, el) => sum + parseInt(el.textContent ?? '0'), 0);
    expect(total).toBe(0);
  });
});

describe('Session expiry', () => {
  it('shows read-only leaderboard when session expires', async () => {
    backend.addSession('TEST1');

    await renderSessionView('TEST1');

    // Verify we're in the session view
    expect(document.querySelector('.scorer')).toBeTruthy();

    // Simulate session expiry via WebSocket
    await act(async () => {
      backend.broadcastWs({ type: 'expired' });
    });

    // Session view stays mounted but switches to the read-only leaderboard
    await waitFor(() => {
      expect(document.querySelector('.leaderboard')).toBeTruthy();
    });
    expect(document.querySelector('.session-view')).toBeTruthy();

    // Scoring is no longer offered: no score-hand FAB for expired sessions
    expect(document.querySelector('.fab')).toBeNull();
  });
});

describe('Live updates', () => {
  it('leaderboard picks up a hand scored on another device', async () => {
    backend.addSession('TEST1');

    await renderSessionView('TEST1');
    await navigateToTab('Leaderboard');
    expect(screen.getByText('No rounds played yet')).toBeDefined();

    // Another device scores a hand: data appears in the backend, then the
    // server broadcasts hands-changed over the WebSocket.
    const hand = computeScoredHand({ melds: dragonPongMelds }, discardWin('Kyle', 'Ming', 'Ming'));
    backend.addHand('TEST1', hand);
    await act(async () => {
      backend.broadcastWs({ type: 'hands-changed' });
    });

    await waitFor(() => {
      expect(screen.getByText('Kyle')).toBeDefined();
    });
  });
});

describe('Date filtering', () => {
  it('hands view filters by date range', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');

    // Add a backdated hand
    const oldHand = computeScoredHand({ melds: dragonPongMelds }, discardWin('Kyle', 'Ming', 'Ming'));
    backend.addHand('TEST1', { ...oldHand, timestamp: '2025-01-01T12:00:00' });

    // Add a recent hand
    scoreSessionHands('TEST1', [
      { melds: dragonPongMelds, win: discardWin('Ming', 'Kyle', 'Kyle') },
    ]);

    await renderSessionView('TEST1');
    await navigateToTab('Hands');

    // Default is "Today" — should only show the recent hand
    await waitFor(() => {
      const cards = [...document.querySelectorAll('.hcard-winner')];
      expect(cards).toHaveLength(1);
      expect(cards[0].textContent).toContain('Ming');
    });

    // Switch to "All time" — should show both
    await user.click(screen.getByText('All time'));
    await waitFor(() => {
      const cards = [...document.querySelectorAll('.hcard-winner')];
      expect(cards).toHaveLength(2);
    });
  });

  it('leaderboard filters by date range', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');

    // Add an old hand where Kyle won
    const oldHand = computeScoredHand({ melds: dragonPongMelds }, discardWin('Kyle', 'Ming', 'Ming'));
    backend.addHand('TEST1', { ...oldHand, timestamp: '2025-01-01T12:00:00' });

    // Add a recent hand where Ming won
    scoreSessionHands('TEST1', [
      { melds: dragonPongMelds, win: discardWin('Ming', 'Kyle', 'Kyle') },
    ]);

    await renderSessionView('TEST1');
    await navigateToTab('Leaderboard');

    // Default is "Today" — Ming won today, Kyle lost today
    await waitFor(() => {
      const names = [...document.querySelectorAll('.leaderboard-name')].map(el => el.textContent);
      expect(names[0]).toBe('Ming');
    });

    // Switch to "All time" — Kyle won old hand + lost today, Ming lost old + won today
    await user.click(screen.getByText('All time'));
    await waitFor(() => {
      const names = [...document.querySelectorAll('.leaderboard-name')].map(el => el.textContent);
      expect(names.length).toBe(2);
    });
  });
});

describe('Confirm & Record flow', () => {
  it('saves hand and navigates to hands view', async () => {
    backend.addSession('TEST1');
    backend.addPlayer('Kyle');
    backend.addPlayer('Ming');

    await renderSessionView('TEST1');

    await enterMeld(['Rd', 'Rd', 'Rd'], false);
    await enterMeld(['1b', '2b', '3b'], true);
    await enterMeld(['4b', '5b', '6b'], true);
    await enterMeld(['7d', '8d', '9d'], true);
    await enterMeld(['5b', '5b'], true);

    await scoreAndPickWin('8 Dots');
    await setWinContext({ winner: 'Kyle', loser: 'Ming', dealer: 'Ming' });

    // Click confirm
    await user.click(screen.getByText('Confirm & Record'));

    // Should navigate to hands view with the hand visible
    await waitFor(() => {
      const cards = [...document.querySelectorAll('.hcard-winner')];
      expect(cards.length).toBeGreaterThanOrEqual(1);
      expect(cards[0].textContent).toContain('Kyle');
    });

    // The hand should be saved keyed by player id; reads resolve the name.
    expect(backend.hands).toHaveLength(1);
    const kyle = backend.registry.players.find(p => p.name === 'Kyle')!;
    expect(backend.hands[0].winner).toBe(kyle.id);
    const { hands } = await backend.getAllHands();
    expect(hands.find(h => h.winner === 'Kyle')).toBeDefined();
  });
});
