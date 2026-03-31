import type { Hand, Meld, Win, RoundScore, Tile, Player, ScoreResult, AppliedRule } from './types.js';

export function calculateScore(hand: Hand, win: Win): ScoreResult {
  const appliedRules = getAppliedRules(hand, win);
  const handValue = appliedRules.reduce((sum, r) => sum + r.points, 0);
  const scores = resolvePayments(handValue, win);
  return { scores, handValue, appliedRules };
}

// --- Rule resolution ---

interface Rule {
  name: string;
  score: (hand: Hand, win: Win) => number;
  absorbs?: string[];
}

type FiredRule = { name: string; points: number; absorbs?: string[] };

function getAppliedRules(hand: Hand, win: Win): AppliedRule[] {
  const fired = rules
    .map(r => ({ name: r.name, points: r.score(hand, win), absorbs: r.absorbs }))
    .filter(r => r.points > 0);
  return resolveAbsorption(fired);
}

function resolveAbsorption(all: FiredRule[], survivors: FiredRule[] = all): AppliedRule[] {
  const absorbed = new Set(survivors.flatMap(r => r.absorbs ?? []));
  const next = all.filter(r => !absorbed.has(r.name));
  if (next.length === survivors.length) return next.map(({ name, points }) => ({ name, points }));
  return resolveAbsorption(all, next);
}

// --- Rules ---

const rules: Rule[] = [
  { name: 'flower', score: flower },
  { name: 'dragonPong', score: dragonPong },
  { name: 'windPong', score: windPong },
  { name: 'pairOf258', score: pairOf258 },
  { name: 'canOnlyWinWithOne', score: canOnlyWinWithOne },
  { name: 'allChows', score: allChows },
  { name: 'allPongs', score: allPongs },
  { name: 'selfPick', score: selfPick },
  { name: 'only2Suits', score: only2Suits },
  { name: 'noTerminalsWithHonors', score: noTerminalsWithHonors },
  { name: 'splitKong', score: splitKong },
  { name: 'winFromButt', score: winFromButt },
  { name: 'hiddenKong', score: hiddenKong },
  { name: 'stolenKong', score: stolenKong },
  { name: 'allFromOthers', score: allFromOthers },
  { name: 'cleanDoorstep', score: cleanDoorstep },
  { name: 'cleanDoorstepAndSelfPick', score: cleanDoorstepAndSelfPick, absorbs: ['cleanDoorstep', 'selfPick'] },
  { name: 'threeHiddenPongs', score: threeHiddenPongs },
  { name: 'doubleChow', score: doubleChow },
  { name: 'threeSuitChow', score: threeSuitChow },
  { name: 'threeConsecutivePongs', score: threeConsecutivePongs },
  { name: 'noFlowersNoHonors', score: noFlowersNoHonors },
  { name: 'oneToNineChain', score: oneToNineChain },
  { name: 'twoKongMahjong', score: twoKongMahjong },
  { name: 'twoDoubleChows', score: twoDoubleChows, absorbs: ['doubleChow'] },
  { name: 'littleDragons', score: littleDragons, absorbs: ['dragonPong'] },
  { name: 'littleWinds', score: littleWinds, absorbs: ['windPong'] },
  { name: 'bigDragons', score: bigDragons, absorbs: ['littleDragons', 'dragonPong'] },
  { name: 'bigWinds', score: bigWinds, absorbs: ['littleWinds', 'windPong', 'allPongs', 'noTerminalsWithHonors', 'semiPure', 'only2Suits', 'terminalsAndHonors'] },
  { name: 'semiPure', score: semiPure, absorbs: ['only2Suits'] },
  { name: 'fourConsecutivePongs', score: fourConsecutivePongs, absorbs: ['allPongs', 'threeConsecutivePongs'] },
  { name: 'terminalsAndHonors', score: terminalsAndHonors },
  { name: 'pure', score: pure },
  { name: 'fourHiddenPongs', score: fourHiddenPongs, absorbs: ['allPongs', 'threeHiddenPongs'] },
  { name: 'noTerminalsNoHonors', score: noTerminalsNoHonors, absorbs: ['noFlowersNoHonors'] },
  { name: 'allKongs', score: allKongs, absorbs: ['twoKongMahjong', 'allPongs'] },
  { name: 'all1sOr9s', score: all1sOr9s, absorbs: ['terminalsAndHonors', 'noFlowersNoHonors'] },
  { name: 'threeSuitPongs', score: threeSuitPongs },
  { name: 'allPairs', score: allPairs, absorbs: ['cleanDoorstep', 'cleanDoorstepAndSelfPick', 'allChows', 'allPongs', 'allFromOthers', 'pairOf258', 'canOnlyWinWithOne'] },
  { name: 'allHonors', score: allHonors, absorbs: ['allPongs', 'windPong', 'dragonPong', 'terminalsAndHonors', 'noTerminalsWithHonors', 'only2Suits'] },
  { name: 'heavenlyHand', score: heavenlyHand, absorbs: [
    'selfPick', 'cleanDoorstep', 'cleanDoorstepAndSelfPick', 'noFlowersNoHonors',
  ] },
  { name: 'earthlyHand', score: earthlyHand, absorbs: [
    'cleanDoorstep', 'noFlowersNoHonors',
  ] },
  { name: 'heavenlyGates', score: heavenlyGates, absorbs: [
    'pure', 'cleanDoorstep', 'cleanDoorstepAndSelfPick',
    'canOnlyWinWithOne', 'pairOf258', 'noFlowersNoHonors', 'oneToNineChain',
  ] },
  { name: 'thirteenOrphans', score: thirteenOrphans, absorbs: [
    'cleanDoorstep', 'cleanDoorstepAndSelfPick', 'terminalsAndHonors',
    'allPongs', 'windPong', 'dragonPong', 'noTerminalsWithHonors',
  ] },
  { name: 'allGreens', score: allGreens, absorbs: ['dragonPong', 'noTerminalsWithHonors', 'only2Suits', 'semiPure'] },
];

