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
    <section className="section">
      <div className="score-section">
        <div className="score-header">
          <div className="score-value">{handValue}</div>
          <div className="score-label">points</div>
        </div>

        <ul className="rules-list">
          {appliedRules.map(({ name, points }) => (
            <li key={name} className="rule-item">
              <span className="rule-name">{RULE_LABELS[name] ?? name}</span>
              <span className="rule-points">+{points}</span>
            </li>
          ))}
        </ul>

        <div className="payments-title">Payments</div>
        <ul className="payments-list">
          {Object.entries(scores).map(([player, delta]) => (
            <li key={player} className="payment-item">
              <div className="payment-player">{player}</div>
              <div className={`payment-delta ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'zero'}`}>
                {delta > 0 ? '+' : ''}{delta}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
