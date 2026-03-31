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

const TYPE_LABELS: Record<MeldType, string> = {
  chow: 'Chow',
  pong: 'Pong',
  kong: 'Kong',
  pair: 'Pair',
  flower: 'Flower',
  orphans: '13 Orphans',
};

const MELD_TYPES: MeldType[] = ['chow', 'pong', 'kong', 'pair', 'flower', 'orphans'];

interface Props {
  melds: Meld[];
  errors: ValidationError[];
  onChange: (melds: Meld[]) => void;
}

export function HandBuilder({ melds, errors, onChange }: Props) {
  const [editing, setEditing] = useState<number | null>(null);

  function saveMeld(meld: Meld) {
    if (editing !== null && editing < melds.length) {
      onChange(melds.map((m, i) => i === editing ? meld : m));
    } else {
      onChange([...melds, meld]);
    }
    setEditing(null);
  }

  function removeMeld(index: number) {
    onChange(melds.filter((_, i) => i !== index));
    if (editing === index) setEditing(null);
  }

  const isEditing = editing !== null;

  return (
    <section className="section">
      <h2 className="section-title">Your hand</h2>

      {melds.length === 0 && !isEditing && (
        <p className="empty-hand">No sets yet. Add your first set to start scoring.</p>
      )}

      <ul className="meld-list">
        {melds.map((meld, i) => {
          const error = errors.find(e => e.meld === i);
          const isThis = editing === i;
          return (
            <li key={i}>
              <div className={`meld-item ${isThis ? 'meld-item-editing' : ''}`}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEditing(isThis ? null : i)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="meld-tiles">
                      {meld.tiles.map((t, j) => (
                        <span key={j} className="tile-frame">
                          <TileImage tile={t} />
                        </span>
                      ))}
                    </span>
                    <span className="meld-type">{TYPE_LABELS[meld.type]}</span>
                  </div>
                  <div className="meld-meta">
                    {meld.concealed && 'concealed'}
                    {meld.winTile && <> · won with <span className="tile-frame"><TileImage tile={meld.winTile} size={16} /></span></>}
                  </div>
                  {error && <div className="meld-error">{error.message}</div>}
                </div>
                <button className="meld-remove" onClick={() => removeMeld(i)}>x</button>
              </div>
              {isThis && (
                <SetSheet
                  initial={meld}
                  onSave={saveMeld}
                  onCancel={() => setEditing(null)}
                />
              )}
            </li>
          );
        })}
      </ul>

      {editing === melds.length
        ? <SetSheet
            onSave={saveMeld}
            onCancel={() => setEditing(null)}
          />
        : !isEditing && <button className="add-set-btn" onClick={() => setEditing(melds.length)}>+ Add set</button>
      }
    </section>
  );
}

