import React, { useEffect, useRef } from 'react';
import { CardType, Suit, Rank } from '../types';
import { getCardColor } from '../utils/deck';

interface WinningBounceProps {
  foundation: { [key in Suit]: CardType[] };
}

// Particle class to manage each bouncing card
class BouncingCard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  suit: Suit;
  rank: Rank;
  color: string;
  bounce: number;
  
  constructor(x: number, y: number, suit: Suit, rank: Rank, canvasWidth: number) {
    this.x = x;
    this.y = y;
    // Random horizontal velocity (-5 to +5), but always moving away from center slightly biased
    this.vx = (Math.random() * 8 - 4); 
    this.vy = 0; // Starts with 0 vertical velocity
    this.width = canvasWidth * 0.12; // Roughly card width relative to screen
    this.height = this.width * 1.4;
    this.suit = suit;
    this.rank = rank;
    this.color = getCardColor(suit) === 'red' ? '#d40000' : '#1a1a1a';
    this.bounce = 0.75 + Math.random() * 0.10; // Random bounciness
  }

  update(gravity: number, canvasHeight: number, canvasWidth: number) {
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Floor collision
    if (this.y + this.height > canvasHeight) {
      this.y = canvasHeight - this.height;
      this.vy *= -this.bounce;
      
      // Stop bouncing if velocity is low
      if (Math.abs(this.vy) < gravity * 2) {
          this.vy = 0; 
      }
    }

    // Walls (optional, classic one lets them fly off)
    // We let them fly off screen to clear up eventually
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw Card Body (White Rect with Border)
    ctx.fillStyle = '#fcfaf5';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    
    // Rounded rect path
    const r = this.width * 0.06;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, r);
    ctx.fill();
    ctx.stroke();

    // Draw Rank/Suit Top Left
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.width * 0.25}px "Crimson Pro", serif`;
    ctx.textAlign = 'center';
    
    const rankStr = this.rank === 1 ? 'A' : this.rank === 11 ? 'J' : this.rank === 12 ? 'Q' : this.rank === 13 ? 'K' : this.rank.toString();
    const padding = this.width * 0.15;
    
    // Top Left
    ctx.fillText(rankStr, this.x + padding, this.y + padding + (this.width * 0.1));
    
    // Draw Simple Suit (Emoji works great for canvas text)
    let suitChar = '';
    switch(this.suit) {
        case Suit.Hearts: suitChar = '♥'; break;
        case Suit.Diamonds: suitChar = '♦'; break;
        case Suit.Clubs: suitChar = '♣'; break;
        case Suit.Spades: suitChar = '♠'; break;
    }
    
    ctx.font = `${this.width * 0.25}px sans-serif`;
    ctx.fillText(suitChar, this.x + padding, this.y + padding + (this.width * 0.35));

    // Center Suit (Large)
    ctx.font = `${this.width * 0.6}px sans-serif`;
    ctx.fillText(suitChar, this.x + (this.width / 2), this.y + (this.height / 2) + (this.width * 0.2));

    ctx.restore();
  }
}

export const WinningBounce: React.FC<WinningBounceProps> = ({ foundation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const cards: BouncingCard[] = [];
    const gravity = 0.8; // Gravity constant

    // Prepare queue of cards to drop
    // We take all cards from foundation and put them in a queue to release
    const cardQueue: { suit: Suit, rank: Rank, startX: number }[] = [];
    
    // Calculate foundation positions roughly (based on screen layout assumptions for simplicity)
    // Foundation slots usually start at right side.
    // Let's approximate positions based on standard layout width
    // 8 slots total width approx 1000px. Foundation is last 4.
    // 0-3 Free/Stock, 4-7 Foundation.
    const slotWidth = Math.min(width / 8, 140); // Approx
    const startXBase = width > 1024 ? (width - 1000) / 2 + (4 * (1000/8)) : width * 0.5;

    [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades].forEach((suit, idx) => {
        const pile = foundation[suit];
        // Reverse so Kings drop first, or Aces? Classic is King down to Ace? 
        // Actually usually they peel off the top. So King first.
        const reversed = [...pile].reverse();
        reversed.forEach(card => {
             // Calculate visual start X for this pile
             // This is a rough estimation to make them appear to come from the pile
             const pileX = startXBase + (idx * slotWidth * 1.1) + 20;
             cardQueue.push({ suit: card.suit, rank: card.rank, startX: pileX });
        });
    });

    let animationId: number;
    let frameCount = 0;
    
    // We do NOT clearRect to create the trail effect!
    // But we might want to dim the background slightly so trails fade very slowly?
    // Classic doesn't fade. But for modern look, maybe no fade.
    
    const animate = () => {
      // Spawn new card every few frames
      if (frameCount % 8 === 0 && cardQueue.length > 0) {
          const nextCard = cardQueue.shift();
          if (nextCard) {
             // Y start roughly top row
             cards.push(new BouncingCard(nextCard.startX, 100, nextCard.suit, nextCard.rank, width));
          }
      }

      // Update and Draw
      cards.forEach(card => {
          card.update(gravity, height, width);
          card.draw(ctx);
      });

      // Remove cards that are way off screen (horizontal) to save memory?
      // For short animation (6s), 52 cards is fine.

      frameCount++;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [foundation]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[160]" />;
};
