import { useState, useMemo } from 'react';
import type { Tile, MeldType, Meld, Win, ScoreResult } from '../src/types.js';
import { calculateScore } from '../src/calculate-score.js';
import { TileImage } from './TileImage.tsx';
import './prototype.css';

const RULE_LABELS: Record<string, string> = {
  flower: 'Flower', dragonPong: 'Dragon pong', windPong: 'Wind pong',
  pairOf258: '2/5/8 pair', canOnlyWinWithOne: 'Single tile wait',
  allChows: 'All chows', allPongs: 'All pongs', selfPick: 'Self-pick',
  only2Suits: 'Only 2 suits', noTerminalsWithHonors: 'No 1s/9s (w/ honors)',
  threeSuitsWithWindAndDragon: '3 suits + wind + dragon',
  splitKong: 'Split kong', lastWallTile: 'Last wall tile',
  lastDiscard: 'Last discard', winFromButt: 'Win from butt',
  hiddenKong: 'Hidden kong', stolenKong: 'Stolen kong',
  allFromOthers: 'All from others', cleanDoorstep: 'Clean doorstep',
  cleanDoorstepAndSelfPick: 'Concealed self-pick',
  threeHiddenPongs: '3 hidden pongs', doubleChow: 'Double chow',
  threeSuitChow: '3 suit chow', threeConsecutivePongs: '3 consec. pongs',
  noFlowersNoHonors: 'No flowers/honors', oneToNineChain: '1-9 chain',
  twoKongMahjong: '2 kong mahjong', twoDoubleChows: '2 double chows',
  littleDragons: 'Little dragons', littleWinds: 'Little winds',
  bigDragons: 'Big dragons', bigWinds: 'Big winds', semiPure: 'Semi-pure',
  fourConsecutivePongs: '4 consec. pongs', terminalsAndHonors: 'Terminals & honors',
  pure: 'Pure', fourHiddenPongs: '4 hidden pongs',
  noTerminalsNoHonors: 'No 1s/9s, no honors', allKongs: 'All kongs',
  all1sOr9s: 'All 1s or 9s', threeSuitPongs: '3 suit pongs',
  allPairs: 'All pairs', allHonors: 'All honors',
  prodigyHand: 'Prodigy', heavenlyHand: 'Heavenly hand',
  earthlyHand: 'Earthly hand', heavenlyGates: 'Heavenly gates',
  thirteenOrphans: '13 orphans', allGreens: 'All greens',
};

// --- Types ---

interface SetInProgress {
  tiles: Tile[];
}

type Phase = 'exposed' | 'concealed' | 'done';

interface WinTilePos {
  row: 'exposed' | 'concealed';
  set: number;
  tile: number;
}

interface HandState {
  exposed: Meld[];
  concealed: Meld[];
  currentExposed: SetInProgress;
  currentConcealed: SetInProgress;
  phase: Phase;
  winTilePos: WinTilePos | null;
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
      if (tiles.length === 2 && tiles[0] === tiles[1]) return 'pair? pong?';
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
  { name: 'Winds / Dragons / Flower', tiles: ['Ew','Sw','Ww','Nw','Rd','Gd','Wd','F'] },
];

// --- Main component ---

