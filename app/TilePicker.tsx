import type { Tile, MeldType } from '../src/types.js';
import { tileImage, tileName } from './tile-display.js';

const SUITS = [
  { name: 'Bamboo', tiles: ['1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', '9b'] },
  { name: 'Dots', tiles: ['1d', '2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d'] },
  { name: 'Characters', tiles: ['1c', '2c', '3c', '4c', '5c', '6c', '7c', '8c', '9c'] },
  { name: 'Winds', tiles: ['Ew', 'Sw', 'Ww', 'Nw'] },
  { name: 'Dragons', tiles: ['Rd', 'Gd', 'Wd'] },
];

interface Props {
  selected: Tile[];
  onToggle: (tile: Tile) => void;
  meldType: MeldType;
}

export function TilePicker({ selected, onToggle, meldType }: Props) {
  const honorsDisabled = meldType === 'chow';

  return (
    <div className="tile-grid">
      {SUITS.map(({ name, tiles }) => {
        const isHonorRow = name === 'Winds' || name === 'Dragons';
        const disabled = isHonorRow && honorsDisabled;

        return (
          <div key={name} className="tile-suit">
            <div className="tile-suit-name">{name}</div>
            <div className="tile-row">
              {tiles.map(tile => (
                <button
                  key={tile}
                  className="tile-frame tile-btn"
                  onClick={() => onToggle(tile)}
                  disabled={disabled}
                  aria-pressed={selected.includes(tile)}
                  aria-label={tile}
                  title={tile}
                >
                  <img src={tileImage(tile)} alt={tileName(tile)} width={28} height={39} draggable={false} />
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
