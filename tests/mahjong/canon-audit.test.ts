// Canon-migration audit harness: runs the hands documented in
// docs/mahjong_scoring_examples.md through the engine and reports engine
// total vs the doc's stated total. Diagnostic only (no assertions) — the
// golden corpus that replaces it is being built decision-by-decision.
// Set AUDIT_OUT=/path to write the comparison report.
import { describe, it } from 'vitest';
import { scoreHand } from '../../src/mahjong/scoring/engine.ts';
import { buildWin } from '../../src/mahjong/types.ts';
import type { Meld, WinCondition } from '../../src/mahjong/types.ts';

interface Ex {
  n: string;
  doc: number;
  melds: Meld[];
  method?: 'self-pick' | 'discard' | 'stolen-kong';
  winner?: string; from?: string; dealer?: string; rounds?: number;
  special?: WinCondition[];
}

const m = (type: Meld['type'], tiles: string[], concealed = true, winTile?: string): Meld =>
  ({ type, tiles, concealed, ...(winTile ? { winTile } : {}) });

const EX: Ex[] = [
  { n: 'H1 basic discard', doc: 3, method: 'discard', melds: [
    m('chow', ['1b','2b','3b']), m('chow', ['4b','5b','6b']),
    m('chow', ['7d','8d','9d'], true, '8d'), m('pong', ['Rd','Rd','Rd']), m('pair', ['5b','5b'])] },
  { n: 'H2 all chows self-pick', doc: 8, method: 'self-pick', melds: [
    m('chow', ['2b','3b','4b']), m('chow', ['5b','6b','7b']),
    m('chow', ['2d','3d','4d']), m('chow', ['5d','6d','7d']), m('pair', ['8b','8b'], true, '8b')] },
  { n: 'H3 pong-heavy', doc: 3, method: 'discard', melds: [
    m('pong', ['Ew','Ew','Ew'], false), m('pong', ['3b','3b','3b'], false),
    m('pong', ['7d','7d','7d'], false), m('chow', ['4c','5c','6c'], true, '6c'), m('pair', ['2b','2b'])] },
  { n: 'H4 all greens', doc: 20, method: 'self-pick', winner: 'A', dealer: 'A', melds: [
    m('pong', ['1b','1b','1b']), m('pong', ['5b','5b','5b']), m('pong', ['9b','9b','9b']),
    m('pong', ['Gd','Gd','Gd']), m('pair', ['3b','3b'], true, '3b')] },
  { n: 'H5 doorstep chain', doc: 5, method: 'discard', melds: [
    m('chow', ['1d','2d','3d']), m('chow', ['4d','5d','6d']),
    m('chow', ['7d','8d','9d'], true, '7d'), m('pong', ['4b','4b','4b']), m('pair', ['Wd','Wd'])] },
  { n: 'H6 concealed self-pick 3 hidden pongs', doc: 12, method: 'self-pick', melds: [
    m('pong', ['2d','2d','2d']), m('pong', ['6d','6d','6d']), m('pong', ['9b','9b','9b']),
    m('chow', ['4c','5c','6c']), m('pair', ['5c','5c'], true, '5c')] },
  { n: 'H7 stolen kong', doc: 5, method: 'stolen-kong', melds: [
    m('chow', ['2c','3c','4c'], false), m('chow', ['6c','7c','8c'], false),
    m('pong', ['Nw','Nw','Nw'], false), m('chow', ['1d','2d','3d'], false), m('pair', ['8d','8d'], true, '8d')] },
  { n: 'H8 flower wind pong', doc: 3, method: 'discard', melds: [
    m('chow', ['1d','2d','3d'], false), m('chow', ['5b','6b','7b'], false),
    m('pong', ['Ew','Ew','Ew'], false), m('chow', ['3d','4d','5d'], false, '3d'),
    m('pair', ['2c','2c']), m('flower', ['F'], false)] },
  { n: 'H9 from butt hidden kong', doc: 7, method: 'self-pick', special: ['fromButt'], melds: [
    m('pong', ['3d','3d','3d'], false), m('kong', ['8c','8c','8c','8c'], true),
    m('chow', ['4b','5b','6b'], true, '6b'), m('chow', ['1b','2b','3b'], false),
    m('pair', ['5d','5d']), m('flower', ['F','F'], false)] },
  { n: 'H10 pure four hidden pongs', doc: 27, method: 'self-pick', melds: [
    m('pong', ['1d','1d','1d']), m('pong', ['3d','3d','3d']), m('pong', ['6d','6d','6d']),
    m('pong', ['9d','9d','9d']), m('pair', ['4d','4d'], true, '4d')] },
  { n: 'H11 chain split kong', doc: 7, method: 'discard', melds: [
    m('chow', ['1b','2b','3b']), m('chow', ['4b','5b','6b']),
    m('chow', ['7b','8b','9b'], true, '9b'), m('pong', ['5b','5b','5b']), m('pair', ['8d','8d'])] },
  { n: 'H12 three consecutive pongs', doc: 10, method: 'discard', melds: [
    m('pong', ['3b','3b','3b'], false), m('pong', ['4b','4b','4b'], false),
    m('pong', ['5b','5b','5b'], false), m('chow', ['6d','7d','8d'], false), m('pair', ['2d','2d'], true, '2d')] },
  { n: 'H13 terminals & honors', doc: 10, method: 'discard', melds: [
    m('pong', ['1d','1d','1d'], false), m('pong', ['9d','9d','9d'], false),
    m('pong', ['9b','9b','9b'], false, '9b'), m('pong', ['Ew','Ew','Ew'], false), m('pair', ['Wd','Wd'])] },
  { n: 'H14 little dragons', doc: 8, method: 'discard', melds: [
    m('pong', ['Rd','Rd','Rd'], false), m('pong', ['Gd','Gd','Gd'], false),
    m('chow', ['4b','5b','6b'], false, '6b'), m('chow', ['2d','3d','4d'], false), m('pair', ['Wd','Wd'])] },
  { n: 'H15 three suit chow', doc: 11, method: 'discard', melds: [
    m('chow', ['3b','4b','5b']), m('chow', ['3b','4b','5b']),
    m('chow', ['3d','4d','5d']), m('chow', ['3c','4c','5c'], true, '5c'), m('pair', ['8d','8d'])] },
  { n: 'H16 all 1s9s three suit pongs', doc: 26, method: 'self-pick', melds: [
    m('pong', ['9b','9b','9b'], false), m('pong', ['9d','9d','9d'], false),
    m('pong', ['9c','9c','9c'], false), m('pong', ['1d','1d','1d'], false), m('pair', ['1c','1c'], true, '1c')] },
  { n: 'H17 four consec pongs semi-pure', doc: 14, method: 'discard', melds: [
    m('pong', ['4d','4d','4d'], false), m('pong', ['5d','5d','5d'], false),
    m('pong', ['6d','6d','6d'], false), m('pong', ['7d','7d','7d'], false), m('pair', ['Ww','Ww'], true, 'Ww')] },
  { n: 'H18 big dragons semi-pure', doc: 16, method: 'discard', melds: [
    m('pong', ['Rd','Rd','Rd'], false), m('pong', ['Gd','Gd','Gd'], false),
    m('pong', ['Wd','Wd','Wd'], false), m('chow', ['1b','2b','3b'], false, '3b'), m('pair', ['6b','6b'])] },
  { n: 'H19 little winds', doc: 14, method: 'self-pick', melds: [
    m('pong', ['Ew','Ew','Ew'], false), m('pong', ['Sw','Sw','Sw'], false),
    m('pong', ['Ww','Ww','Ww'], false), m('chow', ['3b','4b','5b'], true, '4b'), m('pair', ['Nw','Nw'])] },
  { n: 'H20 all honors', doc: 13, method: 'discard', melds: [
    m('pong', ['Ew','Ew','Ew'], false), m('pong', ['Nw','Nw','Nw'], false),
    m('pong', ['Rd','Rd','Rd'], false), m('pong', ['Wd','Wd','Wd'], false), m('pair', ['Sw','Sw'], true, 'Sw')] },
  { n: 'H21 all pairs', doc: 13, method: 'self-pick', melds: [
    m('pair', ['2b','2b']), m('pair', ['5b','5b']), m('pair', ['9b','9b']),
    m('pair', ['3d','3d']), m('pair', ['7d','7d'], true, '7d'), m('pair', ['Ew','Ew']), m('pair', ['Rd','Rd'])] },
  { n: 'H22 thirteen orphans', doc: 16, method: 'self-pick', winner: 'A', dealer: 'A', melds: [
    m('orphans', ['1b','9b','1d','9d','1c','9c','Ew','Sw','Ww','Nw','Rd','Gd','Wd','1b'], true, '9c')] },
  { n: 'H23 two double chows', doc: 16, method: 'discard', melds: [
    m('chow', ['2b','3b','4b']), m('chow', ['2b','3b','4b']),
    m('chow', ['7d','8d','9d']), m('chow', ['7d','8d','9d'], true, '8d'), m('pair', ['5c','5c'])] },
  { n: 'H24 two kong mahjong', doc: 7, method: 'discard', melds: [
    m('kong', ['3b','3b','3b','3b'], false), m('kong', ['7c','7c','7c','7c'], false),
    m('chow', ['4d','5d','6d'], false, '6d'), m('pong', ['2d','2d','2d'], false), m('pair', ['8b','8b'])] },
  { n: 'H25 heavenly gates', doc: 17, method: 'self-pick', melds: [
    m('orphans', ['1d','1d','1d','2d','3d','4d','5d','5d','6d','7d','8d','9d','9d','9d'], true, '5d')] },
  { n: 'H26 heavenly hand', doc: 21, method: 'self-pick', winner: 'A', dealer: 'A', special: ['firstTurn'], melds: [
    m('pong', ['3b','3b','3b']), m('pong', ['7d','7d','7d']),
    m('chow', ['4c','5c','6c']), m('chow', ['1d','2d','3d']), m('pair', ['8b','8b'], true, '8b')] },
  { n: 'H27 earthly hand', doc: 18, method: 'discard', special: ['firstTurn'], melds: [
    m('chow', ['1b','2b','3b'], true, '2b'), m('pong', ['6d','6d','6d']),
    m('chow', ['4c','5c','6c']), m('pong', ['9b','9b','9b']), m('pair', ['5d','5d'])] },
  { n: 'H28 big winds', doc: 19, method: 'discard', melds: [
    m('pong', ['Ew','Ew','Ew'], false), m('pong', ['Sw','Sw','Sw'], false),
    m('pong', ['Ww','Ww','Ww'], false), m('pong', ['Nw','Nw','Nw'], false), m('pair', ['3b','3b'], true, '3b')] },
  { n: 'H29 all kongs', doc: 20, method: 'self-pick', special: ['fromButt'], melds: [
    m('kong', ['4b','4b','4b','4b'], false), m('kong', ['7b','7b','7b','7b'], false),
    m('kong', ['3d','3d','3d','3d'], true), m('kong', ['9c','9c','9c','9c'], false), m('pair', ['2d','2d'], true, '2d')] },
  { n: 'H30 prodigy', doc: 15, method: 'discard', special: ['prodigy'], melds: [
    m('chow', ['4b','5b','6b'], true, '5b'), m('pong', ['8d','8d','8d']),
    m('chow', ['1c','2c','3c']), m('chow', ['7c','8c','9c']), m('pair', ['2d','2d'])] },
  { n: 'H31 three suits wind dragon', doc: 2, method: 'discard', melds: [
    m('pong', ['1b','1b','1b'], false), m('pong', ['9d','9d','9d'], false, '9d'),
    m('chow', ['4c','5c','6c'], false), m('pong', ['Sw','Sw','Sw'], false), m('pair', ['Rd','Rd'])] },
  { n: 'H32 last wall tile', doc: 4, method: 'self-pick', special: ['lastTile'], melds: [
    m('chow', ['4d','5d','6d'], true, '6d'), m('chow', ['1b','2b','3b'], false),
    m('pong', ['Ww','Ww','Ww'], false), m('chow', ['7c','8c','9c'], false), m('pair', ['5b','5b'])] },
  { n: 'H33 last discard', doc: 3, method: 'discard', special: ['lastTile'], melds: [
    m('chow', ['1b','2b','3b'], true, '2b'), m('pong', ['6d','6d','6d'], false),
    m('chow', ['4c','5c','6c'], false), m('pong', ['8b','8b','8b'], false), m('pair', ['2d','2d'])] },
  { n: 'H34 little and big pong', doc: 2, method: 'discard', melds: [
    m('pong', ['1d','1d','1d'], false), m('pong', ['9d','9d','9d'], false),
    m('chow', ['5c','6c','7c'], false, '7c'), m('chow', ['2b','3b','4b'], false), m('pair', ['8b','8b'])] },
];

describe('canon audit', () => {
  it('engine vs documented totals', () => {
    const lines: string[] = [];
    for (const ex of EX) {
      const win = buildWin({
        method: ex.method ?? 'discard',
        winner: ex.winner ?? 'W',
        from: ex.method === 'self-pick' ? undefined : (ex.from ?? 'L'),
        otherPlayers: ex.method === 'self-pick' ? ['X', 'Y', 'Z'] : undefined,
        dealer: ex.dealer,
        dealerRounds: ex.rounds ?? 1,
        special: ex.special ?? [],
      });
      try {
        const r = scoreHand({ melds: ex.melds }, win);
        const mark = r.handValue === ex.doc ? 'OK  ' : 'DIFF';
        const rules = r.appliedRules.map(a => `${a.name}:${a.points}`).join(' ');
        lines.push(`${mark} ${ex.n}: engine=${r.handValue} doc=${ex.doc}  [${rules}]`);
      } catch (e) {
        lines.push(`ERR  ${ex.n}: ${(e as Error).message}`);
      }
    }
    if (process.env.AUDIT_OUT) {
      require('fs').writeFileSync(process.env.AUDIT_OUT, lines.join('\n'));
    }
  });
});
