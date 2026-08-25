import type { Hand, Meld, Win, Tile } from '../types.ts';
import { isDragon, isWind, isHonor, isNumberTile, isTerminal, is258, numValue, suit, ORPHAN_TILES } from '../tile.ts';

export interface Rule {
  name: string;
  label: string;
  pts: string;
  score: (hand: Hand, win: Win) => number;
  absorbs?: string[];
  demotes?: { from: string; to: string; fromEach: number; toEach: number }[];
}

export const DRAGON_COMPONENTS = ['dragonPong', 'dragonKong', 'dragonSecretKong'] as const;
export const WIND_COMPONENTS = ['windPong', 'windKong', 'windSecretKong'] as const;
export const HONOR_COMPONENTS = [...DRAGON_COMPONENTS, ...WIND_COMPONENTS] as const;

export const rules: Rule[] = [
  { name: 'flower', label: 'Flowers', pts: '1 ea.', score: flower },
  { name: 'dragonPong', label: 'Pong of Honor (dragon)', pts: '1 ea.', score: dragonPong },
  { name: 'dragonKong', label: 'Kong of Honor (dragon)', pts: '2 ea.', score: dragonKong },
  { name: 'dragonSecretKong', label: 'Secret Kong of Honor (dragon)', pts: '3 ea.', score: dragonSecretKong },
  { name: 'windPong', label: 'Pong of Honor (wind)', pts: '1 ea.', score: windPong },
  { name: 'windKong', label: 'Kong of Honor (wind)', pts: '2 ea.', score: windKong },
  { name: 'windSecretKong', label: 'Secret Kong of Honor (wind)', pts: '3 ea.', score: windSecretKong },
  { name: 'pairOf258', label: 'Two, Five, Eight Pair', pts: '1', score: pairOf258 },
  { name: 'canOnlyWinWithOne', label: 'Can Only Win with One', pts: '1', score: canOnlyWinWithOne },
  { name: 'allChows', label: 'All Chow Hand', pts: '1', score: allChows },
  { name: 'allPongs', label: 'All Pong Hand', pts: '4', score: allPongs },
  { name: 'selfPick', label: 'Self-Pick', pts: '1', score: selfPick },
  { name: 'missingSuit', label: 'Missing a Suit', pts: '1', score: missingSuit },
  { name: 'no19sWithHonors', label: "No 1's or 9's with Honors", pts: '1', score: no19sWithHonors },
  { name: 'threeSuitsWithWindAndDragon', label: '3 Suits w/ Wind and Dragon', pts: '1', score: threeSuitsWithWindAndDragon },
  { name: 'lastWallTile', label: 'Win from the Last Wall Tile', pts: '1', score: lastWallTile },
  { name: 'lastDiscard', label: 'Win from the Last Discard', pts: '1', score: lastDiscard },
  { name: 'splitKong', label: 'Split Kong', pts: '1 ea.', score: splitKong },
  { name: 'winFromFlowerWall', label: 'Win from the Flower Wall', pts: '1', score: winFromFlowerWall },
  { name: 'kong', label: 'Kong', pts: '1 ea.', score: kong },
  { name: 'secretKong', label: 'Secret Kong', pts: '2 ea.', score: secretKong },
  { name: 'stolenKong', label: 'Stolen Kong', pts: '1', score: stolenKong },
  { name: 'allFromOthers', label: 'All from Others', pts: '1', score: allFromOthers },
  { name: 'cleanDoorstep', label: 'Clean Doorstep', pts: '1', score: cleanDoorstep },
  { name: 'cleanDoorstepAndSelfPick', label: 'Clean Doorstep AND Self-Pick', pts: '3', score: cleanDoorstepAndSelfPick, absorbs: ['cleanDoorstep', 'selfPick'] },
  { name: 'threeHiddenPongs', label: 'Three Hidden Pongs', pts: '4', score: threeHiddenPongs },
  { name: 'doubleChow', label: 'Double Chow', pts: '1 ea.', score: doubleChow },
  { name: 'littleAndBigChow', label: 'Little and Big Chow', pts: '1', score: littleAndBigChow },
  { name: 'littleAndBigPong', label: 'Little and Big Pong', pts: '1', score: littleAndBigPong },
  { name: 'threeSuitChow', label: 'Three Suit Chow', pts: '4', score: threeSuitChow },
  { name: 'threeConsecutivePongs', label: 'Three Consecutive Pongs', pts: '4', score: threeConsecutivePongs },
  { name: 'noFlowersNoHonors', label: 'No Flowers and No Honors', pts: '3', score: noFlowersNoHonors },
  { name: 'oneToNineTrain', label: '1 through 9 Train', pts: '3', score: oneToNineTrain, absorbs: ['littleAndBigChow'] },
  { name: 'twoKongMahjong', label: '2 Kong Mahjong', pts: '8', score: twoKongMahjong },
  { name: 'twoDoubleChows', label: 'Two Double Chows', pts: '12', score: twoDoubleChows, absorbs: ['doubleChow'] },
  { name: 'littleDragons', label: 'Little Dragons', pts: '8', score: littleDragons, absorbs: [...DRAGON_COMPONENTS] },
  { name: 'littleWinds', label: 'Little Winds', pts: '12', score: littleWinds, absorbs: [...WIND_COMPONENTS] },
  { name: 'bigDragons', label: 'Big Dragons', pts: '12', score: bigDragons, absorbs: ['littleDragons', ...DRAGON_COMPONENTS] },
  { name: 'bigWinds', label: 'Big Winds', pts: '16', score: bigWinds, absorbs: ['littleWinds', ...WIND_COMPONENTS, 'allPongs', 'no19sWithHonors', 'semiPure', 'semiMixed19s'] },
  { name: 'semiPure', label: 'Semi-Pure Hand', pts: '4', score: semiPure },
  { name: 'fourConsecutivePongs', label: 'Four Consecutive Pongs', pts: '8', score: fourConsecutivePongs, absorbs: ['allPongs', 'threeConsecutivePongs'] },
  { name: 'semiMixed19s', label: "Semi Mixed 1's or 9's", pts: '4', score: semiMixed19s },
  { name: 'pureMixed19s', label: "Pure Mixed 1's or 9's", pts: '8', score: pureMixed19s, absorbs: ['semiMixed19s'] },
  { name: 'semi19sPongs', label: "Semi 1's or 9's Pongs", pts: '12', score: semi19sPongs, absorbs: ['semiMixed19s', 'allPongs', 'littleAndBigPong'] },
  { name: 'pure', label: 'Pure Hand', pts: '8', score: pure },
  { name: 'fourHiddenPongs', label: 'Four Hidden Pongs', pts: '12', score: fourHiddenPongs, absorbs: ['allPongs', 'threeHiddenPongs'], demotes: [
    { from: 'secretKong', to: 'kong', fromEach: 2, toEach: 1 },
    { from: 'windSecretKong', to: 'windKong', fromEach: 3, toEach: 2 },
    { from: 'dragonSecretKong', to: 'dragonKong', fromEach: 3, toEach: 2 },
  ] },
  { name: 'hiddenTreasure', label: 'Hidden Treasure', pts: '16', score: hiddenTreasure, absorbs: ['fourHiddenPongs', 'threeHiddenPongs', 'allPongs', 'cleanDoorstepAndSelfPick', 'cleanDoorstep', 'selfPick'] },
  { name: 'no19sNoHonors', label: "No 1's or 9's with NO Honors", pts: '3', score: no19sNoHonors },
  { name: 'allKongs', label: 'All Kongs', pts: '16', score: allKongs, absorbs: ['allPongs'] },
  { name: 'pure19sPongs', label: "Pure 1's or 9's Pongs", pts: '16', score: pure19sPongs, absorbs: ['semiMixed19s', 'pureMixed19s', 'semi19sPongs', 'noFlowersNoHonors', 'littleAndBigPong', 'allPongs'] },
  { name: 'threeSuitPongs', label: 'Three Suit Pongs', pts: '4', score: threeSuitPongs },
  { name: 'allPairs', label: 'All Pairs', pts: '12', score: allPairs, absorbs: ['cleanDoorstep', 'cleanDoorstepAndSelfPick', 'allChows', 'allPongs', 'allFromOthers', 'pairOf258', 'canOnlyWinWithOne'] },
  { name: 'allHonors', label: 'All Honors', pts: '12', score: allHonors, absorbs: ['allPongs', ...HONOR_COMPONENTS, 'semiMixed19s', 'no19sWithHonors'] },
  { name: 'prodigyHand', label: 'Prodigy Hand', pts: '12', score: prodigyHand },
  { name: 'heavenlyHand', label: 'Heavenly Hand', pts: '24', score: heavenlyHand, absorbs: ['selfPick', 'cleanDoorstep', 'cleanDoorstepAndSelfPick', 'noFlowersNoHonors', 'prodigyHand'] },
  { name: 'earthlyHand', label: 'Earthly Hand', pts: '16', score: earthlyHand, absorbs: ['cleanDoorstep', 'noFlowersNoHonors', 'prodigyHand'] },
  { name: 'heavenlyGates', label: 'Heavenly Gates', pts: '16', score: heavenlyGates, absorbs: ['pure', 'cleanDoorstep', 'cleanDoorstepAndSelfPick', 'canOnlyWinWithOne', 'pairOf258', 'noFlowersNoHonors', 'oneToNineTrain', 'littleAndBigChow', 'littleAndBigPong'] },
  { name: 'thirteenOrphans', label: 'Thirteen Orphans', pts: '16', score: thirteenOrphans, absorbs: ['cleanDoorstep', 'cleanDoorstepAndSelfPick', 'semiMixed19s', 'allPongs', ...HONOR_COMPONENTS, 'no19sWithHonors', 'threeSuitsWithWindAndDragon', 'heavenlyGates'] },
  { name: 'jadeDragon', label: 'Jade Dragon', pts: '12', score: jadeDragon, absorbs: [...DRAGON_COMPONENTS, 'no19sWithHonors', 'semiPure'] },
  { name: 'rubyDragon', label: 'Ruby Dragon', pts: '12', score: rubyDragon, absorbs: [...DRAGON_COMPONENTS, 'no19sWithHonors', 'semiPure'] },
  { name: 'pearlDragon', label: 'Pearl Dragon', pts: '12', score: pearlDragon, absorbs: [...DRAGON_COMPONENTS, 'no19sWithHonors', 'semiPure'] },
];

