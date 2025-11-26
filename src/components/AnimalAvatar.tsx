import React from 'react';
import { CharacterOptions } from './CharacterCustomizer';

interface AnimalAvatarProps {
  options: CharacterOptions;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AnimalAvatar({ options, color, size = 'md', className = '' }: AnimalAvatarProps) {
  const sizes = {
    xs: 'w-10 h-10',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const renderAnimal = (type: number) => {
    const animalType = type % 15;
    
    switch (animalType) {
      case 0: // Hedgehog
        return (
          <g>
            <circle cx="60" cy="70" r="25" fill="#D2A679" />
            {/* Spikes */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 - 60) * Math.PI / 180;
              const x = 60 + 25 * Math.cos(angle);
              const y = 70 + 25 * Math.sin(angle);
              return (
                <line key={i} x1="60" y1="70" x2={x} y2={y} stroke="#8B6F47" strokeWidth="3" strokeLinecap="round" />
              );
            })}
            <circle cx="60" cy="70" r="20" fill="#D2A679" />
            {/* Face */}
            <ellipse cx="52" cy="68" rx="2" ry="3" fill="#000" />
            <ellipse cx="68" cy="68" rx="2" ry="3" fill="#000" />
            <circle cx="60" cy="75" r="2" fill="#000" />
            <path d="M 58 75 Q 60 77 62 75" stroke="#000" strokeWidth="1.5" fill="none" />
          </g>
        );
      
      case 1: // Rabbit
        return (
          <g>
            {/* Ears */}
            <ellipse cx="48" cy="40" rx="8" ry="20" fill="#E8D4B8" />
            <ellipse cx="72" cy="40" rx="8" ry="20" fill="#E8D4B8" />
            <ellipse cx="48" cy="42" rx="4" ry="12" fill="#FFC0CB" />
            <ellipse cx="72" cy="42" rx="4" ry="12" fill="#FFC0CB" />
            {/* Head */}
            <circle cx="60" cy="70" r="28" fill="#E8D4B8" />
            {/* Eyes */}
            <circle cx="52" cy="68" r="3" fill="#000" />
            <circle cx="68" cy="68" r="3" fill="#000" />
            {/* Nose */}
            <ellipse cx="60" cy="76" rx="3" ry="4" fill="#FFC0CB" />
            {/* Mouth */}
            <path d="M 60 76 L 60 80" stroke="#000" strokeWidth="1.5" />
            <path d="M 54 82 Q 60 85 66 82" stroke="#000" strokeWidth="1.5" fill="none" />
            {/* Whiskers */}
            <line x1="40" y1="74" x2="50" y2="73" stroke="#000" strokeWidth="1" />
            <line x1="40" y1="78" x2="50" y2="77" stroke="#000" strokeWidth="1" />
            <line x1="70" y1="73" x2="80" y2="74" stroke="#000" strokeWidth="1" />
            <line x1="70" y1="77" x2="80" y2="78" stroke="#000" strokeWidth="1" />
          </g>
        );
      
      case 2: // Cat
        return (
          <g>
            {/* Ears */}
            <polygon points="42,50 48,35 54,50" fill="#A67C52" />
            <polygon points="66,50 72,35 78,50" fill="#A67C52" />
            {/* Head */}
            <circle cx="60" cy="70" r="28" fill="#A67C52" />
            {/* Stripes */}
            <path d="M 45 60 Q 48 58 51 60" stroke="#8B5A3C" strokeWidth="2" fill="none" />
            <path d="M 69 60 Q 72 58 75 60" stroke="#8B5A3C" strokeWidth="2" fill="none" />
            {/* Eyes */}
            <ellipse cx="52" cy="68" rx="4" ry="6" fill="#F4D03F" />
            <ellipse cx="52" cy="70" rx="2" ry="4" fill="#000" />
            <ellipse cx="68" cy="68" rx="4" ry="6" fill="#F4D03F" />
            <ellipse cx="68" cy="70" rx="2" ry="4" fill="#000" />
            {/* Nose */}
            <polygon points="60,74 57,77 63,77" fill="#FFB6C1" />
            {/* Mouth */}
            <path d="M 60 77 Q 54 82 50 80" stroke="#000" strokeWidth="1.5" fill="none" />
            <path d="M 60 77 Q 66 82 70 80" stroke="#000" strokeWidth="1.5" fill="none" />
            {/* Whiskers */}
            <line x1="35" y1="72" x2="48" y2="72" stroke="#000" strokeWidth="1" />
            <line x1="35" y1="76" x2="48" y2="76" stroke="#000" strokeWidth="1" />
            <line x1="72" y1="72" x2="85" y2="72" stroke="#000" strokeWidth="1" />
            <line x1="72" y1="76" x2="85" y2="76" stroke="#000" strokeWidth="1" />
          </g>
        );
      
      case 3: // Frog
        return (
          <g>
            {/* Body */}
            <ellipse cx="60" cy="75" rx="30" ry="25" fill="#6FA568" />
            {/* Eyes */}
            <circle cx="48" cy="60" r="12" fill="#6FA568" />
            <circle cx="72" cy="60" r="12" fill="#6FA568" />
            <circle cx="48" cy="60" r="8" fill="#FFF" />
            <circle cx="72" cy="60" r="8" fill="#FFF" />
            <circle cx="48" cy="60" r="4" fill="#000" />
            <circle cx="72" cy="60" r="4" fill="#000" />
            {/* Mouth */}
            <path d="M 50 80 Q 60 85 70 80" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Spots */}
            <circle cx="50" cy="78" r="3" fill="#4A7C59" opacity="0.5" />
            <circle cx="70" cy="78" r="3" fill="#4A7C59" opacity="0.5" />
          </g>
        );
      
