import React from 'react';
import { CharacterOptions, skinColors } from './CharacterCustomizer';

interface Character3DAvatarProps {
  options: CharacterOptions;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Character3DAvatar({ options, color, size = 'md', className = '' }: Character3DAvatarProps) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };
  
  const skinColor = skinColors[options.skinTone];
  const darkerSkin = adjustBrightness(skinColor, -30);
  const lighterSkin = adjustBrightness(skinColor, 20);
  
  // Outfit color logic
  const outfitColor = adjustBrightness(color, -20);
  const outfitHighlight = adjustBrightness(color, 10);
  const outfitDark = adjustBrightness(color, -40);
  
  return (
    <div 
      className={`${sizes[size]} ${className} rounded-full flex items-center justify-center relative overflow-hidden`}
      style={{ 
        background: `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -15)} 100%)`,
        boxShadow: `0 10px 30px -10px ${adjustBrightness(color, -40)}`
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ overflow: 'visible' }}>
        <defs>
          {/* Head Gradient - Clay style */}
          <radialGradient id={`head-gradient-${options.skinTone}`} cx="30%" cy="30%" r="90%">
            <stop offset="0%" style={{ stopColor: lighterSkin }} />
            <stop offset="50%" style={{ stopColor: skinColor }} />
            <stop offset="100%" style={{ stopColor: darkerSkin }} />
          </radialGradient>
          
          {/* Body Gradient */}
          <linearGradient id={`body-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: outfitHighlight }} />
            <stop offset="100%" style={{ stopColor: outfitColor }} />
          </linearGradient>

          {/* Drop Shadow for features */}
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
            <feOffset dx="0" dy="1.5" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Hair texture gradient */}
          <linearGradient id="hair-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3a2a2d' }} />
            <stop offset="50%" style={{ stopColor: '#2C1A1D' }} />
            <stop offset="100%" style={{ stopColor: '#1a1012' }} />
          </linearGradient>
          
          <radialGradient id="hair-highlight" cx="30%" cy="20%">
            <stop offset="0%" style={{ stopColor: '#6a5a5d', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#2C1A1D', stopOpacity: 1 }} />
          </radialGradient>
        </defs>
        
        <g transform="translate(0, 10)">
          {/* Back Hair Layer */}
          {renderBackHair(options.hairStyle, skinColor)}

          {/* Body/Shoulders - Detailed Clothing */}
          <g>
            {/* Neck */}
            <ellipse cx="60" cy="85" rx="8" ry="10" fill={darkerSkin} />
            
            {/* Main shirt with sleeves */}
            <path 
              d="M 25 88 Q 30 84 40 82 L 50 82 L 50 120 L 25 120 Z" 
              fill={outfitDark}
              opacity="0.8"
            />
            <path 
              d="M 70 82 L 80 82 Q 90 84 95 88 L 95 120 L 70 120 Z" 
              fill={outfitDark}
              opacity="0.8"
            />
            
            {/* Main torso */}
            <path 
              d="M 40 82 L 80 82 Q 85 85 85 95 L 85 120 L 35 120 L 35 95 Q 35 85 40 82 Z" 
              fill={`url(#body-gradient-${color})`}
              filter="url(#soft-shadow)"
            />
            
            {/* Collar - more realistic */}
            <g>
              <path 
                d="M 50 82 L 45 88 L 50 90 L 55 85 Z" 
                fill={outfitDark}
              />
              <path 
                d="M 70 82 L 75 88 L 70 90 L 65 85 Z" 
                fill={outfitDark}
              />
              <path 
                d="M 55 85 L 60 88 L 65 85" 
                fill={outfitDark}
                stroke={outfitDark}
                strokeWidth="1"
              />
            </g>
            
            {/* Buttons */}
            <circle cx="60" cy="95" r="1.5" fill={outfitDark} opacity="0.7" />
            <circle cx="60" cy="102" r="1.5" fill={outfitDark} opacity="0.7" />
            <circle cx="60" cy="109" r="1.5" fill={outfitDark} opacity="0.7" />
            
            {/* Fabric folds and details */}
            <path d="M 42 95 Q 60 97 78 95" fill="none" stroke={adjustBrightness(outfitColor, -25)} strokeWidth="0.5" opacity="0.3"/>
            <path d="M 40 105 Q 60 108 80 105" fill="none" stroke={adjustBrightness(outfitColor, 20)} strokeWidth="0.5" opacity="0.4"/>
            
            {/* Sleeve shadows */}
            <ellipse cx="38" cy="95" rx="3" ry="8" fill={outfitDark} opacity="0.2" />
            <ellipse cx="82" cy="95" rx="3" ry="8" fill={outfitDark} opacity="0.2" />
          </g>

          {/* Head */}
          <rect
            x="32"
            y="28"
            width="56"
            height="62"
            rx="24"
            fill={`url(#head-gradient-${options.skinTone})`}
            filter="url(#soft-shadow)"
          />
          
          {/* Ears - more detailed */}
          <g>
            <ellipse cx="30" cy="60" rx="5" ry="8" fill={darkerSkin} />
            <ellipse cx="32" cy="60" rx="2" ry="4" fill={adjustBrightness(skinColor, -15)} />
            <ellipse cx="90" cy="60" rx="5" ry="8" fill={darkerSkin} />
            <ellipse cx="88" cy="60" rx="2" ry="4" fill={adjustBrightness(skinColor, -15)} />
          </g>

          {/* Face Highlight (Shine) */}
          <ellipse cx="45" cy="40" rx="12" ry="8" fill="rgba(255,255,255,0.3)" filter="blur(3px)" transform="rotate(-20 45 40)" />

          {/* Nose - subtle */}
          <ellipse cx="60" cy="65" rx="3" ry="2" fill={darkerSkin} opacity="0.15" />
          <circle cx="58" cy="66" r="1" fill={darkerSkin} opacity="0.2" />
          <circle cx="62" cy="66" r="1" fill={darkerSkin} opacity="0.2" />

          {/* Cheeks */}
          <circle cx="42" cy="68" r="7" fill="#FF8DA1" opacity="0.35" filter="blur(3px)" />
          <circle cx="78" cy="68" r="7" fill="#FF8DA1" opacity="0.35" filter="blur(3px)" />

          {/* Eyes - More detailed */}
          <g>
            {/* Eye sockets for depth */}
            <ellipse cx="46" cy="57" rx="8" ry="6" fill={darkerSkin} opacity="0.1" />
            <ellipse cx="74" cy="57" rx="8" ry="6" fill={darkerSkin} opacity="0.1" />
            
            {/* Left Eye */}
            <ellipse cx="46" cy="58" rx="6" ry="7" fill="white" />
            <circle cx="46" cy="59" r="4.5" fill="#2a2a2a" />
            <circle cx="47" cy="58" r="2" fill="#1a1a1a" />
            <circle cx="47.5" cy="56.5" r="1.2" fill="white" opacity="0.9" />
            
            {/* Right Eye */}
            <ellipse cx="74" cy="58" rx="6" ry="7" fill="white" />
            <circle cx="74" cy="59" r="4.5" fill="#2a2a2a" />
            <circle cx="74" cy="58" r="2" fill="#1a1a1a" />
            <circle cx="74.5" cy="56.5" r="1.2" fill="white" opacity="0.9" />
            
            {/* Eyelashes */}
            <path d="M 40 55 Q 42 53 44 55" stroke={darkerSkin} strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M 76 55 Q 78 53 80 55" stroke={darkerSkin} strokeWidth="1" fill="none" opacity="0.6" />
            
            {/* Expression */}
            {renderExpression(options.expression)}
          </g>

          {/* Eyebrows - more natural */}
          <path d="M 38 50 Q 46 48 52 50" stroke={darkerSkin} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M 68 50 Q 76 48 84 50" stroke={darkerSkin} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />

          {/* Front Hair Layer */}
          {renderFrontHair(options.hairStyle, skinColor)}
          
          {/* Accessories */}
          {renderAccessory(options.accessory)}
        </g>
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

function renderBackHair(style: number, skinColor: string) {
  const base = 'url(#hair-gradient)';
  const highlight = 'url(#hair-highlight)';
  
  switch (style % 12) {
    case 1: // Afro - textured
      return (
        <g>
          <circle cx="60" cy="50" r="40" fill={base} opacity="0.95" />
          {/* Texture circles */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            const radius = 35;
            const cx = 60 + radius * Math.cos(angle);
            const cy = 50 + radius * Math.sin(angle);
            return <circle key={i} cx={cx} cy={cy} r="8" fill="#1a1012" opacity="0.3" />;
          })}
        </g>
      );
    case 4: // Long flowing hair
      return (
        <g>
          <path d="M 25 45 Q 20 70 25 95 Q 30 100 35 95 Q 30 70 32 45 Z" fill={base} />
          <path d="M 32 45 Q 28 70 32 95 Q 36 100 40 95 Q 36 70 38 45 Z" fill="#3a2a2d" opacity="0.7" />
          <path d="M 88 45 Q 92 70 88 95 Q 84 100 80 95 Q 84 70 82 45 Z" fill={base} />
          <path d="M 82 45 Q 86 70 82 95 Q 78 100 74 95 Q 78 70 76 45 Z" fill="#3a2a2d" opacity="0.7" />
          <ellipse cx="60" cy="45" rx="35" ry="20" fill={highlight} />
        </g>
      );
    case 5: // Ponytail
      return (
        <g>
          <ellipse cx="85" cy="50" rx="15" ry="18" fill={highlight} />
          {/* Ponytail strands */}
          <path d="M 82 60 Q 88 75 85 90 Q 84 95 82 90 Q 85 75 80 60" fill={base} />
          <path d="M 85 60 Q 92 75 90 90 Q 89 95 87 90 Q 90 75 85 60" fill="#3a2a2d" />
          <path d="M 88 60 Q 95 75 93 88 Q 92 93 90 88 Q 93 75 88 60" fill={base} opacity="0.8" />
          {/* Hair tie */}
          <ellipse cx="85" cy="58" rx="6" ry="3" fill="#E74C3C" />
        </g>
      );
    case 7: // Bob - layered
      return (
        <g>
          <path d="M 25 50 L 25 82 Q 35 88 60 90 Q 85 88 95 82 L 95 50 Z" fill={base} />
          <path d="M 30 55 Q 60 60 90 55 L 90 78 Q 60 82 30 78 Z" fill="#3a2a2d" opacity="0.6" />
          <path d="M 35 60 Q 60 65 85 60" stroke="#6a5a5d" strokeWidth="1.5" fill="none" opacity="0.4" />
          <path d="M 35 70 Q 60 74 85 70" stroke="#6a5a5d" strokeWidth="1.5" fill="none" opacity="0.4" />
        </g>
      );
    case 9: // Pixie
      return (
        <ellipse cx="60" cy="40" rx="32" ry="25" fill={highlight} />
      );
    default:
      return null;
  }
}

function renderFrontHair(style: number, skinColor: string) {
  const base = 'url(#hair-gradient)';
  const hairShadow = "url(#soft-shadow)";

  switch (style % 12) {
    case 0: // Short/Spiky - textured
      return (
        <g filter={hairShadow}>
          <path d="M 32 42 Q 35 20 42 15 L 45 20 Q 40 25 38 42" fill={base} />
          <path d="M 45 38 Q 48 18 52 12 L 55 18 Q 52 22 48 38" fill="#3a2a2d" />
          <path d="M 55 38 Q 58 16 62 10 L 65 16 Q 62 20 58 38" fill={base} />
          <path d="M 65 38 Q 68 16 72 10 L 75 16 Q 72 20 68 38" fill="#3a2a2d" />
          <path d="M 75 38 Q 78 18 82 12 L 85 18 Q 82 22 78 38" fill={base} />
          <path d="M 82 42 Q 85 20 88 15 L 88 20 Q 85 25 85 42" fill="#3a2a2d" />
        </g>
      );
    case 1: // Afro - textured front
      return (
        <g filter={hairShadow}>
          <path d="M 28 52 Q 28 25 45 18 Q 60 20 75 18 Q 92 25 92 52" fill={base} />
          {/* Texture */}
          <circle cx="40" cy="35" r="5" fill="#1a1012" opacity="0.3" />
          <circle cx="52" cy="30" r="5" fill="#1a1012" opacity="0.3" />
          <circle cx="68" cy="30" r="5" fill="#1a1012" opacity="0.3" />
          <circle cx="80" cy="35" r="5" fill="#1a1012" opacity="0.3" />
        </g>
      );
    case 2: // Side part - flowing
      return (
        <g filter={hairShadow}>
          <path d="M 30 45 Q 32 22 48 18 L 50 20 Q 45 25 42 30 Q 38 35 35 45" fill={base} />
          <path d="M 42 40 Q 48 20 58 18 L 60 22 Q 55 28 52 40" fill="#3a2a2d" />
          <path d="M 52 40 Q 60 22 70 20 L 72 24 Q 68 30 65 40" fill={base} />
          <path d="M 65 42 Q 72 25 82 22 L 84 26 Q 80 32 78 42" fill="#3a2a2d" />
          <path d="M 78 45 Q 84 28 90 25 L 90 30 Q 88 35 85 45" fill={base} />
          {/* Highlights */}
          <path d="M 50 25 Q 60 24 70 25" stroke="#6a5a5d" strokeWidth="2" fill="none" opacity="0.5" />
        </g>
      );
    case 3: // Bun - detailed
      return (
        <g filter={hairShadow}>
          {/* Bun on top */}
          <circle cx="60" cy="18" r="16" fill={base} />
          <circle cx="55" cy="16" r="6" fill="#3a2a2d" opacity="0.4" />
          <circle cx="65" cy="16" r="6" fill="#3a2a2d" opacity="0.4" />
          <path d="M 50 22 Q 60 25 70 22" stroke="#1a1012" strokeWidth="1.5" fill="none" opacity="0.3" />
          {/* Front hair */}
          <path d="M 32 42 Q 40 25 60 22 Q 80 25 88 42" fill={base} />
          <path d="M 38 40 Q 50 28 60 26 Q 70 28 82 40" fill="#3a2a2d" opacity="0.6" />
        </g>
      );
    case 4: // Long bangs
      return (
        <g filter={hairShadow}>
          <path d="M 30 42 Q 35 22 45 18 L 48 30 Q 42 35 38 42" fill={base} />
          <path d="M 42 42 Q 48 20 58 18 L 60 32 Q 55 38 52 42" fill="#3a2a2d" />
          <path d="M 52 42 Q 58 20 68 18 L 70 32 Q 65 38 62 42" fill={base} />
          <path d="M 68 42 Q 75 20 85 18 L 85 30 Q 80 35 75 42" fill="#3a2a2d" />
          <path d="M 78 42 Q 85 22 90 20 L 88 32 Q 85 38 82 42" fill={base} />
        </g>
      );
    case 5: // Ponytail front - swept
      return (
        <g filter={hairShadow}>
          <path d="M 30 42 Q 35 18 50 15 Q 60 16 70 15 Q 85 18 90 42" fill={base} />
          <path d="M 35 40 Q 45 22 60 20 Q 75 22 85 40" fill="#3a2a2d" opacity="0.7" />
          <path d="M 48 28 Q 60 26 72 28" stroke="#6a5a5d" strokeWidth="2" fill="none" opacity="0.5" />
        </g>
      );
    case 6: // Mohawk - dramatic
      return (
        <g filter={hairShadow}>
          <path d="M 48 35 Q 52 8 56 5 L 58 10 Q 56 20 54 35" fill={base} />
          <path d="M 54 32 Q 58 6 60 2 L 62 8 Q 60 18 58 32" fill="#3a2a2d" />
          <path d="M 58 32 Q 62 6 64 2 L 66 8 Q 64 18 64 32" fill={base} />
          <path d="M 64 35 Q 68 8 72 5 L 70 10 Q 68 20 66 35" fill="#3a2a2d" />
          {/* Side shave indication */}
          <path d="M 32 45 L 32 50" stroke="#3a2a2d" strokeWidth="1" opacity="0.2" />
          <path d="M 88 45 L 88 50" stroke="#3a2a2d" strokeWidth="1" opacity="0.2" />
        </g>
      );
    case 7: // Bob - smooth
      return (
        <g filter={hairShadow}>
          <path d="M 30 42 Q 35 22 50 18 Q 60 20 70 18 Q 85 22 90 42" fill={base} />
          <path d="M 35 40 Q 45 25 60 22 Q 75 25 85 40" fill="#3a2a2d" opacity="0.6" />
          <ellipse cx="45" cy="30" rx="8" ry="4" fill="#6a5a5d" opacity="0.3" transform="rotate(-25 45 30)" />
          <ellipse cx="75" cy="30" rx="8" ry="4" fill="#6a5a5d" opacity="0.3" transform="rotate(25 75 30)" />
        </g>
      );
    case 8: // Dreads - detailed
      return (
        <g filter={hairShadow}>
          {[35, 42, 49, 56, 63, 70, 77, 84].map((x, i) => (
            <g key={i}>
              <path 
                d={`M ${x} 40 Q ${x + 2} 28 ${x + 3} 18 L ${x + 4} 28 Q ${x + 3} 35 ${x + 2} 45`} 
                fill={i % 2 === 0 ? base : '#3a2a2d'}
                stroke="#1a1012"
                strokeWidth="0.5"
              />
              {/* Texture lines */}
              <line x1={x + 2} y1="25" x2={x + 3} y2="25" stroke="#1a1012" strokeWidth="0.5" opacity="0.3" />
              <line x1={x + 2} y1="32" x2={x + 3} y2="32" stroke="#1a1012" strokeWidth="0.5" opacity="0.3" />
            </g>
          ))}
        </g>
      );
    case 9: // Pixie - layered
      return (
        <g filter={hairShadow}>
          <path d="M 30 46 Q 35 28 50 22 Q 60 20 70 22 Q 85 28 90 46" fill={base} />
          <path d="M 35 44 Q 42 30 60 26 Q 78 30 85 44" fill="#3a2a2d" opacity="0.7" />
          <path d="M 42 40 Q 50 32 60 30 Q 70 32 78 40" fill="#6a5a5d" opacity="0.4" />
        </g>
      );
    case 10: // Braids - detailed crown
      return (
        <g filter={hairShadow}>
          <path d="M 30 42 Q 40 22 60 18 Q 80 22 90 42" fill={base} />
          {/* Braid pattern */}
          {[32, 42, 52, 62, 72, 82].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={38 - (i % 2) * 4} r="4" fill="#3a2a2d" opacity="0.7" />
              <circle cx={x} cy={38 - (i % 2) * 4} r="2.5" fill="#1a1012" opacity="0.5" />
              <path 
                d={`M ${x - 3} ${40 - (i % 2) * 4} Q ${x} ${42 - (i % 2) * 4} ${x + 3} ${40 - (i % 2) * 4}`} 
                stroke="#1a1012" 
                strokeWidth="1" 
                fill="none" 
                opacity="0.4"
              />
            </g>
          ))}
        </g>
      );
    case 11: // Bald/Buzz - subtle
      return (
        <g>
          <path d="M 32 42 Q 45 30 60 28 Q 75 30 88 42" fill={skinColor} opacity="0.3" />
          {/* Hair stubble texture */}
          {[...Array(20)].map((_, i) => (
            <circle 
              key={i} 
              cx={35 + (i * 2.5)} 
              cy={38 + Math.sin(i) * 3} 
              r="0.5" 
              fill="#2C1A1D" 
              opacity="0.2" 
            />
          ))}
        </g>
      );
    default:
      return (
        <g filter={hairShadow}>
          <path d="M 30 42 Q 40 20 60 18 Q 80 20 90 42" fill={base} />
          <path d="M 35 40 Q 50 24 60 22 Q 70 24 85 40" fill="#3a2a2d" opacity="0.6" />
        </g>
      );
  }
}

