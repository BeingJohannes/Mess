import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  color: string;
  size: number;
}

interface ColorfulToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  showConfetti?: boolean;
}

export function ColorfulToast({ message, type = 'info', showConfetti = false }: ColorfulToastProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  
  // Color schemes for different toast types - using vibrant game colors
  const colorSchemes = {
    success: {
      background: 'linear-gradient(135deg, #00FFB3 0%, #00D9FF 100%)',
      text: '#064e3b',
      shadow: '0 8px 32px rgba(0, 217, 255, 0.5), 0 4px 16px rgba(0, 255, 179, 0.4)',
    },
    info: {
      background: 'linear-gradient(135deg, #00D9FF 0%, #A855F7 100%)',
      text: '#1e3a8a',
      shadow: '0 8px 32px rgba(0, 217, 255, 0.5), 0 4px 16px rgba(168, 85, 247, 0.4)',
    },
    warning: {
      background: 'linear-gradient(135deg, #FFD600 0%, #FF6B00 100%)',
      text: '#78350f',
      shadow: '0 8px 32px rgba(255, 214, 0, 0.5), 0 4px 16px rgba(255, 107, 0, 0.4)',
    },
    error: {
      background: 'linear-gradient(135deg, #FF00E5 0%, #FF6B00 100%)',
      text: '#7f1d1d',
      shadow: '0 8px 32px rgba(255, 0, 229, 0.5), 0 4px 16px rgba(255, 107, 0, 0.4)',
    },
  };
  
  const scheme = colorSchemes[type];
  
  useEffect(() => {
    if (showConfetti) {
      const confettiColors = ['#00D9FF', '#FF00E5', '#FF6B00', '#FFD600', '#00FFB3'];
      const pieces: ConfettiPiece[] = [];
      
      for (let i = 0; i < 15; i++) {
        pieces.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.3,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          size: Math.random() * 8 + 4,
        });
      }
      
      setConfetti(pieces);
    }
  }, [showConfetti]);
  
  return (
    <div className="relative">
      {/* Confetti */}
      {showConfetti && confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute pointer-events-none"
          style={{
            left: `${piece.left}%`,
            top: '50%',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-burst 0.8s ease-out ${piece.delay}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      
      {/* Toast Content */}
      <div
        className="flex items-center gap-3 px-8 py-4 rounded-2xl min-w-[300px] max-w-[600px]"
        style={{
          background: scheme.background,
          color: scheme.text,
          boxShadow: scheme.shadow,
        }}
      >
        {showConfetti && (
          <Sparkles className="w-6 h-6 flex-shrink-0" style={{ animation: 'bounce-subtle 1s ease-in-out infinite' }} />
        )}
        <span className="text-base font-bold leading-tight">{message}</span>
      </div>
    </div>
  );
}