import { getRuleReference } from '../src/calculate-score.js';
import type { RuleInfo } from '../src/calculate-score.js';

function buildCategories(rules: RuleInfo[]) {
  const byPts = new Map<string, RuleInfo[]>();
  for (const r of rules) {
    const key = r.pts.replace(' ea.', '');
    if (!byPts.has(key)) byPts.set(key, []);
    byPts.get(key)!.push(r);
  }

  const order = ['1', '3', '4', '6', '8', '12', '14', '16', '18', '20'];
  return order
    .filter(k => byPts.has(k))
    .map(k => ({ pts: k, rules: byPts.get(k)! }));
}

const categories = buildCategories(getRuleReference());

interface Props {
  onClose: () => void;
}

export function ScoringReference({ onClose }: Props) {
  return (
    <div className="ref-overlay">
      <div className="ref-sheet">
        <div className="ref-header">
          <span className="ref-title">Scoring Reference</span>
          <button className="proto-btn-sm" onClick={onClose}>Close</button>
        </div>
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
          <div className="ref-footer">
            <div className="ref-footer-name">Mahjong Scorer <span className="ref-footer-badge">beta</span></div>
            <a href="https://github.com/kyleissuper/mahjong" target="_blank" rel="noopener noreferrer">Open source on GitHub</a>
          </div>
        </div>
      </div>
    </div>
  );
}
