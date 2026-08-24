import type { Hand, Meld, Win } from './types.ts';
import { scoreHand } from './scoring/engine.ts';

export interface ScoredHand {
  timestamp: string;
  winner: string;
  method: string;
  handValue: number;
  appliedRules: { name: string; points: number }[];
  dealerBonus: number;
  melds: Meld[];
  scores: Record<string, number>;
  scanId?: string;
}

export interface Session {
  code: string;
  createdAt: string;
  expired?: boolean;
}

export function createSession(code = ''): Session {
  return {
    code,
    createdAt: pacificTimestamp(),
  };
}

export function computeScoredHand(hand: Hand, win: Win): ScoredHand {
  if (win.method !== 'self-pick' && win.winner === win.from) {
    throw new Error('Winner and loser cannot be the same player');
  }

  const result = scoreHand(hand, win);
  const maxBonus = Math.max(0, ...result.payments.map(p => p.dealerBonus));

  return {
    timestamp: pacificTimestamp(),
    winner: win.winner,
    method: win.method,
    handValue: result.handValue,
    appliedRules: result.appliedRules,
    dealerBonus: maxBonus,
    melds: hand.melds,
    scores: result.scores,
  };
}

export function rosterByActivity(hands: ScoredHand[], allPlayers: string[]): string[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const scores = new Map<string, number>();

  for (const hand of hands) {
    const ageMs = now - new Date(hand.timestamp).getTime();
    const weight = Math.exp(-ageMs / dayMs);
    for (const name of Object.keys(hand.scores)) {
      scores.set(name, (scores.get(name) ?? 0) + weight);
    }
  }

  const active = new Set(scores.keys());
  return [
    ...allPlayers.filter(n => active.has(n)).sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0)),
    ...allPlayers.filter(n => !active.has(n)),
  ];
}

// --- Helpers ---

function pacificTimestamp(): string {
  return new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
}
