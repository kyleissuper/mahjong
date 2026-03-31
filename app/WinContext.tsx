import type { Win, WinCondition } from '../src/types.js';

interface Props {
  win: Partial<Win>;
  onChange: (win: Partial<Win>) => void;
}

const PLAYERS = ['A', 'B', 'C', 'D'];

const METHODS = ['self-pick', 'discard', 'stolen-kong'] as const;

const SPECIAL_LABELS: Record<WinCondition, string> = {
  fromButt: 'From butt',
  lastTile: 'Last tile',
  firstTurn: 'First turn',
  prodigy: 'Prodigy',
};

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
    <section className="section">
      <h2 className="section-title">How did you win?</h2>

      <div className="method-selector">
        {METHODS.map(method => (
          <button
            key={method}
            className="method-option"
            aria-pressed={win.method === method}
            onClick={() => update({ method })}
          >
            {method}
          </button>
        ))}
      </div>

      <div className="win-fields">
        {win.method !== 'self-pick' && (
          <div className="win-field">
            <label className="form-label" htmlFor="win-from">From:</label>
            <select
              id="win-from"
              className="select-input"
              value={win.from ?? ''}
              onChange={e => update({ from: e.target.value })}
            >
              <option value="">Select player</option>
              {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        <div className="win-field">
          <label className="form-label" htmlFor="win-winner">Winner:</label>
          <select
            id="win-winner"
            className="select-input"
            value={win.winner ?? ''}
            onChange={e => update({ winner: e.target.value })}
          >
            <option value="">Select player</option>
            {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="win-field">
          <label className="form-label" htmlFor="win-dealer">Dealer:</label>
          <select
            id="win-dealer"
            className="select-input"
            value={win.dealer ?? ''}
            onChange={e => update({ dealer: e.target.value })}
          >
            <option value="">Select player</option>
            {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="win-field">
          <label className="form-label" htmlFor="win-rounds">Dealer rounds:</label>
          <input
            id="win-rounds"
            className="number-input"
            type="number"
            min={1}
            value={win.dealerRounds ?? 1}
            onChange={e => update({ dealerRounds: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="special-conditions">
        {(Object.keys(SPECIAL_LABELS) as WinCondition[]).map(c => (
          <label
            key={c}
            className="special-tag"
            aria-pressed={(win.special ?? []).includes(c)}
          >
            <input
              type="checkbox"
              checked={(win.special ?? []).includes(c)}
              onChange={() => toggleSpecial(c)}
            />
            {SPECIAL_LABELS[c]}
          </label>
        ))}
      </div>
    </section>
  );
}
