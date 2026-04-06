const CATEGORIES: { title: string; rules: { label: string; pts: string }[] }[] = [
  {
    title: 'Small points',
    rules: [
      { label: 'Flower', pts: '1 ea.' },
      { label: 'Dragon pong', pts: '1 ea.' },
      { label: 'Wind pong', pts: '1 ea.' },
      { label: '2/5/8 pair', pts: '1' },
      { label: 'Only one you can win with', pts: '1' },
      { label: 'Hidden kong', pts: '2 ea.' },
    ],
  },
  {
    title: 'Win method',
    rules: [
      { label: 'Self-pick', pts: '1' },
      { label: 'All from others (no concealed sets)', pts: '1' },
      { label: 'Clean doorstep (all concealed)', pts: '1' },
      { label: 'Stolen kong (rob a kong)', pts: '1' },
      { label: 'Split kong (kong supplement draw)', pts: '1' },
      { label: 'Win from butt (replacement draw)', pts: '1' },
      { label: 'Last wall tile', pts: '1' },
      { label: 'Last discard', pts: '1' },
      { label: 'All concealed self-pick', pts: '3' },
    ],
  },
  {
    title: 'Hand shape',
    rules: [
      { label: 'All chows', pts: '1' },
      { label: 'All pongs', pts: '4' },
      { label: 'All pairs (7 pairs)', pts: '12' },
      { label: 'All kongs (all 4 sets)', pts: '14' },
    ],
  },
  {
    title: 'Suit patterns',
    rules: [
      { label: 'Only 2 suits', pts: '1' },
      { label: 'No 1s/9s (has honors)', pts: '1' },
      { label: '3 suits + wind + dragon', pts: '1' },
      { label: 'No flowers/honors', pts: '3' },
      { label: 'No 1s/9s, no honors', pts: '3' },
      { label: 'All sets have 1/9 (has honors)', pts: '4' },
      { label: 'Semi-pure (1 suit + honors)', pts: '4' },
      { label: 'All sets have 1/9 (no honors)', pts: '4' },
      { label: 'Pure (1 suit, no honors)', pts: '8' },
      { label: 'All 1s/9s (has honors)', pts: '8' },
      { label: 'All honors', pts: '12' },
      { label: 'All 1s/9s', pts: '16' },
    ],
  },
  {
    title: 'Set combos',
    rules: [
      { label: 'Double chow (2 identical)', pts: '1 ea.' },
      { label: '3 suit chow (same rank, 3 suits)', pts: '4' },
      { label: '3 consec. pongs (same suit)', pts: '4' },
      { label: '3 hidden pongs', pts: '4' },
      { label: '3 suit pongs (same value, 3 suits)', pts: '4' },
      { label: '1-9 chain (chows covering 1-9, same suit)', pts: '3' },
      { label: '2 kong mahjong', pts: '6' },
      { label: 'Little dragons (2 pongs + pair)', pts: '8' },
      { label: '4 consec. pongs (same suit)', pts: '8' },
      { label: '2 double chows', pts: '12' },
      { label: 'Little winds (3 pongs + pair)', pts: '12' },
      { label: 'Big dragons (3 pongs)', pts: '12' },
      { label: '4 hidden pongs', pts: '12' },
      { label: 'Prodigy (ready in first 4 draws)', pts: '12' },
      { label: 'Big winds (4 pongs)', pts: '18' },
    ],
  },
  {
    title: 'Dragon hands',
    rules: [
      { label: 'Jade Dragon (all bamboo + green dragon)', pts: '14' },
      { label: 'Ruby Dragon (all characters + red dragon)', pts: '14' },
      { label: 'Pearl Dragon (all dots + white dragon)', pts: '14' },
    ],
  },
  {
    title: 'Limit hands',
    rules: [
      { label: '13 orphans (one of each terminal + honor)', pts: '14' },
      { label: 'Earthly hand (win on dealer\'s first discard)', pts: '16' },
      { label: 'Heavenly gates (1112345678999 + any, same suit)', pts: '16' },
      { label: 'Heavenly hand (dealer wins on deal)', pts: '20' },
    ],
  },
];

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
          {CATEGORIES.map(({ title, rules }) => (
            <div key={title} className="ref-category">
              <div className="ref-category-title">{title}</div>
              {rules.map(({ label, pts }) => (
                <div key={label} className="ref-rule">
                  <span className="ref-rule-name">{label}</span>
                  <span className="ref-rule-pts">{pts}</span>
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
