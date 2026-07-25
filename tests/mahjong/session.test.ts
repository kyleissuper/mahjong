import { describe, it, expect } from 'vitest';
import { createSession, computeScoredHand, rosterByActivity } from '../../src/mahjong/session.ts';
import type { Meld, Win } from '../../src/mahjong/types.ts';

const dragonPongMelds: Meld[] = [
  { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
  { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
  { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
  { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '8d' },
  { type: 'pair', tiles: ['5b', '5b'], concealed: true },
];

function discardWin(winner: string, from: string, dealer: string): Win {
  return {
    players: [winner, from, winner, from],
    winner, from, method: 'discard',
    dealer, dealerRounds: 1, special: [],
  };
}

describe('createSession', () => {
  it('returns a session with the given code and timestamp', () => {
    const session = createSession('ABC1');
    expect(session.code).toBe('ABC1');
    expect(session.createdAt).toBeDefined();
  });
});

describe('computeScoredHand', () => {
  it('computes scores for a discard win', () => {
    const scored = computeScoredHand({ melds: dragonPongMelds }, discardWin('Kyle', 'Ming', 'Ming'));
    expect(scored.winner).toBe('Kyle');
    expect(scored.scores.Kyle).toBeGreaterThan(0);
    expect(scored.scores.Ming).toBeLessThan(0);
  });

  it('points sum to zero', () => {
    const scored = computeScoredHand({ melds: dragonPongMelds }, discardWin('Kyle', 'Ming', 'Ming'));
    const total = Object.values(scored.scores).reduce((a, b) => a + b, 0);
    expect(total).toBe(0);
  });

  it('rejects winner and loser being the same', () => {
    expect(() => computeScoredHand({ melds: dragonPongMelds }, discardWin('Kyle', 'Kyle', 'Kyle'))).toThrow(/same player/i);
  });

  it('has a timestamp', () => {
    const scored = computeScoredHand({ melds: dragonPongMelds }, discardWin('Kyle', 'Ming', 'Ming'));
    expect(scored.timestamp).toBeDefined();
  });
});

describe('rosterByActivity', () => {
  it('sorts recently active players first', () => {
    const hand = computeScoredHand({ melds: dragonPongMelds }, discardWin('Sarah', 'Ming', 'Ming'));
    const sorted = rosterByActivity([hand], ['Kyle', 'Ming', 'Sarah']);
    expect(sorted.indexOf('Sarah')).toBeLessThan(sorted.indexOf('Kyle'));
    expect(sorted.indexOf('Ming')).toBeLessThan(sorted.indexOf('Kyle'));
  });

  it('includes inactive players at the end', () => {
    const sorted = rosterByActivity([], ['Kyle', 'Ming', 'Sarah']);
    expect(sorted).toEqual(['Kyle', 'Ming', 'Sarah']);
  });
});
