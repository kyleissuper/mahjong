export interface RegisteredPlayer {
  id: string;
  name: string;
  createdAt: string;
}

export interface PlayerRegistry {
  players: RegisteredPlayer[];
}

export function createRegistry(): PlayerRegistry {
  return { players: [] };
}

export function registerPlayer(registry: PlayerRegistry, name: string): PlayerRegistry {
  if (registry.players.some(p => p.name === name)) {
    throw new Error(`Name already taken: ${name}`);
  }
  const player: RegisteredPlayer = {
    id: generateId(),
    name,
    createdAt: pacificTimestamp(),
  };
  return { players: [...registry.players, player] };
}

export function renamePlayer(registry: PlayerRegistry, id: string, newName: string): PlayerRegistry {
  if (registry.players.some(p => p.name === newName && p.id !== id)) {
    throw new Error(`Name already taken: ${newName}`);
  }
  return {
    players: registry.players.map(p => p.id === id ? { ...p, name: newName } : p),
  };
}

export function findPlayerByName(registry: PlayerRegistry, name: string): RegisteredPlayer | undefined {
  return registry.players.find(p => p.name === name);
}

export function findPlayerById(registry: PlayerRegistry, id: string): RegisteredPlayer | undefined {
  return registry.players.find(p => p.id === id);
}

// --- Helpers ---

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function pacificTimestamp(): string {
  return new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
}
