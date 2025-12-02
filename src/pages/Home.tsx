import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Users, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CharacterCustomizer, CharacterOptions, ANIMAL_TYPES } from '../components/CharacterCustomizer';
import { GameSettings, GameSettingsOptions } from '../components/GameSettings';
import { AnimalAvatar } from '../components/AnimalAvatar';
import { ToastContainer } from '../components/ToastContainer';
import { projectId, publicAnonKey, serverUrl } from '../utils/supabase/info';
import { USE_MOCK_BACKEND, mockApi } from '../services/mockBackend';

// Custom Figma-style cursor (matching the game board)
const CUSTOM_CURSOR_SVG = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(-15 10 8)">
    <filter id="shadow">
      <feDropShadow dx="2" dy="3" stdDeviation="1.5" flood-opacity="0.4"/>
    </filter>
    <path d="M10 8 V26 L15 21 H24 L10 8 Z" fill="black" stroke="white" stroke-width="2" stroke-linejoin="round" style="filter:url(#shadow);"/>
    <path d="M10 8 V26 L15 21 H24 L10 8 Z" fill="black" stroke="white" stroke-width="2" stroke-linejoin="round"/>
  </g>
</svg>`;
const CUSTOM_CURSOR_URL = `url('data:image/svg+xml,${encodeURIComponent(CUSTOM_CURSOR_SVG)}') 10 8, auto`;

interface HomeProps {
  onGameCreated: (joinCode: string, playerId: string) => void;
  onGameJoined: (joinCode: string, playerId: string) => void;
}

export function Home({ onGameCreated, onGameJoined }: HomeProps) {
  const [displayName, setDisplayName] = useState('');
  const [joinCode, setJoinCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('join') || '').toUpperCase();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'choose' | 'settings' | 'create' | 'join' | 'rules'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('join') ? 'join' : 'choose';
  });
  
  // Character customization state
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [characterOptions, setCharacterOptions] = useState<CharacterOptions>({
    animalType: 0,
  });
  const [selectedColor, setSelectedColor] = useState('#9B51E0'); // Default purple
  
  // Game settings state
  const [gameSettings, setGameSettings] = useState<GameSettingsOptions>({
    pieceCount: 100,
    timerEnabled: false,
    timerDuration: 15,
  });

  // Server status check
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const serverUrl = serverUrl;

useEffect(() => {
  const checkServerHealth = async () => {
    try {
      if (USE_MOCK_BACKEND) {
        console.log("💾 Using local mock mode");
        return;
      }

      console.log("🔍 Health check URL:", `${serverUrl}/health`);

      const response = await fetch(`${serverUrl}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        // for now, remove the AbortSignal to avoid fake timeouts
        // signal: AbortSignal.timeout(10000),
      });

      console.log("✅ Health response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Health body:", data);
      }
    } catch (error) {
      console.warn("⚠️ Server connection warning:", error);
    }
  };

  checkServerHealth();
}, []);
  
  // Curated color palette inspired by the reference
  const availableColors = [
    '#FF1493', // Hot Pink
    '#FFD700', // Gold Yellow
    '#FF6347', // Tomato Orange
    '#00CED1', // Turquoise
    '#9370DB', // Medium Purple
    '#4169E1', // Royal Blue
    '#2ECC71', // Emerald Green
    '#FF7F7F', // Coral
    '#2C3E50', // Dark Navy
    '#8FBC8F', // Sage Green
    '#DDA15E', // Tan/Beige
    '#E74C3C', // Red
  ];
  
  // Ref for name input autofocus
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Randomize character and color when entering create/join mode
  useEffect(() => {
    if (mode === 'create' || mode === 'join') {
      // Randomize character
      const randomAnimalType = Math.floor(Math.random() * ANIMAL_TYPES);
      setCharacterOptions({ animalType: randomAnimalType });
      
      // Randomize color
      const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
      setSelectedColor(randomColor);
      
      // Auto-focus on name input
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [mode]);
  
  const handleCreateGame = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use mock backend if enabled
      if (USE_MOCK_BACKEND) {
        console.log('🎭 Using MOCK backend (local testing mode)');
        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const hostPlayer = {
          id: playerId,
          name: displayName,
          character: characterOptions,
          color: selectedColor,
          isHost: true,
        };

        const result = await mockApi.createGame(hostPlayer, gameSettings);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create game');
        }

        console.log('✅ Game created (MOCK):', result.game);
        onGameCreated(result.game.code, playerId);
        return;
      }

      // Original server code below
      // First, try to wake up the server with a health check
      console.log('🏥 Checking server health...');
      
      // Test 1: Root endpoint (simplest)
      try {
        // console.log('Testing root endpoint:', serverUrl);
        const rootTest = await fetch(serverUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (rootTest.ok) {
          const data = await rootTest.json();
          console.log('✅ Server is running!', data);
        }
      } catch (rootErr) {
        // Silently ignore pre-check failures - main request will handle errors
      }
      
      // Test 2: Health check endpoint
      try {
        // console.log('Testing health endpoint...');
        const healthUrl = `${serverUrl}/health`;
        const healthResponse = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (healthResponse.ok) {
          console.log('✅ Health check passed');
        }
      } catch (healthErr) {
        // Silently ignore pre-check failures
      }
      
      console.log('🎮 Creating game...');
      const response = await fetch(
        `${serverUrl}/games`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ 
            displayName: displayName.trim(),
            color: selectedColor,
            character: characterOptions,
            settings: gameSettings,
          }),
          signal: AbortSignal.timeout(20000)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Failed to create game' };
        }
        throw new Error(errorData.error || 'Failed to create game');
      }
      
      const data = await response.json();
      console.log('✅ Game created:', data);
      onGameCreated(data.joinCode, data.playerId);
    } catch (err: any) {
      // Only log as error if it's NOT a known network/timeout issue
      const isNetworkError = err.name === 'TypeError' && err.message === 'Failed to fetch';
      const isTimeout = err.name === 'TimeoutError' || err.message?.includes('timeout');
      
      if (isNetworkError || isTimeout) {
        console.warn('⚠️ Connection issue creating game:', err.message);
      } else {
        console.error('❌ Error creating game:', err);
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
      }
      
      // Provide detailed error message to UI
      let errorMessage = err.message || 'Failed to create game';
      
      if (err.message?.includes('Edge Function not deployed')) {
        setError(err.message);
      } else if (isTimeout) {
        setError(
          '⏱️ Server request timed out.\n\n' +
          'This could mean:\n' +
          '• Edge Function is starting up (cold start) - try again\n' +
          '• Edge Function is not deployed - see instructions below'
        );
      } else if (isNetworkError) {
        setError(
          '🚫 Cannot connect to server.\n\n' +
          '⚡ Quick Fix:\n' +
          '1. Open terminal: supabase login\n' +
          '2. Link project: supabase link --project-ref ' + projectId + '\n' +
          '3. Deploy: supabase functions deploy server\n' +
          '4. Refresh page and try again\n\n' +
          'Need help? Check DEPLOYMENT_INSTRUCTIONS.md'
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinGame = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use mock backend if enabled
      if (USE_MOCK_BACKEND) {
        console.log('🎭 Using MOCK backend (local testing mode)');
        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const player = {
          id: playerId,
          name: displayName,
          character: characterOptions,
          color: selectedColor,
          isHost: false,
        };

        const result = await mockApi.joinGame(joinCode.trim().toUpperCase(), player);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to join game');
        }

        console.log('✅ Joined game (MOCK):', result.game);
        onGameJoined(result.game.code, playerId);
        return;
      }

      // Original server code below
      const response = await fetch(
        `${serverUrl}/games/${joinCode.trim().toUpperCase()}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ 
            displayName: displayName.trim(),
            color: selectedColor,
            character: characterOptions,
          }),
          signal: AbortSignal.timeout(20000) // 20 second timeout for cold starts
        }
      );
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to join game');
      }
      
      const data = await response.json();
      console.log('✅ Joined game');
      onGameJoined(data.joinCode, data.playerId);
    } catch (err: any) {
      const isNetworkError = err.name === 'TypeError' && err.message === 'Failed to fetch';
      const isTimeout = err.name === 'TimeoutError' || err.message?.includes('fetch');

      if (isNetworkError || isTimeout) {
        console.warn('⚠️ Connection issue joining game:', err.message);
        setError('Cannot connect to server. Please ensure the server is deployed.');
      } else {
        console.error('Error joining game:', err);
        setError(err.message || 'Failed to join game');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <style>{`
        .home-cursor-root, .home-cursor-root * {
          cursor: ${CUSTOM_CURSOR_URL} !important;
        }
        
        @keyframes float-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(200px, -250px) scale(1.2);
          }
          50% {
            transform: translate(-220px, -150px) scale(0.85);
          }
          75% {
            transform: translate(250px, 180px) scale(1.1);
          }
        }
        
        @keyframes float-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-250px, 200px) scale(1.25);
          }
          66% {
            transform: translate(200px, -180px) scale(0.8);
          }
        }
        
        @keyframes float-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          20% {
            transform: translate(150px, 180px) scale(1.15);
          }
          40% {
            transform: translate(-180px, -200px) scale(0.85);
          }
          60% {
            transform: translate(220px, -130px) scale(1.3);
          }
          80% {
            transform: translate(-150px, 160px) scale(0.9);
          }
        }
        
        .blob-1 {
          animation: float-1 20s ease-in-out infinite;
        }
        
        .blob-2 {
          animation: float-2 24s ease-in-out infinite;
        }
        
        .blob-3 {
          animation: float-3 18s ease-in-out infinite;
        }
      `}</style>
      
      {/* Mock Mode Banner */}
      {USE_MOCK_BACKEND && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-center text-sm font-semibold shadow-lg">
          🎭 LOCAL TESTING MODE - Multiplayer simulation (localStorage only)
        </div>
      )}

      {/* Server Status Indicator (Production Mode) */}
      {!USE_MOCK_BACKEND && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 shadow-sm text-xs font-medium">
          <div className={`w-2 h-2 rounded-full ${
            serverStatus === 'online' ? 'bg-green-500' : 
            serverStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`} />
          {serverStatus === 'online' ? 'Server Online' : 
           serverStatus === 'checking' ? 'Connecting...' : 'Server Offline'}
        </div>
      )}
      
      <div 
        className="home-cursor-root min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #fef3f8 0%, #f8f0fe 50%, #fef8f3 100%)'
        }}
      >
        {/* Perspective grid overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(200, 200, 220, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(200, 200, 220, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            perspective: '500px',
            transformStyle: 'preserve-3d'
          }}
        >
          <div 
            style={{
              width: '100%',
              height: '100%',
              transform: 'rotateX(60deg)',
              transformOrigin: 'center center',
              backgroundImage: `
                linear-gradient(to right, rgba(200, 200, 220, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(200, 200, 220, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
        
        {/* Decorative gradient orbs - stronger and animated */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob blob-1 absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-pink-400/55 blur-3xl" />
          <div className="blob blob-2 absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-400/55 blur-3xl" />
          <div className="blob blob-3 absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-blue-400/50 blur-3xl" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-300 text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
              🍌 Mess
            </div>
          </div>
          
          {/* Main Card */}
          <div 
            className="rounded-3xl border overflow-hidden relative"
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderColor: 'rgba(150, 150, 170, 0.4)',
              boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            <div className="p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-5xl font-black mb-3 text-gray-900">
                  MESS
                </h1>
                <p className="text-gray-600 text-lg">
                  Chaos x lexicon
                </p>
              </div>
              
              <AnimatePresence mode="wait">
                {mode === 'choose' && (
                  <motion.div
                    key="choose"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Primary Button - New Game */}
                    <Button 
                      className="w-full h-14 text-lg font-semibold bg-black text-white hover:bg-gray-800 rounded-xl shadow-lg transition-all"
                      onClick={() => setMode('settings')}
                    >
                      New Game
                    </Button>
                    
                    {/* Divider */}
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-gray-300" />
                      <span className="text-sm text-gray-500">or</span>
                      <div className="flex-1 h-px bg-gray-300" />
                    </div>
                    
                    {/* Secondary Button - Join Game */}
                    <Button 
                      className="w-full h-14 text-lg font-semibold bg-white text-gray-900 hover:bg-gray-50 border-2 border-gray-300 rounded-xl shadow-sm transition-all"
                      onClick={() => setMode('join')}
                    >
                      Join a Game
                    </Button>
                    
                    {/* Link Button - Rules */}
                    <div className="pt-2 text-center">
                      <button
                        onClick={() => setMode('rules')}
                        className="text-gray-700 hover:text-gray-900 text-sm font-medium underline decoration-gray-400 hover:decoration-gray-900 transition-all"
                      >
                        The Rules
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {mode === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="text-center mb-4">
                      <h2 className="text-2xl font-black text-gray-900 mb-2">Game Settings</h2>
                      <p className="text-sm text-gray-600">
                        Configure your game before starting
                      </p>
                    </div>
                    
                    <GameSettings 
                      settings={gameSettings}
                      onChange={setGameSettings}
                    />
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setMode('choose');
                          setError('');
                        }}
                        className="flex-1 h-12 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={() => setMode('create')}
                        className="flex-[2] h-12 bg-black text-white hover:bg-gray-800 font-semibold rounded-xl shadow-lg"
                      >
                        Continue
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {mode === 'create' && (
                  <motion.div
                    key="create"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Character Preview */}
                    <div className="flex justify-center mb-2">
                      <AnimalAvatar 
                        options={characterOptions}
                        color={selectedColor}
                        size="xl"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Your Name
                      </label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your name"
                        maxLength={20}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateGame()}
                        className="h-12 rounded-xl bg-white border-2 border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 text-gray-900 placeholder:text-gray-400"
                        ref={nameInputRef}
                      />
                    </div>
                    
                    {/* Color Picker */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">
                        Your Color
                      </label>
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <div className="flex items-center justify-center gap-2.5">
                          {availableColors.slice(0, 6).map((color) => (
                            <div
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className="rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer flex-shrink-0"
                              style={{
                                width: '36px',
                                aspectRatio: '1',
                                background: color,
                                border: selectedColor === color ? '3px solid #000' : 'none',
                                boxSizing: 'border-box',
                                boxShadow: selectedColor === color 
                                  ? `0 3px 8px ${color}60`
                                  : `0 1px 3px ${color}40`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-2.5">
                          {availableColors.slice(6, 12).map((color) => (
                            <div
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className="rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer flex-shrink-0"
                              style={{
                                width: '36px',
                                aspectRatio: '1',
                                background: color,
                                border: selectedColor === color ? '3px solid #000' : 'none',
                                boxSizing: 'border-box',
                                boxShadow: selectedColor === color 
                                  ? `0 3px 8px ${color}60`
                                  : `0 1px 3px ${color}40`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Character Customizer */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">
                        Customize Your Character
                      </label>
                      <CharacterCustomizer 
                        options={characterOptions}
                        onChange={setCharacterOptions}
                      />
                    </div>
                    
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border border-red-200 rounded-xl p-3"
                      >
                        <p className="text-sm text-red-700 font-medium mb-2">
                          {error}
                        </p>
                        {error.includes('Cannot connect to server') && (
                          <div className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                            <p className="font-semibold mb-1">⚠️ Deploy the Edge Function:</p>
                            <code className="block bg-gray-900 text-green-400 px-2 py-1 rounded mt-1">
                              supabase functions deploy server
                            </code>
                            {serverStatus === 'offline' && (
                              <p className="mt-2 text-red-800 font-bold">
                                Current Status: SERVER OFFLINE
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setMode('settings');
                          setError('');
                        }}
                        className="flex-1 h-12 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handleCreateGame}
                        disabled={loading}
                        className="flex-[2] h-12 bg-black text-white hover:bg-gray-800 font-semibold rounded-xl shadow-lg"
                      >
                        {loading ? 'Creating...' : 'Start the game'}
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {mode === 'join' && (
                  <motion.div
                    key="join"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Character Preview */}
                    <div className="flex justify-center mb-2">
                      <AnimalAvatar 
                        options={characterOptions}
                        color={selectedColor}
                        size="xl"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Your Name
                      </label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your name"
                        maxLength={20}
                        className="h-12 rounded-xl bg-white border-2 border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 text-gray-900 placeholder:text-gray-400"
                        ref={nameInputRef}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Join Code
                      </label>
                      <Input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="6-LETTER CODE"
                        maxLength={6}
                        onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
                        className="h-12 rounded-xl bg-white border-2 border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 text-gray-900 placeholder:text-gray-400 uppercase tracking-widest text-center font-mono"
                      />
                    </div>
                    
                    {/* Color Picker */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">
                        Your Color
                      </label>
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <div className="flex items-center justify-center gap-2.5">
                          {availableColors.slice(0, 6).map((color) => (
                            <div
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className="rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer flex-shrink-0"
                              style={{
                                width: '36px',
                                aspectRatio: '1',
                                background: color,
                                border: selectedColor === color ? '3px solid #000' : 'none',
                                boxSizing: 'border-box',
                                boxShadow: selectedColor === color 
                                  ? `0 3px 8px ${color}60`
                                  : `0 1px 3px ${color}40`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-2.5">
                          {availableColors.slice(6, 12).map((color) => (
                            <div
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className="rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer flex-shrink-0"
                              style={{
                                width: '36px',
                                aspectRatio: '1',
                                background: color,
                                border: selectedColor === color ? '3px solid #000' : 'none',
                                boxSizing: 'border-box',
                                boxShadow: selectedColor === color 
                                  ? `0 3px 8px ${color}60`
                                  : `0 1px 3px ${color}40`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Character Customizer */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">
                        Customize Your Character
                      </label>
                      <CharacterCustomizer 
                        options={characterOptions}
                        onChange={setCharacterOptions}
                      />
                    </div>
                    
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border border-red-200 rounded-xl p-3"
                      >
                        <p className="text-sm text-red-700 font-medium mb-2">
                          {error}
                        </p>
                        {error.includes('Cannot connect to server') && (
                          <div className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                            <p className="font-semibold mb-1">⚠️ Deploy the Edge Function:</p>
                            <code className="block bg-gray-900 text-green-400 px-2 py-1 rounded mt-1">
                              supabase functions deploy server
                            </code>
                            {serverStatus === 'offline' && (
                              <p className="mt-2 text-red-800 font-bold">
                                Current Status: SERVER OFFLINE
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setMode('choose');
                          setError('');
                        }}
                        className="flex-1 h-12 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handleJoinGame}
                        disabled={loading}
                        className="flex-[2] h-12 bg-black text-white hover:bg-gray-800 font-semibold rounded-xl shadow-lg"
                      >
                        {loading ? 'Joining...' : 'Join Game'}
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {mode === 'rules' && (
                  <motion.div
                    key="rules"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="space-y-4 text-left">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">🎯 Objective</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Create valid words on a shared 100×100 grid. Use all your tiles to complete a round and hit the MESS button first for bonus points!
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">🎮 How to Play</h3>
                        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside leading-relaxed">
                          <li>Everyone starts with 4 tiles</li>
                          <li>Drag tiles to form connected words on the grid</li>
                          <li>Complete all your tiles in valid words to finish a round</li>
                          <li>First to finish gets the MESS button (+25 points)</li>
                          <li>Everyone gets 2 more tiles for the next round</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">💯 Scoring</h3>
                        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside leading-relaxed">
                          <li>+5 points per unique word</li>
                          <li>+25 points for pressing MESS first</li>
                          <li>-5 points per "I'm stuck" use</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">🏁 Winning</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          When tiles run out and someone completes the final round, the player with the most points wins!
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        variant="outline"
                        onClick={() => setMode('choose')}
                        className="w-full h-12 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50"
                      >
                        Back to Home
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Footer hint */}
          {mode === 'choose' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-6 text-sm text-gray-600"
            >
              Create a new game or join with a 6-letter code
            </motion.p>
          )}
        </motion.div>
      </div>
      
      {/* Toast notifications for Home page */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
        <ToastContainer />
      </div>
    </>
  );
}