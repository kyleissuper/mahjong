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

  it('not ready: 5 sets + 1 pair is too many', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pong', tiles: ['Gd', 'Gd', 'Gd'], concealed: false },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('not ready: 4 sets + 2 pairs', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
        { type: 'pair', tiles: ['3d', '3d'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('all kongs + pair', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['1b', '1b', '1b', '1b'], concealed: true },
        { type: 'kong', tiles: ['5d', '5d', '5d', '5d'], concealed: false },
        { type: 'kong', tiles: ['9c', '9c', '9c', '9c'], concealed: true },
        { type: 'kong', tiles: ['Rd', 'Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pair', tiles: ['Ew', 'Ew'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(true);
  });

  it('mixed kongs and sets + pair', () => {
    const hand: Hand = {
      melds: [
        { type: 'kong', tiles: ['5b', '5b', '5b', '5b'], concealed: true },
        { type: 'chow', tiles: ['1d', '2d', '3d'], concealed: true },
        { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: false },
        { type: 'chow', tiles: ['7c', '8c', '9c'], concealed: true },
        { type: 'pair', tiles: ['3b', '3b'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(true);
  });

  it('thirteen orphans + flowers is still ready', () => {
    const hand: Hand = {
      melds: [
        { type: 'flower', tiles: ['F', 'F'], concealed: false },
        {
          type: 'orphans',
          tiles: ['1b', '9b', '1d', '9d', '1c', '9c', 'Ew', 'Sw', 'Ww', 'Nw', 'Rd', 'Gd', 'Wd', '9c'],
          concealed: true,
        },
      ],
    };
    expect(isHandReady(hand)).toBe(true);
  });

  it('not ready: only pairs but fewer than 7', () => {
    const hand: Hand = {
      melds: [
        { type: 'pair', tiles: ['1b', '1b'], concealed: true },
        { type: 'pair', tiles: ['2b', '2b'], concealed: true },
        { type: 'pair', tiles: ['3b', '3b'], concealed: true },
        { type: 'pair', tiles: ['4b', '4b'], concealed: true },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('not ready: 8 pairs is too many', () => {
    const hand: Hand = {
      melds: [
        { type: 'pair', tiles: ['1b', '1b'], concealed: true },
        { type: 'pair', tiles: ['2b', '2b'], concealed: true },
        { type: 'pair', tiles: ['3b', '3b'], concealed: true },
        { type: 'pair', tiles: ['4b', '4b'], concealed: true },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
        { type: 'pair', tiles: ['6b', '6b'], concealed: true },
        { type: 'pair', tiles: ['7b', '7b'], concealed: true },
        { type: 'pair', tiles: ['8b', '8b'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('not ready: 4 sets + pair + stray orphans meld', () => {
    const hand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
        { type: 'pair', tiles: ['5b', '5b'], concealed: true },
        {
          type: 'orphans',
          tiles: ['1b', '9b', '1d', '9d', '1c', '9c', 'Ew', 'Sw', 'Ww', 'Nw', 'Rd', 'Gd', 'Wd', '1b'],
          concealed: true,
        },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('not ready: orphans meld mixed with other melds', () => {
    const hand: Hand = {
      melds: [
        {
          type: 'orphans',
          tiles: ['1b', '9b', '1d', '9d', '1c', '9c', 'Ew', 'Sw', 'Ww', 'Nw', 'Rd', 'Gd', 'Wd', '1b'],
          concealed: true,
        },
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: false },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('not ready: just one set', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });

  it('heavenly gates pattern: detected via melds not special type', () => {
    // 1112345678999 in one suit — entered as pong + chows + pong + pair
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
        { type: 'chow', tiles: ['2d', '3d', '4d'], concealed: true },
        { type: 'chow', tiles: ['5d', '6d', '7d'], concealed: true },
        { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: true },
        { type: 'pair', tiles: ['8d', '8d'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(true);
  });

  it('not ready: 3 pairs + 2 sets is neither standard nor all-pairs', () => {
    const hand: Hand = {
      melds: [
        { type: 'pong', tiles: ['1b', '1b', '1b'], concealed: true },
        { type: 'chow', tiles: ['4d', '5d', '6d'], concealed: true },
        { type: 'pair', tiles: ['3b', '3b'], concealed: true },
        { type: 'pair', tiles: ['7d', '7d'], concealed: true },
        { type: 'pair', tiles: ['Ew', 'Ew'], concealed: true },
      ],
    };
    expect(isHandReady(hand)).toBe(false);
  });
});
