import { useState, useMemo } from 'react';
import type { Meld, Win } from '../src/types.js';
import { calculateScore } from '../src/calculate-score.js';
import { validateHand } from '../src/validate-hand.js';
import { HandBuilder } from './HandBuilder.tsx';
import { WinContext } from './WinContext.tsx';
import { ScoreBreakdown } from './ScoreBreakdown.tsx';
import './styles.css';

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

  function resetHand() {
    setMelds([]);
  }

  return (
    <div className="app">
      <HandBuilder melds={melds} errors={errors} onChange={setMelds} />

      {melds.length > 0 && (
        <>
          <WinContext win={win} onChange={setWin} />
          {result && <ScoreBreakdown result={result} onReset={resetHand} />}
          {!result && !fullWin && (
            <p className="hint">Select winner and dealer above.</p>
          )}
        </>
      )}
    </div>
  );
}
