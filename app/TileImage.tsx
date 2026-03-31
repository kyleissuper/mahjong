import type { Tile } from '../src/types.js';
import { tileImage, tileName } from './tile-display.js';

interface Props {
  tile: Tile;
  size?: number;
  className?: string;
}

export function TileImage({ tile, size = 32, className }: Props) {
  const src = tileImage(tile);
  if (!src) return <span>{tile}</span>;

  return (
    <img
      src={src}
      alt={tileName(tile)}
      width={size}
      height={Math.round(size * 1.4)}
      className={className}
      draggable={false}
    />
  );
}
