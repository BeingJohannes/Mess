import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Game as GameType, Player, Tile, ChatMessage, PlayerScore, PlayerCursor } from '../types/game';
import { GameBoard, GameBoardHandle } from '../components/GameBoard';
import { PlayerRack } from '../components/PlayerRack';
import { PlayersPanel } from '../components/PlayersPanel';
import { UnifiedDragLayer } from '../components/UnifiedDragLayer';
import { GameFinishedModal, GameFinishedStats } from '../components/GameFinishedModal';
import { MessLogo } from '../components/MessLogo';
import { ToastContainer } from '../components/ToastContainer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip';
import { Copy, LogOut, Sparkles, ChevronRight, X, AlertCircle, CheckCircle2, Info, Loader2, Share2, LifeBuoy, Hash } from 'lucide-react';
import { PlanetIcon } from '../components/PlanetIcon';
import { projectId, publicAnonKey, serverUrl } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { toastHelper } from '../utils/toast-helper';
import { motion, AnimatePresence } from 'motion/react';
import { areAllTilesInWords, detectWordsFromTiles } from '../utils/word-validator';
import Lottie from 'lottie-react';
import { USE_MOCK_BACKEND, mockApi } from '../services/mockBackend';


// Custom Cursor (Figma Style)
// Angled slightly left (rotate -15deg) and more shadow
const CUSTOM_CURSOR_SVG = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(-15 10 8)">
    <filter id="shadow">
      <feDropShadow dx="2" dy="3" stdDeviation="1.5" flood-opacity="0.4"/>
    </filter>
    <path d="M10 8 V26 L15 21 H24 L10 8 Z" fill="black" stroke="white" stroke-width="2" stroke-linejoin="round" style="filter:url(#shadow);"/>
    <path d="M10 8 V26 L15 21 H24 L10 8 Z" fill="black" stroke="white" stroke-width="2" stroke-linejoin="round"/>
  </g>