function OrphanTilePicker({ selected, onSelect, label }: {
  selected: Tile | null;
  onSelect: (tile: Tile | null) => void;
  label: string;
}) {
  return (
    <div>
      <div className="form-label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="tile-row">
        {ORPHAN_TILES.map(tile => (
          <button
            key={tile}
            className="tile-frame tile-btn"
            aria-pressed={selected === tile}
            aria-label={tile}
            onClick={() => onSelect(selected === tile ? null : tile)}
          >
            <TileImage tile={tile} size={22} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SetSheet({ initial, onSave, onCancel }: {
  initial?: Meld;
  onSave: (meld: Meld) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<MeldType>(initial?.type ?? 'chow');
  const [concealed, setConcealed] = useState(initial?.concealed ?? true);
  const [tiles, setTiles] = useState<Tile[]>(
    initial && initial.type !== 'flower' && initial.type !== 'orphans' ? initial.tiles : [],
  );
  const [winTile, setWinTile] = useState<Tile | null>(initial?.winTile ?? null);
  const [flowerCount, setFlowerCount] = useState(
    initial?.type === 'flower' ? initial.tiles.length : 1,
  );
  const [orphanPair, setOrphanPair] = useState<Tile | null>(() => {
    if (initial?.type !== 'orphans') return null;
    const counts = new Map<Tile, number>();
    for (const t of initial.tiles) counts.set(t, (counts.get(t) ?? 0) + 1);
    for (const [t, c] of counts) if (c > 1) return t;
    return null;
  });

  function changeType(t: MeldType) {
    setType(t);
    setTiles([]);
    setWinTile(null);
    setOrphanPair(null);
  }

  function handleSave() {
    if (type === 'flower') {
      onSave({ type: 'flower', tiles: Array(flowerCount).fill('F'), concealed: false });
      return;
    }
    if (type === 'orphans') {
      const pair = orphanPair ?? ORPHAN_TILES[0];
      onSave({
        type: 'orphans',
        tiles: [...ORPHAN_TILES, pair],
        concealed: true,
        winTile: winTile ?? undefined,
      });
      return;
    }
    onSave({
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

  const canSave =
    type === 'flower' ? flowerCount >= 1 :
    type === 'orphans' ? true :
    type === 'kong' ? tiles.length === 4 :
    type === 'pair' ? tiles.length === 2 :
    tiles.length === 3;

  const isNew = !initial;

  return (
    <div className="sheet">
      <h3 className="sheet-title">{isNew ? 'Add a set' : 'Edit set'}</h3>

      <div className="type-selector">
        {MELD_TYPES.map(t => (
          <button
            key={t}
            className="type-btn"
            aria-pressed={type === t}
            onClick={() => changeType(t)}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {type === 'flower' && (
        <div>
          <div className="form-label" style={{ marginBottom: 6 }}>How many flowers?</div>
          <div className="stepper">
            <button className="stepper-btn" onClick={() => setFlowerCount(Math.max(1, flowerCount - 1))} disabled={flowerCount <= 1}>-</button>
            <span className="stepper-value">{flowerCount}</span>
            <button className="stepper-btn" onClick={() => setFlowerCount(Math.min(8, flowerCount + 1))} disabled={flowerCount >= 8}>+</button>
          </div>
        </div>
      )}

      {type === 'orphans' && (
        <div>
          <p className="orphans-info">
            One of each terminal and honor tile + one duplicate.
          </p>
          <div className="orphans-fields">
            <OrphanTilePicker
              selected={orphanPair}
              onSelect={setOrphanPair}
              label="Which tile is the pair?"
            />
            <OrphanTilePicker
              selected={winTile}
              onSelect={setWinTile}
              label="Which tile completed the hand?"
            />
          </div>
        </div>
      )}

      {type !== 'flower' && type !== 'orphans' && (
        <>
          <div className="toggle-row">
            <button
              className="type-btn"
              aria-pressed={concealed}
              onClick={() => setConcealed(true)}
            >
              Concealed
            </button>
            <button
              className="type-btn"
              aria-pressed={!concealed}
              onClick={() => setConcealed(false)}
            >
              Exposed
            </button>
          </div>

          <TilePicker
            selected={tiles}
            onToggle={selectTile}
            meldType={type}
          />

          {tiles.length > 0 && (
            <div>
              <div className="selected-tiles">
                Selected: {tiles.map((t, i) => <span key={i} className="tile-frame"><TileImage tile={t} size={24} /></span>)}
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 6 }}>Winning tile in this set?</div>
                <div className="tile-row">
                  <button
                    className="type-btn"
                    aria-pressed={winTile === null}
                    onClick={() => setWinTile(null)}
                  >
                    None
                  </button>
                  {[...new Set(tiles)].map(t => (
                    <button
                      key={t}
                      className="tile-frame tile-btn"
                      aria-pressed={winTile === t}
                      onClick={() => setWinTile(winTile === t ? null : t)}
                    >
                      <TileImage tile={t} size={22} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="sheet-actions">
        <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
          {isNew ? 'Add to hand' : 'Save'}
        </button>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