function flower(hand: Hand): number {
  return hand.melds.filter(m => m.type === 'flower').reduce((sum, m) => sum + m.tiles.length, 0);
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
  if (meld.type === 'pair') return 1;
  if (meld.type === 'chow' && chowCanOnlyWinWithOne(meld)) return 1;
  if (meld.type === 'orphans') {
    const count = meld.tiles.filter(t => t === meld.winTile).length;
    return count === 1 ? 1 : 0;
  }
  return 0;
}

function windPong(hand: Hand): number {
  return hand.melds.filter(m => m.type === 'pong' && isWind(m.tiles[0])).length;
}

function allChows(hand: Hand): number {
  const sets = hand.melds.filter(m => m.type !== 'pair' && m.type !== 'flower');
  return sets.length && sets.every(m => m.type === 'chow') ? 1 : 0;
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
  return sets.length && sets.every(m => m.type === 'pong' || m.type === 'kong') ? 4 : 0;
}

function twoKongMahjong(hand: Hand): number {
  const kongs = hand.melds.filter(m => m.type === 'kong');
  return kongs.length === 2 ? 6 : 0;
}

function twoDoubleChows(hand: Hand): number {
  const chows = hand.melds.filter(m => m.type === 'chow');
  const byTiles = Map.groupBy(chows, m => m.tiles.join(','));
  const duplicatedChows = [...byTiles.values()].filter(g => g.length === 2);
  return duplicatedChows.length === 2 ? 12 : 0;
}

function littleDragons(hand: Hand): number {
  const dragons = ['Rd', 'Gd', 'Wd'];
  const dragonPongs = hand.melds.filter(m => m.type === 'pong' && isDragon(m.tiles[0]));
  const dragonPair = hand.melds.find(m => m.type === 'pair' && isDragon(m.tiles[0]));
  return dragonPongs.length === 2 && dragonPair ? 8 : 0;
}

function bigWinds(hand: Hand): number {
  const windPongs = hand.melds.filter(m => m.type === 'pong' && isWind(m.tiles[0]));
  return windPongs.length === 4 ? 18 : 0;
}

function semiPure(hand: Hand): number {
  const suits = new Set(hand.melds.flatMap(m => m.tiles.map(suit)));
  const numberSuits = [...suits].filter(s => s === 'b' || s === 'd' || s === 'c');
  const hasHonors = suits.has('dragon') || suits.has('wind');
  return numberSuits.length === 1 && hasHonors ? 4 : 0;
}

