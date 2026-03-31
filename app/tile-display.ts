import type { Tile } from '../src/types.js';

// Unicode mahjong tiles
const TILE_CHARS: Record<string, string> = {
  // Bamboo
  '1b': '🀐', '2b': '🀑', '3b': '🀒', '4b': '🀓', '5b': '🀔',
  '6b': '🀕', '7b': '🀖', '8b': '🀗', '9b': '🀘',
  // Dots
  '1d': '🀙', '2d': '🀚', '3d': '🀛', '4d': '🀜', '5d': '🀝',
  '6d': '🀞', '7d': '🀟', '8d': '🀠', '9d': '🀡',
  // Characters
  '1c': '🀇', '2c': '🀈', '3c': '🀉', '4c': '🀊', '5c': '🀋',
  '6c': '🀌', '7c': '🀍', '8c': '🀎', '9c': '🀏',
  // Winds
  'Ew': '🀀', 'Sw': '🀁', 'Ww': '🀂', 'Nw': '🀃',
  // Dragons
  'Rd': '🀄', 'Gd': '🀅', 'Wd': '🀆',
  // Flower
  'F': '🀢',
};

// Short labels for tile picker buttons (suit is shown by the row)
const TILE_LABELS: Record<string, string> = {
  '1b': '1', '2b': '2', '3b': '3', '4b': '4', '5b': '5',
  '6b': '6', '7b': '7', '8b': '8', '9b': '9',
  '1d': '1', '2d': '2', '3d': '3', '4d': '4', '5d': '5',
  '6d': '6', '7d': '7', '8d': '8', '9d': '9',
  '1c': '1', '2c': '2', '3c': '3', '4c': '4', '5c': '5',
  '6c': '6', '7c': '7', '8c': '8', '9c': '9',
  'Ew': 'E', 'Sw': 'S', 'Ww': 'W', 'Nw': 'N',
  'Rd': '中', 'Gd': '發', 'Wd': '',
  'F': '🀢',
};

export function tileChar(tile: Tile): string {
  return TILE_CHARS[tile] ?? tile;
}

export function tileLabel(tile: Tile): string {
  return TILE_LABELS[tile] ?? tile;
}

export function displayTiles(tiles: Tile[]): string {
  return tiles.map(tileChar).join('');
}
