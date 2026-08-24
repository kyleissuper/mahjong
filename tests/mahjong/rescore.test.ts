import { describe, it, expect } from 'vitest';
import { rescoreStoredHand, type StoredHandRow } from '../../src/mahjong/rescore.ts';

describe('rescoreStoredHand', () => {
  it('rescoring the all-greens jade hand matches the current engine (19 -> 18)', () => {
    const row: StoredHandRow = {
      melds: [
        { type: 'pong', tiles: ['1b', '1b', '1b'], concealed: true },
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: false },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: false },
        { type: 'pong', tiles: ['Gd', 'Gd', 'Gd'], concealed: false },
        { type: 'pair', tiles: ['3b', '3b'], concealed: true, winTile: '3b' },
      ],
      method: 'self-pick',
      winnerId: 'A',
      handValue: 19,
      appliedRules: [
        { name: 'allPongs', points: 4 },
        { name: 'selfPick', points: 1 },
        { name: 'jadeDragon', points: 14 },
      ],
      scores: { A: 60, B: -20, C: -20, D: -20 },
    };
    const result = rescoreStoredHand(row);
    expect(result.appliedRules).toEqual([
      { name: 'allPongs', points: 4 },
      { name: 'selfPick', points: 1 },
      { name: 'littleAndBigPong', points: 1 },
      { name: 'jadeDragon', points: 12 },
    ]);
    expect(result.handValue).toBe(18);
    expect(result.scores).toEqual({ A: 57, B: -19, C: -19, D: -19 });
  });

  it('discard win with an uninvolved dealer keeps zero scores at zero (14 -> 19)', () => {
    const row: StoredHandRow = {
      melds: [
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: false },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: false },
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'pair', tiles: ['Wd', 'Wd'], concealed: true, winTile: 'Wd' },
      ],
      method: 'discard',
      winnerId: 'B',
      handValue: 14,
      appliedRules: [
        { name: 'windPong', points: 1 },
        { name: 'canOnlyWinWithOne', points: 1 },
        { name: 'allPongs', points: 4 },
        { name: 'semi19sPongs', points: 8 },
      ],
      scores: { A: 0, B: 15, C: -15, D: 0 },
    };
    const result = rescoreStoredHand(row);
    expect(result.appliedRules).toEqual([
      { name: 'windPong', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'allPongs', points: 4 },
      { name: 'littleAndBigPong', points: 1 },
      { name: 'semi19sPongs', points: 12 },
    ]);
    expect(result.handValue).toBe(19);
    expect(result.scores).toEqual({ A: 0, B: 20, C: -20, D: 0 });
  });

  it('a stored heavenly hand recovers the first-turn special (21 -> 25)', () => {
    const row: StoredHandRow = {
      melds: [
        { type: 'pong', tiles: ['3b', '3b', '3b'], concealed: true },
        { type: 'pong', tiles: ['7d', '7d', '7d'], concealed: true },
        { type: 'chow', tiles: ['4c', '5c', '6c'], concealed: true },
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: true },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true },
      ],
      method: 'self-pick',
      winnerId: 'A',
      handValue: 21,
      appliedRules: [
        { name: 'pairOf258', points: 1 },
        { name: 'heavenlyHand', points: 20 },
      ],
      scores: { A: 66, B: -22, C: -22, D: -22 },
    };
    const result = rescoreStoredHand(row);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'heavenlyHand', points: 24 },
    ]);
    expect(result.handValue).toBe(25);
    expect(result.scores).toEqual({ A: 78, B: -26, C: -26, D: -26 });
  });

  it('a stored two-kong hand loses the bonus — the event is assumed not to have happened (12 -> 6)', () => {
    const row: StoredHandRow = {
      melds: [
        { type: 'kong', tiles: ['3b', '3b', '3b', '3b'], concealed: false },
        { type: 'kong', tiles: ['7c', '7c', '7c', '7c'], concealed: false },
        { type: 'chow', tiles: ['4d', '5d', '6d'], concealed: false, winTile: '6d' },
        { type: 'pong', tiles: ['2d', '2d', '2d'], concealed: false },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true },
      ],
      method: 'discard',
      winnerId: 'A',
      handValue: 12,
      appliedRules: [
        { name: 'pairOf258', points: 1 },
        { name: 'kong', points: 2 },
        { name: 'twoKongMahjong', points: 6 },
        { name: 'no19sNoHonors', points: 3 },
      ],
      scores: { A: 12, B: -12, C: 0, D: 0 },
    };
    const result = rescoreStoredHand(row);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'kong', points: 2 },
      { name: 'no19sNoHonors', points: 3 },
    ]);
    expect(result.handValue).toBe(6);
    expect(result.scores).toEqual({ A: 6, B: -6, C: 0, D: 0 });
  });

  it('a stored earthly hand keeps the winner off the dealer seat (18 pts unchanged)', () => {
    const row: StoredHandRow = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true, winTile: '2b' },
        { type: 'pong', tiles: ['6d', '6d', '6d'], concealed: true },
        { type: 'chow', tiles: ['4c', '5c', '6c'], concealed: true },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: true },
        { type: 'pair', tiles: ['5d', '5d'], concealed: true },
      ],
      method: 'discard',
      winnerId: 'D',
      handValue: 18,
      appliedRules: [
        { name: 'pairOf258', points: 1 },
        { name: 'canOnlyWinWithOne', points: 1 },
        { name: 'earthlyHand', points: 16 },
      ],
      scores: { A: -18, B: 0, C: 0, D: 18 },
    };
    const result = rescoreStoredHand(row);
    expect(result.appliedRules).toEqual([
      { name: 'pairOf258', points: 1 },
      { name: 'canOnlyWinWithOne', points: 1 },
      { name: 'earthlyHand', points: 16 },
    ]);
    expect(result.handValue).toBe(18);
    expect(result.scores).toEqual({ A: -18, B: 0, C: 0, D: 18 });
  });

  it('rejects a row whose stored payment is inconsistent with its hand value', () => {
    const row: StoredHandRow = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true, winTile: '2b' },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['4c', '5c', '6c'], concealed: true },
        { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: true },
        { type: 'pair', tiles: ['5d', '5d'], concealed: true },
      ],
      method: 'discard',
      winnerId: 'D',
      handValue: 18,
      appliedRules: [{ name: 'cleanDoorstep', points: 1 }],
      scores: { A: -12, B: 0, C: 0, D: 12 },
    };
    expect(() => rescoreStoredHand(row)).toThrow(/inconsistent/);
  });
});
