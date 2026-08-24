// Matches orphaned scan photos to scored hands by tile content + capture time.
// Used by the admin backfill: hands scored by clients that predate scanId
// tracking have no link to the photo that produced them.

export interface HandCandidate {
  id: number;
  timeMs: number;
  tiles: string[];
}

export interface ScanCandidate {
  scanId: string;
  timeMs: number;
  tiles: string[];
}

export interface Match {
  handId: number;
  scanId: string;
  score: number;
  // Another hand matched this scan nearly as well and ended up unlinked —
  // too risky to commit automatically.
  contested: boolean;
}

// Scans are taken shortly before the hand is confirmed: allow a generous
// entry/context gap, and a small forward slop for clock ordering.
const WINDOW_BEFORE_MS = 20 * 60 * 1000;
const WINDOW_AFTER_MS = 60 * 1000;
const MIN_SCORE = 0.6;
const CONTEST_MARGIN = 0.1;

/** Multiset overlap: |intersection| / max(|a|, |b|). 1 = identical tile bags. */
export function tileOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const t of a) counts.set(t, (counts.get(t) ?? 0) + 1);
  let shared = 0;
  for (const t of b) {
    const c = counts.get(t) ?? 0;
    if (c > 0) { shared++; counts.set(t, c - 1); }
  }
  return shared / Math.max(a.length, b.length);
}

function inWindow(hand: HandCandidate, scan: ScanCandidate): boolean {
  const delta = hand.timeMs - scan.timeMs;
  return delta >= -WINDOW_AFTER_MS && delta <= WINDOW_BEFORE_MS;
}

export function matchScansToHands(hands: HandCandidate[], scans: ScanCandidate[]): Match[] {
  interface Pair { hand: HandCandidate; scan: ScanCandidate; score: number }
  const pairs: Pair[] = [];
  for (const hand of hands) {
    for (const scan of scans) {
      if (!inWindow(hand, scan)) continue;
      const score = tileOverlap(hand.tiles, scan.tiles);
      if (score >= MIN_SCORE) pairs.push({ hand, scan, score });
    }
  }

  // Best score first; among near-equal retakes prefer the latest photo.
  pairs.sort((a, b) => b.score - a.score || b.scan.timeMs - a.scan.timeMs);

  const usedHands = new Set<number>();
  const usedScans = new Set<string>();
  const matches: Match[] = [];
  for (const p of pairs) {
    if (usedHands.has(p.hand.id) || usedScans.has(p.scan.scanId)) continue;
    usedHands.add(p.hand.id);
    usedScans.add(p.scan.scanId);
    matches.push({ handId: p.hand.id, scanId: p.scan.scanId, score: p.score, contested: false });
  }

  // A match is contested when a hand that ended up with NO link scored nearly
  // as well against the same scan — the photo could plausibly be theirs.
  for (const m of matches) {
    m.contested = pairs.some(p =>
      p.scan.scanId === m.scanId &&
      p.hand.id !== m.handId &&
      !usedHands.has(p.hand.id) &&
      p.score >= m.score - CONTEST_MARGIN
    );
  }
  return matches;
}

/**
 * Hand timestamps are Pacific-local strings ("8/23/2026, 2:16:48 PM").
 * Recover UTC ms by trying both PST/PDT offsets and keeping the one that
 * round-trips through the same formatter.
 */
export function parsePacificTimestamp(ts: string): number | null {
  const m = ts.match(/^(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+) (AM|PM)$/);
  if (!m) return null;
  const [, mo, d, y, h12, min, s, ap] = m;
  let h = parseInt(h12) % 12;
  if (ap === 'PM') h += 12;
  const local = Date.UTC(+y, +mo - 1, +d, h, +min, +s);
  for (const offsetHours of [7, 8]) {
    const utc = local + offsetHours * 3600_000;
    const roundTrip = new Date(utc).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    if (roundTrip === ts) return utc;
  }
  return null;
}
