import { useState, useEffect } from 'react';
import { CopyableCode } from './CopyableCode.tsx';
import * as api from '../lib/api.ts';
import * as admin from '../lib/admin-api.ts';
import type { RegisteredPlayer } from '../../mahjong/player-registry.ts';
import '../styles/scorer.css';

export function AdminDashboard() {
  const [tab, setTab] = useState<'sessions' | 'players'>('sessions');

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
      </div>
      {tab === 'sessions' && <SessionsTab />}
      {tab === 'players' && <PlayersTab />}
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
                  <span>{h.winner} won · {h.handValue} pts</span>
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
