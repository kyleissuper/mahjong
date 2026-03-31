import type { Tile } from '../src/types.js';

// Button face: what you see on each tile in the picker
// Suit is indicated by color + row label, so just show the value
const TILE_FACES: Record<string, string> = {
  '1b': '1', '2b': '2', '3b': '3', '4b': '4', '5b': '5',
  '6b': '6', '7b': '7', '8b': '8', '9b': '9',
  '1d': '1', '2d': '2', '3d': '3', '4d': '4', '5d': '5',
  '6d': '6', '7d': '7', '8d': '8', '9d': '9',
  '1c': '一', '2c': '二', '3c': '三', '4c': '四', '5c': '五',
  '6c': '六', '7c': '七', '8c': '八', '9c': '九',
  'Ew': '東', 'Sw': '南', 'Ww': '西', 'Nw': '北',
  'Rd': '中', 'Gd': '發', 'Wd': '',
  'F': '花',
};

// Full display: tile face + suit indicator for meld display
const SUIT_MARKS: Record<string, string> = {
  'b': '竹', 'd': '●', 'c': '萬',
};

export function tileFace(tile: Tile): string {
  return TILE_FACES[tile] ?? tile;
}

export function displayTile(tile: Tile): string {
  const face = TILE_FACES[tile];
  if (!face) return tile;
  // Honors and flowers are self-describing
  if (tile.length === 1 || tile[1] === 'w' || (tile[1] === 'd' && tile[0] !== '1')) return face;
  // Number tiles: face + suit mark
  const suitMark = SUIT_MARKS[tile[1]];
  return suitMark ? `${face}${suitMark}` : face;
}

export function displayTiles(tiles: Tile[]): string {
  return tiles.map(displayTile).join(' ');
}
