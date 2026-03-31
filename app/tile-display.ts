import type { Tile } from '../src/types.js';

// Import all tile SVGs — Vite handles these as URLs
const tileModules = import.meta.glob('./tiles/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

// Build lookup: tile shorthand → resolved image URL
const TILE_IMAGES: Record<string, string> = {};
for (const [path, url] of Object.entries(tileModules)) {
  const filename = path.split('/').pop()?.replace('.svg', '');
  if (filename) TILE_IMAGES[filename] = url;
}

export function tileImage(tile: Tile): string | undefined {
  return TILE_IMAGES[tile];
}

// Text fallbacks for contexts where images don't work (selects, etc.)
const TILE_NAMES: Record<string, string> = {
  '1b': '1 Bamboo', '2b': '2 Bamboo', '3b': '3 Bamboo', '4b': '4 Bamboo', '5b': '5 Bamboo',
  '6b': '6 Bamboo', '7b': '7 Bamboo', '8b': '8 Bamboo', '9b': '9 Bamboo',
  '1d': '1 Dots', '2d': '2 Dots', '3d': '3 Dots', '4d': '4 Dots', '5d': '5 Dots',
  '6d': '6 Dots', '7d': '7 Dots', '8d': '8 Dots', '9d': '9 Dots',
  '1c': '1 Char', '2c': '2 Char', '3c': '3 Char', '4c': '4 Char', '5c': '5 Char',
  '6c': '6 Char', '7c': '7 Char', '8c': '8 Char', '9c': '9 Char',
  'Ew': 'East', 'Sw': 'South', 'Ww': 'West', 'Nw': 'North',
  'Rd': 'Red', 'Gd': 'Green', 'Wd': 'White',
  'F': 'Flower',
};

export function tileName(tile: Tile): string {
  return TILE_NAMES[tile] ?? tile;
}
