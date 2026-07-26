import { useState, useEffect } from 'react';
import { CopyableCode } from './CopyableCode.tsx';
import * as api from '../lib/api.ts';
import * as admin from '../lib/admin-api.ts';
import type { RegisteredPlayer } from '../../mahjong/player-registry.ts';
import '../styles/scorer.css';

export function AdminDashboard() {
  const [tab, setTab] = useState<'sessions' | 'players' | 'analytics'>('sessions');

  return (
    <div className="admin">
      <div className="admin-header">
        <h1 className="admin-title">Admin</h1>
        <button className="scorer-btn-text" onClick={() => {
          localStorage.removeItem('mj-admin-token');
          window.location.reload();
        }}>Log out</button>
      </div>
      <div className="admin-tabs">
        <button className={`session-tab ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')}>Sessions</button>
        <button className={`session-tab ${tab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')}>Players</button>
        <button className={`session-tab ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>Analytics</button>
      </div>
      {tab === 'sessions' && <SessionsTab />}
      {tab === 'players' && <PlayersTab />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}

// --- Sessions tab ---

function SessionsTab() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    const { sessions: s } = await admin.listSessions();
    setSessions(s);
    setLoading(false);
  }

  async function handleCreate() {
    await api.createSession();
    refresh();
  }

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <button className="scorer-btn scorer-btn-primary" onClick={handleCreate}>New session</button>
      </div>

      {loading && <p className="admin-empty">Loading...</p>}

      <div className="admin-list">
        {sessions.map(s => (
          <SessionCard key={s.code} entry={s} onRefresh={refresh} />
        ))}
        {!loading && sessions.length === 0 && (
          <p className="admin-empty">No sessions</p>
        )}
      </div>
    </div>
  );
}

function SessionCard({ entry, onRefresh }: { entry: any; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [hands, setHands] = useState<any[] | null>(null);

  async function loadHands() {
    if (hands !== null) { setExpanded(!expanded); return; }
    try {
      const { hands: h } = await api.getSessionHands(entry.code);
      setHands(h);
      setExpanded(true);
    } catch { setExpanded(!expanded); }
  }

  return (
    <div className="admin-card">
      <div className="admin-card-head" onClick={loadHands}>
        <div className="admin-card-info">
          <CopyableCode code={entry.code} />
          <span className={`admin-card-status ${entry.expired ? 'expired' : 'active'}`}>
            {entry.expired ? 'Expired' : 'Active'}
          </span>
        </div>
        <span className="admin-card-time">{entry.createdAt}</span>
      </div>

      {expanded && (
        <div className="admin-card-body">
          {!entry.expired && entry.expiresAt && (
            <div className="admin-card-meta">Expires: {entry.expiresAt}</div>
          )}
          <div className="admin-card-actions">
            {!entry.expired && (
              <>
                <button className="scorer-btn" onClick={async () => {
                  await admin.extendSession(entry.code, 24);
                  onRefresh();
                }}>Extend 24h</button>
                <button className="scorer-btn" onClick={async () => {
                  await admin.expireSession(entry.code);
                  onRefresh();
                }}>Expire</button>
              </>
            )}
            <button className="scorer-btn-text admin-delete" onClick={async () => {
              await admin.deleteSession(entry.code);
              onRefresh();
            }}>Delete</button>
          </div>

          {hands && hands.length > 0 && (
            <div className="admin-hands">
              <span className="admin-sub-label">{hands.length} hand{hands.length !== 1 ? 's' : ''}</span>
              {hands.map((h: any) => (
                <div key={h.id ?? h.timestamp} className="admin-hand-row">
                  <span>{h.winner} won · {h.scores?.[h.winner] > 0 ? '+' : ''}{h.scores?.[h.winner] ?? h.handValue} pts</span>
                  <button className="scorer-btn-text admin-delete" onClick={async () => {
                    if (h.id) await admin.deleteHand(h.id);
                    const { hands: updated } = await api.getSessionHands(entry.code);
                    setHands(updated);
                  }}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Players tab ---

function PlayersTab() {
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [mergeFrom, setMergeFrom] = useState('');
  const [mergeTo, setMergeTo] = useState('');

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    const { players: p } = await admin.listPlayers();
    setPlayers(p);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.registerPlayer(newName.trim());
    setNewName('');
    refresh();
  }

  async function handleMerge(e: React.FormEvent) {
    e.preventDefault();
    if (!mergeFrom || !mergeTo || mergeFrom === mergeTo) return;
    await admin.mergePlayers(mergeTo, mergeFrom);
    setMergeFrom('');
    setMergeTo('');
    refresh();
  }

  return (
    <div className="admin-section">
      <form className="admin-toolbar" onSubmit={handleAdd}>
        <input className="landing-input" type="text" placeholder="New player name"
          value={newName} onChange={e => setNewName(e.target.value)} maxLength={20} />
        <button className="scorer-btn scorer-btn-primary" type="submit">Add</button>
      </form>

      {loading && <p className="admin-empty">Loading...</p>}

      <div className="admin-list">
        {players.map(p => (
          <PlayerCard key={p.id} player={p} onRefresh={refresh} />
        ))}
        {!loading && players.length === 0 && (
          <p className="admin-empty">No players</p>
        )}
      </div>

      {players.length >= 2 && (
        <form className="admin-merge" onSubmit={handleMerge}>
          <span className="admin-sub-label">Merge players</span>
          <div className="admin-merge-row">
            <select className="scorer-player-select" value={mergeFrom}
              onChange={e => setMergeFrom(e.target.value)}>
              <option value="">Merge this player...</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="admin-merge-arrow">→</span>
            <select className="scorer-player-select" value={mergeTo}
              onChange={e => setMergeTo(e.target.value)}>
              <option value="">...into this player</option>
              {players.filter(p => p.id !== mergeFrom).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button className="scorer-btn" type="submit" disabled={!mergeFrom || !mergeTo}>Merge</button>
        </form>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [timings, setTimings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.getTimingStats().then(({ timings: t }) => { setTimings(t); setLoading(false); });
  }, []);

  if (loading) return <p className="admin-empty">Loading...</p>;
  if (timings.length === 0) return <p className="admin-empty">No timing data yet — score a hand to start collecting.</p>;

  const fmt = (ms: number | null) => ms == null ? '—' : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  const avg = (vals: number[]) => vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  const median = (vals: number[]) => {
    if (!vals.length) return null;
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  };

  const handEntry = timings.map(t => t.handEntryMs).filter((v: any): v is number => v != null);
  const winTile = timings.map(t => t.winTileMs).filter((v: any): v is number => v != null);
  const winContext = timings.map(t => t.winContextMs).filter((v: any): v is number => v != null);
  const review = timings.map(t => t.reviewMs).filter((v: any): v is number => v != null);
  const total = timings.map(t => t.totalMs).filter((v: any): v is number => v != null);
  const scanCount = timings.filter(t => t.usedScan).length;
  const totalUndos = timings.reduce((s: number, t: any) => s + (t.undoCount || 0), 0);
  const totalClears = timings.reduce((s: number, t: any) => s + (t.clearCount || 0), 0);
  const totalDeletes = timings.reduce((s: number, t: any) => s + (t.deleteCount || 0), 0);
  const totalBacks = timings.reduce((s: number, t: any) => s + (t.backCount || 0), 0);

  const rows: [string, number[], string?][] = [
    ['Hand entry', handEntry, 'First tap to "Score"'],
    ['Win tile pick', winTile, '"Score" to tile selected'],
    ['Win context', winContext, 'Tile to all fields filled'],
    ['Review', review, 'Fields filled to "Confirm"'],
    ['Total', total, 'First tap to "Confirm"'],
  ];

  return (
    <div className="admin-section">
      <div className="admin-sub-label">Scoring flow timing ({timings.length} hands)</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="analytics-table">
          <thead>
            <tr><th>Phase</th><th>Median</th><th>Average</th><th>Samples</th></tr>
          </thead>
          <tbody>
            {rows.map(([label, vals, hint]) => (
              <tr key={label} title={hint}>
                <td>{label}</td>
                <td>{fmt(median(vals))}</td>
                <td>{fmt(avg(vals))}</td>
                <td>{vals.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-sub-label" style={{ marginTop: 16 }}>Friction signals</div>
      <div className="analytics-stats">
        <span>Scanned: {scanCount}/{timings.length}</span>
        <span>Undos: {totalUndos}</span>
        <span>Clears: {totalClears}</span>
        <span>Deletes: {totalDeletes}</span>
        <span>Backs: {totalBacks}</span>
      </div>

      <ScanAccuracy timings={timings} />
    </div>
  );
}

function tilesKey(melds: any[]): string {
  return melds
    .filter((m: any) => m.type !== 'flower')
    .flatMap((m: any) => m.tiles)
    .sort()
    .join(',');
}

function ScanAccuracy({ timings }: { timings: any[] }) {
  const scanned = timings.filter(t => t.scanPrediction?.melds && t.submittedMelds);
  if (scanned.length === 0) return null;

  const results = scanned.map(t => {
    const predicted = tilesKey(t.scanPrediction.melds);
    const submitted = tilesKey(t.submittedMelds);
    const predictedTiles = predicted.split(',').filter(Boolean);
    const submittedTiles = submitted.split(',').filter(Boolean);
    const matching = predictedTiles.filter((tile: string, i: number) => {
      const idx = submittedTiles.indexOf(tile);
      if (idx >= 0) { submittedTiles.splice(idx, 1); return true; }
      return false;
    });
    const accuracy = submittedTiles.length + matching.length > 0
      ? Math.round((matching.length / (predictedTiles.length > 0 ? Math.max(predictedTiles.length, matching.length + submittedTiles.length) : 1)) * 100)
      : 100;
    return { exact: predicted === submitted, accuracy, model: t.scanPrediction.model };
  });

  const exactCount = results.filter(r => r.exact).length;
  const avgAccuracy = Math.round(results.reduce((s, r) => s + r.accuracy, 0) / results.length);
  const models = [...new Set(results.map(r => r.model).filter(Boolean))];

  return (
    <>
      <div className="admin-sub-label" style={{ marginTop: 16 }}>
        Scan accuracy ({scanned.length} scanned hand{scanned.length !== 1 ? 's' : ''})
      </div>
      <div className="analytics-stats">
        <span>Exact match: {exactCount}/{scanned.length}</span>
        <span>Avg tile accuracy: {avgAccuracy}%</span>
        {models.length > 0 && <span>Model: {models.join(', ')}</span>}
      </div>
      {scanned.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table className="analytics-table">
            <thead>
              <tr><th>#</th><th>Predicted</th><th>Submitted</th><th>Match</th></tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const t = scanned[i];
                const predTiles = t.scanPrediction.melds.filter((m: any) => m.type !== 'flower').flatMap((m: any) => m.tiles);
                const subTiles = t.submittedMelds.filter((m: any) => m.type !== 'flower').flatMap((m: any) => m.tiles);
                return (
                  <tr key={i}>
                    <td>{scanned.length - i}</td>
                    <td style={{ fontSize: '0.72rem' }}>{predTiles.join(' ')}</td>
                    <td style={{ fontSize: '0.72rem' }}>{subTiles.join(' ')}</td>
                    <td>{r.exact ? 'exact' : `${r.accuracy}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function PlayerCard({ player, onRefresh }: { player: RegisteredPlayer; onRefresh: () => void }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(player.name);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name === player.name) { setRenaming(false); return; }
    await admin.renamePlayer(player.id, name.trim());
    setRenaming(false);
    onRefresh();
  }

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        {renaming ? (
          <form onSubmit={handleRename} style={{ display: 'flex', gap: 6, flex: 1 }}>
            <input className="landing-input" value={name} onChange={e => setName(e.target.value)}
              maxLength={20} autoFocus style={{ flex: 1 }} />
            <button className="scorer-btn scorer-btn-primary" type="submit">Save</button>
            <button className="scorer-btn-text" type="button" onClick={() => { setRenaming(false); setName(player.name); }}>Cancel</button>
          </form>
        ) : (
          <>
            <span className="admin-player-name">{player.name}</span>
            <div className="admin-card-actions">
              <button className="scorer-btn-text" onClick={() => setRenaming(true)}>Rename</button>
              <button className="scorer-btn-text admin-delete" onClick={async () => {
                await admin.deletePlayer(player.id);
                onRefresh();
              }}>Delete</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
