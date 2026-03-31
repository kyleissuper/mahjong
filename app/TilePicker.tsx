import type { Tile, MeldType } from '../src/types.js';
import { tileFace } from './tile-display.js';

const SUITS = [
  { name: 'Bamboo', color: 'var(--suit-bamboo)', tiles: ['1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', '9b'] },
  { name: 'Dots', color: 'var(--suit-dots)', tiles: ['1d', '2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d'] },
  { name: 'Characters', color: 'var(--suit-characters)', tiles: ['1c', '2c', '3c', '4c', '5c', '6c', '7c', '8c', '9c'] },
  { name: 'Winds', color: 'var(--suit-wind)', tiles: ['Ew', 'Sw', 'Ww', 'Nw'] },
  { name: 'Dragons', color: 'var(--suit-dragon)', tiles: ['Rd', 'Gd', 'Wd'] },
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
      {SUITS.map(({ name, color, tiles }) => {
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
                  style={{ '--tile-color': color } as React.CSSProperties}
                >
                  {tileFace(tile)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
