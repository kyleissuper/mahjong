import type { Win, WinCondition } from '../src/types.js';

interface Props {
  win: Partial<Win>;
  onChange: (win: Partial<Win>) => void;
}

const PLAYERS = ['A', 'B', 'C', 'D'];

export function WinContext({ win, onChange }: Props) {
  function update(patch: Partial<Win>) {
    onChange({ ...win, ...patch });
  }

  function toggleSpecial(condition: WinCondition) {
    const current = win.special ?? [];
    const next = current.includes(condition)
      ? current.filter(c => c !== condition)
      : [...current, condition];
    update({ special: next });
  }

  return (
    <section>
      <h2>How did you win?</h2>

      <div>
        {(['self-pick', 'discard', 'stolen-kong'] as const).map(method => (
          <label key={method}>
            <input
              type="radio"
              name="method"
              checked={win.method === method}
              onChange={() => update({ method })}
            />
            {method}
          </label>
        ))}
      </div>

      {win.method !== 'self-pick' && (
        <label>
          From:{' '}
          <select value={win.from ?? ''} onChange={e => update({ from: e.target.value })}>
            <option value="">Select player</option>
            {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      )}

      <label>
        Winner:{' '}
        <select value={win.winner ?? ''} onChange={e => update({ winner: e.target.value })}>
          <option value="">Select player</option>
          {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      <label>
        Dealer:{' '}
        <select value={win.dealer ?? ''} onChange={e => update({ dealer: e.target.value })}>
          <option value="">Select player</option>
          {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      <label>
        Dealer rounds:{' '}
        <input
          type="number"
          min={1}
          value={win.dealerRounds ?? 1}
          onChange={e => update({ dealerRounds: parseInt(e.target.value) || 1 })}
        />
      </label>

      <div>
        {(['fromButt', 'lastTile', 'firstTurn', 'prodigy'] as WinCondition[]).map(c => (
          <label key={c}>
            <input
              type="checkbox"
              checked={(win.special ?? []).includes(c)}
              onChange={() => toggleSpecial(c)}
            />
            {c}
          </label>
        ))}
      </div>
    </section>
  );
}
