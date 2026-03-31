import type { ScoreResult } from '../src/types.js';

interface Props {
  result: ScoreResult;
}

export function ScoreBreakdown({ result }: Props) {
  const { handValue, appliedRules, scores } = result;

  return (
    <section>
      <h2>Score: {handValue} pts</h2>

      <ul>
        {appliedRules.map(({ name, points }) => (
          <li key={name}>{name}: +{points}</li>
        ))}
      </ul>

      <h3>Payments</h3>
      <ul>
        {Object.entries(scores).map(([player, delta]) => (
          <li key={player}>
            {player}: {delta > 0 ? '+' : ''}{delta}
          </li>
        ))}
      </ul>
    </section>
  );
}
