import type { ScoreResult } from '../src/types.js';
import { getRuleReference } from '../src/calculate-score.js';

const RULE_LABELS: Record<string, string> = Object.fromEntries(
  getRuleReference().map(r => [r.name, r.label])
);

interface Props {
  result: ScoreResult;
  onReset: () => void;
}

export function ScoreBreakdown({ result, onReset }: Props) {
  const { handValue, appliedRules, scores } = result;

  return (
    <section className="score-section">
      <div className="score-header">
        <div className="score-value">{handValue}</div>
        <div className="score-label">points</div>
      </div>

      <div className="score-body">
        <div className="rules-list">
          {appliedRules.map(({ name, points }) => (
            <div key={name} className="rule-item">
              <span className="rule-name">{RULE_LABELS[name] ?? name}</span>
              <span className="rule-points">+{points}</span>
            </div>
          ))}
        </div>

        <div className="payments-row">
          {Object.entries(scores).map(([player, delta]) => (
            <div key={player} className="payment-item">
              <div className="payment-player">{player}</div>
              <div className={`payment-delta ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'zero'}`}>
                {delta > 0 ? '+' : ''}{delta}
              </div>
            </div>
          ))}
        </div>

        <button className="reset-btn" onClick={onReset}>Score next hand</button>
      </div>
    </section>
  );
}
