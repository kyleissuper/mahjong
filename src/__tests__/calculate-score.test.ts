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
      firstTurn: false,
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'selfPick', points: 1 },
      { name: 'only2Suits', points: 1 },
      { name: 'noTerminalsNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(8);
    expect(result.scores).toEqual({ A: 25, B: -9, C: -8, D: -8 });
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
      firstTurn: false,
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
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allPongs', points: 4 },
      { name: 'selfPick', points: 1 },
      { name: 'allGreens', points: 14 },
    ]);
    expect(result.handValue).toBe(20);
    expect(result.scores).toEqual({ A: 63, B: -21, C: -21, D: -21 });
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
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'oneToNineChain', points: 3 },
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
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
      fromButt: true,
      lastTile: false,
      firstTurn: false,
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
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'cleanDoorstepAndSelfPick', points: 3 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'pure', points: 8 },
      { name: 'fourHiddenPongs', points: 12 },
    ]);
    expect(result.handValue).toBe(27);
    expect(result.scores).toEqual({ A: -28, B: 82, C: -27, D: -27 });
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'only2Suits', points: 1 },
      { name: 'splitKong', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'noFlowersNoHonors', points: 3 },
      { name: 'oneToNineChain', points: 3 },
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allPongs', points: 4 },
      { name: 'terminalsAndHonors', points: 4 },
    ]);
    expect(result.handValue).toBe(10);
    expect(result.scores).toEqual({ A: 0, B: 11, C: -11, D: 0 });
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'littleDragons', points: 8 },
    ]);
    expect(result.handValue).toBe(8);
    expect(result.scores).toEqual({ A: 8, B: -8, C: 0, D: 0 });
  });

  it('Hand 15 — three suit chow, double chow, all chows (11 pts)', () => {
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'allChows', points: 1 },
      { name: 'cleanDoorstep', points: 1 },
      { name: 'doubleChow', points: 1 },
      { name: 'threeSuitChow', points: 4 },
      { name: 'noTerminalsNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(11);
    expect(result.scores).toEqual({ A: 12, B: 0, C: 0, D: -12 });
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allPongs', points: 4 },
      { name: 'selfPick', points: 1 },
      { name: 'all1sOr9s', points: 16 },
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allHonors', points: 12 },
    ]);
    expect(result.handValue).toBe(13);
    expect(result.scores).toEqual({ A: 0, B: 0, C: 13, D: -13 });
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'selfPick', points: 1 },
      { name: 'allPairs', points: 12 },
    ]);
    expect(result.handValue).toBe(13);
    expect(result.scores).toEqual({ A: -13, B: 40, C: -13, D: -14 });
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules.find(r => r.name === 'canOnlyWinWithOne')).toBeUndefined();
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'allFromOthers', points: 1 },
      { name: 'twoKongMahjong', points: 6 },
      { name: 'noTerminalsNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(11);
    expect(result.scores).toEqual({ A: 11, B: -11, C: 0, D: 0 });
  });

  it('Hand 23 — two double chows (16 pts)', () => {
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
    };

    const result = calculateScore(hand, win);

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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
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
      fromButt: false,
      lastTile: false,
      firstTurn: false,
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
      fromButt: false,
      lastTile: false,
      firstTurn: true,
    };

    const result = calculateScore(hand, win);

    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'heavenlyHand', points: 20 },
    ]);
    expect(result.handValue).toBe(21);
    expect(result.scores).toEqual({ A: 66, B: -22, C: -22, D: -22 });
  });
});