      case 4: // Lion
        return (
          <g>
            {/* Mane */}
            {[...Array(16)].map((_, i) => {
              const angle = (i * 22.5) * Math.PI / 180;
              const x = 60 + 35 * Math.cos(angle);
              const y = 70 + 35 * Math.sin(angle);
              return (
                <circle key={i} cx={x} cy={y} r="8" fill="#F4A460" />
              );
            })}
            {/* Head */}
            <circle cx="60" cy="70" r="25" fill="#F4C430" />
            {/* Eyes */}
            <circle cx="52" cy="68" r="3" fill="#000" />
            <circle cx="68" cy="68" r="3" fill="#000" />
            {/* Nose */}
            <circle cx="60" cy="76" r="4" fill="#D2691E" />
            {/* Mouth */}
            <path d="M 60 76 L 60 80" stroke="#000" strokeWidth="1.5" />
            <path d="M 52 82 Q 60 86 68 82" stroke="#000" strokeWidth="1.5" fill="none" />
          </g>
        );
      
      case 5: // Dog
        return (
          <g>
            {/* Ears */}
            <ellipse cx="45" cy="65" rx="10" ry="18" fill="#A8D8EA" />
            <ellipse cx="75" cy="65" rx="10" ry="18" fill="#A8D8EA" />
            {/* Head */}
            <circle cx="60" cy="70" r="28" fill="#E6F3F5" />
            {/* Tongue */}
            <ellipse cx="60" cy="88" rx="8" ry="10" fill="#FF6B9D" />
            {/* Eyes */}
            <circle cx="52" cy="68" r="4" fill="#000" />
            <circle cx="68" cy="68" r="4" fill="#000" />
            <circle cx="53" cy="67" r="1.5" fill="#FFF" />
            <circle cx="69" cy="67" r="1.5" fill="#FFF" />
            {/* Nose */}
            <ellipse cx="60" cy="78" rx="4" ry="3" fill="#000" />
            {/* Spots */}
            <circle cx="50" cy="80" r="5" fill="#A8D8EA" opacity="0.5" />
            <circle cx="70" cy="76" r="6" fill="#A8D8EA" opacity="0.5" />
          </g>
        );
      
