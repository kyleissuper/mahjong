import type { Win, Player, Payment, RoundScore } from '../types.ts';

export function resolvePayments(points: number, win: Win): { scores: RoundScore; payments: Payment[] } {
  const losers = win.method === 'self-pick'
    ? win.players.filter(p => p !== win.winner)
    : [win.from!];

  const getDealerBonus = (loser: Player) => {
    if (!win.dealer) return 0;
    if (loser !== win.dealer && win.winner !== win.dealer) return 0;
    return 1 + ((win.dealerRounds ?? 1) - 1) * 2;
  };

  const payments: Payment[] = losers.map(loser => {
    const bonus = getDealerBonus(loser);
    return { from: loser, to: win.winner, base: points, dealerBonus: bonus, total: points + bonus };
  });

  const net = (player: Player) =>
    payments.reduce((sum, p) =>
      sum + (p.to === player ? p.total : 0) - (p.from === player ? p.total : 0), 0);

  const scores = Object.fromEntries(win.players.map(p => [p, net(p)]));
  return { scores, payments };
}
