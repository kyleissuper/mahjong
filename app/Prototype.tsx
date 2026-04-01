import { useState, useMemo } from 'react';
import type { Tile, MeldType, Meld, Win, ScoreResult } from '../src/types.js';
import { calculateScore } from '../src/calculate-score.js';
import { isHandReady } from '../src/validate-hand.js';
import { TileImage } from './TileImage.tsx';
import './prototype.css';

const RULE_LABELS: Record<string, string> = {
  flower: 'Flower', dragonPong: 'Dragon pong', windPong: 'Wind pong',
  pairOf258: '2/5/8 pair', canOnlyWinWithOne: 'Only one you can win with',
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

// --- Tile grid ---

const ALL_SUITS = [
  { name: 'Bamboo', tiles: ['1b','2b','3b','4b','5b','6b','7b','8b','9b'] },
  { name: 'Dots', tiles: ['1d','2d','3d','4d','5d','6d','7d','8d','9d'] },
  { name: 'Characters', tiles: ['1c','2c','3c','4c','5c','6c','7c','8c','9c'] },
  { name: 'Winds / Dragons / Flower', tiles: ['Ew','Sw','Ww','Nw','Rd','Gd','Wd','F'] },
];

// --- Slot helpers ---

type Slot = Tile[];

function detectType(tiles: Slot): MeldType | 'invalid' | 'incomplete' {
  if (tiles.length === 0) return 'incomplete';
  if (tiles.length === 1) return 'incomplete';

  const allSame = tiles.every(t => t === tiles[0]);

  if (tiles.length === 2) {
    if (allSame) return 'incomplete'; // pair or pong or kong
    if (isNumberTile(tiles[0]) && isNumberTile(tiles[1]) && tiles[0][1] === tiles[1][1]) {
      return 'incomplete'; // could be chow
    }
    return 'invalid';
  }
  if (tiles.length === 3) {
    if (allSame) return 'pong';
    if (isValidChow(tiles)) return 'chow';
    return 'invalid';
  }
  if (tiles.length === 4 && allSame) return 'kong';
  return 'invalid';
}

function isNumberTile(tile: Tile): boolean {
  return tile.length === 2 && tile[0] >= '1' && tile[0] <= '9';
}

function isValidChow(tiles: Tile[]): boolean {
  if (tiles.length !== 3 || !tiles.every(isNumberTile)) return false;
  if (!tiles.every(t => t[1] === tiles[0][1])) return false;
  const v = tiles.map(t => parseInt(t[0])).sort((a, b) => a - b);
  return v[1] === v[0] + 1 && v[2] === v[0] + 2;
}

function couldExtend(tiles: Slot, tile: Tile): boolean {
  const next = [...tiles, tile];
  if (detectType(next) !== 'invalid') return true;
  if (next.length <= 3 && next.every(isNumberTile) && next.every(t => t[1] === next[0][1])) {
    const v = next.map(t => parseInt(t[0])).sort((a, b) => a - b);
    return v[v.length - 1] - v[0] <= 2;
  }
  return false;
}

function isComplete(tiles: Slot): boolean {
  const t = detectType(tiles);
  return t === 'chow' || t === 'kong';
}

function isPongMaybeKong(tiles: Slot): boolean {
  return tiles.length === 3 && tiles.every(t => t === tiles[0]);
}

function statusLabel(tiles: Slot): string {
  const t = detectType(tiles);
  if (t === 'chow' || t === 'pong' || t === 'kong') return t;
  if (tiles.length === 2 && tiles[0] === tiles[1]) return 'pair';
  if (t === 'invalid') return 'invalid';
  return '';
}

// --- Convert slots to melds ---

function slotsToMelds(slots: Slot[], concealed: boolean, flowers: number): Meld[] {
  const melds: Meld[] = [];
  for (const tiles of slots) {
    let type = detectType(tiles);
    if (type === 'incomplete' && tiles.length === 2 && tiles[0] === tiles[1]) type = 'pair';
    if (type === 'incomplete' || type === 'invalid') continue;
    melds.push({ type, tiles, concealed });
  }
  if (flowers > 0) {
    melds.push({ type: 'flower', tiles: Array(flowers).fill('F'), concealed: false });
  }
  return melds;
}

// --- Types ---

interface WinTilePos {
  row: 'exposed' | 'concealed';
  slot: number;
  tile: number;
}

type ActiveSlot = { type: 'slot'; row: 'exposed' | 'concealed'; index: number } | { type: 'flowers' };

interface State {
  exposed: Slot[];
  concealed: Slot[];
  active: ActiveSlot | null;
  phase: 'entering' | 'done';
  winTilePos: WinTilePos | null;
  flowers: number;
}

// --- Main component ---

export function Prototype() {
  const [state, setState] = useState<State>({
    exposed: [],
    concealed: [],
    active: null,
    phase: 'entering',
    winTilePos: null,
    flowers: 0,
  });

  const { exposed, concealed, active, phase, winTilePos, flowers } = state;

  const [win, setWin] = useState<Partial<Win>>({
    method: 'discard',
    dealerRounds: 1,
    special: [],
  });

  // Derive melds from slots
  const allMelds = useMemo(() => [
    ...slotsToMelds(exposed, false, flowers),
    ...slotsToMelds(concealed, true, 0),
  ], [exposed, concealed, flowers]);

  const handReady = isHandReady({ melds: allMelds });

  const regularSets = allMelds.filter(m => m.type !== 'flower' && m.type !== 'pair').length;
  const hasPair = allMelds.some(m => m.type === 'pair');

  // Score
  const scoringResult: ScoreResult | null = useMemo(() => {
    if (phase !== 'done' || !winTilePos || !handReady) return null;
    const { winner, dealer, method = 'discard', dealerRounds = 1, special = [] } = win;
    if (!winner || !dealer) return null;
    if (method !== 'self-pick' && !win.from) return null;

    const melds = allMelds.map((m, i) => {
      // Find which meld this winTilePos maps to
      const exposedMelds = slotsToMelds(exposed, false, 0);
      const concealedMelds = slotsToMelds(concealed, true, 0);
      const row = winTilePos.row;
      const rowMelds = row === 'exposed' ? exposedMelds : concealedMelds;
      const offset = row === 'exposed' ? 0 : exposedMelds.length;
      if (i === offset + winTilePos.slot && winTilePos.tile < m.tiles.length) {
        return { ...m, winTile: m.tiles[winTilePos.tile] };
      }
      return m;
    });

    try {
      return calculateScore({ melds }, {
        players: ['A', 'B', 'C', 'D'],
        winner, dealer, method, from: win.from, dealerRounds, special,
      });
    } catch { return null; }
  }, [phase, winTilePos, win, allMelds, exposed, concealed, flowers, handReady]);

  // --- Actions ---

  function tapTile(tile: Tile) {
    if (phase !== 'entering') return;

    if (tile === 'F') {
      setState(s => ({ ...s, flowers: s.flowers + 1, active: { type: 'flowers' } }));
      return;
    }

    if (!active || active.type !== 'slot') return;

    setState(s => {
      if (!s.active || s.active.type !== 'slot') return s;
      const { row, index } = s.active;
      const slots = s[row];
      const slot = slots[index] ?? [];

      if (!couldExtend(slot, tile) && slot.length > 0) return s;

      const newSlot = [...slot, tile];
      const newSlots = slots.map((sl, i) => i === index ? newSlot : sl);
      return { ...s, [row]: newSlots };
    });
  }

  function tapSlot(row: 'exposed' | 'concealed', index: number) {
    if (phase !== 'entering') return;
    setState(s => {
      // Toggle: tap active slot to deselect
      if (s.active?.type === 'slot' && s.active.row === row && s.active.index === index) {
        return { ...s, active: null };
      }

      // Clean up empty slots from both rows
      let next = { ...s };
      for (const r of ['exposed', 'concealed'] as const) {
        const cleaned = next[r].filter(sl => sl.length > 0);
        next = { ...next, [r]: cleaned };
      }

      // Recalculate target index after cleanup
      const slots = next[row];
      const targetIndex = index >= slots.length ? slots.length : index;

      // Create new slot if needed
      if (targetIndex >= slots.length) {
        return { ...next, [row]: [...slots, []], active: { type: 'slot', row, index: targetIndex } };
      }
      return { ...next, active: { type: 'slot', row, index: targetIndex } };
    });
  }

  function deselect() {
    setState(s => ({
      ...s,
      active: null,
      exposed: s.exposed.filter(sl => sl.length > 0),
      concealed: s.concealed.filter(sl => sl.length > 0),
    }));
  }

  function pickWinTile(pos: WinTilePos) {
    setState(s => ({ ...s, winTilePos: pos }));
  }

  function undo() {
    setState(s => {
      if (!s.active) return s;
      if (s.active.type === 'flowers') {
        return { ...s, flowers: Math.max(0, s.flowers - 1), ...(s.flowers <= 1 ? { active: null } : {}) };
      }
      const { row, index } = s.active;
      const slot = s[row][index];
      if (!slot || slot.length === 0) return s;
      return { ...s, [row]: s[row].map((sl, i) => i === index ? sl.slice(0, -1) : sl) };
    });
  }

  function clearSlot() {
    setState(s => {
      if (!s.active) return s;
      if (s.active.type === 'flowers') {
        return { ...s, flowers: 0, active: null };
      }
      const { row, index } = s.active;
      return { ...s, [row]: s[row].map((sl, i) => i === index ? [] : sl) };
    });
  }

  function deleteSlot() {
    setState(s => {
      if (!s.active) return s;
      if (s.active.type === 'flowers') {
        return { ...s, flowers: 0, active: null };
      }
      const { row, index } = s.active;
      return { ...s, [row]: s[row].filter((_, i) => i !== index), active: null };
    });
  }

  function reset() {
    setState({
      exposed: [], concealed: [], active: null,
      phase: 'entering', winTilePos: null, flowers: 0,
    });
  }

  const isEntering = phase === 'entering';
  const isFlowersActive = active?.type === 'flowers';
  const activeSlotTiles = active?.type === 'slot' ? (state[active.row][active.index] ?? []) : [];

  // --- Render helpers ---

  function renderSlot(row: 'exposed' | 'concealed', index: number, tiles: Slot) {
    const isActive = isEntering && active?.type === 'slot' && active.row === row && active.index === index;
    const type = detectType(tiles);
    const label = statusLabel(tiles);

    const canPickWin = phase === 'done';

    return (
      <div
        key={`${row}-${index}`}
        className={`proto-set ${isActive ? 'proto-set-active' : ''} ${isEntering && !isActive ? 'proto-set-tappable' : ''}`}
        onClick={isEntering && !isActive ? () => tapSlot(row, index) : undefined}
      >
        <div className="proto-set-tiles">
          {tiles.map((t, j) => {
            const isWon = winTilePos?.row === row && winTilePos.slot === index && winTilePos.tile === j;
            return (
              <span
                key={j}
                className={`tile-frame tile-sm ${canPickWin ? 'tile-pickable' : ''} ${isWon ? 'tile-won' : ''}`}
                onClick={canPickWin ? (e) => { e.stopPropagation(); pickWinTile({ row, slot: index, tile: j }); } : undefined}
              >
                <TileImage tile={t} size={18} />
              </span>
            );
          })}
          {isActive && tiles.length === 0 && (
            <span className="tile-frame tile-sm tile-empty" />
          )}
          {!isActive && tiles.length === 0 && (
            <span className="tile-frame tile-sm tile-empty" />
          )}
        </div>
        {label && <span className={`proto-set-label ${type !== 'incomplete' && type !== 'invalid' ? 'valid' : type === 'invalid' ? 'invalid' : ''}`}>{label}</span>}
      </div>
    );
  }

  function renderFlowers() {
    if (flowers === 0) return null;
    return (
      <div className={`proto-set ${isFlowersActive ? 'proto-set-active' : 'proto-set-tappable'}`}
        onClick={() => setState(s => ({ ...s, active: isFlowersActive ? null : { type: 'flowers' } }))}>
        <div className="proto-set-tiles">
          {Array.from({ length: flowers }, (_, j) => (
            <span key={j} className="tile-frame tile-sm"><TileImage tile="F" size={18} /></span>
          ))}
        </div>
        <span className="proto-set-label">flower</span>
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

        {(exposed.length > 0 || flowers > 0 || isEntering) && (
          <div className={`proto-row ${(active?.type === 'slot' && active.row === 'exposed') || active?.type === 'flowers' ? 'proto-row-active' : ''}`}>
            <span className="proto-row-label">Exposed</span>
            <div className="proto-sets">
              {renderFlowers()}
              {exposed.map((slot, i) => renderSlot('exposed', i, slot))}
              {isEntering && (
                <div className="proto-set proto-set-placeholder" onClick={() => tapSlot('exposed', exposed.length)}>
                  <div className="proto-set-tiles">
                    <span className="tile-frame tile-sm tile-plus">+</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isEntering && <div className="proto-row-divider" />}

        {(concealed.length > 0 || isEntering) && (
          <div className={`proto-row ${active?.type === 'slot' && active.row === 'concealed' ? 'proto-row-active' : ''}`}>
            <span className="proto-row-label">Concealed</span>
            <div className="proto-sets">
              {concealed.map((slot, i) => renderSlot('concealed', i, slot))}
              {isEntering && (
                <div className="proto-set proto-set-placeholder" onClick={() => tapSlot('concealed', concealed.length)}>
                  <div className="proto-set-tiles">
                    <span className="tile-frame tile-sm tile-plus">+</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {winTilePos && (() => {
          const slots = winTilePos.row === 'exposed' ? exposed : concealed;
          const tile = slots[winTilePos.slot]?.[winTilePos.tile];
          return tile ? (
            <div className="proto-win-tile">
              Won with: <span className="tile-frame tile-sm"><TileImage tile={tile} size={20} /></span>
            </div>
          ) : null;
        })()}
      </div>

      {/* Bottom sheet */}
      {isEntering && (
        <div className="proto-bottom-sheet">
          <div className="proto-progress">
            <div className="proto-progress-fill" style={{ width: `${Math.min(100, ((regularSets + (hasPair ? 1 : 0)) / 5) * 100)}%` }} />
          </div>
          <div className="proto-grid">
            {ALL_SUITS.map(({ name, tiles }) => (
              <div key={name} className="proto-suit">
                <div className="proto-suit-name">{name}</div>
                <div className="proto-suit-tiles">
                  {tiles.map(tile => (
                    <button
                      key={tile}
                      className={`tile-frame tile-btn ${activeSlotTiles.includes(tile) ? 'tile-active' : ''}`}
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
            <button onClick={undo} disabled={!active || (activeSlotTiles.length === 0 && !isFlowersActive)} className="proto-btn">
              {isFlowersActive ? '− Flower' : 'Undo'}
            </button>
            <button onClick={clearSlot} disabled={!active || (activeSlotTiles.length === 0 && !isFlowersActive)} className="proto-btn">
              {isFlowersActive ? 'Remove all' : 'Clear'}
            </button>
            {!isFlowersActive && (
              <button onClick={deleteSlot} disabled={!active || activeSlotTiles.length === 0} className="proto-btn proto-btn-danger">Delete</button>
            )}
            {handReady && (
              <button onClick={() => setState(s => ({ ...s, phase: 'done', active: null }))} className="proto-btn proto-btn-primary">Score →</button>
            )}
          </div>
        </div>
      )}

      {/* Post-melds flow */}
      {phase === 'done' && (
        <div className="proto-finish">
          {winTilePos && (
            <div className="proto-step">
              <div className="proto-step-row">
                {(['self-pick', 'discard', 'stolen-kong'] as const).map(method => (
                  <button key={method}
                    className={`proto-btn proto-btn-fill ${win.method === method ? 'proto-btn-primary' : ''}`}
                    onClick={() => setWin(w => ({ ...w, method }))}
                  >{method}</button>
                ))}
              </div>
              <div className="proto-step-row">
                <span className="proto-field-label">Winner</span>
                {['A','B','C','D'].map(p => (
                  <button key={p} className={`proto-player ${win.winner === p ? 'proto-player-active' : ''}`}
                    onClick={() => setWin(w => ({ ...w, winner: p }))}>{p}</button>
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
              <div className="proto-step-row">
                <span className="proto-field-label">Dealer</span>
                {['A','B','C','D'].map(p => (
                  <button key={p} className={`proto-player ${win.dealer === p ? 'proto-player-active' : ''}`}
                    onClick={() => setWin(w => ({ ...w, dealer: p }))}>{p}</button>
                ))}
              </div>
              <div className="proto-step-row">
                <span className="proto-field-label">Round</span>
                <div className="proto-stepper">
                  <button className="proto-stepper-btn" disabled={(win.dealerRounds ?? 1) <= 1}
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
                    <button key={c} className={`proto-tag ${active ? 'proto-tag-active' : ''}`}
                      onClick={() => setWin(w => {
                        const cur = w.special ?? [];
                        return { ...w, special: active ? cur.filter(x => x !== c) : [...cur, c] };
                      })}
                    >{labels[c]}</button>
                  );
                })}
              </div>
            </div>
          )}

          {scoringResult && (
            <div className="proto-results">
              <div className="proto-hero">
                {Object.entries(scoringResult.scores).map(([player, delta]) => (
                  <div key={player} className={`proto-hero-player ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : ''}`}>
                    <span className="proto-hero-name">{player}</span>
                    <span className="proto-hero-delta">{delta > 0 ? '+' : ''}{delta}</span>
                  </div>
                ))}
              </div>
              <div className="proto-breakdown">
                <div className="proto-breakdown-header">Hand value: {scoringResult.handValue} pts</div>
                {scoringResult.appliedRules.map(({ name, points }) => (
                  <div key={name} className="proto-breakdown-rule">
                    <span>{RULE_LABELS[name] ?? name}</span>
                    <span className="proto-breakdown-pts">+{points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="proto-actions">
            <button onClick={() => setState(s => ({ ...s, phase: 'entering', winTilePos: null, active: null }))} className="proto-btn">← Edit hand</button>
            <button onClick={reset} className="proto-btn">New hand</button>
          </div>
        </div>
      )}
    </div>
  );
}
