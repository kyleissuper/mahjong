import { useState } from 'react';
import type { Meld, MeldType, Tile } from '../src/types.js';
import type { ValidationError } from '../src/validate-hand.js';
import { TilePicker } from './TilePicker.tsx';
import { TileImage } from './TileImage.tsx';

const ORPHAN_TILES: Tile[] = [
  '1b', '9b', '1d', '9d', '1c', '9c',
  'Ew', 'Sw', 'Ww', 'Nw',
  'Rd', 'Gd', 'Wd',
];

const TYPE_LABELS: Record<MeldType, string> = {
  chow: 'Chow', pong: 'Pong', kong: 'Kong',
  pair: 'Pair', flower: 'Flower', orphans: '13 Orphans',
};

const MELD_TYPES: MeldType[] = ['chow', 'pong', 'kong', 'pair', 'flower', 'orphans'];

// --- MeldSlot: one component for both display and editing ---

function MeldSlot({ meld, error, expanded, onToggle, onSave, onRemove }: {
  meld?: Meld;
  error?: string;
  expanded: boolean;
  onToggle: () => void;
  onSave: (meld: Meld) => void;
  onRemove?: () => void;
}) {
  return (
    <div className={`meld-slot ${expanded ? 'meld-slot-open' : ''}`}>
      {meld && !expanded && (
        <div className="meld-row" onClick={onToggle}>
          <div className="meld-content">
            <span className="meld-tiles">
              {(meld.type === 'orphans' ? [...new Set(meld.tiles)] : meld.tiles).map((t, j) => (
                <span key={j} className="tile-frame tile-sm">
                  <TileImage tile={t} size={meld.type === 'orphans' ? 14 : 20} />
                </span>
              ))}
            </span>
            <span className="meld-info">
              <span className="meld-type">{TYPE_LABELS[meld.type]}</span>
              {meld.concealed && <span className="meld-tag">hidden</span>}
              {meld.winTile && <span className="meld-tag">win</span>}
            </span>
          </div>
          {onRemove && <button className="meld-x" onClick={e => { e.stopPropagation(); onRemove(); }}>×</button>}
        </div>
      )}

      {!meld && !expanded && (
        <button className="add-set-btn" aria-label="Add set" onClick={onToggle}>
          + Add set
        </button>
      )}

      {error && <div className="meld-error">{error}</div>}

      {expanded && (
        <MeldEditor initial={meld} onSave={onSave} onCancel={onToggle} />
      )}
    </div>
  );
}

// --- MeldEditor: the editing controls for a single meld ---

function MeldEditor({ initial, onSave, onCancel }: {
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
    setType(t); setTiles([]); setWinTile(null); setOrphanPair(null);
  }

  function selectTile(tile: Tile) {
    if (type === 'pong' || type === 'kong' || type === 'pair') {
      if (tiles[0] === tile) { setTiles([]); setWinTile(null); }
      else { setTiles(Array(type === 'kong' ? 4 : type === 'pair' ? 2 : 3).fill(tile)); }
    } else {
      if (tiles.includes(tile)) {
        setTiles(tiles.filter(t => t !== tile));
        if (winTile === tile) setWinTile(null);
      } else if (tiles.length < 3) {
        setTiles([...tiles, tile]);
      }
    }
  }

  function build(): Meld {
    if (type === 'flower') return { type, tiles: Array(flowerCount).fill('F'), concealed: false };
    if (type === 'orphans') {
      const pair = orphanPair ?? ORPHAN_TILES[0];
      return { type, tiles: [...ORPHAN_TILES, pair], concealed: true, winTile: winTile ?? undefined };
    }
    return { type, tiles, concealed, ...(winTile ? { winTile } : {}) };
  }

  const canSave =
    type === 'flower' ? flowerCount >= 1 :
    type === 'orphans' ? true :
    type === 'kong' ? tiles.length === 4 :
    type === 'pair' ? tiles.length === 2 :
    tiles.length === 3;

  return (
    <div className="meld-editor">
      <div className="type-selector">
        {MELD_TYPES.map(t => (
          <button key={t} className="type-btn" aria-pressed={type === t} onClick={() => changeType(t)}>
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {type === 'flower' && (
        <div>
          <div className="form-label">How many?</div>
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
              <div className="form-label">Winning tile?</div>
              <div className="tile-row">
                <button className="type-btn" aria-pressed={winTile === null} onClick={() => setWinTile(null)}>None</button>
                {[...new Set(tiles)].map(t => (
                  <button key={t} className="tile-frame tile-btn tile-sm" aria-pressed={winTile === t} onClick={() => setWinTile(winTile === t ? null : t)}>
                    <TileImage tile={t} size={20} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="meld-editor-actions">
        <button className="btn-primary" onClick={() => onSave(build())} disabled={!canSave}>
          {initial ? 'Save' : 'Add'}
        </button>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function OrphanTilePicker({ selected, onSelect, label }: {
  selected: Tile | null;
  onSelect: (tile: Tile | null) => void;
  label: string;
}) {
  return (
    <div>
      <div className="form-label">{label}</div>
      <div className="tile-row">
        {ORPHAN_TILES.map(tile => (
          <button key={tile} className="tile-frame tile-btn tile-sm" aria-pressed={selected === tile} aria-label={tile}
            onClick={() => onSelect(selected === tile ? null : tile)}>
            <TileImage tile={tile} size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}

// --- HandBuilder: just a list of MeldSlots ---

interface Props {
  melds: Meld[];
  errors: ValidationError[];
  onChange: (melds: Meld[]) => void;
}

export function HandBuilder({ melds, errors, onChange }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  function saveMeld(index: number, meld: Meld) {
    if (index < melds.length) {
      onChange(melds.map((m, i) => i === index ? meld : m));
    } else {
      onChange([...melds, meld]);
    }
    setOpen(null);
  }

  function removeMeld(index: number) {
    onChange(melds.filter((_, i) => i !== index));
    if (open === index) setOpen(null);
  }

  return (
    <section className="hand-section">
      {melds.map((meld, i) => (
        <MeldSlot
          key={i}
          meld={meld}
          error={errors.find(e => e.meld === i)?.message}
          expanded={open === i}
          onToggle={() => setOpen(open === i ? null : i)}
          onSave={m => saveMeld(i, m)}
          onRemove={() => removeMeld(i)}
        />
      ))}
      <MeldSlot
        expanded={open === melds.length}
        onToggle={() => setOpen(open === melds.length ? null : melds.length)}
        onSave={m => saveMeld(melds.length, m)}
      />
    </section>
  );
}
