import { useState, useCallback } from 'react';
import type { Tile, MeldType, Meld } from '../src/types.js';
import { TileImage } from './TileImage.tsx';
import './prototype.css';

// --- Types ---

interface SetInProgress {
  tiles: Tile[];
}

type Phase = 'exposed' | 'concealed' | 'win-tile' | 'done';

interface HandState {
  exposed: Meld[];
  concealed: Meld[];
  currentSet: SetInProgress;
  phase: Phase;
  winTile: Tile | null;
  flowers: number;
}

// --- Set detection ---

function detectMeldType(tiles: Tile[]): MeldType | 'invalid' | 'incomplete' {
  if (tiles.length === 0) return 'incomplete';
  if (tiles.length === 1) return 'incomplete';

  const allSame = tiles.every(t => t === tiles[0]);

  if (tiles.length === 2) {
    if (allSame) return 'incomplete'; // could be pair, pong, or kong
    // Check if they could be part of a chow
    if (isNumberTile(tiles[0]) && isNumberTile(tiles[1]) && sameSuit(tiles[0], tiles[1])) {
      return 'incomplete';
    }
    return 'invalid';
  }

  if (tiles.length === 3) {
    if (allSame) return 'pong';
    if (isValidChow(tiles)) return 'chow';
    return 'invalid';
  }

  if (tiles.length === 4) {
    if (allSame) return 'kong';
    return 'invalid';
  }

  return 'invalid';
}

function isNumberTile(tile: Tile): boolean {
  return tile.length === 2 && tile[0] >= '1' && tile[0] <= '9';
}

function sameSuit(a: Tile, b: Tile): boolean {
  return a[a.length - 1] === b[b.length - 1];
}

function isValidChow(tiles: Tile[]): boolean {
  if (tiles.length !== 3) return false;
  if (!tiles.every(isNumberTile)) return false;
  if (!tiles.every(t => sameSuit(t, tiles[0]))) return false;
  const values = tiles.map(t => parseInt(t[0])).sort((a, b) => a - b);
  return values[1] === values[0] + 1 && values[2] === values[0] + 2;
}

function couldExtendToValid(tiles: Tile[], newTile: Tile): boolean {
  const extended = [...tiles, newTile];
  const type = detectMeldType(extended);
  if (type !== 'invalid') return true;

  // Could still become a chow?
  if (extended.length <= 3 && extended.every(isNumberTile) && extended.every(t => sameSuit(t, extended[0]))) {
    const values = extended.map(t => parseInt(t[0])).sort((a, b) => a - b);
    const spread = values[values.length - 1] - values[0];
    return spread <= 2; // tiles within range of a chow
  }

  return false;
}

function isSetComplete(tiles: Tile[]): 'pong-or-kong' | 'complete' | 'no' {
  const type = detectMeldType(tiles);
  if (type === 'pong') return 'pong-or-kong'; // might want 4th tile
  if (type === 'chow' || type === 'kong') return 'complete';
  return 'no';
}

// --- Status label ---

function setStatusLabel(tiles: Tile[]): string {
  const type = detectMeldType(tiles);
  switch (type) {
    case 'incomplete': {
      if (tiles.length === 2 && tiles[0] === tiles[1]) return 'pong? kong?';
      if (tiles.length === 1) return 'picking...';
      return 'picking...';
    }
    case 'chow': return 'chow ✓';
    case 'pong': return 'pong ✓ (or kong?)';
    case 'kong': return 'kong ✓';
    case 'invalid': return 'invalid ✗';
    default: return '';
  }
}

// --- Tile grid ---

const ALL_SUITS = [
  { name: 'Bamboo', tiles: ['1b','2b','3b','4b','5b','6b','7b','8b','9b'] },
  { name: 'Dots', tiles: ['1d','2d','3d','4d','5d','6d','7d','8d','9d'] },
  { name: 'Characters', tiles: ['1c','2c','3c','4c','5c','6c','7c','8c','9c'] },
  { name: 'Winds', tiles: ['Ew','Sw','Ww','Nw'] },
  { name: 'Dragons', tiles: ['Rd','Gd','Wd'] },
  { name: 'Flower', tiles: ['F'] },
];

