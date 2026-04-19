import type { Win } from '../src/types.js';

// Chatbots often set players to the real names the user mentioned (e.g.
// ["Kyle","Mei","Jun","Ana"]) with winner/dealer/from referencing those
// names. The app's UI buttons are labeled A/B/C/D, so remap positionally:
// the first name becomes A, second B, etc.
export function normalizePlayers(win: Win): Partial<Win> {
  const mapping = new Map<string, string>();
  for (let i = 0; i < 4; i++) mapping.set(win.players[i], String.fromCharCode(65 + i));

  return {
    ...win,
    players: ['A', 'B', 'C', 'D'],
    winner: mapping.get(win.winner) ?? win.winner,
    dealer: mapping.get(win.dealer) ?? win.dealer,
    from: win.from ? (mapping.get(win.from) ?? win.from) : undefined,
  };
}
