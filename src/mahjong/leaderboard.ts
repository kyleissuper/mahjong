import type { ScoredHand } from './session.ts';

export interface LeaderboardEntry {
  name: string;
  score: number;
}

export function leaderboardFromHands(hands: ScoredHand[]): LeaderboardEntry[] {
  const totals = new Map<string, number>();
  for (const hand of hands) {
    for (const [name, delta] of Object.entries(hand.scores)) {
      totals.set(name, (totals.get(name) ?? 0) + delta);
    }
  }
  return [...totals.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);
}
