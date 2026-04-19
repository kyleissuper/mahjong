import { describe, it, expect } from 'vitest';
import { normalizePlayers } from '../normalize-players.js';
import type { Win } from '../../src/types.js';

const baseWin: Win = {
  players: ['Kyle', 'Mei', 'Jun', 'Ana'],
  winner: 'Kyle',
  dealer: 'Kyle',
  method: 'self-pick',
  dealerRounds: 2,
  special: [],
};

describe('normalizePlayers', () => {
  it('maps real player names to A/B/C/D positionally and remaps winner/dealer/from', () => {
    const normalized = normalizePlayers({ ...baseWin, method: 'discard', from: 'Mei' });

    expect(normalized.players).toEqual(['A', 'B', 'C', 'D']);
    expect(normalized.winner).toBe('A'); // Kyle
    expect(normalized.dealer).toBe('A'); // Kyle
    expect(normalized.from).toBe('B');   // Mei
  });

  it('is a no-op when players are already A/B/C/D', () => {
    const identityWin: Win = { ...baseWin, players: ['A', 'B', 'C', 'D'], winner: 'A', dealer: 'B' };
    const normalized = normalizePlayers(identityWin);
    expect(normalized.players).toEqual(['A', 'B', 'C', 'D']);
    expect(normalized.winner).toBe('A');
    expect(normalized.dealer).toBe('B');
  });

  it('leaves from undefined when not provided (self-pick)', () => {
    const normalized = normalizePlayers(baseWin);
    expect(normalized.from).toBeUndefined();
  });

  it('preserves method, dealerRounds, and special', () => {
    const normalized = normalizePlayers({ ...baseWin, special: ['lastTile'], dealerRounds: 3 });
    expect(normalized.method).toBe('self-pick');
    expect(normalized.dealerRounds).toBe(3);
    expect(normalized.special).toEqual(['lastTile']);
  });
});