      case 6: // Horse
        return (
          <g>
            {/* Mane */}
            <path d="M 55 40 Q 50 50 48 60 L 52 60 Q 53 50 57 40" fill="#6B4423" />
            <path d="M 60 35 Q 58 45 57 55 L 61 55 Q 62 45 63 35" fill="#8B6F47" />
            <path d="M 65 40 Q 67 50 68 60 L 72 60 Q 70 50 68 40" fill="#6B4423" />
            {/* Head */}
            <ellipse cx="60" cy="75" rx="22" ry="28" fill="#8B6F47" />
            {/* Snout */}
            <ellipse cx="60" cy="88" rx="15" ry="12" fill="#A0826D" />
            {/* Eyes */}
            <circle cx="52" cy="70" r="4" fill="#000" />
            <circle cx="68" cy="70" r="4" fill="#000" />
            <circle cx="53" cy="69" r="1.5" fill="#FFF" />
            <circle cx="69" cy="69" r="1.5" fill="#FFF" />
            {/* Nostrils */}
            <ellipse cx="55" cy="90" rx="2" ry="3" fill="#000" />
            <ellipse cx="65" cy="90" rx="2" ry="3" fill="#000" />
          </g>
        );
      
      case 7: // Monkey
        return (
          <g>
            {/* Ears */}
            <circle cx="38" cy="65" r="12" fill="#8B6F47" />
            <circle cx="82" cy="65" r="12" fill="#8B6F47" />
            <circle cx="38" cy="65" r="7" fill="#D2A679" />
            <circle cx="82" cy="65" r="7" fill="#D2A679" />
            {/* Head */}
            <circle cx="60" cy="70" r="30" fill="#8B6F47" />
            {/* Face */}
            <ellipse cx="60" cy="78" rx="20" ry="16" fill="#D2A679" />
            {/* Eyes */}
            <circle cx="52" cy="68" r="5" fill="#000" />
            <circle cx="68" cy="68" r="5" fill="#000" />
            <circle cx="53.5" cy="66.5" r="2" fill="#FFF" />
            <circle cx="69.5" cy="66.5" r="2" fill="#FFF" />
            {/* Nose */}
            <ellipse cx="58" cy="78" rx="2" ry="3" fill="#000" />
            <ellipse cx="62" cy="78" rx="2" ry="3" fill="#000" />
            {/* Mouth */}
            <path d="M 54 84 Q 60 88 66 84" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        );
      
