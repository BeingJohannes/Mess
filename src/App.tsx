import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Game } from './pages/Game';
import { safeStorage } from './utils/safe-storage.tsx';

function App() {
  const [appState, setAppState] = useState<{
    page: 'home' | 'game';
    joinCode: string | null;
    playerId: string | null;
  }>({
    page: 'home',
    joinCode: null,
    playerId: null,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  
// Check storage for existing game session
useEffect(() => {
  const restoreSession = async () => {
    try {
      const savedJoinCode = safeStorage.getItem('mess_join_code');
      const savedPlayerId = safeStorage.getItem('mess_player_id');

      if (savedJoinCode && savedPlayerId) {
        console.log('🔍 Found saved session:', savedJoinCode);

        // Check with the server before restoring
        const res = await fetch(`${serverUrl}/state?joinCode=${savedJoinCode}`, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        if (res.ok) {
          const state = await res.json();

          if (state && !state.error) {
            console.log('✅ Session exists on server, restoring');
            setAppState({
              page: 'game',
              joinCode: savedJoinCode,
              playerId: savedPlayerId,
            });
            return;
          }
        }

        // If we reach here: server says session doesn't exist
        console.warn('⚠️ Saved session is invalid, clearing.');
        safeStorage.removeItem('mess_join_code');
        safeStorage.removeItem('mess_player_id');
      }
    } catch (err) {
      console.error('❌ Error during initialization:', err);
    } finally {
      setIsInitialized(true);
    }
  };

  restoreSession();
}, []);
  
  const handleGameCreated = (joinCode: string, playerId: string) => {
    safeStorage.setItem('mess_join_code', joinCode);
    safeStorage.setItem('mess_player_id', playerId);
    
    setAppState({
      page: 'game',
      joinCode,
      playerId,
    });
  };
  
  const handleGameJoined = (joinCode: string, playerId: string) => {
    safeStorage.setItem('mess_join_code', joinCode);
    safeStorage.setItem('mess_player_id', playerId);
    
    setAppState({
      page: 'game',
      joinCode,
      playerId,
    });
  };
  
  const handleLeaveGame = () => {
    safeStorage.removeItem('mess_join_code');
    safeStorage.removeItem('mess_player_id');
    
    setAppState({
      page: 'home',
      joinCode: null,
      playerId: null,
    });
  };
  
  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (appState.page === 'home') {
    return (
      <Home 
        onGameCreated={handleGameCreated}
        onGameJoined={handleGameJoined}
      />
    );
  }
  
  if (appState.page === 'game' && appState.joinCode && appState.playerId) {
    return (
      <Game
        joinCode={appState.joinCode}
        playerId={appState.playerId}
        onLeaveGame={handleLeaveGame}
      />
    );
  }
  
  // Fallback for invalid state
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center space-y-4 max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
        <p className="text-gray-600">The application is in an invalid state.</p>
        <pre className="bg-gray-100 p-3 rounded text-left text-xs overflow-auto max-h-40 border">
          {JSON.stringify(appState, null, 2)}
        </pre>
        <button 
          onClick={() => {
            safeStorage.removeItem('mess_join_code');
            safeStorage.removeItem('mess_player_id');
            setAppState({ page: 'home', joinCode: null, playerId: null });
            window.location.reload();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
        >
          Reset Application
        </button>
      </div>
    </div>
  );
}

export default App;