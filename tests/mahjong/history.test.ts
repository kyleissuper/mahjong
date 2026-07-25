import { describe, it, expect } from 'vitest';
import { filterHistory, type HistoryFilter } from '../../src/mahjong/history.ts';
import type { ScoredHand } from '../../src/mahjong/session.ts';

function hand(winner: string, scores: Record<string, number>, timestamp: string): ScoredHand {
  return {
    timestamp,
    winner,
    method: 'discard',
    handValue: 0,
    appliedRules: [],
    dealerBonus: 0,
    melds: [],
    scores,
  };
}

const HANDS: ScoredHand[] = [
  hand('Kyle', { Kyle: 5, Ming: -5 }, '2026-07-20T10:00:00'),
  hand('Ming', { Ming: 12, Kyle: -12 }, '2026-07-21T14:00:00'),
  hand('Sarah', { Sarah: 8, Kyle: -8 }, '2026-07-22T09:00:00'),
  hand('Kyle', { Kyle: 20, Ming: -10, Sarah: -10 }, '2026-07-23T18:00:00'),
  hand('Ming', { Ming: 3, Sarah: -3 }, '2026-06-01T12:00:00'),
  hand('Kyle', { Kyle: 7, Ming: -7 }, '2025-12-15T08:00:00'),
];

describe('filterHistory', () => {
  describe('no filters', () => {
    it('returns all hands sorted by max points earned descending', () => {
      const result = filterHistory(HANDS, {});
      expect(result.map(h => h.winner)).toEqual(['Kyle', 'Ming', 'Sarah', 'Kyle', 'Kyle', 'Ming']);
      expect(maxEarned(result[0])).toBe(20);
      expect(maxEarned(result[1])).toBe(12);
    });
  });

  describe('player filter', () => {
    it('shows only hands involving that player', () => {
      const result = filterHistory(HANDS, { player: 'Sarah' });
      expect(result.every(h => 'Sarah' in h.scores)).toBe(true);
    });

    it('sorts by that player\'s exchanged points descending', () => {
      const result = filterHistory(HANDS, { player: 'Kyle' });
      const kyleScores = result.map(h => h.scores.Kyle);
      for (let i = 1; i < kyleScores.length; i++) {
        expect(kyleScores[i - 1]).toBeGreaterThanOrEqual(kyleScores[i]);
      }
    });

    it('includes hands where the player lost', () => {
      const result = filterHistory(HANDS, { player: 'Ming' });
      expect(result.some(h => h.scores.Ming < 0)).toBe(true);
    });
  });

  describe('date filter', () => {
    it('filters by day', () => {
      const result = filterHistory(HANDS, { date: 'day', now: new Date('2026-07-23T20:00:00') });
      expect(result).toHaveLength(1);
      expect(result[0].winner).toBe('Kyle');
    });

    it('filters by week', () => {
      const result = filterHistory(HANDS, { date: 'week', now: new Date('2026-07-23T20:00:00') });
      expect(result.every(h => new Date(h.timestamp) >= new Date('2026-07-16T20:00:00'))).toBe(true);
    });

    it('filters by month', () => {
      const result = filterHistory(HANDS, { date: 'month', now: new Date('2026-07-23T20:00:00') });
      expect(result.every(h => new Date(h.timestamp).getMonth() === 6)).toBe(true);
    });

    it('filters by year', () => {
      const result = filterHistory(HANDS, { date: 'year', now: new Date('2026-07-23T20:00:00') });
      expect(result.every(h => new Date(h.timestamp).getFullYear() === 2026)).toBe(true);
      expect(result.some(h => h.timestamp.startsWith('2025'))).toBe(false);
    });

    it('all-time returns everything', () => {
      const result = filterHistory(HANDS, { date: 'all-time' });
      expect(result).toHaveLength(HANDS.length);
    });
  });

  describe('combined filters', () => {
    it('filters by player and date together', () => {
      const result = filterHistory(HANDS, {
        player: 'Kyle',
        date: 'month',
        now: new Date('2026-07-23T20:00:00'),
      });
      expect(result.every(h => 'Kyle' in h.scores)).toBe(true);
      expect(result.every(h => new Date(h.timestamp).getMonth() === 6)).toBe(true);
    });

    it('sorts by player points when player filter is active', () => {
      const result = filterHistory(HANDS, {
        player: 'Kyle',
        date: 'all-time',
      });
      const kyleScores = result.map(h => h.scores.Kyle);
      for (let i = 1; i < kyleScores.length; i++) {
        expect(kyleScores[i - 1]).toBeGreaterThanOrEqual(kyleScores[i]);
      }
    });

    it('sorts by max earned when no player filter', () => {
      const result = filterHistory(HANDS, { date: 'all-time' });
      const maxes = result.map(maxEarned);
      for (let i = 1; i < maxes.length; i++) {
        expect(maxes[i - 1]).toBeGreaterThanOrEqual(maxes[i]);
      }
    });
  });
});

function maxEarned(hand: ScoredHand): number {
  return Math.max(...Object.values(hand.scores));
}
