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
  { name: 'threeSuitsWithWindAndDragon', score: threeSuitsWithWindAndDragon },
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
  { name: 'prodigyHand', score: prodigyHand },
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
    'threeSuitsWithWindAndDragon',
  ] },
  { name: 'allGreens', score: allGreens, absorbs: ['dragonPong', 'noTerminalsWithHonors', 'only2Suits', 'semiPure'] },
];

function flower({ melds }: Hand): number {
  return melds.filter(({ type }) => type === 'flower').reduce((sum, { tiles }) => sum + tiles.length, 0);
}

function dragonPong({ melds }: Hand): number {
  return melds.filter(({ type, tiles: [first] }) => type === 'pong' && isDragon(first)).length;
}

function pairOf258({ melds }: Hand): number {
  return melds.filter(({ type, tiles: [first] }) => type === 'pair' && is258(first)).length;
}

function canOnlyWinWithOne(hand: Hand): number {
  const meld = winningMeld(hand);
  if (!meld?.winTile) return 0;
  const { type, tiles, winTile } = meld;
  if (type === 'pair') return 1;
  if (type === 'chow' && chowCanOnlyWinWithOne(meld)) return 1;
  if (type === 'orphans') return tiles.filter(t => t === winTile).length === 1 ? 1 : 0;
  return 0;
}

function windPong({ melds }: Hand): number {
  return melds.filter(({ type, tiles: [first] }) => type === 'pong' && isWind(first)).length;
}

function allChows(hand: Hand): number {
  const s = sets(hand);
  return s.length && s.every(({ type }) => type === 'chow') ? 1 : 0;
}

function selfPick(_hand: Hand, { method }: Win): number {
  return method === 'self-pick' ? 1 : 0;
}

function only2Suits(hand: Hand): number {
  return new Set(allTiles(hand).map(suit)).size === 2 ? 1 : 0;
}

function allPongs(hand: Hand): number {
  const s = sets(hand);
  return s.length && s.every(({ type }) => type === 'pong' || type === 'kong') ? 4 : 0;
}

function twoKongMahjong({ melds }: Hand): number {
  return melds.filter(({ type }) => type === 'kong').length === 2 ? 6 : 0;
}

function twoDoubleChows({ melds }: Hand): number {
  const chows = melds.filter(({ type }) => type === 'chow');
  const byTiles = Map.groupBy(chows, ({ tiles }) => tiles.join(','));
  const duplicated = [...byTiles.values()].filter(g => g.length === 2);
  return duplicated.length === 2 ? 12 : 0;
}

function littleDragons({ melds }: Hand): number {
  const pongs = melds.filter(({ type, tiles: [first] }) => type === 'pong' && isDragon(first));
  const pair = melds.find(({ type, tiles: [first] }) => type === 'pair' && isDragon(first));
  return pongs.length === 2 && pair ? 8 : 0;
}

function bigWinds({ melds }: Hand): number {
  return melds.filter(({ type, tiles: [first] }) => type === 'pong' && isWind(first)).length === 4 ? 18 : 0;
}

function semiPure(hand: Hand): number {
  const suits = new Set(allTiles(hand).map(suit));
  const numberSuits = [...suits].filter(s => s === 'b' || s === 'd' || s === 'c');
  return numberSuits.length === 1 && (suits.has('dragon') || suits.has('wind')) ? 4 : 0;
}

function fourConsecutivePongs({ melds }: Hand): number {
  const pongs = melds.filter(({ type, tiles: [first] }) =>
    (type === 'pong' || type === 'kong') && isNumberTile(first));
  const bySuit = Map.groupBy(pongs, ({ tiles: [first] }) => suit(first));
  return [...bySuit.values()].some(melds => {
    const values = new Set(melds.map(({ tiles: [first] }) => numValue(first)));
    return [...values].some(v => values.has(v + 1) && values.has(v + 2) && values.has(v + 3));
  }) ? 8 : 0;
}

function littleWinds({ melds }: Hand): number {
  const pongs = melds.filter(({ type, tiles: [first] }) => type === 'pong' && isWind(first));
  const pair = melds.find(({ type, tiles: [first] }) => type === 'pair' && isWind(first));
  return pongs.length === 3 && pair ? 12 : 0;
}

