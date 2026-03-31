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

function PlayerPicker({ label, value, onChange }: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="win-field">
      <div className="form-label">{label}</div>
      <div className="player-picker">
        {PLAYERS.map(p => (
          <button
            key={p}
            className="player-btn"
            aria-pressed={value === p}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({ label, value, onChange, min = 1 }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="win-field">
      <div className="form-label">{label}</div>
      <div className="stepper">
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          -
        </button>
        <span className="stepper-value">{value}</span>
        <button
          className="stepper-btn"
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

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
        <PlayerPicker label="Winner" value={win.winner} onChange={v => update({ winner: v })} />
        <PlayerPicker label="Dealer" value={win.dealer} onChange={v => update({ dealer: v })} />
        {win.method !== 'self-pick' && (
          <PlayerPicker label="From" value={win.from} onChange={v => update({ from: v })} />
        )}
        <Stepper
          label="Dealer rounds"
          value={win.dealerRounds ?? 1}
          onChange={v => update({ dealerRounds: v })}
        />
      </div>

      <div className="special-conditions">
        {(Object.keys(SPECIAL_LABELS) as WinCondition[]).map(c => (
          <button
            key={c}
            className="special-tag"
            aria-pressed={(win.special ?? []).includes(c)}
            onClick={() => toggleSpecial(c)}
          >
            {SPECIAL_LABELS[c]}
          </button>
        ))}
      </div>
    </section>
  );
}
