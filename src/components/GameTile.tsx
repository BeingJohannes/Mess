import React from 'react';

interface GameTileProps {
  tile: {
    id: string;
    letter: string;
    value: number;
  };
  playerColor?: string;
  onMouseDown?: (e: React.MouseEvent, tile: any) => void;
  isDragging?: boolean;
  isInRack?: boolean;
  style?: React.CSSProperties;
  justLanded?: boolean;
  zoom?: number;
}

export function GameTile({ tile, playerColor, onMouseDown, isDragging, isInRack, style, justLanded, zoom = 1 }: GameTileProps) {
  // Actual display size based on zoom - render at real size, not scaled
  const baseSize = 56;
  const displaySize = baseSize * zoom;
  
  // Font sizes scale with zoom - BIGGER now!
  const letterSize = 32 * zoom;
  
  // Use player color if provided, otherwise use a default vibrant color
  const tileColor = playerColor || '#A855F7'; // default purple
  
  return (
    <div
      onMouseDown={(e) => onMouseDown?.(e, tile)}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true,
        });
        onMouseDown?.(mouseEvent as any, tile);
      }}
      className={`
        relative
        ${isDragging ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        ${!isDragging && isInRack ? 'hover:scale-110' : ''}
        ${justLanded ? 'tile-land-animation' : ''}
      `}
      style={{
        width: displaySize,
        height: displaySize,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: isInRack ? 'transform 0.2s' : 'none',
        visibility: isDragging ? 'hidden' : 'visible',
        // Force hardware acceleration for smoother rendering
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        ...style,
      }}
    >
      {/* Tile Background - Vibrant rounded square with gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${tileColor} 0%, ${tileColor}DD 100%)`,
          boxShadow: `
            0 ${4 * zoom}px ${12 * zoom}px rgba(0, 0, 0, 0.25),
            0 ${2 * zoom}px ${4 * zoom}px rgba(0, 0, 0, 0.15),
            inset 0 ${2 * zoom}px ${4 * zoom}px rgba(255, 255, 255, 0.4),
            inset 0 ${-1 * zoom}px ${2 * zoom}px rgba(0, 0, 0, 0.2)
          `,
          borderRadius: `${12 * zoom}px`,
          // High quality rendering
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      />
      
      {/* Letter - Real DOM Text */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily: '"Fredoka", "Nunito", "Quicksand", system-ui, -apple-system, sans-serif',
          fontSize: `${letterSize}px`,
          fontWeight: 900,
          color: 'white',
          // High quality text rendering - NO TEXT SHADOW
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        }}
      >
        {tile.letter}
      </div>
    </div>
  );
}