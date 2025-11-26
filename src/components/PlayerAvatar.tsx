import React from 'react';

interface PlayerAvatarProps {
  seed: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlayerAvatar({ seed, color, size = 'md', className = '' }: PlayerAvatarProps) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };
  
  // Generate avatar features based on seed
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const characterType = hash % 8; // 8 different character types
  const hairStyle = (hash * 7) % 5; // 5 hair styles
  
  // Create vibrant background with subtle gradient
  const createBackground = (baseColor: string) => {
    return `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}CC 100%)`;
  };
  
  return (
    <div 
      className={`${sizes[size]} ${className} rounded-full flex items-center justify-center relative overflow-hidden`}
      style={{ 
        background: createBackground(color),
        boxShadow: `0 4px 16px ${color}50, inset 0 2px 4px rgba(255,255,255,0.3)`
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: 'scale(1.1)' }}>
        {/* Character types with different styles */}
        
        {/* Hairstyle/Head decoration */}
        {hairStyle === 0 && (
          // Spiky hair
          <>
            <path d="M 45 35 Q 40 25 45 20 Q 50 25 50 30" fill="rgba(0,0,0,0.2)" />
            <path d="M 55 30 Q 60 25 65 20 Q 70 25 65 30" fill="rgba(0,0,0,0.2)" />
            <path d="M 50 25 Q 55 18 60 20" fill="rgba(0,0,0,0.2)" />
          </>
        )}
        {hairStyle === 1 && (
          // Curly top
          <ellipse cx="60" cy="35" rx="18" ry="15" fill="rgba(0,0,0,0.25)" />
        )}
        {hairStyle === 2 && (
          // Side swept
          <path d="M 45 35 Q 35 30 40 25 L 60 30 Z" fill="rgba(0,0,0,0.2)" />
        )}
        {hairStyle === 3 && (
          // Bun/Top knot
          <circle cx="60" cy="30" r="8" fill="rgba(0,0,0,0.25)" />
        )}
        {hairStyle === 4 && (
          // Long hair
          <>
            <path d="M 40 40 Q 35 50 38 65 L 45 60 Z" fill="rgba(0,0,0,0.2)" />
            <path d="M 80 40 Q 85 50 82 65 L 75 60 Z" fill="rgba(0,0,0,0.2)" />
          </>
        )}
        
        {/* Main head - 3D sphere effect */}
        <defs>
          <radialGradient id={`head-${seed}`} cx="40%" cy="35%">
            <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.9 }} />
            <stop offset="70%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.3 }} />
          </radialGradient>
        </defs>
        
        <circle 
          cx="60" 
          cy="60" 
          r="32" 
          fill={`url(#head-${seed})`}
        />
        
        {/* Different character expressions */}
        {characterType === 0 && (
          // Happy with big eyes
          <>
            <circle cx="50" cy="55" r="5" fill="rgba(0,0,0,0.8)" />
            <circle cx="70" cy="55" r="5" fill="rgba(0,0,0,0.8)" />
            <circle cx="48" cy="53" r="2" fill="white" />
            <circle cx="68" cy="53" r="2" fill="white" />
            <path d="M 47 68 Q 60 76 73 68" stroke="rgba(0,0,0,0.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        {characterType === 1 && (
          // Winking
          <>
            <circle cx="50" cy="55" r="5" fill="rgba(0,0,0,0.8)" />
            <circle cx="48" cy="53" r="2" fill="white" />
            <line x1="65" y1="55" x2="75" y2="55" stroke="rgba(0,0,0,0.8)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 47 68 Q 60 75 73 68" stroke="rgba(0,0,0,0.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        )}
        {characterType === 2 && (
          // Surprised
          <>
            <circle cx="50" cy="54" r="6" fill="rgba(0,0,0,0.8)" />
            <circle cx="70" cy="54" r="6" fill="rgba(0,0,0,0.8)" />
            <circle cx="48" cy="52" r="2.5" fill="white" />
            <circle cx="68" cy="52" r="2.5" fill="white" />
            <ellipse cx="60" cy="68" rx="6" ry="8" fill="rgba(0,0,0,0.6)" />
          </>
        )}
        {characterType === 3 && (
          // Cool glasses
          <>
            <rect x="42" y="52" width="14" height="10" rx="3" fill="rgba(0,0,0,0.7)" />
            <rect x="64" y="52" width="14" height="10" rx="3" fill="rgba(0,0,0,0.7)" />
            <line x1="56" y1="57" x2="64" y2="57" stroke="rgba(0,0,0,0.7)" strokeWidth="2" />
            <path d="M 48 68 Q 60 73 72 68" stroke="rgba(0,0,0,0.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )}
        {characterType === 4 && (
          // Sleepy/Relaxed
          <>
            <path d="M 44 55 Q 50 52 56 55" stroke="rgba(0,0,0,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 64 55 Q 70 52 76 55" stroke="rgba(0,0,0,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 50 68 Q 60 72 70 68" stroke="rgba(0,0,0,0.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )}
        {characterType === 5 && (
          // Laughing
          <>
            <path d="M 44 55 Q 50 50 56 55" stroke="rgba(0,0,0,0.8)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 64 55 Q 70 50 76 55" stroke="rgba(0,0,0,0.8)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 45 65 Q 60 78 75 65" stroke="rgba(0,0,0,0.8)" strokeWidth="3" fill="rgba(0,0,0,0.2)" strokeLinecap="round" />
          </>
        )}
        {characterType === 6 && (
          // Star eyes
          <>
            <path d="M 50 55 L 52 59 L 56 60 L 52 62 L 50 66 L 48 62 L 44 60 L 48 59 Z" fill="rgba(0,0,0,0.8)" />
            <path d="M 70 55 L 72 59 L 76 60 L 72 62 L 70 66 L 68 62 L 64 60 L 68 59 Z" fill="rgba(0,0,0,0.8)" />
            <path d="M 48 68 Q 60 76 72 68" stroke="rgba(0,0,0,0.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        {characterType === 7 && (
          // Heart eyes
          <>
            <path d="M 50 52 Q 46 50 44 53 Q 44 56 50 60 Q 56 56 56 53 Q 56 50 52 52 Z" fill="rgba(255,100,150,0.8)" />
            <path d="M 70 52 Q 66 50 64 53 Q 64 56 70 60 Q 76 56 76 53 Q 76 50 72 52 Z" fill="rgba(255,100,150,0.8)" />
            <path d="M 48 68 Q 60 76 72 68" stroke="rgba(0,0,0,0.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        
        {/* Nose */}
        <ellipse cx="60" cy="62" rx="2" ry="2.5" fill="rgba(0,0,0,0.3)" />
        
        {/* Rosy cheeks */}
        <ellipse cx="42" cy="63" rx="6" ry="4" fill="rgba(255,150,200,0.4)" />
        <ellipse cx="78" cy="63" rx="6" ry="4" fill="rgba(255,150,200,0.4)" />
        
        {/* Shine/highlight on head */}
        <ellipse cx="50" cy="48" rx="8" ry="6" fill="rgba(255,255,255,0.5)" />
      </svg>
    </div>
  );
}