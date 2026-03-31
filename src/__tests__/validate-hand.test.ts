import { describe, it, expect } from 'vitest';
import { validateHand } from '../validate-hand.js';
import type { Hand } from '../types.js';

describe('validateHand', () => {
  describe('chow validation', () => {
    it('rejects chow with wrong tile count', () => {
      const hand: Hand = {
        melds: [
          { type: 'chow', tiles: ['1b', '2b'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 0, message: 'chow must have exactly 3 tiles' },
      ]);
    });

    it('rejects chow with honor tiles', () => {
      const hand: Hand = {
        melds: [
          { type: 'chow', tiles: ['Ew', 'Sw', 'Ww'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 0, message: 'chow tiles must be number tiles' },
      ]);
    });

    it('rejects chow with mixed suits', () => {
      const hand: Hand = {
        melds: [
          { type: 'chow', tiles: ['1b', '2d', '3b'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 0, message: 'chow tiles must be the same suit' },
      ]);
    });

    it('rejects chow with non-consecutive values', () => {
      const hand: Hand = {
        melds: [
          { type: 'chow', tiles: ['1b', '3b', '5b'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 0, message: 'chow tiles must be consecutive' },
      ]);
    });
  });

  describe('pong validation', () => {
    it('rejects pong with wrong tile count', () => {
      const hand: Hand = {
        melds: [
          { type: 'pong', tiles: ['5b', '5b'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 0, message: 'pong must have exactly 3 tiles' },
      ]);
    });

    it('rejects pong with non-identical tiles', () => {
      const hand: Hand = {
        melds: [
          { type: 'pong', tiles: ['5b', '5b', '6b'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 0, message: 'pong tiles must be identical' },
      ]);
    });
  });

  describe('kong validation', () => {
    it('rejects kong with wrong tile count', () => {
      const hand: Hand = {
        melds: [
          { type: 'kong', tiles: ['5b', '5b', '5b'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 0, message: 'kong must have exactly 4 tiles' },
      ]);
    });

    it('rejects kong with non-identical tiles', () => {
      const hand: Hand = {
        melds: [
          { type: 'kong', tiles: ['5b', '5b', '5b', '6b'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 0, message: 'kong tiles must be identical' },
      ]);
    });
  });

  describe('pair validation', () => {
    it('rejects pair with wrong tile count', () => {
      const hand: Hand = {
        melds: [
          { type: 'pair', tiles: ['5b'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 0, message: 'pair must have exactly 2 tiles' },
      ]);
    });

    it('rejects pair with non-identical tiles', () => {
      const hand: Hand = {
        melds: [
          { type: 'pair', tiles: ['5b', '6b'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 0, message: 'pair tiles must be identical' },
      ]);
    });
  });

  describe('multiple errors', () => {
    it('reports errors on correct meld indices', () => {
      const hand: Hand = {
        melds: [
          { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
          { type: 'pong', tiles: ['5b', '5b'], concealed: true },
          { type: 'pair', tiles: ['Rd', 'Gd'], concealed: true },
        ],
      };
      expect(validateHand(hand)).toEqual([
        { type: 'meld', meld: 1, message: 'pong must have exactly 3 tiles' },
        { type: 'meld', meld: 2, message: 'pair tiles must be identical' },
      ]);
    });
  });

  describe('valid melds', () => {
    it('returns no errors for valid melds', () => {
      const hand: Hand = {
        melds: [
          { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
          { type: 'pong', tiles: ['5d', '5d', '5d'], concealed: false },
          { type: 'kong', tiles: ['9c', '9c', '9c', '9c'], concealed: true },
          { type: 'pair', tiles: ['Rd', 'Rd'], concealed: true },
          { type: 'flower', tiles: ['F'], concealed: false },
        ],
      };
      expect(validateHand(hand)).toEqual([]);
    });
  });
});
