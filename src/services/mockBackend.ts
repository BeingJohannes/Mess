/**
 * 🎭 MOCK BACKEND - For Local Testing Only
 * 
 * This simulates the Supabase Edge Function locally in the browser.
 * When ready for real multiplayer, set USE_MOCK_BACKEND = false
 */

export const USE_MOCK_BACKEND = false; // Set to false when Edge Function is deployed

// Mock storage using localStorage
const STORAGE_KEY = 'mess_mock_data';

interface MockGame {
  id: string;
  code: string;
  hostPlayer: any;
  settings: any;
  status: 'waiting' | 'in_progress' | 'finished';
  players: any[];
  board: any;
  remainingPieces: string[];
  createdAt: string;
}

class MockBackend {
  private games: Map<string, MockGame> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.games = new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.log('No mock data to load');
    }
  }

  private saveToStorage() {
    const obj = Object.fromEntries(this.games.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createGame(hostPlayer: any, settings: any) {
    const id = this.generateId();
    const code = this.generateCode();

    // Generate initial pieces
    const remainingPieces: string[] = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const totalPieces = settings.pieceCount || settings.totalPieces || 100;
    for (let i = 0; i < totalPieces; i++) {
      remainingPieces.push(letters[Math.floor(Math.random() * letters.length)]);
    }

    // Deal 4 initial tiles to the host player (matching server behavior at line 245)
    const initialTiles = [];
    for (let i = 0; i < 4; i++) {
      const letterIndex = Math.floor(Math.random() * remainingPieces.length);
      const letter = remainingPieces.splice(letterIndex, 1)[0];
      
      initialTiles.push({
        id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        game_id: id,
        letter,
        owner_player_id: hostPlayer.id,
        location_type: 'rack',
        board_row: null,
        board_col: i, // Position in rack (0-3)
        created_at: new Date().toISOString(),
      });
    }

    // Ensure hostPlayer has current_tiles array and is_creator flag
    const normalizedHostPlayer = {
      ...hostPlayer,
      current_tiles: initialTiles.map(t => t.id),
      is_creator: true // Mark the host as creator
    };

    const game: MockGame = {
      id,
      code,
      hostPlayer: normalizedHostPlayer,
      settings,
      status: 'in_progress', // Auto-start like the real server does (line 208 of server/index.tsx)
      players: [normalizedHostPlayer],
      board: {
        tiles: initialTiles,
        dimensions: { width: 15, height: 15 }
      },
      remainingPieces,
      createdAt: new Date().toISOString()
    };

    this.games.set(id, game);
    this.saveToStorage();

    return { success: true, game };
  }

  async joinGame(code: string, player: any) {
    const game = Array.from(this.games.values()).find(g => g.code === code);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'waiting') {
      return { success: false, error: 'Game already started' };
    }

    // Check if player already in game
    if (!game.players.find(p => p.id === player.id)) {
      // Ensure player has current_tiles array
      const normalizedPlayer = {
        ...player,
        current_tiles: player.current_tiles || []
      };
      game.players.push(normalizedPlayer);
      this.saveToStorage();
    }

    return { success: true, game };
  }

  async getGame(gameId: string) {
    // Support looking up by ID or by code
    let game = this.games.get(gameId);
    
    // If not found by ID, try by code
    if (!game) {
      game = Array.from(this.games.values()).find(g => g.code === gameId);
    }
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }
    return { success: true, game };
  }

  async startGame(gameId: string) {
    // Support looking up by ID or by code
    let game = this.games.get(gameId);
    
    // If not found by ID, try by code
    if (!game) {
      game = Array.from(this.games.values()).find(g => g.code === gameId);
    }
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    game.status = 'in_progress';
    this.saveToStorage();

    return { success: true, game };
  }

  async drawPieces(gameId: string, playerId: string, count: number) {
    // Support looking up by ID or by code
    let game = this.games.get(gameId);
    
    // If not found by ID, try by code
    if (!game) {
      game = Array.from(this.games.values()).find(g => g.code === gameId);
    }
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const pieces = game.remainingPieces.splice(0, count);
    this.saveToStorage();

    return { success: true, pieces, remaining: game.remainingPieces.length };
  }

  async placeTile(gameId: string, tile: any) {
    // Support looking up by ID or by code
    let game = this.games.get(gameId);
    
    // If not found by ID, try by code
    if (!game) {
      game = Array.from(this.games.values()).find(g => g.code === gameId);
    }
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    game.board.tiles.push(tile);
    this.saveToStorage();

    return { success: true, board: game.board };
  }

  async moveTile(gameId: string, playerId: string, tileId: string, to: any) {
    // Support looking up by ID or by code
    let game = this.games.get(gameId);
    
    // If not found by ID, try by code
    if (!game) {
      game = Array.from(this.games.values()).find(g => g.code === gameId);
    }
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const tiles = game.board.tiles;
    const tileIndex = tiles.findIndex((t: any) => t.id === tileId);
    
    if (tileIndex === -1) {
      return { success: false, error: 'Tile not found' };
    }

    const tile = tiles[tileIndex];
    
    // Update tile location
    if (to.locationType === 'board') {
      tile.location_type = 'board';
      tile.board_row = to.row;
      tile.board_col = to.col;
      tile.owner_player_id = playerId;
    } else if (to.locationType === 'rack') {
      tile.location_type = 'rack';
      tile.board_row = null;
      tile.board_col = typeof to.rackIndex === 'number' ? to.rackIndex : 0;
      tile.owner_player_id = playerId;
    }
    
    tiles[tileIndex] = tile;
    this.saveToStorage();

    return { success: true };
  }

  async messItUp(gameId: string, playerId: string) {
    // Support looking up by ID or by code
    let game = this.games.get(gameId);
    
    // If not found by ID, try by code
    if (!game) {
      game = Array.from(this.games.values()).find(g => g.code === gameId);
    }
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    // Deal 2 new tiles to all players
    const tiles = game.board.tiles;
    
    for (const player of game.players) {
      for (let i = 0; i < 2 && game.remainingPieces.length > 0; i++) {
        const letterIndex = Math.floor(Math.random() * game.remainingPieces.length);
        const letter = game.remainingPieces.splice(letterIndex, 1)[0];
        
        // Find the first empty rack slot
        const playerRackTiles = tiles.filter((t: any) => 
          t.owner_player_id === player.id && t.location_type === 'rack'
        );
        const occupiedSlots = new Set(playerRackTiles.map((t: any) => t.board_col));
        let rackSlot = 0;
        while (rackSlot < 7 && occupiedSlots.has(rackSlot)) {
          rackSlot++;
        }
        
        if (rackSlot < 7) {
          tiles.push({
            id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            game_id: game.id,
            letter,
            owner_player_id: player.id,
            location_type: 'rack',
            board_row: null,
            board_col: rackSlot,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
    
    this.saveToStorage();

    return { success: true };
  }

  async validateWord(word: string) {
    // Simple mock validation - just check length
    const isValid = word.length >= 2;
    return { 
      success: true, 
      isValid, 
      message: isValid ? 'Valid word' : 'Word too short (mock validation)' 
    };
  }

  // Simulate real-time updates (called periodically)
  async pollGame(gameId: string) {
    return this.getGame(gameId);
  }
}

// Singleton instance
export const mockBackend = new MockBackend();

/**
 * Mock API client that matches the real API interface
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  async createGame(hostPlayer: any, settings: any) {
    console.log('🎭 MOCK: Creating game...', { hostPlayer, settings });
    await delay(300); // Simulate network delay
    return mockBackend.createGame(hostPlayer, settings);
  },

  async joinGame(code: string, player: any) {
    console.log('🎭 MOCK: Joining game...', { code, player });
    await delay(300);
    return mockBackend.joinGame(code, player);
  },

  async getGame(gameId: string) {
    console.log('🎭 MOCK: Getting game...', { gameId });
    await delay(100);
    return mockBackend.getGame(gameId);
  },

  async startGame(gameId: string) {
    console.log('🎭 MOCK: Starting game...', { gameId });
    await delay(200);
    return mockBackend.startGame(gameId);
  },

  async drawPieces(gameId: string, playerId: string, count: number) {
    console.log('🎭 MOCK: Drawing pieces...', { gameId, playerId, count });
    await delay(100);
    return mockBackend.drawPieces(gameId, playerId, count);
  },

  async placeTile(gameId: string, tile: any) {
    console.log('🎭 MOCK: Placing tile...', { gameId, tile });
    await delay(100);
    return mockBackend.placeTile(gameId, tile);
  },

  async moveTile(gameId: string, playerId: string, tileId: string, to: any) {
    console.log('🎭 MOCK: Moving tile...', { gameId, playerId, tileId, to });
    await delay(100);
    return mockBackend.moveTile(gameId, playerId, tileId, to);
  },

  async messItUp(gameId: string, playerId: string) {
    console.log('🎭 MOCK: Messing it up...', { gameId, playerId });
    await delay(100);
    return mockBackend.messItUp(gameId, playerId);
  },

  async validateWord(word: string) {
    console.log('🎭 MOCK: Validating word...', { word });
    await delay(200);
    return mockBackend.validateWord(word);
  },

  async pollGame(gameId: string) {
    await delay(50);
    return mockBackend.pollGame(gameId);
  }
};