// --- Main component ---

export function Prototype() {
  const [state, setState] = useState<HandState>({
    exposed: [],
    concealed: [],
    currentSet: { tiles: [] },
    phase: 'exposed',
    winTile: null,
    flowers: 0,
  });

  const { exposed, concealed, currentSet, phase, winTile, flowers } = state;

  const allMelds = [...exposed, ...concealed];
  const totalSets = allMelds.filter(m => m.type !== 'flower').length;
  const hasPair = allMelds.some(m => m.type === 'pair');

  function commitCurrentSet(asPair = false) {
    const tiles = currentSet.tiles;
    if (tiles.length === 0) return;

    let type: MeldType;
    if (asPair && tiles.length === 2 && tiles[0] === tiles[1]) {
      type = 'pair';
    } else {
      const detected = detectMeldType(tiles);
      if (detected === 'incomplete' || detected === 'invalid') return;
      type = detected;
    }

    const meld: Meld = { type, tiles, concealed: phase === 'concealed' };
    setState(s => ({
      ...s,
      [s.phase === 'exposed' ? 'exposed' : 'concealed']:
        [...(s.phase === 'exposed' ? s.exposed : s.concealed), meld],
      currentSet: { tiles: [] },
    }));
  }

  function pickWinTile(tile: Tile) {
    setState(s => ({ ...s, winTile: tile, phase: 'done' }));
  }

  function tapTile(tile: Tile) {
    if (phase === 'win-tile' || phase === 'done') return;

    // Flower: accumulate into a single flower meld
    if (tile === 'F') {
      setState(s => {
        const existing = s.exposed.findIndex(m => m.type === 'flower');
        if (existing >= 0) {
          const updated = s.exposed.map((m, i) =>
            i === existing ? { ...m, tiles: [...m.tiles, 'F'] } : m
          );
          return { ...s, exposed: updated, flowers: s.flowers + 1 };
        }
        return {
          ...s,
          exposed: [...s.exposed, { type: 'flower', tiles: ['F'], concealed: false }],
          flowers: s.flowers + 1,
        };
      });
      return;
    }

    const current = currentSet.tiles;

    // If current set is a complete pong and new tile is the same → extend to kong
    if (current.length === 3 && current[0] === tile && detectMeldType(current) === 'pong') {
      setState(s => ({ ...s, currentSet: { tiles: [...current, tile] } }));
      return;
    }

    // If current set is already complete, commit it first then start new
    const status = isSetComplete(current);
    if (status === 'complete') {
      commitCurrentSet();
      setState(s => ({ ...s, currentSet: { tiles: [tile] } }));
      return;
    }
    if (status === 'pong-or-kong' && current[0] !== tile) {
      // Different tile → commit pong, start new set
      commitCurrentSet();
      setState(s => ({ ...s, currentSet: { tiles: [tile] } }));
      return;
    }

    // Can this tile extend the current set?
    if (current.length === 0 || couldExtendToValid(current, tile)) {
      setState(s => ({ ...s, currentSet: { tiles: [...current, tile] } }));
    } else {
      // Doesn't fit → commit current if valid, start new
      const detected = detectMeldType(current);
      if (detected !== 'incomplete' && detected !== 'invalid') {
        commitCurrentSet();
        setState(s => ({ ...s, currentSet: { tiles: [tile] } }));
      }
      // If current set is invalid/incomplete, just replace? Or reject?
      // For now: start fresh
      else {
        setState(s => ({ ...s, currentSet: { tiles: [tile] } }));
      }
    }
  }

  function goToWinTile() {
    commitCurrentSet();
    setState(s => ({ ...s, phase: 'win-tile' }));
  }

  function commitAsPair() {
    commitCurrentSet(true);
  }

  function undo() {
    setState(s => {
      if (s.currentSet.tiles.length > 0) {
        return { ...s, currentSet: { tiles: s.currentSet.tiles.slice(0, -1) } };
      }
      // Check if last action was a flower (shrink or remove the flower group)
      const flowerIdx = s.exposed.findIndex(m => m.type === 'flower');
      if (flowerIdx >= 0 && s.flowers > 0) {
        const flowerMeld = s.exposed[flowerIdx];
        if (flowerMeld.tiles.length > 1) {
          return {
            ...s,
            exposed: s.exposed.map((m, i) => i === flowerIdx ? { ...m, tiles: m.tiles.slice(0, -1) } : m),
            flowers: s.flowers - 1,
          };
        }
        return {
          ...s,
          exposed: s.exposed.filter((_, i) => i !== flowerIdx),
          flowers: 0,
        };
      }
      // Remove last committed set from current phase
      const key = s.phase === 'exposed' ? 'exposed' : 'concealed';
      const sets = s[key];
      if (sets.length > 0) {
        const last = sets[sets.length - 1];
        return {
          ...s,
          [key]: sets.slice(0, -1),
          currentSet: { tiles: last.tiles },
        };
      }
      return s;
    });
  }

  function reset() {
    setState({
      exposed: [], concealed: [], currentSet: { tiles: [] },
      phase: 'exposed', winTile: null, flowers: 0,
    });
  }

  function editSet(row: 'exposed' | 'concealed', index: number) {
    if (phase !== row && phase !== 'exposed' && phase !== 'concealed') return;
    // Commit current set first if it has tiles
    if (currentSet.tiles.length > 0) {
      commitCurrentSet();
    }
    const sets = row === 'exposed' ? exposed : concealed;
    const meld = sets[index];
    if (!meld || meld.type === 'flower') return;
    setState(s => ({
      ...s,
      phase: row,
      [row]: sets.filter((_, i) => i !== index),
      currentSet: { tiles: meld.tiles },
    }));
  }

  const currentStatus = setStatusLabel(currentSet.tiles);
  const allTiles = allMelds.flatMap(m => m.tiles).concat(currentSet.tiles);
  const isEntering = phase === 'exposed' || phase === 'concealed';

  function renderSet(meld: Meld, key: string, onTap?: () => void) {
    const pickingWin = phase === 'win-tile';
    return (
      <div key={key} className={`proto-set ${onTap && !pickingWin ? 'proto-set-tappable' : ''}`} onClick={pickingWin ? undefined : onTap}>
        <div className="proto-set-tiles">
          {meld.tiles.map((t, j) => (
            <span
              key={j}
              className={`tile-frame tile-sm ${pickingWin ? 'tile-pickable' : ''} ${winTile === t ? 'tile-won' : ''}`}
              onClick={pickingWin ? (e) => { e.stopPropagation(); pickWinTile(t); } : undefined}
            >
              <TileImage tile={t} size={18} />
            </span>
          ))}
        </div>
        <span className="proto-set-label">{meld.type}</span>
      </div>
    );
  }

  function renderCurrentSet() {
    const tiles = currentSet.tiles;
    const placeholders = Math.max(0, 3 - tiles.length);
    return (
      <div className="proto-set proto-set-active">
        <div className="proto-set-tiles">
          {tiles.map((t, j) => (
            <span key={j} className="tile-frame tile-sm">
              <TileImage tile={t} size={18} />
            </span>
          ))}
          {Array.from({ length: placeholders }, (_, j) => (
            <span key={`p${j}`} className="tile-frame tile-sm tile-empty" />
          ))}
        </div>
        <span className={`proto-set-label ${currentStatus.includes('✓') ? 'valid' : currentStatus.includes('✗') ? 'invalid' : ''}`}>
          {tiles.length === 0 ? 'next set' : currentStatus}
        </span>
      </div>
    );
  }

  return (
    <div className="proto">
      <div className="proto-header">
        <span className="proto-phase">Mahjong Scorer</span>
        <button onClick={reset} className="proto-btn-sm">Reset</button>
      </div>

      {/* Hand display */}
      <div className="proto-hand">
        {phase === 'win-tile' && (
          <div className="proto-pick-hint">Tap the tile you won with</div>
        )}

        <div className={`proto-row ${phase === 'exposed' ? 'proto-row-active' : ''}`}>
          <span className="proto-row-label">Exposed</span>
          <div className="proto-sets">
            {exposed.map((m, i) => renderSet(m, `e${i}`, () => editSet('exposed', i)))}
            {isEntering && (phase === 'exposed'
              ? renderCurrentSet()
              : <div className="proto-set proto-set-placeholder" onClick={() => {
                  if (currentSet.tiles.length > 0) commitCurrentSet();
                  setState(s => ({ ...s, phase: 'exposed' }));
                }}>
                  <div className="proto-set-tiles">
                    <span className="tile-frame tile-sm tile-empty" />
                    <span className="tile-frame tile-sm tile-empty" />
                    <span className="tile-frame tile-sm tile-empty" />
                  </div>
                  <span className="proto-set-label">tap to add</span>
                </div>
            )}
          </div>
        </div>

        <div className={`proto-row ${phase === 'concealed' ? 'proto-row-active' : ''}`}>
          <span className="proto-row-label">Concealed</span>
          <div className="proto-sets">
            {concealed.map((m, i) => renderSet(m, `c${i}`, () => editSet('concealed', i)))}
            {isEntering && (phase === 'concealed'
              ? renderCurrentSet()
              : <div className="proto-set proto-set-placeholder" onClick={() => {
                  if (currentSet.tiles.length > 0) commitCurrentSet();
                  setState(s => ({ ...s, phase: 'concealed' }));
                }}>
                  <div className="proto-set-tiles">
                    <span className="tile-frame tile-sm tile-empty" />
                    <span className="tile-frame tile-sm tile-empty" />
                    <span className="tile-frame tile-sm tile-empty" />
                  </div>
                  <span className="proto-set-label">tap to add</span>
                </div>
            )}
          </div>
        </div>

        {winTile && (
          <div className="proto-win-tile">
            Won with: <span className="tile-frame tile-sm"><TileImage tile={winTile} size={20} /></span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {isEntering && (
        <div className="proto-actions">
          {currentSet.tiles.length >= 3 && detectMeldType(currentSet.tiles) !== 'invalid' && (
            <button onClick={() => commitCurrentSet()} className="proto-btn proto-btn-primary">Next set →</button>
          )}
          {currentSet.tiles.length === 2 && currentSet.tiles[0] === currentSet.tiles[1] && !hasPair && (
            <button onClick={commitAsPair} className="proto-btn">It's the pair</button>
          )}
          {currentSet.tiles.length > 0 && (
            <button onClick={() => setState(s => ({ ...s, currentSet: { tiles: [] } }))} className="proto-btn proto-btn-danger">Delete set</button>
          )}
          <button onClick={goToWinTile} className="proto-btn">Done → pick winning tile</button>
        </div>
      )}

      {/* Tile picker grid + undo */}
      {isEntering && (
        <div className="proto-grid">
          {ALL_SUITS.map(({ name, tiles }) => (
            <div key={name} className="proto-suit">
              <div className="proto-suit-name">{name}</div>
              <div className="proto-suit-tiles">
                {tiles.map(tile => (
                  <button
                    key={tile}
                    className={`tile-frame tile-btn ${currentSet.tiles.includes(tile) ? 'tile-active' : ''}`}
                    onClick={() => tapTile(tile)}
                    aria-label={tile}
                  >
                    <TileImage tile={tile} size={24} />
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={undo}
            disabled={currentSet.tiles.length === 0 && allMelds.length === 0}
            className="proto-undo"
          >
            ← Undo
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div className="proto-summary">
          <p>Total tiles: {allTiles.length}</p>
          <p>Sets: {totalSets} + {hasPair ? 'pair' : 'no pair'} + {flowers} flowers</p>
          <button onClick={reset} className="proto-btn">Start over</button>
        </div>
      )}
    </div>
  );
}
