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
    <section className="hand-section">
      <div className="hand-header">
        <h2 className="hand-title">Your hand</h2>
        {melds.length > 0 && !isEditing && (
          <button className="add-btn" onClick={() => setEditing(melds.length)}>+</button>
        )}
      </div>

      {melds.length === 0 && !isEditing && (
        <button className="empty-hand-btn" onClick={() => setEditing(0)}>
          Tap to add your first set
        </button>
      )}

      <div className="meld-row-list">
        {melds.map((meld, i) => {
          const error = errors.find(e => e.meld === i);
          return (
            <div key={i}>
              <div
                className={`meld-row ${editing === i ? 'meld-row-active' : ''}`}
                onClick={() => setEditing(editing === i ? null : i)}
              >
                <span className="meld-tiles">
                  {meld.tiles.map((t, j) => (
                    <span key={j} className="tile-frame tile-sm">
                      <TileImage tile={t} size={20} />
                    </span>
                  ))}
                </span>
                <span className="meld-info">
                  <span className="meld-type">{TYPE_LABELS[meld.type]}</span>
                  {meld.concealed && <span className="meld-tag">hidden</span>}
                  {meld.winTile && <span className="meld-tag">win</span>}
                </span>
                <button className="meld-x" onClick={e => { e.stopPropagation(); removeMeld(i); }}>×</button>
                {error && <span className="meld-error-dot" title={error.message}>!</span>}
              </div>
              {editing === i && (
                <SetSheet initial={meld} onSave={saveMeld} onCancel={() => setEditing(null)} />
              )}
            </div>
          );
        })}
      </div>

      {editing === melds.length && (
        <SetSheet onSave={saveMeld} onCancel={() => setEditing(null)} />
      )}
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
            className="tile-frame tile-btn tile-sm"
            aria-pressed={selected === tile}
            aria-label={tile}
            onClick={() => onSelect(selected === tile ? null : tile)}
          >
            <TileImage tile={tile} size={18} />
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

  return (
    <div className="sheet-overlay">
      <div className="sheet">
        <div className="sheet-header">
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
        </div>

        <div className="sheet-body">
          {type === 'flower' && (
            <div>
              <div className="form-label" style={{ marginBottom: 6 }}>How many?</div>
              <div className="stepper">
                <button className="stepper-btn" onClick={() => setFlowerCount(Math.max(1, flowerCount - 1))} disabled={flowerCount <= 1}>-</button>
                <span className="stepper-value">{flowerCount}</span>
                <button className="stepper-btn" onClick={() => setFlowerCount(Math.min(8, flowerCount + 1))} disabled={flowerCount >= 8}>+</button>
              </div>
            </div>
          )}

          {type === 'orphans' && (
            <div className="orphans-fields">
              <OrphanTilePicker selected={orphanPair} onSelect={setOrphanPair} label="Pair tile" />
              <OrphanTilePicker selected={winTile} onSelect={setWinTile} label="Winning tile" />
            </div>
          )}

          {type !== 'flower' && type !== 'orphans' && (
            <>
              <div className="toggle-row">
                <button className="type-btn" aria-pressed={concealed} onClick={() => setConcealed(true)}>Concealed</button>
                <button className="type-btn" aria-pressed={!concealed} onClick={() => setConcealed(false)}>Exposed</button>
              </div>

              <TilePicker selected={tiles} onToggle={selectTile} meldType={type} />

              {tiles.length > 0 && (
                <div>
                  <div className="form-label" style={{ marginBottom: 6 }}>Winning tile?</div>
                  <div className="tile-row">
                    <button className="type-btn" aria-pressed={winTile === null} onClick={() => setWinTile(null)}>None</button>
                    {[...new Set(tiles)].map(t => (
                      <button
                        key={t}
                        className="tile-frame tile-btn tile-sm"
                        aria-pressed={winTile === t}
                        onClick={() => setWinTile(winTile === t ? null : t)}
                      >
                        <TileImage tile={t} size={20} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sheet-actions">
          <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
            {initial ? 'Save' : 'Add'}
          </button>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
