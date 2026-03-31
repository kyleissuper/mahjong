// Tile shorthand strings:
//   Number tiles: 1b-9b (bamboo), 1d-9d (dots), 1c-9c (characters)
//   Winds: Ew, Sw, Ww, Nw
//   Dragons: Rd, Gd, Wd
//   Flower: F
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
  dealer: Player;
  dealerRounds: number;
  special: WinCondition[];
}

export type WinCondition = 'fromButt' | 'lastTile' | 'firstTurn' | 'prodigy';

export interface AppliedRule {
  name: string;
  points: number;
}

export interface ScoreResult {
  scores: Record<Player, number>;
  handValue: number;
  appliedRules: AppliedRule[];
}

export type RoundScore = Record<Player, number>;
