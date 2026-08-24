import { useState, useEffect, useRef, useMemo } from 'react';
import useSWR from 'swr';
import { useSession } from '../lib/session-context.tsx';
import { Scorer } from './Scorer.tsx';
import { CopyableCode } from './CopyableCode.tsx';
import { SessionQR } from './SessionQR.tsx';
import { ScoringReference } from './ScoringReference.tsx';
import { TileImage } from './TileImage.tsx';
import { type ScoredHand } from '../../mahjong/session.ts';
import { filterHistory, type DateFilter } from '../../mahjong/history.ts';
import { leaderboardFromHands } from '../../mahjong/leaderboard.ts';
import { RULE_LABELS } from '../../mahjong/scoring/engine.ts';
import { DateFilterPills } from './DateFilterPills.tsx';
import { HamburgerIcon, BackArrowIcon, PlusIcon, PhotoIcon } from './Icons.tsx';
import * as api from '../lib/api.ts';
import '../styles/scorer.css';


export function SessionView() {
  const { session, code, leave, updateSession, handsVersion } = useSession();
  const isExpired = !!session?.expired;
  const [view, setView] = useState<'scorer' | 'leaderboard' | 'hands' | 'rules'>(isExpired ? 'leaderboard' : 'scorer');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fading, setFading] = useState(false);
  const [addingName, setAddingName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [playerFilter, setPlayerFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('day');
  const [leaderboardDateFilter, setLeaderboardDateFilter] = useState<DateFilter>('day');
  const [scorerKey, setScorerKey] = useState(0);
  const [scorerPhase, setScorerPhase] = useState<'entering' | 'done'>('entering');
  const scorerBackRef = useRef<(() => void) | null>(null);
  const [expandTimestamp, setExpandHandTimestamp] = useState<string | null>(null);
  const [drawerClosing, setDrawerClosing] = useState(false);

  const { data: handsData, mutate: mutateHands } = useSWR('all-hands', () => api.getAllHands());
  const allHands: ScoredHand[] = handsData?.hands ?? [];

  // Server said hands changed (someone scored) or the socket reconnected.
  useEffect(() => { if (handsVersion > 0) mutateHands(); }, [handsVersion]);

  useEffect(() => {
    if (isExpired && view === 'scorer') setView('leaderboard');
  }, [isExpired]);

  useEffect(() => {
    (window as any).__onScoreDemoComplete = async (timestamp: string) => {
      await mutateHands();
      setPlayerFilter(null);
      setDateFilter('day');
      setExpandHandTimestamp(timestamp);
      setView('hands');
    };
    return () => { delete (window as any).__onScoreDemoComplete; };
  }, []);

  function refreshHands() {
    mutateHands();
  }

  const roster = useMemo(() => {
    const names = new Set<string>();
    for (const h of allHands) for (const name of Object.keys(h.scores)) names.add(name);
    return [...names];
  }, [allHands]);

  if (!session || !code) return null;

  const leaderboardHands = filterHistory(allHands, { date: leaderboardDateFilter });
  const leaderboard = leaderboardFromHands(leaderboardHands);
  const filteredHands = filterHistory(allHands, {
    player: playerFilter ?? undefined,
    date: dateFilter,
  });

  function navigateTo(target: 'scorer' | 'leaderboard' | 'hands' | 'rules') {
    setDrawerClosing(true);
    setFading(true);
    setTimeout(() => {
      setView(target);
      setDrawerOpen(false);
      setDrawerClosing(false);
      setTimeout(() => setFading(false), 20);
    }, 200);
  }

  return (
    <div className="session-view">
      <Drawer open={drawerOpen} closing={drawerClosing} onClose={() => setDrawerOpen(false)}
        code={code} currentView={view} onNavigate={navigateTo} onLeave={leave} />

      <div className="scorer-appbar">
        <div className="scorer-appbar-left">
          {view === 'scorer' && !isExpired && scorerPhase === 'done' ? (
            <button className="scorer-appbar-back" onClick={() => scorerBackRef.current?.()} aria-label="Back">
              <BackArrowIcon />
            </button>
          ) : (
            <button className="scorer-appbar-back" onClick={() => setDrawerOpen(true)} aria-label="Menu">
              <HamburgerIcon />
            </button>
          )}
        </div>
        <div className="scorer-appbar-title" />
        <div className="scorer-appbar-right">
          {view === 'scorer' && !isExpired && (
            <button className="scorer-appbar-text-btn" onClick={() => setScorerKey(k => k + 1)}>New</button>
          )}
        </div>
      </div>

      <div className={`session-content ${fading ? 'session-content-fading' : ''}`}>
      {view === 'scorer' && isExpired && (
        <div className="scorer" style={{ position: 'relative' }}>
          <div className="session-expired-overlay">
            <div className="session-expired-card">
              <p className="session-expired-title">Session ended</p>
              <p className="session-expired-text">Ask your host for the new session code to keep scoring.</p>
              <button className="scorer-btn scorer-btn-primary" onClick={leave}>Enter new code</button>
              <button className="scorer-btn" onClick={() => setView('leaderboard')}>View leaderboard</button>
            </div>
          </div>
        </div>
      )}

      {view === 'scorer' && !isExpired && (
        <Scorer key={scorerKey} roster={roster} sessionCode={code}
          onScored={() => refreshHands()}
          hideAppBar onPhaseChange={setScorerPhase}
          onBackRef={scorerBackRef}
          onConfirmed={(timestamp) => {
            setPlayerFilter(null);
            setDateFilter('day');
            setExpandHandTimestamp(timestamp);
            refreshHands();
            setFading(true);
            setTimeout(() => {
              setView('hands');
              setScorerPhase('entering');
              setTimeout(() => setFading(false), 20);
            }, 200);
          }}
          onAddPlayer={async (name) => {
            await api.registerPlayer(name);
          }} />
      )}

      {view === 'leaderboard' && (
        <div className={`scorer ${isExpired ? '' : 'scorer-has-fab'}`}>
          <LeaderboardTab leaderboard={leaderboard}
            dateFilter={leaderboardDateFilter} onDateFilterChange={setLeaderboardDateFilter}
            onPlayerClick={(name) => {
                setPlayerFilter(name);
                navigateTo('hands');
              }} />
        </div>
      )}

      {view === 'hands' && (
        <div className={`scorer ${isExpired ? '' : 'scorer-has-fab'}`}>
          <HandsTab hands={filteredHands} roster={roster}
            playerFilter={playerFilter} onPlayerFilterChange={setPlayerFilter}
            dateFilter={dateFilter} onDateFilterChange={setDateFilter}
            expandTimestamp={expandTimestamp} onExpandConsumed={() => setExpandHandTimestamp(null)} />
        </div>
      )}

      {view === 'rules' && (
        <div className="scorer">
          <ScoringReference />
        </div>
      )}
      </div>

      {!isExpired && (view === 'leaderboard' || view === 'hands') && !fading && (
        <button className="fab" onClick={() => navigateTo('scorer')}>
          <PlusIcon />
          Score hand
        </button>
      )}
    </div>
  );
}

// --- Child components ---


function Drawer({ open, closing, onClose, code, currentView, onNavigate, onLeave }: {
  open: boolean; closing?: boolean; onClose: () => void; code: string;
  currentView: string; onNavigate: (v: 'scorer' | 'leaderboard' | 'hands' | 'rules') => void; onLeave: () => void;
}) {
  if (!open) return null;

  const items: { key: 'scorer' | 'leaderboard' | 'hands' | 'rules'; label: string }[] = [
    { key: 'scorer', label: 'Score' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'hands', label: 'Hands' },
    { key: 'rules', label: 'Rules' },
  ];

  return (
    <>
      <div className={`drawer-backdrop ${closing ? 'drawer-backdrop-out' : ''}`} onClick={onClose} />
      <nav className={`drawer ${closing ? 'drawer-out' : ''}`}>
        <div className="drawer-header">
          <CopyableCode label="Session Code" code={code} />
          <SessionQR code={code} />
        </div>
        <div className="drawer-items">
          {items.map(item => (
            <button key={item.key}
              className={`drawer-item ${currentView === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="drawer-footer">
          <button className="drawer-item drawer-item-danger" onClick={onLeave}>Leave session</button>
        </div>
      </nav>
    </>
  );
}

function LeaderboardTab({ leaderboard, dateFilter, onDateFilterChange, onPlayerClick }: {
  leaderboard: { name: string; score: number }[];
  dateFilter: DateFilter; onDateFilterChange: (v: DateFilter) => void;
  onPlayerClick: (name: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => { setVisibleCount(20); }, [dateFilter]);

  return (
    <div className="leaderboard">
      <div style={{ marginBottom: 12 }}>
        <DateFilterPills value={dateFilter} onChange={onDateFilterChange} />
      </div>
      <div className="leaderboard-list">
        {leaderboard.slice(0, visibleCount).map((entry, i) => (
          <div key={entry.name} className={`leaderboard-row ${entry.score > 0 ? 'pos' : entry.score < 0 ? 'neg' : ''}`}
            onClick={() => onPlayerClick(entry.name)} style={{ cursor: 'pointer' }}>
            <span className="leaderboard-rank">{i + 1}</span>
            <span className="leaderboard-name">{entry.name}</span>
            <span className="leaderboard-score">{entry.score > 0 ? '+' : ''}{entry.score}</span>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <p className="leaderboard-empty">No rounds played yet</p>
        )}
      </div>
      {visibleCount < leaderboard.length && (
        <button className="scorer-btn history-show-more"
          onClick={() => setVisibleCount(v => v + 20)}>
          Show more ({leaderboard.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}

function HandsTab({ hands, roster, playerFilter, onPlayerFilterChange, dateFilter, onDateFilterChange, expandTimestamp, onExpandConsumed }: {
  hands: ScoredHand[]; roster: string[];
  playerFilter: string | null; onPlayerFilterChange: (v: string | null) => void;
  dateFilter: DateFilter; onDateFilterChange: (v: DateFilter) => void;
  expandTimestamp?: string | null; onExpandConsumed?: () => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [photoScanId, setPhotoScanId] = useState<string | null>(null);

  useEffect(() => { setVisibleCount(20); }, [playerFilter, dateFilter]);

  useEffect(() => {
    if (!expandTimestamp) return;
    const idx = hands.findIndex(h => h.timestamp === expandTimestamp);
    if (idx >= 0) {
      if (idx >= visibleCount) setVisibleCount(idx + 1);
      setExpanded(idx);
      setHighlightIdx(idx);
      setTimeout(() => {
        scrollRef.current?.children[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      setTimeout(() => setHighlightIdx(null), 6000);
    }
    onExpandConsumed?.();
  }, [expandTimestamp]);

  return (
    <div className="history">
      <div className="history-filters">
        <PlayerFilter value={playerFilter} options={roster} onChange={onPlayerFilterChange} />
        <DateFilterPills value={dateFilter} onChange={onDateFilterChange} />
      </div>

      {hands.length === 0 && (
        <p className="leaderboard-empty">No hands recorded yet</p>
      )}

      <div className="history-list" ref={scrollRef}>
        {hands.slice(0, visibleCount).map((hand, i) => (
          <div key={i} className={`hcard ${expanded === i ? 'hcard-expanded' : ''} ${highlightIdx === i ? 'hcard-highlight' : ''}`} onClick={() => setExpanded(expanded === i ? null : i)}>
            {highlightIdx === i && (
              <div className="hcard-shine-mask"><div className="hcard-shine-glow" /></div>
            )}
            <div className="hcard-head">
              <div className="hcard-topline">
                <span className="hcard-winner"><span className="hcard-rank">{i + 1}</span>{hand.winner} won</span>
                <span className="hcard-time">{shortTimestamp(hand.timestamp)}</span>
              </div>
              <div className="hcard-exchange">
                {Object.entries(hand.scores)
                  .filter(([, v]) => v !== 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, delta]) => (
                    <span key={name} className={`hcard-delta ${delta > 0 ? 'pos' : 'neg'}`}>
                      {name} {delta > 0 ? '+' : ''}{delta}
                    </span>
                  ))}
              </div>
            </div>
            {expanded === i && (
              <>
                <div className="hcard-hand">
                  <HistoryHand melds={hand.melds} />
                  {hand.scanId && (
                    <button className="hcard-photo-btn" aria-label="View original photo"
                      onClick={e => { e.stopPropagation(); setPhotoScanId(hand.scanId!); }}>
                      <PhotoIcon />
                    </button>
                  )}
                </div>
                <div className="hcard-receipt">
                  <div className="hcard-receipt-title">Hand value: {hand.handValue} pts</div>
                  {[...hand.appliedRules].sort((a, b) => b.points - a.points).map(r => (
                    <div key={r.name} className="hcard-rule">
                      <span>{RULE_LABELS[r.name] ?? r.name}</span>
                      <span className="hcard-rule-pts">+{r.points}</span>
                    </div>
                  ))}
                  {hand.dealerBonus > 0 && (
                    <div className="hcard-dealer">
                      <span>Dealer</span>
                      <span>+{hand.dealerBonus} per payment</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {visibleCount < hands.length && (
        <button className="scorer-btn history-show-more"
          onClick={() => setVisibleCount(v => v + 20)}>
          Show more ({hands.length - visibleCount} remaining)
        </button>
      )}

      {photoScanId && <PhotoModal scanId={photoScanId} onClose={() => setPhotoScanId(null)} />}
    </div>
  );
}

function PhotoModal({ scanId, onClose }: { scanId: string; onClose: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="photo-modal" onClick={onClose}>
      {failed
        ? <p className="photo-modal-missing">Photo is no longer available</p>
        : <img src={`/api/scans/${scanId}`} alt="Original photo of the hand" onError={() => setFailed(true)} />}
      <button className="photo-modal-close" aria-label="Close">×</button>
    </div>
  );
}

// --- Helpers ---


function shortTimestamp(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function HistoryHand({ melds }: { melds: import('../../mahjong/types.ts').Meld[] }) {
  const exposed = melds.filter(m => !m.concealed && m.type !== 'flower');
  const concealed = melds.filter(m => m.concealed && m.type !== 'flower');
  const flowers = melds.filter(m => m.type === 'flower').flatMap(m => m.tiles);

  return (
    <div className="history-hand">
      {(exposed.length > 0 || flowers.length > 0) && (
        <div className="history-hand-row">
          <span className="history-hand-row-label">Exposed</span>
          <div className="history-hand-melds">
            {flowers.length > 0 && (
              <div className="history-meld">
                {flowers.map((t, k) => (
                  <span key={k} className="tile-frame tile-sm"><TileImage tile={t} size={16} /></span>
                ))}
              </div>
            )}
            {exposed.map((meld, j) => (
              <HistoryMeld key={j} meld={meld} />
            ))}
          </div>
        </div>
      )}
      {concealed.length > 0 && (
        <div className="history-hand-row">
          <span className="history-hand-row-label">Concealed</span>
          <div className="history-hand-melds">
            {concealed.map((meld, j) => (
              <HistoryMeld key={j} meld={meld} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerFilter({ value, options, onChange }: {
  value: string | null; options: string[]; onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? options.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : options;

  function select(p: string | null) {
    onChange(p);
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight === 0) select(null);
      else if (filtered[highlight - 1]) select(filtered[highlight - 1]);
    }
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

  return (
    <div className="combo" ref={ref}>
      <input className="combo-input" ref={inputRef}
        placeholder={value || 'All players'}
        value={open ? query : (value || '')}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={handleKeyDown} />
      {value && !open && (
        <button className="combo-clear" onClick={() => { onChange(null); inputRef.current?.focus(); }}
          aria-label="Clear">×</button>
      )}
      {open && (
        <div className="combo-dropdown">
          <div className={`combo-option ${highlight === 0 ? 'combo-option-active' : ''}`}
            onMouseEnter={() => setHighlight(0)}
            onMouseDown={e => { e.preventDefault(); select(null); }}>
            All players
          </div>
          {filtered.map((p, i) => (
            <div key={p} className={`combo-option ${i + 1 === highlight ? 'combo-option-active' : ''}`}
              onMouseEnter={() => setHighlight(i + 1)}
              onMouseDown={e => { e.preventDefault(); select(p); }}>
              {p}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="combo-empty">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryMeld({ meld }: { meld: import('../../mahjong/types.ts').Meld }) {
  let winMarked = false;
  return (
    <div className="history-meld">
      {meld.tiles.map((t, k) => {
        const isWin = !winMarked && t === meld.winTile;
        if (isWin) winMarked = true;
        return (
          <span key={k} className={`tile-frame tile-sm ${isWin ? 'tile-won' : ''}`}>
            <TileImage tile={t} size={16} />
          </span>
        );
      })}
    </div>
  );
}
