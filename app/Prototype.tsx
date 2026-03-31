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

  function tapTile(tile: Tile) {
    if (phase === 'win-tile') {
      setState(s => ({ ...s, winTile: tile, phase: 'done' }));
      return;
    }

    if (phase === 'done') return;

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

  function switchToConcealed() {
    commitCurrentSet();
    setState(s => ({ ...s, phase: 'concealed' }));
  }

  function goToWinTile() {
    commitCurrentSet();
    setState(s => ({ ...s, phase: 'win-tile' }));
  }

  function commitAsPair() {
    commitCurrentSet(true);
  }

  function addFlower() {
    setState(s => ({
      ...s,
      flowers: s.flowers + 1,
      exposed: [...s.exposed, { type: 'flower', tiles: ['F'], concealed: false }],
    }));
  }

  function undo() {
    setState(s => {
      if (s.currentSet.tiles.length > 0) {
        return { ...s, currentSet: { tiles: s.currentSet.tiles.slice(0, -1) } };
      }
      // Remove last committed set from current phase
      const key = s.phase === 'exposed' ? 'exposed' : 'concealed';
      const sets = s[key];
      if (sets.length > 0) {
        const last = sets[sets.length - 1];
        return {
          ...s,
          [key]: sets.slice(0, -1),
          currentSet: { tiles: last.type === 'flower' ? [] : last.tiles },
          flowers: last.type === 'flower' ? s.flowers - 1 : s.flowers,
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

  const currentStatus = setStatusLabel(currentSet.tiles);
  const allTiles = allMelds.flatMap(m => m.tiles).concat(currentSet.tiles);

  return (
    <div className="proto">
      <div className="proto-header">
        <span className="proto-phase">
          {phase === 'exposed' && 'Entering exposed sets'}
          {phase === 'concealed' && 'Entering concealed sets'}
          {phase === 'win-tile' && 'Tap the tile you won with'}
          {phase === 'done' && 'Hand complete'}
        </span>
        <button onClick={reset} className="proto-btn-sm">Reset</button>
      </div>

      {/* Hand display */}
      <div className="proto-hand">
        {exposed.length > 0 && (
          <div className="proto-row">
            <span className="proto-row-label">Exposed</span>
            <div className="proto-sets">
              {exposed.map((m, i) => (
                <div key={`e${i}`} className="proto-set">
                  <div className="proto-set-tiles">
                    {m.tiles.map((t, j) => (
                      <span key={j} className="tile-frame tile-sm">
                        <TileImage tile={t} size={18} />
                      </span>
                    ))}
                  </div>
                  <span className="proto-set-label">{m.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {concealed.length > 0 && (
          <div className="proto-row">
            <span className="proto-row-label">Concealed</span>
            <div className="proto-sets">
              {concealed.map((m, i) => (
                <div key={`c${i}`} className="proto-set">
                  <div className="proto-set-tiles">
                    {m.tiles.map((t, j) => (
                      <span key={j} className="tile-frame tile-sm">
                        <TileImage tile={t} size={18} />
                      </span>
                    ))}
                  </div>
                  <span className="proto-set-label">{m.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current set being built */}
        {(phase === 'exposed' || phase === 'concealed') && (
          <div className="proto-current">
            <div className="proto-set-tiles">
              {currentSet.tiles.map((t, j) => (
                <span key={j} className="tile-frame tile-sm">
                  <TileImage tile={t} size={22} />
                </span>
              ))}
              {currentSet.tiles.length === 0 && (
                <span className="proto-placeholder">tap a tile below</span>
              )}
            </div>
            {currentSet.tiles.length > 0 && (
              <span className={`proto-set-status ${currentStatus.includes('✓') ? 'valid' : currentStatus.includes('✗') ? 'invalid' : ''}`}>
                {currentStatus}
              </span>
            )}
          </div>
        )}

        {/* Win tile display */}
        {winTile && (
          <div className="proto-win-tile">
            Won with: <span className="tile-frame tile-sm"><TileImage tile={winTile} size={20} /></span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {(phase === 'exposed' || phase === 'concealed') && (
        <div className="proto-actions">
          {currentSet.tiles.length === 2 && currentSet.tiles[0] === currentSet.tiles[1] && !hasPair && (
            <button onClick={commitAsPair} className="proto-btn">It's a pair</button>
          )}
          {currentSet.tiles.length >= 3 && detectMeldType(currentSet.tiles) !== 'invalid' && (
            <button onClick={() => commitCurrentSet()} className="proto-btn">Next set</button>
          )}
          <button onClick={addFlower} className="proto-btn">+ Flower</button>
          {phase === 'exposed' && (
            <button onClick={switchToConcealed} className="proto-btn proto-btn-primary">Done with exposed →</button>
          )}
          {phase === 'concealed' && (
            <button onClick={goToWinTile} className="proto-btn proto-btn-primary">Done → pick win tile</button>
          )}
        </div>
      )}

      {/* Tile picker grid + undo */}
      {phase !== 'done' && (
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
