export type Tile = string;

export type MeldType = 'chow' | 'pong' | 'kong' | 'pair' | 'flower' | 'orphans';

export interface Meld {
  type: MeldType;
  tiles: Tile[];
  concealed: boolean;
  winTile?: Tile;
}

export interface Hand {
  melds: Meld[];
}

export type Player = string;

export interface Win {
  players: [Player, Player, Player, Player];
  winner: Player;
  method: 'self-pick' | 'discard' | 'stolen-kong';
  from?: Player;
  dealer?: Player;
  dealerRounds: number;
  special: WinCondition[];
}

export type WinCondition = 'fromFlowerWall' | 'lastTile' | 'firstTurn' | 'prodigy';

export interface AppliedRule {
  name: string;
  points: number;
}

export interface Payment {
  from: Player;
  to: Player;
  base: number;
  dealerBonus: number;
  total: number;
}

export interface ScoreResult {
  scores: Record<Player, number>;
  handValue: number;
  appliedRules: AppliedRule[];
  payments: Payment[];
}

export type RoundScore = Record<Player, number>;

export function buildWin(opts: {
  method: Win['method'];
  winner: string;
  from?: string;
  otherPlayers?: string[];
  dealer?: string;
  dealerRounds?: number;
  special?: WinCondition[];
}): Win {
  const players = opts.method === 'self-pick'
    ? [opts.winner, ...(opts.otherPlayers ?? [])] as [string, string, string, string]
    : [opts.winner, opts.from!, opts.winner, opts.from!] as [string, string, string, string];
  return {
    players,
    winner: opts.winner,
    method: opts.method,
    from: opts.method !== 'self-pick' ? opts.from : undefined,
    dealer: opts.dealer,
    dealerRounds: opts.dealerRounds ?? 1,
    special: opts.special ?? [],
  };
}
