import { useState, useMemo, useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import { buildWin } from '../../mahjong/types.ts';
import type { Tile, Meld, Win, ScoreResult } from '../../mahjong/types.ts';
import { scoreHand, RULE_LABELS } from '../../mahjong/scoring/engine.ts';
import { isNumberTile, numValue, suit, ORPHAN_TILES } from '../../mahjong/tile.ts';
import * as api from '../lib/api.ts';
import { isHandReady } from '../../mahjong/hand.ts';
import { TileImage } from './TileImage.tsx';
import { ScanHand } from './ScanHand.tsx';
import { BackArrowIcon } from './Icons.tsx';
import { usePlayerSearch } from '../hooks/usePlayerSearch.ts';
import { useZoom } from '../hooks/useZoom.ts';
import '../styles/scorer.css';

const ALL_SUITS = [
  { name: 'Bamboo', tiles: ['1b','2b','3b','4b','5b','6b','7b','8b','9b'] },
  { name: 'Dots', tiles: ['1d','2d','3d','4d','5d','6d','7d','8d','9d'] },
  { name: 'Characters', tiles: ['1c','2c','3c','4c','5c','6c','7c','8c','9c'] },
  { name: 'Winds / Dragons / Flower', tiles: ['Ew','Sw','Ww','Nw','Rd','Gd','Wd','F'] },
];

type Slot = Tile[];

/** Identity is the registry id; the name is display-only. Standalone mode uses name-as-id. */
export interface PlayerRef { id: string; name: string }

type WinState = {
  method?: Win['method'];
  winner?: PlayerRef;
  from?: PlayerRef;
  dealer?: PlayerRef;
  otherPlayers?: (PlayerRef | undefined)[];
  dealerRounds?: number;
  special?: Win['special'];
  dealerAnswered?: boolean;
};

function chosenRefs(win: WinState): PlayerRef[] {
  return [win.winner, win.from, ...(win.otherPlayers ?? [])]
    .filter((r): r is PlayerRef => !!r);
}

interface EditableMeld {
  tiles: Tile[];
  concealed: boolean;
}

type ActiveSelection = { type: 'meld'; index: number } | { type: 'flowers' };

interface State {
  melds: EditableMeld[];
  flowers: number;
  active: ActiveSelection | null;
  phase: 'entering' | 'done';
  winMeld: number | null;
  winTile: number | null;
}

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5];

interface ScanPrediction {
  model: string;
  melds: { type: string; tiles: Tile[]; concealed: boolean }[];
}

interface TimingData {
  firstInteraction: number | null;
  scoreClicked: number | null;
  winTilePicked: number | null;
  winContextComplete: number | null;
  confirmed: number | null;
  undoCount: number;
  clearCount: number;
  deleteCount: number;
  backCount: number;
  usedScan: boolean;
  scanPrediction: ScanPrediction | null;
  scanId: string | null;
}

function emptyTiming(): TimingData {
  return { firstInteraction: null, scoreClicked: null, winTilePicked: null, winContextComplete: null, confirmed: null, undoCount: 0, clearCount: 0, deleteCount: 0, backCount: 0, usedScan: false, scanPrediction: null, scanId: null };
}

function buildTimingPayload(t: TimingData) {
  const start = t.firstInteraction;
  if (!start) return null;
  const ms = (v: number | null) => v ? Math.round(v - start) : null;
  return {
    handEntryMs: ms(t.scoreClicked),
    winTileMs: t.scoreClicked && t.winTilePicked ? Math.round(t.winTilePicked - t.scoreClicked) : null,
    winContextMs: t.winTilePicked && t.winContextComplete ? Math.round(t.winContextComplete - t.winTilePicked) : null,
    reviewMs: t.winContextComplete && t.confirmed ? Math.round(t.confirmed - t.winContextComplete) : null,
    totalMs: ms(t.confirmed),
    undoCount: t.undoCount,
    clearCount: t.clearCount,
    deleteCount: t.deleteCount,
    backCount: t.backCount,
    usedScan: t.usedScan,
    scanPrediction: t.scanPrediction,
    scanId: t.scanId,
  };
}

