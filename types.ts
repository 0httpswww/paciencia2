
export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

export enum Rank {
  Ace = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
}

export enum CardColor {
  Red = 'red',
  Black = 'black',
}

export interface CardType {
  id: string;
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
}

export enum GameMode {
  FreeCell = 'freeCell',
  Klondike = 'klondike',
}

export interface GameState {
  mode: GameMode;
  freeCells: (CardType | null)[]; // Array of 4 slots (FreeCell only)
  stock: CardType[]; // Draw pile (Klondike only)
  waste: CardType[]; // Discard pile (Klondike only)
  foundation: {
    [Suit.Hearts]: CardType[];
    [Suit.Diamonds]: CardType[];
    [Suit.Clubs]: CardType[];
    [Suit.Spades]: CardType[];
  };
  tableau: CardType[][]; // 8 Columns (FC) or 7 Columns (Klondike)
  score: number;
  moves: number;
  time: number;
  gameWon: boolean;
}

export type PileType = 'freeCell' | 'foundation' | 'tableau' | 'stock' | 'waste';

export interface SelectedCard {
  card: CardType;
  pileType: PileType;
  pileIndex?: number; // For tableau columns or free cell index
  cardIndex?: number; // Index within the pile
}

// --- Daily Tasks Types ---
export type TaskType = 'win_game' | 'play_moves' | 'play_time' | 'foundation_drops';

export interface DailyTask {
  id: string;
  type: TaskType;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
}
