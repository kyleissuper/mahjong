import { describe, it, expect } from 'vitest';
import { calculateScore } from '../calculate-score.js';
import type { Hand, Meld, Win } from '../types.js';

// ---------------------------------------------------------------------------
// Behaviour under test:
//
//   Drawing a flower tile never takes away a scoring rule that the rest of
//   the player's hand would otherwise earn.
//
// These tests assert that invariant directly — once per rule family that
// historically depended on it — without reaching into the scoring internals.
// They talk to `calculateScore` (the public API) using a tiny test DSL so the
// intent of each test is visible on the line it's on.
// ---------------------------------------------------------------------------

// --- Test DSL -------------------------------------------------------------

const FLOWER: Meld = { type: 'flower', tiles: ['F'], concealed: false };

function playerDrewAFlower(hand: Hand): Hand {
  return { melds: [...hand.melds, FLOWER] };
}

function rulesScoredFor(hand: Hand): { name: string; points: number }[] {
  return calculateScore(hand, aSelfPickWin).appliedRules;
}

const aSelfPickWin: Win = {
  players: ['A', 'B', 'C', 'D'],
  winner: 'A', dealer: 'A',
  method: 'self-pick',
  dealerRounds: 1, special: [],
};

// --- Qualifying hands -----------------------------------------------------
// Each fixture is the smallest hand that qualifies for the rule it names.
// They're named in domain language so the test cases read as specifications.

const aPureBambooHand: Hand = {
  melds: [
    { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
    { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
    { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true },
    { type: 'pong', tiles: ['2b', '2b', '2b'], concealed: true },
    { type: 'pair', tiles: ['5b', '5b'], concealed: true, winTile: '5b' },
  ],
};

const anAllTerminalsHand: Hand = {
  melds: [
    { type: 'pong', tiles: ['1b', '1b', '1b'], concealed: true },
    { type: 'pong', tiles: ['9b', '9b', '9b'], concealed: true },
    { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
    { type: 'pong', tiles: ['9c', '9c', '9c'], concealed: true },
    { type: 'pair', tiles: ['1c', '1c'], concealed: true, winTile: '1c' },
  ],
};

const anAllTerminalsAndHonorsHand: Hand = {
  melds: [
    { type: 'pong', tiles: ['1b', '1b', '1b'], concealed: true },
    { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: true },
    { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: true },
    { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: true },
    { type: 'pair', tiles: ['9c', '9c'], concealed: true, winTile: '9c' },
  ],
};

const anAllHonorsHand: Hand = {
  melds: [
    { type: 'pong', tiles: ['Ew', 'Ew', 'Ew'], concealed: true },
    { type: 'pong', tiles: ['Sw', 'Sw', 'Sw'], concealed: true },
    { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: true },
    { type: 'pong', tiles: ['Gd', 'Gd', 'Gd'], concealed: true },
    { type: 'pair', tiles: ['Wd', 'Wd'], concealed: true, winTile: 'Wd' },
  ],
};

const aHeavenlyGatesHand: Hand = {
  melds: [
    { type: 'pong', tiles: ['1d', '1d', '1d'], concealed: true },
    { type: 'chow', tiles: ['2d', '3d', '4d'], concealed: true },
    { type: 'chow', tiles: ['5d', '6d', '7d'], concealed: true },
    { type: 'pong', tiles: ['9d', '9d', '9d'], concealed: true },
    { type: 'pair', tiles: ['8d', '8d'], concealed: true, winTile: '8d' },
  ],
};

const aJadeDragonHand: Hand = {
  melds: [
    { type: 'pong', tiles: ['Gd', 'Gd', 'Gd'], concealed: false },
    { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
    { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
    { type: 'chow', tiles: ['7b', '8b', '9b'], concealed: true },
    { type: 'pair', tiles: ['5b', '5b'], concealed: true, winTile: '5b' },
  ],
};

// --- Specifications -------------------------------------------------------

describe('a flower does not suppress scoring rules the rest of the hand earns', () => {
  // Each scenario documents one scoring rule and the smallest hand that
  // earns it. The parameterisation lets the behaviour ("a flower doesn't
  // suppress rule X") be stated once and verified against every affected
  // rule. Each test has exactly one reason to fail: its rule silently
  // dropped out because of a flower tile.
  const scenarios: { rule: string; points: number; qualifyingHand: Hand }[] = [
    { rule: 'pure',            points:  8, qualifyingHand: aPureBambooHand },
    { rule: 'all19',           points: 16, qualifyingHand: anAllTerminalsHand },
    { rule: 'all19WithHonors', points:  8, qualifyingHand: anAllTerminalsAndHonorsHand },
    { rule: 'allHonors',       points: 12, qualifyingHand: anAllHonorsHand },
    { rule: 'heavenlyGates',   points: 16, qualifyingHand: aHeavenlyGatesHand },
    { rule: 'jadeDragon',      points: 14, qualifyingHand: aJadeDragonHand },
  ];

  describe.each(scenarios)('$rule', ({ rule, points, qualifyingHand }) => {
    it(`is awarded for a qualifying hand`, () => {
      // Given a hand that qualifies for the rule
      // When scored
      const awarded = rulesScoredFor(qualifyingHand);
      // Then the rule appears in the breakdown with its full points
      expect(awarded).toContainEqual({ name: rule, points });
    });

    it(`is still awarded when the player has also drawn a flower`, () => {
      // Given the same qualifying hand, plus a flower tile
      const handWithFlower = playerDrewAFlower(qualifyingHand);
      // When scored
      const awarded = rulesScoredFor(handWithFlower);
      // Then the rule is still present with the same points
      expect(awarded).toContainEqual({ name: rule, points });
    });
  });
});
