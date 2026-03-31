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
        { type: 'chow', tiles: ['2b', '3b', '4b'], concealed: false },
        { type: 'chow', tiles: ['5b', '6b', '7b'], concealed: true },
        { type: 'chow', tiles: ['2d', '3d', '4d'], concealed: false },
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
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: false },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: false },
        { type: 'pong', tiles: ['Gd', 'Gd', 'Gd'], concealed: false },
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

  it('Hand 5 — clean doorstep, 1-9 chain, discard win (5 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: true },
        { type: 'chow', tiles: ['4d', '5d', '6d'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '7d' },
        { type: 'pong', tiles: ['4b', '4b', '4b'], concealed: true },
        { type: 'pair', tiles: ['Wd', 'Wd'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'C',
      method: 'discard',
      from: 'D',
      dealer: 'B',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // clean doorstep (+1), 1-9 chain (+3), can only win with one (+1) = 5 pts
    // D pays C 5, dealer B not involved
    expect(result).toEqual({ A: 0, B: 0, C: 5, D: -5 });
  });

  it('Hand 6 — clean doorstep & self-pick, three hidden pongs, dealer extra round (12 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['2d', '2d', '2d'], concealed: true },
        { type: 'pong', tiles: ['6d', '6d', '6d'], concealed: true },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: true },
        { type: 'chow', tiles: ['4c', '5c', '6c'], concealed: true },
        { type: 'pair', tiles: ['5c', '5c'], concealed: true, winTile: '5c' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'D',
      method: 'self-pick',
      dealer: 'C',
      dealerRounds: 2,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // clean doorstep & self-pick (+3) absorbs cleanDoorstep (+1) and selfPick (+1)
    // three hidden pongs (+4), no flowers/no honors (+3),
    // can only win with one (+1), 2/5/8 pair (+1) = 12 pts
    // Dealer C extra round 1: dealerRounds=2, bonus=1+(1×2)=3
    // A→D: 12, B→D: 12, C(dealer)→D: 12+3=15
    expect(result).toEqual({ A: -12, B: -12, C: -15, D: 39 });
  });

  it('Hand 7 — stolen kong, all from others, discard-style payment (5 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['2c', '3c', '4c'], concealed: false },
        { type: 'chow', tiles: ['6c', '7c', '8c'], concealed: false },
        { type: 'pong', tiles: ['Nw', 'Nw', 'Nw'], concealed: false },
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: false },
        { type: 'pair', tiles: ['8d', '8d'], concealed: true, winTile: '8d' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'B',
      method: 'stolen-kong',
      from: 'A',
      dealer: 'A',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // stolen kong (+1), all from others (+1), wind pong (+1),
    // can only win with one (+1), 2/5/8 pair (+1) = 5 pts
    // A (dealer) pays B: 5+1=6
    expect(result).toEqual({ A: -6, B: 6, C: 0, D: 0 });
  });

  it('Hand 8 — flower, wind pong, dealer discard win (3 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: false },
        { type: 'chow', tiles: ['5b', '6b', '7b'], concealed: true },
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'chow', tiles: ['3d', '4d', '5d'], concealed: false, winTile: '3d' },
        { type: 'pair', tiles: ['2c', '2c'], concealed: true },
        { type: 'flower', tiles: ['F'], concealed: false },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'discard',
      from: 'B',
      dealer: 'B',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // flower (+1), wind pong (+1), 2/5/8 pair (+1) = 3 pts
    // B (dealer) pays A: 3+1=4
    expect(result).toEqual({ A: 4, B: -4, C: 0, D: 0 });
  });

  it('Hand 9 — win from the butt, hidden kong, 2 flowers (7 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['3d', '3d', '3d'], concealed: false },
        { type: 'kong', tiles: ['8c', '8c', '8c', '8c'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true, winTile: '6b' },
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: false },
        { type: 'pair', tiles: ['5d', '5d'], concealed: true },
        { type: 'flower', tiles: ['F', 'F'], concealed: false },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'C',
      method: 'self-pick',
      dealer: 'D',
      dealerRounds: 1,
      fromButt: true,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // win from butt (+1), self-pick (+1), hidden kong (+2),
    // flower x2 (+2), 2/5/8 pair (+1) = 7 pts
    // A→C: 7, B→C: 7, D(dealer)→C: 7+1=8
    expect(result).toEqual({ A: -7, B: -7, C: 22, D: -8 });
  });

  it('Hand 10 — pure, four hidden pongs, clean doorstep & self-pick (27 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'pong', tiles: ['3d', '3d', '3d'], concealed: true },
        { type: 'pong', tiles: ['6d', '6d', '6d'], concealed: true },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: true },
        { type: 'pair', tiles: ['4d', '4d'], concealed: true, winTile: '4d' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'B',
      method: 'self-pick',
      dealer: 'A',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // fourHiddenPongs (+12, absorbs allPongs +4 and threeHiddenPongs +4)
    // pure (+8), cleanDoorstepAndSelfPick (+3, absorbs cleanDoorstep +1 and selfPick +1)
    // noFlowersNoHonors (+3, absorbed by noTerminalsNoHonors... wait, hand HAS terminals)
    // noFlowersNoHonors (+3), canOnlyWinWithOne (+1) = 27 pts
    // A(dealer)→B: 27+1=28, C→B: 27, D→B: 27
    expect(result).toEqual({ A: -28, B: 82, C: -27, D: -27 });
  });

  it('Hand 11 — 1-9 chain, split kong, clean doorstep (7 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true, winTile: '9b' },
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
        { type: 'pair', tiles: ['8d', '8d'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'D',
      method: 'discard',
      from: 'A',
      dealer: 'C',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // 1-9 chain (+3), split kong (+1), clean doorstep (+1),
    // 2/5/8 pair (+1), only 2 suits (+1), no flowers/no honors (+3) = 10 pts
    // A pays D 10, dealer C not involved
    expect(result).toEqual({ A: -10, B: 0, C: 0, D: 10 });
  });

  it('Hand 12 — three consecutive pongs, no terminals/honors (10 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['3b', '3b', '3b'], concealed: false },
        { type: 'pong', tiles: ['4b', '4b', '4b'], concealed: false },
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: false },
        { type: 'chow', tiles: ['6d', '7d', '8d'], concealed: false },
        { type: 'pair', tiles: ['2d', '2d'], concealed: true, winTile: '2d' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'C',
      method: 'discard',
      from: 'D',
      dealer: 'A',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // three consecutive pongs (+4), no terminals/no honors (+3),
    // all from others (+1), 2/5/8 pair (+1), can only win with one (+1),
    // only 2 suits (+1) = 11 pts
    // D pays C 11, dealer A not involved
    expect(result).toEqual({ A: 0, B: 0, C: 11, D: -11 });
  });

  it('Hand 13 — terminals & honors, all pongs, dealer discard win (10 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: false },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: false, winTile: '9b' },
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pair', tiles: ['Wd', 'Wd'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'B',
      method: 'discard',
      from: 'C',
      dealer: 'B',
      dealerRounds: 1,
      fromButt: false,
      lastTile: false,
    };

    const result = calculateScore(hand, win);

    // terminals & honors (+4), all pongs (+4), wind pong (+1),
    // can only win with one (+1) = 10 pts
    // C pays B (dealer): 10+1=11
    expect(result).toEqual({ A: 0, B: 11, C: -11, D: 0 });
  });
});
