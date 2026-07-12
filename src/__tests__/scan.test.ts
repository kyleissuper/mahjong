import { describe, it, expect } from 'vitest';
import { normalizeMelds, parseScanResponse } from '../scan.js';

// These tests pin down the trust boundary: given the messy, sometimes-wrong
// output a vision model can produce, we always hand the UI a valid Meld[].

describe('normalizeMelds', () => {
  it('passes a valid meld through unchanged', () => {
    expect(
      normalizeMelds({
        melds: [{ type: 'chow', tiles: ['1c', '2c', '3c'], concealed: false, winTile: '2c' }],
      }),
    ).toEqual([{ type: 'chow', tiles: ['1c', '2c', '3c'], concealed: false, winTile: '2c' }]);
  });

  it('returns [] when melds is missing or not an array', () => {
    expect(normalizeMelds({})).toEqual([]);
    expect(normalizeMelds({ melds: 'nope' })).toEqual([]);
    expect(normalizeMelds(null)).toEqual([]);
  });

  it('maps hallucinated tiles (and the model\'s "unknown") to "unknown"', () => {
    const [meld] = normalizeMelds({
      melds: [{ type: 'pong', tiles: ['4d', 'zz', 'unknown'], concealed: true }],
    });
    expect(meld.tiles).toEqual(['4d', 'unknown', 'unknown']);
  });

  it('defaults an unrecognised meld type to "pong"', () => {
    const [meld] = normalizeMelds({ melds: [{ type: 'triplet', tiles: ['4d', '4d', '4d'] }] });
    expect(meld.type).toBe('pong');
  });

  it('defaults missing/non-boolean concealed to true', () => {
    const [meld] = normalizeMelds({ melds: [{ type: 'pong', tiles: ['4d', '4d', '4d'] }] });
    expect(meld.concealed).toBe(true);
  });

  it('drops a winTile that is not among the meld tiles', () => {
    const [meld] = normalizeMelds({
      melds: [{ type: 'chow', tiles: ['1c', '2c', '3c'], concealed: false, winTile: '9d' }],
    });
    expect(meld.winTile).toBeUndefined();
  });

  it('skips melds with no usable tiles and filters non-string tiles', () => {
    expect(
      normalizeMelds({
        melds: [
          { type: 'pong', tiles: [] },
          { type: 'pong', tiles: [1, 2, 3] },
          { type: 'flower', tiles: ['F'] },
        ],
      }),
    ).toEqual([{ type: 'flower', tiles: ['F'], concealed: true }]);
  });

  it('caps melds at 8 and tiles per meld at 14', () => {
    expect(
      normalizeMelds({
        melds: Array.from({ length: 12 }, () => ({ type: 'pong', tiles: ['4d', '4d', '4d'] })),
      }),
    ).toHaveLength(8);

    const [big] = normalizeMelds({
      melds: [{ type: 'pong', tiles: Array.from({ length: 20 }, () => '4d') }],
    });
    expect(big.tiles).toHaveLength(14);
  });
});

describe('parseScanResponse', () => {
  it('extracts JSON from a ```json-fenced reply and normalizes it', () => {
    const content =
      '```json\n{"melds":[{"type":"chow","tiles":["1c","2c","3c"],"concealed":false,"winTile":"2c"},{"type":"flower","tiles":["F"],"concealed":false}]}\n```';
    expect(parseScanResponse(content)).toEqual([
      { type: 'chow', tiles: ['1c', '2c', '3c'], concealed: false, winTile: '2c' },
      { type: 'flower', tiles: ['F'], concealed: false },
    ]);
  });

  it('extracts JSON that is surrounded by prose', () => {
    expect(parseScanResponse('Sure! {"melds":[]} hope that helps')).toEqual([]);
  });

  it('throws when the reply contains no JSON', () => {
    expect(() => parseScanResponse('sorry, I cannot help')).toThrow();
  });
});
