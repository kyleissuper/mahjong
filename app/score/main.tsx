import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { scoreFromParam } from '../../src/decode-score-param.js';
import { ScorePage } from './ScorePage.tsx';
import '../styles.css';
import './score.css';

const d = new URLSearchParams(window.location.search).get('d');

if (d) {
  const instructions = document.getElementById('instructions');
  if (instructions) instructions.remove();

  createRoot(document.getElementById('result')!).render(
    <StrictMode>
      <ScorePage decoded={scoreFromParam(d)} />
    </StrictMode>,
  );
}
