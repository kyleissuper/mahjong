import { describe, it, expect } from 'vitest';
import { calculateScore, DRAGON_COMPONENTS, WIND_COMPONENTS, HONOR_COMPONENTS } from '../calculate-score.js';
import type { Hand, Win } from '../types.js';

describe('calculateScore', () => {
  const discardWin: Win = {
    players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'discard',
    from: 'B', dealer: 'C', dealerRounds: 1, special: [],
  };

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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'dragonPong', points: 1 },
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
    ]);
    expect(result.handValue).toBe(3);
    expect(result.scores).toEqual({ A: 3, B: 0, C: 0, D: -3 });
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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'only2Suits', points: 1 },
      { name: 'noTerminalsNoHonors', points: 3 },
    ]);
    // canOnlyWinWithOne does NOT fire — 5b also completes the hand
    // (pair 5b + chow 6b-7b-8b instead of pair 8b + chow 5b-6b-7b)
    expect(result.handValue).toBe(7);
    expect(result.scores).toEqual({ A: 22, B: -8, C: -7, D: -7 });
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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'pairOf258', points: 1 },
      { name: 'noTerminalsWithHonors', points: 1 },
    ]);
    expect(result.handValue).toBe(3);
    expect(result.scores).toEqual({ A: 3, B: 0, C: -3, D: 0 });
  });

  it('Hand 4 — all greens, all pongs, dealer self-pick (19 pts)', () => {
    // canOnlyWinWithOne does NOT fire: concealed 1b×3 + 3b can rearrange
    // to pair(1b) + chow(1b,2b,3b), so 2b also completes the hand.
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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'allPongs', points: 4 },
      { name: 'selfPick', points: 1 },
      { name: 'jadeDragon', points: 14 },
    ]);
    expect(result.handValue).toBe(19);
    expect(result.scores).toEqual({ A: 60, B: -20, C: -20, D: -20 });
  });

  it('Hand 5 — 1-9 chain, discard win (4 pts)', () => {
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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'oneToNineChain', points: 3 },
    ]);
    expect(result.handValue).toBe(4);
    expect(result.scores).toEqual({ A: 0, B: 0, C: 4, D: -4 });
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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'cleanDoorstepAndSelfPick', points: 3 },
      { name: 'threeHiddenPongs', points: 4 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(12);
    expect(result.scores).toEqual({ A: -12, B: -12, C: -15, D: 39 });
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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'stolenKong', points: 1 },
      { name: 'allFromOthers', points: 1 },
    ]);
    expect(result.handValue).toBe(5);
    expect(result.scores).toEqual({ A: -6, B: 6, C: 0, D: 0 });
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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'flower', points: 1 },
      { name: 'windPong', points: 1 },
      { name: 'pairOf258', points: 1 },
    ]);
    expect(result.handValue).toBe(3);
    expect(result.scores).toEqual({ A: 4, B: -4, C: 0, D: 0 });
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
      special: ['fromButt'],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'flower', points: 2 },
      { name: 'pairOf258', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'winFromButt', points: 1 },
      { name: 'hiddenKong', points: 2 },
    ]);
    expect(result.handValue).toBe(7);
    expect(result.scores).toEqual({ A: -7, B: -7, C: 22, D: -8 });
  });

  it('Hand 10 — pure, four hidden pongs, clean doorstep & self-pick (26 pts)', () => {
    // canOnlyWinWithOne does NOT fire: concealed 3d×3 + 4d can rearrange
    // to pair(3d) + chow(3d,4d,5d), so 5d also completes the hand.
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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'cleanDoorstepAndSelfPick', points: 3 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'pure', points: 8 },
      { name: 'fourHiddenPongs', points: 12 },
    ]);
    expect(result.handValue).toBe(26);
    expect(result.scores).toEqual({ A: -27, B: 79, C: -26, D: -26 });
  });

  it('Hand 11 — 1-9 chain, split kong (9 pts)', () => {
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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'only2Suits', points: 1 },
      { name: 'splitKong', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'oneToNineChain', points: 3 },
    ]);
    expect(result.handValue).toBe(9);
    expect(result.scores).toEqual({ A: -9, B: 0, C: 0, D: 9 });
  });

  it('Hand 12 — three consecutive pongs, no terminals/honors (11 pts)', () => {
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
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'only2Suits', points: 1 },
      { name: 'allFromOthers', points: 1 },
      { name: 'threeConsecutivePongs', points: 4 },
      { name: 'noTerminalsNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(11);
    expect(result.scores).toEqual({ A: 0, B: 0, C: 11, D: -11 });
  });

  it('Hand 13 — terminals & honors, all pongs, dealer discard win (10 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: false },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: false },
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pair', tiles: ['Wd', 'Wd'], concealed: true, winTile: 'Wd' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'B',
      method: 'discard',
      from: 'C',
      dealer: 'B',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allPongs', points: 4 },
      { name: 'all19WithHonors', points: 8 },
    ]);
    expect(result.handValue).toBe(14);
    expect(result.scores).toEqual({ A: 0, B: 15, C: -15, D: 0 });
  });

  it('Hand 14 — little dragons (8 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pong', tiles: ['Gd', 'Gd', 'Gd'], concealed: false },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true, winTile: '6b' },
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: false },
        { type: 'pair', tiles: ['Wd', 'Wd'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'discard',
      from: 'B',
      dealer: 'C',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'littleDragons', points: 8 },
    ]);
    expect(result.handValue).toBe(8);
    expect(result.scores).toEqual({ A: 8, B: -8, C: 0, D: 0 });
  });

  it('Hand 15 — three suit chow, double chow, all chows (10 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['3b', '4b', '5b'], concealed: true },
        { type: 'chow', tiles: ['3b', '4b', '5b'], concealed: true },
        { type: 'chow', tiles: ['3d', '4d', '5d'], concealed: true },
        { type: 'chow', tiles: ['3c', '4c', '5c'], concealed: true, winTile: '5c' },
        { type: 'pair', tiles: ['8d', '8d'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'discard',
      from: 'D',
      dealer: 'D',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'doubleChow', points: 1 },
      { name: 'threeSuitChow', points: 4 },
      { name: 'noTerminalsNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(10);
    expect(result.scores).toEqual({ A: 11, B: 0, C: 0, D: -11 });
  });

  it('Hand 16 — all 1s/9s, three suit pongs, dealer extra round 4 (26 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: false },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: false },
        { type: 'pong', tiles: ['9c', '9c', '9c'], concealed: false },
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'pair', tiles: ['1c', '1c'], concealed: true, winTile: '1c' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'B',
      method: 'self-pick',
      dealer: 'A',
      dealerRounds: 5,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allPongs', points: 4 },
      { name: 'selfPick', points: 1 },
      { name: 'all19', points: 16 },
      { name: 'threeSuitPongs', points: 4 },
    ]);
    expect(result.handValue).toBe(26);
    expect(result.scores).toEqual({ A: -35, B: 87, C: -26, D: -26 });
  });

  it('Hand 17 — four consecutive pongs, semi-pure (14 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['4d', '4d', '4d'], concealed: true },
        { type: 'pong', tiles: ['5d', '5d', '5d'], concealed: false },
        { type: 'pong', tiles: ['6d', '6d', '6d'], concealed: false },
        { type: 'pong', tiles: ['7d', '7d', '7d'], concealed: false },
        { type: 'pair', tiles: ['Ww', 'Ww'], concealed: true, winTile: 'Ww' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'C',
      method: 'discard',
      from: 'A',
      dealer: 'B',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'noTerminalsWithHonors', points: 1 },
      { name: 'semiPure', points: 4 },
      { name: 'fourConsecutivePongs', points: 8 },
    ]);
    expect(result.handValue).toBe(14);
    expect(result.scores).toEqual({ A: -14, B: 0, C: 14, D: 0 });
  });

  it('Hand 18 — big dragons, semi-pure (16 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: true },
        { type: 'pong', tiles: ['Gd', 'Gd', 'Gd'], concealed: false },
        { type: 'pong', tiles: ['Wd', 'Wd', 'Wd'], concealed: false },
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: false, winTile: '1b' },
        { type: 'pair', tiles: ['6b', '6b'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'D',
      method: 'discard',
      from: 'B',
      dealer: 'C',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'bigDragons', points: 12 },
      { name: 'semiPure', points: 4 },
    ]);
    expect(result.handValue).toBe(16);
    expect(result.scores).toEqual({ A: 0, B: -16, C: 0, D: 16 });
  });

  it('Hand 19 — little winds, dealer self-pick (19 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['Sw', 'Sw', 'Sw'], concealed: false },
        { type: 'pong', tiles: ['Ww', 'Ww', 'Ww'], concealed: false },
        { type: 'chow', tiles: ['3b', '4b', '5b'], concealed: true, winTile: '4b' },
        { type: 'pair', tiles: ['Nw', 'Nw'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'self-pick',
      dealer: 'A',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'noTerminalsWithHonors', points: 1 },
      { name: 'littleWinds', points: 12 },
      { name: 'semiPure', points: 4 },
    ]);
    expect(result.handValue).toBe(19);
    expect(result.scores).toEqual({ A: 60, B: -20, C: -20, D: -20 });
  });

  it('Hand 20 — all honors (13 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['Nw', 'Nw', 'Nw'], concealed: false },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pong', tiles: ['Wd', 'Wd', 'Wd'], concealed: true },
        { type: 'pair', tiles: ['Sw', 'Sw'], concealed: true, winTile: 'Sw' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'C',
      method: 'discard',
      from: 'D',
      dealer: 'B',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allHonors', points: 12 },
    ]);
    expect(result.handValue).toBe(13);
    expect(result.scores).toEqual({ A: 0, B: 0, C: 13, D: -13 });
  });

  it('all honors with a flower — allHonors still fires, absorbs set-level variants', () => {
    // Regression: a bonus flower meld must not prevent allHonors from firing,
    // otherwise allSetsHave19WithHonors / noTerminalsWithHonors / windPong /
    // allPongs all leak into the breakdown (see screenshot: 4 honor pongs +
    // dragon pair + flower showed the individual rules instead of allHonors).
    const hand: Hand = {
      melds: [
        { type: 'flower', tiles: ['F'], concealed: false },
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['Gd', 'Gd', 'Gd'], concealed: false },
        { type: 'pong', tiles: ['Sw', 'Sw', 'Sw'], concealed: true },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: true },
        { type: 'pair', tiles: ['Wd', 'Wd'], concealed: true, winTile: 'Wd' },
      ],
    };

    const result = calculateScore(hand, discardWin);
    const fired = (n: string) => result.appliedRules.find(r => r.name === n);

    expect(fired('allHonors')).toEqual({ name: 'allHonors', points: 12 });
    expect(fired('flower')).toEqual({ name: 'flower', points: 1 });
    expect(fired('littleDragons')).toEqual({ name: 'littleDragons', points: 8 });
    // allHonors absorbs these
    for (const absorbed of ['allPongs', 'windPong', 'dragonPong', 'allSetsHave19WithHonors', 'noTerminalsWithHonors', 'only2Suits']) {
      expect(fired(absorbed)).toBeUndefined();
    }
  });

  it('Hand 21 — all pairs, self-pick (13 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pair', tiles: ['2b', '2b'], concealed: true },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
        { type: 'pair', tiles: ['9b', '9b'], concealed: true },
        { type: 'pair', tiles: ['3d', '3d'], concealed: true },
        { type: 'pair', tiles: ['7d', '7d'], concealed: true, winTile: '7d' },
        { type: 'pair', tiles: ['Ew', 'Ew'], concealed: true },
        { type: 'pair', tiles: ['Rd', 'Rd'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'B',
      method: 'self-pick',
      dealer: 'D',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'allPairs', points: 12 },
    ]);
    expect(result.handValue).toBe(14);
    expect(result.scores).toEqual({ A: -14, B: 43, C: -14, D: -15 });
  });

  it('Hand 22 — thirteen orphans, dealer self-pick (16 pts)', () => {
    const hand: Hand = {
      melds: [
        {
          type: 'orphans',
          tiles: ['1b', '9b', '1d', '9d', '1c', '9c', 'Ew', 'Sw', 'Ww', 'Nw', 'Rd', 'Gd', 'Wd', '1b'],
          concealed: true,
          winTile: '9c',
        },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'self-pick',
      dealer: 'A',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'thirteenOrphans', points: 14 },
    ]);
    expect(result.handValue).toBe(16);
    expect(result.scores).toEqual({ A: 51, B: -17, C: -17, D: -17 });
  });

  it('pong wait with two possible winning tiles should NOT be canOnlyWinWithOne', () => {
    // 3 chows + pong of 2b (winTile) + pair of 6c
    // But before winning, hand had: 3 chows + 2b,2b + 6c,6c
    // Either 2b or 6c completes the hand — NOT single wait
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['3d', '4d', '5d'], concealed: true },
        { type: 'chow', tiles: ['6d', '7d', '8d'], concealed: true },
        { type: 'chow', tiles: ['1c', '2c', '3c'], concealed: false },
        { type: 'pong', tiles: ['2b', '2b', '2b'], concealed: false, winTile: '2b' },
        { type: 'pair', tiles: ['6c', '6c'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'discard',
      from: 'B',
      dealer: 'C',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules.find(r => r.name === 'canOnlyWinWithOne')).toBeUndefined();
  });

  // --- canOnlyWinWithOne: pair waits that look single but aren't, due to alternate chow decomposition ---

  it.each([
    {
      name: 'staircase 2b-3b-3b-4b-4b-5b-5b winning on 2b — also wins on 5b',
      chows: [['3b', '4b', '5b'], ['3b', '4b', '5b']],
      pair: '2b',
      single: false,
    },
    {
      name: 'staircase 2b-3b-3b-4b-4b-5b-5b winning on 5b — also wins on 2b',
      chows: [['2b', '3b', '4b'], ['3b', '4b', '5b']],
      pair: '5b',
      single: false,
    },
    {
      name: 'staircase 6b-7b-7b-8b-8b-9b-9b winning on 6b — also wins via shifted chow',
      chows: [['7b', '8b', '9b'], ['7b', '8b', '9b']],
      pair: '6b',
      single: false,
    },
  ])('$name', ({ chows, pair, single }) => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['Sw', 'Sw', 'Sw'], concealed: false },
        { type: 'chow', tiles: chows[0], concealed: true },
        { type: 'chow', tiles: chows[1], concealed: true },
        { type: 'pair', tiles: [pair, pair], concealed: true, winTile: pair },
      ],
    };
    const result = calculateScore(hand, discardWin);
    const fired = result.appliedRules.find(r => r.name === 'canOnlyWinWithOne');
    if (single) expect(fired).toBeDefined();
    else expect(fired).toBeUndefined();
  });

  it('genuine pair wait IS single wait (no staircase)', () => {
    // 13 tiles: Ew Ew Ew | 1b 2b 3b | 4d 5d 6d | 7c 8c 9c | 5b
    // Only 5b completes the pair — no alternative decomposition
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4d', '5d', '6d'], concealed: true },
        { type: 'chow', tiles: ['7c', '8c', '9c'], concealed: true },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true, winTile: '5b' },
      ],
    };
    const result = calculateScore(hand, discardWin);
    expect(result.appliedRules.find(r => r.name === 'canOnlyWinWithOne')).toBeDefined();
  });

  it('Hand 24 — two kong mahjong (7 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['3b', '3b', '3b', '3b'], concealed: false },
        { type: 'kong', tiles: ['7c', '7c', '7c', '7c'], concealed: false },
        { type: 'chow', tiles: ['4d', '5d', '6d'], concealed: false, winTile: '6d' },
        { type: 'pong', tiles: ['2d', '2d', '2d'], concealed: false },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'discard',
      from: 'B',
      dealer: 'C',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'exposedKong', points: 2 },
      { name: 'twoKongMahjong', points: 6 },
      { name: 'noTerminalsNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(12);
    expect(result.scores).toEqual({ A: 12, B: -12, C: 0, D: 0 });
  });

  it('Hand 23 — two double chows (18 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['2b', '3b', '4b'], concealed: true },
        { type: 'chow', tiles: ['2b', '3b', '4b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '8d' },
        { type: 'pair', tiles: ['5c', '5c'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'D',
      method: 'discard',
      from: 'C',
      dealer: 'B',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'twoDoubleChows', points: 12 },
    ]);
    expect(result.handValue).toBe(18);
    expect(result.scores).toEqual({ A: 0, B: 0, C: -18, D: 18 });
  });

  it('Hand 25 — heavenly gates (17 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'chow', tiles: ['2d', '3d', '4d'], concealed: true },
        { type: 'chow', tiles: ['6d', '7d', '8d'], concealed: true },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: true },
        { type: 'pair', tiles: ['5d', '5d'], concealed: true, winTile: '5d' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'C',
      method: 'self-pick',
      dealer: 'D',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'selfPick', points: 1 },
      { name: 'heavenlyGates', points: 16 },
    ]);
    expect(result.handValue).toBe(17);
    expect(result.scores).toEqual({ A: -17, B: -17, C: 52, D: -18 });
  });

  it('Hand 25b — heavenly gates, different meld decomposition', () => {
    // 1,1,1,2,2,3,4,5,6,7,8,9,9,9 in bamboo (extra tile = 2)
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: true },
        { type: 'chow', tiles: ['3b', '4b', '5b'], concealed: true },
        { type: 'pair', tiles: ['2b', '2b'], concealed: true, winTile: '2b' },
        { type: 'pong', tiles: ['1b', '1b', '1b'], concealed: true },
        { type: 'chow', tiles: ['6b', '7b', '8b'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'self-pick',
      dealer: 'B',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules.find(r => r.name === 'heavenlyGates')).toEqual(
      { name: 'heavenlyGates', points: 16 },
    );
  });

  it('Hand 26 — heavenly hand, dealer wins on deal (21 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['3b', '3b', '3b'], concealed: true },
        { type: 'pong', tiles: ['7d', '7d', '7d'], concealed: true },
        { type: 'chow', tiles: ['4c', '5c', '6c'], concealed: true },
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: true },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'self-pick',
      dealer: 'A',
      dealerRounds: 1,
      special: ['firstTurn'],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'heavenlyHand', points: 20 },
    ]);
    expect(result.handValue).toBe(21);
    expect(result.scores).toEqual({ A: 66, B: -22, C: -22, D: -22 });
  });

  it('Hand 27 — earthly hand, non-dealer wins on first discard (18 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true, winTile: '2b' },
        { type: 'pong', tiles: ['6d', '6d', '6d'], concealed: true },
        { type: 'chow', tiles: ['4c', '5c', '6c'], concealed: true },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: true },
        { type: 'pair', tiles: ['5d', '5d'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'B',
      method: 'discard',
      from: 'A',
      dealer: 'A',
      dealerRounds: 1,
      special: ['firstTurn'],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'earthlyHand', points: 16 },
    ]);
    expect(result.handValue).toBe(18);
    expect(result.scores).toEqual({ A: -19, B: 19, C: 0, D: 0 });
  });

  it('Hand 28 — big winds (19 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['Sw', 'Sw', 'Sw'], concealed: false },
        { type: 'pong', tiles: ['Ww', 'Ww', 'Ww'], concealed: false },
        { type: 'pong', tiles: ['Nw', 'Nw', 'Nw'], concealed: true },
        { type: 'pair', tiles: ['3b', '3b'], concealed: true, winTile: '3b' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'D',
      method: 'discard',
      from: 'A',
      dealer: 'C',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'bigWinds', points: 18 },
    ]);
    expect(result.handValue).toBe(19);
    expect(result.scores).toEqual({ A: -19, B: 0, C: 0, D: 19 });
  });

  it('Hand 29 — all kongs, hidden kong, win from butt (20 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['4b', '4b', '4b', '4b'], concealed: false },
        { type: 'kong', tiles: ['7b', '7b', '7b', '7b'], concealed: false },
        { type: 'kong', tiles: ['3d', '3d', '3d', '3d'], concealed: true },
        { type: 'kong', tiles: ['9c', '9c', '9c', '9c'], concealed: false },
        { type: 'pair', tiles: ['2d', '2d'], concealed: true, winTile: '2d' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'B',
      method: 'self-pick',
      dealer: 'A',
      dealerRounds: 1,
      special: ['fromButt'],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'winFromButt', points: 1 },
      { name: 'exposedKong', points: 3 },
      { name: 'hiddenKong', points: 2 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'allKongs', points: 14 },
    ]);
    expect(result.handValue).toBe(26);
    expect(result.scores).toEqual({ A: -27, B: 79, C: -26, D: -26 });
  });

  it('Hand 30 — prodigy hand (17 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true, winTile: '5b' },
        { type: 'pong', tiles: ['8d', '8d', '8d'], concealed: true },
        { type: 'chow', tiles: ['1c', '2c', '3c'], concealed: true },
        { type: 'chow', tiles: ['7c', '8c', '9c'], concealed: true },
        { type: 'pair', tiles: ['2d', '2d'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'C',
      method: 'discard',
      from: 'D',
      dealer: 'B',
      dealerRounds: 1,
      special: ['prodigy'],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'prodigyHand', points: 12 },
    ]);
    expect(result.handValue).toBe(17);
    expect(result.scores).toEqual({ A: 0, B: 0, C: 17, D: -17 });
  });

  it('Hand 31 — three suits w/ wind and dragon (2 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1b', '1b', '1b'], concealed: false },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: false, winTile: '9d' },
        { type: 'chow', tiles: ['4c', '5c', '6c'], concealed: true },
        { type: 'pong', tiles: ['Sw', 'Sw', 'Sw'], concealed: false },
        { type: 'pair', tiles: ['Rd', 'Rd'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'B',
      method: 'discard',
      from: 'C',
      dealer: 'A',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'threeSuitsWithWindAndDragon', points: 1 },
    ]);
    expect(result.handValue).toBe(2);
    expect(result.scores).toEqual({ A: 0, B: 2, C: -2, D: 0 });
  });

  it('Hand 32 — win from last wall tile, self-pick (4 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['4d', '5d', '6d'], concealed: true, winTile: '6d' },
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: false },
        { type: 'pong', tiles: ['Ww', 'Ww', 'Ww'], concealed: false },
        { type: 'chow', tiles: ['7c', '8c', '9c'], concealed: false },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'self-pick',
      dealer: 'B',
      dealerRounds: 1,
      special: ['lastTile'],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'pairOf258', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'lastWallTile', points: 1 },
    ]);
    expect(result.handValue).toBe(4);
    expect(result.scores).toEqual({ A: 13, B: -5, C: -4, D: -4 });
  });

  it('Hand 33 — win from last discard (3 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true, winTile: '2b' },
        { type: 'pong', tiles: ['6d', '6d', '6d'], concealed: false },
        { type: 'chow', tiles: ['4c', '5c', '6c'], concealed: false },
        { type: 'pong', tiles: ['8b', '8b', '8b'], concealed: false },
        { type: 'pair', tiles: ['2d', '2d'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'D',
      method: 'discard',
      from: 'A',
      dealer: 'C',
      dealerRounds: 1,
      special: ['lastTile'],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'lastDiscard', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(6);
    expect(result.scores).toEqual({ A: -6, B: 0, C: 0, D: 6 });
  });

  // --- Purity dragons (Jade/Ruby/Pearl): same shape across the three suits ---

  const PURITY_DRAGONS = [
    { name: 'Jade', rule: 'jadeDragon', dragon: 'Gd', suit: 'b' },
    { name: 'Ruby', rule: 'rubyDragon', dragon: 'Rd', suit: 'c' },
    { name: 'Pearl', rule: 'pearlDragon', dragon: 'Wd', suit: 'd' },
  ] as const;

  it.each(PURITY_DRAGONS)('$name Dragon fires when the matching dragon is present', ({ rule, dragon, suit }) => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: [dragon, dragon, dragon], concealed: false },
        { type: 'pong', tiles: [`2${suit}`, `2${suit}`, `2${suit}`], concealed: false },
        { type: 'chow', tiles: [`4${suit}`, `5${suit}`, `6${suit}`], concealed: true },
        { type: 'chow', tiles: [`7${suit}`, `8${suit}`, `9${suit}`], concealed: true },
        { type: 'pair', tiles: [`3${suit}`, `3${suit}`], concealed: true },
      ],
    };
    const result = calculateScore(hand, discardWin);
    expect(result.appliedRules.find(r => r.name === rule)).toEqual({ name: rule, points: 14 });
  });

  it.each(PURITY_DRAGONS)('$name Dragon does NOT fire when the matching dragon is absent', ({ rule, suit }) => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: [`1${suit}`, `2${suit}`, `3${suit}`], concealed: true },
        { type: 'chow', tiles: [`1${suit}`, `2${suit}`, `3${suit}`], concealed: true },
        { type: 'chow', tiles: [`5${suit}`, `6${suit}`, `7${suit}`], concealed: true },
        { type: 'chow', tiles: [`5${suit}`, `6${suit}`, `7${suit}`], concealed: true },
        { type: 'pair', tiles: [`4${suit}`, `4${suit}`], concealed: true },
      ],
    };
    const result = calculateScore(hand, discardWin);
    expect(result.appliedRules.find(r => r.name === rule)).toBeUndefined();
    expect(result.appliedRules.find(r => r.name === 'pure')).toBeDefined();
  });

  it.each(PURITY_DRAGONS)('$name Dragon absorbs dragonPong, semiPure, only2Suits, pure', ({ rule, dragon, suit }) => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: [dragon, dragon, dragon], concealed: false },
        { type: 'pong', tiles: [`3${suit}`, `3${suit}`, `3${suit}`], concealed: false },
        { type: 'pong', tiles: [`6${suit}`, `6${suit}`, `6${suit}`], concealed: false },
        { type: 'chow', tiles: [`7${suit}`, `8${suit}`, `9${suit}`], concealed: true },
        { type: 'pair', tiles: [`5${suit}`, `5${suit}`], concealed: true },
      ],
    };
    const result = calculateScore(hand, discardWin);
    const fired = (n: string) => result.appliedRules.find(r => r.name === n);
    expect(fired(rule)).toBeDefined();
    for (const absorbed of ['dragonPong', 'semiPure', 'only2Suits', 'pure']) {
      expect(fired(absorbed)).toBeUndefined();
    }
  });

  it('all 1s/9s with honors — every tile is terminal or honor (8 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: false },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: false },
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'pair', tiles: ['Wd', 'Wd'], concealed: true, winTile: 'Wd' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'B',
      method: 'discard',
      from: 'C',
      dealer: 'B',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules.find(r => r.name === 'all19WithHonors')).toEqual(
      { name: 'all19WithHonors', points: 8 },
    );
    // should absorb the "all sets have" variant
    expect(result.appliedRules.find(r => r.name === 'allSetsHave19WithHonors')).toBeUndefined();
  });

  it('all sets have 1/9, no honors (4 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: false },
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: false },
        { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true },
        { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true, winTile: '7b' },
        { type: 'pair', tiles: ['9b', '9b'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'self-pick',
      dealer: 'B',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules.find(r => r.name === 'allSetsHave19')).toEqual(
      { name: 'allSetsHave19', points: 4 },
    );
    // should absorb the "with honors" variant
    expect(result.appliedRules.find(r => r.name === 'allSetsHave19WithHonors')).toBeUndefined();
  });

  it('7788899 pattern: pair wait is NOT single (pong+pair decomposition)', () => {
    // 7,7,8,8,8,9,9 in concealed can decompose as:
    // chow(789)+chow(789)+pair(8) — looks like single wait on 8
    // BUT also: pong(888)+pair(77) waiting on 9, or pong(888)+pair(99) waiting on 7
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: false },
        { type: 'pong', tiles: ['5c', '5c', '5c'], concealed: false },
        { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true },
        { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true, winTile: '8b' },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'self-pick',
      dealer: 'B',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules.find(r => r.name === 'canOnlyWinWithOne')).toBeUndefined();
  });

  it('7788899 pattern with exposed pair: not single wait', () => {
    // Same pattern but pair is exposed — pairIsOnlyWait must still
    // include the pair tiles in the free pool
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: false },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: false },
        { type: 'pair', tiles: ['8b', '8b'], concealed: false, winTile: '8b' },
        { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true },
        { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true },
      ],
    };

    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'self-pick',
      dealer: 'B',
      dealerRounds: 1,
      special: [],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules.find(r => r.name === 'canOnlyWinWithOne')).toBeUndefined();
  });

  it('unordered chow tiles produce the same score as sorted', () => {
    const win: Win = {
      players: ['A', 'B', 'C', 'D'],
      winner: 'A',
      method: 'discard',
      from: 'D',
      dealer: 'D',
      dealerRounds: 1,
      special: [],
    };

    // Same hand as "double chow + 3 suit chow" but tiles entered out of order
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['5b', '3b', '4b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '3b'], concealed: true },
        { type: 'chow', tiles: ['5d', '3d', '4d'], concealed: true },
        { type: 'chow', tiles: ['4c', '3c', '5c'], concealed: true, winTile: '5c' },
        { type: 'pair', tiles: ['8d', '8d'], concealed: true },
      ],
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'doubleChow', points: 1 },
      { name: 'threeSuitChow', points: 4 },
      { name: 'noTerminalsNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(10);
  });

  // --- Edge case battery ---

  it('split orphans (exposed pair + concealed rest) scores correctly', () => {
    const hand: Hand = {
      melds: [
        { type: 'pair', tiles: ['Rd', 'Rd'], concealed: false, winTile: 'Rd' },
        { type: 'orphans', tiles: ['1b', '9b', '1d', '9d', '1c', '9c', 'Ew', 'Sw', 'Ww', 'Nw', 'Gd', 'Wd'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'discard', from: 'C',
      dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    expect(result.appliedRules.find(r => r.name === 'thirteenOrphans')).toBeDefined();
    // allFromOthers and cleanDoorstep should NOT fire
    expect(result.appliedRules.find(r => r.name === 'allFromOthers')).toBeUndefined();
    expect(result.appliedRules.find(r => r.name === 'cleanDoorstep')).toBeUndefined();
  });

  it('all pairs hand (7 pairs) scores correctly', () => {
    const hand: Hand = {
      melds: [
        { type: 'pair', tiles: ['1b', '1b'], concealed: true },
        { type: 'pair', tiles: ['3b', '3b'], concealed: true },
        { type: 'pair', tiles: ['5d', '5d'], concealed: true },
        { type: 'pair', tiles: ['7d', '7d'], concealed: true },
        { type: 'pair', tiles: ['9c', '9c'], concealed: true },
        { type: 'pair', tiles: ['Ew', 'Ew'], concealed: true },
        { type: 'pair', tiles: ['Rd', 'Rd'], concealed: true, winTile: 'Rd' },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'self-pick',
      dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    expect(result.appliedRules.find(r => r.name === 'allPairs')).toEqual(
      { name: 'allPairs', points: 12 },
    );
    // allChows, allPongs, allFromOthers should NOT fire
    expect(result.appliedRules.find(r => r.name === 'allChows')).toBeUndefined();
    expect(result.appliedRules.find(r => r.name === 'allPongs')).toBeUndefined();
    expect(result.appliedRules.find(r => r.name === 'allFromOthers')).toBeUndefined();
  });

  it('hand with kong counts tiles correctly for suit rules', () => {
    // Kong = 4 tiles, hand has 15 tiles total
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['3b', '3b', '3b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: false },
        { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: false },
        { type: 'pong', tiles: ['1b', '1b', '1b'], concealed: true },
        { type: 'pair', tiles: ['2b', '2b'], concealed: true, winTile: '2b' },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'self-pick',
      dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    // Should be pure (all bamboo)
    expect(result.appliedRules.find(r => r.name === 'pure')).toEqual(
      { name: 'pure', points: 8 },
    );
    // Should have hidden kong
    expect(result.appliedRules.find(r => r.name === 'hiddenKong')).toEqual(
      { name: 'hiddenKong', points: 2 },
    );
  });

  it('cleanDoorstep does not fire for all-pairs hand', () => {
    const hand: Hand = {
      melds: [
        { type: 'pair', tiles: ['1b', '1b'], concealed: true },
        { type: 'pair', tiles: ['2b', '2b'], concealed: true },
        { type: 'pair', tiles: ['3b', '3b'], concealed: true },
        { type: 'pair', tiles: ['4b', '4b'], concealed: true },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
        { type: 'pair', tiles: ['6b', '6b'], concealed: true },
        { type: 'pair', tiles: ['7b', '7b'], concealed: true, winTile: '7b' },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'discard', from: 'B',
      dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    expect(result.appliedRules.find(r => r.name === 'allPairs')).toBeDefined();
    // cleanDoorstep/allFromOthers should not fire (no sets)
    expect(result.appliedRules.find(r => r.name === 'cleanDoorstep')).toBeUndefined();
    expect(result.appliedRules.find(r => r.name === 'allFromOthers')).toBeUndefined();
  });

  it('canOnlyWinWithOne: middle wait chow (4-6 waiting on 5) is single wait', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: true },
        { type: 'chow', tiles: ['4d', '5d', '6d'], concealed: true, winTile: '5d' },
        { type: 'pair', tiles: ['1c', '1c'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'discard', from: 'B',
      dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    expect(result.appliedRules.find(r => r.name === 'canOnlyWinWithOne')).toEqual(
      { name: 'canOnlyWinWithOne', points: 1 },
    );
  });

  it('canOnlyWinWithOne: non-edge chow wait (3-4-5 won on 3) is NOT single wait', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: true },
        { type: 'chow', tiles: ['3d', '4d', '5d'], concealed: true, winTile: '3d' },
        { type: 'pair', tiles: ['1c', '1c'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'discard', from: 'B',
      dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    expect(result.appliedRules.find(r => r.name === 'canOnlyWinWithOne')).toBeUndefined();
  });

  it('4 flowers should not trigger splitKong', () => {
    const hand: Hand = {
      melds: [
        { type: 'flower', tiles: ['F', 'F', 'F', 'F'], concealed: false },
        { type: 'pong', tiles: ['Nw', 'Nw', 'Nw'], concealed: true },
        { type: 'chow', tiles: ['2c', '3c', '4c'], concealed: true },
        { type: 'chow', tiles: ['5b', '6b', '7b'], concealed: true },
        { type: 'chow', tiles: ['6d', '7d', '8d'], concealed: true, winTile: '6d' },
        { type: 'pair', tiles: ['8d', '8d'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'self-pick',
      dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    expect(result.appliedRules.find(r => r.name === 'splitKong')).toBeUndefined();
  });

  it('exposed kong scores 1 pt each', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['3b', '3b', '3b', '3b'], concealed: false },
        { type: 'pong', tiles: ['7c', '7c', '7c'], concealed: false },
        { type: 'chow', tiles: ['4d', '5d', '6d'], concealed: false, winTile: '6d' },
        { type: 'pong', tiles: ['2d', '2d', '2d'], concealed: false },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'discard',
      from: 'B', dealer: 'C', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    expect(result.appliedRules.find(r => r.name === 'exposedKong')).toEqual(
      { name: 'exposedKong', points: 1 },
    );
  });

  it('discard win treats the winning meld as exposed even if entered as concealed', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '8d' },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: true },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'discard',
      from: 'D', dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    // The winning chow came from a discard, so the hand is NOT all concealed
    expect(result.appliedRules.find(r => r.name === 'cleanDoorstep')).toBeUndefined();
  });

  it('wind kong fires windKong, not windPong', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['Nw', 'Nw', 'Nw', 'Nw'], concealed: false },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pong', tiles: ['Gd', 'Gd', 'Gd'], concealed: false },
        { type: 'pong', tiles: ['Wd', 'Wd', 'Wd'], concealed: false },
        { type: 'pair', tiles: ['8d', '8d'], concealed: true, winTile: '8d' },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'discard',
      from: 'C', dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    expect(result.appliedRules.find(r => r.name === 'windKong')).toEqual(
      { name: 'windKong', points: 1 },
    );
    expect(result.appliedRules.find(r => r.name === 'windPong')).toBeUndefined();
  });

  it('dragon kong fires dragonKong, not dragonPong', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['Rd', 'Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '8d' },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'self-pick',
      dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = calculateScore(hand, win);
    expect(result.appliedRules.find(r => r.name === 'dragonKong')).toEqual(
      { name: 'dragonKong', points: 1 },
    );
    expect(result.appliedRules.find(r => r.name === 'dragonPong')).toBeUndefined();
  });
});

describe('honor component constants', () => {
  it('DRAGON_COMPONENTS covers the per-meld dragon rules', () => {
    expect(DRAGON_COMPONENTS).toEqual(['dragonPong', 'dragonKong']);
  });

  it('WIND_COMPONENTS covers the per-meld wind rules', () => {
    expect(WIND_COMPONENTS).toEqual(['windPong', 'windKong']);
  });

  it('HONOR_COMPONENTS is the union of dragon + wind components', () => {
    expect(HONOR_COMPONENTS).toEqual([...DRAGON_COMPONENTS, ...WIND_COMPONENTS]);
  });
});
