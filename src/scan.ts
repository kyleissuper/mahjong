// The trust boundary for the photo-scan feature.
//
// The vision model returns free-form text that may be wrapped in prose or
// ```json fences and may contain missing fields, wrong types, hallucinated
// tiles, too many tiles, or a "winning tile" that isn't in its meld. This module
// turns that untrusted reply into a valid Meld[] the UI can render without
// checks (bad entries are dropped, unknown tiles become "unknown"). It is pure —
// no network — so it can be unit-tested; worker/index.ts owns the HTTP + model
// call and the prompt.

import type { Meld, MeldType, Tile } from './types.js';

// The 34 distinct tiles plus the flower.
const VALID_TILES: ReadonlySet<string> = new Set<string>([
  ...['b', 'd', 'c'].flatMap(s => [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `${n}${s}`)),
  'Ew', 'Sw', 'Ww', 'Nw', 'Rd', 'Gd', 'Wd', 'F',
]);

const MELD_TYPES: ReadonlySet<string> = new Set<MeldType>([
  'chow', 'pong', 'kong', 'pair', 'flower', 'orphans',
]);

const MAX_MELDS = 8;
const MAX_TILES_PER_MELD = 14;

// Real tiles pass through; anything else (garbage, or the model's own "unknown")
// becomes "unknown" so it stands out in the UI for the user to correct.
function normalizeTile(tile: string): Tile {
  return VALID_TILES.has(tile) ? tile : 'unknown';
}

interface RawMeld {
  type?: unknown;
  tiles?: unknown;
  concealed?: unknown;
  winTile?: unknown;
}

// Coerce arbitrary parsed JSON into clean melds. Entries with no usable tiles are
// dropped; unrecognised meld types default to "pong"; missing concealed defaults
// to true; a winTile is kept only if it's actually one of the meld's tiles.
export function normalizeMelds(parsed: unknown): Meld[] {
  const rawMelds = (parsed as { melds?: unknown })?.melds;
  if (!Array.isArray(rawMelds)) return [];

  const melds: Meld[] = [];
  for (const raw of rawMelds.slice(0, MAX_MELDS) as RawMeld[]) {
    if (!raw || !Array.isArray(raw.tiles)) continue;

    const tiles = raw.tiles
      .filter((t): t is string => typeof t === 'string')
      .slice(0, MAX_TILES_PER_MELD)
      .map(normalizeTile);
    if (tiles.length === 0) continue;

    const type: MeldType =
      typeof raw.type === 'string' && MELD_TYPES.has(raw.type) ? (raw.type as MeldType) : 'pong';

    const meld: Meld = {
      type,
      tiles,
      concealed: typeof raw.concealed === 'boolean' ? raw.concealed : true,
    };

    if (typeof raw.winTile === 'string' && tiles.includes(normalizeTile(raw.winTile))) {
      meld.winTile = normalizeTile(raw.winTile);
    }
    melds.push(meld);
  }
  return melds;
}

// Pull the first JSON object out of the model's reply (handles ```json fences,
// surrounding prose, etc.), then normalize it. Throws if there is no JSON.
export function parseScanResponse(content: string): Meld[] {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('no JSON found in model response');
  return normalizeMelds(JSON.parse(match[0]));
}
