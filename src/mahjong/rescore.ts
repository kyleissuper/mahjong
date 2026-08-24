import type { Hand, Win, AppliedRule, WinCondition } from './types.ts';
import { buildWin } from './types.ts';
import { scoreHand } from './scoring/engine.ts';

export interface StoredHandRow {
  melds: Hand['melds'];
  method: Win['method'];
  winnerId: string;
  handValue: number;
  appliedRules: AppliedRule[];
  scores: Record<string, number>;
}

export interface RescoreResult {
  handValue: number;
  appliedRules: AppliedRule[];
  scores: Record<string, number>;
}

// Special conditions are not stored, but each one that fired left the rule it
// awarded in the historical breakdown.
const SPECIAL_FINGERPRINTS: [string, WinCondition][] = [
  ['winFromFlowerWall', 'fromFlowerWall'],
  ['lastWallTile', 'lastTile'],
  ['lastDiscard', 'lastTile'],
  ['heavenlyHand', 'firstTurn'],
  ['earthlyHand', 'firstTurn'],
  ['prodigyHand', 'prodigy'],
];

/**
 * Recomputes a stored hand under the current rules. The win context is
 * reconstructed from the row: payers are the negative scores, specials come
 * from the fingerprints above, and the dealer only matters to the earthly-hand
 * check, whose historical firing tells us which side of it the dealer was on.
 * Payments are recomputed arithmetically — each payer's dealer-bonus component
 * (old payment minus old hand value) carries over unchanged — so dealer
 * identity and rounds never need guessing.
 */
export function rescoreStoredHand(row: StoredHandRow): RescoreResult {
  const oldRules = new Set(row.appliedRules.map(r => r.name));
  const special = [...new Set(
    SPECIAL_FINGERPRINTS.filter(([rule]) => oldRules.has(rule)).map(([, s]) => s)
  )];
  const payers = Object.entries(row.scores).filter(([, v]) => v < 0).map(([p]) => p);
  if (payers.length === 0) throw new Error('no payers in stored scores');
  if (!(row.winnerId in row.scores)) throw new Error('winner missing from stored scores');

  const win = buildWin({
    method: row.method,
    winner: row.winnerId,
    from: row.method === 'self-pick' ? undefined : payers[0],
    otherPlayers: payers,
    dealer: oldRules.has('earthlyHand') ? payers[0] : row.winnerId,
    special,
  });
  const result = scoreHand({ melds: row.melds }, win);

  const scores: Record<string, number> = {};
  let winnings = 0;
  for (const [player, oldScore] of Object.entries(row.scores)) {
    if (player === row.winnerId) continue;
    if (oldScore === 0) { scores[player] = 0; continue; }
    if (oldScore > 0) throw new Error(`non-winner ${player} has a positive stored score`);
    const bonus = -oldScore - row.handValue;
    if (!Number.isInteger(bonus) || bonus < 0) {
      throw new Error(`stored payment for ${player} is inconsistent with the stored hand value`);
    }
    const paid = result.handValue + bonus;
    scores[player] = -paid;
    winnings += paid;
  }
  scores[row.winnerId] = winnings;

  return { handValue: result.handValue, appliedRules: result.appliedRules, scores };
}