function fourConsecutivePongs(hand: Hand): number {
  const pongs = hand.melds
    .filter(m => (m.type === 'pong' || m.type === 'kong') && isNumberTile(m.tiles[0]));
  const bySuit = Map.groupBy(pongs, m => suit(m.tiles[0]));
  return [...bySuit.values()].some(melds => {
    const values = new Set(melds.map(m => numValue(m.tiles[0])));
    return [...values].some(v => values.has(v + 1) && values.has(v + 2) && values.has(v + 3));
  }) ? 8 : 0;
}

function littleWinds(hand: Hand): number {
  const windPongs = hand.melds.filter(m => m.type === 'pong' && isWind(m.tiles[0]));
  const windPair = hand.melds.find(m => m.type === 'pair' && isWind(m.tiles[0]));
  return windPongs.length === 3 && windPair ? 12 : 0;
}

function bigDragons(hand: Hand): number {
  const dragonPongs = hand.melds.filter(m => m.type === 'pong' && isDragon(m.tiles[0]));
  return dragonPongs.length === 3 ? 12 : 0;
}

function terminalsAndHonors(hand: Hand): number {
  const sets = hand.melds.filter(m => m.type !== 'flower');
  return sets.every(m =>
    m.tiles.some(t => isDragon(t) || isWind(t) || isTerminal(t))
  ) ? 4 : 0;
}

function pure(hand: Hand): number {
  const suits = new Set(hand.melds.flatMap(m => m.tiles.map(suit)));
  return suits.size === 1 && isNumberTile(hand.melds[0].tiles[0]) ? 8 : 0;
}

function fourHiddenPongs(hand: Hand): number {
  const hiddenPongs = hand.melds.filter(m =>
    (m.type === 'pong' || m.type === 'kong') && m.concealed);
  return hiddenPongs.length >= 4 ? 12 : 0;
}

function allKongs(hand: Hand): number {
  const sets = hand.melds.filter(m => m.type !== 'pair' && m.type !== 'flower');
  return sets.length && sets.every(m => m.type === 'kong') ? 14 : 0;
}

function all1sOr9s(hand: Hand): number {
  const tiles = hand.melds.flatMap(m => m.tiles);
  return tiles.every(t => isTerminal(t)) ? 16 : 0;
}

function threeSuitPongs(hand: Hand): number {
  const pongs = hand.melds
    .filter(m => (m.type === 'pong' || m.type === 'kong') && isNumberTile(m.tiles[0]));
  const byValue = Map.groupBy(pongs, m => numValue(m.tiles[0]));
  return [...byValue.values()].some(melds => {
    const suits = new Set(melds.map(m => suit(m.tiles[0])));
    return suits.has('b') && suits.has('d') && suits.has('c');
  }) ? 4 : 0;
}

function allPairs(hand: Hand): number {
  const pairs = hand.melds.filter(m => m.type === 'pair');
  return pairs.length === 7 ? 12 : 0;
}

function heavenlyHand(_hand: Hand, win: Win): number {
  return win.method === 'self-pick' && win.winner === win.dealer && win.firstTurn ? 20 : 0;
}

function earthlyHand(_hand: Hand, win: Win): number {
  return win.method === 'discard' && win.winner !== win.dealer && win.firstTurn ? 16 : 0;
}

function heavenlyGates(hand: Hand): number {
  const tiles = hand.melds.flatMap(m => m.tiles);
  if (tiles.length !== 14) return 0;
  const suits = new Set(tiles.map(suit));
  if (suits.size !== 1 || !isNumberTile(tiles[0])) return 0;

  const counts = new Map<number, number>();
  for (const t of tiles) counts.set(numValue(t), (counts.get(numValue(t)) ?? 0) + 1);

  //  base pattern: 1×3, 2-8×1, 9×3 — the extra tile adds +1 to any value
  const base = [3, 1, 1, 1, 1, 1, 1, 1, 3]; // required counts for values 1-9
  return base.every((need, i) => (counts.get(i + 1) ?? 0) >= need) ? 16 : 0;
}