export function Scorer({ roster = ['Player 1', 'Player 2', 'Player 3', 'Player 4'], sessionCode, onScored, onAddPlayer, hideAppBar, onPhaseChange, onConfirmed, onBackRef }: {
  roster?: string[]; sessionCode?: string; onScored?: () => void;
  onAddPlayer?: (name: string) => Promise<PlayerRef>; hideAppBar?: boolean;
  onPhaseChange?: (phase: 'entering' | 'done') => void;
  onConfirmed?: (timestamp: string) => void;
  onBackRef?: MutableRefObject<(() => void) | null>;
} = {}) {
  const [state, setState] = useState<State>({
    melds: [],
    flowers: 0,
    active: null,
    phase: 'entering',
    winMeld: null,
    winTile: null,
  });
  const [scanned, setScanned] = useState(false);
  const [zoom, setZoom] = useZoom();
  const timing = useRef<TimingData>(emptyTiming());
  const markFirstInteraction = () => { if (!timing.current.firstInteraction) timing.current.firstInteraction = performance.now(); };

  const { melds, flowers, active, phase, winMeld, winTile } = state;

  const [win, setWin] = useState<WinState>({
    method: 'discard',
    dealerRounds: 1,
    special: [],
  });

  useEffect(() => {
    (window as any).__fillHand = () => {
      setState({
        melds: [
          { tiles: ['1b', '2b', '3b'], concealed: true },
          { tiles: ['4d', '5d', '6d'], concealed: true },
          { tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
          { tiles: ['Ew', 'Ew', 'Ew'], concealed: true },
          { tiles: ['9c', '9c'], concealed: true },
        ],
        flowers: 0, active: null, phase: 'entering', winMeld: null, winTile: null,
      });
    };
    return () => { delete (window as any).__fillHand; };
  }, []);

  const scoringMelds = useMemo(() => toScoringMelds(state), [melds, flowers]);
  const handReady = isHandReady({ melds: scoringMelds });

  const exposedMelds = melds.map((m, i) => ({ ...m, _i: i })).filter(m => !m.concealed);
  const concealedMelds = melds.map((m, i) => ({ ...m, _i: i })).filter(m => m.concealed);

  const scoringResult: ScoreResult | null = useMemo(() => {
    if (phase !== 'done' || winMeld === null || winTile === null || !handReady) return null;
    const { winner, dealer, method = 'discard', dealerRounds = 1, special = [] } = win;
    if (!winner || !win.dealerAnswered) return null;
    if (method !== 'self-pick' && !win.from) return null;

    const winObj = buildWin({
      method, winner: winner.id, from: win.from?.id,
      otherPlayers: win.otherPlayers?.filter((p): p is PlayerRef => !!p).map(p => p.id),
      dealer: dealer?.id,
      dealerRounds, special,
    });
    const hand = { melds: toScoringHand(state) };
    try {
      return scoreHand(hand, winObj);
    } catch { return null; }
  }, [phase, winMeld, winTile, win, state, handReady]);

  function confirmScore() {
    if (!scoringResult || !sessionCode) return;
    timing.current.confirmed = performance.now();
    const timingPayload = buildTimingPayload(timing.current);
    const { winner, dealer, method = 'discard', dealerRounds = 1, special = [] } = win;
    const winObj = buildWin({
      method, winner: winner!.id, from: win.from?.id,
      otherPlayers: win.otherPlayers?.filter((p): p is PlayerRef => !!p).map(p => p.id),
      dealer: dealer?.id,
      dealerRounds, special,
    });
    const hand = { melds: toScoringHand(state) };
    api.scoreHand(sessionCode, hand, winObj, timingPayload)
      .then(({ hand: scored }) => {
        onScored?.();
        onConfirmed?.(scored.timestamp);
        setState({ melds: [], flowers: 0, active: null, phase: 'entering', winMeld: null, winTile: null });
        setWin({ method: 'discard', dealerRounds: 1, special: [], winner: undefined, dealer: undefined, dealerAnswered: false, from: undefined, otherPlayers: undefined });
        setScanned(false);
        timing.current = emptyTiming();
      })
      .catch(() => {});
  }

  useEffect(() => { onPhaseChange?.(phase); }, [phase]);

  useEffect(() => {
    if (scoringResult && !timing.current.winContextComplete) {
      timing.current.winContextComplete = performance.now();
    }
  }, [scoringResult]);

  useEffect(() => {
    if (onBackRef) {
      onBackRef.current = () => {
        timing.current.backCount++;
        setState(s => ({ ...s, phase: 'entering', winMeld: null, winTile: null, active: null }));
      };
    }
    return () => { if (onBackRef) onBackRef.current = null; };
  }, [onBackRef]);

  const isEntering = phase === 'entering';
  const isFlowersActive = active?.type === 'flowers';
  const activeMeldIdx = active?.type === 'meld' ? active.index : null;
  const activeSlotTiles = activeMeldIdx !== null ? (melds[activeMeldIdx]?.tiles ?? []) : [];

  return (
    <>
      <ZoomControls zoom={zoom} onChange={setZoom} />
      <div className={`scorer ${isEntering ? 'scorer-entering' : ''}`} style={{ zoom }}>
      {!hideAppBar && (
        <AppBar
          isEntering={isEntering}
          onBack={() => setState(s => ({ ...s, phase: 'entering', winMeld: null, winTile: null, active: null }))}
          onReset={() => {
            setState({ melds: [], flowers: 0, active: null, phase: 'entering', winMeld: null, winTile: null });
            setWin({ method: 'discard', dealerRounds: 1, special: [], winner: undefined, dealer: undefined, dealerAnswered: false, from: undefined, otherPlayers: undefined });
            setScanned(false);
          }}
        />
      )}

      <HandDisplay
        melds={melds}
        exposedMelds={exposedMelds}
        concealedMelds={concealedMelds}
        flowers={flowers}
        phase={phase}
        winMeld={winMeld}
        winTile={winTile}
        activeMeldIdx={activeMeldIdx}
        isEntering={isEntering}
        isFlowersActive={isFlowersActive}
        scanned={scanned}
        onSelectMeld={(index) => {
          if (!isEntering) return;
          markFirstInteraction();
          setState(s => {
            if (s.active?.type === 'meld' && s.active.index === index) return { ...s, active: null };
            const cleaned = s.melds.filter((m, i) => m.tiles.length > 0 || i === index);
            const newIndex = cleaned.indexOf(s.melds[index]);
            return { ...s, melds: cleaned, active: { type: 'meld', index: newIndex >= 0 ? newIndex : cleaned.length - 1 } };
          });
        }}
        onAddMeld={(concealed) => {
          if (!isEntering) return;
          setState(s => {
            const cleaned = s.melds.filter(m => m.tiles.length > 0);
            const newMelds = [...cleaned, { tiles: [], concealed }];
            return { ...s, melds: newMelds, active: { type: 'meld', index: newMelds.length - 1 } };
          });
        }}
        onPickWinTile={(meldIdx, tileIdx) => { timing.current.winTilePicked = performance.now(); setState(s => ({ ...s, winMeld: meldIdx, winTile: tileIdx })); }}
        onToggleFlowers={() => setState(s => ({ ...s, active: isFlowersActive ? null : { type: 'flowers' } }))}
      />

      {isEntering && (
        <BottomSheet
          handReady={handReady}
          hasContent={melds.length > 0 || flowers > 0}
          active={active}
          activeSlotTiles={activeSlotTiles}
          isFlowersActive={isFlowersActive}
          onScore={() => { timing.current.scoreClicked = performance.now(); setState(s => ({ ...s, phase: 'done', active: null })); }}
          onUndo={() => {
            timing.current.undoCount++;
            setState(s => {
              if (!s.active) return s;
              if (s.active.type === 'flowers') {
                return { ...s, flowers: Math.max(0, s.flowers - 1), ...(s.flowers <= 1 ? { active: null } : {}) };
              }
              const idx = s.active.index;
              const meld = s.melds[idx];
              if (!meld || meld.tiles.length === 0) return s;
              return { ...s, melds: s.melds.map((m, i) => i === idx ? { ...m, tiles: m.tiles.slice(0, -1) } : m) };
            });
          }}
          onClear={() => {
            timing.current.clearCount++;
            setState(s => {
              if (!s.active) return s;
              if (s.active.type === 'flowers') return { ...s, flowers: 0, active: null };
              const idx = s.active.index;
              return { ...s, melds: s.melds.map((m, i) => i === idx ? { ...m, tiles: [] } : m) };
            });
          }}
          onDelete={() => {
            timing.current.deleteCount++;
            setState(s => {
              if (!s.active) return s;
              if (s.active.type === 'flowers') return { ...s, flowers: 0, active: null };
              const idx = s.active.index;
              return { ...s, melds: s.melds.filter((_, i) => i !== idx), active: null };
            });
          }}
          onTapTile={(tile) => {
            if (phase !== 'entering') return;
            markFirstInteraction();
            if (tile === 'F') {
              setState(s => ({ ...s, flowers: s.flowers + 1, active: { type: 'flowers' } }));
              return;
            }
            if (!active || active.type !== 'meld') return;
            setState(s => {
              if (!s.active || s.active.type !== 'meld') return s;
              const idx = s.active.index;
              const meld = s.melds[idx];
              if (!meld || meld.tiles.length >= 14) return s;
              return { ...s, melds: s.melds.map((m, i) => i === idx ? { ...m, tiles: [...m.tiles, tile] } : m) };
            });
          }}
          onScan={(scannedMelds, scanId) => {
            markFirstInteraction();
            timing.current.usedScan = true;
            timing.current.scanId = scanId ?? null;
            timing.current.scanPrediction = {
              model: 'google/gemini-2.5-flash',
              melds: scannedMelds.map(m => ({ type: m.type, tiles: [...m.tiles], concealed: m.concealed })),
            };
            const editable: EditableMeld[] = [];
            let flowerCount = 0;
            for (const m of scannedMelds) {
              if (m.type === 'flower') { flowerCount += m.tiles.length; continue; }
              const tiles = m.tiles.filter(t => t !== 'F');
              if (tiles.length > 0) editable.push({ tiles, concealed: m.concealed });
            }
            setState({ melds: editable, flowers: flowerCount, active: null, phase: 'entering', winMeld: null, winTile: null });
            setScanned(true);
          }}
        />
      )}

      {phase === 'done' && (
        <div className="scorer-finish">
          {winMeld !== null && <WinContextPanel roster={roster} win={win} onChangeWin={setWin} onAddPlayer={onAddPlayer} standalone={!sessionCode} />}
          {scoringResult && <ScoreResultsPanel result={scoringResult} names={new Map(chosenRefs(win).map(r => [r.id, r.name]))} onConfirm={sessionCode ? confirmScore : undefined} />}
        </div>
      )}
      </div>
    </>
  );
}

// --- Child components ---

function AppBar({ isEntering, onBack, onReset }: {
  isEntering: boolean; onBack: () => void; onReset: () => void;
}) {
  return (
    <div className="scorer-appbar">
      <div className="scorer-appbar-left">
        {!isEntering && (
          <button className="scorer-appbar-back" onClick={onBack}>
            <BackArrowIcon />
          </button>
        )}
      </div>
      <div className="scorer-appbar-title"></div>
      <div className="scorer-appbar-right">
        <button className="scorer-appbar-text-btn" onClick={onReset}>Reset</button>
      </div>
    </div>
  );
}

function MeldDisplay({ meldIdx, meld, isActive, isEntering, canPickWin, winMeld, winTile, onSelect, onPickWin }: {
  meldIdx: number; meld: EditableMeld; isActive: boolean; isEntering: boolean;
  canPickWin: boolean; winMeld: number | null; winTile: number | null;
  onSelect: () => void; onPickWin: (meldIdx: number, tileIdx: number) => void;
}) {
  const label = statusLabel(meld.tiles);
  return (
    <div
      className={`scorer-set ${isActive ? 'scorer-set-active' : ''} ${isEntering && !isActive ? 'scorer-set-tappable' : ''}`}
      onClick={isEntering && !isActive ? onSelect : undefined}
    >
      <div className="scorer-set-tiles">
        {meld.tiles.map((t, j) => (
          <span
            key={j}
            className={`tile-frame tile-sm ${canPickWin ? 'tile-pickable' : ''} ${winMeld === meldIdx && winTile === j ? 'tile-won' : ''}`}
            onClick={canPickWin ? (e) => { e.stopPropagation(); onPickWin(meldIdx, j); } : undefined}
          >
            <TileImage tile={t} size={18} />
          </span>
        ))}
        {isActive && meld.tiles.length === 0 && <span className="tile-frame tile-sm tile-empty" />}
      </div>
      {label && <span className={`scorer-set-label ${label === 'invalid' ? 'invalid' : 'valid'}`}>{label}</span>}
    </div>
  );
}

function FlowerDisplay({ flowers, isActive, onToggle }: {
  flowers: number; isActive: boolean; onToggle: () => void;
}) {
  if (flowers === 0) return null;
  return (
    <div className={`scorer-set ${isActive ? 'scorer-set-active' : 'scorer-set-tappable'}`} onClick={onToggle}>
      <div className="scorer-set-tiles">
        {Array.from({ length: flowers }, (_, j) => (
          <span key={j} className="tile-frame tile-sm"><TileImage tile="F" size={18} /></span>
        ))}
      </div>
      <span className="scorer-set-label valid">flower</span>
    </div>
  );
}

function HandDisplay({ melds, exposedMelds, concealedMelds, flowers, phase, winMeld, winTile, activeMeldIdx, isEntering, isFlowersActive, scanned, onSelectMeld, onAddMeld, onPickWinTile, onToggleFlowers }: {
  melds: EditableMeld[];
  exposedMelds: (EditableMeld & { _i: number })[];
  concealedMelds: (EditableMeld & { _i: number })[];
  flowers: number; phase: 'entering' | 'done';
  winMeld: number | null; winTile: number | null;
  activeMeldIdx: number | null; isEntering: boolean; isFlowersActive: boolean; scanned: boolean;
  onSelectMeld: (index: number) => void; onAddMeld: (concealed: boolean) => void;
  onPickWinTile: (meldIdx: number, tileIdx: number) => void; onToggleFlowers: () => void;
}) {
  const canPickWin = phase === 'done';

  return (
    <div className="scorer-hand">
      {isEntering && scanned && (
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#287d62', margin: '0 0 6px' }}>
          Scanned — check each set and the winning tile before scoring.
        </p>
      )}
      {isEntering && melds.length === 0 && flowers === 0 && (
        <div className="scorer-onboarding">
          <span className="scorer-onboarding-title">Mahjong Scorer</span>
          <span className="ref-footer-badge">beta</span>
        </div>
      )}
      {phase === 'done' && winMeld === null && (
        <div className="scorer-pick-hint">Tap the tile you won with</div>
      )}

      {(exposedMelds.length > 0 || flowers > 0 || isEntering) && (
        <div className={`scorer-row ${isFlowersActive || (activeMeldIdx !== null && !melds[activeMeldIdx]?.concealed) ? 'scorer-row-active' : ''}`}>
          <span className="scorer-row-label">Exposed</span>
          <div className="scorer-sets">
            <FlowerDisplay flowers={flowers} isActive={isFlowersActive} onToggle={onToggleFlowers} />
            {exposedMelds.map(m => (
              <MeldDisplay key={m._i} meldIdx={m._i} meld={m} isActive={isEntering && activeMeldIdx === m._i}
                isEntering={isEntering} canPickWin={canPickWin} winMeld={winMeld} winTile={winTile}
                onSelect={() => onSelectMeld(m._i)} onPickWin={onPickWinTile} />
            ))}
            {isEntering && (
              <div className="scorer-set scorer-set-placeholder" onClick={() => onAddMeld(false)}>
                <div className="scorer-set-tiles"><span className="tile-frame tile-sm tile-plus">+</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      {isEntering && <div className="scorer-row-divider" />}

      {(concealedMelds.length > 0 || isEntering) && (
        <div className={`scorer-row ${activeMeldIdx !== null && melds[activeMeldIdx]?.concealed ? 'scorer-row-active' : ''}`}>
          <span className="scorer-row-label">Concealed</span>
          <div className="scorer-sets">
            {concealedMelds.map(m => (
              <MeldDisplay key={m._i} meldIdx={m._i} meld={m} isActive={isEntering && activeMeldIdx === m._i}
                isEntering={isEntering} canPickWin={canPickWin} winMeld={winMeld} winTile={winTile}
                onSelect={() => onSelectMeld(m._i)} onPickWin={onPickWinTile} />
            ))}
            {isEntering && (
              <div className="scorer-set scorer-set-placeholder" onClick={() => onAddMeld(true)}>
                <div className="scorer-set-tiles"><span className="tile-frame tile-sm tile-plus">+</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      {winMeld !== null && winTile !== null && (() => {
        const tile = melds[winMeld]?.tiles[winTile];
        return tile ? (
          <div className="scorer-win-tile">
            Won with: <span className="tile-frame tile-sm"><TileImage tile={tile} size={20} /></span>
          </div>
        ) : null;
      })()}
    </div>
  );
}

function BottomSheet({ handReady, hasContent, active, activeSlotTiles, isFlowersActive, onScore, onUndo, onClear, onDelete, onTapTile, onScan }: {
  handReady: boolean; hasContent: boolean; active: ActiveSelection | null;
  activeSlotTiles: Tile[]; isFlowersActive: boolean;
  onScore: () => void; onUndo: () => void; onClear: () => void; onDelete: () => void;
  onTapTile: (tile: Tile) => void; onScan: (melds: Meld[], scanId?: string) => void;
}) {
  const hasActive = !!active;
  const hasTiles = activeSlotTiles.length > 0;

  return (
    <div className="scorer-bottom-sheet">
      <div className="scorer-sheet-actions">
        {handReady && (
          <button onClick={onScore} className="scorer-btn scorer-btn-primary scorer-btn-score">Score →</button>
        )}
        {hasContent && (
          <div className="scorer-sheet-secondary">
            <button onClick={onUndo} disabled={!hasActive || (!hasTiles && !isFlowersActive)} className="scorer-btn-text">
              {isFlowersActive ? '− Flower' : 'Undo'}
            </button>
            <button onClick={onClear} disabled={!hasActive || (!hasTiles && !isFlowersActive)} className="scorer-btn-text">
              {isFlowersActive ? 'Clear flowers' : 'Clear'}
            </button>
            {!isFlowersActive && (
              <button onClick={onDelete} disabled={!hasActive || !hasTiles} className="scorer-btn-text scorer-btn-text-danger">Delete</button>
            )}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 10px' }}>
        <ScanHand onScan={onScan} />
      </div>
      <TileKeyboard suits={ALL_SUITS} activeSlotTiles={activeSlotTiles} onTapTile={onTapTile} />
    </div>
  );
}

function WinContextPanel({ roster, win, onChangeWin, onAddPlayer, standalone }: {
  roster: string[];
  win: WinState;
  onChangeWin: (fn: (w: WinState) => WinState) => void;
  onAddPlayer?: (name: string) => Promise<PlayerRef>;
  standalone?: boolean;
}) {
  const method = win.method ?? 'discard';
  const isSelfPick = method === 'self-pick';
  // Standalone has no registry; local names double as ids.
  const localRef = (name: string): PlayerRef => ({ id: name, name });

  useEffect(() => {
    if (!standalone || roster.length < 4) return;
    onChangeWin(w => {
      if (w.winner) return w;
      const auto: WinState = { ...w, winner: localRef(roster[0]) };
      if (isSelfPick) {
        auto.otherPlayers = roster.slice(1, 4).map(localRef);
      } else {
        auto.from = localRef(roster[1]);
      }
      return auto;
    });
  }, [standalone, method]);

  const losersReady = isSelfPick
    ? (win.otherPlayers?.filter(Boolean).length ?? 0) === 3
    : !!win.from;

  return (
    <div className="scorer-step">
      <div className="scorer-step-row">
        {(['self-pick', 'discard', 'stolen-kong'] as const).map(m => (
          <button key={m}
            className={`scorer-btn scorer-btn-fill ${method === m ? 'scorer-btn-primary' : ''}`}
            onClick={() => onChangeWin(w => {
              const next: WinState = { ...w, method: m, from: undefined, otherPlayers: undefined, dealer: undefined, dealerAnswered: false };
              if (standalone && roster.length >= 4) {
                next.winner = localRef(roster[0]);
                if (m === 'self-pick') { next.otherPlayers = roster.slice(1, 4).map(localRef); }
                else { next.from = localRef(roster[1]); }
              }
              return next;
            })}
          >{m}</button>
        ))}
      </div>

      {!standalone && (
        <PlayerSelect label="Winner" value={win.winner} sortHint={roster} onAddPlayer={onAddPlayer}
          onChange={p => onChangeWin(w => ({ ...w, winner: p, from: undefined, otherPlayers: undefined, dealer: undefined, dealerAnswered: false }))} />
      )}

      {!standalone && win.winner && !isSelfPick && (
        <PlayerSelect label="Discarder" value={win.from} exclude={[win.winner]} sortHint={roster} onAddPlayer={onAddPlayer}
          onChange={p => onChangeWin(w => ({ ...w, from: p, dealer: undefined, dealerAnswered: false }))} />
      )}

      {!standalone && win.winner && isSelfPick && (
        <div className="scorer-step-group">
          <span className="scorer-field-label">Other players</span>
          {[0, 1, 2].map(i => {
            const chosen = win.otherPlayers ?? [];
            const excluded = [win.winner!, ...chosen.filter((p, j): p is PlayerRef => !!p && j !== i)];
            return (
              <PlayerSelect key={i}
                value={chosen[i]} exclude={excluded} sortHint={roster} onAddPlayer={onAddPlayer}
                onChange={p => onChangeWin(w => {
                  const next = [...(w.otherPlayers ?? [])];
                  next[i] = p;
                  return { ...w, otherPlayers: next, dealer: undefined, dealerAnswered: false };
                })} />
            );
          })}
        </div>
      )}

      {win.winner && losersReady && (
        <DealerPicker
          players={isSelfPick
            ? [win.winner!, ...(win.otherPlayers ?? []).filter((p): p is PlayerRef => !!p)]
            : [win.winner!, win.from!]}
          showNeither={!isSelfPick}
          value={win.dealer}
          answered={win.dealerAnswered}
          onChange={p => onChangeWin(w => ({ ...w, dealer: p, dealerRounds: 1, dealerAnswered: true }))}
        />
      )}

      {win.dealer && (
        <div className="scorer-step-row">
          <span className="scorer-field-label">Dealer round</span>
          <div className="scorer-stepper">
            <button className="scorer-stepper-btn" disabled={(win.dealerRounds ?? 1) <= 1}
              onClick={() => onChangeWin(w => ({ ...w, dealerRounds: Math.max(1, (w.dealerRounds ?? 1) - 1) }))}>−</button>
            <span className="scorer-stepper-val">{win.dealerRounds ?? 1}</span>
            <button className="scorer-stepper-btn"
              onClick={() => onChangeWin(w => ({ ...w, dealerRounds: (w.dealerRounds ?? 1) + 1 }))}>+</button>
          </div>
        </div>
      )}

      {win.dealerAnswered && <SpecialConditions win={win} onChangeWin={onChangeWin} />}
    </div>
  );
}

function PlayerSelect({ label, value, options, exclude, sortHint, onChange, onAddPlayer }: {
  label?: string; value?: PlayerRef; options?: PlayerRef[]; exclude?: PlayerRef[];
  sortHint?: string[];
  onChange: (value: PlayerRef | undefined) => void; onAddPlayer?: (name: string) => Promise<PlayerRef>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query) { setDebouncedQuery(''); return; }
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const useServer = !options;
  const { players: serverPlayers, invalidate } = usePlayerSearch(debouncedQuery, useServer && open);

  const baseList = useServer
    ? serverPlayers
    : query
      ? options.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      : options;

  const sorted = useServer && sortHint?.length
    ? [...baseList].sort((a, b) => {
        const ai = sortHint.indexOf(a.name);
        const bi = sortHint.indexOf(b.name);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.name.localeCompare(b.name);
      })
    : baseList;

  const filtered = exclude?.length
    ? sorted.filter(p => !exclude.some(e => e.id === p.id))
    : sorted;

  function select(p: PlayerRef) {
    onChange(p);
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlight]) select(filtered[highlight]); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  }

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => { setHighlight(0); }, [query]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !onAddPlayer) return;
    setAddError(null);
    try {
      const added = await onAddPlayer(newName.trim());
      invalidate();
      select(added);
      setNewName('');
      setAdding(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add');
    }
  }

  if (adding) {
    return (
      <div className="scorer-step-row">
        {label && <span className="scorer-field-label">{label}</span>}
        <form className="scorer-add-player" onSubmit={handleAdd}>
          <input className="scorer-add-player-input" type="text" placeholder="Name"
            value={newName} onChange={e => setNewName(e.target.value)} maxLength={20} autoFocus />
          <button className="scorer-btn scorer-btn-primary scorer-add-player-btn" type="submit">Add</button>
          <button className="scorer-btn-text" type="button" onClick={() => { setAdding(false); setAddError(null); }}>Cancel</button>
        </form>
        {addError && <p className="landing-error" style={{ marginTop: 4 }}>{addError}</p>}
      </div>
    );
  }

  return (
    <div className="scorer-step-row">
      {label && <span className="scorer-field-label">{label}</span>}
      <div className="combo" ref={ref}>
        <input className="combo-input" ref={inputRef}
          placeholder={value?.name || 'Search players...'}
          value={open ? query : (value?.name || '')}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown} />
        {value && !open && (
          <button className="combo-clear" onClick={() => { onChange(undefined); inputRef.current?.focus(); }}
            aria-label="Clear">×</button>
        )}
        {open && (
          <div className="combo-dropdown">
            {filtered.map((p, i) => (
              <div key={p.id} className={`combo-option ${i === highlight ? 'combo-option-active' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={e => { e.preventDefault(); select(p); }}>
                {p.name}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="combo-empty">No matches</div>
            )}
            {onAddPlayer && (
              <div className="combo-option combo-add"
                onMouseDown={e => { e.preventDefault(); setOpen(false); setAdding(true); }}>
                + Add player
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TileKeyboard({ suits, activeSlotTiles, onTapTile }: {
  suits: { name: string; tiles: string[] }[];
  activeSlotTiles: Tile[];
  onTapTile: (tile: Tile) => void;
}) {
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);
  const touchedRef = useRef(false);

  const tileAtPoint = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const btn = el.closest('[data-tile]') as HTMLElement | null;
    return btn?.dataset.tile ?? null;
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // No preventDefault here: React registers touch listeners as passive, so
    // it never worked — scroll/zoom suppression is CSS touch-action on the grid.
    touchedRef.current = true;
    const t = e.touches[0];
    setHoveredTile(tileAtPoint(t.clientX, t.clientY));
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    setHoveredTile(tileAtPoint(t.clientX, t.clientY));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (hoveredTile) onTapTile(hoveredTile as Tile);
    setHoveredTile(null);
  }, [hoveredTile, onTapTile]);

  const handleTouchCancel = useCallback(() => { setHoveredTile(null); }, []);

  return (
    <div className="scorer-grid"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchCancel}>
      {suits.map(({ name, tiles }) => (
        <div key={name} className="scorer-suit">
          <div className="scorer-suit-tiles">
            {tiles.map(tile => (
              <button key={tile} data-tile={tile}
                className={`tile-frame tile-btn ${activeSlotTiles.includes(tile) ? 'tile-active' : ''} ${hoveredTile === tile ? 'tile-pressed' : ''}`}
                onClick={() => { if (!touchedRef.current) onTapTile(tile as Tile); touchedRef.current = false; }}
                aria-label={tile}>
                <TileImage tile={tile} size={24} />
                {hoveredTile === tile && (
                  <span className="tile-preview">
                    <TileImage tile={tile} size={44} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DealerPicker({ players, showNeither, value, answered, onChange }: {
  players: PlayerRef[]; showNeither?: boolean; value?: PlayerRef; answered?: boolean; onChange: (p: PlayerRef | undefined) => void;
}) {
  const isNeither = !!answered && value === undefined;
  return (
    <div className="scorer-dealer-picker">
      <span className="scorer-field-label">Dealer this round?</span>
      <div className="scorer-dealer-options">
        {players.map(p => (
          <label key={p.id} className={`scorer-dealer-option ${value?.id === p.id ? 'active' : ''}`}>
            <input type="radio" name="dealer" value={p.id} checked={value?.id === p.id}
              onChange={() => onChange(p)} />
            {p.name}
          </label>
        ))}
        {showNeither && (
          <label className={`scorer-dealer-option ${isNeither ? 'active' : ''}`}>
            <input type="radio" name="dealer" value="" checked={isNeither}
              onChange={() => onChange(undefined)} />
            Neither
          </label>
        )}
      </div>
    </div>
  );
}

function SpecialConditions({ win, onChangeWin }: { win: WinState; onChangeWin: (fn: (w: WinState) => WinState) => void }) {
  const specialLabels = { fromButt: 'Replacement draw', lastTile: 'Last tile', firstTurn: '1st turn win', prodigy: 'Ready in 4' } as const;

  return (
    <div className="scorer-step-row" style={{ flexWrap: 'wrap' }}>
      {(Object.keys(specialLabels) as (keyof typeof specialLabels)[]).map(c => {
        const isActive = (win.special ?? []).includes(c);
        return (
          <button key={c} className={`scorer-tag ${isActive ? 'scorer-tag-active' : ''}`}
            onClick={() => onChangeWin(w => {
              const cur = w.special ?? [];
              return { ...w, special: isActive ? cur.filter(x => x !== c) : [...cur, c] };
            })}
          >{specialLabels[c]}</button>
        );
      })}
    </div>
  );
}

function ScoreResultsPanel({ result, names, onConfirm }: {
  result: ScoreResult; names: Map<string, string>; onConfirm?: () => void;
}) {
  return (
    <div className="scorer-results">
      <div className="scorer-hero">
        {Object.entries(result.scores).map(([player, delta]) => (
          <div key={player} className={`scorer-hero-player ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : ''}`}>
            <span className="scorer-hero-name">{names.get(player) ?? player}</span>
            <span className="scorer-hero-delta">{delta > 0 ? '+' : ''}{delta}</span>
          </div>
        ))}
      </div>
      <div className="scorer-breakdown">
        <div className="scorer-breakdown-header">Hand value: {result.handValue} pts</div>
        {[...result.appliedRules].sort((a, b) => b.points - a.points).map(({ name, points }) => (
          <div key={name} className="scorer-breakdown-rule">
            <span>{RULE_LABELS[name] ?? name}</span>
            <span className="scorer-breakdown-pts">+{points}</span>
          </div>
        ))}
        {result.payments.some(p => p.dealerBonus > 0) && (() => {
          const bonus = Math.max(...result.payments.map(p => p.dealerBonus));
          return (
            <div className="scorer-breakdown-dealer">
              <span>Dealer</span>
              <span className="scorer-breakdown-dealer-pts">+{bonus} per payment</span>
            </div>
          );
        })()}
      </div>
      {onConfirm && (
        <button className="scorer-btn scorer-btn-primary scorer-confirm" onClick={onConfirm}>
          Confirm &amp; Record
        </button>
      )}
    </div>
  );
}

function ZoomControls({ zoom, onChange }: { zoom: number; onChange: (z: number) => void }) {
  const stepTo = (delta: 1 | -1) => {
    const sorted = [...ZOOM_STEPS].sort((a, b) => a - b);
    const next = delta > 0
      ? sorted.find(s => s > zoom + 0.001)
      : [...sorted].reverse().find(s => s < zoom - 0.001);
    if (next != null) onChange(next);
  };
  return (
    <div className="zoom-controls" role="group" aria-label="Zoom">
      <button className="zoom-btn" aria-label="Zoom out" onClick={() => stepTo(-1)} disabled={zoom <= ZOOM_STEPS[0]}>−</button>
      <button className="zoom-btn zoom-value" aria-label="Reset zoom to 100%" onClick={() => onChange(1)}>{Math.round(zoom * 100)}%</button>
      <button className="zoom-btn" aria-label="Zoom in" onClick={() => stepTo(1)} disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}>+</button>
    </div>
  );
}

// --- Helpers ---

function detectType(tiles: Slot): string {
  if (tiles.length === 0) return 'incomplete';
  if (tiles.length === 1) return 'incomplete';

  const allSame = tiles.every(t => t === tiles[0]);

  if (tiles.length === 2) return 'incomplete';
  if (tiles.length === 3) {
    if (allSame) return 'pong';
    if (isValidChow(tiles)) return 'chow';
    return 'incomplete';
  }
  if (tiles.length === 4 && allSame) return 'kong';
  if (tiles.length >= 4 && tiles.length < 14) return 'incomplete';
  if (tiles.length === 14 && isOrphans(tiles)) return 'orphans';
  return 'invalid';
}

function isOrphans(tiles: Slot): boolean {
  const counts = new Map<string, number>();
  for (const t of tiles) counts.set(t, (counts.get(t) ?? 0) + 1);
  return ORPHAN_TILES.every(t => (counts.get(t) ?? 0) >= 1)
    && tiles.length === 14
    && [...counts.values()].filter(c => c === 2).length === 1;
}

function isValidChow(tiles: Tile[]): boolean {
  if (tiles.length !== 3 || !tiles.every(isNumberTile)) return false;
  if (!tiles.every(t => suit(t) === suit(tiles[0]))) return false;
  const v = tiles.map(numValue).sort((a, b) => a - b);
  return v[1] === v[0] + 1 && v[2] === v[0] + 2;
}

function statusLabel(tiles: Slot): string {
  const t = detectType(tiles);
  if (t === 'chow' || t === 'pong' || t === 'kong' || t === 'orphans') return t;
  if (tiles.length === 2 && tiles[0] === tiles[1]) return 'pair';
  if (t === 'invalid') return 'invalid';
  return '';
}

function toScoringMelds(state: State): Meld[] {
  const result: Meld[] = [];
  for (const m of state.melds) {
    const type = detectType(m.tiles);
    if (type === 'invalid') continue;
    if (type === 'incomplete') {
      if (m.tiles.length === 2 && m.tiles[0] === m.tiles[1]) {
        result.push({ type: 'pair', tiles: m.tiles, concealed: m.concealed });
      } else if (m.tiles.length > 0) {
        result.push({ type: 'orphans', tiles: m.tiles, concealed: m.concealed });
      }
      continue;
    }
    result.push({ type: type as Meld['type'], tiles: m.tiles, concealed: m.concealed });
  }
  if (state.flowers > 0) {
    result.push({ type: 'flower', tiles: Array(state.flowers).fill('F'), concealed: false });
  }
  return result;
}

function toScoringHand(state: State): Meld[] {
  const melds = toScoringMelds(state);
  if (state.winMeld !== null && state.winTile !== null) {
    const m = state.melds[state.winMeld];
    if (m) {
      const winTileValue = m.tiles[state.winTile];
      const meldIdx = melds.findIndex(sm =>
        sm.tiles.length === m.tiles.length &&
        sm.tiles.every((t, i) => t === m.tiles[i]) &&
        sm.concealed === m.concealed
      );
      if (meldIdx >= 0 && winTileValue) {
        melds[meldIdx] = { ...melds[meldIdx], winTile: winTileValue };
      }
    }
  }
  return melds;
}
