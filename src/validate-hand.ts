import type { Hand, Meld } from './types.js';
import { isNumberTile, numValue, suit } from './tiles.js';

export type ValidationError =
  | { type: 'meld'; meld: number; message: string };

export function isHandReady(hand: Hand): boolean {
  const melds = hand.melds.filter(m => m.type !== 'flower');

  // Thirteen orphans: single orphans meld, or split across melds
  if (melds.length === 1 && melds[0].type === 'orphans') return true;
  if (isOrphansSplit(melds)) return true;

  // All pairs: 7 pairs
  if (melds.length === 7 && melds.every(m => m.type === 'pair')) return true;

  // Standard: exactly 4 sets (chow/pong/kong) + 1 pair, nothing else
  if (melds.length !== 5) return false;
  const sets = melds.filter(m => m.type === 'chow' || m.type === 'pong' || m.type === 'kong');
  const pairs = melds.filter(m => m.type === 'pair');
  return sets.length === 4 && pairs.length === 1;
}

function isOrphansSplit(melds: Meld[]): boolean {
  const allTiles = melds.flatMap(m => m.tiles);
  if (allTiles.length !== 14) return false;
  const required = ['1b','9b','1d','9d','1c','9c','Ew','Sw','Ww','Nw','Rd','Gd','Wd'];
  const counts = new Map<string, number>();
  for (const t of allTiles) counts.set(t, (counts.get(t) ?? 0) + 1);
  return required.every(t => (counts.get(t) ?? 0) >= 1)
    && [...counts.values()].filter(c => c === 2).length === 1
    && [...counts.values()].every(c => c <= 2);
}

export function validateHand(hand: Hand): ValidationError[] {
  return hand.melds.flatMap((meld, i) => {
    const message = validateMeld(meld);
    return message ? [{ type: 'meld' as const, meld: i, message }] : [];
  });
}

function validateMeld({ type, tiles }: Meld): string | null {
  switch (type) {
    case 'chow': return validateChow(tiles);
    case 'pong': return validateIdentical(tiles, 3, 'pong');
    case 'kong': return validateIdentical(tiles, 4, 'kong');
    case 'pair': return validateIdentical(tiles, 2, 'pair');
    default: return null;
  }
}

function validateChow(tiles: string[]): string | null {
  if (tiles.length !== 3) return 'chow must have exactly 3 tiles';
  if (!tiles.every(isNumberTile)) return 'chow tiles must be number tiles';
  if (new Set(tiles.map(suit)).size !== 1) return 'chow tiles must be the same suit';
  const values = tiles.map(numValue).sort((a, b) => a - b);
  if (values[1] !== values[0] + 1 || values[2] !== values[0] + 2) return 'chow tiles must be consecutive';
  return null;
}

function validateIdentical(tiles: string[], count: number, name: string): string | null {
  if (tiles.length !== count) return `${name} must have exactly ${count} tiles`;
  if (new Set(tiles).size !== 1) return `${name} tiles must be identical`;
  return null;
}
