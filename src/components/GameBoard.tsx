import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Tile, Player, PlayerCursor } from '../types/game';
import { detectWordsFromTiles, DetectedWord } from '../utils/word-validator';
import { isValidWord } from '../utils/dictionary-check';
import { darkenColor } from '../utils/colors';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';
import { GameTile } from './GameTile';

// --- Constants ---
const GRID_SIZE = 100;
const CELL_SIZE = 60;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const CURSOR_PATH_D = "M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface GameBoardProps {
  tiles: Tile[];
  currentPlayerId: string;
  onTileDragStart: (e: React.MouseEvent, tile: Tile, initialTileCenter?: { x: number, y: number }) => void;
  draggingTileId: string | null;
  otherCursors: PlayerCursor[];
  players: Player[];
  justLandedTileId?: string | null;
  onZoomChange?: (zoom: number) => void;
  hoveredCell?: { row: number; col: number } | null;
}

export interface GameBoardHandle {
  getGridPosition: (clientX: number, clientY: number) => { row: number, col: number } | null;
  getWorldPosition: (clientX: number, clientY: number) => { x: number, y: number } | null;
}

// Helper to generate gradients (ported from GameTile.tsx)
function generateRandomGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 30 + (hash % 60)) % 360;
  const saturation = 70 + (Math.abs(hash) % 20);
  const lightness = 55 + (Math.abs(hash >> 4) % 15);
  
  return { hue1, hue2, saturation, lightness };
}

