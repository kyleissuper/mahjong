import type { ScoreResult } from '../src/types.js';

const RULE_LABELS: Record<string, string> = {
  flower: 'Flower',
  dragonPong: 'Dragon pong',
  windPong: 'Wind pong',
  pairOf258: '2/5/8 pair',
  canOnlyWinWithOne: 'Single tile wait',
  allChows: 'All chows',
  allPongs: 'All pongs',
  selfPick: 'Self-pick',
  only2Suits: 'Only 2 suits',
  noTerminalsWithHonors: 'No 1s/9s (with honors)',
  threeSuitsWithWindAndDragon: '3 suits + wind + dragon',
  splitKong: 'Split kong',
  lastWallTile: 'Last wall tile',
  lastDiscard: 'Last discard',
  winFromButt: 'Win from the butt',
  hiddenKong: 'Hidden kong',
  stolenKong: 'Stolen kong',
  allFromOthers: 'All from others',
  cleanDoorstep: 'Clean doorstep',
  cleanDoorstepAndSelfPick: 'Clean doorstep & self-pick',
  threeHiddenPongs: 'Three hidden pongs',
  doubleChow: 'Double chow',
  threeSuitChow: 'Three suit chow',
  threeConsecutivePongs: 'Three consecutive pongs',
  noFlowersNoHonors: 'No flowers, no honors',
  oneToNineChain: '1-9 chain',
  twoKongMahjong: 'Two kong mahjong',
  twoDoubleChows: 'Two double chows',
  littleDragons: 'Little dragons',
  littleWinds: 'Little winds',
  bigDragons: 'Big dragons',
  bigWinds: 'Big winds',
  semiPure: 'Semi-pure',
  fourConsecutivePongs: 'Four consecutive pongs',
  terminalsAndHonors: 'Terminals & honors',
  pure: 'Pure',
  fourHiddenPongs: 'Four hidden pongs',
  noTerminalsNoHonors: 'No 1s/9s, no honors',
  allKongs: 'All kongs',
  all1sOr9s: 'All 1s or 9s',
  threeSuitPongs: 'Three suit pongs',
  allPairs: 'All pairs',
  allHonors: 'All honors',
  prodigyHand: 'Prodigy hand',
  heavenlyHand: 'Heavenly hand',
  earthlyHand: 'Earthly hand',
  heavenlyGates: 'Heavenly gates',
  thirteenOrphans: 'Thirteen orphans',
  allGreens: 'All greens',
};

interface Props {
  result: ScoreResult;
}

export function ScoreBreakdown({ result }: Props) {
  const { handValue, appliedRules, scores } = result;

  return (
    <section>
      <h2>Score: {handValue} pts</h2>

      <ul>
        {appliedRules.map(({ name, points }) => (
          <li key={name}>
            {RULE_LABELS[name] ?? name}: +{points}
          </li>
        ))}
      </ul>

      <h3>Payments</h3>
      <ul>
        {Object.entries(scores).map(([player, delta]) => (
          <li key={player} style={{ color: delta > 0 ? 'green' : delta < 0 ? 'red' : undefined }}>
            {player}: {delta > 0 ? '+' : ''}{delta}
          </li>
        ))}
      </ul>
    </section>
  );
}
