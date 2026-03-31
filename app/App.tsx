import { useState } from 'react';
import type { Meld, Win, ScoreResult } from '../src/types.js';
import { calculateScore } from '../src/calculate-score.js';
import { HandBuilder } from './HandBuilder.tsx';
import { WinContext } from './WinContext.tsx';
import { ScoreBreakdown } from './ScoreBreakdown.tsx';

export function App() {
  const [melds, setMelds] = useState<Meld[]>([]);
  const [win, setWin] = useState<Partial<Win>>({
    method: 'discard',
    dealerRounds: 1,
    special: [],
  });

  const hand = { melds };
  const isComplete = melds.length >= 5;

  const result: ScoreResult | null = isComplete && win.winner && win.dealer
    ? calculateScore(hand, {
        players: ['A', 'B', 'C', 'D'],
        winner: win.winner,
        dealer: win.dealer,
        method: win.method ?? 'discard',
        from: win.from,
        dealerRounds: win.dealerRounds ?? 1,
        special: win.special ?? [],
      })
    : null;

  return (
    <div>
      <h1>Mahjong Scorer</h1>

      <HandBuilder melds={melds} onChange={setMelds} />

      <WinContext win={win} onChange={setWin} />

      {result && <ScoreBreakdown result={result} />}
    </div>
  );
}
