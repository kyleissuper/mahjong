import type { Hand, Win, ScoreResult } from './types.js';
import { calculateScore } from './calculate-score.js';
import { validateHand, isHandReady } from './validate-hand.js';

export type ScoreParamResult =
  | { ok: true; result: ScoreResult; hand: Hand; win: Win }
  | { ok: false; error: string };

export function scoreFromParam(d: string): ScoreParamResult {
  let payload: unknown;
  try {
    payload = JSON.parse(decodeBase64Url(d));
  } catch {
    return { ok: false, error: 'Could not decode the ?d parameter. It must be base64-encoded JSON of { hand, win }.' };
  }

  if (!isRecord(payload) || !isHandShape(payload.hand)) {
    return { ok: false, error: 'The decoded payload is missing hand.melds as an array.' };
  }
  if (!isRecord(payload.win)) {
    return { ok: false, error: 'The decoded payload is missing the win object.' };
  }

  const { hand, win } = payload as { hand: Hand; win: Win };

  const meldErrors = validateHand(hand);
  if (meldErrors.length > 0) {
    const details = meldErrors.map(e => `meld #${e.meld + 1}: ${e.message}`).join('; ');
    return { ok: false, error: `Invalid melds: ${details}` };
  }

  if (!isHandReady(hand)) {
    return { ok: false, error: 'This is not a complete winning hand. A standard hand needs 4 sets (chow/pong/kong) plus 1 pair, or a special shape like 13 orphans or 7 pairs.' };
  }

  try {
    return { ok: true, result: calculateScore(hand, win), hand, win };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Scoring failed for an unknown reason.' };
  }
}

export function encodeScoreParam(hand: Hand, win: Win): string {
  return btoa(JSON.stringify({ hand, win }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - padded.length % 4) % 4;
  return atob(padded + '='.repeat(pad));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isHandShape(value: unknown): value is Hand {
  return isRecord(value) && Array.isArray(value.melds);
}
