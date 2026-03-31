import { useState } from 'react';
import type { Meld, MeldType, Tile } from '../src/types.js';
import { TilePicker } from './TilePicker.tsx';

interface Props {
  melds: Meld[];
  onChange: (melds: Meld[]) => void;
}

export function HandBuilder({ melds, onChange }: Props) {
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
        {melds.map((meld, i) => (
          <li key={i}>
            {meld.tiles.join(' ')} ({meld.type})
            {meld.concealed && ' - concealed'}
            {meld.winTile && ` - won with ${meld.winTile}`}
            <button onClick={() => removeMeld(i)}> x</button>
          </li>
        ))}
      </ul>

      {adding
        ? <AddSetSheet onAdd={addMeld} onCancel={() => setAdding(false)} />
        : <button onClick={() => setAdding(true)}>+ Add set</button>
      }
    </section>
  );
}

function AddSetSheet({ onAdd, onCancel }: {
  onAdd: (meld: Meld) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<MeldType>('chow');
  const [concealed, setConcealed] = useState(true);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [winTile, setWinTile] = useState<Tile | null>(null);

  const expectedCount = type === 'kong' ? 4 : type === 'pair' ? 2 : 3;
  const canAdd = tiles.length === expectedCount;

  function handleAdd() {
    onAdd({
      type,
      tiles,
      concealed,
      ...(winTile ? { winTile } : {}),
    });
  }

  function selectTile(tile: Tile) {
    if (type === 'pong' || type === 'kong' || type === 'pair') {
      // Identical tiles — clicking picks the tile, clicking again deselects
      if (tiles[0] === tile) {
        setTiles([]);
        setWinTile(null);
      } else {
        setTiles(Array(expectedCount).fill(tile));
      }
    } else {
      // Chow — toggle individual tiles
      if (tiles.includes(tile)) {
        setTiles(tiles.filter(t => t !== tile));
        if (winTile === tile) setWinTile(null);
      } else if (tiles.length < expectedCount) {
        setTiles([...tiles, tile]);
      }
    }
  }

  return (
    <div>
      <h3>What kind of set?</h3>

      <div>
        {(['chow', 'pong', 'kong', 'pair'] as MeldType[]).map(t => (
          <button
            key={t}
            onClick={() => { setType(t); setTiles([]); setWinTile(null); }}
            style={{ fontWeight: type === t ? 'bold' : 'normal' }}
          >
            {t}
          </button>
        ))}
      </div>

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

      <div>
        <button onClick={handleAdd} disabled={!canAdd}>Add to hand</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
