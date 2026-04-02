import type { Hand, Meld, Win, RoundScore, Tile, Player, ScoreResult, AppliedRule, Payment } from './types.js';
import { isDragon, isWind, isHonor, isNumberTile, isTerminal, is258, numValue, suit } from './tiles.js';

export function calculateScore(hand: Hand, win: Win): ScoreResult {
  const normalized = normalizeHand(hand);
  const appliedRules = getAppliedRules(normalized, win);
  const handValue = appliedRules.reduce((sum, r) => sum + r.points, 0);
  const { scores, payments } = resolvePayments(handValue, win);
  return { scores, handValue, appliedRules, payments };
}

function normalizeHand(hand: Hand): Hand {
  return {
    melds: hand.melds.map(meld =>
      meld.type === 'chow'
        ? { ...meld, tiles: [...meld.tiles].sort() }
        : meld
    ),
  };
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
  { name: 'lastWallTile', score: lastWallTile },
  { name: 'lastDiscard', score: lastDiscard },
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
  { name: 'bigWinds', score: bigWinds, absorbs: ['littleWinds', 'windPong', 'allPongs', 'noTerminalsWithHonors', 'semiPure', 'only2Suits', 'allSetsHave19WithHonors'] },
  { name: 'semiPure', score: semiPure, absorbs: ['only2Suits'] },
  { name: 'fourConsecutivePongs', score: fourConsecutivePongs, absorbs: ['allPongs', 'threeConsecutivePongs'] },
  { name: 'allSetsHave19WithHonors', score: allSetsHave19WithHonors },
  { name: 'allSetsHave19', score: allSetsHave19, absorbs: ['allSetsHave19WithHonors'] },
  { name: 'all19WithHonors', score: all19WithHonors, absorbs: ['allSetsHave19WithHonors'] },
  { name: 'pure', score: pure },
  { name: 'fourHiddenPongs', score: fourHiddenPongs, absorbs: ['allPongs', 'threeHiddenPongs'] },
  { name: 'noTerminalsNoHonors', score: noTerminalsNoHonors, absorbs: ['noFlowersNoHonors'] },
  { name: 'allKongs', score: allKongs, absorbs: ['twoKongMahjong', 'allPongs'] },
  { name: 'all19', score: all19, absorbs: ['allSetsHave19WithHonors', 'allSetsHave19', 'all19WithHonors', 'noFlowersNoHonors'] },
  { name: 'threeSuitPongs', score: threeSuitPongs },
  { name: 'allPairs', score: allPairs, absorbs: ['cleanDoorstep', 'cleanDoorstepAndSelfPick', 'allChows', 'allPongs', 'allFromOthers', 'pairOf258', 'canOnlyWinWithOne'] },
  { name: 'allHonors', score: allHonors, absorbs: ['allPongs', 'windPong', 'dragonPong', 'allSetsHave19WithHonors', 'all19WithHonors', 'noTerminalsWithHonors', 'only2Suits'] },
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
    'cleanDoorstep', 'cleanDoorstepAndSelfPick', 'allSetsHave19WithHonors', 'all19WithHonors',
    'allPongs', 'windPong', 'dragonPong', 'noTerminalsWithHonors',
    'threeSuitsWithWindAndDragon',
  ] },
  { name: 'jadeDragon', score: jadeDragon, absorbs: ['dragonPong', 'noTerminalsWithHonors', 'only2Suits', 'semiPure'] },
  { name: 'rubyDragon', score: rubyDragon, absorbs: ['dragonPong', 'noTerminalsWithHonors', 'only2Suits', 'semiPure'] },
  { name: 'pearlDragon', score: pearlDragon, absorbs: ['dragonPong', 'noTerminalsWithHonors', 'only2Suits', 'semiPure'] },
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
  if (type === 'pair') return pairIsOnlyWait(hand, meld) ? 1 : 0;
  if (type === 'chow' && chowCanOnlyWinWithOne(meld)) return 1;
  if (type === 'orphans') return tiles.filter(t => t === winTile).length === 1 ? 1 : 0;
  return 0;
}

