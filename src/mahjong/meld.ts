import type { Hand, Meld } from './types.ts';
import { isNumberTile, numValue, suit } from './tile.ts';

export type ValidationError = { type: 'meld'; meld: number; message: string };

export function validateHand(hand: Hand): ValidationError[] {
  return hand.melds.flatMap((meld, i) => {
    const message = validateMeld(meld);
    return message ? [{ type: 'meld' as const, meld: i, message }] : [];
  });
}

export function validateMeld({ type, tiles }: Meld): string | null {
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
