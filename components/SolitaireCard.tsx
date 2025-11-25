import React from 'react';
import { CardType, Rank, Suit } from '../types';
import { getCardColor } from '../utils/deck';
import { Heart, Diamond, Club, Spade, Crown } from 'lucide-react';

interface SolitaireCardProps {
  card: CardType;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const SuitIcon = ({ suit, className, fill = true }: { suit: Suit; className?: string; fill?: boolean }) => {
  const props = { className, strokeWidth: fill ? 0 : 2 };
  switch (suit) {
    case Suit.Hearts: return <Heart {...props} fill={fill ? "currentColor" : "none"} />;
    case Suit.Diamonds: return <Diamond {...props} fill={fill ? "currentColor" : "none"} />;
    case Suit.Clubs: return <Club {...props} fill={fill ? "currentColor" : "none"} />;
    case Suit.Spades: return <Spade {...props} fill={fill ? "currentColor" : "none"} />;
  }
};

export const RankLabel = ({ rank }: { rank: Rank }) => {
  let label = rank.toString();
  switch (rank) {
    case Rank.Ace: label = 'A'; break;
    case Rank.Jack: label = 'J'; break;
    case Rank.Queen: label = 'Q'; break;
    case Rank.King: label = 'K'; break;
  }
  return <span className="font-serif tracking-tighter font-black">{label}</span>;
};

// Reliable SVG Pattern Data URIs - Exported for Canvas use
// Front: Subtle Parchment Noise
export const PARCHMENT_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`;

// Back: Geometric Diamonds
export const BACK_PATTERN = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23991b1b' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M10 0L20 10L10 20L0 10z'/%3E%3C/g%3E%3C/svg%3E")`;

// Helper to render pips for number cards
const PipLayer = ({ rank, suit }: { rank: Rank, suit: Suit }) => {
  const pips: { top: string, left: string, invert?: boolean }[] = [];
  const L = '20%';
  const C = '50%';
  const R = '80%';
  
  const T = '15%'; 
  const M = '50%'; 
  const B = '85%'; 

  switch (rank) {
    case Rank.Two:
      pips.push({ top: T, left: C });
      pips.push({ top: B, left: C, invert: true });
      break;
    case Rank.Three:
      pips.push({ top: T, left: C });
      pips.push({ top: M, left: C });
      pips.push({ top: B, left: C, invert: true });
      break;
    case Rank.Four:
      pips.push({ top: T, left: L }, { top: T, left: R });
      pips.push({ top: B, left: L, invert: true }, { top: B, left: R, invert: true });
      break;
    case Rank.Five:
      pips.push({ top: T, left: L }, { top: T, left: R });
      pips.push({ top: M, left: C });
      pips.push({ top: B, left: L, invert: true }, { top: B, left: R, invert: true });
      break;
    case Rank.Six:
      pips.push({ top: T, left: L }, { top: T, left: R });
      pips.push({ top: M, left: L }, { top: M, left: R });
      pips.push({ top: B, left: L, invert: true }, { top: B, left: R, invert: true });
      break;
    case Rank.Seven:
      pips.push({ top: T, left: L }, { top: T, left: R });
      pips.push({ top: M, left: L }, { top: M, left: R });
      pips.push({ top: '32.5%', left: C });
      pips.push({ top: B, left: L, invert: true }, { top: B, left: R, invert: true });
      break;
    case Rank.Eight:
      pips.push({ top: T, left: L }, { top: T, left: R });
      pips.push({ top: M, left: L }, { top: M, left: R });
      pips.push({ top: '32.5%', left: C });
      pips.push({ top: '67.5%', left: C, invert: true });
      pips.push({ top: B, left: L, invert: true }, { top: B, left: R, invert: true });
      break;
    case Rank.Nine:
      pips.push({ top: T, left: L }, { top: T, left: R });
      pips.push({ top: '37.5%', left: L }, { top: '37.5%', left: R });
      pips.push({ top: M, left: C });
      pips.push({ top: '62.5%', left: L, invert: true }, { top: '62.5%', left: R, invert: true });
      pips.push({ top: B, left: L, invert: true }, { top: B, left: R, invert: true });
      break;
    case Rank.Ten:
      pips.push({ top: T, left: L }, { top: T, left: R });
      pips.push({ top: '37.5%', left: L }, { top: '37.5%', left: R });
      pips.push({ top: '26.25%', left: C });
      pips.push({ top: '73.75%', left: C, invert: true });
      pips.push({ top: '62.5%', left: L, invert: true }, { top: '62.5%', left: R, invert: true });
      pips.push({ top: B, left: L, invert: true }, { top: B, left: R, invert: true });
      break;
    default:
      break;
  }

  return (
    <div className="absolute inset-x-[15%] inset-y-[12%] pointer-events-none">
      {pips.map((pip, i) => (
        <div 
          key={i} 
          className={`absolute w-[20%] h-[20%] flex items-center justify-center ${pip.invert ? 'rotate-180' : ''}`}
          style={{ top: pip.top, left: pip.left, transform: `translate(-50%, -50%) ${pip.invert ? 'rotate(180deg)' : ''}` }}
        >
          <SuitIcon suit={suit} className="w-full h-full" />
        </div>
      ))}
    </div>
  );
}

export const SolitaireCard: React.FC<SolitaireCardProps> = ({
  card,
  onClick,
  onDoubleClick,
  isSelected,
  className = '',
  style,
  draggable,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const isFaceCard = card.rank === Rank.Jack || card.rank === Rank.Queen || card.rank === Rank.King;
  const isNumberCard = card.rank >= 2 && card.rank <= 10;
  const isAce = card.rank === Rank.Ace;
  const color = getCardColor(card.suit);
  const textColor = color === 'red' ? 'text-[#d40000]' : 'text-[#1a1a1a]';

  return (
    <div
      className={`relative w-full aspect-[2.5/3.5] select-none [perspective:1000px] ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
          ...style,
          zIndex: isSelected ? 100 : style?.zIndex, 
      }}
    >
      <div 
        className={`w-full h-full relative transition-transform duration-500 ease-in-out [transform-style:preserve-3d] ${card.isFaceUp ? '[transform:rotateY(0deg)]' : '[transform:rotateY(180deg)]'}`}
      >
          {/* --- FRONT FACE --- */}
          <div 
            className={`absolute inset-0 [backface-visibility:hidden] bg-[#fcfaf5] rounded-[6%] overflow-hidden flex items-center justify-center transition-all duration-300
            ${isSelected 
              ? 'ring-[3px] ring-yellow-400 ring-offset-2 ring-offset-[#0f3526] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] -translate-y-4' 
              : 'shadow-[0_2px_6px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)]'
            }`}
          >
             {/* Parchment Texture */}
             <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50" style={{ backgroundImage: PARCHMENT_TEXTURE }}></div>
             
             {/* Paper Gradient */}
             <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent pointer-events-none"></div>

             {/* Top Left */}
             <div className={`absolute top-[3%] left-[4%] flex flex-col items-center leading-none ${textColor} w-[18%]`}>
                <span className="text-[min(18px,4.5vw)] sm:text-2xl font-bold font-serif mb-[2%]"><RankLabel rank={card.rank} /></span>
                <SuitIcon suit={card.suit} className="w-[min(14px,3.5vw)] h-[min(14px,3.5vw)] sm:w-4 sm:h-4" />
             </div>

             {/* Center Area */}
             <div className={`absolute inset-[13%] flex items-center justify-center pointer-events-none ${textColor}`}>
                 {isFaceCard && (
                     <div className="w-full h-full border-[1.5px] border-current/20 rounded-sm flex flex-col items-center justify-center relative overflow-hidden bg-current/5 shadow-inner">
                         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, backgroundSize: '8px 8px' }}></div>
                         <div className="absolute top-0 left-0 w-3 h-3 border-t-[3px] border-l-[3px] border-current/40"></div>
                         <div className="absolute top-0 right-0 w-3 h-3 border-t-[3px] border-r-[3px] border-current/40"></div>
                         <div className="absolute bottom-0 left-0 w-3 h-3 border-b-[3px] border-l-[3px] border-current/40"></div>
                         <div className="absolute bottom-0 right-0 w-3 h-3 border-b-[3px] border-r-[3px] border-current/40"></div>
                         
                         <SuitIcon suit={card.suit} className="w-[55%] h-[55%] drop-shadow-md" />
                         <div className="mt-1 font-serif text-[9px] sm:text-[10px] font-black opacity-70 uppercase tracking-[0.2em] border-t border-current/30 pt-0.5">
                            {card.rank === Rank.King ? 'King' : card.rank === Rank.Queen ? 'Queen' : 'Jack'}
                         </div>
                     </div>
                 )}

                 {isAce && (
                    <div className="flex items-center justify-center w-full h-full relative">
                         <div className="absolute inset-0 flex items-center justify-center opacity-10 scale-150">
                             <SuitIcon suit={card.suit} className="w-full h-full" />
                         </div>
                        <SuitIcon suit={card.suit} className="w-[60%] h-[60%] drop-shadow-lg" />
                    </div>
                 )}

                 {isNumberCard && <PipLayer rank={card.rank} suit={card.suit} />}
             </div>

             {/* Bottom Right */}
             <div className={`absolute bottom-[3%] right-[4%] flex flex-col items-center leading-none rotate-180 ${textColor} w-[18%]`}>
                <span className="text-[min(18px,4.5vw)] sm:text-2xl font-bold font-serif mb-[2%]"><RankLabel rank={card.rank} /></span>
                <SuitIcon suit={card.suit} className="w-[min(14px,3.5vw)] h-[min(14px,3.5vw)] sm:w-4 sm:h-4" />
             </div>
             
             {/* Inner Die Cut Line */}
             <div className="absolute inset-[1px] border border-black/5 rounded-[5.5%] pointer-events-none"></div>
          </div>

          {/* --- BACK FACE --- */}
          <div 
            className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[6%] overflow-hidden flex items-center justify-center transition-all duration-300
            ${isSelected 
              ? 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] -translate-y-4' 
              : 'shadow-[0_2px_6px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)]'
            }`}
            style={{ backgroundColor: '#7f1d1d' }} // Base Deep Red
          >
            {/* Geometric Pattern */}
            <div className="absolute inset-1.5 border border-[#fbbf24]/20 rounded-[4.5%]" 
                 style={{ backgroundImage: BACK_PATTERN, backgroundColor: '#7f1d1d' }}>
            </div>
            
            {/* Central Crown Emblem */}
            <div className="relative w-[35%] h-[25%] bg-[#450a0a] rounded-[50%] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border-2 border-[#fbbf24]/40 z-10">
                 <Crown className="w-[60%] h-[60%] text-[#fbbf24] drop-shadow-md" strokeWidth={1.5} />
            </div>
            
            {/* White Border Frame */}
            <div className="absolute inset-0 border-[4px] border-[#fcfaf5] rounded-[6%] pointer-events-none shadow-[inset_0_0_4px_rgba(0,0,0,0.3)]"></div>
          </div>
      </div>
    </div>
  );
};
