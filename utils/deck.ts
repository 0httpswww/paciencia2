import { CardType, GameMode, Rank, Suit, PileType } from '../types';

export const createDeck = (faceUp: boolean = true): CardType[] => {
  const deck: CardType[] = [];
  const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
  const ranks = [
    Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
    Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King
  ];

  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        isFaceUp: faceUp,
      });
    });
  });

  return deck;
};

export const shuffleDeck = (deck: CardType[]): CardType[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const getCardColor = (suit: Suit): 'red' | 'black' => {
  return suit === Suit.Hearts || suit === Suit.Diamonds ? 'red' : 'black';
};

// FIX: Update targetType to PileType to match usage in App.tsx. This implicitly handles 'stock' and 'waste' by returning false at the end.
export const isMoveValid = (
  card: CardType,
  targetCard: CardType | null, // null means empty pile
  targetType: PileType,
  mode: GameMode,
  targetSuit?: Suit
): boolean => {
  if (targetType === 'freeCell') {
    // Can only move to free cell if it's empty (Only in FreeCell mode logic handles this check mostly)
    return targetCard === null && mode === GameMode.FreeCell;
  }

  if (targetType === 'foundation') {
    if (!targetCard) {
      // Empty foundation must start with Ace of correct suit
      return card.rank === Rank.Ace && card.suit === targetSuit;
    }
    // Foundation must be same suit, ascending rank
    return card.suit === targetCard.suit && card.rank === targetCard.rank + 1;
  }

  if (targetType === 'tableau') {
    if (!targetCard) {
      // Empty Tableau Rule:
      // FreeCell: Any card
      // Klondike: Only King
      if (mode === GameMode.Klondike) {
        return card.rank === Rank.King;
      }
      return true;
    }
    // Tableau must be alternating color, descending rank
    const cardColor = getCardColor(card.suit);
    const targetColor = getCardColor(targetCard.suit);
    return cardColor !== targetColor && card.rank === targetCard.rank - 1;
  }

  return false;
};

// Check if a stack of cards is a valid sequence
export const isStackValid = (cards: CardType[]): boolean => {
  if (cards.length <= 1) return true;
  for (let i = 0; i < cards.length - 1; i++) {
    const current = cards[i];
    const next = cards[i + 1];
    
    // All cards in stack must be face up
    if (!current.isFaceUp || !next.isFaceUp) return false;

    if (getCardColor(current.suit) === getCardColor(next.suit) || current.rank !== next.rank + 1) {
      return false;
    }
  }
  return true;
};

// Calculate max movable stack size based on FreeCell rules
// (1 + emptyFreeCells) * 2^(emptyTableauColumns)
export const getMaxMovableStack = (emptyFreeCells: number, emptyTableauCols: number): number => {
  return (1 + emptyFreeCells) * Math.pow(2, emptyTableauCols);
};