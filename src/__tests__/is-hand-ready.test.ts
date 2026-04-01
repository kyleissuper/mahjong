import { describe, it, expect } from 'vitest';
import { isHandReady } from '../validate-hand.js';
import type { Hand } from '../types.js';

describe('isHandReady', () => {
  it('standard hand: 4 sets + 1 pair', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(true);
  });

  it('not ready: 3 sets + 1 pair', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('not ready: 4 sets, no pair', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('not ready: empty hand', () => {
    expect(isHandReady({ melds: [] })).toBe(false);
  });

  it('with kong: 3 sets + 1 kong + 1 pair', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true },
        { type: 'kong', tiles: ['Rd', 'Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(true);
  });

  it('with flowers: flowers do not count toward sets', () => {
    const hand: Hand = {
      melds: [
        { type: 'flower', tiles: ['F', 'F'], concealed: false },
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(true);
  });

  it('flowers alone are not ready', () => {
    const hand: Hand = {
      melds: [
        { type: 'flower', tiles: ['F', 'F', 'F'], concealed: false },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('all pairs: 7 pairs', () => {
    const hand: Hand = {
      melds: [
        { type: 'pair', tiles: ['2b', '2b'], concealed: true },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
        { type: 'pair', tiles: ['9b', '9b'], concealed: true },
        { type: 'pair', tiles: ['3d', '3d'], concealed: true },
        { type: 'pair', tiles: ['7d', '7d'], concealed: true },
        { type: 'pair', tiles: ['Ew', 'Ew'], concealed: true },
        { type: 'pair', tiles: ['Rd', 'Rd'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(true);
  });

  it('not ready: 6 pairs', () => {
    const hand: Hand = {
      melds: [
        { type: 'pair', tiles: ['2b', '2b'], concealed: true },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
        { type: 'pair', tiles: ['9b', '9b'], concealed: true },
        { type: 'pair', tiles: ['3d', '3d'], concealed: true },
        { type: 'pair', tiles: ['7d', '7d'], concealed: true },
        { type: 'pair', tiles: ['Ew', 'Ew'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('thirteen orphans', () => {
    const hand: Hand = {
      melds: [
        {
          type: 'orphans',
          tiles: ['1b', '9b', '1d', '9d', '1c', '9c', 'Ew', 'Sw', 'Ww', 'Nw', 'Rd', 'Gd', 'Wd', '1b'],
          concealed: true,
        },
      ],
    };
    expect(isHandReady(hand)).toBe(true);
  });
});
