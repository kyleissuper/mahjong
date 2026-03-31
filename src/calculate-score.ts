import type { Hand, Meld, Win, RoundScore, Tile } from './types.js';

export function calculateScore(hand: Hand, win: Win): RoundScore {
  const points = calculateHandValue(hand, win);
  return resolvePayments(points, win);
}

// --- Scoring rules ---

type Rule = (hand: Hand, win: Win) => number;

const rules: Rule[] = [dragonPong, pairOf258, canOnlyWinWithOne];

function calculateHandValue(hand: Hand, win: Win): number {
  return rules.reduce((total, rule) => total + rule(hand, win), 0);
}

function dragonPong(hand: Hand): number {
  return hand.melds.filter(m => m.type === 'pong' && isDragon(m.tiles[0])).length;
}

function pairOf258(hand: Hand): number {
  return hand.melds.filter(m => m.type === 'pair' && is258(m.tiles[0])).length;
}

function canOnlyWinWithOne(hand: Hand): number {
  const meld = winningMeld(hand);
  if (!meld?.winTile) return 0;
  if (meld.type === 'pair' || meld.type === 'pong' || meld.type === 'kong') return 1;
  if (meld.type === 'chow' && chowCanOnlyWinWithOne(meld)) return 1;
  return 0;
}

// --- Payment resolution ---

function resolvePayments(points: number, win: Win): RoundScore {
  const score: RoundScore = {};
  for (const p of win.players) score[p] = 0;

  if (win.method !== 'discard') return score;

  const dealerInvolved = win.winner === win.dealer || win.from === win.dealer;
  const payment = points + (dealerInvolved ? win.dealerRounds : 0);
  score[win.winner] += payment;
  score[win.from!] -= payment;
  return score;
}

// --- Helpers ---

function isDragon(tile: Tile): boolean {
  return tile === 'Rd' || tile === 'Gd' || tile === 'Wd';
}

function is258(tile: Tile): boolean {
  const v = tile[0];
  return tile.length === 2 && (v === '2' || v === '5' || v === '8');
}

function numValue(tile: Tile): number {
  return parseInt(tile[0]);
}

function winningMeld(hand: Hand): Meld | undefined {
  return hand.melds.find(m => m.winTile !== undefined);
}

function chowCanOnlyWinWithOne(meld: Meld): boolean {
  const others = meld.tiles
    .filter(t => t !== meld.winTile)
    .map(numValue)
    .sort((a, b) => a - b);
  const gap = others[1] - others[0];
  return gap === 2 || others[0] === 1 || others[1] === 9;
}