function bigDragons({ melds }: Hand): number {
  return melds.filter(({ type, tiles: [first] }) => type === 'pong' && isDragon(first)).length === 3 ? 12 : 0;
}

function terminalsAndHonors({ melds }: Hand): number {
  return melds.filter(({ type }) => type !== 'flower').every(({ tiles }) =>
    tiles.some(t => isHonor(t) || isTerminal(t))
  ) ? 4 : 0;
}

function pure(hand: Hand): number {
  const suits = new Set(allTiles(hand).map(suit));
  return suits.size === 1 && isNumberTile(hand.melds[0].tiles[0]) ? 8 : 0;
}

function fourHiddenPongs({ melds }: Hand): number {
  return melds.filter(({ type, concealed }) =>
    (type === 'pong' || type === 'kong') && concealed).length >= 4 ? 12 : 0;
}

function allKongs(hand: Hand): number {
  const s = sets(hand);
  return s.length && s.every(({ type }) => type === 'kong') ? 14 : 0;
}

function all1sOr9s(hand: Hand): number {
  return allTiles(hand).every(isTerminal) ? 16 : 0;
}

function threeSuitPongs({ melds }: Hand): number {
  const pongs = melds.filter(({ type, tiles: [first] }) =>
    (type === 'pong' || type === 'kong') && isNumberTile(first));
  const byValue = Map.groupBy(pongs, ({ tiles: [first] }) => numValue(first));
  return [...byValue.values()].some(hasAll3NumberSuits) ? 4 : 0;
}

function allPairs({ melds }: Hand): number {
  return melds.filter(({ type }) => type === 'pair').length === 7 ? 12 : 0;
}

function prodigyHand(_hand: Hand, { special }: Win): number {
  return special.includes('prodigy') ? 12 : 0;
}

function heavenlyHand(_hand: Hand, { method, winner, dealer, special }: Win): number {
  return method === 'self-pick' && winner === dealer && special.includes('firstTurn') ? 20 : 0;
}

function earthlyHand(_hand: Hand, { method, winner, dealer, special }: Win): number {
  return method === 'discard' && winner !== dealer && special.includes('firstTurn') ? 16 : 0;
}

function heavenlyGates(hand: Hand): number {
  const tiles = allTiles(hand);
  if (tiles.length !== 14) return 0;
  const suits = new Set(tiles.map(suit));
  if (suits.size !== 1 || !isNumberTile(tiles[0])) return 0;

  const counts = Map.groupBy(tiles, numValue);

  //  base pattern: 1×3, 2-8×1, 9×3 — the extra tile adds +1 to any value
  const base = [3, 1, 1, 1, 1, 1, 1, 1, 3]; // required counts for values 1-9
  return base.every((need, i) => (counts.get(i + 1)?.length ?? 0) >= need) ? 16 : 0;
}

function threeSuitsWithWindAndDragon(hand: Hand): number {
  const suits = new Set(allTiles(hand).map(suit));
  const has3NumberSuits = ['b', 'd', 'c'].every(s => suits.has(s));
  return has3NumberSuits && suits.has('wind') && suits.has('dragon') ? 1 : 0;
}

function thirteenOrphans({ melds }: Hand): number {
  return melds.some(({ type }) => type === 'orphans') ? 14 : 0;
}

function allHonors(hand: Hand): number {
  return allTiles(hand).every(isHonor) ? 12 : 0;
}

function allGreens(hand: Hand): number {
  return allTiles(hand).every(t => suit(t) === 'b' || t === 'Gd') ? 14 : 0;
}

function splitKong({ melds }: Hand): number {
  const tiles = melds.filter(({ type }) => type !== 'kong').flatMap(({ tiles }) => tiles);
  const counts = Map.groupBy(tiles, t => t);
  return [...counts.values()].filter(group => group.length >= 4).length;
}

function winFromButt(_hand: Hand, { special }: Win): number {
  return special.includes('fromButt') ? 1 : 0;
}

function hiddenKong({ melds }: Hand): number {
  return melds.filter(({ type, concealed }) => type === 'kong' && concealed).length * 2;
}

