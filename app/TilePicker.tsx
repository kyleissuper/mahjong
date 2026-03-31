import type { Tile, MeldType } from '../src/types.js';
import { tileChar, tileLabel } from './tile-display.js';

const SUITS = [
  { name: 'Bamboo', suit: 'b', tiles: ['1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', '9b'] },
  { name: 'Dots', suit: 'd', tiles: ['1d', '2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d'] },
  { name: 'Characters', suit: 'c', tiles: ['1c', '2c', '3c', '4c', '5c', '6c', '7c', '8c', '9c'] },
  { name: 'Winds', suit: 'w', tiles: ['Ew', 'Sw', 'Ww', 'Nw'] },
  { name: 'Dragons', suit: 'h', tiles: ['Rd', 'Gd', 'Wd'] },
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
                  className="tile-btn"
                  onClick={() => onToggle(tile)}
                  disabled={disabled}
                  aria-pressed={selected.includes(tile)}
                  aria-label={tile}
                  title={tile}
                >
                  <span className="tile-btn-char">{tileChar(tile)}</span>
                  <span className="tile-btn-label">{tileLabel(tile)}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