// Pair waits are single-wait only if no other tile also completes the hand.
function pairIsOnlyWait({ melds }: Hand, pairMeld: Meld): boolean {
  const winTile = pairMeld.winTile!;
  if (!isNumberTile(winTile)) return true; // honor pairs can't form chows

  const exposedSets = melds.filter(m => !m.concealed && m.type !== 'flower' && m.type !== 'pair').length;
  const freeTiles = melds.filter(m => m.concealed || m === pairMeld).flatMap(m => m.tiles);
  const withoutWinningTile = freeTiles.toSpliced(freeTiles.indexOf(winTile), 1);
  const setsNeeded = 4 - exposedSets;

  for (const suitCode of ['b', 'd', 'c']) {
    for (let rank = 1; rank <= 9; rank++) {
      const candidateTile = `${rank}${suitCode}` as Tile;
      if (candidateTile === winTile) continue;
      if (canFormHand([...withoutWinningTile, candidateTile], setsNeeded)) return false;
    }
  }
  return true;

  // Backtracking: can these tiles be grouped into sets + 1 pair?
  function canFormHand(handTiles: Tile[], setsNeeded: number): boolean {
    return solve([...handTiles].sort(), setsNeeded, false);

    function solve(tiles: Tile[], setsLeft: number, hasPair: boolean): boolean {
      if (tiles.length === 0) return setsLeft === 0 && hasPair;
      const first = tiles[0];

      // try as pair
      if (!hasPair && tiles[1] === first) {
        if (solve(tiles.slice(2), setsLeft, true)) return true;
      }
      // try as pong
      if (setsLeft > 0 && tiles[2] === first) {
        if (solve(tiles.slice(3), setsLeft - 1, hasPair)) return true;
      }
      // try as start of chow
      if (setsLeft > 0 && isNumberTile(first)) {
        const plus1 = `${numValue(first) + 1}${suit(first)}` as Tile;
        const plus2 = `${numValue(first) + 2}${suit(first)}` as Tile;
        if (tiles.includes(plus1) && tiles.includes(plus2)) {
          const rest = tiles.slice(1);
          const withoutPlus1 = rest.toSpliced(rest.indexOf(plus1), 1);
          const withoutChow = withoutPlus1.toSpliced(withoutPlus1.indexOf(plus2), 1);
          if (solve(withoutChow, setsLeft - 1, hasPair)) return true;
        }
      }
      return false;
    }
  }
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

function allSetsHave19WithHonors({ melds }: Hand): number {
  return melds.filter(({ type }) => type !== 'flower').every(({ tiles }) =>
    tiles.some(t => isHonor(t) || isTerminal(t))
  ) ? 2 : 0;
}

function all19WithHonors(hand: Hand): number {
  return allTiles(hand).every(t => isTerminal(t) || isHonor(t)) ? 8 : 0;
}

function allSetsHave19({ melds }: Hand): number {
  const nonFlower = melds.filter(({ type }) => type !== 'flower');
  return nonFlower.every(({ tiles }) => tiles.some(isTerminal))
    && nonFlower.every(({ tiles }) => tiles.every(isNumberTile))
    ? 4 : 0;
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

function all19(hand: Hand): number {
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

function thirteenOrphans(hand: Hand): number {
  if (hand.melds.some(({ type }) => type === 'orphans')) return 14;
  const tiles = allTiles(hand);
  if (tiles.length !== 14) return 0;
  const required = ['1b','9b','1d','9d','1c','9c','Ew','Sw','Ww','Nw','Rd','Gd','Wd'];
  const counts = new Map<string, number>();
  for (const t of tiles) counts.set(t, (counts.get(t) ?? 0) + 1);
  return required.every(t => (counts.get(t) ?? 0) >= 1)
    && [...counts.values()].filter(c => c === 2).length === 1
    && [...counts.values()].every(c => c <= 2) ? 14 : 0;
}

function allHonors(hand: Hand): number {
  return allTiles(hand).every(isHonor) ? 12 : 0;
}

function pearlDragon(hand: Hand): number {
  const tiles = allTiles(hand);
  const allDotsOrWhite = tiles.every(t => suit(t) === 'd' || t === 'Wd');
  const hasWhiteDragon = tiles.some(t => t === 'Wd');
  return allDotsOrWhite && hasWhiteDragon ? 14 : 0;
}

function rubyDragon(hand: Hand): number {
  const tiles = allTiles(hand);
  const allCharsOrRed = tiles.every(t => suit(t) === 'c' || t === 'Rd');
  const hasRedDragon = tiles.some(t => t === 'Rd');
  return allCharsOrRed && hasRedDragon ? 14 : 0;
}

function jadeDragon(hand: Hand): number {
  const tiles = allTiles(hand);
  const allBambooOrGreen = tiles.every(t => suit(t) === 'b' || t === 'Gd');
  const hasGreenDragon = tiles.some(t => t === 'Gd');
  return allBambooOrGreen && hasGreenDragon ? 14 : 0;
}

function lastWallTile(_hand: Hand, { method, special }: Win): number {
  return method === 'self-pick' && special.includes('lastTile') ? 1 : 0;
}

function lastDiscard(_hand: Hand, { method, special }: Win): number {
  return method === 'discard' && special.includes('lastTile') ? 1 : 0;
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
  const s = sets(hand);
  return s.length > 0 && s.every(({ concealed }) => !concealed) ? 1 : 0;
}

function cleanDoorstep(hand: Hand): number {
  const s = sets(hand);
  return s.length > 0 && s.every(({ concealed }) => concealed) ? 1 : 0;
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

function resolvePayments(points: number, win: Win): { scores: RoundScore; payments: Payment[] } {
  const losers = win.method === 'self-pick'
    ? win.players.filter(p => p !== win.winner)
    : [win.from!];

  const getDealerBonus = (loser: Player) => {
    if (loser !== win.dealer && win.winner !== win.dealer) return 0;
    return 1 + (win.dealerRounds - 1) * 2;
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

// --- Helpers ---
function allTiles(hand: Hand): Tile[] { return hand.melds.flatMap(m => m.tiles); }
function sets(hand: Hand): Meld[] { return hand.melds.filter(m => m.type !== 'pair' && m.type !== 'flower' && m.type !== 'orphans'); }
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
