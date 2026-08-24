import { describe, it, expect } from 'vitest';
import { tileOverlap, matchScansToHands, parsePacificTimestamp } from '../../src/worker/scan-match.ts';

const MIN = 60_000;
const T0 = 1_756_000_000_000;

const handA = ['Rd','Rd','Rd','1b','2b','3b','4b','5b','6b','7d','8d','9d','5b','5b'];
const handB = ['Ew','Ew','Ew','3b','3b','3b','7d','7d','7d','4c','5c','6c','2b','2b'];

describe('tileOverlap', () => {
  it('is 1 for identical multisets regardless of order', () => {
    expect(tileOverlap(handA, [...handA].reverse())).toBe(1);
  });

  it('counts duplicates as a multiset, not a set', () => {
    expect(tileOverlap(['Rd','Rd','Rd'], ['Rd'])).toBeCloseTo(1 / 3);
  });

  it('is low for different hands', () => {
    expect(tileOverlap(handA, handB)).toBeLessThan(0.3);
  });
});

describe('matchScansToHands', () => {
  it('links a hand to its photo taken minutes earlier', () => {
    const matches = matchScansToHands(
      [{ id: 1, timeMs: T0, tiles: handA }],
      [{ scanId: 's1', timeMs: T0 - 3 * MIN, tiles: handA }],
    );
    expect(matches).toEqual([{ handId: 1, scanId: 's1', score: 1, contested: false }]);
  });

  it('ignores photos outside the time window', () => {
    const matches = matchScansToHands(
      [{ id: 1, timeMs: T0, tiles: handA }],
      [{ scanId: 'old', timeMs: T0 - 60 * MIN, tiles: handA }],
    );
    expect(matches).toEqual([]);
  });

  it('never-submitted photos of other content stay orphaned', () => {
    const matches = matchScansToHands(
      [{ id: 1, timeMs: T0, tiles: handA }],
      [{ scanId: 'junk', timeMs: T0 - 2 * MIN, tiles: handB }],
    );
    expect(matches).toEqual([]);
  });

  it('picks the latest retake when several photos show the same hand', () => {
    const matches = matchScansToHands(
      [{ id: 1, timeMs: T0, tiles: handA }],
      [
        { scanId: 'early', timeMs: T0 - 5 * MIN, tiles: handA },
        { scanId: 'late', timeMs: T0 - 1 * MIN, tiles: handA },
      ],
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].scanId).toBe('late');
    expect(matches[0].contested).toBe(false);
  });

  it('resolves concurrent tables by tile content', () => {
    const matches = matchScansToHands(
      [
        { id: 1, timeMs: T0, tiles: handA },
        { id: 2, timeMs: T0 + 2 * MIN, tiles: handB },
      ],
      [
        { scanId: 'sB', timeMs: T0 - MIN, tiles: handB },
        { scanId: 'sA', timeMs: T0 - 2 * MIN, tiles: handA },
      ],
    );
    expect(matches).toHaveLength(2);
    const byHand = Object.fromEntries(matches.map(m => [m.handId, m]));
    expect(byHand[1].scanId).toBe('sA');
    expect(byHand[2].scanId).toBe('sB');
    expect(matches.every(m => !m.contested)).toBe(true);
  });

  it('flags a match as contested when an unlinked hand fits nearly as well', () => {
    // Two similar hands in-window, only one photo: the loser stays unlinked,
    // so the winner's link is unsafe.
    const similar = [...handA.slice(0, 13), '9c'];
    const matches = matchScansToHands(
      [
        { id: 1, timeMs: T0, tiles: handA },
        { id: 2, timeMs: T0 + MIN, tiles: similar },
      ],
      [{ scanId: 's1', timeMs: T0 - MIN, tiles: handA }],
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].contested).toBe(true);
  });
});

describe('parsePacificTimestamp', () => {
  it('round-trips a PDT timestamp', () => {
    const ms = parsePacificTimestamp('8/23/2026, 2:16:48 PM');
    expect(ms).not.toBeNull();
    expect(new Date(ms!).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
      .toBe('8/23/2026, 2:16:48 PM');
  });

  it('round-trips a PST timestamp', () => {
    const ms = parsePacificTimestamp('1/15/2026, 9:05:07 AM');
    expect(ms).not.toBeNull();
    expect(new Date(ms!).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
      .toBe('1/15/2026, 9:05:07 AM');
  });

  it('rejects malformed input', () => {
    expect(parsePacificTimestamp('2026-08-23T14:16:48')).toBeNull();
  });
});
