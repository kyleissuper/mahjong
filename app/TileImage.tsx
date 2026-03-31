import type { Tile } from '../src/types.js';
import { tileImage, tileName } from './tile-display.js';

interface Props {
  tile: Tile;
  size?: number;
}

export function TileImage({ tile, size = 32 }: Props) {
  const src = tileImage(tile);
  if (!src) return <span>{tile}</span>;

  const height = Math.round(size * 1.4);

  return (
    <span className="tile-frame" style={{ width: size, height }}>
      <img src={src} alt={tileName(tile)} width={size} height={height} draggable={false} />
    </span>
  );
}
