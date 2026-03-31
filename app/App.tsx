import { useState, useMemo } from 'react';
import type { Meld, Win } from '../src/types.js';
import { calculateScore } from '../src/calculate-score.js';
import { validateHand } from '../src/validate-hand.js';
import { HandBuilder } from './HandBuilder.tsx';
import { WinContext } from './WinContext.tsx';
import { ScoreBreakdown } from './ScoreBreakdown.tsx';

const PLAYERS = ['A', 'B', 'C', 'D'] as const;

function buildWin(partial: Partial<Win>): Win | null {
  const { winner, dealer, method = 'discard', dealerRounds = 1, special = [] } = partial;
  if (!winner || !dealer) return null;
  if (method !== 'self-pick' && !partial.from) return null;

  return {
    players: [...PLAYERS],
    winner,
    dealer,
    method,
    from: partial.from,
    dealerRounds,
    special,
  };
}

export function App() {
  const [melds, setMelds] = useState<Meld[]>([]);
  const [win, setWin] = useState<Partial<Win>>({
    method: 'discard',
    dealerRounds: 1,
    special: [],
  });

  const hand = { melds };
  const errors = useMemo(() => validateHand(hand), [melds]);
  const fullWin = buildWin(win);

  const result = useMemo(() => {
    if (melds.length === 0 || errors.length > 0 || !fullWin) return null;
    try {
      return calculateScore(hand, fullWin);
    } catch {
      return null;
    }
  }, [melds, errors, fullWin]);

  return (
    <div>
      <h1>Mahjong Scorer</h1>

      <HandBuilder melds={melds} errors={errors} onChange={setMelds} />

      <WinContext win={win} onChange={setWin} />

      {errors.length > 0 && (
        <section>
          <h2>Issues</h2>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>Set {e.meld + 1}: {e.message}</li>
            ))}
          </ul>
        </section>
      )}

      {result && <ScoreBreakdown result={result} />}

      {!result && melds.length > 0 && errors.length === 0 && !fullWin && (
        <p>Fill in the win details to see your score.</p>
      )}
    </div>
  );
}
