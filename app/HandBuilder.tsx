import { useState } from 'react';
import type { Meld, MeldType, Tile } from '../src/types.js';
import type { ValidationError } from '../src/validate-hand.js';
import { TilePicker } from './TilePicker.tsx';

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
    <section>
      <h2>Your hand</h2>

      {melds.length === 0 && <p>No sets yet. Add your first set to start scoring.</p>}

      <ul>
        {melds.map((meld, i) => {
          const error = errors.find(e => e.meld === i);
          return (
            <li key={i}>
              {meld.tiles.join(' ')} ({meld.type})
              {meld.concealed && ' - concealed'}
              {meld.winTile && ` - won with ${meld.winTile}`}
              <button onClick={() => removeMeld(i)}> x</button>
              {error && <span style={{ color: 'red' }}> {error.message}</span>}
            </li>
          );
        })}
      </ul>

      {adding
        ? <AddSetSheet onAdd={addMeld} onCancel={() => setAdding(false)} />
        : <button onClick={() => setAdding(true)}>+ Add set</button>
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
    <div>
      <h3>What kind of set?</h3>

      <div>
        {MELD_TYPES.map(t => (
          <button
            key={t}
            onClick={() => changeType(t)}
            style={{ fontWeight: type === t ? 'bold' : 'normal' }}
          >
            {t}
          </button>
        ))}
      </div>

      {type === 'flower' && (
        <label>
          How many flowers?{' '}
          <input
            type="number"
            min={1}
            max={8}
            value={flowerCount}
            onChange={e => setFlowerCount(parseInt(e.target.value) || 1)}
          />
        </label>
      )}

      {type === 'orphans' && (
        <div>
          <p>Thirteen orphans: one of each terminal and honor tile + one duplicate.</p>
          <label>
            Which tile is the pair?{' '}
            <select
              value={orphanPair ?? ''}
              onChange={e => setOrphanPair(e.target.value || null)}
            >
              <option value="">Select tile</option>
              {ORPHAN_TILES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Which tile completed the hand?{' '}
            <select
              value={winTile ?? ''}
              onChange={e => setWinTile(e.target.value || null)}
            >
              <option value="">Select tile</option>
              {ORPHAN_TILES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {type !== 'flower' && type !== 'orphans' && (
        <>
          <label>
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
              <p>Selected: {tiles.join(' ')}</p>
              <label>
                Winning tile in this set?{' '}
                <select
                  value={winTile ?? ''}
                  onChange={e => setWinTile(e.target.value || null)}
                >
                  <option value="">No</option>
                  {[...new Set(tiles)].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </>
      )}

      <div>
        <button onClick={handleAdd} disabled={!canAdd}>Add to hand</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
