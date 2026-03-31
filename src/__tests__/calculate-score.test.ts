import { describe, it, expect } from 'vitest';
import { calculateScore } from '../calculate-score.js';
import type { Hand, Win } from '../types.js';

describe('calculateScore', () => {
  it('Hand 1 — dragon pong, 2/5/8 pair, single-tile wait, discard win (3 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '8d' },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'discard',
      from: 'D',
      dealer: 'B',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // 3 pts, discard win, neither winner nor discarder is dealer
    // D pays A 3 points, B and C unaffected
    expect(result).toEqual({ A: 3, B: 0, C: 0, D: -3 });
  });
});
