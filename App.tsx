import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SolitaireCard } from './components/SolitaireCard';
import { AdBanner } from './components/AdBanner';
import { Confetti } from './components/Confetti';
import { WinningBounce } from './components/WinningBounce';
import { DailyTasksModal } from './components/DailyTasksModal';
import { createDeck, shuffleDeck, isMoveValid, isStackValid, getMaxMovableStack } from './utils/deck';
import { getStoredXP, addXP, getLevelInfo } from './utils/progression';
import { getDailyTasks, saveDailyTasks, checkTaskCompletion } from './utils/dailyTasks';
import { CardType, GameState, PileType, Rank, SelectedCard, Suit, GameMode, DailyTask, TaskType } from './types';
import { Heart, Diamond, Club, Spade, Trophy, Clock, RotateCcw, X, LayoutGrid, RefreshCw, Eye, Play, Pause, Volume2, VolumeX, Maximize, Star, Crown, Undo2, Lightbulb, Wand2, CalendarCheck, Download } from 'lucide-react';

// --- Constants ---
const INITIAL_GAME_STATE: GameState = {
  mode: GameMode.FreeCell,
  freeCells: [null, null, null, null],
  stock: [],
  waste: [],
  foundation: {
    [Suit.Hearts]: [],
    [Suit.Diamonds]: [],
    [Suit.Clubs]: [],
    [Suit.Spades]: [],
  },
  tableau: [],
  score: 0,
  moves: 0,
  time: 0,
  gameWon: false,
};

const INTERSTITIAL_DURATION = 5;
const ADSENSE_SLOT_ID = "1109009056";
const BOUNCE_ANIMATION_DURATION = 6000; // 6 seconds for cascade

// Helper for View Transitions
const startTransition = (callback: () => void) => {
    if ('startViewTransition' in document) {
        // @ts-ignore
        document.startViewTransition(callback);
    } else {
        callback();
    }
};

