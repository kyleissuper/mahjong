import { describe, it, expect } from 'vitest';
import {
  createRegistry, registerPlayer, renamePlayer,
  findPlayerByName, findPlayerById,
} from '../../src/mahjong/player-registry.ts';

describe('registerPlayer', () => {
  it('adds a player with a unique id', () => {
    const reg = registerPlayer(createRegistry(), 'Kyle');
    expect(reg.players).toHaveLength(1);
    expect(reg.players[0].name).toBe('Kyle');
    expect(reg.players[0].id).toBeDefined();
  });

  it('generates unique ids', () => {
    let reg = createRegistry();
    reg = registerPlayer(reg, 'Kyle');
    reg = registerPlayer(reg, 'Ming');
    expect(reg.players[0].id).not.toBe(reg.players[1].id);
  });

  it('rejects duplicate names', () => {
    let reg = registerPlayer(createRegistry(), 'Kyle');
    expect(() => registerPlayer(reg, 'Kyle')).toThrow(/already taken/i);
  });
});

describe('renamePlayer', () => {
  it('changes a player name', () => {
    let reg = registerPlayer(createRegistry(), 'Kyle');
    const id = reg.players[0].id;
    reg = renamePlayer(reg, id, 'Kyle T');
    expect(findPlayerById(reg, id)!.name).toBe('Kyle T');
  });

  it('rejects renaming to an existing name', () => {
    let reg = createRegistry();
    reg = registerPlayer(reg, 'Kyle');
    reg = registerPlayer(reg, 'Ming');
    expect(() => renamePlayer(reg, reg.players[0].id, 'Ming')).toThrow(/already taken/i);
  });
});

describe('findPlayerByName', () => {
  it('finds by name', () => {
    let reg = registerPlayer(createRegistry(), 'Kyle');
    expect(findPlayerByName(reg, 'Kyle')!.name).toBe('Kyle');
  });

  it('returns undefined for unknown', () => {
    expect(findPlayerByName(createRegistry(), 'Nobody')).toBeUndefined();
  });
});

describe('findPlayerById', () => {
  it('finds by id', () => {
    let reg = registerPlayer(createRegistry(), 'Kyle');
    const id = reg.players[0].id;
    expect(findPlayerById(reg, id)!.name).toBe('Kyle');
  });
});
