import { getRuleReference, type RuleInfo } from '../../mahjong/scoring/engine.ts';

const categories = buildCategories(getRuleReference());

export function ScoringReference() {
  return (
    <div className="ref-body">
      {categories.map(({ pts, rules }) => (
        <div key={pts} className="ref-category">
          <div className="ref-category-title">{pts} {pts === '1' ? 'point' : 'points'}</div>
          {rules.map(({ name, label, pts: rulePts }) => (
            <div key={name} className="ref-rule">
              <span className="ref-rule-name">{label}</span>
              <span className="ref-rule-pts">{rulePts}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="ref-category">
        <div className="ref-category-title">Payments</div>
        <div className="ref-payments">
          Loser pays winner the hand value. Dealer involvement adds +1 (+2 per extra round). Self-pick: all non-winners pay.
        </div>
      </div>
    </div>
  );
}

function buildCategories(rules: RuleInfo[]) {
  const byPts = new Map<string, RuleInfo[]>();
  for (const r of rules) {
    const key = r.pts.replace(' ea.', '');
    if (!byPts.has(key)) byPts.set(key, []);
    byPts.get(key)!.push(r);
  }

  return [...byPts.keys()]
    .sort((a, b) => Number(a) - Number(b))
    .map(k => ({ pts: k, rules: byPts.get(k)! }));
}
