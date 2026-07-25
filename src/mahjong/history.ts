import type { ScoredHand } from './session.ts';

export type DateFilter = 'day' | 'week' | 'month' | 'year' | 'all-time';

export interface HistoryFilter {
  player?: string;
  date?: DateFilter;
  now?: Date;
}

export function filterHistory(hands: ScoredHand[], filter: HistoryFilter): ScoredHand[] {
  let result = hands;

  if (filter.player) {
    const player = filter.player;
    result = result.filter(h => player in h.scores);
  }

  if (filter.date && filter.date !== 'all-time') {
    const cutoff = dateCutoff(filter.date, filter.now ?? new Date());
    result = result.filter(h => new Date(h.timestamp) >= cutoff);
  }

  return [...result].sort(sortFn(filter.player));
}

// --- Helpers ---

function sortFn(player?: string): (a: ScoredHand, b: ScoredHand) => number {
  if (player) {
    return (a, b) => b.scores[player] - a.scores[player];
  }
  return (a, b) => maxEarned(b) - maxEarned(a);
}

function maxEarned(hand: ScoredHand): number {
  return Math.max(...Object.values(hand.scores));
}

function dateCutoff(filter: Exclude<DateFilter, 'all-time'>, now: Date): Date {
  const d = new Date(now);
  switch (filter) {
    case 'day':
      d.setHours(0, 0, 0, 0);
      return d;
    case 'week':
      d.setDate(d.getDate() - 7);
      return d;
    case 'month':
      d.setMonth(d.getMonth(), 1);
      d.setHours(0, 0, 0, 0);
      return d;
    case 'year':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      return d;
  }
}
