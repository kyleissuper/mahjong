import type { Tile } from '../../mahjong/types.ts';
import { tileImage, tileName } from '../lib/tile-display.ts';

interface Props {
  tile: Tile;
  size?: number;
}

export function TileImage({ tile, size = 28 }: Props) {
  const src = tileImage(tile);
  if (!src) return <span>{tile}</span>;

  return (
    <img
      src={src}
      alt={tileName(tile)}
      width={size}
      height={Math.round(size * 1.4)}
      draggable={false}
    />
  );
}
