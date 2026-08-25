import { describe, it, expect } from 'vitest';
import { scoreHand } from '../../../src/mahjong/scoring/engine.ts';
import { DRAGON_COMPONENTS, WIND_COMPONENTS, HONOR_COMPONENTS } from '../../../src/mahjong/scoring/rules.ts';
import type { Hand, Win } from '../../../src/mahjong/types.ts';

describe('scoreHand', () => {
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

    const result = scoreHand(hand, win);

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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'missingSuit', points: 1 },
      { name: 'no19sNoHonors', points: 3 },
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'pairOf258', points: 1 },
      { name: 'no19sWithHonors', points: 1 },
    ]);
    expect(result.handValue).toBe(3);
    expect(result.scores).toEqual({ A: 3, B: 0, C: -3, D: 0 });
  });

  it('Hand 4 — all greens, all pongs, dealer self-pick (18 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'allPongs', points: 4 },
      { name: 'selfPick', points: 1 },
      { name: 'littleAndBigPong', points: 1 },
      { name: 'jadeDragon', points: 12 },
    ]);
    expect(result.handValue).toBe(18);
    expect(result.scores).toEqual({ A: 57, B: -19, C: -19, D: -19 });
  });

  it('Hand 5 — 1-9 chain, clean doorstep, discard win (5 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'oneToNineTrain', points: 3 },
    ]);
    expect(result.handValue).toBe(5);
    expect(result.scores).toEqual({ A: 0, B: 0, C: 5, D: -5 });
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

    const result = scoreHand(hand, win);

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

    const result = scoreHand(hand, win);

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

    const result = scoreHand(hand, win);

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
      special: ['fromFlowerWall'],
    };

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'flower', points: 2 },
      { name: 'pairOf258', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'winFromFlowerWall', points: 1 },
      { name: 'secretKong', points: 2 },
    ]);
    expect(result.handValue).toBe(7);
    expect(result.scores).toEqual({ A: -7, B: -7, C: 22, D: -8 });
  });

  it('Hand 10 — pure, hidden treasure (28 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'littleAndBigPong', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'pure', points: 8 },
      { name: 'hiddenTreasure', points: 16 },
    ]);
    expect(result.handValue).toBe(28);
    expect(result.scores).toEqual({ A: -29, B: 85, C: -28, D: -28 });
  });

  it('Hand 11 — 1-9 chain, split kong, clean doorstep (10 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'missingSuit', points: 1 },
      { name: 'splitKong', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'oneToNineTrain', points: 3 },
    ]);
    expect(result.handValue).toBe(10);
    expect(result.scores).toEqual({ A: -10, B: 0, C: 0, D: 10 });
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'missingSuit', points: 1 },
      { name: 'allFromOthers', points: 1 },
      { name: 'threeConsecutivePongs', points: 4 },
      { name: 'no19sNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(11);
    expect(result.scores).toEqual({ A: 0, B: 0, C: 11, D: -11 });
  });

  it('Hand 13 — terminals & honors, all pongs, dealer discard win (14 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'semi19sPongs', points: 12 },
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'littleDragons', points: 8 },
    ]);
    expect(result.handValue).toBe(8);
    expect(result.scores).toEqual({ A: 8, B: -8, C: 0, D: 0 });
  });

  it('Hand 15 — three suit chow, double chow, all chows, clean doorstep (11 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'doubleChow', points: 1 },
      { name: 'threeSuitChow', points: 4 },
      { name: 'no19sNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(11);
    expect(result.scores).toEqual({ A: 12, B: 0, C: 0, D: -12 });
  });

  it('Hand 16 — all 1s/9s, three suit pongs, dealer extra round 4 (22 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'pure19sPongs', points: 16 },
      { name: 'threeSuitPongs', points: 4 },
    ]);
    expect(result.handValue).toBe(22);
    expect(result.scores).toEqual({ A: -31, B: 75, C: -22, D: -22 });
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'no19sWithHonors', points: 1 },
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

    const result = scoreHand(hand, win);

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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'no19sWithHonors', points: 1 },
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allHonors', points: 12 },
    ]);
    expect(result.handValue).toBe(13);
    expect(result.scores).toEqual({ A: 0, B: 0, C: 13, D: -13 });
  });

  it('all honors with a flower — allHonors still fires, absorbs set-level variants', () => {
    // Regression: a bonus flower meld must not prevent allHonors from firing,
    // otherwise semiMixed19s / no19sWithHonors / windPong /
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

    const result = scoreHand(hand, discardWin);

    expect(result.appliedRules).toEqual([
      { name: 'flower', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'littleDragons', points: 8 },
      { name: 'allHonors', points: 12 },
    ]);
    expect(result.handValue).toBe(22);
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'selfPick', points: 1 },
      { name: 'allPairs', points: 12 },
    ]);
    expect(result.handValue).toBe(13);
    expect(result.scores).toEqual({ A: -13, B: 40, C: -13, D: -14 });
  });

  it('Hand 22 — thirteen orphans, dealer self-pick (18 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'thirteenOrphans', points: 16 },
    ]);
    expect(result.handValue).toBe(18);
    expect(result.scores).toEqual({ A: 57, B: -19, C: -19, D: -19 });
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(3);
  });

  // --- canOnlyWinWithOne: pair waits that look single but aren't, due to alternate chow decomposition ---

  it.each([
    {
      name: 'staircase 2b-3b-3b-4b-4b-5b-5b winning on 2b — also wins on 5b, no single-wait bonus (9 pts)',
      chows: [['3b', '4b', '5b'], ['3b', '4b', '5b']],
      pair: '2b',
      expected: [
        { name: 'windPong', points: 2 },
        { name: 'pairOf258', points: 1 },
        { name: 'no19sWithHonors', points: 1 },
        { name: 'doubleChow', points: 1 },
        { name: 'semiPure', points: 4 },
      ],
      total: 9,
    },
    {
      name: 'staircase 2b-3b-3b-4b-4b-5b-5b winning on 5b — also wins on 2b, no single-wait bonus (8 pts)',
      chows: [['2b', '3b', '4b'], ['3b', '4b', '5b']],
      pair: '5b',
      expected: [
        { name: 'windPong', points: 2 },
        { name: 'pairOf258', points: 1 },
        { name: 'no19sWithHonors', points: 1 },
        { name: 'semiPure', points: 4 },
      ],
      total: 8,
    },
    {
      name: 'staircase 6b-7b-7b-8b-8b-9b-9b winning on 6b — also wins via shifted chow, no single-wait bonus (7 pts)',
      chows: [['7b', '8b', '9b'], ['7b', '8b', '9b']],
      pair: '6b',
      expected: [
        { name: 'windPong', points: 2 },
        { name: 'doubleChow', points: 1 },
        { name: 'semiPure', points: 4 },
      ],
      total: 7,
    },
  ])('$name', ({ chows, pair, expected, total }) => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['Sw', 'Sw', 'Sw'], concealed: false },
        { type: 'chow', tiles: chows[0], concealed: true },
        { type: 'chow', tiles: chows[1], concealed: true },
        { type: 'pair', tiles: [pair, pair], concealed: true, winTile: pair },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual(expected);
    expect(result.handValue).toBe(total);
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
    const result = scoreHand(hand, discardWin);

    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
    ]);
    expect(result.handValue).toBe(3);
  });

  it('Hand 24 — 2 kong mahjong declared, win after two consecutive kongs (14 pts)', () => {
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
      special: ['twoKongMahjong'],
    };

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'kong', points: 2 },
      { name: 'twoKongMahjong', points: 8 },
      { name: 'no19sNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(14);
    expect(result.scores).toEqual({ A: 14, B: -14, C: 0, D: 0 });
  });

  it('two kongs in hand without the declaration is NOT 2 kong mahjong (6 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'kong', points: 2 },
      { name: 'no19sNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(6);
    expect(result.scores).toEqual({ A: 6, B: -6, C: 0, D: 0 });
  });

  it('Hand 23 — two double chows, clean doorstep (19 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'twoDoubleChows', points: 12 },
    ]);
    expect(result.handValue).toBe(19);
    expect(result.scores).toEqual({ A: 0, B: 0, C: -19, D: 19 });
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

    const result = scoreHand(hand, win);

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

    const result = scoreHand(hand, win);

    expect(result.appliedRules.find(r => r.name === 'heavenlyGates')).toEqual(
      { name: 'heavenlyGates', points: 16 },
    );
  });

  it('Hand 26 — heavenly hand, dealer wins on deal (25 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'heavenlyHand', points: 24 },
    ]);
    expect(result.handValue).toBe(25);
    expect(result.scores).toEqual({ A: 78, B: -26, C: -26, D: -26 });
  });

  it('Hand 26b — heavenly hand, NON-dealer self-draw on their first turn (25 pts)', () => {
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
      winner: 'B',
      method: 'self-pick',
      dealer: 'A',
      dealerRounds: 1,
      special: ['firstTurn'],
    };

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'heavenlyHand', points: 24 },
    ]);
    expect(result.handValue).toBe(25);
    expect(result.scores).toEqual({ A: -26, B: 76, C: -25, D: -25 });
  });

  it('heavenly hand absorbs prodigy — winning on your first turn implies ready (25 pts)', () => {
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
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'self-pick',
      dealer: 'A', dealerRounds: 1, special: ['firstTurn', 'prodigy'],
    };
    const result = scoreHand(hand, win);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'heavenlyHand', points: 24 },
    ]);
    expect(result.handValue).toBe(25);
    expect(result.scores).toEqual({ A: 78, B: -26, C: -26, D: -26 });
  });

  it('earthly hand absorbs prodigy (18 pts)', () => {
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
      players: ['A', 'B', 'C', 'D'], winner: 'D', method: 'discard', from: 'A',
      dealer: 'C', dealerRounds: 1, special: ['firstTurn', 'prodigy'],
    };
    const result = scoreHand(hand, win);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'earthlyHand', points: 16 },
    ]);
    expect(result.handValue).toBe(18);
    expect(result.scores).toEqual({ A: -18, B: 0, C: 0, D: 18 });
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'earthlyHand', points: 16 },
    ]);
    expect(result.handValue).toBe(18);
    expect(result.scores).toEqual({ A: -19, B: 19, C: 0, D: 0 });
  });

  it('Hand 28 — big winds (17 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'bigWinds', points: 16 },
    ]);
    expect(result.handValue).toBe(17);
    expect(result.scores).toEqual({ A: -17, B: 0, C: 0, D: 17 });
  });

  it('Hand 29 — all kongs, secret kong, win from the flower wall (28 pts)', () => {
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
      special: ['fromFlowerWall'],
    };

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'winFromFlowerWall', points: 1 },
      { name: 'kong', points: 3 },
      { name: 'secretKong', points: 2 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'allKongs', points: 16 },
    ]);
    expect(result.handValue).toBe(28);
    expect(result.scores).toEqual({ A: -29, B: 85, C: -28, D: -28 });
  });

  it('Hand 30 — prodigy hand, clean doorstep (19 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'littleAndBigChow', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'prodigyHand', points: 12 },
    ]);
    expect(result.handValue).toBe(19);
    expect(result.scores).toEqual({ A: 0, B: 0, C: 19, D: -19 });
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

    const result = scoreHand(hand, win);

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

    const result = scoreHand(hand, win);

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

    const result = scoreHand(hand, win);

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

  it.each(PURITY_DRAGONS)('$name Dragon fires with a pong of the matching dragon', ({ rule, dragon, suit }) => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: [dragon, dragon, dragon], concealed: false },
        { type: 'pong', tiles: [`2${suit}`, `2${suit}`, `2${suit}`], concealed: false },
        { type: 'chow', tiles: [`4${suit}`, `5${suit}`, `6${suit}`], concealed: true },
        { type: 'chow', tiles: [`7${suit}`, `8${suit}`, `9${suit}`], concealed: true },
        { type: 'pair', tiles: [`3${suit}`, `3${suit}`], concealed: true },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([{ name: rule, points: 12 }]);
    expect(result.handValue).toBe(12);
  });

  it.each(PURITY_DRAGONS)('$name Dragon does NOT fire when the dragon is only the pair', ({ dragon, suit }) => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: [`2${suit}`, `2${suit}`, `2${suit}`], concealed: false },
        { type: 'chow', tiles: [`4${suit}`, `5${suit}`, `6${suit}`], concealed: true },
        { type: 'chow', tiles: [`5${suit}`, `6${suit}`, `7${suit}`], concealed: true },
        { type: 'chow', tiles: [`6${suit}`, `7${suit}`, `8${suit}`], concealed: true },
        { type: 'pair', tiles: [dragon, dragon], concealed: true },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'no19sWithHonors', points: 1 },
      { name: 'semiPure', points: 4 },
    ]);
    expect(result.handValue).toBe(5);
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
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'allChows', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'twoDoubleChows', points: 12 },
      { name: 'pure', points: 8 },
    ]);
    expect(result.handValue).toBe(25);
  });

  it.each(PURITY_DRAGONS)('$name Dragon hand scores 13 flat — dragon pong, semi-pure and pure folded in', ({ rule, dragon, suit }) => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: [dragon, dragon, dragon], concealed: false },
        { type: 'pong', tiles: [`3${suit}`, `3${suit}`, `3${suit}`], concealed: false },
        { type: 'pong', tiles: [`6${suit}`, `6${suit}`, `6${suit}`], concealed: false },
        { type: 'chow', tiles: [`7${suit}`, `8${suit}`, `9${suit}`], concealed: true },
        { type: 'pair', tiles: [`5${suit}`, `5${suit}`], concealed: true },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: rule, points: 12 },
    ]);
    expect(result.handValue).toBe(13);
  });

  it('all 1s/9s with honors — every tile is terminal or honor (14 pts total)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'semi19sPongs', points: 12 },
    ]);
    expect(result.handValue).toBe(14);
  });

  it('doubled 123+789 chows — pure mixed 1/9 stacks with two double chows and little and big chow (38 pts)', () => {
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'splitKong', points: 1 },
      { name: 'littleAndBigChow', points: 3 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'twoDoubleChows', points: 12 },
      { name: 'pureMixed19s', points: 8 },
      { name: 'pure', points: 8 },
    ]);
    expect(result.handValue).toBe(38);
  });

  // --- Little and Big Chow / Pong ---

  it('little and big chow — 123 and 789 of the same suit (1 pt)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: false },
        { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true },
        { type: 'pong', tiles: ['5d', '5d', '5d'], concealed: false },
        { type: 'chow', tiles: ['2c', '3c', '4c'], concealed: true, winTile: '2c' },
        { type: 'pair', tiles: ['6d', '6d'], concealed: true },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'littleAndBigChow', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(4);
  });

  it('little and big chow doubled-set footnote — 123, 123, 789 scores 2 plus double chow', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: false },
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: false },
        { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true },
        { type: 'pong', tiles: ['5d', '5d', '5d'], concealed: false, winTile: '5d' },
        { type: 'pair', tiles: ['6c', '6c'], concealed: true },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'doubleChow', points: 1 },
      { name: 'littleAndBigChow', points: 2 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(6);
  });

  it('123 and 789 in different suits is NOT little and big chow (3 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: false },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true },
        { type: 'pong', tiles: ['4c', '4c', '4c'], concealed: false },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true, winTile: '4b' },
        { type: 'pair', tiles: ['6d', '6d'], concealed: true },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(3);
  });

  it('a full 1-9 train scores the train alone, not train plus little and big chow (7 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: false },
        { type: 'chow', tiles: ['4d', '5d', '6d'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true },
        { type: 'pong', tiles: ['3b', '3b', '3b'], concealed: false, winTile: '3b' },
        { type: 'pair', tiles: ['8c', '8c'], concealed: true },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'oneToNineTrain', points: 3 },
    ]);
    expect(result.handValue).toBe(7);
  });

  it('doubled train leg — 123, 123, 456, 789 awards the duplicate point (11 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: true },
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: true },
        { type: 'chow', tiles: ['4d', '5d', '6d'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '7d' },
        { type: 'pair', tiles: ['3b', '3b'], concealed: false },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'missingSuit', points: 1 },
      { name: 'doubleChow', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'oneToNineTrain', points: 4 },
    ]);
    expect(result.handValue).toBe(11);
    expect(result.scores).toEqual({ A: 11, B: -11, C: 0, D: 0 });
  });

  it('little and big pong — pongs of 1s and 9s of the same suit (1 pt)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1c', '1c', '1c'], concealed: false },
        { type: 'pong', tiles: ['9c', '9c', '9c'], concealed: false },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true, winTile: '4b' },
        { type: 'pong', tiles: ['6d', '6d', '6d'], concealed: false },
        { type: 'pair', tiles: ['3d', '3d'], concealed: true },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'littleAndBigPong', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(4);
  });

  it('little and big pong counts kongs as pongs', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['1c', '1c', '1c', '1c'], concealed: false },
        { type: 'pong', tiles: ['9c', '9c', '9c'], concealed: false },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true, winTile: '4b' },
        { type: 'pong', tiles: ['6d', '6d', '6d'], concealed: false },
        { type: 'pair', tiles: ['3d', '3d'], concealed: true },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'kong', points: 1 },
      { name: 'littleAndBigPong', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(5);
  });

  it('pongs of 1s and 9s in different suits is NOT little and big pong (4 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1b', '1b', '1b'], concealed: false },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: false },
        { type: 'chow', tiles: ['2c', '3c', '4c'], concealed: true, winTile: '2c' },
        { type: 'pong', tiles: ['5c', '5c', '5c'], concealed: false },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(4);
  });

  it('little and big pong fires once per completed suit (2 suits = 2 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1b', '1b', '1b'], concealed: false },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: false },
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: false },
        { type: 'pair', tiles: ['5c', '5c'], concealed: true, winTile: '5c' },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allPongs', points: 4 },
      { name: 'littleAndBigPong', points: 2 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(11);
  });

  it('pure 1s/9s pongs hand scores 21 — little and big pong and all pongs folded into the 16', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: false },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: false },
        { type: 'pong', tiles: ['9c', '9c', '9c'], concealed: false },
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'pair', tiles: ['1c', '1c'], concealed: true, winTile: '1c' },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'pure19sPongs', points: 16 },
      { name: 'threeSuitPongs', points: 4 },
    ]);
    expect(result.handValue).toBe(21);
  });

  it('heavenly gates hand scores 16 flat on a discard win', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'chow', tiles: ['2d', '3d', '4d'], concealed: true },
        { type: 'chow', tiles: ['6d', '7d', '8d'], concealed: true },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: true },
        { type: 'pair', tiles: ['5d', '5d'], concealed: true, winTile: '5d' },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'heavenlyGates', points: 16 },
    ]);
    expect(result.handValue).toBe(16);
  });

  it('big winds with a terminal pair is NOT semi 1s/9s pongs — the pair is not a pong (17 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['Sw', 'Sw', 'Sw'], concealed: false },
        { type: 'pong', tiles: ['Ww', 'Ww', 'Ww'], concealed: false },
        { type: 'pong', tiles: ['Nw', 'Nw', 'Nw'], concealed: true },
        { type: 'pair', tiles: ['1b', '1b'], concealed: true, winTile: '1b' },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'bigWinds', points: 16 },
    ]);
    expect(result.handValue).toBe(17);
  });

  it('big winds with a dragon pair stacks all honors (29 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pong', tiles: ['Sw', 'Sw', 'Sw'], concealed: false },
        { type: 'pong', tiles: ['Ww', 'Ww', 'Ww'], concealed: false },
        { type: 'pong', tiles: ['Nw', 'Nw', 'Nw'], concealed: true },
        { type: 'pair', tiles: ['Rd', 'Rd'], concealed: true, winTile: 'Rd' },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'bigWinds', points: 16 },
      { name: 'allHonors', points: 12 },
    ]);
    expect(result.handValue).toBe(29);
  });

  it('chows covering 1-9 without the exact 123/456/789 legs are NOT a train (7 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: true },
        { type: 'chow', tiles: ['2d', '3d', '4d'], concealed: true },
        { type: 'chow', tiles: ['5d', '6d', '7d'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '7d' },
        { type: 'pair', tiles: ['3b', '3b'], concealed: false },
      ],
    };
    const result = scoreHand(hand, discardWin);
    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'missingSuit', points: 1 },
      { name: 'littleAndBigChow', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(7);
  });


  it('hidden treasure — four hidden pongs AND self-drawn (20 pts total)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['2b', '2b', '2b'], concealed: true },
        { type: 'pong', tiles: ['5d', '5d', '5d'], concealed: true },
        { type: 'pong', tiles: ['7c', '7c', '7c'], concealed: true },
        { type: 'pong', tiles: ['3d', '3d', '3d'], concealed: true, winTile: '3d' },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'B', method: 'self-pick',
      dealer: 'A', dealerRounds: 1, special: [],
    };
    const result = scoreHand(hand, win);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'hiddenTreasure', points: 16 },
      { name: 'no19sNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(20);
    expect(result.scores).toEqual({ A: -21, B: 61, C: -20, D: -20 });
  });

  it('same four-pong shape won by discard is NOT hidden treasure (13 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['2b', '2b', '2b'], concealed: true },
        { type: 'pong', tiles: ['5d', '5d', '5d'], concealed: true },
        { type: 'pong', tiles: ['7c', '7c', '7c'], concealed: true },
        { type: 'pong', tiles: ['3d', '3d', '3d'], concealed: true, winTile: '3d' },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'B', method: 'discard', from: 'C',
      dealer: 'A', dealerRounds: 1, special: [],
    };
    const result = scoreHand(hand, win);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'allPongs', points: 4 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'threeHiddenPongs', points: 4 },
      { name: 'no19sNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(13);
    expect(result.scores).toEqual({ A: 0, B: 13, C: -13, D: 0 });
  });

  it('four hidden kongs, self-drawn — secret kongs score as plain kongs (40 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['2b', '2b', '2b', '2b'], concealed: true },
        { type: 'kong', tiles: ['5d', '5d', '5d', '5d'], concealed: true },
        { type: 'kong', tiles: ['7c', '7c', '7c', '7c'], concealed: true },
        { type: 'kong', tiles: ['3d', '3d', '3d', '3d'], concealed: true },
        { type: 'pair', tiles: ['6b', '6b'], concealed: true, winTile: '6b' },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'B', method: 'self-pick',
      dealer: 'A', dealerRounds: 1, special: [],
    };
    const result = scoreHand(hand, win);
    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'kong', points: 4 },
      { name: 'hiddenTreasure', points: 16 },
      { name: 'no19sNoHonors', points: 3 },
      { name: 'allKongs', points: 16 },
    ]);
    expect(result.handValue).toBe(40);
    expect(result.scores).toEqual({ A: -41, B: 121, C: -40, D: -40 });
  });

  it('four hidden kongs by discard — four hidden pongs, no hidden treasure (37 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['2b', '2b', '2b', '2b'], concealed: true },
        { type: 'kong', tiles: ['5d', '5d', '5d', '5d'], concealed: true },
        { type: 'kong', tiles: ['7c', '7c', '7c', '7c'], concealed: true },
        { type: 'kong', tiles: ['3d', '3d', '3d', '3d'], concealed: true },
        { type: 'pair', tiles: ['6b', '6b'], concealed: true, winTile: '6b' },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'B', method: 'discard', from: 'C',
      dealer: 'A', dealerRounds: 1, special: [],
    };
    const result = scoreHand(hand, win);
    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'kong', points: 4 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'fourHiddenPongs', points: 12 },
      { name: 'no19sNoHonors', points: 3 },
      { name: 'allKongs', points: 16 },
    ]);
    expect(result.handValue).toBe(37);
    expect(result.scores).toEqual({ A: 0, B: 37, C: -37, D: 0 });
  });

  it('hidden wind kong inside hidden treasure scores as exposed kong of honor (20 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['2b', '2b', '2b'], concealed: true },
        { type: 'pong', tiles: ['5d', '5d', '5d'], concealed: true },
        { type: 'kong', tiles: ['Ww', 'Ww', 'Ww', 'Ww'], concealed: true },
        { type: 'pong', tiles: ['7c', '7c', '7c'], concealed: true, winTile: '7c' },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'B', method: 'self-pick',
      dealer: 'A', dealerRounds: 1, special: [],
    };
    const result = scoreHand(hand, win);
    expect(result.appliedRules).toEqual([
      { name: 'windKong', points: 2 },
      { name: 'pairOf258', points: 1 },
      { name: 'no19sWithHonors', points: 1 },
      { name: 'hiddenTreasure', points: 16 },
    ]);
    expect(result.handValue).toBe(20);
    expect(result.scores).toEqual({ A: -21, B: 61, C: -20, D: -20 });
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'splitKong', points: 1 },
      { name: 'doubleChow', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(7);
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'splitKong', points: 1 },
      { name: 'doubleChow', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'oneToNineTrain', points: 4 },
      { name: 'pure', points: 8 },
    ]);
    expect(result.handValue).toBe(20);
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

    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'doubleChow', points: 1 },
      { name: 'threeSuitChow', points: 4 },
      { name: 'no19sNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(11);
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'thirteenOrphans', points: 16 },
    ]);
    expect(result.handValue).toBe(17);
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'selfPick', points: 1 },
      { name: 'threeSuitsWithWindAndDragon', points: 1 },
      { name: 'allPairs', points: 12 },
    ]);
    expect(result.handValue).toBe(14);
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'secretKong', points: 2 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'pure', points: 8 },
    ]);
    expect(result.handValue).toBe(16);
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'pure', points: 8 },
      { name: 'allPairs', points: 12 },
    ]);
    expect(result.handValue).toBe(23);
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'dragonPong', points: 1 },
      { name: 'windPong', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'threeSuitsWithWindAndDragon', points: 1 },
    ]);
    expect(result.handValue).toBe(4);
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'dragonPong', points: 1 },
      { name: 'windPong', points: 1 },
      { name: 'threeSuitsWithWindAndDragon', points: 1 },
    ]);
    expect(result.handValue).toBe(3);
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'flower', points: 4 },
      { name: 'windPong', points: 1 },
      { name: 'pairOf258', points: 1 },
      { name: 'no19sWithHonors', points: 1 },
      { name: 'cleanDoorstepAndSelfPick', points: 3 },
    ]);
    expect(result.handValue).toBe(10);
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'kong', points: 1 },
      { name: 'no19sNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(5);
  });

  it('discard win keeps clean doorstep but exposes the winning meld for hidden-pong scoring', () => {
    const hand: Hand = {
      melds: [
        // Winning pong completed by the discard: NOT a hidden pong, but the door stays clean.
        { type: 'pong', tiles: ['2d', '2d', '2d'], concealed: true, winTile: '2d' },
        { type: 'pong', tiles: ['6d', '6d', '6d'], concealed: true },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: true },
        { type: 'chow', tiles: ['4c', '5c', '6c'], concealed: true },
        { type: 'pair', tiles: ['8c', '8c'], concealed: true },
      ],
    };
    const win: Win = {
      players: ['A', 'B', 'C', 'D'], winner: 'A', method: 'discard',
      from: 'D', dealer: 'B', dealerRounds: 1, special: [],
    };
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(5);
  });

  it('exposed wind kong fires windKong (2 pts) without stacking generic kong bonus', () => {
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'windKong', points: 2 },
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allPongs', points: 4 },
      { name: 'no19sWithHonors', points: 1 },
      { name: 'allFromOthers', points: 1 },
      { name: 'bigDragons', points: 12 },
      { name: 'semiPure', points: 4 },
    ]);
    expect(result.handValue).toBe(26);
  });

  it('exposed dragon kong fires dragonKong (2 pts) without stacking generic kong bonus', () => {
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'dragonKong', points: 2 },
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'selfPick', points: 1 },
    ]);
    expect(result.handValue).toBe(5);
  });

  it('hidden dragon kong fires dragonSecretKong (3 pts)', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['Gd', 'Gd', 'Gd', 'Gd'], concealed: true },
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
    const result = scoreHand(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'dragonSecretKong', points: 3 },
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'cleanDoorstepAndSelfPick', points: 3 },
    ]);
    expect(result.handValue).toBe(8);
  });
});

describe('honor component constants', () => {
  it('DRAGON_COMPONENTS covers the per-meld dragon rules', () => {
    expect(DRAGON_COMPONENTS).toEqual(['dragonPong', 'dragonKong', 'dragonSecretKong']);
  });

  it('WIND_COMPONENTS covers the per-meld wind rules', () => {
    expect(WIND_COMPONENTS).toEqual(['windPong', 'windKong', 'windSecretKong']);
  });

  it('HONOR_COMPONENTS is the union of dragon + wind components', () => {
    expect(HONOR_COMPONENTS).toEqual([...DRAGON_COMPONENTS, ...WIND_COMPONENTS]);
  });
});