function thirteenOrphans(hand: Hand): number {
  return hand.melds.some(m => m.type === 'orphans') ? 14 : 0;
}

function allHonors(hand: Hand): number {
  const tiles = hand.melds.flatMap(m => m.tiles);
  return tiles.every(t => isDragon(t) || isWind(t)) ? 12 : 0;
}

function allGreens(hand: Hand): number {
  const tiles = hand.melds.flatMap(m => m.tiles);
  return tiles.every(t => suit(t) === 'b' || t === 'Gd') ? 14 : 0;
}

function splitKong(hand: Hand): number {
  const tiles = hand.melds.filter(m => m.type !== 'kong').flatMap(m => m.tiles);
  const counts = Map.groupBy(tiles, t => t);
  return [...counts.values()].filter(group => group.length >= 4).length;
}

function winFromButt(_hand: Hand, win: Win): number {
  return win.fromButt ? 1 : 0;
}

function hiddenKong(hand: Hand): number {
  return hand.melds.filter(m => m.type === 'kong' && m.concealed).length * 2;
}

function stolenKong(_hand: Hand, win: Win): number {
  return win.method === 'stolen-kong' ? 1 : 0;
}

function allFromOthers(hand: Hand): number {
  const sets = hand.melds.filter(m => m.type !== 'pair' && m.type !== 'flower');
  return sets.every(m => !m.concealed) ? 1 : 0;
}

function cleanDoorstep(hand: Hand): number {
  const sets = hand.melds.filter(m => m.type !== 'pair' && m.type !== 'flower');
  return sets.every(m => m.concealed) ? 1 : 0;
}

function cleanDoorstepAndSelfPick(hand: Hand, win: Win): number {
  return cleanDoorstep(hand) > 0 && selfPick(hand, win) > 0 ? 3 : 0;
}

function threeHiddenPongs(hand: Hand): number {
  const hiddenPongs = hand.melds.filter(m =>
    (m.type === 'pong' || m.type === 'kong') && m.concealed);
  return hiddenPongs.length >= 3 ? 4 : 0;
}

function doubleChow(hand: Hand): number {
  const chows = hand.melds.filter(m => m.type === 'chow');
  const keys = chows.map(m => m.tiles.join(','));
  return keys.length - new Set(keys).size;
}

function threeSuitChow(hand: Hand): number {
  const chows = hand.melds.filter(m => m.type === 'chow');
  const byValues = Map.groupBy(chows, m => m.tiles.map(numValue).join(','));
  return [...byValues.values()].some(melds => {
    const suits = new Set(melds.map(m => suit(m.tiles[0])));
    return suits.has('b') && suits.has('d') && suits.has('c');
  }) ? 4 : 0;
}

function threeConsecutivePongs(hand: Hand): number {
  const pongs = hand.melds
    .filter(m => (m.type === 'pong' || m.type === 'kong') && isNumberTile(m.tiles[0]));
  const bySuit = Map.groupBy(pongs, m => suit(m.tiles[0]));
  return [...bySuit.values()].some(melds => {
    const values = new Set(melds.map(m => numValue(m.tiles[0])));
    return [...values].some(v => values.has(v + 1) && values.has(v + 2));
  }) ? 4 : 0;
}

function noFlowersNoHonors(hand: Hand): number {
  const tiles = hand.melds.flatMap(m => m.tiles);
  const hasHonors = tiles.some(t => isDragon(t) || isWind(t));
  const hasFlowers = hand.melds.some(m => m.type === 'flower');
  return !hasHonors && !hasFlowers ? 3 : 0;
}

function oneToNineChain(hand: Hand): number {
  const chows = hand.melds.filter(m => m.type === 'chow');
  const bySuit = Map.groupBy(chows, m => suit(m.tiles[0]));
  for (const [, melds] of bySuit) {
    const values = new Set(melds.flatMap(m => m.tiles.map(numValue)));
    if ([1, 2, 3, 4, 5, 6, 7, 8, 9].every(v => values.has(v))) return 3;
  }
  return 0;
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

  const dealerBonus = (loser: Player) => {
    if (loser !== win.dealer && win.winner !== win.dealer) return 0;
    return 1 + (win.dealerRounds - 1) * 2;
  };

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
