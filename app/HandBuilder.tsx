import { useState } from 'react';
import type { Meld, MeldType, Tile } from '../src/types.js';
import type { ValidationError } from '../src/validate-hand.js';
import { TilePicker } from './TilePicker.tsx';
import { tileName } from './tile-display.js';
import { TileImage } from './TileImage.tsx';

const ORPHAN_TILES: Tile[] = [
  '1b', '9b', '1d', '9d', '1c', '9c',
  'Ew', 'Sw', 'Ww', 'Nw',
  'Rd', 'Gd', 'Wd',
];

interface Props {
  melds: Meld[];
  errors: ValidationError[];
  onChange: (melds: Meld[]) => void;
}

export function HandBuilder({ melds, errors, onChange }: Props) {
  const [adding, setAdding] = useState(false);

  function addMeld(meld: Meld) {
    onChange([...melds, meld]);
    setAdding(false);
  }

  function removeMeld(index: number) {
    onChange(melds.filter((_, i) => i !== index));
  }

  return (
    <section className="section">
      <h2 className="section-title">Your hand</h2>

      {melds.length === 0 && (
        <p className="empty-hand">No sets yet. Add your first set to start scoring.</p>
      )}

      <ul className="meld-list">
        {melds.map((meld, i) => {
          const error = errors.find(e => e.meld === i);
          return (
            <li key={i} className="meld-item">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="meld-tiles">
                    {meld.tiles.map((t, j) => (
                      <TileImage key={j} tile={t} size={30} className="meld-tile-img" />
                    ))}
                  </span>
                  <span className="meld-type">{meld.type}</span>
                </div>
                <div className="meld-meta">
                  {meld.concealed && 'concealed'}
                  {meld.winTile && <> · won with <TileImage tile={meld.winTile} size={16} /></>}
                </div>
                {error && <div className="meld-error">{error.message}</div>}
              </div>
              <button className="meld-remove" onClick={() => removeMeld(i)}>x</button>
            </li>
          );
        })}
      </ul>

      {adding
        ? <AddSetSheet onAdd={addMeld} onCancel={() => setAdding(false)} />
        : <button className="add-set-btn" onClick={() => setAdding(true)}>+ Add set</button>
      }
    </section>
  );
}

const MELD_TYPES: MeldType[] = ['chow', 'pong', 'kong', 'pair', 'flower', 'orphans'];

function AddSetSheet({ onAdd, onCancel }: {
  onAdd: (meld: Meld) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<MeldType>('chow');
  const [concealed, setConcealed] = useState(true);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [winTile, setWinTile] = useState<Tile | null>(null);
  const [flowerCount, setFlowerCount] = useState(1);
  const [orphanPair, setOrphanPair] = useState<Tile | null>(null);

  function changeType(t: MeldType) {
    setType(t);
    setTiles([]);
    setWinTile(null);
    setOrphanPair(null);
  }

  function handleAdd() {
    if (type === 'flower') {
      onAdd({ type: 'flower', tiles: Array(flowerCount).fill('F'), concealed: false });
      return;
    }
    if (type === 'orphans') {
      const pair = orphanPair ?? ORPHAN_TILES[0];
      onAdd({
        type: 'orphans',
        tiles: [...ORPHAN_TILES, pair],
        concealed: true,
        winTile: winTile ?? undefined,
      });
      return;
    }
    onAdd({
      type,
      tiles,
      concealed,
      ...(winTile ? { winTile } : {}),
    });
  }

  function selectTile(tile: Tile) {
    if (type === 'pong' || type === 'kong' || type === 'pair') {
      if (tiles[0] === tile) {
        setTiles([]);
        setWinTile(null);
      } else {
        const count = type === 'kong' ? 4 : type === 'pair' ? 2 : 3;
        setTiles(Array(count).fill(tile));
      }
    } else {
      const max = 3;
      if (tiles.includes(tile)) {
        setTiles(tiles.filter(t => t !== tile));
        if (winTile === tile) setWinTile(null);
      } else if (tiles.length < max) {
        setTiles([...tiles, tile]);
      }
    }
  }

  const canAdd =
    type === 'flower' ? flowerCount >= 1 :
    type === 'orphans' ? true :
    type === 'kong' ? tiles.length === 4 :
    type === 'pair' ? tiles.length === 2 :
    tiles.length === 3;

  return (
    <div className="sheet">
      <h3 className="sheet-title">What kind of set?</h3>

      <div className="type-selector">
        {MELD_TYPES.map(t => (
          <button
            key={t}
            className="type-btn"
            aria-pressed={type === t}
            onClick={() => changeType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {type === 'flower' && (
        <div className="form-row">
          <span className="form-label">How many flowers?</span>
          <input
            className="number-input"
            type="number"
            min={1}
            max={8}
            value={flowerCount}
            onChange={e => setFlowerCount(parseInt(e.target.value) || 1)}
          />
        </div>
      )}

      {type === 'orphans' && (
        <div>
          <p className="orphans-info">
            Thirteen orphans: one of each terminal and honor tile + one duplicate.
          </p>
          <div className="orphans-fields">
            <div className="form-row">
              <span className="form-label">Which tile is the pair?</span>
              <select
                className="select-input"
                value={orphanPair ?? ''}
                onChange={e => setOrphanPair(e.target.value || null)}
              >
                <option value="">Select tile</option>
                {ORPHAN_TILES.map(t => (
                  <option key={t} value={t}>{tileName(t)}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <span className="form-label">Which tile completed the hand?</span>
              <select
                className="select-input"
                value={winTile ?? ''}
                onChange={e => setWinTile(e.target.value || null)}
              >
                <option value="">Select tile</option>
                {ORPHAN_TILES.map(t => (
                  <option key={t} value={t}>{tileName(t)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {type !== 'flower' && type !== 'orphans' && (
        <>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={concealed}
              onChange={e => setConcealed(e.target.checked)}
            />
            Concealed
          </label>

          <TilePicker
            selected={tiles}
            onToggle={selectTile}
            meldType={type}
          />

          {tiles.length > 0 && (
            <div>
              <div className="selected-tiles">
                Selected: {tiles.map((t, i) => <TileImage key={i} tile={t} size={24} />)}
              </div>
              <div className="form-row">
                <span className="form-label">Winning tile in this set?</span>
                <select
                  className="select-input"
                  value={winTile ?? ''}
                  onChange={e => setWinTile(e.target.value || null)}
                >
                  <option value="">No</option>
                  {[...new Set(tiles)].map(t => (
                    <option key={t} value={t}>{tileName(t)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      )}

      <div className="sheet-actions">
        <button className="btn-primary" onClick={handleAdd} disabled={!canAdd}>
          Add to hand
        </button>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