      case 8: // Pufferfish
        return (
          <g>
            {/* Body */}
            <circle cx="60" cy="70" r="28" fill="#F4E04D" />
            {/* Spikes */}
            {[...Array(20)].map((_, i) => {
              const angle = (i * 18) * Math.PI / 180;
              const x1 = 60 + 28 * Math.cos(angle);
              const y1 = 70 + 28 * Math.sin(angle);
              const x2 = 60 + 38 * Math.cos(angle);
              const y2 = 70 + 38 * Math.sin(angle);
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
              );
            })}
            {/* Stripes */}
            <path d="M 48 60 Q 60 62 72 60" stroke="#D4AF37" strokeWidth="2" fill="none" />
            <path d="M 48 70 Q 60 72 72 70" stroke="#D4AF37" strokeWidth="2" fill="none" />
            <path d="M 48 80 Q 60 82 72 80" stroke="#D4AF37" strokeWidth="2" fill="none" />
            {/* Eyes */}
            <circle cx="52" cy="66" r="5" fill="#000" />
            <circle cx="68" cy="66" r="5" fill="#000" />
            <circle cx="53.5" cy="64.5" r="2" fill="#FFF" />
            <circle cx="69.5" cy="64.5" r="2" fill="#FFF" />
            {/* Mouth */}
            <ellipse cx="60" cy="78" rx="6" ry="4" fill="#000" opacity="0.5" />
          </g>
        );
      
      case 9: // Koala
        return (
          <g>
            {/* Ears */}
            <circle cx="42" cy="52" r="16" fill="#9CA3A8" />
            <circle cx="78" cy="52" r="16" fill="#9CA3A8" />
            <circle cx="42" cy="52" r="10" fill="#FFF" />
            <circle cx="78" cy="52" r="10" fill="#FFF" />
            {/* Head */}
            <circle cx="60" cy="75" r="28" fill="#9CA3A8" />
            {/* Nose */}
            <ellipse cx="60" cy="76" rx="12" ry="10" fill="#000" />
            {/* Eyes */}
            <circle cx="50" cy="68" r="5" fill="#000" />
            <circle cx="70" cy="68" r="5" fill="#000" />
            <circle cx="51.5" cy="66.5" r="2" fill="#FFF" />
            <circle cx="71.5" cy="66.5" r="2" fill="#FFF" />
          </g>
        );
      
      case 10: // Bear
        return (
          <g>
            {/* Ears */}
            <circle cx="42" cy="50" r="14" fill="#8B6F47" />
            <circle cx="78" cy="50" r="14" fill="#8B6F47" />
            {/* Head */}
            <circle cx="60" cy="72" r="30" fill="#A0826D" />
            {/* Snout */}
            <ellipse cx="60" cy="82" rx="16" ry="14" fill="#D2A679" />
            {/* Eyes */}
            <circle cx="50" cy="68" r="4" fill="#000" />
            <circle cx="70" cy="68" r="4" fill="#000" />
            {/* Nose */}
            <ellipse cx="60" cy="80" rx="5" ry="4" fill="#000" />
            {/* Mouth */}
            <path d="M 60 80 L 60 85" stroke="#000" strokeWidth="1.5" />
            <path d="M 54 87 Q 60 90 66 87" stroke="#000" strokeWidth="1.5" fill="none" />
          </g>
        );
      
      case 11: // Raccoon
        return (
          <g>
            {/* Ears */}
            <polygon points="44,48 48,38 54,48" fill="#4A4A4A" />
            <polygon points="66,48 72,38 76,48" fill="#4A4A4A" />
            {/* Head */}
            <circle cx="60" cy="72" r="28" fill="#8B8680" />
            {/* Mask */}
            <ellipse cx="50" cy="68" rx="10" ry="8" fill="#2C2C2C" />
            <ellipse cx="70" cy="68" rx="10" ry="8" fill="#2C2C2C" />
            <path d="M 40 70 Q 60 65 80 70" fill="#2C2C2C" />
            {/* Eyes */}
            <circle cx="50" cy="68" r="4" fill="#FFF" />
            <circle cx="70" cy="68" r="4" fill="#FFF" />
            <circle cx="50" cy="68" r="2" fill="#000" />
            <circle cx="70" cy="68" r="2" fill="#000" />
            {/* Nose */}
            <ellipse cx="60" cy="78" rx="4" ry="3" fill="#000" />
            {/* Mouth */}
            <path d="M 60 78 Q 54 82 50 80" stroke="#000" strokeWidth="1.5" fill="none" />
            <path d="M 60 78 Q 66 82 70 80" stroke="#000" strokeWidth="1.5" fill="none" />
          </g>
        );
      
      case 12: // Fox
        return (
          <g>
            {/* Ears */}
            <polygon points="42,44 48,30 54,48" fill="#FF8C42" />
            <polygon points="66,48 72,30 78,44" fill="#FF8C42" />
            <polygon points="45,44 48,35 51,46" fill="#FFF" />
            <polygon points="69,46 72,35 75,44" fill="#FFF" />
            {/* Head */}
            <circle cx="60" cy="72" r="26" fill="#FF8C42" />
            {/* Snout */}
            <ellipse cx="60" cy="80" rx="14" ry="12" fill="#FFF" />
            {/* Eyes */}
            <circle cx="52" cy="68" r="4" fill="#000" />
            <circle cx="68" cy="68" r="4" fill="#000" />
            <circle cx="53" cy="67" r="1.5" fill="#FFF" />
            <circle cx="69" cy="67" r="1.5" fill="#FFF" />
            {/* Nose */}
            <circle cx="60" cy="78" r="3" fill="#000" />
            {/* Mouth */}
            <path d="M 60 78 Q 54 82 50 80" stroke="#000" strokeWidth="1.5" fill="none" />
            <path d="M 60 78 Q 66 82 70 80" stroke="#000" strokeWidth="1.5" fill="none" />
          </g>
        );
      
      case 13: // Parrot
        return (
          <g>
            {/* Crest */}
            <path d="M 50 40 Q 55 30 60 28 Q 65 30 70 40" fill="#9B59B6" />
            <path d="M 52 42 Q 57 34 60 32 Q 63 34 68 42" fill="#E74C3C" />
            {/* Head */}
            <circle cx="60" cy="70" r="28" fill="#9B59B6" />
            {/* Beak */}
            <path d="M 60 75 Q 68 78 66 84 Q 60 82 60 75" fill="#FFD700" />
            <path d="M 60 75 Q 52 78 54 84 Q 60 82 60 75" fill="#F39C12" />
            {/* Eyes */}
            <circle cx="52" cy="66" r="6" fill="#FFF" />
            <circle cx="68" cy="66" r="6" fill="#FFF" />
            <circle cx="52" cy="66" r="3" fill="#000" />
            <circle cx="68" cy="66" r="3" fill="#000" />
            {/* Cheek patch */}
            <ellipse cx="45" cy="74" rx="6" ry="8" fill="#E74C3C" />
            <ellipse cx="75" cy="74" rx="6" ry="8" fill="#E74C3C" />
          </g>
        );
      
      case 14: // Shark
        return (
          <g>
            {/* Dorsal fin */}
            <polygon points="50,35 60,20 70,45" fill="#7C98AB" />
            {/* Body */}
            <ellipse cx="60" cy="75" rx="32" ry="22" fill="#8EACBB" />
            {/* Belly */}
            <ellipse cx="60" cy="85" rx="22" ry="12" fill="#E6F3F5" />
            {/* Eyes */}
            <circle cx="50" cy="68" r="4" fill="#000" />
            <circle cx="70" cy="68" r="4" fill="#000" />
            {/* Mouth */}
            <path d="M 45 80 Q 60 85 75 80" stroke="#000" strokeWidth="2" fill="none" />
            {/* Teeth */}
            <polygon points="48,80 50,84 52,80" fill="#FFF" />
            <polygon points="56,81 58,85 60,81" fill="#FFF" />
            <polygon points="64,81 66,85 68,81" fill="#FFF" />
            <polygon points="72,80 74,84 76,80" fill="#FFF" />
            {/* Gills */}
            <path d="M 38 72 Q 40 74 38 76" stroke="#000" strokeWidth="1.5" fill="none" />
            <path d="M 34 74 Q 36 76 34 78" stroke="#000" strokeWidth="1.5" fill="none" />
          </g>
        );
      
      default:
        return renderAnimal(0);
    }
  };

  return (
    <div 
      className={`${sizes[size]} ${className} rounded-full flex items-center justify-center relative overflow-hidden`}
      style={{ 
        background: `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -15)} 100%)`,
        boxShadow: `0 10px 30px -10px ${adjustBrightness(color, -40)}`
      }}
    >
      <svg width="100%" height="100%" viewBox="20 20 80 100" preserveAspectRatio="xMidYMid meet">
        {renderAnimal(options.animalType)}
      </svg>
    </div>
  );
}

// Helper to darken/lighten hex color
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}