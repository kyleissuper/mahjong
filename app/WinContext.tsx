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

function PlayerRow({ label, value, onChange }: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="win-row">
      <span className="win-label">{label}</span>
      <div className="player-picker">
        {PLAYERS.map(p => (
          <button key={p} className="player-btn" aria-pressed={value === p} onClick={() => onChange(p)}>{p}</button>
        ))}
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
    <section className="win-section">
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

      <PlayerRow label="Winner" value={win.winner} onChange={v => update({ winner: v })} />
      <PlayerRow label="Dealer" value={win.dealer} onChange={v => update({ dealer: v })} />
      {win.method !== 'self-pick' && (
        <PlayerRow label="From" value={win.from} onChange={v => update({ from: v })} />
      )}

      <div className="win-divider" />

      <div className="win-row">
        <span className="win-label">Dealer rnd</span>
        <div className="stepper stepper-sm">
          <button className="stepper-btn" onClick={() => update({ dealerRounds: Math.max(1, (win.dealerRounds ?? 1) - 1) })} disabled={(win.dealerRounds ?? 1) <= 1}>-</button>
          <span className="stepper-value">{win.dealerRounds ?? 1}</span>
          <button className="stepper-btn" onClick={() => update({ dealerRounds: (win.dealerRounds ?? 1) + 1 })}>+</button>
        </div>
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
