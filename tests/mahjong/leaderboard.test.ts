import { describe, it, expect } from 'vitest';
import { leaderboardFromHands } from '../../src/mahjong/leaderboard.ts';
import type { ScoredHand } from '../../src/mahjong/session.ts';

function hand(scores: Record<string, number>, timestamp = new Date().toISOString()): ScoredHand {
  const winner = Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0];
  return { timestamp, winner, method: 'discard', handValue: 0, appliedRules: [], dealerBonus: 0, melds: [], scores };
}

describe('leaderboardFromHands', () => {
  it('ranks players by score descending', () => {
    const hands = [
      hand({ Kyle: 10, Ming: -10 }),
      hand({ Kyle: -5, Sarah: 5 }),
      hand({ Sarah: -2, Ming: 5, Kyle: -3 }),
    ];
    const ranked = leaderboardFromHands(hands);
    expect(ranked.map(r => r.name)).toEqual(['Sarah', 'Kyle', 'Ming']);
    expect(ranked[0].score).toBe(3);
    expect(ranked[1].score).toBe(2);
    expect(ranked[2].score).toBe(-5);
  });

  it('aggregates across multiple hand sets', () => {
    const hands = [
      hand({ Kyle: 10, Ming: -10 }),
      hand({ Kyle: -3, Sarah: 3 }),
    ];
    const ranked = leaderboardFromHands(hands);
    expect(ranked.map(r => r.name)).toEqual(['Kyle', 'Sarah', 'Ming']);
    expect(ranked[0].score).toBe(7);
  });

  it('sorts by score descending', () => {
    const hands = [
      hand({ Kyle: -2, Ming: 10, Sarah: -8 }),
    ];
    const ranked = leaderboardFromHands(hands);
    expect(ranked.map(r => r.name)).toEqual(['Ming', 'Kyle', 'Sarah']);
  });
});
