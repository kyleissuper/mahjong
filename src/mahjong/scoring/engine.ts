import type { Hand, Win, AppliedRule, ScoreResult } from '../types.ts';
import { rules, type Rule } from './rules.ts';
import { resolvePayments } from './payments.ts';

export interface RuleInfo {
  name: string;
  label: string;
  pts: string;
}

export const RULE_LABELS: Record<string, string> = Object.fromEntries(
  rules.map(r => [r.name, r.label])
);

export function scoreHand(hand: Hand, win: Win): ScoreResult {
  const normalized = normalizeHand(hand, win);
  const appliedRules = getAppliedRules(normalized, win);
  const handValue = appliedRules.reduce((sum, r) => sum + r.points, 0);
  const { scores, payments } = resolvePayments(handValue, win);
  return { scores, handValue, appliedRules, payments };
}

export function getRuleReference(): RuleInfo[] {
  return rules.map(({ name, label, pts }) => ({ name, label, pts }));
}

function getAppliedRules(hand: Hand, win: Win): AppliedRule[] {
  const fired = rules
    .map(r => ({ name: r.name, points: r.score(hand, win), absorbs: r.absorbs }))
    .filter(r => r.points > 0);
  return resolveAbsorption(fired);
}

type FiredRule = { name: string; points: number; absorbs?: string[] };

function resolveAbsorption(all: FiredRule[], survivors: FiredRule[] = all): AppliedRule[] {
  const absorbed = new Set(survivors.flatMap(r => r.absorbs ?? []));
  const next = all.filter(r => !absorbed.has(r.name));
  if (next.length === survivors.length) return next.map(({ name, points }) => ({ name, points }));
  return resolveAbsorption(all, next);
}

function normalizeHand(hand: Hand, win: Win): Hand {
  return {
    melds: hand.melds.map(meld => ({
      ...meld,
      tiles: meld.type === 'chow' ? [...meld.tiles].sort() : meld.tiles,
      concealed: win.method !== 'self-pick' && meld.winTile ? false : meld.concealed,
    })),
  };
}
