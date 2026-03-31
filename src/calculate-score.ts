import type { Hand, Meld, Win, RoundScore, Tile, Player } from './types.js';

export function calculateScore(hand: Hand, win: Win): RoundScore {
  const points = calculateHandValue(hand, win);
  return resolvePayments(points, win);
}

// --- Scoring rules ---

interface Rule {
  name: string;
  score: (hand: Hand, win: Win) => number;
  absorbs?: string[];
}

const rules: Rule[] = [
  { name: 'dragonPong', score: dragonPong },
  { name: 'windPong', score: windPong },
  { name: 'pairOf258', score: pairOf258 },
  { name: 'canOnlyWinWithOne', score: canOnlyWinWithOne },
  { name: 'allChows', score: allChows },
  { name: 'allPongs', score: allPongs },
  { name: 'selfPick', score: selfPick },
  { name: 'only2Suits', score: only2Suits },
  { name: 'noTerminalsNoHonors', score: noTerminalsNoHonors },
  { name: 'noTerminalsWithHonors', score: noTerminalsWithHonors },
  { name: 'allGreens', score: allGreens, absorbs: ['dragonPong', 'noTerminalsWithHonors', 'only2Suits'] },
];

function calculateHandValue(hand: Hand, win: Win): number {
  const fired = rules.filter(r => r.score(hand, win) > 0);
  const absorbed = new Set(fired.flatMap(r => r.absorbs ?? []));
  return fired
    .filter(r => !absorbed.has(r.name))
    .reduce((total, r) => total + r.score(hand, win), 0);
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

function windPong(hand: Hand): number {
  return hand.melds.filter(m => m.type === 'pong' && isWind(m.tiles[0])).length;
}

function allChows(hand: Hand): number {
  const sets = hand.melds.filter(m => m.type !== 'pair' && m.type !== 'flower');
  return sets.every(m => m.type === 'chow') ? 1 : 0;
}

function selfPick(_hand: Hand, win: Win): number {
  return win.method === 'self-pick' ? 1 : 0;
}

function only2Suits(hand: Hand): number {
  const suits = new Set(hand.melds.flatMap(m => m.tiles.map(suit)));
  return suits.size === 2 ? 1 : 0;
}

function allPongs(hand: Hand): number {
  const sets = hand.melds.filter(m => m.type !== 'pair' && m.type !== 'flower');
  return sets.every(m => m.type === 'pong' || m.type === 'kong') ? 4 : 0;
}

function allGreens(hand: Hand): number {
  const tiles = hand.melds.flatMap(m => m.tiles);
  return tiles.every(t => suit(t) === 'b' || t === 'Gd') ? 14 : 0;
}

function noTerminalsNoHonors(hand: Hand): number {
  const tiles = hand.melds.flatMap(m => m.tiles);
  return tiles.every(t => isNumberTile(t) && !isTerminal(t)) ? 3 : 0;
}

function noTerminalsWithHonors(hand: Hand): number {
  const tiles = hand.melds.flatMap(m => m.tiles);
  const hasHonors = tiles.some(t => isDragon(t) || isWind(t));
  const noTerminals = tiles.filter(isNumberTile).every(t => !isTerminal(t));
  return hasHonors && noTerminals ? 1 : 0;
}

// --- Payment resolution ---

function resolvePayments(points: number, win: Win): RoundScore {
  const losers = win.method === 'self-pick'
    ? win.players.filter(p => p !== win.winner)
    : [win.from!];

  const dealerBonus = (loser: Player) =>
    loser === win.dealer || win.winner === win.dealer ? win.dealerRounds : 0;

  const payments = losers.map(loser => ({
    from: loser,
    to: win.winner,
    amount: points + dealerBonus(loser),
  }));

  const net = (player: Player) =>
    payments.reduce((sum, p) =>
      sum + (p.to === player ? p.amount : 0) - (p.from === player ? p.amount : 0), 0);

  return Object.fromEntries(win.players.map(p => [p, net(p)]));
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

function suit(tile: Tile): string {
  if (isDragon(tile)) return 'dragon';
  if (isWind(tile)) return 'wind';
  return tile[1];
}

function isWind(tile: Tile): boolean {
  return tile[1] === 'w';
}

function isNumberTile(tile: Tile): boolean {
  return tile.length === 2 && tile[0] >= '1' && tile[0] <= '9';
}

function isTerminal(tile: Tile): boolean {
  return isNumberTile(tile) && (tile[0] === '1' || tile[0] === '9');
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
