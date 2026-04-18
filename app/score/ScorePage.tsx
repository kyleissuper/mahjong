import type { Hand, Meld, Win } from '../../src/types.js';
import type { ScoreParamResult } from '../../src/decode-score-param.js';
import { ScoreBreakdown } from '../ScoreBreakdown.tsx';
import { TileImage } from '../TileImage.tsx';

const METHOD_LABELS: Record<Win['method'], string> = {
  'self-pick': 'self-pick',
  discard: 'won on discard',
  'stolen-kong': 'won on stolen kong',
};

const MELD_LABELS: Record<Meld['type'], string> = {
  chow: 'Chow', pong: 'Pong', kong: 'Kong', pair: 'Pair',
  flower: 'Flower', orphans: '13 Orphans',
};

interface Props {
  decoded: ScoreParamResult;
}

export function ScorePage({ decoded }: Props) {
  if (!decoded.ok) return <ErrorView message={decoded.error} />;

  const { result, hand, win } = decoded;

  return (
    <div className="score-page">
      <WinSummary win={win} />
      <ScoreBreakdown result={result} onReset={() => { window.location.href = '/'; }} />
      <HandView hand={hand} />
    </div>
  );
}

function WinSummary({ win }: { win: Win }) {
  return (
    <header className="win-summary">
      <div className="win-summary-winner"><strong>{win.winner}</strong> {METHOD_LABELS[win.method]}{win.from ? ` from ${win.from}` : ''}</div>
      <div className="win-summary-context">Dealer: {win.dealer} · round {win.dealerRounds}</div>
    </header>
  );
}

function HandView({ hand }: { hand: Hand }) {
  return (
    <section className="hand-view">
      <h2>Hand</h2>
      <div className="hand-view-melds">
        {hand.melds.map((meld, i) => <MeldCard key={i} meld={meld} />)}
      </div>
    </section>
  );
}

function MeldCard({ meld }: { meld: Meld }) {
  const displayTiles = meld.type === 'orphans' ? [...new Set(meld.tiles)] : meld.tiles;
  const tags = [meld.concealed ? 'concealed' : 'exposed', meld.winTile && `win tile: ${meld.winTile}`].filter(Boolean);

  return (
    <div className="meld-card">
      <div className="meld-card-type">{MELD_LABELS[meld.type]}</div>
      <div className="meld-card-tiles">
        {displayTiles.map((t, i) => <TileImage key={i} tile={t} size={26} />)}
      </div>
      <div className="meld-card-tags">{tags.join(' · ')}</div>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="score-error">
      <h1>Couldn't score this hand</h1>
      <p>{message}</p>
      <p className="score-error-hint">Go back to the chatbot, fix the input, and try the updated link.</p>
    </div>
  );
}
