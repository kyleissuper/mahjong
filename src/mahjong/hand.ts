import type { Hand, Meld } from './types.ts';
import { ORPHAN_TILES } from './tile.ts';

export function isHandReady(hand: Hand): boolean {
  const melds = hand.melds.filter(m => m.type !== 'flower');

  if (melds.length === 1 && melds[0].type === 'orphans' && melds[0].tiles.length === 14) return true;
  if (isOrphansSplit(melds)) return true;
  if (melds.length === 7 && melds.every(m => m.type === 'pair')) return true;

  if (melds.length !== 5) return false;
  const sets = melds.filter(m => m.type === 'chow' || m.type === 'pong' || m.type === 'kong');
  const pairs = melds.filter(m => m.type === 'pair');
  return sets.length === 4 && pairs.length === 1;
}

function isOrphansSplit(melds: Meld[]): boolean {
  const allTiles = melds.flatMap(m => m.tiles);
  if (allTiles.length !== 14) return false;
  const counts = new Map<string, number>();
  for (const t of allTiles) counts.set(t, (counts.get(t) ?? 0) + 1);
  return ORPHAN_TILES.every(t => (counts.get(t) ?? 0) >= 1)
    && [...counts.values()].filter(c => c === 2).length === 1
    && [...counts.values()].every(c => c <= 2);
}
