import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { Tile } from '../types/game';
import { GameTile } from './GameTile';

interface UnifiedDragLayerProps {
  tile: Tile | null;
  mousePos: { x: number; y: number };
  rotation?: number;
  onDragEnd: () => void;
  dragOffset?: { x: number, y: number };
  zoom?: number;
  playerColor?: string;
}

export function UnifiedDragLayer({ tile, mousePos, dragOffset = { x: 0, y: 0 }, zoom = 1, playerColor }: UnifiedDragLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Physics state for smooth rotation
  const rotationRef = useRef(0);
  const lastPosRef = useRef(mousePos);
  const latestMousePosRef = useRef(mousePos);
  
  // Sync latest mouse position for the animation loop
  useLayoutEffect(() => {
    latestMousePosRef.current = mousePos;
  }, [mousePos]);

  // Animation loop for smooth rotation
  useEffect(() => {
    let rAF: number;
    
    const loop = () => {
      if (!tile) {
        rAF = requestAnimationFrame(loop);
        return;
      }

      const currentPos = latestMousePosRef.current;
      const lastPos = lastPosRef.current;
      
      // Calculate delta (pixels moved since last frame)
      const dx = currentPos.x - lastPos.x;
      
      // Target rotation based on horizontal movement
      // "Banking" into the turn: moving right (positive dx) -> rotate clockwise (positive angle)
      // Max rotation clamped to 20 degrees for subtle effect
      const targetRotation = Math.max(-20, Math.min(20, dx * 1.5));
      
      // Smooth interpolation (Lerp)
      // 0.1 coefficient makes it lag slightly behind, creating weight
      rotationRef.current += (targetRotation - rotationRef.current) * 0.1;
      
      // Update ref for next frame
      lastPosRef.current = currentPos;
      
      // Apply transform directly to DOM for performance
      if (containerRef.current) {
        containerRef.current.style.transform = `translate(-50%, -50%) rotate(${rotationRef.current}deg) scale(1.15)`;
      }
      
      rAF = requestAnimationFrame(loop);
    };
    
    rAF = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rAF);
  }, [tile]); // Restart loop if tile changes (e.g. pickup/drop)
  
  if (!tile) return null;
  
  const baseSize = 56;
  const scale = 1.15; // Slightly larger when dragging
  const displaySize = baseSize * scale * zoom;
  
  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: mousePos.x - dragOffset.x,
        top: mousePos.y - dragOffset.y,
        width: displaySize,
        height: displaySize,
        willChange: 'transform, left, top',
      }}
    >
      <div 
        ref={containerRef}
        className="absolute pointer-events-none" 
        style={{ 
          width: displaySize, 
          height: displaySize,
          // Initial transform - will be updated by animation loop
          transform: 'translate(-50%, -50%) scale(1.15)',
          transformOrigin: 'center',
        }}
      >
        {/* Use GameTile component for consistent DOM-based rendering */}
        <div style={{ filter: 'brightness(1.1) drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}>
          <GameTile
            tile={tile}
            playerColor={playerColor}
            isDragging={false}
            zoom={zoom * scale}
          />
        </div>
        
        {/* Colorful glow effect */}
        <div 
          className="absolute inset-0 rounded-2xl blur-lg opacity-50 pointer-events-none"
          style={{
            background: playerColor 
              ? `radial-gradient(circle, ${playerColor}99, ${playerColor}33)`
              : 'radial-gradient(circle, rgba(168, 139, 250, 0.6), rgba(255, 143, 177, 0.3))',
            transform: 'scale(1.3)',
            zIndex: -1,
          }}
        />
      </div>
    </div>
  );
}