</svg>`;
// Use standard data URI encoding (omit utf8) and aggressive styling later
const CUSTOM_CURSOR_URL = `url('data:image/svg+xml,${encodeURIComponent(CUSTOM_CURSOR_SVG)}') 10 8, auto`;

interface GameProps {
  joinCode: string;
  playerId: string;
  onLeaveGame: () => void;
}

export function Game({ joinCode, playerId, onLeaveGame }: GameProps) {
  const [gameState, setGameState] = useState<{
    game: GameType | null;
    players: Player[];
    tiles: Tile[];
    chatMessages: ChatMessage[];
    scores: PlayerScore[];
  }>({
    game: null,
    players: [],
    tiles: [],
    chatMessages: [],
    scores: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggingTileId, setDraggingTileId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedTile, setDraggedTile] = useState<Tile | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragVelocity, setDragVelocity] = useState({ x: 0, y: 0 });
  const [currentZoom, setCurrentZoom] = useState(1); // Track board zoom level
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [otherCursors, setOtherCursors] = useState<PlayerCursor[]>([]);
  const [hoveredGridPos, setHoveredGridPos] = useState<{ row: number, col: number } | null>(null);
  const isPickupClickRef = useRef(false);
  const pickupTimeRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [justLandedTileId, setJustLandedTileId] = useState<string | null>(null);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);
  const [playersExpanded, setPlayersExpanded] = useState(true);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [isRackShaking, setIsRackShaking] = useState(false);
  const [isMessing, setIsMessing] = useState(false);
  const [showMessModal, setShowMessModal] = useState(false);
  const prevRackCountRef = useRef(0);
  const gameBoardRef = useRef<GameBoardHandle>(null);
  const fetchFailureCount = useRef(0);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [finalStats, setFinalStats] = useState<GameFinishedStats[]>([]);
  const lastMessTimeRef = useRef(0); // Track when we last messed
  
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  
  // Handlers for Game Finished Modal
  const handlePlayAgain = useCallback(async () => {
    // For now, just return to home - in the future could reset the game
    onLeaveGame();
  }, [onLeaveGame]);

  const handleReturnHome = useCallback(() => {
    onLeaveGame();
  }, [onLeaveGame]);
  
  const myRealRackCount = gameState.tiles.filter(
    t => t.owner_player_id === playerId && t.location_type === 'rack'
  ).length;

  useEffect(() => {
     const currentLength = myRealRackCount;
     const prevLength = prevRackCountRef.current;
     
     if (currentLength > prevLength && prevLength > 0) {
         const diff = currentLength - prevLength;
         if (diff >= 1) { // Any increase in tiles
             setIsRackShaking(true);
             setTimeout(() => setIsRackShaking(false), 800);
             
             if (diff >= 2) {
                toastHelper.warning("MESS! +2 Tiles!");
             }
         }
     }
     prevRackCountRef.current = currentLength;
  }, [myRealRackCount]);
  
  // Memoize myRackTiles using board_col for sparse positioning
  const myRackTiles = useMemo(() => {
    // Create sparse array of size 7
    const rackSlots = Array(7).fill(null);
    
    if (!currentPlayer) return rackSlots;

    // Get all rack tiles for current player
    const playerTiles = gameState.tiles.filter(t => 
      t.owner_player_id === playerId && t.location_type === 'rack'
    );
    
    // Place them in slots
    playerTiles.forEach(tile => {
       let index = tile.board_col;
       
       // Validation: if null or invalid, fallback to first empty
       if (index === null || index === undefined || index < 0 || index >= 7 || rackSlots[index] !== null) {
          index = rackSlots.findIndex(s => s === null);
       }
       
       if (index !== -1) {
         rackSlots[index] = tile;
       }
    });
    
    return rackSlots;
  }, [currentPlayer, gameState.tiles]);
  
  // Check if all my tiles are placed and in valid words
  const myBoardTiles = gameState.tiles.filter(
    t => t.location_type === 'board' && t.owner_player_id === playerId
  );
  
  const allBoardTiles = gameState.tiles.filter(t => t.location_type === 'board');
  
  const allTilesPlaced = myRackTiles.length === 0 && myBoardTiles.length > 0;
  
  // Check if all board tiles (not just mine) form valid words
  // Add safety check to ensure tiles array exists and has data
  const allTilesInValidWords = allBoardTiles.length > 0 && 
    gameState.tiles && 
    gameState.tiles.length > 0 && 
    areAllTilesInWords(allBoardTiles, gameState.tiles);
  
  // Dictionary validation state
  const [isDictionaryValid, setIsDictionaryValid] = useState(false);
  const [validatingWords, setValidatingWords] = useState(false);
  const [invalidWords, setInvalidWords] = useState<string[]>([]);
  const [lastValidationHash, setLastValidationHash] = useState<string>('');
  
  // Calculate connectivity stats for feedback
  const connectivityStats = useMemo(() => {
    const placedTiles = gameState.tiles.filter(
        t => t.location_type === 'board' && t.owner_player_id === playerId
    );
    
    if (placedTiles.length === 0) return { connected: 0, total: 0, isConnected: false };
    
    // Find all connected tiles using flood fill
    const visited = new Set<string>();
    const queue = [placedTiles[0]];
    visited.add(placedTiles[0].id);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const curRow = Math.round(current.board_row ?? 0);
      const curCol = Math.round(current.board_col ?? 0);

      const neighbors = placedTiles.filter(t => {
        if (visited.has(t.id)) return false;
        
        const tRow = Math.round(t.board_row ?? 0);
        const tCol = Math.round(t.board_col ?? 0);

        const rowDiff = Math.abs(tRow - curRow);
        const colDiff = Math.abs(tCol - curCol);
        
        // Check if adjacent (horizontally or vertically) OR same position (stacked)
        return (
          (rowDiff === 1 && colDiff === 0) ||
          (colDiff === 1 && rowDiff === 0) ||
          (rowDiff === 0 && colDiff === 0)
        );
      });
      
      neighbors.forEach(n => {
        visited.add(n.id);
        queue.push(n);
      });
    }
    
    return {
        connected: visited.size,
        total: placedTiles.length,
        isConnected: visited.size === placedTiles.length
    };
  }, [gameState.tiles, playerId]);

  // Check if player can mess it up (must have no tiles in rack and all tiles connected)
  const isStructurallyReady = useMemo(() => {
    // Check real rack count directly from tiles source
    const rackCount = gameState.tiles.filter(
        t => t.owner_player_id === playerId && t.location_type === 'rack'
    ).length;
    
    if (rackCount > 0) return false;
    
    // Use the stats we calculated above
    return connectivityStats.isConnected;
  }, [gameState.tiles, playerId, connectivityStats]);

  // Status Toast Logic
  const [statusToastVisible, setStatusToastVisible] = useState(false);
  const lastStatusMessageRef = useRef<string>('');
  
  const currentStatus = useMemo(() => {
     // Don't show errors if no tiles are on the board yet (initial game state)
     const hasTilesOnBoard = gameState.tiles.some(t => t.location_type === 'board');
     if (!hasTilesOnBoard) return null;
     
     // Don't show "checking dictionary" toast - it's too spammy
     if (invalidWords.length > 0) return { type: 'error' as const, message: `Invalid: ${invalidWords.join(', ')}` };
     
     // Only show structure errors if rack is empty
     if (myRealRackCount === 0 && !isStructurallyReady) {
        if (connectivityStats.total > 0 && !connectivityStats.isConnected) {
             return { type: 'error' as const, message: `Connect all tiles! (${connectivityStats.connected}/${connectivityStats.total})` };
        }
        return { type: 'error' as const, message: 'Must join orthogonally' };
     }
     
     return null;
  }, [invalidWords, myRealRackCount, isStructurallyReady, connectivityStats, gameState.tiles]);

  useEffect(() => {
      if (currentStatus && currentStatus.message !== lastStatusMessageRef.current) {
          // Use the new bounce toast system for status messages
          toastHelper.error(currentStatus.message);
          lastStatusMessageRef.current = currentStatus.message;
      } else if (!currentStatus) {
          lastStatusMessageRef.current = '';
      }
  }, [currentStatus?.message, currentStatus?.type]);

  const myBoardWords = useMemo(() => {
    // Relax dependency on isStructurallyReady to show words even if islands exist
    // This helps debug "why 0 words?"
    const placedTiles = gameState.tiles.filter(
        t => t.location_type === 'board' && t.owner_player_id === playerId
    );
    return detectWordsFromTiles(placedTiles).map(w => w.word);
  }, [gameState.tiles, playerId]);

  // Effect to validate words when structure is ready
  // Use a stable hash of tile positions to prevent unnecessary re-validation on polling
  const myBoardTilesHash = useMemo(() => {
    if (!gameState.tiles || !playerId) return '';
    return gameState.tiles
      .filter(t => t.location_type === 'board' && t.owner_player_id === playerId)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(t => `${t.id}:${t.board_row}:${t.board_col}:${t.letter}`)
      .join('|');
  }, [gameState.tiles, playerId]);

  useEffect(() => {
    // Only validate if structurally ready AND the hash has changed
    // This prevents constant re-validation on every poll
    if (!isStructurallyReady) {
      setIsDictionaryValid(false);
      setInvalidWords([]);
      setLastValidationHash('');
      return;
    }

    // Skip if we've already validated this exact configuration
    if (myBoardTilesHash === lastValidationHash) {
      return;
    }

    const words = myBoardWords;
    
    if (words.length === 0) {
        // If tiles exist but no words >= 2 chars found, it's invalid (e.g. single tiles)
        setIsDictionaryValid(false);
        setLastValidationHash(myBoardTilesHash);
        return;
    }

    // Debounce validation to avoid spam
    const timer = setTimeout(async () => {
      setValidatingWords(true);
      try {
        const response = await fetch(
          `${SERVER_URL}/validate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ words }),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const invalid = words.filter(w => !data.results[w.toUpperCase()]);
          setInvalidWords(invalid);
          setIsDictionaryValid(invalid.length === 0);
          setLastValidationHash(myBoardTilesHash);
        } else {
          // Server unavailable - assume valid for now
          console.log('Word validation service unavailable, assuming valid');
          setInvalidWords([]);
          setIsDictionaryValid(true);
          setLastValidationHash(myBoardTilesHash);
        }
      } catch (err) {
        // Network error - assume valid for now
        console.log('Word validation service unavailable, assuming valid');
        setInvalidWords([]);
        setIsDictionaryValid(true);
        setLastValidationHash(myBoardTilesHash);
      } finally {
        setValidatingWords(false);
      }
    }, 800); // Increased debounce to reduce API calls

    return () => clearTimeout(timer);
  }, [isStructurallyReady, myBoardTilesHash, playerId, myBoardWords, lastValidationHash]);

  const canMessItUp = isStructurallyReady && isDictionaryValid;
  
  // Round winner locking: If this player CAN mess it up, claim the round
  // Once claimed, other players can't claim it until after MESS is pressed
  useEffect(() => {
    if (canMessItUp && gameState.game && !gameState.game.current_round_winner_id) {
      // Claim this round by setting the winner
      const claimRound = async () => {
        try {
          await fetch(
            `${SERVER_URL}/games/${gameState.game?.id}/claim-round`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({ playerId }),
            }
          );
          // Immediately refresh to get the lock
          await fetchGameState();
        } catch (err) {
          console.log('Claim round unavailable, continuing in offline mode');
        }
      };
      claimRound();
    }
  }, [canMessItUp, gameState.game?.current_round_winner_id, gameState.game?.id, playerId]);
  
  // Only show MESS button if this player is the round winner AND not currently messing
  const showMessButton = canMessItUp && 
    (!gameState.game?.current_round_winner_id || gameState.game?.current_round_winner_id === playerId) &&
    !isMessing;
  
  // Lock the modal open once it appears, prevent it from disappearing due to validation flicker
  useEffect(() => {
    const timeSinceLastMess = Date.now() - lastMessTimeRef.current;
    const cooldownPeriod = 3000; // 3 seconds cooldown after messing
    
    // Only show modal if enough time has passed since last MESS
    if (showMessButton && !showMessModal && timeSinceLastMess > cooldownPeriod) {
      setShowMessModal(true);
    }
    // Only close modal when user actually clicks MESS (isMessing becomes true)
    if (isMessing && showMessModal) {
      setShowMessModal(false);
    }
  }, [showMessButton, isMessing, showMessModal]);
  
  // Random encouraging word - pick once when button appears
  const encouragingWord = useMemo(() => {
    const words = ['BOOM!', 'Nailed it!', 'Oh yeeeah!', 'Crushed it!', 'Fire!', 'Legendary!'];
    return words[Math.floor(Math.random() * words.length)];
  }, [showMessButton]);
  
  const canFinish = (gameState.game?.letter_bag?.length ?? gameState.game?.remaining_tiles ?? 0) === 0 && 
    gameState.players.every(p => (p.current_tiles?.length ?? 0) === 0);

  // Debug logging for MESS button conditions (disabled to reduce console spam)
  // useEffect(() => {
  //   console.log('MESS Button Debug:', {
  //     canMessItUp,
  //     isStructurallyReady,
  //     isDictionaryValid,
  //     rackCount: myRealRackCount,
  //     connectivityStats,
  //     myBoardWords,
  //     invalidWords
  //   });
  // }, [canMessItUp, isStructurallyReady, isDictionaryValid, myRealRackCount, connectivityStats, myBoardWords, invalidWords]);

  // --- Realtime Cursors ---
  const draggingTileIdRef = useRef(draggingTileId);
  useEffect(() => { draggingTileIdRef.current = draggingTileId; }, [draggingTileId]);

  useEffect(() => {
    if (!gameState.game?.id || !playerId) return;

    const channel = supabase.channel(`game:${gameState.game.id}`, {
      config: { 
        broadcast: { 
          self: false,
          ack: false
        } 
      }
    });

    let isChannelReady = false;

    // Listen for both broadcast messages (if any) and presence updates.
    // The client uses `channel.track(...)` to publish cursor metadata (presence).
    // Some runtimes surface those updates via presence events, so subscribe to
    // presence sync/join/leave and also fall back to broadcast messages.
    const handlePresenceState = () => {
      try {
        // presenceState() is available on the realtime channel at runtime;
        // cast to any to avoid TypeScript complaints about internal APIs.
        const state = (channel as any).presenceState?.();
        if (!state) return;

        // state is a map: key -> { metas: [ { playerId, x, y, isDragging, ... } ] }
        const cursors: PlayerCursor[] = [];
        Object.entries(state).forEach(([_key, val]: any) => {
          const metas = val?.metas || [];
          metas.forEach((m: any) => {
            if (!m || !m.playerId) return;
            // Ignore our own cursor
            if (m.playerId === playerId) return;
            cursors.push({ playerId: m.playerId, x: m.x, y: m.y, isDragging: !!m.isDragging });
          });
        });

        setOtherCursors(cursors);
      } catch (err) {
        // non-fatal - presence helper might not exist in all environments
        // console.warn('presenceState error', err);
      }
    };

    channel
      .on('broadcast', { event: 'cursor' }, (payload) => {
        const { playerId: pid, x, y, isDragging } = payload.payload;
        if (pid === playerId) return;
        
        setOtherCursors(prev => {
          const idx = prev.findIndex(c => c.playerId === pid);
          if (idx === -1) return [...prev, { playerId: pid, x, y, isDragging }];
          
          const next = [...prev];
          next[idx] = { playerId: pid, x, y, isDragging };
          return next;
        });
      })
      // Presence events: sync/join/leave. Call handlePresenceState to read the
      // latest presence map and derive cursor positions.
      .on('presence', { event: 'sync' }, handlePresenceState)
      .on('presence', { event: 'join' }, handlePresenceState)
      .on('presence', { event: 'leave' }, handlePresenceState)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isChannelReady = true;
          // Prime presence state on subscribe
          handlePresenceState();
        }
      });

    // Throttle cursor updates
    let lastSent = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSent < 30) return; // ~30fps limit
      
      if (!isChannelReady) return; // Wait for channel to be ready
      
      if (gameBoardRef.current) {
        const worldPos = gameBoardRef.current.getWorldPosition(e.clientX, e.clientY);
        if (worldPos) {
          // Use track for presence-based cursor updates
          try {
            channel.track({ 
              playerId, 
              x: worldPos.x, 
              y: worldPos.y, 
              isDragging: !!draggingTileIdRef.current 
            });
          } catch (err) {
            // Ignore - presence may not be available in every runtime
          }

          // Fallback: also attempt to broadcast a cursor event. This makes
          // cursor updates resilient across supabase-js/runtime versions that
          // surface presence differently. We attempt a couple common send
          // signatures and ignore failures.
          try {
            const payload = { playerId, x: worldPos.x, y: worldPos.y, isDragging: !!draggingTileIdRef.current };
            // Try two common variants depending on client version
            if (typeof (channel as any).send === 'function') {
              try { (channel as any).send('broadcast', { event: 'cursor', payload }); } catch(e) {}
              try { (channel as any).send({ type: 'broadcast', event: 'cursor', payload }); } catch(e) {}
            }
            if (typeof (channel as any).sendBroadcast === 'function') {
              try { (channel as any).sendBroadcast({ event: 'cursor', payload }); } catch(e) {}
            }
          } catch (err) {
            // best-effort; non-fatal
          }
          lastSent = now;
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      supabase.removeChannel(channel);
    };
  }, [gameState.game?.id, playerId]);
  // ------------------------
  
  // Fetch game state
  const fetchGameState = useCallback(async () => {
    try {
      // Use mock backend if enabled
      let data;
      
      if (USE_MOCK_BACKEND) {
        // Get game from mock backend
        const gameIdResult = await mockApi.getGame(joinCode);
        if (!gameIdResult.success) {
          throw new Error(gameIdResult.error || 'Game not found');
        }
        
        const game = gameIdResult.game;
        
        // Transform mock data to match expected format
        data = {
          game: {
            id: game.id,
            join_code: game.code,
            status: game.status,
            settings: game.settings,
            remaining_tiles: game.remainingPieces.length,
            letter_bag: game.remainingPieces, // Add letter_bag for canFinish check
            current_round: 1,
            current_round_winner_id: null,
          },
          players: game.players.map((p: any) => ({
            ...p,
            current_tiles: p.current_tiles || [], // Ensure current_tiles array exists
          })),
          tiles: game.board.tiles,
          chatMessages: [],
          scores: game.players.map((p: any) => ({
            player_id: p.id,
            score: 0,
            words_played: 0,
          })),
        };
        
        console.log('🎮 Mock game state loaded:', {
          status: data.game.status,
          currentPlayer: data.players.find((p: any) => p.id === playerId),
          isCreator: data.players.find((p: any) => p.id === playerId)?.is_creator
        });
      } else {
        // Try the real server
        try {
          const url = `${SERVER_URL}/games/${joinCode}/state?playerId=${playerId}`;
          // console.log('Fetching game state from:', url); // Commented out to reduce noise
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(8000)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            // Only log if it's not a 404 (game finished/gone)
            if (response.status !== 404) {
              console.error('Server responded with error:', response.status, errorText);
            }
            throw new Error(`Server error: ${response.status} - ${errorText}`);
          }
          
          data = await response.json();
        } catch (networkError) {
          // console.error('Failed to fetch game state:', networkError);
          
          // If it's a repeated failure, redirect to home
          if (fetchFailureCount.current > 5) {
             // Only notify once
             if (fetchFailureCount.current === 6) {
                toastHelper.error('Lost connection to game server');
             }
          }
          fetchFailureCount.current++;
          return; // Skip this update, will retry on next poll
        }
      }
      
      // Avoid overwriting optimistic state if a move happened recently
      // Increased window to 5000ms to prevent UI flickering if server is slow
      if (Date.now() - lastMoveTimeRef.current < 5000) {
        // Only update non-tile data, or merge carefully
        // For simplicity, we'll skip updating tiles if a move was recent
        setGameState(prev => ({
          ...prev,
          game: data.game,
          players: data.players,
          chatMessages: data.chatMessages,
          scores: data.scores,
          // Only update tiles if we aren't in a "recent move" window
          // effectively trusting our optimistic update for a bit
          tiles: prev.tiles
        }));
      } else {
        setGameState({
          game: data.game,
          players: data.players,
          tiles: data.tiles,
          chatMessages: data.chatMessages,
          scores: data.scores,
        });
      }
      
      setLoading(false);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error fetching game state:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      
      // Check if it's a "game not found" error
      if (errorMessage.includes('Game not found')) {
        console.error('❌ Game not found, redirecting to home');
        toastHelper.error('Game session expired or not found');
        onLeaveGame();
        return;
      }
      
      // Only show error after initial load to avoid flashing errors during polling
      if (loading) {
        setError(`Connection error: ${errorMessage}`);
      }
      setLoading(false);
    }
  }, [joinCode, playerId, loading, onLeaveGame]);
  
  // Server URL constant
  const SERVER_URL = serverUrl;

  // Health check on mount
  useEffect(() => {
  if (USE_MOCK_BACKEND) {
    console.log("💾 Using local mock mode");
    return;
  }

  let cancelled = false;

  const checkServerHealth = async (attempt = 1) => {
    try {
      const res = await fetch(`${SERVER_URL}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        // no AbortSignal timeout here – keep it simple & robust
      });

      if (!res.ok) {
        console.warn(
          `⚠️ Server health returned HTTP ${res.status} (attempt ${attempt})`
        );
        return;
      }

      const data = await res.json();
      console.log("✅ Server health:", data);
    } catch (error: any) {
      console.warn(
        `⚠️ Server health check failed (attempt ${attempt}):`,
        error?.name,
        error?.message
      );

      // optional: retry a couple of times on transient errors
      if (!cancelled && attempt < 3) {
        setTimeout(() => checkServerHealth(attempt + 1), 1500);
      }
    }
  };

  checkServerHealth();

  return () => {
    cancelled = true;
  };
}, [SERVER_URL, publicAnonKey]);
  // Track chat messages and show system/AI messages as toasts
  const previousMessagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    const currentMessages = gameState.chatMessages;
    const previousMessages = previousMessagesRef.current;
    
    // Find new messages
    const newMessages = currentMessages.filter(
      msg => !previousMessages.find(prev => prev.id === msg.id)
    );
    
    // Show system and AI messages as toasts
    newMessages.forEach(msg => {
      if (msg.sender_type === 'system') {
        toastHelper.info(msg.content);
      } else if (msg.sender_type === 'ai') {
        // Show AI messages with emoji
        toastHelper.success(`🍌 ${msg.content}`);
      }
    });
    
    // Update ref
    previousMessagesRef.current = currentMessages;
  }, [gameState.chatMessages]);
  
  // Fetch final stats when game is finished
  useEffect(() => {
    if (gameState.game?.status === 'finished' && !showFinishedModal && finalStats.length === 0) {
      const fetchFinalStats = async () => {
        try {
          const response = await fetch(
            `${SERVER_URL}/games/${gameState.game?.id}/final-stats`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            setFinalStats(data.stats || []);
            setShowFinishedModal(true);
          }
        } catch (err) {
          console.error('Error fetching final stats:', err);
        }
      };
      
      fetchFinalStats();
    }
  }, [gameState.game?.status, gameState.game?.id, showFinishedModal, finalStats.length]);
  
  const handleStartGame = async () => {
    setStartingGame(true);
    try {
      if (USE_MOCK_BACKEND) {
        // Use mock backend
        const result = await mockApi.startGame(joinCode);
        if (!result.success) {
          throw new Error(result.error || 'Failed to start game');
        }
        await fetchGameState();
      } else {
        // Use real server
        const response = await fetch(
          `${SERVER_URL}/games/${gameState.game?.id}/start`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ playerId }),
          }
        );
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to start game');
        }
        
        await fetchGameState();
      }
    } catch (err: any) {
      console.error('Error starting game:', err);
      toastHelper.error(err.message);
    } finally {
      setStartingGame(false);
    }
  };
  
  const handleTileMove = async (tileId: string, row: number, col: number, locationType: 'board' | 'rack' = 'board') => {
    try {
      const tile = gameState.tiles.find(t => t.id === tileId);
      if (!tile) return;

      lastMoveTimeRef.current = Date.now();
      
      // 1. Trigger landing animation immediately
      setJustLandedTileId(tileId);
      setTimeout(() => setJustLandedTileId(null), 600);

      if (locationType === 'rack') {
        // Rack move logic (Optimistic Update)
        setGameState(prevState => {
          const player = prevState.players.find(p => p.id === playerId);
          if (!player) return prevState;

          // 1. Update current_tiles list (ownership)
          const newCurrentTiles = [...(player.current_tiles || [])];
          if (!newCurrentTiles.includes(tileId)) {
             newCurrentTiles.push(tileId);
          }

          // 2. Update Tile objects (positioning with Shift logic)
          let updatedTiles = [...prevState.tiles];
          
          // Get all rack tiles
          const rackTiles = updatedTiles.filter(t => 
             t.owner_player_id === playerId && 
             t.location_type === 'rack' && 
             t.id !== tileId
          );

          // Virtual rack for collision detection
          const rack = Array(7).fill(null);
          rackTiles.forEach(t => {
             if (typeof t.board_col === 'number' && t.board_col >= 0 && t.board_col < 7) {
                 rack[t.board_col] = t;
             }
          });

          // Shift logic (same as backend)
          const targetIndex = Math.max(0, Math.min(6, col));
          if (rack[targetIndex]) {
              let tilesToShift = [];
              let i = targetIndex;
              while (i < 7 && rack[i]) {
                  tilesToShift.push(rack[i]);
                  i++;
              }
              for (let k = tilesToShift.length - 1; k >= 0; k--) {
                  const t = tilesToShift[k];
                  const newPos = targetIndex + 1 + k;
                  // Update in local array
                  const idx = updatedTiles.findIndex(x => x.id === t.id);
                  if (idx !== -1 && newPos < 7) {
                      updatedTiles[idx] = { ...t, board_col: newPos };
                  } else if (idx !== -1) {
                      // Overflow fallback
                       const firstEmpty = rack.findIndex(x => x === null); // This refers to old rack state, imperfect but ok for optimistic
                       if (firstEmpty !== -1) updatedTiles[idx] = { ...t, board_col: firstEmpty };
                  }
              }
          }

          // Update moved tile
          const movedTileIndex = updatedTiles.findIndex(t => t.id === tileId);
          if (movedTileIndex !== -1) {
             updatedTiles[movedTileIndex] = {
                ...updatedTiles[movedTileIndex],
                location_type: 'rack',
                board_row: null,
                board_col: targetIndex,
                owner_player_id: playerId
             };
          }

          const updatedPlayers = prevState.players.map(p => 
            p.id === playerId ? { ...p, current_tiles: newCurrentTiles } : p
          );

          return { ...prevState, players: updatedPlayers, tiles: updatedTiles };
        });

        try {
          if (USE_MOCK_BACKEND) {
            await mockApi.moveTile(joinCode, playerId, tileId, { locationType: 'rack', rackIndex: col });
          } else {
            await fetch(
                `${SERVER_URL}/games/${gameState.game?.id}/move`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                  },
                  body: JSON.stringify({
                    playerId,
                    tileId,
                    to: { locationType: 'rack', rackIndex: col },
                  }),
                }
            );
          }
        } catch (err) {
          console.error('Error moving tile to rack:', err);
        }
        return;
      }

      // Board move logic starts here
      // 2. Optimistic Update for Board
      setGameState(prevState => {
        const updatedTiles = prevState.tiles.map(t => {
          if (t.id === tileId) {
            return {
              ...t,
              location_type: 'board' as const,
              board_row: row,
              board_col: col,
            };
          }
          return t;
        });
        return { ...prevState, tiles: updatedTiles };
      });
      
      // 3. Check for redundancy (Board only)
      const isSamePosition = tile.location_type === 'board' && 
                             tile.board_row === row && 
                             tile.board_col === col;

      // Force re-render for same position drops by setting a timestamp or unique value if needed
      // But setting 'justLandedTileId' acts as that trigger.
      
      if (isSamePosition) {
        // Even though it is the same position, we return early to save bandwidth.
        // The optimistic update above (and setJustLandedTileId) handles the visual feedback.
        return;
      }
      
      // 4. Handle collisions (occupied tile)
      const occupiedTile = gameState.tiles.find(
        t => t.location_type === 'board' && 
        t.board_row === row && 
        t.board_col === col && 
        t.id !== tileId
      );
      
      // If occupied, find nearest empty square and nudge the other tile there
      if (occupiedTile) {
        const nearestEmpty = findNearestEmptySquare(row, col, gameState.tiles);
        if (nearestEmpty) {
          // Optimistically update nudged tile
          setGameState(prevState => {
            const updatedTiles = prevState.tiles.map(t => {
              if (t.id === occupiedTile.id) {
                return {
                  ...t,
                  board_row: nearestEmpty.row,
                  board_col: nearestEmpty.col,
                };
              }
              return t;
            });
            return { ...prevState, tiles: updatedTiles };
          });
          
          // Move the occupied tile to the nearest empty square first
          try {
            if (USE_MOCK_BACKEND) {
              await mockApi.moveTile(joinCode, playerId, occupiedTile.id, { locationType: 'board', row: nearestEmpty.row, col: nearestEmpty.col });
            } else {
              await fetch(
                `${SERVER_URL}/games/${gameState.game?.id}/move`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                  },
                  body: JSON.stringify({
                    playerId,
                    tileId: occupiedTile.id,
                    to: { locationType: 'board', row: nearestEmpty.row, col: nearestEmpty.col },
                  }),
                }
              );
            }
          } catch (err) {
            console.error('Error pushing tile to empty spot:', err);
          }
        }
      }
      
      // 5. Server Call for the moved tile
      try {
        if (USE_MOCK_BACKEND) {
          await mockApi.moveTile(joinCode, playerId, tileId, { locationType: 'board', row, col });
        } else {
          const response = await fetch(
            `${SERVER_URL}/games/${gameState.game?.id}/move`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                playerId,
                tileId,
                to: { locationType: 'board', row, col },
              }),
            }
          );
          
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            console.error('Failed to move tile:', data.error);
          }
        }
      } catch (err) {
        console.error('Error moving tile:', err);
      }
      
      // Don't fetch game state - let polling handle it to avoid flash
      // The optimistic update already moved the tile visually
    } catch (err: any) {
      console.error('Error moving tile:', err);
      toastHelper.error(err.message);
      // Revert optimistic update on error
      await fetchGameState();
    }
  };
  
  // Find nearest empty square for nudging tiles
  const findNearestEmptySquare = (row: number, col: number, tiles: Tile[]) => {
    const boardTiles = tiles.filter(t => t.location_type === 'board');
    const occupied = new Set(
      boardTiles.map(t => `${t.board_row},${t.board_col}`)
    );
    
    // Check adjacent squares in spiral order
    const directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0],  // right, down, left, up
      [1, 1], [1, -1], [-1, -1], [-1, 1]  // diagonals
    ];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      const key = `${newRow},${newCol}`;
      
      if (newRow >= 0 && newRow < 100 && newCol >= 0 && newCol < 100 && !occupied.has(key)) {
        return { row: newRow, col: newCol };
      }
    }
    
    return null;
  };
  
  const handleMessItUp = async () => {
    if (isMessing) return;
    
    // Double-check rack is empty before proceeding
    const rackTiles = gameState.tiles.filter(
      t => t.owner_player_id === playerId && t.location_type === 'rack'
    );
    
    if (rackTiles.length > 0) {
      toastHelper.error('Place all your tiles on the board first!');
      return;
    }
    
    // Record the mess time and close modal immediately
    lastMessTimeRef.current = Date.now();
    setShowMessModal(false);
    setIsMessing(true);

    // Immediate optimistic visual feedback
    toastHelper.success("MESSING IT UP!!!", true);
    
    // Optimistically add 2 placeholder tiles to the rack immediately
    const tempTile1 = {
      id: `temp-mess-${Date.now()}-1`,
      game_id: gameState.game?.id || '',
      letter: '?',
      value: 0,
      location_type: 'rack' as const,
      owner_player_id: playerId,
      board_row: null,
      board_col: null,
      last_moved_by_player_id: playerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const tempTile2 = {
      id: `temp-mess-${Date.now()}-2`,
      game_id: gameState.game?.id || '',
      letter: '?',
      value: 0,
      location_type: 'rack' as const,
      owner_player_id: playerId,
      board_row: null,
      board_col: null,
      last_moved_by_player_id: playerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Update state optimistically
    setGameState(prev => ({
      ...prev,
      tiles: [...prev.tiles, tempTile1, tempTile2],
      players: prev.players.map(p => 
        p.id === playerId 
          ? { ...p, current_tiles: [...(p.current_tiles || []), tempTile1.id, tempTile2.id] }
          : p
      ),
    }));

    try {
      if (USE_MOCK_BACKEND) {
        const result = await mockApi.messItUp(joinCode, playerId);
        if (!result.success) {
          setIsMessing(false);
          throw new Error(result.error || 'Failed to mess it up');
        }
      } else {
        const response = await fetch(
          `${SERVER_URL}/games/${gameState.game?.id}/split`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ playerId }),
          }
        );
        
        if (!response.ok) {
          const data = await response.json();
          setIsMessing(false); // Allow retry on error
          throw new Error(data.error || 'Failed to mess it up');
        }
      }
      
      // Immediately fetch new state multiple times for instant feedback
      await fetchGameState();
      setTimeout(() => fetchGameState(), 100);
      setTimeout(() => fetchGameState(), 300);
      setTimeout(() => fetchGameState(), 600);
      
      // Keep isMessing true for 2 seconds to prevent instant re-trigger
      // This gives time for the new tiles to arrive and state to settle
      setTimeout(() => setIsMessing(false), 2000);
    } catch (err: any) {
      console.error('Error messing it up:', err);
      toastHelper.error(err.message || 'Failed to MESS IT UP!');
      setIsMessing(false);
    }
  };
  
  const handleStuck = async () => {
    try {
      // Optimistically add 2 placeholder tiles to the rack immediately
      const currentPlayer = gameState.players.find(p => p.id === playerId);
      if (!currentPlayer) return;
      
      // Create 2 temporary placeholder tiles
      const tempTile1 = {
        id: `temp-${Date.now()}-1`,
        game_id: gameState.game?.id || '',
        letter: '?',
        value: 0,
        location_type: 'rack' as const,
        owner_player_id: playerId,
        board_row: null,
        board_col: null,
        last_moved_by_player_id: playerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const tempTile2 = {
        id: `temp-${Date.now()}-2`,
        game_id: gameState.game?.id || '',
        letter: '?',
        value: 0,
        location_type: 'rack' as const,
        owner_player_id: playerId,
        board_row: null,
        board_col: null,
        last_moved_by_player_id: playerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Update state optimistically
      setGameState(prev => ({
        ...prev,
        tiles: [...prev.tiles, tempTile1, tempTile2],
        players: prev.players.map(p => 
          p.id === playerId 
            ? { ...p, current_tiles: [...(p.current_tiles || []), tempTile1.id, tempTile2.id] }
            : p
        ),
      }));
      
      toastHelper.success('Drew 2 new tiles! (-5 points)');
      
      const response = await fetch(
  `${SERVER_URL}/games/${gameState.game?.id}/stuck`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ playerId }),
        }
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to draw tiles');
      }
      
      // Immediately fetch new state multiple times for instant feedback
      await fetchGameState();
      setTimeout(() => fetchGameState(), 100);
      setTimeout(() => fetchGameState(), 300);
      setTimeout(() => fetchGameState(), 600);
    } catch (err: any) {
      console.error('Error drawing tiles:', err);
      toastHelper.error(err.message);
      // Revert optimistic update on error
      await fetchGameState();
    }
  };
  
  const handleFinishGame = async () => {
    try {
      const response = await fetch(
  `${SERVER_URL}/games/${gameState.game?.id}/finish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ playerId }),
        }
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to finish game');
      }
      
      await fetchGameState();
    } catch (err: any) {
      console.error('Error finishing game:', err);
      toastHelper.error(err.message);
    }
  };
  
  const handleSendMessage = async (content: string) => {
    try {
      const response = await fetch(
  `${SERVER_URL}/games/${gameState.game?.id}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ playerId, content }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      await fetchGameState();
    } catch (err: any) {
      console.error('Error sending message:', err);
    }
  };
  
  const handleCopyLink = () => {
    // Use window.location.origin + window.location.pathname to support subpaths.
    // We append the query param directly to the pathname to handle both directories (/) and files (.html).
    const link = `${window.location.origin}${window.location.pathname}?join=${joinCode}`;
    
    // Try legacy method (synchronous) first as it works better in iframes/restricted envs
    // where the Async Clipboard API might be blocked by Permissions Policy.
    const textArea = document.createElement("textarea");
    textArea.value = link;
    
    // Ensure it's not visible but part of DOM
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      console.error('Legacy copy failed', err);
    }
    
    document.body.removeChild(textArea);
    
    if (success) {
      setCopiedLink(true);
      toastHelper.success('Copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      // Fallback to modern API
      // Note: This will likely fail if the Permissions Policy blocked it, 
      // but it's the last resort.
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          setCopiedLink(true);
          toastHelper.success('Copied to clipboard');
          setTimeout(() => setCopiedLink(false), 2000);
        }).catch(err => {
          console.error('All copy methods failed', err);
          toastHelper.error('Copy failed');
        });
      } else {
        toastHelper.error('Copy failed');
      }
    }
  };
  
  const handleCopyJoinCode = () => {
    const textArea = document.createElement("textarea");
    textArea.value = joinCode;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      console.error('Legacy copy failed', err);
    }
    
    document.body.removeChild(textArea);
    
    if (success) {
      toastHelper.success('Copied to clipboard');
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(joinCode).then(() => {
          toastHelper.success('Copied to clipboard');
        }).catch(err => {
          console.error('All copy methods failed', err);
          toastHelper.error('Copy failed');
        });
      } else {
        toastHelper.error('Copy failed');
      }
    }
  };
  
  const handleDragEnd = () => {
    setDraggingTileId(null);
    setDraggedTile(null);
    setDragVelocity({ x: 0, y: 0 });
    setHoveredGridPos(null);
  };

  // Memoized drop handler to be used by both global listeners and handleDragStart
  const handleDrop = useCallback((clientX: number, clientY: number, tileToDrop: Tile | null = draggedTile) => {
     if (!tileToDrop) return;
     
     // PRIORITY 1: Check if dropped on rack using elementsFromPoint
     const elements = document.elementsFromPoint(clientX, clientY);
     const rackSlot = elements.find(el => el.hasAttribute('data-rack-index'));
     const rackContainer = elements.find(el => el.hasAttribute('data-rack-container'));
     
     // Explicit slot drop
     if (rackSlot) {
        const index = parseInt(rackSlot.getAttribute('data-rack-index') || '0', 10);
        handleTileMove(tileToDrop.id, -1, index, 'rack');
        handleDragEnd();
        return;
     }

     // Imprecise rack drop (gaps, padding)
     if (rackContainer) {
        const rect = rackContainer.getBoundingClientRect();
        // Calculate approximate slot index based on mouse X
        const startX = rect.left + 16;
        const slotWidth = 56;
        const gap = 12;
        const step = slotWidth + gap;
        
        const relativeX = clientX - startX;
        let index = Math.round((relativeX - (slotWidth/2)) / step);
        index = Math.max(0, Math.min(6, index));
        
        handleTileMove(tileToDrop.id, -1, index, 'rack');
        handleDragEnd();
        return;
     }
     
     // PRIORITY 2: Check board
     if (gameBoardRef.current) {
      let gridPos = gameBoardRef.current.getGridPosition(clientX, clientY);
      
      if (!gridPos) {
        const searchRadius = 60; 
        let closestPos = null;
        let closestDist = Infinity;
        
        for (let dx = -searchRadius; dx <= searchRadius; dx += 10) {
          for (let dy = -searchRadius; dy <= searchRadius; dy += 10) {
            const testPos = gameBoardRef.current.getGridPosition(clientX + dx, clientY + dy);
            if (testPos) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < closestDist) {
                closestDist = dist;
                closestPos = testPos;
              }
            }
          }
        }
        
        if (closestPos && closestDist < searchRadius) {
          gridPos = closestPos;
        }
      }
      
      if (gridPos) {
        const { row, col } = gridPos;
        handleTileMove(tileToDrop.id, row, col);
      } else {
        if (tileToDrop.location_type === 'rack') {
          setJustLandedTileId(tileToDrop.id);
          setTimeout(() => setJustLandedTileId(null), 600);
        }
        else if (tileToDrop.location_type === 'board') {
           setJustLandedTileId(tileToDrop.id);
           setTimeout(() => setJustLandedTileId(null), 600);
        }
      }
    }
    
    handleDragEnd();
  }, [draggedTile, handleTileMove]);

  const handleDragStart = (e: React.MouseEvent, tile: Tile, initialTileCenter?: { x: number, y: number }) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If we're already dragging, this click might be the "drop" click.
    // If we click on the *same* tile while dragging, treat it as a DROP command.
    if (draggingTileId === tile.id) {
        // We are clicking the tile we are holding. Drop it right here.
        handleDrop(e.clientX, e.clientY, tile);
        return;
    }

    setDraggingTileId(tile.id);
    setDraggedTile(tile);
    isPickupClickRef.current = true;
    pickupTimeRef.current = Date.now();
    
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    setMousePos({ x: clientX, y: clientY });
    lastMousePos.current = { x: clientX, y: clientY };
    
    if (initialTileCenter) {
      setDragOffset({
        x: clientX - initialTileCenter.x,
        y: clientY - initialTileCenter.y
      });
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };
  
  // Global mouse move and up handlers
  
  // Global mouse move and up handlers
  useEffect(() => {
    if (!draggedTile) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const dt = 16; 
      const vx = (e.clientX - lastMousePos.current.x) / dt * 1000;
      const vy = (e.clientY - lastMousePos.current.y) / dt * 1000;
      
      setMousePos({ x: e.clientX, y: e.clientY });
      setDragVelocity({ x: vx, y: vy });
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      
      if (gameBoardRef.current) {
        const gridPos = gameBoardRef.current.getGridPosition(e.clientX, e.clientY);
        setHoveredGridPos(gridPos || null);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      
      const isLongPress = Date.now() - pickupTimeRef.current > 200;

      if (isPickupClickRef.current) {
        if (isLongPress) {
            // User held for a while, so this release implies DROP.
            handleDrop(e.clientX, e.clientY);
            isPickupClickRef.current = false;
        } else {
             // User clicked quickly. Keep sticky.
             isPickupClickRef.current = false;
        }
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
       if (!draggedTile) return;
       e.preventDefault();
       e.stopPropagation();
       handleDrop(e.clientX, e.clientY);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown, true);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [draggedTile, handleDrop]);
  
  if (loading) {
    return (
      <div className="min-h-screen game-bg flex items-center justify-center">
        <div 
          className="p-8 rounded-3xl relative"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(150, 150, 170, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="animate-pulse">
              <MessLogo size={56} />
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-gray-700 animate-spin" />
              <p className="text-lg font-semibold text-gray-800">Loading game...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !gameState.game) {
    return (
      <div className="min-h-screen game-bg flex items-center justify-center p-4">
        <Card className="p-8 max-w-2xl">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-red-600">Server Connection Failed</h2>
              <p className="text-gray-700 mt-2">{error || 'Game not found'}</p>
            </div>
          </div>
          
          {(error?.includes('Failed to fetch') || error?.includes('Network error') || error?.includes('Cannot connect')) && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5 mb-4">
              <p className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                🚀 Edge Function Deployment Required
              </p>
              <p className="text-sm text-amber-800 mb-3">
                The backend server isn't running yet. Deploy it with this command:
              </p>
              
              <div className="bg-white rounded border border-amber-200 p-3 mb-3">
                <p className="text-xs font-mono text-gray-700 mb-2">Run in your terminal:</p>
                <code className="block bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                  supabase functions deploy server
                </code>
              </div>
              
              <details className="text-sm text-amber-800">
                <summary className="cursor-pointer font-medium hover:text-amber-900 mb-2">
                  📚 Detailed Setup Instructions
                </summary>
                <ol className="list-decimal list-inside space-y-2 mt-2 ml-2">
                  <li>Install Supabase CLI: <code className="bg-white px-2 py-0.5 rounded text-xs">npm install -g supabase</code></li>
                  <li>Link your project: <code className="bg-white px-2 py-0.5 rounded text-xs">supabase link --project-ref {projectId}</code></li>
                  <li>Deploy the function: <code className="bg-white px-2 py-0.5 rounded text-xs">supabase functions deploy server</code></li>
                  <li>Wait 30-60 seconds for deployment to complete</li>
                  <li>Refresh this page</li>
                </ol>
              </details>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={onLeaveGame} className="bg-white text-gray-800 hover:bg-gray-50 border-2 border-gray-800">Back to Home</Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="bg-white text-gray-800 hover:bg-gray-50 border-2 border-gray-800">
              Retry Connection
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div 
      className="h-screen w-screen overflow-hidden game-bg flex flex-col game-cursor-root relative"
    >
      {/* Mock Mode Banner */}
      {USE_MOCK_BACKEND && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-center text-sm font-semibold shadow-lg">
          🎭 LOCAL TESTING MODE - Not connected to server (localStorage only)
        </div>
      )}
      
      <style>{`
        .game-cursor-root, .game-cursor-root * {
          cursor: ${CUSTOM_CURSOR_URL} !important;
        }
        
        @keyframes float-game-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(-220px, 280px) scale(1.3) rotate(90deg);
          }
          50% {
            transform: translate(280px, -220px) scale(0.8) rotate(180deg);
          }
          75% {
            transform: translate(-180px, -260px) scale(1.4) rotate(270deg);
          }
        }
        
        @keyframes float-game-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(300px, 200px) scale(1.5) rotate(120deg);
          }
          66% {
            transform: translate(-280px, -240px) scale(0.7) rotate(240deg);
          }
        }
        
        @keyframes float-game-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          20% {
            transform: translate(200px, 240px) scale(1.4) rotate(72deg);
          }
          40% {
            transform: translate(-240px, -260px) scale(0.75) rotate(144deg);
          }
          60% {
            transform: translate(280px, -180px) scale(1.5) rotate(216deg);
          }
          80% {
            transform: translate(-200px, 220px) scale(0.85) rotate(288deg);
          }
        }
        
        .blob-game-1 {
          animation: float-game-1 14s ease-in-out infinite;
        }
        
        .blob-game-2 {
          animation: float-game-2 16s ease-in-out infinite;
        }
        
        .blob-game-3 {
          animation: float-game-3 12s ease-in-out infinite;
        }
      `}</style>
      
      {/* Background gradient blobs - stronger and animated */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="blob blob-game-1 absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-500/60 to-rose-500/50 blur-3xl" />
        <div className="blob blob-game-2 absolute bottom-[15%] right-[8%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-purple-500/60 to-indigo-500/50 blur-3xl" />
        <div className="blob blob-game-3 absolute top-[50%] left-[45%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/55 to-cyan-500/45 blur-3xl" />
        <div className="blob blob-game-1 absolute top-[60%] right-[30%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-orange-500/50 to-yellow-500/40 blur-3xl" style={{ animationDelay: '3s' }} />
      </div>
      
      {/* Main Game Area - Full screen with absolute positioned floating elements */}
      <div className="flex-1 relative overflow-hidden">
        {gameState.game.status === 'waiting' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div 
              className="p-8 rounded-3xl pointer-events-auto"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(150, 150, 170, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="text-center relative z-10">
                <div className="mb-4">
                   <MessLogo size={48} />
                </div>
                {currentPlayer?.is_creator && (
                  <Button 
                    onClick={handleStartGame} 
                    size="lg" 
                    disabled={startingGame}
                    className="bg-white text-gray-800 hover:bg-gray-50 font-semibold text-base px-8 py-6 rounded-xl shadow-lg hover:scale-[1.02] transition-all active:scale-95 border-2 border-gray-800"
                  >
                    {startingGame ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Starting...</span>
                      </div>
                    ) : 'Start Game'}
                  </Button>
                )}
                {!currentPlayer?.is_creator && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <p className="text-sm font-medium">
                      Waiting for host to start...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {(gameState.game.status === 'in_progress' || gameState.game.status === 'waiting') && (
          <>
            {/* Full-screen Board */}
            <div className="absolute inset-0">
              <GameBoard
                ref={gameBoardRef}
                  tiles={gameState.tiles}
                  currentPlayerId={playerId}
                  onTileDragStart={handleDragStart}
                  draggingTileId={draggingTileId}
                  otherCursors={otherCursors}
                  players={gameState.players}
                  justLandedTileId={justLandedTileId}
                  onZoomChange={setCurrentZoom}
                  hoveredCell={hoveredGridPos}
                />
            </div>

            {/* Big MESS Button Overlay */}
            <AnimatePresence>
              {showMessModal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none p-8"
                >
                  <div 
                    className="pointer-events-auto bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-6 max-w-md w-full"
                    style={{
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    {/* Cute Lottie Animation */}
                    <div className="relative w-full h-56 flex items-center justify-center -mt-4 -mb-4">
                      <Lottie
                        animationData={{
                          "v": "5.7.4",
                          "fr": 60,
                          "ip": 0,
                          "op": 180,
                          "w": 500,
                          "h": 500,
                          "nm": "Confetti Celebration",
                          "ddd": 0,
                          "assets": [],
                          "layers": [
                            {
                              "ddd": 0,
                              "ind": 1,
                              "ty": 4,
                              "nm": "Star",
                              "sr": 1,
                              "ks": {
                                "o": { "a": 0, "k": 100 },
                                "r": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [360] }, { "t": 180 }] },
                                "p": { "a": 0, "k": [250, 250] },
                                "a": { "a": 0, "k": [0, 0] },
                                "s": { "a": 1, "k": [{ "t": 0, "s": [100, 100], "e": [120, 120] }, { "t": 90, "s": [120, 120], "e": [100, 100] }, { "t": 180 }] }
                              },
                              "shapes": [
                                {
                                  "ty": "gr",
                                  "it": [
                                    {
                                      "ty": "sr",
                                      "sy": 1,
                                      "d": 1,
                                      "pt": { "a": 0, "k": 5 },
                                      "p": { "a": 0, "k": [0, 0] },
                                      "r": { "a": 0, "k": 0 },
                                      "or": { "a": 0, "k": 50 },
                                      "ir": { "a": 0, "k": 25 }
                                    },
                                    {
                                      "ty": "fl",
                                      "c": { "a": 0, "k": [0.96, 0.80, 0.20, 1] }
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }}
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>

                    {/* Text */}
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <h2 className="text-4xl text-gray-900" style={{ fontFamily: 'Fredoka, Nunito, sans-serif' }}>
                          {isMessing ? 'Messing...' : encouragingWord}
                        </h2>
                      </div>
                      <p className="text-gray-600">
                        {isMessing ? 'Splitting the tiles...' : 'Ready to mess it up and throw some more letters into the game?'}
                      </p>
                    </div>

                    {/* Button */}
                    <motion.button
                      onClick={handleMessItUp}
                      disabled={isMessing}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative w-full py-5 px-8 bg-gradient-to-r from-[#A855F7] via-[#EC4899] to-[#F59E0B] text-white rounded-2xl font-black text-2xl disabled:opacity-50 disabled:cursor-wait overflow-hidden"
                      style={{ 
                        fontFamily: 'Fredoka, Nunito, sans-serif',
                        boxShadow: '0 10px 30px rgba(168, 85, 247, 0.4), 0 0 0 3px rgba(168, 85, 247, 0.1)'
                      }}
                    >
                      {/* Animated shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                          x: ['-200%', '200%']
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          repeatDelay: 1
                        }}
                      />
                      <span className="relative z-10">
                        {isMessing ? 'Please wait...' : 'MESS'}
                      </span>
                    </motion.button>
                  </div>
              </motion.div>
            )}
            </AnimatePresence>
            
            {/* Top-Left: Logo and Name */}
            <div className="absolute top-6 left-6 z-40 pointer-events-auto flex items-center gap-3">
              <MessLogo size={40} />
              <h1 className="text-2xl font-bold text-gray-900">MESS</h1>
            </div>
            
            {/* Top-Right: Join Code and Icons */}
            <div className="absolute top-6 right-6 z-40 pointer-events-auto">
              <div className="flex items-center gap-3">
                {/* Join Code */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopyJoinCode}
                      className="px-4 py-2 rounded-xl bg-white shadow-lg hover:bg-gray-50 transition-all border-2 border-gray-800 flex items-center gap-2"
                    >
                      <Hash className="w-4 h-4 text-gray-800" />
                      <span className="font-bold text-gray-800">{joinCode}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy join code</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* I'm Stuck Icon Button - Only show when player has less than 7 tiles */}
                {myRealRackCount < 7 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleStuck}
                        className="w-12 h-12 rounded-xl bg-white shadow-lg hover:bg-gray-50 transition-all border-2 border-gray-800 flex items-center justify-center"
                      >
                        <LifeBuoy className="w-5 h-5 text-gray-800" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>I'm stuck! Get new tiles (-5 points)</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Share Icon Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopyLink}
                      className="w-12 h-12 rounded-xl bg-white shadow-lg hover:bg-gray-50 transition-all border-2 border-gray-800 flex items-center justify-center"
                    >
                      <Share2 className="w-5 h-5 text-gray-800" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy invite link</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Leave Icon Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onLeaveGame}
                      className="w-12 h-12 rounded-xl bg-white shadow-lg hover:bg-gray-50 transition-all border-2 border-gray-800 flex items-center justify-center group"
                    >
                      <LogOut className="w-5 h-5 text-gray-800" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Leave the game</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* User Cards Below */}
              <div className="mt-4">
                <PlayersPanel
                  players={gameState.players}
                  scores={gameState.scores}
                  currentPlayerId={playerId}
                  winnerId={gameState.game.winner_player_id}
                  tiles={gameState.tiles}
                />
              </div>
            </div>
            
            {/* Player Rack - Centered */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
              <div className="flex flex-col items-center gap-4">
                {/* Actions */}
                {canFinish && (
                  <div className="flex gap-3 pointer-events-auto items-end">
                    <Button
                      onClick={handleFinishGame}
                      variant="outline"
                      size="lg"
                      className="h-12 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-900"
                    >
                      Finish Game
                    </Button>
                  </div>
                )}
                
                {/* Player Rack */}
                <div className="pointer-events-auto">
                  <PlayerRack
                    tiles={myRackTiles}
                    onTileDragStart={handleDragStart}
                    draggingTileId={draggingTileId}
                    justLandedTileId={justLandedTileId}
                    playerColor={currentPlayer?.color}
                  />
                </div>
              </div>
            </div>
          </>
        )}
        

      </div>
      <UnifiedDragLayer
        tile={draggedTile}
        mousePos={mousePos}
        dragOffset={dragOffset}
        rotation={Math.max(-15, Math.min(15, Math.atan2(dragVelocity.y, dragVelocity.x) * (180 / Math.PI) * 0.05))}
        onDragEnd={handleDragEnd}
        zoom={currentZoom}
        playerColor={currentPlayer?.color}
      />
      
      {/* Game Finished Modal */}
      <GameFinishedModal
        isOpen={showFinishedModal}
        stats={finalStats}
        onPlayAgain={handlePlayAgain}
        onReturnHome={handleReturnHome}
      />
    </div>
  );
}