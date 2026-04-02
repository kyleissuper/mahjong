import type { ScoreResult } from '../src/types.js';

const RULE_LABELS: Record<string, string> = {
  flower: 'Flower', dragonPong: 'Dragon pong', windPong: 'Wind pong',
  pairOf258: '2/5/8 pair', canOnlyWinWithOne: 'Only one you can win with',
  allChows: 'All chows', allPongs: 'All pongs', selfPick: 'Self-pick',
  only2Suits: 'Only 2 suits', noTerminalsWithHonors: 'No 1s/9s (w/ honors)',
  threeSuitsWithWindAndDragon: '3 suits + wind + dragon',
  splitKong: 'Split kong', lastWallTile: 'Last wall tile',
  lastDiscard: 'Last discard', winFromButt: 'Win from butt',
  hiddenKong: 'Hidden kong', stolenKong: 'Stolen kong',
  allFromOthers: 'All from others', cleanDoorstep: 'Clean doorstep',
  cleanDoorstepAndSelfPick: 'Concealed self-pick',
  threeHiddenPongs: '3 hidden pongs', doubleChow: 'Double chow',
  threeSuitChow: '3 suit chow', threeConsecutivePongs: '3 consec. pongs',
  noFlowersNoHonors: 'No flowers/honors', oneToNineChain: '1-9 chain',
  twoKongMahjong: '2 kong mahjong', twoDoubleChows: '2 double chows',
  littleDragons: 'Little dragons', littleWinds: 'Little winds',
  bigDragons: 'Big dragons', bigWinds: 'Big winds', semiPure: 'Semi-pure',
  fourConsecutivePongs: '4 consec. pongs', allSetsHave19WithHonors: 'All sets have 1/9 (w/ honors)',
  allSetsHave19: 'All sets have 1/9', all19WithHonors: 'All 1s/9s (w/ honors)',
  pure: 'Pure', fourHiddenPongs: '4 hidden pongs',
  noTerminalsNoHonors: 'No 1s/9s, no honors', allKongs: 'All kongs',
  all19: 'All 1s/9s', threeSuitPongs: '3 suit pongs',
  allPairs: 'All pairs', allHonors: 'All honors',
  prodigyHand: 'Prodigy', heavenlyHand: 'Heavenly hand',
  earthlyHand: 'Earthly hand', heavenlyGates: 'Heavenly gates',
  thirteenOrphans: '13 orphans', jadeDragon: 'Jade Dragon',
};

interface Props {
  result: ScoreResult;
  onReset: () => void;
}

export function ScoreBreakdown({ result, onReset }: Props) {
  const { handValue, appliedRules, scores } = result;

  return (
    <section className="score-section">
      <div className="score-header">
        <div className="score-value">{handValue}</div>
        <div className="score-label">points</div>
      </div>

      <div className="score-body">
        <div className="rules-list">
          {appliedRules.map(({ name, points }) => (
            <div key={name} className="rule-item">
              <span className="rule-name">{RULE_LABELS[name] ?? name}</span>
              <span className="rule-points">+{points}</span>
            </div>
          ))}
        </div>

        <div className="payments-row">
          {Object.entries(scores).map(([player, delta]) => (
            <div key={player} className="payment-item">
              <div className="payment-player">{player}</div>
              <div className={`payment-delta ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'zero'}`}>
                {delta > 0 ? '+' : ''}{delta}
              </div>
            </div>
          ))}
        </div>

        <button className="reset-btn" onClick={onReset}>Score next hand</button>
      </div>
    </section>
  );
}
