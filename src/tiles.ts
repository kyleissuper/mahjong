import type { Tile } from './types.js';

export function isDragon(tile: Tile): boolean { return tile === 'Rd' || tile === 'Gd' || tile === 'Wd'; }
export function isWind(tile: Tile): boolean { return tile[1] === 'w'; }
export function isHonor(tile: Tile): boolean { return isDragon(tile) || isWind(tile); }
export function isNumberTile(tile: Tile): boolean { return tile.length === 2 && tile[0] >= '1' && tile[0] <= '9'; }
export function isTerminal(tile: Tile): boolean { return isNumberTile(tile) && (tile[0] === '1' || tile[0] === '9'); }
export function is258(tile: Tile): boolean { const v = tile[0]; return tile.length === 2 && (v === '2' || v === '5' || v === '8'); }
export function numValue(tile: Tile): number { return parseInt(tile[0]); }
export function suit(tile: Tile): string { return isHonor(tile) ? (isDragon(tile) ? 'dragon' : 'wind') : tile[1]; }
