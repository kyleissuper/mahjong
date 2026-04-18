import { describe, it, expect } from 'vitest';
import { scoreFromParam, encodeScoreParam } from '../decode-score-param.js';
import type { Hand, Win } from '../types.js';

const validHand: Hand = {
  melds: [
    { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
    { type: 'chow', tiles: ['4b', '5b', '6b'], concealed: true },
    { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '8d' },
    { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
    { type: 'pair', tiles: ['5b', '5b'], concealed: true },
  ],
};

const validWin: Win = {
  players: ['A', 'B', 'C', 'D'],
  winner: 'A',
  method: 'discard',
  from: 'D',
  dealer: 'B',
  dealerRounds: 1,
  special: [],
};

describe('scoreFromParam', () => {
  it('round-trips a valid hand+win through encode→decode and returns the correct ScoreResult', () => {
    const d = encodeScoreParam(validHand, validWin);
    const decoded = scoreFromParam(d);

    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.result.handValue).toBe(3);
    expect(decoded.result.appliedRules.map(r => r.name)).toEqual([
      'dragonPong', 'pairOf258', 'canOnlyWinWithOne',
    ]);
    expect(decoded.result.scores).toEqual({ A: 3, B: 0, C: 0, D: -3 });
    expect(decoded.hand).toEqual(validHand);
    expect(decoded.win).toEqual(validWin);
  });

  it('decodes standard base64 (+/=) as well as base64url (-_)', () => {
    const json = JSON.stringify({ hand: validHand, win: validWin });
    const standardB64 = btoa(json); // contains + / = potentially
    const decoded = scoreFromParam(standardB64);
    expect(decoded.ok).toBe(true);
  });

  it('rejects input that is not valid base64', () => {
    const decoded = scoreFromParam('not-base64-at-all!!!');
    expect(decoded.ok).toBe(false);
    if (decoded.ok) return;
    expect(decoded.error).toMatch(/decode/i);
  });

  it('rejects base64 that decodes to non-JSON', () => {
    const decoded = scoreFromParam(btoa('plain text, not json'));
    expect(decoded.ok).toBe(false);
    if (decoded.ok) return;
    expect(decoded.error).toMatch(/decode|json/i);
  });

  it('rejects a payload missing hand.melds', () => {
    const decoded = scoreFromParam(btoa(JSON.stringify({ win: validWin })));
    expect(decoded.ok).toBe(false);
    if (decoded.ok) return;
    expect(decoded.error).toMatch(/hand/i);
  });

  it('rejects a payload missing win', () => {
    const decoded = scoreFromParam(btoa(JSON.stringify({ hand: validHand })));
    expect(decoded.ok).toBe(false);
    if (decoded.ok) return;
    expect(decoded.error).toMatch(/win/i);
  });

  it('reports structurally invalid melds', () => {
    const badHand: Hand = {
      melds: [
        { type: 'chow', tiles: ['1b', '3b', '5b'], concealed: true }, // not consecutive
        ...validHand.melds.slice(1),
      ],
    };
    const decoded = scoreFromParam(encodeScoreParam(badHand, validWin));
    expect(decoded.ok).toBe(false);
    if (decoded.ok) return;
    expect(decoded.error).toMatch(/consecutive/i);
  });

  it('reports a hand that is not a complete winning shape', () => {
    const incomplete: Hand = { melds: validHand.melds.slice(0, 3) };
    const decoded = scoreFromParam(encodeScoreParam(incomplete, validWin));
    expect(decoded.ok).toBe(false);
    if (decoded.ok) return;
    expect(decoded.error).toMatch(/complete winning hand/i);
  });
});

describe('encodeScoreParam', () => {
  it('produces a URL-safe string (no +, /, or = characters)', () => {
    const encoded = encodeScoreParam(validHand, validWin);
    expect(encoded).not.toMatch(/[+/=]/);
  });
});
