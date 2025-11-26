import React, { useEffect, useState, useRef } from 'react';
import { Tile } from '../types/game';
import { GameTile } from './GameTile';
import { Loader2 } from 'lucide-react';

interface PlayerRackProps {
  tiles: Tile[];
  onTileDragStart: (e: React.MouseEvent, tile: Tile, initialTileCenter?: { x: number, y: number }) => void;
  draggingTileId: string | null;
  justLandedTileId?: string | null;
  playerColor?: string;
}

export function PlayerRack({ tiles, onTileDragStart, draggingTileId, justLandedTileId, playerColor }: PlayerRackProps) {
  // Always show 7 slots (standard for Scrabble-likes, even if we start with 4)
  const MAX_SLOTS = 7;
  const slots = Array(MAX_SLOTS).fill(null).map((_, i) => tiles[i] || null);
  
  // Track loading state for new tiles
  const prevTileCountRef = useRef(tiles.filter(t => t !== null).length);
  const [loadingSlots, setLoadingSlots] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    const currentCount = tiles.filter(t => t !== null).length;
    const prevCount = prevTileCountRef.current;
    
    if (currentCount > prevCount) {
      // New tiles arrived! Show loaders briefly
      const newSlotIndices = tiles
        .map((tile, idx) => ({ tile, idx }))
        .filter(({ tile, idx }) => tile !== null)
        .slice(prevCount)
        .map(({ idx }) => idx);
      
      setLoadingSlots(new Set(newSlotIndices));
      
      // Remove loaders after a brief moment
      setTimeout(() => setLoadingSlots(new Set()), 600);
    }
    
    prevTileCountRef.current = currentCount;
  }, [tiles]);
  
  // Check if a tile is a placeholder (temporary tile waiting for real data)
  const isPlaceholder = (tile: Tile | null) => {
    if (!tile) return false;
    return tile.id.startsWith('temp-') || tile.letter === '?';
  };
  
  return (
    <div className="flex flex-col gap-3">
      <div 
        className="flex gap-3 items-center p-6 rounded-3xl relative shadow-lg"
        data-rack-container="true"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(31, 41, 55, 1)',
          borderWidth: '2px',
          borderStyle: 'solid',
        }}
      >
        {slots.map((tile, index) => (
          <div 
            key={`rack-slot-${index}`} 
            className="relative group"
            data-rack-index={index}
          >
            {/* Hover/Drop Indicator */}
            <div className="absolute inset-0 bg-blue-100/0 group-hover:bg-blue-100/50 rounded-lg transition-colors duration-200 pointer-events-none" />
            
            {(loadingSlots.has(index) || isPlaceholder(tile)) ? (
              // Show loading spinner for incoming tile or placeholder
              <div
                className="w-14 h-14 rounded-lg border-2 border-blue-400 
                           bg-white/60 backdrop-blur-sm flex items-center justify-center relative z-10
                           shadow-lg animate-pulse"
              >
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : tile && draggingTileId !== tile.id ? (
              <div className="relative z-10">
                <GameTile
                  tile={tile}
                  playerColor={playerColor}
                  onMouseDown={(e, t) => {
                     const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                     const centerX = rect.left + rect.width / 2;
                     const centerY = rect.top + rect.height / 2;
                     onTileDragStart(e, t, { x: centerX, y: centerY });
                  }}
                  isDragging={false}
                  isInRack
                  justLanded={justLandedTileId === tile.id}
                />
              </div>
            ) : (
              <div
                className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 
                           bg-gray-50/30 flex items-center justify-center relative z-10
                           transition-all duration-200 group-hover:border-blue-400 group-hover:bg-blue-50/50"
              >
                <span className="text-gray-300 text-xs group-hover:text-blue-400 transition-colors">+</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}