export function Prototype() {
  const [state, setState] = useState<HandState>({
    exposed: [],
    concealed: [],
    currentExposed: { tiles: [] },
    currentConcealed: { tiles: [] },
    phase: 'exposed',
    winTilePos: null,
    flowers: 0,
  });

  const { exposed, concealed, currentExposed, currentConcealed, phase, winTilePos, flowers } = state;
  const currentSet = phase === 'exposed' ? currentExposed : currentConcealed;

  const [win, setWin] = useState<Partial<Win>>({
    method: 'discard',
    dealerRounds: 1,
    special: [],
  });

  const allMelds = [...exposed, ...concealed];
  const regularSets = allMelds.filter(m => m.type !== 'flower' && m.type !== 'pair').length;
  const hasPair = allMelds.some(m => m.type === 'pair');
  const needsPair = regularSets >= 4 && !hasPair;

  // Build Hand for scoring engine
  const scoringResult: ScoreResult | null = useMemo(() => {
    if (phase !== 'done' || !winTilePos) return null;
    const { winner, dealer, method = 'discard', dealerRounds = 1, special = [] } = win;
    if (!winner || !dealer) return null;
    if (method !== 'self-pick' && !win.from) return null;

    // Resolve win tile position to actual tile value and set it on the meld
    const melds = allMelds.map((m, i) => {
      const row = i < exposed.length ? 'exposed' : 'concealed';
      const idx = row === 'exposed' ? i : i - exposed.length;
      if (winTilePos.row === row && winTilePos.set === idx) {
        return { ...m, winTile: m.tiles[winTilePos.tile] };
      }
      return m;
    });

    try {
      return calculateScore({ melds }, {
        players: ['A', 'B', 'C', 'D'],
        winner, dealer, method,
        from: win.from,
        dealerRounds, special,
      });
    } catch {
      return null;
    }
  }, [phase, winTilePos, win, allMelds, exposed.length]);

  function activeSetKey(s: HandState) {
    return s.phase === 'exposed' ? 'currentExposed' as const : 'currentConcealed' as const;
  }

  function activeSet(s: HandState) {
    return s[activeSetKey(s)];
  }

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
      [s.phase === 'exposed' ? 'currentExposed' : 'currentConcealed']: { tiles: [] },
    }));
  }

  function pickWinTile(pos: WinTilePos) {
    setState(s => ({ ...s, winTilePos: pos }));
  }


  function tapTile(tile: Tile) {
    if (phase === 'done') return;

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
      setState(s => ({ ...s, [activeSetKey(s)]: { tiles: [...current, tile] } }));
      return;
    }

    // If current set is already complete, commit it first then start new
    const status = isSetComplete(current);
    if (status === 'complete') {
      commitCurrentSet();
      setState(s => ({ ...s, [activeSetKey(s)]: { tiles: [tile] } }));
      return;
    }
    if (status === 'pong-or-kong' && current[0] !== tile) {
      // Different tile → commit pong, start new set
      commitCurrentSet();
      setState(s => ({ ...s, [activeSetKey(s)]: { tiles: [tile] } }));
      return;
    }

    // Can this tile extend the current set?
    if (current.length === 0 || couldExtendToValid(current, tile)) {
      const newTiles = [...current, tile];
      setState(s => {
        // Auto-commit as pair if we need one and have 2 identical
        const sets = [...s.exposed, ...s.concealed].filter(m => m.type !== 'flower' && m.type !== 'pair').length;
        const needPair = sets >= 4 && !s.exposed.concat(s.concealed).some(m => m.type === 'pair');
        if (needPair && newTiles.length === 2 && newTiles[0] === newTiles[1]) {
          const meld: Meld = { type: 'pair', tiles: newTiles, concealed: s.phase === 'concealed' };
          return {
            ...s,
            [s.phase]: [...s[s.phase], meld],
            [activeSetKey(s)]: { tiles: [] },
          };
        }
        return { ...s, [activeSetKey(s)]: { tiles: newTiles } };
      });
    } else {
      // Doesn't fit → commit current if valid, start new
      const detected = detectMeldType(current);
      if (detected !== 'incomplete' && detected !== 'invalid') {
        commitCurrentSet();
        setState(s => ({ ...s, [activeSetKey(s)]: { tiles: [tile] } }));
      }
      // If current set is invalid/incomplete, just replace? Or reject?
      // For now: start fresh
      else {
        setState(s => ({ ...s, [activeSetKey(s)]: { tiles: [tile] } }));
      }
    }
  }

  function finishMelds() {
    commitCurrentSet();
    setState(s => ({ ...s, phase: 'done' }));
  }

  function undo() {
    setState(s => {
      const key = activeSetKey(s);
      const active = s[key];
      if (active.tiles.length > 0) {
        return { ...s, [key]: { tiles: active.tiles.slice(0, -1) } };
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
      const rowKey = s.phase === 'exposed' ? 'exposed' as const : 'concealed' as const;
      const sets = s[rowKey];
      if (sets.length > 0) {
        const last = sets[sets.length - 1];
        return {
          ...s,
          [rowKey]: sets.slice(0, -1),
          [activeSetKey(s)]: { tiles: last.tiles },
        };
      }
      return s;
    });
  }

  function reset() {
    setState({
      exposed: [], concealed: [],
      currentExposed: { tiles: [] }, currentConcealed: { tiles: [] },
      phase: 'exposed', winTilePos: null, flowers: 0,
    });
  }

  function editSet(row: 'exposed' | 'concealed', index: number) {
    if (phase !== 'exposed' && phase !== 'concealed') return;
    const sets = row === 'exposed' ? exposed : concealed;
    const meld = sets[index];
    if (!meld || meld.type === 'flower') return;
    const targetKey = row === 'exposed' ? 'currentExposed' as const : 'currentConcealed' as const;
    setState(s => ({
      ...s,
      phase: row,
      [row]: sets.filter((_, i) => i !== index),
      [targetKey]: { tiles: meld.tiles },
    }));
  }

  const currentStatus = setStatusLabel(currentSet.tiles);
  const allTiles = allMelds.flatMap(m => m.tiles).concat(currentSet.tiles);
  const isEntering = phase === 'exposed' || phase === 'concealed';

  function renderSet(meld: Meld, row: 'exposed' | 'concealed', setIdx: number, onTap?: () => void) {
    const canPickWin = phase === 'done';
    return (
      <div key={`${row}${setIdx}`} className={`proto-set ${onTap && !canPickWin ? 'proto-set-tappable' : ''}`} onClick={canPickWin ? undefined : onTap}>
        <div className="proto-set-tiles">
          {meld.tiles.map((t, j) => {
            const isWon = winTilePos?.row === row && winTilePos.set === setIdx && winTilePos.tile === j;
            return (
              <span
                key={j}
                className={`tile-frame tile-sm ${canPickWin ? 'tile-pickable' : ''} ${isWon ? 'tile-won' : ''}`}
                onClick={canPickWin ? (e) => { e.stopPropagation(); pickWinTile({ row, set: setIdx, tile: j }); } : undefined}
              >
                <TileImage tile={t} size={18} />
              </span>
            );
          })}
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
    <div className={`proto ${isEntering ? 'proto-entering' : ''}`}>
      <div className="proto-header">
        <span className="proto-phase">Mahjong Scorer</span>
        <button onClick={reset} className="proto-btn-sm">Reset</button>
      </div>

      {/* Hand display */}
      <div className="proto-hand">
        {phase === 'done' && !winTilePos && (
          <div className="proto-pick-hint">Tap the tile you won with</div>
        )}

        {(exposed.length > 0 || isEntering) && (
        <div className={`proto-row ${phase === 'exposed' ? 'proto-row-active' : ''}`}>
          <span className="proto-row-label">Exposed</span>
          <div className="proto-sets">
            {exposed.map((m, i) => renderSet(m, 'exposed', i, () => editSet('exposed', i)))}
            {isEntering && (phase === 'exposed'
              ? renderCurrentSet()
              : <div className="proto-set proto-set-placeholder" onClick={() => {
                  setState(s => ({ ...s, phase: 'exposed' }));
                }}>
                  <div className="proto-set-tiles">
                    {currentExposed.tiles.length > 0
                      ? currentExposed.tiles.map((t, j) => (
                          <span key={j} className="tile-frame tile-sm"><TileImage tile={t} size={18} /></span>
                        ))
                      : <>
                          <span className="tile-frame tile-sm tile-empty" />
                          <span className="tile-frame tile-sm tile-empty" />
                          <span className="tile-frame tile-sm tile-empty" />
                        </>
                    }
                  </div>
                  <span className="proto-set-label">{currentExposed.tiles.length > 0 ? setStatusLabel(currentExposed.tiles) : 'tap to add'}</span>
                </div>
            )}
          </div>
        </div>
        )}

        {(concealed.length > 0 || isEntering) && (
        <div className={`proto-row ${phase === 'concealed' ? 'proto-row-active' : ''}`}>
          <span className="proto-row-label">Concealed</span>
          <div className="proto-sets">
            {concealed.map((m, i) => renderSet(m, 'concealed', i, () => editSet('concealed', i)))}
            {isEntering && (phase === 'concealed'
              ? renderCurrentSet()
              : <div className="proto-set proto-set-placeholder" onClick={() => {
                  setState(s => ({ ...s, phase: 'concealed' }));
                }}>
                  <div className="proto-set-tiles">
                    {currentConcealed.tiles.length > 0
                      ? currentConcealed.tiles.map((t, j) => (
                          <span key={j} className="tile-frame tile-sm"><TileImage tile={t} size={18} /></span>
                        ))
                      : <>
                          <span className="tile-frame tile-sm tile-empty" />
                          <span className="tile-frame tile-sm tile-empty" />
                          <span className="tile-frame tile-sm tile-empty" />
                        </>
                    }
                  </div>
                  <span className="proto-set-label">{currentConcealed.tiles.length > 0 ? setStatusLabel(currentConcealed.tiles) : 'tap to add'}</span>
                </div>
            )}
          </div>
        </div>
        )}

        {winTilePos && (() => {
          const sets = winTilePos.row === 'exposed' ? exposed : concealed;
          const tile = sets[winTilePos.set]?.tiles[winTilePos.tile];
          return tile ? (
            <div className="proto-win-tile">
              Won with: <span className="tile-frame tile-sm"><TileImage tile={tile} size={20} /></span>
            </div>
          ) : null;
        })()}
      </div>

      {/* Bottom sheet: tile grid + actions */}
      {isEntering && (
        <div className="proto-bottom-sheet">
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
          </div>
          <div className="proto-sheet-actions">
            <button
              onClick={undo}
              disabled={currentSet.tiles.length === 0 && allMelds.length === 0}
              className="proto-btn"
            >
              Undo
            </button>
            {currentSet.tiles.length >= 3 && detectMeldType(currentSet.tiles) !== 'invalid' && (
              <button onClick={() => commitCurrentSet()} className="proto-btn proto-btn-primary">Save set</button>
            )}
            {currentSet.tiles.length === 2 && currentSet.tiles[0] === currentSet.tiles[1] && (
              <button onClick={() => commitCurrentSet(true)} className="proto-btn proto-btn-primary">Save set</button>
            )}
            {currentSet.tiles.length > 0 && (
              <button onClick={() => setState(s => ({ ...s, [activeSetKey(s)]: { tiles: [] } }))} className="proto-btn proto-btn-danger">Clear set</button>
            )}
            <button onClick={finishMelds} className="proto-btn">Done</button>
          </div>
        </div>
      )}

      {/* Post-melds flow */}
      {phase === 'done' && (
        <div className="proto-finish">
          {/* Step 1: How did you win? */}
          <div className="proto-step">
            <div className="proto-step-label">How did you win?</div>
            <div className="proto-step-row">
              {(['self-pick', 'discard', 'stolen-kong'] as const).map(method => (
                <button
                  key={method}
                  className={`proto-btn ${win.method === method ? 'proto-btn-primary' : ''}`}
                  onClick={() => setWin(w => ({ ...w, method }))}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Players */}
          <div className="proto-step">
            <div className="proto-step-row">
              <span className="proto-field-label">Winner</span>
              {['A','B','C','D'].map(p => (
                <button key={p} className={`proto-player ${win.winner === p ? 'proto-player-active' : ''}`}
                  onClick={() => setWin(w => ({ ...w, winner: p }))}>{p}</button>
              ))}
            </div>
            <div className="proto-step-row">
              <span className="proto-field-label">Dealer</span>
              {['A','B','C','D'].map(p => (
                <button key={p} className={`proto-player ${win.dealer === p ? 'proto-player-active' : ''}`}
                  onClick={() => setWin(w => ({ ...w, dealer: p }))}>{p}</button>
              ))}
            </div>
            {win.method !== 'self-pick' && (
              <div className="proto-step-row">
                <span className="proto-field-label">From</span>
                {['A','B','C','D'].map(p => (
                  <button key={p} className={`proto-player ${win.from === p ? 'proto-player-active' : ''}`}
                    onClick={() => setWin(w => ({ ...w, from: p }))}>{p}</button>
                ))}
              </div>
            )}
          </div>

          {/* Step 4: Extras (dealer rounds, special) */}
          <div className="proto-step">
            <div className="proto-step-row">
              <span className="proto-field-label">Dealer round</span>
              <div className="proto-stepper">
                <button className="proto-stepper-btn"
                  disabled={(win.dealerRounds ?? 1) <= 1}
                  onClick={() => setWin(w => ({ ...w, dealerRounds: Math.max(1, (w.dealerRounds ?? 1) - 1) }))}>−</button>
                <span className="proto-stepper-val">{win.dealerRounds ?? 1}</span>
                <button className="proto-stepper-btn"
                  onClick={() => setWin(w => ({ ...w, dealerRounds: (w.dealerRounds ?? 1) + 1 }))}>+</button>
              </div>
            </div>
            <div className="proto-step-row" style={{ flexWrap: 'wrap' }}>
              {(['fromButt', 'lastTile', 'firstTurn', 'prodigy'] as const).map(c => {
                const labels = { fromButt: 'Replacement draw', lastTile: 'Last tile', firstTurn: '1st turn win', prodigy: 'Ready in 4' };
                const active = (win.special ?? []).includes(c);
                return (
                  <button key={c}
                    className={`proto-tag ${active ? 'proto-tag-active' : ''}`}
                    onClick={() => setWin(w => {
                      const cur = w.special ?? [];
                      return { ...w, special: active ? cur.filter(x => x !== c) : [...cur, c] };
                    })}
                  >{labels[c]}</button>
                );
              })}
            </div>
          </div>

          {/* Score */}
          {scoringResult && (
            <div className="proto-score">
              <div className="proto-score-header">
                <span className="proto-score-value">{scoringResult.handValue}</span>
                <span className="proto-score-label">points</span>
              </div>
              <div className="proto-score-rules">
                {scoringResult.appliedRules.map(({ name, points }) => (
                  <div key={name} className="proto-score-rule">
                    <span>{RULE_LABELS[name] ?? name}</span>
                    <span className="proto-score-pts">+{points}</span>
                  </div>
                ))}
              </div>
              <div className="proto-score-payments">
                {scoringResult.payments.map((p, i) => (
                  <div key={i} className="proto-payment-row">
                    <span className="proto-payment-flow">{p.from} → {p.to}</span>
                    <span className="proto-payment-amount">
                      {p.total}
                      {p.dealerBonus > 0 && (
                        <span className="proto-payment-bonus"> ({p.base} + {p.dealerBonus} dealer)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div className="proto-score-net">
                {Object.entries(scoringResult.scores).map(([player, delta]) => (
                  <div key={player} className="proto-score-pay">
                    <span className="proto-score-pay-player">{player}</span>
                    <span className={`proto-score-pay-val ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : ''}`}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="proto-actions">
            <button onClick={() => setState(s => ({ ...s, phase: 'concealed', winTilePos: null }))} className="proto-btn">← Back to editing</button>
            <button onClick={reset} className="proto-btn">New hand</button>
          </div>
        </div>
      )}
    </div>
  );
}