function renderExpression(expression: number) {
  const stroke = "#1a1a1a";
  
  switch (expression % 8) {
    case 0: // Happy
      return (
        <g>
          <path d="M 48 70 Q 60 78 72 70" stroke={stroke} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 50 71 Q 60 77 70 71" stroke="#fff" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3" />
        </g>
      );
    case 1: // Winking
      return (
        <g>
          <path d="M 50 70 Q 60 77 70 70" stroke={stroke} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 72 52 L 76 52" stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case 2: // Surprised
       return (
         <g>
           <ellipse cx="60" cy="72" rx="5" ry="6" fill="none" stroke={stroke} strokeWidth="2.5" />
           <ellipse cx="60" cy="72" rx="3" ry="4" fill={stroke} opacity="0.3" />
         </g>
       );
    case 3: // Relaxed
       return <path d="M 50 72 Q 60 73 70 72" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    case 4: // Laughing
       return (
         <g>
           <path d="M 48 68 Q 60 80 72 68" fill={stroke} opacity="0.8" />
           <path d="M 50 69 Q 60 78 70 69" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
         </g>
       );
    case 5: // Confident smirk
       return <path d="M 48 72 Q 58 75 72 70" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    case 6: // Cheerful
       return <path d="M 48 70 Q 60 78 72 70" stroke={stroke} strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 7: // Sweet smile
       return <path d="M 50 71 Q 60 77 70 71" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M 48 70 Q 60 77 72 70" stroke={stroke} strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
}

function renderAccessory(accessory: number) {
  switch (accessory % 8) {
    case 1: // Glasses - modern round
      return (
        <g opacity="0.85">
          <circle cx="46" cy="58" r="10" stroke="#2a2a2a" strokeWidth="2.5" fill="rgba(255,255,255,0.05)" />
          <circle cx="74" cy="58" r="10" stroke="#2a2a2a" strokeWidth="2.5" fill="rgba(255,255,255,0.05)" />
          <line x1="56" y1="58" x2="64" y2="58" stroke="#2a2a2a" strokeWidth="2.5" />
          <circle cx="48" cy="56" r="3" fill="rgba(255,255,255,0.6)" opacity="0.4" />
          <circle cx="76" cy="56" r="3" fill="rgba(255,255,255,0.6)" opacity="0.4" />
        </g>
      );
    case 2: // Square Glasses - hipster
      return (
        <g opacity="0.85">
          <rect x="35" y="50" width="22" height="16" rx="3" stroke="#2a2a2a" strokeWidth="2.5" fill="rgba(255,255,255,0.05)" />
          <rect x="63" y="50" width="22" height="16" rx="3" stroke="#2a2a2a" strokeWidth="2.5" fill="rgba(255,255,255,0.05)" />
          <line x1="57" y1="58" x2="63" y2="58" stroke="#2a2a2a" strokeWidth="2.5" />
          <rect x="38" y="53" width="5" height="5" fill="rgba(255,255,255,0.4)" opacity="0.5" />
          <rect x="66" y="53" width="5" height="5" fill="rgba(255,255,255,0.4)" opacity="0.5" />
        </g>
      );
    case 3: // Baseball Cap
       return (
         <g>
           <ellipse cx="60" cy="35" rx="32" ry="12" fill="#E74C3C" />
           <path d="M 28 35 Q 30 25 35 20 Q 60 12 85 20 Q 90 25 92 35" fill="#C0392B" />
           <path d="M 20 35 Q 30 38 45 38 L 45 36 Q 30 36 22 34 Z" fill="#C0392B" />
           <ellipse cx="60" cy="25" rx="20" ry="8" fill="#E74C3C" opacity="0.6" />
           <ellipse cx="60" cy="22" rx="12" ry="4" fill="rgba(255,255,255,0.2)" />
         </g>
       );
    case 4: // Beanie
       return (
         <g>
           <path d="M 28 38 Q 32 12 60 8 Q 88 12 92 38 L 92 42 Q 60 48 28 42 Z" fill="#3498DB" />
           <path d="M 32 38 Q 36 18 60 14 Q 84 18 88 38" fill="#2980B9" />
           <circle cx="60" cy="10" r="4" fill="#E74C3C" />
           <path d="M 40 28 Q 60 32 80 28" stroke="#2980B9" strokeWidth="2" fill="none" opacity="0.5" />
         </g>
       );
    case 5: // Headphones - over ear
       return (
         <g>
           <rect x="20" y="48" width="12" height="28" rx="6" fill="#2a2a2a" />
           <rect x="22" y="50" width="8" height="24" rx="4" fill="#3a3a3a" />
           <rect x="88" y="48" width="12" height="28" rx="6" fill="#2a2a2a" />
           <rect x="90" y="50" width="8" height="24" rx="4" fill="#3a3a3a" />
           <path d="M 26 48 Q 26 18 40 12 Q 60 8 80 12 Q 94 18 94 48" stroke="#2a2a2a" strokeWidth="5" fill="none" strokeLinecap="round" />
           <circle cx="26" cy="62" r="2" fill="#E74C3C" />
           <circle cx="94" cy="62" r="2" fill="#E74C3C" />
         </g>
       );
    case 6: // Party Hat
       return (
         <g transform="translate(5, -8) rotate(12 60 25)">
            <polygon points="60,8 42,42 78,42" fill="#F1C40F" />
            <polygon points="60,8 42,42 78,42" fill="none" stroke="#E67E22" strokeWidth="2" />
            <circle cx="60" cy="10" r="4" fill="#E74C3C" />
            <path d="M 50 20 L 70 20" stroke="#E74C3C" strokeWidth="2" />
            <path d="M 48 28 L 72 28" stroke="#3498DB" strokeWidth="2" />
         </g>
       );
    case 7: // Sunglasses - cool
       return (
         <g>
           <path d="M 35 53 L 57 53 L 57 65 Q 46 68 35 63 Z" fill="#1a1a1a" />
           <path d="M 63 53 L 85 53 L 85 63 Q 74 68 63 65 Z" fill="#1a1a1a" />
           <line x1="57" y1="56" x2="63" y2="56" stroke="#1a1a1a" strokeWidth="3" />
           <path d="M 38 56 Q 46 58 54 56" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="none" />
           <path d="M 66 56 Q 74 58 82 56" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="none" />
         </g>
       );
    default:
      return null;
  }
}