// --- Rule implementations ---

function flower({ melds }: Hand): number {
  return melds.filter(({ type }) => type === 'flower').reduce((sum, { tiles }) => sum + tiles.length, 0);
}

function dragonPong({ melds }: Hand): number {
  return melds.filter(({ type, tiles: [first] }) => type === 'pong' && isDragon(first)).length;
}

function dragonKong({ melds }: Hand): number {
  return melds.filter(({ type, concealed, tiles: [first] }) =>
    type === 'kong' && !concealed && isDragon(first)).length * 2;
}

function dragonSecretKong({ melds }: Hand): number {
  return melds.filter(({ type, concealed, tiles: [first] }) =>
    type === 'kong' && concealed && isDragon(first)).length * 3;
}

function windPong({ melds }: Hand): number {
  return melds.filter(({ type, tiles: [first] }) => type === 'pong' && isWind(first)).length;
}

function windKong({ melds }: Hand): number {
  return melds.filter(({ type, concealed, tiles: [first] }) =>
    type === 'kong' && !concealed && isWind(first)).length * 2;
}

function windSecretKong({ melds }: Hand): number {
  return melds.filter(({ type, concealed, tiles: [first] }) =>
    type === 'kong' && concealed && isWind(first)).length * 3;
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

function allChows(hand: Hand): number {
  const s = sets(hand);
  return s.length && s.every(({ type }) => type === 'chow') ? 1 : 0;
}

function selfPick(_hand: Hand, { method }: Win): number {
  return method === 'self-pick' ? 1 : 0;
}

function missingSuit(hand: Hand): number {
  const tiles = handTiles(hand);
  return !tiles.some(isHonor) && new Set(tiles.map(suit)).size === 2 ? 1 : 0;
}

function allPongs(hand: Hand): number {
  const s = sets(hand);
  return s.length && s.every(({ type }) => type === 'pong' || type === 'kong') ? 4 : 0;
}

function twoKongMahjong(_hand: Hand, { special }: Win): number {
  return special.includes('twoKongMahjong') ? 8 : 0;
}

function twoDoubleChows({ melds }: Hand): number {
  const chows = melds.filter(({ type }) => type === 'chow');
  const byTiles = Map.groupBy(chows, ({ tiles }) => tiles.join(','));
  const duplicated = [...byTiles.values()].filter(g => g.length === 2);
  return duplicated.length === 2 ? 12 : 0;
}

function littleDragons({ melds }: Hand): number {
  const pongs = melds.filter(({ type, tiles: [first] }) => (type === 'pong' || type === 'kong') && isDragon(first));
  const pair = melds.find(({ type, tiles: [first] }) => type === 'pair' && isDragon(first));
  return pongs.length === 2 && pair ? 8 : 0;
}

function bigWinds({ melds }: Hand): number {
  return melds.filter(({ type, tiles: [first] }) => (type === 'pong' || type === 'kong') && isWind(first)).length === 4 ? 16 : 0;
}

function semiPure(hand: Hand): number {
  const suits = new Set(handTiles(hand).map(suit));
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
  const pongs = melds.filter(({ type, tiles: [first] }) => (type === 'pong' || type === 'kong') && isWind(first));
  const pair = melds.find(({ type, tiles: [first] }) => type === 'pair' && isWind(first));
  return pongs.length === 3 && pair ? 12 : 0;
}

function bigDragons({ melds }: Hand): number {
  return melds.filter(({ type, tiles: [first] }) => (type === 'pong' || type === 'kong') && isDragon(first)).length === 3 ? 12 : 0;
}

function littleAndBigChow(hand: Hand): number {
  let points = 0;
  for (const s of ['b', 'c', 'd']) {
    const chows = sets(hand).filter(({ type, tiles: [first] }) => type === 'chow' && suit(first) === s);
    const c123 = chows.filter(({ tiles }) => tiles.map(numValue).sort().join('') === '123').length;
    const c789 = chows.filter(({ tiles }) => tiles.map(numValue).sort().join('') === '789').length;
    if (c123 && c789) points += c123 + c789 - 1;
  }
  return points;
}

function littleAndBigPong(hand: Hand): number {
  let points = 0;
  for (const s of ['b', 'c', 'd']) {
    const pongs = sets(hand).filter(({ type, tiles: [first] }) => (type === 'pong' || type === 'kong') && suit(first) === s);
    if (pongs.some(({ tiles }) => numValue(tiles[0]) === 1) && pongs.some(({ tiles }) => numValue(tiles[0]) === 9)) points += 1;
  }
  return points;
}

function semiMixed19s(hand: Hand): number {
  return handMelds(hand).every(({ tiles }) =>
    tiles.some(t => isHonor(t) || isTerminal(t))
  ) ? 4 : 0;
}

function semi19sPongs(hand: Hand): number {
  const hasTerminalPong = sets(hand).some(({ type, tiles: [first] }) =>
    (type === 'pong' || type === 'kong') && isTerminal(first));
  return hasTerminalPong && handTiles(hand).every(t => isTerminal(t) || isHonor(t)) ? 12 : 0;
}

function pureMixed19s(hand: Hand): number {
  const playing = handMelds(hand);
  return playing.every(({ tiles }) => tiles.some(isTerminal))
    && playing.every(({ tiles }) => tiles.every(isNumberTile))
    ? 8 : 0;
}

function pure(hand: Hand): number {
  const suits = new Set(handTiles(hand).map(suit));
  return suits.size === 1 && isNumberTile(hand.melds[0].tiles[0]) ? 8 : 0;
}

function fourHiddenPongs({ melds }: Hand): number {
  return melds.filter(({ type, concealed }) =>
    (type === 'pong' || type === 'kong') && concealed).length >= 4 ? 12 : 0;
}

function hiddenTreasure(hand: Hand, { method }: Win): number {
  return method === 'self-pick' && fourHiddenPongs(hand) ? 16 : 0;
}

function allKongs(hand: Hand): number {
  const s = sets(hand);
  return s.length && s.every(({ type }) => type === 'kong') ? 16 : 0;
}

function pure19sPongs(hand: Hand): number {
  return handTiles(hand).every(isTerminal) ? 16 : 0;
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

function heavenlyHand(_hand: Hand, { method, special }: Win): number {
  return method === 'self-pick' && special.includes('firstTurn') ? 24 : 0;
}

function earthlyHand(_hand: Hand, { method, winner, dealer, special }: Win): number {
  return method === 'discard' && winner !== dealer && special.includes('firstTurn') ? 16 : 0;
}

function heavenlyGates(hand: Hand): number {
  const tiles = handTiles(hand);
  if (tiles.length !== 14) return 0;
  const suits = new Set(tiles.map(suit));
  if (suits.size !== 1 || !isNumberTile(tiles[0])) return 0;
  const counts = Map.groupBy(tiles, numValue);
  const base = [3, 1, 1, 1, 1, 1, 1, 1, 3];
  return base.every((need, i) => (counts.get(i + 1)?.length ?? 0) >= need) ? 16 : 0;
}

function threeSuitsWithWindAndDragon(hand: Hand): number {
  const suits = new Set(handTiles(hand).map(suit));
  const has3NumberSuits = ['b', 'd', 'c'].every(s => suits.has(s));
  return has3NumberSuits && suits.has('wind') && suits.has('dragon') ? 1 : 0;
}

function thirteenOrphans(hand: Hand): number {
  if (hand.melds.some(({ type }) => type === 'orphans')) return 16;
  const tiles = handTiles(hand);
  if (tiles.length !== 14) return 0;
  const counts = new Map<string, number>();
  for (const t of tiles) counts.set(t, (counts.get(t) ?? 0) + 1);
  return ORPHAN_TILES.every(t => (counts.get(t) ?? 0) >= 1)
    && [...counts.values()].filter(c => c === 2).length === 1
    && [...counts.values()].every(c => c <= 2) ? 16 : 0;
}

function allHonors(hand: Hand): number {
  return handTiles(hand).every(isHonor) ? 12 : 0;
}

function pearlDragon(hand: Hand): number {
  const tiles = handTiles(hand);
  const allDotsOrWhite = tiles.every(t => suit(t) === 'd' || t === 'Wd');
  return allDotsOrWhite && hasDragonPong(hand, 'Wd') ? 12 : 0;
}

function rubyDragon(hand: Hand): number {
  const tiles = handTiles(hand);
  const allCharsOrRed = tiles.every(t => suit(t) === 'c' || t === 'Rd');
  return allCharsOrRed && hasDragonPong(hand, 'Rd') ? 12 : 0;
}

function jadeDragon(hand: Hand): number {
  const tiles = handTiles(hand);
  const allBambooOrGreen = tiles.every(t => suit(t) === 'b' || t === 'Gd');
  return allBambooOrGreen && hasDragonPong(hand, 'Gd') ? 12 : 0;
}

function lastWallTile(_hand: Hand, { method, special }: Win): number {
  return method === 'self-pick' && special.includes('lastTile') ? 1 : 0;
}

function lastDiscard(_hand: Hand, { method, special }: Win): number {
  return method === 'discard' && special.includes('lastTile') ? 1 : 0;
}

function splitKong(hand: Hand): number {
  const tiles = handMelds(hand).filter(({ type }) => type !== 'kong').flatMap(({ tiles }) => tiles);
  const counts = Map.groupBy(tiles, t => t);
  return [...counts.values()].filter(group => group.length >= 4).length;
}

function winFromFlowerWall(_hand: Hand, { special }: Win): number {
  return special.includes('fromFlowerWall') ? 1 : 0;
}

function kong({ melds }: Hand): number {
  return melds.filter(({ type, concealed, tiles: [first] }) =>
    type === 'kong' && !concealed && !isHonor(first)).length;
}

function secretKong({ melds }: Hand): number {
  return melds.filter(({ type, concealed, tiles: [first] }) =>
    type === 'kong' && concealed && !isHonor(first)).length * 2;
}

function stolenKong(_hand: Hand, { method }: Win): number {
  return method === 'stolen-kong' ? 1 : 0;
}

function allFromOthers(hand: Hand): number {
  const s = sets(hand);
  return s.length > 0 && handMelds(hand).every(({ concealed }) => !concealed) ? 1 : 0;
}

function cleanDoorstep(hand: Hand): number {
  const s = sets(hand);
  return s.length > 0 && handMelds(hand).every(m => m.concealed || m.winTile) ? 1 : 0;
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
  const tiles = handTiles(hand);
  const hasHonors = tiles.some(t => isHonor(t));
  const hasFlowers = hand.melds.some(m => m.type === 'flower');
  return !hasHonors && !hasFlowers ? 3 : 0;
}

function oneToNineTrain(hand: Hand): number {
  const chows = hand.melds.filter(m => m.type === 'chow');
  const bySuit = Map.groupBy(chows, m => suit(m.tiles[0]));
  for (const melds of bySuit.values()) {
    const legs = melds.map(m => m.tiles.map(numValue).sort().join(''));
    const counts = ['123', '456', '789'].map(leg => legs.filter(l => l === leg).length);
    if (counts.some(count => count === 0)) continue;
    return 3 + counts.reduce((sum, count) => sum + (count - 1), 0);
  }
  return 0;
}

function no19sNoHonors(hand: Hand): number {
  const tiles = handTiles(hand);
  return tiles.every(t => isNumberTile(t) && !isTerminal(t)) ? 3 : 0;
}

function no19sWithHonors(hand: Hand): number {
  const tiles = handTiles(hand);
  const hasHonors = tiles.some(t => isHonor(t));
  const no19s = tiles.filter(isNumberTile).every(t => !isTerminal(t));
  return hasHonors && no19s ? 1 : 0;
}

// --- Helpers ---

function handMelds(hand: Hand): Meld[] { return hand.melds.filter(m => m.type !== 'flower'); }
function handTiles(hand: Hand): Tile[] { return handMelds(hand).flatMap(m => m.tiles); }
function sets(hand: Hand): Meld[] { return handMelds(hand).filter(m => m.type !== 'pair' && m.type !== 'orphans'); }
function winningMeld(hand: Hand): Meld | undefined { return hand.melds.find(m => m.winTile !== undefined); }

function hasDragonPong({ melds }: Hand, dragon: Tile): boolean {
  return melds.some(({ type, tiles: [first] }) => (type === 'pong' || type === 'kong') && first === dragon);
}

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

function pairIsOnlyWait(hand: Hand, pairMeld: Meld): boolean {
  const winTile = pairMeld.winTile!;
  if (!isNumberTile(winTile)) return true;

  const exposedSets = handMelds(hand).filter(m => !m.concealed && m.type !== 'pair').length;
  const freeTiles = hand.melds.filter(m => m.concealed || m === pairMeld).flatMap(m => m.tiles);
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

  function canFormHand(freeTiles: Tile[], setsNeeded: number): boolean {
    return solve([...freeTiles].sort(), setsNeeded, false);

    function solve(tiles: Tile[], setsLeft: number, hasPair: boolean): boolean {
      if (tiles.length === 0) return setsLeft === 0 && hasPair;
      const first = tiles[0];

      if (!hasPair && tiles[1] === first) {
        if (solve(tiles.slice(2), setsLeft, true)) return true;
      }
      if (setsLeft > 0 && tiles[2] === first) {
        if (solve(tiles.slice(3), setsLeft - 1, hasPair)) return true;
      }
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
