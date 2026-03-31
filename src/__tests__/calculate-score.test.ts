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

  it('Hand 2 — all chows, self-pick, only 2 suits, no 1s/9s/honors (8 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['2b', '3b', '4b'], concealed: true },
        { type: 'chow', tiles: ['5b', '6b', '7b'], concealed: true },
        { type: 'chow', tiles: ['2d', '3d', '4d'], concealed: true },
        { type: 'chow', tiles: ['5d', '6d', '7d'], concealed: true },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true, winTile: '8b' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'self-pick',
      dealer: 'B',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // 8 pts, self-pick, winner is NOT dealer
    // Non-dealer losers pay 8 each, dealer pays 8+1=9
    // Winner gets 8+8+9 = 25
    expect(result).toEqual({ A: 25, B: -9, C: -8, D: -8 });
  });

  it('Hand 3 — wind pong, no 1s/9s with honors, discard win (3 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['3b', '3b', '3b'], concealed: false },
        { type: 'pong', tiles: ['7d', '7d', '7d'], concealed: false },
        { type: 'chow', tiles: ['4c', '5c', '6c'], concealed: true, winTile: '6c' },
        { type: 'pair', tiles: ['2b', '2b'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'discard',
      from: 'C',
      dealer: 'B',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // wind pong (+1), 2/5/8 pair (+1), no 1s/9s with honors (+1) = 3 pts
    // C pays A 3 points, neither is dealer
    expect(result).toEqual({ A: 3, B: 0, C: -3, D: 0 });
  });

  it('Hand 4 — all greens, all pongs, dealer self-pick (20 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1b', '1b', '1b'], concealed: true },
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: true },
        { type: 'pong', tiles: ['Gd', 'Gd', 'Gd'], concealed: true },
        { type: 'pair', tiles: ['3b', '3b'], concealed: true, winTile: '3b' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'self-pick',
      dealer: 'A',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // All Greens (+14) absorbs Semi-Pure (+4) and Green Dragon pong (+1)
    // ALL pongs (+4), self-pick (+1), can only win with one (+1) = 20 pts
    // Dealer self-pick: each loser pays 20+1=21
    // A gets 63, others pay 21 each
    expect(result).toEqual({ A: 63, B: -21, C: -21, D: -21 });
  });
});