function stolenKong(_hand: Hand, { method }: Win): number {
  return method === 'stolen-kong' ? 1 : 0;
}

function allFromOthers(hand: Hand): number {
  return sets(hand).every(({ concealed }) => !concealed) ? 1 : 0;
}

function cleanDoorstep(hand: Hand): number {
  return sets(hand).every(({ concealed }) => concealed) ? 1 : 0;
}

function cleanDoorstepAndSelfPick(hand: Hand, win: Win): number {
  return cleanDoorstep(hand) > 0 && selfPick(hand, win) > 0 ? 3 : 0;
}

function threeHiddenPongs({ melds }: Hand): number {
  return melds.filter(({ type, concealed }) =>
    (type === 'pong' || type === 'kong') && concealed).length >= 3 ? 4 : 0;
}

function doubleChow(hand: Hand): number {
  const chows = hand.melds.filter(m => m.type === 'chow');
  const keys = chows.map(m => m.tiles.join(','));
  return keys.length - new Set(keys).size;
}

function threeSuitChow(hand: Hand): number {
  const chows = hand.melds.filter(m => m.type === 'chow');
  const byValues = Map.groupBy(chows, m => m.tiles.map(numValue).join(','));
  return [...byValues.values()].some(hasAll3NumberSuits) ? 4 : 0;
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
  const tiles = allTiles(hand);
  const hasHonors = tiles.some(t => isHonor(t));
  const hasFlowers = hand.melds.some(m => m.type === 'flower');
  return !hasHonors && !hasFlowers ? 3 : 0;
}

function oneToNineChain(hand: Hand): number {
  const chows = hand.melds.filter(m => m.type === 'chow');
  const bySuit = Map.groupBy(chows, m => suit(m.tiles[0]));
  return [...bySuit.values()].some(melds => {
    const values = new Set(melds.flatMap(m => m.tiles.map(numValue)));
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].every(v => values.has(v));
  }) ? 3 : 0;
}

function noTerminalsNoHonors(hand: Hand): number {
  const tiles = allTiles(hand);
  return tiles.every(t => isNumberTile(t) && !isTerminal(t)) ? 3 : 0;
}

function noTerminalsWithHonors(hand: Hand): number {
  const tiles = allTiles(hand);
  const hasHonors = tiles.some(t => isHonor(t));
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

// Tile classification
function isDragon(tile: Tile): boolean { return tile === 'Rd' || tile === 'Gd' || tile === 'Wd'; }
function isWind(tile: Tile): boolean { return tile[1] === 'w'; }
function isHonor(tile: Tile): boolean { return isDragon(tile) || isWind(tile); }
function isNumberTile(tile: Tile): boolean { return tile.length === 2 && tile[0] >= '1' && tile[0] <= '9'; }
function isTerminal(tile: Tile): boolean { return isNumberTile(tile) && (tile[0] === '1' || tile[0] === '9'); }
function is258(tile: Tile): boolean { const v = tile[0]; return tile.length === 2 && (v === '2' || v === '5' || v === '8'); }
function numValue(tile: Tile): number { return parseInt(tile[0]); }
function suit(tile: Tile): string { return isHonor(tile) ? (isDragon(tile) ? 'dragon' : 'wind') : tile[1]; }

// Hand queries
function allTiles(hand: Hand): Tile[] { return hand.melds.flatMap(m => m.tiles); }
function sets(hand: Hand): Meld[] { return hand.melds.filter(m => m.type !== 'pair' && m.type !== 'flower'); }
function winningMeld(hand: Hand): Meld | undefined { return hand.melds.find(m => m.winTile !== undefined); }
function hasAll3NumberSuits(melds: Meld[]): boolean {
  const s = new Set(melds.map(m => suit(m.tiles[0])));
  return s.has('b') && s.has('d') && s.has('c');
}

function chowCanOnlyWinWithOne(meld: Meld): boolean {
  const others = meld.tiles
    .filter(t => t !== meld.winTile)
    .map(numValue)
    .sort((a, b) => a - b);
  const gap = others[1] - others[0];
  return gap === 2 || others[0] === 1 || others[1] === 9;
}