export const GameBoard = forwardRef<GameBoardHandle, GameBoardProps>(({ 
  tiles, 
  currentPlayerId, 
  onTileDragStart,
  draggingTileId,
  otherCursors, 
  players,
  justLandedTileId,
  onZoomChange,
  hoveredCell
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Camera state (source of truth for the render loop)
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const [displayZoom, setDisplayZoom] = useState(1);
  
  // Calculate detected words and filter by dictionary
  const candidateWords = React.useMemo(() => {
    return detectWordsFromTiles(tiles);
  }, [tiles]);
  
  const [validityCache, setValidityCache] = useState<Record<string, boolean>>({});
  
  // Validate words asynchronously
  useEffect(() => {
    const unknownWords = candidateWords
      .filter(w => w.word.length >= 3 && validityCache[w.word.toUpperCase()] === undefined)
      .map(w => w.word.toUpperCase());
      
    if (unknownWords.length > 0) {
      const uniqueWords = [...new Set(unknownWords)];
      
      fetch(`https://${projectId}.supabase.co/functions/v1/server/make-server-6ff8009f/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ words: uniqueWords }),
      })
      .then(res => {
        if (!res.ok) {
          console.warn('Word validation unavailable, using local dictionary only');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.results) {
          setValidityCache(prev => ({ ...prev, ...data.results }));
        }
      })
      .catch(err => {
        // Silently fail - validation is optional
        console.log('Word validation service unavailable, using local dictionary');
      });
    }
  }, [candidateWords]);

  const detectedWords = React.useMemo(() => {
    return candidateWords.filter(word => {
       // 1. Check basic dictionary (Strict 2-letter)
       if (!isValidWord(word.word)) return false;
       
       // 2. For 3+ letters, check async cache if available
       if (word.word.length >= 3) {
         const cached = validityCache[word.word.toUpperCase()];
         // If we have a cached result, use it
         // If no cached result yet, assume valid (optimistic)
         if (cached === false) return false;
       }
       
       return true;
    });
  }, [candidateWords, validityCache]);

  // Interaction state
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false); // Middle mouse or space
  
  // To track "just landed" animations
  const landingAnimationsRef = useRef<Map<string, number>>(new Map());
  
  // To track hover trails
  const highlightTrailsRef = useRef<Map<string, number>>(new Map());
  const hoveredCellRef = useRef(hoveredCell);
  
  useEffect(() => {
    hoveredCellRef.current = hoveredCell;
  }, [hoveredCell]);

  // To track confetti particles
  const particlesRef = useRef<Particle[]>([]);
  const knownWordsRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const currentKeys = new Set<string>();
    
    detectedWords.forEach(word => {
      const key = `${word.word}-${word.start_row}-${word.start_col}-${word.direction}`;
      currentKeys.add(key);
      
      if (!knownWordsRef.current.has(key)) {
         // Spawn explosion
         const count = 40;
         const x = word.start_col * CELL_SIZE;
         const y = word.start_row * CELL_SIZE;
         const w = (word.direction === 'horizontal' ? word.word.length : 1) * CELL_SIZE;
         const h = (word.direction === 'vertical' ? word.word.length : 1) * CELL_SIZE;
         
         for (let i = 0; i < count; i++) {
            // Pick a random side
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            let px = 0, py = 0, vx = 0, vy = 0;
            
            if (side === 0) { // Top
               px = x + Math.random() * w;
               py = y;
               vx = (Math.random() - 0.5) * 4;
               vy = -Math.random() * 4 - 2;
            } else if (side === 1) { // Right
               px = x + w;
               py = y + Math.random() * h;
               vx = Math.random() * 4 + 2;
               vy = (Math.random() - 0.5) * 4;
            } else if (side === 2) { // Bottom
               px = x + Math.random() * w;
               py = y + h;
               vx = (Math.random() - 0.5) * 4;
               vy = Math.random() * 4 + 2;
            } else { // Left
               px = x;
               py = y + Math.random() * h;
               vx = -Math.random() * 4 - 2;
               vy = (Math.random() - 0.5) * 4;
            }
            
            const hue = Math.floor(Math.random() * 360);
            particlesRef.current.push({
               x: px, y: py, vx, vy,
               color: `hsl(${hue}, 80%, 60%)`,
               life: 1.0,
               maxLife: 1.0,
               size: Math.random() * 5 + 3
            });
         }
      }
    });
    
    knownWordsRef.current = currentKeys;
  }, [detectedWords]);
  
  // Generate custom cursor URL for local player
  const localCursorUrl = useMemo(() => {
    const player = players.find(p => p.id === currentPlayerId);
    const color = player?.color || '#000000';
    const darkColor = darkenColor(color, 0.3);
    
    const svg = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="${CURSOR_PATH_D}" 
        fill="${color}"
        stroke="${darkColor}"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    </svg>
    `;
    
    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 3 3, auto`;
  }, [players, currentPlayerId]);
  
  // Create a map of tile ID to player color
  const tileColorMap = useMemo(() => {
    const map = new Map<string, string>();
    tiles.forEach(tile => {
      if (tile.owner_player_id) {
        const player = players.find(p => p.id === tile.owner_player_id);
        if (player) {
          map.set(tile.id, player.color);
        }
      }
    });
    return map;
  }, [tiles, players]);
  
  // Helper to get tile color - returns player color or default
  const getTileColor = useCallback((tileId: string) => {
    return tileColorMap.get(tileId) || '#A78BFA';
  }, [tileColorMap]);

  // --- Screen to World Helper ---
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const { x: panX, y: panY, zoom } = cameraRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    // Mouse relative to container
    const mx = sx - rect.left;
    const my = sy - rect.top;
    
    const wx = (mx - panX) / zoom;
    const wy = (my - panY) / zoom;
    return { x: wx, y: wy };
  }, []);

  // --- Imperative Handle for Parent ---
  useImperativeHandle(ref, () => ({
    getGridPosition: (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      // Check if point is inside container
      if (!rect || 
          clientX < rect.left || clientX > rect.right || 
          clientY < rect.top || clientY > rect.bottom) {
        return null;
      }

      const { x: wx, y: wy } = screenToWorld(clientX, clientY);
      const col = Math.floor(wx / CELL_SIZE);
      const row = Math.floor(wy / CELL_SIZE);
      
      if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
        return { row, col };
      }
      return null;
    },
    getWorldPosition: (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || 
          clientX < rect.left || clientX > rect.right || 
          clientY < rect.top || clientY > rect.bottom) {
        return null;
      }
      return screenToWorld(clientX, clientY);
    }
  }));

  // --- Canvas Render Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true, // Better performance
    });
    if (!ctx) return;
    
    // Enable high-quality text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    let animationFrameId: number;
    
    // Resize handler
    const updateSize = () => {
      if (!container || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    
    // Initial size
    updateSize();
    window.addEventListener('resize', updateSize);

    // Draw function
    const render = (timestamp: number) => {
      if (!canvas || !ctx) return;
      
      const dpr = window.devicePixelRatio || 1;
      const { x: panX, y: panY, zoom } = cameraRef.current;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      
      // Warp helper for "gravity" effect
      const warpPoint = (wx: number, wy: number) => {
          let dx = 0;
          let dy = 0;
          
          // Removed board pull animation - too distracting
          
          return { x: wx + dx, y: wy + dy };
      };
      
      // Apply Global Transform
      ctx.scale(dpr, dpr);
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);
      
      // --- Draw Grid ---
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1 / zoom; 
      
      const boardSize = GRID_SIZE * CELL_SIZE;
      const step = 25; // Segment length for warping
      
      // Vertical lines
      for (let i = 0; i <= GRID_SIZE; i++) {
        const x = i * CELL_SIZE;
        const start = warpPoint(x, 0);
        ctx.moveTo(start.x, start.y);
        
        for (let y = step; y <= boardSize; y += step) {
           const p = warpPoint(x, y);
           ctx.lineTo(p.x, p.y);
        }
        // Ensure end point
        const end = warpPoint(x, boardSize);
        ctx.lineTo(end.x, end.y);
      }
      // Horizontal lines
      for (let i = 0; i <= GRID_SIZE; i++) {
        const y = i * CELL_SIZE;
        const start = warpPoint(0, y);
        ctx.moveTo(start.x, start.y);
        
        for (let x = step; x <= boardSize; x += step) {
           const p = warpPoint(x, y);
           ctx.lineTo(p.x, p.y);
        }
        const end = warpPoint(boardSize, y);
        ctx.lineTo(end.x, end.y);
      }
      ctx.stroke();
      
      // --- Draw Hover Highlight ---
      // We maintain trails for smooth fade in/out
      const currentKey = hoveredCellRef.current ? `${hoveredCellRef.current.row},${hoveredCellRef.current.col}` : null;
      
      // Ensure current cell is in the map
      if (currentKey && !highlightTrailsRef.current.has(currentKey)) {
         highlightTrailsRef.current.set(currentKey, 0);
      }
      
      const trailKeys = Array.from(highlightTrailsRef.current.keys());
      
      trailKeys.forEach(key => {
        let opacity = highlightTrailsRef.current.get(key) || 0;
        
        if (key === currentKey) {
          // Fade in
          opacity = Math.min(opacity + 0.04, 1.0);
        } else {
          // Fade out
          opacity = Math.max(opacity - 0.03, 0);
        }
        
        if (opacity <= 0) {
          highlightTrailsRef.current.delete(key);
        } else {
          highlightTrailsRef.current.set(key, opacity);
          
          const [r, c] = key.split(',').map(Number);
          const hx = c * CELL_SIZE;
          const hy = r * CELL_SIZE;
          
          ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.15})`;
          ctx.beginPath();
          ctx.roundRect(hx + 4, hy + 4, CELL_SIZE - 8, CELL_SIZE - 8, 8);
          ctx.fill();
        }
      });

      // --- Draw Correct Word Highlights ---
      detectedWords.forEach(word => {
        // Only highlight words with 2+ letters (which detectWordsFromTiles already filters)
        // Calculate bounding box
        let x = word.start_col * CELL_SIZE;
        let y = word.start_row * CELL_SIZE;
        let w = 0;
        let h = 0;
        
        if (word.direction === 'horizontal') {
          w = word.word.length * CELL_SIZE;
          h = CELL_SIZE;
        } else {
          w = CELL_SIZE;
          h = word.word.length * CELL_SIZE;
        }
        
        // Gap between tiles and stroke
        const gap = 8;
        const strokeWidth = 3;
        
        // Animated Gradient - smooth cycling through bubblegum colors
        const time = timestamp * 0.001; // Slower, smoother animation
        
        // Create gradient
        const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
        
        // Bold bubblegum color palette
        const colors = [
          { r: 255, g: 214, b: 0 },   // Bold yellow
          { r: 255, g: 107, b: 0 },   // Mandarin orange
          { r: 255, g: 31, b: 142 },  // Cherry pink
          { r: 168, g: 85, b: 247 },  // Purple
          { r: 0, g: 217, b: 255 },   // Cyan
        ];
        
        // Smooth color interpolation
        const offset = time % colors.length;
        
        for (let i = 0; i < 5; i++) {
          const stop = i / 4;
          const colorIndex = Math.floor((i + offset) % colors.length);
          const nextColorIndex = Math.floor((i + offset + 1) % colors.length);
          const blend = (offset % 1);
          
          const c1 = colors[colorIndex];
          const c2 = colors[nextColorIndex];
          
          const r = Math.round(c1.r * (1 - blend) + c2.r * blend);
          const g = Math.round(c1.g * (1 - blend) + c2.g * blend);
          const b = Math.round(c1.b * (1 - blend) + c2.b * blend);
          
          gradient.addColorStop(stop, `rgb(${r}, ${g}, ${b})`);
        }
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = strokeWidth;
        
        // Subtle pulse opacity
        ctx.globalAlpha = 0.8 + Math.sin(time * 2) * 0.2;
        
        ctx.beginPath();
        ctx.roundRect(x - gap, y - gap, w + gap * 2, h + gap * 2, 12);
        ctx.stroke();
        
        ctx.globalAlpha = 1.0;
      });

      // --- Draw Particles ---
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
         const p = particlesRef.current[i];
         p.x += p.vx;
         p.y += p.vy;
         p.life -= 0.03;
         p.vy += 0.2;
         
         if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
         }
      }
      
      particlesRef.current.forEach(p => {
         ctx.fillStyle = p.color;
         ctx.globalAlpha = p.life;
         ctx.beginPath();
         ctx.roundRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size, 2); // Square/Rect confetti looks better?
         ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // --- Draw Tiles ---
      tiles.forEach(tile => {
        // Only skip if THIS player is dragging it (not other players)
        if (tile.id === draggingTileId && tile.owner_player_id === currentPlayerId) return;
        if (tile.location_type !== 'board') return;
        
        const row = tile.board_row ?? 0;
        const col = tile.board_col ?? 0;
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;
        
        // Handle landing animation - shorter and more subtle
        let scale = 1;
        let opacity = 1;
        
        if (tile.id === justLandedTileId) {
           if (!landingAnimationsRef.current.has(tile.id)) {
             landingAnimationsRef.current.set(tile.id, timestamp);
           }
           const startTime = landingAnimationsRef.current.get(tile.id)!;
           const elapsed = timestamp - startTime;
           const duration = 200; // Very short
           
           if (elapsed < duration) {
             // Very subtle single bounce
             const progress = elapsed / duration;
             scale = 1 + Math.sin(progress * Math.PI) * 0.04; // Very subtle: 4% scale up
           } else {
             landingAnimationsRef.current.delete(tile.id);
           }
        }
        
        // Show if other players are dragging this tile
        const isOtherPlayerDragging = tile.id === draggingTileId && tile.owner_player_id !== currentPlayerId;
        if (isOtherPlayerDragging) {
          opacity = 0.6;
          scale = 1.1;
        }
        
        const tileColor = getTileColor(tile.id);
        const size = 56; // Base size (matches GameTile.tsx)
        const offset = (CELL_SIZE - size) / 2;
        
        // Center point for scaling
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
        
        // 1. Draw main tile with gradient (135deg from top-left to bottom-right)
        const gradient = ctx.createLinearGradient(x + offset, y + offset, x + offset + size, y + offset + size);
        gradient.addColorStop(0, tileColor);
        gradient.addColorStop(1, tileColor + 'DD');
        ctx.fillStyle = gradient;
        
        // 2. Apply outer shadow (primary)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        
        // Draw the rounded rectangle
        ctx.beginPath();
        ctx.roundRect(x + offset, y + offset, size, size, 12);
        ctx.fill();
        
        // 3. Add second outer shadow layer for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        ctx.fill();
        
        // 4. Add subtle top highlight for dimension (very subtle, blended edge)
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        const highlightGradient = ctx.createLinearGradient(x + offset, y + offset, x + offset, y + offset + size * 0.4);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.roundRect(x + offset, y + offset, size, size, 12);
        ctx.fill();
        
        // 5. Draw letter - NO SHADOW, bold white text, BIGGER
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = 'white';
        ctx.font = `900 32px Fredoka, Nunito, Quicksand, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.letter, cx, cy);
        
        ctx.restore();
      });
      
      // --- Draw Cursors ---
      const cursorPath = new Path2D(CURSOR_PATH_D);

      otherCursors.forEach(cursor => {
        const player = players.find(p => p.id === cursor.playerId);
        if (!player) return;
        
        const cx = cursor.x;
        const cy = cursor.y;
        const color = player.color;
        const darkColor = darkenColor(color, 0.3);
        
        ctx.save();
        ctx.translate(cx, cy);
        
        // Draw Arrow
        ctx.fillStyle = color;
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        
        // Scale cursor slightly if zoomed out too much, but generally keep it constant size visually?
        // No, cursors usually stay constant size in screen space.
        // We are in WORLD space here (after global scale).
        // So we MUST invert scale to keep cursor constant size.
        ctx.scale(1/zoom, 1/zoom);
        
        ctx.fill(cursorPath);
        ctx.stroke(cursorPath);
        
        // Draw Name Tag
        const text = player.display_name;
        ctx.font = 'bold 12px Inter, sans-serif';
        const textMetrics = ctx.measureText(text);
        const padding = 6;
        const w = textMetrics.width + padding * 2;
        const h = 22;
        
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        
        // Tag Background
        ctx.fillStyle = color;
        ctx.beginPath();
        
        // Position tag to the bottom-right of cursor
        const tagX = 16; 
        const tagY = 16;
        
        ctx.roundRect(tagX, tagY, w, h, 6);
        ctx.fill();
        
        // Tag Text
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, tagX + padding, tagY + h/2 + 1); // +1 for visual centering
        
        ctx.restore();
      });

      ctx.restore();
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    animationFrameId = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [tiles, draggingTileId, justLandedTileId, otherCursors, players, getTileColor, screenToWorld]); // removed hoveredCell dependency

  // --- Event Handlers ---

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // Zooming
    if (e.ctrlKey || e.metaKey) {
      const zoomSensitivity = 0.002;
      const delta = -e.deltaY * zoomSensitivity;
      
      const oldZoom = cameraRef.current.zoom;
      let newZoom = oldZoom + delta;
      newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
      
      if (newZoom === oldZoom) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const wx = (mouseX - cameraRef.current.x) / oldZoom;
      const wy = (mouseY - cameraRef.current.y) / oldZoom;
      
      const newPanX = mouseX - wx * newZoom;
      const newPanY = mouseY - wy * newZoom;
      
      // Clamp pan values
      const boardWidth = GRID_SIZE * CELL_SIZE;
      const boardHeight = GRID_SIZE * CELL_SIZE;
      const minPanX = rect.width - boardWidth * newZoom - 500; // allow 500px overscroll
      const maxPanX = 500;
      const minPanY = rect.height - boardHeight * newZoom - 500;
      const maxPanY = 500;

      cameraRef.current = { 
        x: Math.min(Math.max(newPanX, minPanX), maxPanX), 
        y: Math.min(Math.max(newPanY, minPanY), maxPanY), 
        zoom: newZoom 
      };
      setDisplayZoom(newZoom);
      onZoomChange?.(newZoom);
    } else {
      // Panning
      const panX = cameraRef.current.x - e.deltaX;
      const panY = cameraRef.current.y - e.deltaY;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const boardWidth = GRID_SIZE * CELL_SIZE;
      const boardHeight = GRID_SIZE * CELL_SIZE;
      const zoom = cameraRef.current.zoom;
      const minPanX = rect.width - boardWidth * zoom - 500;
      const maxPanX = 500;
      const minPanY = rect.height - boardHeight * zoom - 500;
      const maxPanY = 500;

      cameraRef.current = { 
        ...cameraRef.current, 
        x: Math.min(Math.max(panX, minPanX), maxPanX), 
        y: Math.min(Math.max(panY, minPanY), maxPanY) 
      };
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isPanningRef.current = true;
      return;
    }
    
    if (e.button === 0) {
      const { x: wx, y: wy } = screenToWorld(e.clientX, e.clientY);
      const col = Math.floor(wx / CELL_SIZE);
      const row = Math.floor(wy / CELL_SIZE);
      
      if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
        const tile = tiles.find(t => t.location_type === 'board' && t.board_col === col && t.board_row === row);
        if (tile) {
          // Found a tile - let parent handle drag
          // DO NOT capture pointer - we want global handlers to work
          isDraggingRef.current = true;
          
          const tileX = col * CELL_SIZE;
          const tileY = row * CELL_SIZE;
          const tileCenterX = tileX + CELL_SIZE / 2;
          const tileCenterY = tileY + CELL_SIZE / 2;
          
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            const centerX = tileCenterX * cameraRef.current.zoom + cameraRef.current.x + rect.left;
            const centerY = tileCenterY * cameraRef.current.zoom + cameraRef.current.y + rect.top;
            onTileDragStart(e, tile, { x: centerX, y: centerY });
          } else {
            onTileDragStart(e, tile);
          }
          return;
        }
      }

      // No tile found - start panning
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isPanningRef.current = true;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Don't interfere if dragging a tile - global handlers will manage it
    if (isDraggingRef.current) return;
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    
    // Only pan if we're in panning mode
    if (isPanningRef.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
         const panX = cameraRef.current.x + dx;
         const panY = cameraRef.current.y + dy;
         
         const boardWidth = GRID_SIZE * CELL_SIZE;
         const boardHeight = GRID_SIZE * CELL_SIZE;
         const zoom = cameraRef.current.zoom;
         const minPanX = rect.width - boardWidth * zoom - 500;
         const maxPanX = 500;
         const minPanY = rect.height - boardHeight * zoom - 500;
         const maxPanY = 500;

         cameraRef.current.x = Math.min(Math.max(panX, minPanX), maxPanX);
         cameraRef.current.y = Math.min(Math.max(panY, minPanY), maxPanY);
      } else {
         cameraRef.current.x += dx;
         cameraRef.current.y += dy;
      }
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
    isPanningRef.current = false;
    isDraggingRef.current = false;
  };

  // Initial centering logic
  useEffect(() => {
    const container = containerRef.current;
    // Only run if we haven't moved camera yet (x=0, y=0, zoom=1 is default)
    if (container && cameraRef.current.zoom === 1 && cameraRef.current.x === 0 && cameraRef.current.y === 0) {
       const rect = container.getBoundingClientRect();
       let targetX = 0;
       let targetY = 0;
       
       const boardTiles = tiles.filter(t => t.location_type === 'board');

       if (boardTiles.length > 0) {
         const rows = boardTiles.map(t => t.board_row || 0);
         const cols = boardTiles.map(t => t.board_col || 0);
         const minRow = Math.min(...rows);
         const maxRow = Math.max(...rows);
         const minCol = Math.min(...cols);
         const maxCol = Math.max(...cols);
         const centerRow = (minRow + maxRow) / 2;
         const centerCol = (minCol + maxCol) / 2;
         
         targetX = centerCol * CELL_SIZE + CELL_SIZE/2;
         targetY = centerRow * CELL_SIZE + CELL_SIZE/2;
       } else {
         // Center on grid middle (50, 50)
         targetX = (GRID_SIZE * CELL_SIZE) / 2;
         targetY = (GRID_SIZE * CELL_SIZE) / 2;
       }
       
       cameraRef.current = {
         x: rect.width / 2 - targetX,
         y: rect.height / 2 - targetY,
         zoom: 1
       };
       setDisplayZoom(1);
    }
  }, [tiles.length]);

  // Zoom Controls
  const updateZoomCenter = (newZoom: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const oldZoom = cameraRef.current.zoom;
    const panX = cameraRef.current.x;
    const panY = cameraRef.current.y;
    const wx = (centerX - panX) / oldZoom;
    const wy = (centerY - panY) / oldZoom;
    cameraRef.current = {
      x: centerX - wx * newZoom,
      y: centerY - wy * newZoom,
      zoom: newZoom
    };
    setDisplayZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  const handleZoomIn = () => updateZoomCenter(Math.min(cameraRef.current.zoom * 1.3, MAX_ZOOM));
  const handleZoomOut = () => updateZoomCenter(Math.max(cameraRef.current.zoom / 1.3, MIN_ZOOM));
  const handleZoomToFit = () => {
    if (tiles.length === 0) return;
    const rows = tiles.map(t => t.board_row || 0);
    const cols = tiles.map(t => t.board_col || 0);
    const width = (Math.max(...cols) - Math.min(...cols) + 7) * CELL_SIZE;
    const height = (Math.max(...rows) - Math.min(...rows) + 7) * CELL_SIZE;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = Math.min(Math.max(Math.min(rect.width / width, rect.height / height), MIN_ZOOM), MAX_ZOOM);
    const centerRow = (Math.min(...rows) + Math.max(...rows)) / 2;
    const centerCol = (Math.min(...cols) + Math.max(...cols)) / 2;
    cameraRef.current = {
       x: rect.width / 2 - (centerCol * CELL_SIZE * scale) - (CELL_SIZE * scale / 2),
       y: rect.height / 2 - (centerRow * CELL_SIZE * scale) - (CELL_SIZE * scale / 2),
       zoom: scale
    };
    setDisplayZoom(scale);
    onZoomChange?.(scale);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden bg-white/40 backdrop-blur-xl"
    >
       {/* Background Blobs - now visible through the frosted glass */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob" style={{ width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255, 143, 177, 0.6) 0%, transparent 70%)', top: '20%', left: '10%', position: 'absolute' }} />
        <div className="blob" style={{ width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)', top: '60%', right: '15%', position: 'absolute' }} />
        <div className="blob" style={{ width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(255, 217, 61, 0.55) 0%, transparent 70%)', bottom: '25%', left: '40%', position: 'absolute' }} />
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 block touch-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ 
          width: '100%', 
          height: '100%', 
          cursor: localCursorUrl 
        }}
      />
    </div>
  );
});

export { CELL_SIZE, GRID_SIZE };