function App() {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.FreeCell);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [history, setHistory] = useState<GameState[]>([]); // Undo History
  const [selected, setSelected] = useState<SelectedCard | null>(null);
  const [hint, setHint] = useState<{ sourceId: string, targetId?: string } | null>(null); // Hint State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoCollecting, setIsAutoCollecting] = useState(false);
  
  // Progression & Tasks State
  const [playerXP, setPlayerXP] = useState(0);
  const [levelInfo, setLevelInfo] = useState(getLevelInfo(0));
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [hasPendingRewards, setHasPendingRewards] = useState(false);

  // Ad & Animation State
  const [showWinningBounce, setShowWinningBounce] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialTimer, setInterstitialTimer] = useState(0);
  
  // Fake Player State
  const [isAdPaused, setIsAdPaused] = useState(false);
  const [isAdMuted, setIsAdMuted] = useState(false);

  // Simulated Stats
  const [onlineCount, setOnlineCount] = useState(150);
  const [visitCount, setVisitCount] = useState(843210);
  
  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Track if it's the first time the app is loading to show ad on mobile start
  const isFirstLoad = useRef(true);

  // Load XP & Tasks on mount
  useEffect(() => {
    const xp = getStoredXP();
    setPlayerXP(xp);
    setLevelInfo(getLevelInfo(xp));

    const tasks = getDailyTasks();
    setDailyTasks(tasks);
    
    // PWA Install Listener
    const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallButton(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallButton(false);
      }
  };

  // Update Pending Rewards Indicator
  useEffect(() => {
    const pending = dailyTasks.some(t => t.completed && !t.claimed);
    setHasPendingRewards(pending);
    saveDailyTasks(dailyTasks);
  }, [dailyTasks]);

  // Helper to update tasks
  const updateTaskProgress = (type: TaskType, amount: number = 1) => {
    setDailyTasks(prevTasks => {
        const updated = prevTasks.map(task => {
            if (task.type === type && !task.completed) {
                // Special handling for time (stored as seconds in current, target is minutes)
                if (type === 'play_time') {
                     return { ...task, current: task.current + amount }; // Amount is seconds
                }
                return { ...task, current: task.current + amount };
            }
            return task;
        });
        
        // Check for completion inside mapping (moved logic to checkTaskCompletion utility but doing inline for state update efficiency)
        const checked = updated.map(task => {
             const targetVal = task.type === 'play_time' ? task.target * 60 : task.target;
             if (!task.completed && task.current >= targetVal) {
                 return { ...task, current: targetVal, completed: true };
             }
             return task;
        });
        
        return checked;
    });
  };

  const claimTaskReward = (taskId: string) => {
      const task = dailyTasks.find(t => t.id === taskId);
      if (task && task.completed && !task.claimed) {
          const newXP = addXP(task.xpReward);
          setPlayerXP(newXP);
          setLevelInfo(getLevelInfo(newXP));
          
          setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, claimed: true } : t));
      }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, isPlaying]);

  // --- Game Initialization ---
  const startNewGame = useCallback(() => {
    startTransition(() => {
        const deck = shuffleDeck(createDeck(gameMode === GameMode.FreeCell)); // FreeCell: all face up, Klondike: handled below
        let newTableau: CardType[][] = [];
        
        let stock: CardType[] = [];
        let waste: CardType[] = [];

        if (gameMode === GameMode.FreeCell) {
            // FreeCell Deal: 8 columns
            newTableau = [[], [], [], [], [], [], [], []];
            let cardIdx = 0;
            for (let col = 0; col < 8; col++) {
                const numCards = col < 4 ? 7 : 6;
                for (let i = 0; i < numCards; i++) {
                    newTableau[col].push(deck[cardIdx]);
                    cardIdx++;
                }
            }
        } else {
            // Klondike Deal: 7 columns
            newTableau = [[], [], [], [], [], [], []];
            let cardIdx = 0;
            
            // Deal tableau (triangular)
            for (let col = 0; col < 7; col++) {
                for (let i = 0; i <= col; i++) {
                    const card = deck[cardIdx];
                    // Top card is face up
                    card.isFaceUp = (i === col);
                    newTableau[col].push(card);
                    cardIdx++;
                }
            }
            
            // Remaining cards to stock (all face down initially for logic, but visually stock pile is face down)
            stock = deck.slice(cardIdx).map(c => ({ ...c, isFaceUp: false }));
        }

        setGameState({
            ...INITIAL_GAME_STATE,
            mode: gameMode,
            tableau: newTableau,
            stock,
            waste,
        });
        setHistory([]);
        setSelected(null);
        setHint(null);
        setIsPlaying(true);
        setShowWinningBounce(false);
        setIsAutoCollecting(false);
    });

    // Ad Logic: Show interstitial on ALL platforms
    // Delay 4s on first load, 1s on subsequent restarts
    const delay = isFirstLoad.current ? 4000 : 1000;
    
    setTimeout(() => {
        setShowInterstitial(true);
        setInterstitialTimer(INTERSTITIAL_DURATION);
        setIsAdPaused(false);
    }, delay);

    isFirstLoad.current = false;

  }, [gameMode]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // --- Stats Simulation ---
  useEffect(() => {
    // Initial random values
    setOnlineCount(Math.floor(Math.random() * (350 - 150) + 150));
    setVisitCount(1250000 + Math.floor(Math.random() * 50000));

    // Fluctuating online users
    const onlineInterval = setInterval(() => {
        setOnlineCount(prev => {
            const change = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, 2
            return Math.max(100, prev + change);
        });
    }, 3000);

    // Slowly incrementing visits
    const visitInterval = setInterval(() => {
        setVisitCount(prev => prev + 1);
    }, 8000);

    return () => {
        clearInterval(onlineInterval);
        clearInterval(visitInterval);
    }
  }, []);

  // --- Timer & Task Time ---
  useEffect(() => {
    let interval: number;
    if (isPlaying && !gameState.gameWon) {
      interval = window.setInterval(() => {
        setGameState(prev => ({ ...prev, time: prev.time + 1 }));
        // Update Daily Task: Play Time
        updateTaskProgress('play_time', 1); // increment 1 second
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameState.gameWon]);

  // --- Auto Collect Detection ---
  useEffect(() => {
      // Logic to trigger auto-collection
      // Currently only strictly safe for Klondike when all cards are face up
      if (gameMode === GameMode.Klondike && isPlaying && !isAutoCollecting && !gameState.gameWon) {
          const stockEmpty = gameState.stock.length === 0;
          const wasteEmpty = gameState.waste.length === 0;
          const allTableauFaceUp = gameState.tableau.every(col => col.every(card => card.isFaceUp));

          if (stockEmpty && wasteEmpty && allTableauFaceUp) {
              setIsAutoCollecting(true);
          }
      }
  }, [gameState, gameMode, isPlaying, isAutoCollecting]);

  // --- Auto Collect Loop ---
  useEffect(() => {
      let interval: number;
      if (isAutoCollecting && !gameState.gameWon) {
          interval = window.setInterval(() => {
              // Perform one magic move
              let moved = false;
              let newState = JSON.parse(JSON.stringify(gameState));
              
              // Helper to check valid move to foundation
              const tryMoveToFoundation = (card: CardType) => {
                  const pile = newState.foundation[card.suit];
                  const target = pile.length > 0 ? pile[pile.length - 1] : null;
                  return isMoveValid(card, target, 'foundation', newState.mode, card.suit);
              };

              // 1. Scan Tableau
              for (let i = 0; i < newState.tableau.length; i++) {
                  const col = newState.tableau[i];
                  if (col.length > 0) {
                      const card = col[col.length - 1];
                      if (tryMoveToFoundation(card)) {
                          col.pop();
                          newState.foundation[card.suit].push(card);
                          newState.score += 10;
                          moved = true;
                          break; // Only one move per tick
                      }
                  }
              }

              // 2. Scan FreeCells (if mode is FreeCell, though auto-collect trigger is strict for Klondike now, logic stays generic)
              if (!moved && newState.freeCells) {
                  for (let i = 0; i < newState.freeCells.length; i++) {
                      const card = newState.freeCells[i];
                      if (card && tryMoveToFoundation(card)) {
                          newState.freeCells[i] = null;
                          newState.foundation[card.suit].push(card);
                          newState.score += 10;
                          moved = true;
                          break;
                      }
                  }
              }

              if (moved) {
                  startTransition(() => {
                      setGameState(prev => ({
                          ...prev,
                          tableau: newState.tableau,
                          foundation: newState.foundation,
                          freeCells: newState.freeCells,
                          score: newState.score,
                          moves: prev.moves + 1
                      }));
                  });
              }

          }, 100); // Fast speed
      }
      return () => clearInterval(interval);
  }, [isAutoCollecting, gameState]);


  // --- Win Check & Flow ---
  useEffect(() => {
    const totalFoundation = 
      gameState.foundation[Suit.Hearts].length + 
      gameState.foundation[Suit.Diamonds].length +
      gameState.foundation[Suit.Clubs].length +
      gameState.foundation[Suit.Spades].length;
    
    if (totalFoundation === 52 && !gameState.gameWon) {
      // 1. Set Won
      setGameState(prev => ({ ...prev, gameWon: true }));
      setIsPlaying(false);
      setIsAutoCollecting(false);

      // 2. Add XP
      const newTotalXP = addXP(100); // 100 XP per win
      setPlayerXP(newTotalXP);
      setLevelInfo(getLevelInfo(newTotalXP));

      // 3. Update Tasks (Win Game)
      updateTaskProgress('win_game');

      // 4. Start Winning Bounce Animation
      setShowWinningBounce(true);

      // 5. Schedule Ad after animation
      setTimeout(() => {
          setShowWinningBounce(false);
          setShowInterstitial(true);
          setInterstitialTimer(INTERSTITIAL_DURATION);
          setIsAdPaused(false);
      }, BOUNCE_ANIMATION_DURATION);
    }
  }, [gameState.foundation, gameState.gameWon]);

  // --- Interstitial Timer ---
  useEffect(() => {
    let interval: number;
    if (showInterstitial && interstitialTimer > 0 && !isAdPaused) {
      interval = window.setInterval(() => {
        setInterstitialTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showInterstitial, interstitialTimer, isAdPaused]);

  // --- Game Features: Undo, Hint, Magic ---

  const saveHistory = () => {
      // Deep copy gamestate to history
      // Limit history to 20 moves to prevent memory issues
      setHistory(prev => {
          const newHistory = [...prev, JSON.parse(JSON.stringify(gameState))];
          if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
          return newHistory;
      });
  };

  const handleUndo = () => {
      if (history.length === 0 || !isPlaying) return;
      
      startTransition(() => {
          const previousState = history[history.length - 1];
          setGameState(previousState);
          setHistory(prev => prev.slice(0, -1));
          setHint(null);
          setSelected(null);
      });
  };

  const handleHint = () => {
      // Logic to find a valid move
      // Priority: 1. Tableau to Foundation, 2. FreeCell to Foundation, 3. Tableau to Tableau
      
      // Check moves to Foundation
      const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
      
      // 1. Check FreeCells to Foundation
      for (let i = 0; i < gameState.freeCells.length; i++) {
          const card = gameState.freeCells[i];
          if (card) {
              const targetCard = gameState.foundation[card.suit].length > 0 ? gameState.foundation[card.suit][gameState.foundation[card.suit].length - 1] : null;
              if (isMoveValid(card, targetCard, 'foundation', gameState.mode, card.suit)) {
                  setHint({ sourceId: card.id, targetId: `foundation-${card.suit}` });
                  setTimeout(() => setHint(null), 2000);
                  return;
              }
          }
      }

      // 2. Check Tableau to Foundation
      for (let i = 0; i < gameState.tableau.length; i++) {
          const col = gameState.tableau[i];
          if (col.length > 0) {
              const card = col[col.length - 1];
              const targetCard = gameState.foundation[card.suit].length > 0 ? gameState.foundation[card.suit][gameState.foundation[card.suit].length - 1] : null;
              if (isMoveValid(card, targetCard, 'foundation', gameState.mode, card.suit)) {
                  setHint({ sourceId: card.id, targetId: `foundation-${card.suit}` });
                  setTimeout(() => setHint(null), 2000);
                  return;
              }
          }
      }

      // 3. Check Tableau to Tableau
      for (let i = 0; i < gameState.tableau.length; i++) {
          const col = gameState.tableau[i];
          if (col.length === 0) continue;
          const card = col[col.length - 1];
          
          for (let j = 0; j < gameState.tableau.length; j++) {
              if (i === j) continue;
              const targetCol = gameState.tableau[j];
              const targetCard = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;
              
              if (isMoveValid(card, targetCard, 'tableau', gameState.mode)) {
                  setHint({ sourceId: card.id, targetId: `tableau-${j}` });
                  setTimeout(() => setHint(null), 2000);
                  return;
              }
          }
      }
  };

  const handleMagicWand = () => {
      // Auto move cards to foundation if possible
      // This is a simplified "Auto Win" helper
      if (!isPlaying) return;

      let moved = false;
      const newState = JSON.parse(JSON.stringify(gameState));
      let movesAdded = 0;

      // Single pass attempt to move obvious cards to foundation
      // 1. Check Tableau Tips
      for (let i = 0; i < newState.tableau.length; i++) {
          const col = newState.tableau[i];
          if (col.length > 0) {
              const card = col[col.length - 1];
              const foundationPile = newState.foundation[card.suit];
              const targetCard = foundationPile.length > 0 ? foundationPile[foundationPile.length - 1] : null;
              
              if (isMoveValid(card, targetCard, 'foundation', newState.mode, card.suit)) {
                  // Move
                  saveHistory(); // Save before magic
                  col.pop();
                  // Klondike Flip Check
                  if (newState.mode === GameMode.Klondike && col.length > 0) {
                      col[col.length - 1].isFaceUp = true;
                  }
                  foundationPile.push(card);
                  newState.score += 10;
                  moved = true;
                  movesAdded++;
                  // Task Update
                  updateTaskProgress('foundation_drops', 1);
                  break; // Only one move at a time to allow animation
              }
          }
      }

      // 2. Check FreeCells
      if (!moved && newState.mode === GameMode.FreeCell) {
           for (let i = 0; i < newState.freeCells.length; i++) {
               const card = newState.freeCells[i];
               if (card) {
                    const foundationPile = newState.foundation[card.suit];
                    const targetCard = foundationPile.length > 0 ? foundationPile[foundationPile.length - 1] : null;
                    if (isMoveValid(card, targetCard, 'foundation', newState.mode, card.suit)) {
                        saveHistory();
                        newState.freeCells[i] = null;
                        foundationPile.push(card);
                        newState.score += 10;
                        moved = true;
                        movesAdded++;
                        // Task Update
                        updateTaskProgress('foundation_drops', 1);
                        break;
                    }
               }
           }
      }

      if (moved) {
          startTransition(() => {
              setGameState(prev => ({ ...newState, moves: prev.moves + 1 }));
          });
      }
  };


  // --- Move Logic ---
  const handleCardMove = (source: SelectedCard, targetPile: PileType, targetIndex?: number, foundationSuit?: Suit) => {
    saveHistory(); // Save state before move

    startTransition(() => {
        setGameState(prev => {
        const newState = { ...prev };
        let cardsToMove: CardType[] = [];

        // 1. Extract from Source
        if (source.pileType === 'freeCell') {
            if (newState.freeCells[source.pileIndex!] === null) return prev;
            cardsToMove = [newState.freeCells[source.pileIndex!]!];
            newState.freeCells[source.pileIndex!] = null;
        } else if (source.pileType === 'waste') {
            if (newState.waste.length === 0) return prev;
            cardsToMove = [newState.waste[newState.waste.length - 1]];
            newState.waste.pop();
        } else if (source.pileType === 'tableau') {
            // Check "Supermove" rule for moving stacks (FreeCell only really, but Klondike follows simple stack rules)
            const column = newState.tableau[source.pileIndex!];
            cardsToMove = column.slice(source.cardIndex);
            
            if (prev.mode === GameMode.FreeCell && cardsToMove.length > 1) {
                // Calculate max capacity for FreeCell
                const emptyFreeCells = newState.freeCells.filter(c => c === null).length;
                let emptyTableauCols = newState.tableau.filter(c => c.length === 0).length;
                if (targetPile === 'tableau' && newState.tableau[targetIndex!].length === 0) {
                    emptyTableauCols = Math.max(0, emptyTableauCols - 1);
                }
                const limit = getMaxMovableStack(emptyFreeCells, emptyTableauCols);
                if (cardsToMove.length > limit) return prev;
            }
            
            // Remove from source
            newState.tableau[source.pileIndex!] = column.slice(0, source.cardIndex);
            
            // KLONDIKE: Flip the new top card if it was face down
            if (prev.mode === GameMode.Klondike && newState.tableau[source.pileIndex!].length > 0) {
                const newTopCard = newState.tableau[source.pileIndex!][newState.tableau[source.pileIndex!].length - 1];
                if (!newTopCard.isFaceUp) {
                    newTopCard.isFaceUp = true;
                    newState.score += 5; // Points for turning over a card
                }
            }
        }

        if (cardsToMove.length === 0) return prev;

        // 2. Add to Target
        if (targetPile === 'freeCell') {
            if (cardsToMove.length > 1) return prev; 
            newState.freeCells[targetIndex!] = cardsToMove[0];
        } else if (targetPile === 'tableau') {
            newState.tableau[targetIndex!].push(...cardsToMove);
            newState.score += 5;
        } else if (targetPile === 'foundation') {
            if (cardsToMove.length > 1) return prev;
            newState.foundation[foundationSuit!].push(cardsToMove[0]);
            newState.score += 10;
        }

        newState.moves += 1;
        setHint(null); // Clear hint on move
        return newState;
        });
    });
    
    // --- Update Tasks ---
    updateTaskProgress('play_moves', 1);
    if (targetPile === 'foundation') {
        updateTaskProgress('foundation_drops', 1);
    }

    setSelected(null);
  };

  const handleStockClick = () => {
      if (gameState.mode !== GameMode.Klondike) return;
      saveHistory();

      startTransition(() => {
          setGameState(prev => {
              const newState = { ...prev };
              if (newState.stock.length === 0) {
                  if (newState.waste.length > 0) {
                      newState.stock = newState.waste.reverse().map(c => ({ ...c, isFaceUp: false }));
                      newState.waste = [];
                      newState.moves += 1;
                  }
              } else {
                  const card = newState.stock.pop();
                  if (card) {
                      card.isFaceUp = true;
                      newState.waste.push(card);
                      newState.moves += 1;
                  }
              }
              return newState;
          });
      });
      updateTaskProgress('play_moves', 1);
      setSelected(null);
  };

  const handleCardClick = (card: CardType | null, pileType: PileType, pileIndex?: number, cardIndex?: number) => {
    if (!card) {
        if (selected) {
            if (pileType === 'freeCell') {
                if (isMoveValid(selected.card, null, 'freeCell', gameState.mode)) {
                     let isSingle = true;
                     if (selected.pileType === 'tableau') {
                         const sourceCol = gameState.tableau[selected.pileIndex!];
                         if (selected.cardIndex !== sourceCol.length - 1) isSingle = false;
                     }
                     if (isSingle) handleCardMove(selected, 'freeCell', pileIndex);
                }
            } else if (pileType === 'tableau') {
                if (isMoveValid(selected.card, null, 'tableau', gameState.mode)) {
                    handleCardMove(selected, 'tableau', pileIndex);
                }
            }
        }
        return;
    }
    if (!card.isFaceUp && pileType === 'tableau') return;
    if (selected) {
        if (selected.card.id === card.id) {
            setSelected(null);
            return;
        }
        if (pileType === 'tableau') {
             if (isMoveValid(selected.card, card, 'tableau', gameState.mode)) {
                 handleCardMove(selected, 'tableau', pileIndex);
                 return;
             }
        }
    }
    if (pileType === 'freeCell' || pileType === 'waste') {
        setSelected({ card, pileType, pileIndex, cardIndex: 0 });
    } else if (pileType === 'tableau') {
        const column = gameState.tableau[pileIndex!];
        const stack = column.slice(cardIndex);
        if (isStackValid(stack)) {
            setSelected({ card, pileType, pileIndex, cardIndex });
        }
    }
  };

  const handleDragStart = (e: React.DragEvent, card: CardType, pileType: PileType, pileIndex?: number, cardIndex?: number) => {
      if (!card.isFaceUp) {
          e.preventDefault();
          return;
      }
      if (pileType === 'tableau') {
          const column = gameState.tableau[pileIndex!];
          const stack = column.slice(cardIndex);
          if (!isStackValid(stack)) {
              e.preventDefault();
              return;
          }
      }
      const data: SelectedCard = { card, pileType, pileIndex, cardIndex };
      e.dataTransfer.setData('application/json', JSON.stringify(data));
      e.dataTransfer.effectAllowed = 'move';
      setSelected(data);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPileType: PileType, targetPileIndex?: number, foundationSuit?: Suit) => {
      e.preventDefault();
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const sourceData: SelectedCard = JSON.parse(dataStr);
      let targetCard: CardType | null = null;
      if (targetPileType === 'tableau') {
          const col = gameState.tableau[targetPileIndex!];
          if (col.length > 0) targetCard = col[col.length - 1];
      } else if (targetPileType === 'foundation') {
          const pile = gameState.foundation[foundationSuit!];
          if (pile.length > 0) targetCard = pile[pile.length - 1];
      } else if (targetPileType === 'freeCell') {
          targetCard = gameState.freeCells[targetPileIndex!] || null;
      }
      let isSingle = true;
      if (sourceData.pileType === 'tableau') {
           const sourceCol = gameState.tableau[sourceData.pileIndex!];
           if (sourceData.cardIndex !== sourceCol.length - 1) isSingle = false;
      }
      if ((targetPileType === 'freeCell' || targetPileType === 'foundation') && !isSingle) {
          return;
      }
      if (isMoveValid(sourceData.card, targetCard, targetPileType, gameState.mode, foundationSuit)) {
          handleCardMove(sourceData, targetPileType, targetPileIndex, foundationSuit);
      }
  };

  const handleFoundationClick = (suit: Suit) => {
     if (selected) {
         let isSingle = true;
         if (selected.pileType === 'tableau') {
             const col = gameState.tableau[selected.pileIndex!];
             if (selected.cardIndex !== col.length - 1) isSingle = false;
         }
         if (!isSingle) return;
         const targetCard = gameState.foundation[suit].length > 0 
           ? gameState.foundation[suit][gameState.foundation[suit].length - 1] 
           : null;
         if (isMoveValid(selected.card, targetCard, 'foundation', gameState.mode, suit)) {
             handleCardMove(selected, 'foundation', undefined, suit);
         }
     }
  };

  const handleDoubleClick = (card: CardType, pileType: PileType, pileIndex?: number, cardIndex?: number) => {
      if (!card.isFaceUp) return;
      if (pileType === 'tableau') {
          const col = gameState.tableau[pileIndex!];
          if (cardIndex !== col.length - 1) return;
      }
      const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
      for (const suit of suits) {
          const foundationPile = gameState.foundation[suit];
          const targetCard = foundationPile.length > 0 ? foundationPile[foundationPile.length - 1] : null;
          if (isMoveValid(card, targetCard, 'foundation', gameState.mode, suit)) {
               handleCardMove({ card, pileType, pileIndex, cardIndex }, 'foundation', undefined, suit);
               return;
          }
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStackOffset = (isFaceUp: boolean) => {
      return gameMode === GameMode.Klondike && !isFaceUp ? 12 : 28;
  }
  
  const getCardTransitionName = (id: string) => `card-${id.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="min-h-screen bg-[#0f3526] flex flex-col font-sans relative overflow-x-hidden selection:bg-yellow-500/30">
        {/* Confetti & Winning Bounce & Tasks Modal */}
        {gameState.gameWon && <Confetti />}
        {showWinningBounce && <WinningBounce foundation={gameState.foundation} />}
        {showTasksModal && <DailyTasksModal tasks={dailyTasks} onClose={() => setShowTasksModal(false)} onClaim={claimTaskReward} />}

        <style dangerouslySetInnerHTML={{__html: `
            ::view-transition-group(*) { animation-duration: 0.4s; animation-timing-function: cubic-bezier(0.2, 0, 0, 1); }
            ::view-transition-old(*) { opacity: 1; }
            ::view-transition-new(*) { opacity: 1; }
            @keyframes win-wave { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
            .animate-win-wave { animation: win-wave 1s ease-in-out infinite; }
            .hint-source { animation: pulse-yellow 1.5s infinite; filter: brightness(1.2); }
            .hint-target { animation: pulse-green 1.5s infinite; box-shadow: 0 0 15px #4ade80; z-index: 50; }
            @keyframes pulse-yellow { 0%, 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(250, 204, 21, 0); } }
            @keyframes pulse-green { 0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); } }
            
            /* 3D Victory Text */
            .victory-text {
                font-family: 'Crimson Pro', serif;
                background: linear-gradient(to bottom, #fde047, #ca8a04);
                -webkit-background-clip: text;
                color: transparent;
                text-shadow: 0px 4px 10px rgba(0,0,0,0.5);
                filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.6));
                animation: zoom-in-bounce 1s ease-out forwards;
            }
            @keyframes zoom-in-bounce {
                0% { transform: scale(0) rotate(-10deg); opacity: 0; }
                60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
        `}} />
        
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e5940_0%,_#051c14_100%)] pointer-events-none"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Header */}
      <header className="bg-black/40 shadow-xl z-20 sticky top-0 backdrop-blur-md border-b border-yellow-600/20">
         <div className="max-w-[1600px] mx-auto px-4 py-2 flex flex-col items-center gap-2">
            
            {/* Top Bar: Logo & Mode Switcher & Rank */}
            <div className="w-full flex justify-between items-center text-white mb-1">
                 <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-2 rounded-lg shadow-lg hidden sm:block border border-yellow-400/30">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-md leading-none">
                            Solitaire Pro
                        </h1>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-yellow-500/80 font-mono mt-0.5">
                            <Crown className="w-3 h-3" />
                            <span className="uppercase font-bold tracking-wider">{levelInfo.title}</span>
                            <span className="text-white/40">•</span>
                            <span>Lvl {levelInfo.level}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Install Button */}
                    {showInstallButton && (
                        <button 
                            onClick={handleInstallClick}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-lg flex items-center gap-1.5 animate-pulse"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Instalar App</span>
                        </button>
                    )}

                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                        <button 
                        onClick={() => setGameMode(GameMode.FreeCell)}
                        className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${gameMode === GameMode.FreeCell ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                        >
                            FreeCell
                        </button>
                        <button 
                        onClick={() => setGameMode(GameMode.Klondike)}
                        className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${gameMode === GameMode.Klondike ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                        >
                            Clássica
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                        onClick={() => setShowTasksModal(true)}
                        className="relative bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all"
                        title="Tarefas Diárias"
                        >
                        <CalendarCheck className="w-5 h-5" />
                        {hasPendingRewards && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1e293b] animate-pulse"></span>
                        )}
                        </button>
                        <button 
                        onClick={startNewGame}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all"
                        title="Reiniciar Jogo"
                        >
                        <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex gap-2 sm:gap-6 text-xs sm:text-sm font-mono bg-[#0a1f16]/80 px-4 sm:px-8 py-1.5 rounded-full border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-2">
                    <span className="text-yellow-500 font-bold uppercase tracking-wider text-[10px] sm:text-xs">Pontos</span>
                    <span className="text-white text-lg">{gameState.score}</span>
                </div>
                <div className="w-px bg-white/10 h-6"></div>
                <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">Moves</span>
                    <span className="text-white text-lg">{gameState.moves}</span>
                </div>
                <div className="w-px bg-white/10 h-6"></div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-lg">{formatTime(gameState.time)}</span>
                </div>
            </div>
            
            <div className="w-full max-w-[728px] h-[90px] mx-auto hidden md:block mt-1 bg-black/20 rounded">
                 <AdBanner className="w-full h-full rounded shadow-inner" slotId={ADSENSE_SLOT_ID} />
            </div>
         </div>
      </header>

      {/* Main Area with significant bottom padding to allow scrolling past fixed elements */}
      <main className="flex-grow flex justify-center p-2 sm:p-4 z-10 relative pb-40">
         <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-[160px_1fr_160px] gap-6">
             
            <div className="hidden lg:flex flex-col gap-4">
               <AdBanner className="w-[160px] h-[600px] sticky top-36 rounded-lg shadow-2xl border border-white/5" slotId={ADSENSE_SLOT_ID} format="auto" />
            </div>

            <div className="flex flex-col gap-4 sm:gap-8 w-full max-w-[1000px] mx-auto select-none">
                <div className={`grid ${gameMode === GameMode.FreeCell ? 'grid-cols-8' : 'grid-cols-7'} gap-1 sm:gap-4 px-1 sm:px-2`}>
                    
                    {/* LEFT: FreeCell / Stock */}
                    {gameMode === GameMode.FreeCell ? (
                        gameState.freeCells.map((card, index) => (
                            <div 
                                key={`freecell-${index}`} 
                                className={`col-span-1 relative group aspect-[2.5/3.5] ${hint?.targetId === `freecell-${index}` ? 'hint-target rounded-lg' : ''}`}
                                onClick={() => handleCardClick(card, 'freeCell', index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'freeCell', index)}
                            >
                                {card ? (
                                    <SolitaireCard 
                                        card={card}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, card, 'freeCell', index)}
                                        onClick={(e) => { e.stopPropagation(); handleCardClick(card, 'freeCell', index); }}
                                        onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(card, 'freeCell', index); }}
                                        isSelected={selected?.card.id === card.id}
                                        className={hint?.sourceId === card.id ? 'hint-source' : ''}
                                        style={{ viewTransitionName: getCardTransitionName(card.id) } as React.CSSProperties}
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-[5%] border-2 border-white/10 bg-black/20 flex items-center justify-center hover:bg-white/5 transition-colors shadow-inner">
                                        <LayoutGrid className="w-6 h-6 text-white/5" />
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="col-span-1 relative group aspect-[2.5/3.5]" onClick={handleStockClick}>
                                {gameState.stock.length > 0 ? (
                                    <div className="relative w-full h-full">
                                        {gameState.stock.length > 1 && (
                                             <div className="absolute top-[2px] left-[2px] w-full h-full bg-[#5c0b0b] rounded-[5%] border border-white/20"></div>
                                        )}
                                        <SolitaireCard 
                                            card={gameState.stock[gameState.stock.length - 1]} 
                                            className="shadow-md relative"
                                            style={{ viewTransitionName: getCardTransitionName(gameState.stock[gameState.stock.length - 1].id) } as React.CSSProperties}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <RefreshCw className="w-8 h-8 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full rounded-[5%] border-2 border-white/10 bg-black/20 flex items-center justify-center group-hover:bg-white/5 transition-colors shadow-inner">
                                        <RefreshCw className="w-8 h-8 text-white/20" />
                                    </div>
                                )}
                            </div>
                            <div className="col-span-1 relative aspect-[2.5/3.5]">
                                {gameState.waste.length > 0 ? (
                                    <SolitaireCard 
                                        card={gameState.waste[gameState.waste.length - 1]}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, gameState.waste[gameState.waste.length - 1], 'waste')}
                                        onClick={(e) => { e.stopPropagation(); handleCardClick(gameState.waste[gameState.waste.length - 1], 'waste'); }}
                                        isSelected={selected?.card.id === gameState.waste[gameState.waste.length - 1].id}
                                        className={hint?.sourceId === gameState.waste[gameState.waste.length - 1].id ? 'hint-source' : ''}
                                        style={{ viewTransitionName: getCardTransitionName(gameState.waste[gameState.waste.length - 1].id) } as React.CSSProperties}
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-[5%] border border-white/5 bg-transparent"></div>
                                )}
                            </div>
                            <div className="col-span-1"></div>
                        </>
                    )}

                    {/* RIGHT: Foundations */}
                    {[Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades].map((suit, index) => (
                        <div 
                            key={suit} 
                            className={`col-span-1 relative group aspect-[2.5/3.5] ${gameState.gameWon ? 'animate-win-wave' : ''} ${hint?.targetId === `foundation-${suit}` ? 'hint-target rounded-lg' : ''}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                            onClick={() => handleFoundationClick(suit)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'foundation', undefined, suit)}
                        >
                            {gameState.foundation[suit].length > 0 ? (
                                <SolitaireCard 
                                    card={gameState.foundation[suit][gameState.foundation[suit].length - 1]}
                                    style={{ viewTransitionName: getCardTransitionName(gameState.foundation[suit][gameState.foundation[suit].length - 1].id) } as React.CSSProperties}
                                />
                            ) : (
                                <div className="w-full h-full rounded-[5%] border-2 border-white/10 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                                    {suit === Suit.Hearts ? <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white/10" /> :
                                     suit === Suit.Diamonds ? <Diamond className="w-6 h-6 sm:w-8 sm:h-8 text-white/10" /> :
                                     suit === Suit.Clubs ? <Club className="w-6 h-6 sm:w-8 sm:h-8 text-white/10" /> :
                                     <Spade className="w-6 h-6 sm:w-8 sm:h-8 text-white/10" />}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Tableau */}
                <div className={`grid ${gameMode === GameMode.FreeCell ? 'grid-cols-8' : 'grid-cols-7'} gap-1 sm:gap-4 min-h-[60vh] px-1 sm:px-2 pb-4`}>
                    {gameState.tableau.map((column, colIndex) => (
                        <div 
                            key={colIndex} 
                            className={`relative w-full h-full ${gameState.gameWon ? 'animate-win-wave' : ''} ${hint?.targetId === `tableau-${colIndex}` ? 'hint-target rounded-t-lg' : ''}`}
                            style={{ animationDelay: `${(colIndex + 4) * 0.1}s` }}
                            onClick={() => column.length === 0 && handleCardClick(null, 'tableau', colIndex)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'tableau', colIndex)}
                        >
                            {column.length === 0 ? (
                                <div className="w-full aspect-[2.5/3.5] rounded-[5%] border border-white/5 bg-black/5 mx-auto"></div>
                            ) : (
                                column.map((card, cardIndex) => (
                                    <div 
                                        key={card.id} 
                                        className="absolute w-full"
                                        style={{ top: `${cardIndex * getStackOffset(card.isFaceUp)}px`, zIndex: cardIndex }}
                                    >
                                        <SolitaireCard 
                                            card={card}
                                            draggable={card.isFaceUp}
                                            onDragStart={(e) => handleDragStart(e, card, 'tableau', colIndex, cardIndex)}
                                            onClick={(e) => { e.stopPropagation(); handleCardClick(card, 'tableau', colIndex, cardIndex); }}
                                            onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(card, 'tableau', colIndex, cardIndex); }}
                                            isSelected={selected?.card.id === card.id}
                                            className={hint?.sourceId === card.id ? 'hint-source' : ''}
                                            style={{ viewTransitionName: getCardTransitionName(card.id) } as React.CSSProperties}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="hidden lg:flex flex-col gap-4">
               <AdBanner className="w-[160px] h-[600px] sticky top-36 rounded-lg shadow-2xl border border-white/5" slotId={ADSENSE_SLOT_ID} format="auto" />
            </div>
         </div>
      </main>

      {/* Modern Compact Floating Action Bar - Adjusted position to bottom-32 to be above ad area but compact */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none">
         <div className="flex items-center gap-4 bg-[#0a1f16]/90 backdrop-blur-xl p-2 rounded-2xl border border-yellow-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-auto transform transition-all hover:scale-105">
             
             {/* Undo Button - Premium Gold/Red style */}
             <button 
                onClick={handleUndo} 
                disabled={history.length === 0}
                className={`group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl border transition-all active:scale-95 ${
                    history.length === 0 
                    ? 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed' 
                    : 'bg-gradient-to-br from-red-900 to-[#450a0a] border-red-500/30 text-red-100 shadow-lg shadow-red-900/40 hover:from-red-800 hover:to-red-900'
                }`}
                title="Desfazer (Ctrl+Z)"
             >
                 <Undo2 className={`w-6 h-6 mb-0.5 ${history.length > 0 ? 'drop-shadow-md' : ''}`} />
                 <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 font-serif">Undo</span>
             </button>

             <div className="w-px h-8 bg-white/10"></div>

             {/* Hint Button - Glass/Neutral style */}
             <button 
                onClick={handleHint}
                className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white transition-all active:scale-95 hover:bg-white/15 hover:border-yellow-400/50 hover:text-yellow-200 shadow-lg"
                title="Dica"
             >
                 <Lightbulb className="w-6 h-6 mb-0.5 group-hover:fill-yellow-400/20 drop-shadow-md transition-all" />
                 <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 font-serif">Dica</span>
             </button>

             <div className="w-px h-8 bg-white/10"></div>
             
             {/* Auto Button - Premium Emerald/Gold style */}
             <button 
                onClick={handleMagicWand}
                className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 border border-emerald-500/30 text-emerald-100 transition-all active:scale-95 hover:from-emerald-700 hover:to-emerald-900 shadow-lg shadow-emerald-900/40"
                title="Auto-Completar Jogadas"
             >
                 <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                 <Wand2 className="w-6 h-6 mb-0.5 drop-shadow-md" />
                 <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 font-serif">Auto</span>
             </button>
         </div>
      </div>

      {/* 3D Victory Text Overlay */}
      {showWinningBounce && (
          <div className="fixed inset-0 z-[155] flex items-center justify-center pointer-events-none">
              <h1 className="text-[12vw] font-black uppercase tracking-tighter victory-text">
                  Vitória!
              </h1>
          </div>
      )}

      <div className="fixed bottom-4 right-4 z-40 hidden md:flex flex-col gap-2 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md text-white/90 text-xs font-mono py-1.5 px-3 rounded-full shadow-lg border border-white/10 flex items-center gap-2 pointer-events-auto">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
             <span className="font-bold text-white">{onlineCount}</span> online
          </div>
          <div className="bg-black/80 backdrop-blur-md text-white/90 text-xs font-mono py-1.5 px-3 rounded-full shadow-lg border border-white/10 flex items-center gap-2 pointer-events-auto">
             <Eye className="w-3 h-3 text-blue-400" />
             <span>{visitCount.toLocaleString()}</span> visitas
          </div>
      </div>

      {showInterstitial && (
         <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] flex flex-col gap-4 items-center animate-in fade-in zoom-in duration-300">
                <div className="text-white/70 uppercase tracking-widest text-xs font-bold mb-2">Publicidade</div>
                <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                     <div className="w-full aspect-[4/3] bg-[#202020] relative">
                         <AdBanner className="w-full h-full" slotId={ADSENSE_SLOT_ID} format="rectangle" />
                     </div>
                     <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/80 backdrop-blur-sm flex items-center px-3 gap-3 border-t border-white/10 z-10">
                         <button onClick={() => setIsAdPaused(prev => !prev)} className="text-white hover:text-yellow-400 transition-colors focus:outline-none">
                             {isAdPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                         </button>
                         <div className="flex-grow h-1 bg-gray-600 rounded-full overflow-hidden">
                             <div className="h-full bg-yellow-500 transition-all duration-1000 ease-linear" style={{ width: `${((INTERSTITIAL_DURATION - interstitialTimer) / INTERSTITIAL_DURATION) * 100}%` }} />
                         </div>
                         <div className="text-[10px] text-gray-300 font-mono w-6 text-right">{interstitialTimer}s</div>
                         <button onClick={() => setIsAdMuted(prev => !prev)} className="text-white hover:text-yellow-400 transition-colors focus:outline-none">
                             {isAdMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                         </button>
                         <button className="text-white hover:text-yellow-400 transition-colors focus:outline-none"><Maximize size={16} /></button>
                     </div>
                </div>
                <div className="flex flex-col items-center gap-2 mt-4">
                    {interstitialTimer > 0 ? (
                        <div className="flex items-center gap-2 text-white font-mono text-lg">
                             {isAdPaused ? (
                                 <span className="text-yellow-400 font-bold uppercase text-sm tracking-wider">Pausado</span>
                             ) : (
                                <>
                                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                    <span className="text-sm">O anúncio termina em {interstitialTimer}s...</span>
                                </>
                             )}
                        </div>
                    ) : (
                        <button onClick={() => setShowInterstitial(false)} className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-yellow-400 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2 animate-in fade-in zoom-in">
                            <X className="w-5 h-5" /> Fechar Anúncio
                        </button>
                    )}
                </div>
            </div>
         </div>
      )}

      {/* Win Modal */}
      {gameState.gameWon && !showInterstitial && !showWinningBounce && (
          <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl transform scale-105 border-4 border-yellow-400 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300"></div>
                  <div className="inline-flex p-4 rounded-full bg-yellow-50 mb-4 ring-4 ring-yellow-100 shadow-lg animate-bounce">
                      <Trophy className="w-16 h-16 text-yellow-600 drop-shadow-sm" />
                  </div>
                  <h2 className="text-4xl font-serif font-black text-gray-900 mb-2 uppercase tracking-tight">Vitória!</h2>
                  
                  {/* XP Bar */}
                  <div className="mb-6 px-4">
                       <div className="flex justify-between items-end mb-1">
                           <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{levelInfo.title}</span>
                           <span className="text-xs font-mono text-gray-400">Lvl {levelInfo.level}</span>
                       </div>
                       <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden relative border border-gray-300">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400" style={{ width: `${levelInfo.progress}%` }}></div>
                       </div>
                       <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
                           <span>+{100} XP Ganho</span>
                           <span>{levelInfo.currentXP} / {levelInfo.nextLevelXP} XP</span>
                       </div>
                  </div>

                  <p className="text-gray-600 mb-6 font-medium">
                      Parabéns! Você completou o jogo em <span className="text-emerald-600 font-bold">{gameState.moves}</span> jogadas.
                  </p>
                  <div className="w-full h-[200px] bg-gray-100 mb-6 rounded-lg overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center">
                      <AdBanner className="w-full h-full" slotId={ADSENSE_SLOT_ID} format="rectangle" />
                  </div>
                  <button onClick={startNewGame} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg active:scale-95 flex items-center justify-center gap-2">
                      <RotateCcw className="w-5 h-5" /> Jogar Novamente
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;