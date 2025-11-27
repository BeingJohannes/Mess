// Re-export the non-JSX server implementation to avoid TSX imports during Deno bundling.
export { default } from './index.ts';
console.log('Environment check:', {
  hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
  hasSupabaseServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
});

const app = new Hono();

// CORS must be very permissive
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
  credentials: false,
}));
app.use('*', logger(console.log));

console.log('✓ Middleware configured');

// Root health check endpoint (for debugging deployment) - WITHOUT prefix
app.get('/', (c) => {
  console.log('✓ Root endpoint hit');
  return c.json({ 
    status: 'ok', 
    message: 'Mess server is running at root',
    timestamp: new Date().toISOString(),
    routes: [
      '/health',
      '/make-server-6ff8009f/health',
      '/make-server-6ff8009f/games',
    ]
  });
});

// Health check endpoint - WITHOUT prefix for easy testing
app.get('/health', (c) => {
  console.log('✓ Health check (no prefix)');
  return c.json({ 
    status: 'ok', 
    message: 'Health check passed (no prefix)',
    timestamp: new Date().toISOString() 
  });
});

// Health check endpoint - WITH prefix (as expected by frontend)
app.get('/make-server-6ff8009f/health', (c) => {
  console.log('✓ Health check (with prefix)');
  return c.json({ 
    status: 'ok', 
    message: 'Health check passed (with prefix)',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasSupabaseServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    }
  });
});

// Initialize Supabase client safely
const getSupabase = () => {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  // If keys are missing, we return a dummy client or throw inside the route handler
  // preventing the server from crashing on boot
  if (!url || !key) {
    console.warn('⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    // Return a client that will fail on use, but not crash immediately
    return createClient(url || 'https://placeholder.supabase.co', key || 'placeholder');
  }
  
  return createClient(url, key);
};

const supabase = getSupabase();

console.log('✓ Supabase client initialized');

// Helper to generate short join codes
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to generate player colors (Vibrant Figma-like)
const PLAYER_COLORS = [
  '#E05243', // Red
  '#2D9CDB', // Blue
  '#27AE60', // Green
  '#9B51E0', // Purple
  '#F2994A', // Orange
  '#EB5757', // Pink
  '#16A085', // Teal
  '#8E44AD', // Deep Purple
  '#2980B9', // Dark Blue
  '#C0392B', // Dark Red
];

function getPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

// Helper function to check if tiles are connected
function areAllTilesConnected(positions: Array<{row: number, col: number}>): boolean {
  if (positions.length === 0) return false;
  if (positions.length === 1) return true;
  
  const visited = new Set<string>();
  const queue = [positions[0]];
  visited.add(`${positions[0].row},${positions[0].col}`);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // Check all adjacent positions
    const adjacent = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ];
    
    for (const adj of adjacent) {
      const key = `${adj.row},${adj.col}`;
      if (!visited.has(key) && positions.some(p => p.row === adj.row && p.col === adj.col)) {
        visited.add(key);
        queue.push(adj);
      }
    }
  }
  
  return visited.size === positions.length;
}

// Add explicit OPTIONS handler to ensure CORS preflight works
app.options('*', (c) => {
  return c.text('', 204);
});

// POST /make-server-6ff8009f/validate - Validate a list of words
app.post('/make-server-6ff8009f/validate', async (c) => {
  try {
    const { words } = await c.req.json();
    if (!Array.isArray(words)) {
      return c.json({ error: 'words must be an array' }, 400);
    }

    const uniqueWords = [...new Set(words.map((w: string) => w.toUpperCase()))];
    const results: Record<string, boolean> = {};
    
    await Promise.all(uniqueWords.map(async (word) => {
      if (word.length < 2) {
        results[word] = false;
        return;
      }
      
      // Check cache
      const cacheKey = `valid_word:${word}`;
      const cached = await kv.get(cacheKey);
      
      if (cached !== null && cached !== undefined) {
        results[word] = !!cached;
      } else {
        // Fetch from API
        const isValid = await isValidWordOnline(word);
        results[word] = isValid;
        // Cache it
        await kv.set(cacheKey, isValid);
      }
    }));
    
    return c.json({ results });
  } catch (error) {
    console.error('Error validating words:', error);
    return c.json({ error: 'Failed to validate words' }, 500);
  }
});

// POST /make-server-6ff8009f/games - Create a new game
app.post('/make-server-6ff8009f/games', async (c) => {
  try {
    const { displayName, color, character, settings } = await c.req.json();
    
    if (!displayName || displayName.trim() === '') {
      return c.json({ error: 'Display name is required' }, 400);
    }
    
    const gameId = crypto.randomUUID();
    const playerId = crypto.randomUUID();
    const joinCode = generateJoinCode();
    
    // Use pieceCount from settings, or default to 100
    const pieceCount = settings?.pieceCount || 100;
    const letterBag = createLetterBag(pieceCount);
    
    // Calculate timer end time if timer is enabled
    let timerStartedAt = null;
    let timerEndsAt = null;
    if (settings?.timerEnabled && settings?.timerDuration) {
      timerStartedAt = new Date().toISOString();
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + settings.timerDuration);
      timerEndsAt = endTime.toISOString();
    }
    
    // Create game - auto-start immediately
    const game = {
      id: gameId,
      join_code: joinCode,
      creator_id: playerId,
      status: 'in_progress', // Auto-start for single player
      max_players: 8,
      letter_bag: letterBag,
      total_tiles_initial: letterBag.length,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      winner_player_id: null,
      settings: settings || { pieceCount: 100, timerEnabled: false, timerDuration: 15 },
      timer_started_at: timerStartedAt,
      timer_ends_at: timerEndsAt,
    };
    
    await kv.set(`game:${gameId}`, game);
    await kv.set(`game:joincode:${joinCode}`, gameId);
    
    // Create creator player with character customization
    const player = {
      id: playerId,
      game_id: gameId,
      display_name: displayName.trim(),
      is_creator: true,
      is_active: true,
      current_tiles: [],
      color: color || getPlayerColor(0),
      character: character || { hairStyle: 0, accessory: 0, skinTone: 2, expression: 0 },
      avatar_seed: crypto.randomUUID().slice(0, 8),
      has_finished: false,
      finish_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await kv.set(`player:${playerId}`, player);
    await kv.set(`game:${gameId}:players`, [playerId]);
    
    // Deal initial tiles to the creator (4 tiles)
    const initialTiles = [];
    for (let i = 0; i < 4; i++) {
      const letterIndex = Math.floor(Math.random() * game.letter_bag.length);
      const letter = game.letter_bag.splice(letterIndex, 1)[0];
      
      const tile = {
        id: crypto.randomUUID(),
        game_id: gameId,
        letter,
        owner_player_id: playerId,
        location_type: 'rack',
        board_row: null,
        board_col: i, // Position in rack
        created_at: new Date().toISOString(),
      };
      
      initialTiles.push(tile);
    }
    
    // Update game with new letter bag
    await kv.set(`game:${gameId}`, game);
    await kv.set(`game:${gameId}:tiles`, initialTiles);
    await kv.set(`game:${gameId}:chat`, []);
    
    console.log(`Game created: ${gameId}, Join code: ${joinCode}`);
    
    return c.json({
      gameId,
      playerId,
      joinCode,
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return c.json({ error: 'Failed to create game' }, 500);
  }
});

// POST /make-server-6ff8009f/games/:joinCode/join - Join an existing game
app.post('/make-server-6ff8009f/games/:joinCode/join', async (c) => {
  try {
    const joinCode = c.req.param('joinCode').toUpperCase();
    const { displayName, color, character } = await c.req.json();
    
    if (!displayName || displayName.trim() === '') {
      return c.json({ error: 'Display name is required' }, 400);
    }
    
    const gameId = await kv.get(`game:joincode:${joinCode}`);
    
    if (!gameId) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    const game = await kv.get(`game:${gameId}`);
    
    if (!game) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    if (game.status === 'finished') {
      return c.json({ error: 'Game has already finished' }, 400);
    }
    
    const playerIds = await kv.get(`game:${gameId}:players`) || [];
    
    if (playerIds.length >= game.max_players) {
      return c.json({ error: 'Game is full' }, 400);
    }
    
    const playerId = crypto.randomUUID();
    
    const player = {
      id: playerId,
      game_id: gameId,
      display_name: displayName.trim(),
      is_creator: false,
      is_active: true,
      current_tiles: [],
      color: color || getPlayerColor(playerIds.length),
      character: character || { hairStyle: 0, accessory: 0, skinTone: 2, expression: 0 },
      avatar_seed: crypto.randomUUID().slice(0, 8),
      has_finished: false,
      finish_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await kv.set(`player:${playerId}`, player);
    playerIds.push(playerId);
    await kv.set(`game:${gameId}:players`, playerIds);
    
    // If game is already in progress, deal 4 tiles to the new player
    if (game.status === 'in_progress') {
      const tiles = await kv.get(`game:${gameId}:tiles`) || [];
      let letterBag = [...game.letter_bag];
      const playerTiles = [];
      
      for (let i = 0; i < 4 && letterBag.length > 0; i++) {
        const letter = letterBag.pop();
        const tileId = crypto.randomUUID();
        
        const tile = {
          id: tileId,
          game_id: gameId,
          letter: letter,
          value: getLetterValue(letter),
          location_type: 'rack',
          owner_player_id: playerId,
          board_row: null,
          board_col: i, // Assign sequential slots 0, 1, 2, 3
          last_moved_by_player_id: playerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        tiles.push(tile);
        playerTiles.push(tileId);
      }
      
      player.current_tiles = playerTiles;
      await kv.set(`player:${playerId}`, player);
      
      game.letter_bag = letterBag;
      await kv.set(`game:${gameId}`, game);
      await kv.set(`game:${gameId}:tiles`, tiles);
    }
    
    // Add system message
    const chatMessages = await kv.get(`game:${gameId}:chat`) || [];
    const systemMessage = {
      id: crypto.randomUUID(),
      game_id: gameId,
      sender_type: 'system',
      sender_player_id: null,
      content: `${displayName} joined the game`,
      metadata: { type: 'player_joined', playerId },
      created_at: new Date().toISOString(),
    };
    
    chatMessages.push(systemMessage);
    await kv.set(`game:${gameId}:chat`, chatMessages);
    
    console.log(`Player ${playerId} joined game ${gameId}`);
    
    return c.json({
      gameId,
      playerId,
      joinCode,
    });
  } catch (error) {
    console.error('Error joining game:', error);
    return c.json({ error: 'Failed to join game' }, 500);
  }
});

// POST /make-server-6ff8009f/games/:gameId/start - Start the game
app.post('/make-server-6ff8009f/games/:gameId/start', async (c) => {
  try {
    const gameId = c.req.param('gameId');
    const { playerId } = await c.req.json();
    
    const game = await kv.get(`game:${gameId}`);
    
    if (!game) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    const player = await kv.get(`player:${playerId}`);
    
    if (!player || !player.is_creator) {
      return c.json({ error: 'Only the creator can start the game' }, 403);
    }
    
    if (game.status !== 'waiting') {
      return c.json({ error: 'Game has already started' }, 400);
    }
    
      // Deal 4 tiles to each player
    const playerIds = await kv.get(`game:${gameId}:players`) || [];
    const tiles = [];
    let letterBag = [...game.letter_bag];
    
    for (const pId of playerIds) {
      const p = await kv.get(`player:${pId}`);
      if (!p) continue; // Skip if player doesn't exist
      
      const playerTiles = [];
      
      for (let i = 0; i < 4 && letterBag.length > 0; i++) {
        const letter = letterBag.pop();
        const tileId = crypto.randomUUID();
        
        const tile = {
          id: tileId,
          game_id: gameId,
          letter: letter,
          value: getLetterValue(letter),
          location_type: 'rack',
          owner_player_id: pId,
          board_row: null,
          board_col: i, // Assign sequential slots 0, 1, 2, 3
          last_moved_by_player_id: pId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        tiles.push(tile);
        playerTiles.push(tileId);
      }
      
      p.current_tiles = playerTiles;
      p.is_active = true; // Ensure player is marked as active
      await kv.set(`player:${pId}`, p);
    }
    
    // Update game status
    game.status = 'in_progress';
    game.letter_bag = letterBag;
    game.updated_at = new Date().toISOString();
    await kv.set(`game:${gameId}`, game);
    await kv.set(`game:${gameId}:tiles`, tiles);
    
    // Add system message
    const chatMessages = await kv.get(`game:${gameId}:chat`) || [];
    const systemMessage = {
      id: crypto.randomUUID(),
      game_id: gameId,
      sender_type: 'system',
      sender_player_id: null,
      content: 'Game started! Each player gets 4 tiles.',
      metadata: { type: 'game_started' },
      created_at: new Date().toISOString(),
    };
    
    chatMessages.push(systemMessage);
    await kv.set(`game:${gameId}:chat`, chatMessages);
    
    console.log(`Game ${gameId} started`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error starting game:', error);
    return c.json({ error: 'Failed to start game' }, 500);
  }
});

// POST /make-server-6ff8009f/games/:gameId/move - Move a tile
app.post('/make-server-6ff8009f/games/:gameId/move', async (c) => {
  try {
    const gameId = c.req.param('gameId');
    const { playerId, tileId, to } = await c.req.json();
    
    const game = await kv.get(`game:${gameId}`);
    if (!game || game.status !== 'in_progress') {
      return c.json({ error: 'Game is not in progress' }, 400);
    }
    
    const tiles = await kv.get(`game:${gameId}:tiles`) || [];
    const tileIndex = tiles.findIndex((t: any) => t.id === tileId);
    
    if (tileIndex === -1) {
      return c.json({ error: 'Tile not found' }, 404);
    }
    
    const tile = tiles[tileIndex];
    const player = await kv.get(`player:${playerId}`);
    
    if (!player) {
      return c.json({ error: 'Player not found' }, 404);
    }
    
    // Update tile location
    if (to.locationType === 'board') {
      // Remove from rack if it was there
      if (tile.location_type === 'rack') {
        const currentTiles = player.current_tiles.filter((id: string) => id !== tileId);
        player.current_tiles = currentTiles;
        await kv.set(`player:${playerId}`, player);
      }
      
      tile.location_type = 'board';
      tile.board_row = to.row;
      tile.board_col = to.col;
      // Set/keep owner_player_id to track which tiles belong to which player
      // This is needed for round completion validation
      tile.owner_player_id = playerId;
    } else if (to.locationType === 'rack') {
      // Move back to rack (or within rack)
      
      // 1. Update 'current_tiles' list (for ownership tracking)
      if (tile.location_type === 'board') {
        if (!player.current_tiles.includes(tileId)) {
          player.current_tiles.push(tileId);
          await kv.set(`player:${playerId}`, player);
        }
      }
      
      // 2. Handle Rack Placement with Shift Logic
      const targetIndex = typeof to.rackIndex === 'number' 
        ? Math.max(0, Math.min(6, to.rackIndex)) 
        : 0; // Default to 0 if not specified, but should be.

      // Get all OTHER rack tiles for this player
      const rackTiles = tiles.filter((t: any) => 
         t.owner_player_id === playerId && 
         t.location_type === 'rack' && 
         t.id !== tileId
      );
      
      // Create virtual rack representation
      const rack = Array(7).fill(null);
      rackTiles.forEach((t: any) => {
         if (typeof t.board_col === 'number' && t.board_col >= 0 && t.board_col < 7) {
             rack[t.board_col] = t;
         }
      });
      
      // Determine which tiles need to shift
      // If the target slot is occupied, we shift it and subsequent neighbors to the right.
      if (rack[targetIndex]) {
          let tilesToShift: any[] = [];
          let i = targetIndex;
          
          // Find contiguous block of tiles starting at targetIndex
          while (i < 7 && rack[i]) {
              tilesToShift.push(rack[i]);
              i++;
          }
          
          // Shift them right
          // We iterate backwards to avoid overwriting
          // If we have tiles at [3, 4] and insert at 3.
          // Tile at 4 moves to 5. Tile at 3 moves to 4.
          // tilesToShift = [T3, T4]
          for (let k = tilesToShift.length - 1; k >= 0; k--) {
              const t = tilesToShift[k];
              const newPos = targetIndex + 1 + k;
              
              if (newPos < 7) {
                  t.board_col = newPos;
                  rack[newPos] = t; // Update virtual rack
                  
                  // Update real tiles array
                  const idx = tiles.findIndex((x: any) => x.id === t.id);
                  if (idx !== -1) tiles[idx] = t;
              } else {
                  // Overflow handling:
                  // Try to find the first empty spot from the beginning (0)
                  // Because shifting right pushed it off the edge.
                  const firstEmpty = rack.findIndex(x => x === null);
                  if (firstEmpty !== -1) {
                      t.board_col = firstEmpty;
                      rack[firstEmpty] = t;
                      const idx = tiles.findIndex((x: any) => x.id === t.id);
                      if (idx !== -1) tiles[idx] = t;
                  }
              }
          }
      }

      // Set the moved tile's position
      tile.location_type = 'rack';
      tile.board_row = null;
      tile.board_col = targetIndex;
      tile.owner_player_id = playerId;
    }
    
    tile.last_moved_by_player_id = playerId;
    tile.updated_at = new Date().toISOString();
    tiles[tileIndex] = tile;
    await kv.set(`game:${gameId}:tiles`, tiles);
    
    // Check for new words if tile was placed on board
    if (to.locationType === 'board') {
      const currentWords = detectWords(tiles);
      const completedWords = await kv.get(`game:${gameId}:completed_words`) || [];
      const newWords = findNewWords(currentWords, completedWords);
      
      const chatMessages = await kv.get(`game:${gameId}:chat`) || [];
      
      // Add newly completed valid words
      for (const newWord of newWords) {
        const completed = {
          id: crypto.randomUUID(),
          game_id: gameId,
          player_id: playerId,
          word: newWord.word,
          length: newWord.length,
          direction: newWord.direction,
          start_row: newWord.start_row,
          start_col: newWord.start_col,
          tiles_involved: newWord.tiles,
          created_at: new Date().toISOString(),
        };
        
        completedWords.push(completed);
        
        // System message for word
        const wordMessage = {
          id: crypto.randomUUID(),
          game_id: gameId,
          sender_type: 'system',
          sender_player_id: null,
          content: `${player.display_name} completed "${newWord.word}"!`,
          metadata: { type: 'word_completed', word: newWord.word, playerId },
          created_at: new Date().toISOString(),
        };
        chatMessages.push(wordMessage);
        
        // AI comment for words of length >= 6
        if (newWord.length >= 6) {
          const aiComment = await generateBananaBotComment('word', {
            playerName: player.display_name,
            word: newWord.word,
          });
          
          const aiMessage = {
            id: crypto.randomUUID(),
            game_id: gameId,
            sender_type: 'ai',
            sender_player_id: null,
            content: aiComment,
            metadata: { type: 'ai_comment', word: newWord.word },
            created_at: new Date().toISOString(),
          };
          chatMessages.push(aiMessage);
        }
      }
      
      await kv.set(`game:${gameId}:completed_words`, completedWords);
      await kv.set(`game:${gameId}:chat`, chatMessages);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error moving tile:', error);
    return c.json({ error: 'Failed to move tile' }, 500);
  }
});

// POST /make-server-6ff8009f/games/:gameId/split - Trigger MESS IT UP!
app.post('/make-server-6ff8009f/games/:gameId/split', async (c) => {
  try {
    const gameId = c.req.param('gameId');
    const { playerId } = await c.req.json();
    
    const game = await kv.get(`game:${gameId}`);
    if (!game || game.status !== 'in_progress') {
      return c.json({ error: 'Game is not in progress' }, 400);
    }
    
    const player = await kv.get(`player:${playerId}`);
    if (!player) {
      return c.json({ error: 'Player not found' }, 404);
    }
    
    // Check if a round winner is already locked
    if (game.current_round_winner_id && game.current_round_winner_id !== playerId) {
      return c.json({ error: 'Another player has already won this round!' }, 400);
    }
    
    // Get player's tiles on board
    const tiles = await kv.get(`game:${gameId}:tiles`) || [];
    const playerBoardTiles = tiles.filter((t: any) => 
      t.location_type === 'board' && t.owner_player_id === playerId
    );
    const playerRackTiles = tiles.filter((t: any) => 
      t.location_type === 'rack' && t.owner_player_id === playerId
    );
    
    // Validate: rack must be empty (all tiles on board)
    if (playerRackTiles.length > 0) {
      return c.json({ error: 'Your rack must be empty to MESS IT UP!' }, 400);
    }
    
    // Validate: player must have tiles on the board
    if (playerBoardTiles.length === 0) {
      return c.json({ error: 'You must have tiles on the board!' }, 400);
    }
    
    // Check connectivity of THIS player's tiles FIRST (before expensive validation)
    const playerTilePositions = playerBoardTiles.map((t: any) => ({
      row: t.board_row,
      col: t.board_col
    }));
    
    if (!areAllTilesConnected(playerTilePositions)) {
      console.log(`Player ${playerId} tiles are not connected`);
      return c.json({ error: 'All your tiles must be connected!' }, 400);
    }
    
    // Validate: all board tiles must form valid words
    // This checks the entire board to ensure no invalid words exist anywhere
    console.log(`Validating board words for player ${playerId} MESS attempt...`);
    const validation = await validateBoard(tiles);
    console.log(`Validation result: valid=${validation.valid}, invalid words:`, validation.invalidWords);
    
    if (!validation.valid) {
      return c.json({ 
        error: `Invalid words on board: ${validation.invalidWords.join(', ')}` 
      }, 400);
    }
    
    // Award word points for any NEW words this player created
    const completedWords = await kv.get(`game:${gameId}:completed_words`) || [];
    const playerWords = await kv.get(`player:${playerId}:scored_words`) || [];
    const detectedWords = detectWords(tiles);
    
    let wordPoints = 0;
    const newWords = [];
    
    for (const wordObj of detectedWords) {
      const word = wordObj.word.toUpperCase();
      // Only score if this player hasn't scored this word before
      if (!playerWords.includes(word)) {
        wordPoints += 5;
        newWords.push(word);
        playerWords.push(word);
      }
    }
    
    // Save player's scored words
    await kv.set(`player:${playerId}:scored_words`, playerWords);
    
    // Award MESS bonus (+25) and word points
    if (!player.score) {
      player.score = 0;
    }
    player.score += 25 + wordPoints;
    
    if (!player.mess_bonus_count) {
      player.mess_bonus_count = 0;
    }
    player.mess_bonus_count += 1;
    
    await kv.set(`player:${playerId}`, player);
    
    // CRITICAL: Reset round winner lock IMMEDIATELY so next round can begin
    // This must happen BEFORE dealing tiles so the state is clean
    game.current_round_winner_id = null;
    game.updated_at = new Date().toISOString();
    await kv.set(`game:${gameId}`, game);
    
    // Deal 2 new tiles to ALL active players
    const playerIds = await kv.get(`game:${gameId}:players`) || [];
    let letterBag = [...game.letter_bag];
    
    // Calculate how many tiles each player should get
    // Priority: MESS winner gets most (max 2), then distribute remaining fairly
    const tilesToDistribute = letterBag.length;
    const activePlayerIds = [];
    
    for (const pId of playerIds) {
      const p = await kv.get(`player:${pId}`);
      if (p && p.is_active) {
        activePlayerIds.push(pId);
      }
    }
    
    const numPlayers = activePlayerIds.length;
    if (numPlayers === 0) {
      // No active players, skip distribution
      game.letter_bag = letterBag;
      await kv.set(`game:${gameId}`, game);
    } else {
      // Create distribution plan
      const distribution = new Map<string, number>();
      
      if (tilesToDistribute >= numPlayers * 2) {
        // Enough tiles for everyone to get 2
        for (const pId of activePlayerIds) {
          distribution.set(pId, 2);
        }
      } else {
        // Not enough tiles - prioritize MESS winner
        // MESS winner (playerId) gets up to 2 first
        const messWinnerAllocation = Math.min(2, tilesToDistribute);
        distribution.set(playerId, messWinnerAllocation);
        let remaining = tilesToDistribute - messWinnerAllocation;
        
        // Distribute remaining tiles to other players
        const otherPlayers = activePlayerIds.filter(id => id !== playerId);
        
        if (remaining > 0 && otherPlayers.length > 0) {
          // Give 1 tile to each other player until we run out
          for (let i = 0; i < otherPlayers.length && remaining > 0; i++) {
            const pId = otherPlayers[i];
            distribution.set(pId, (distribution.get(pId) || 0) + 1);
            remaining--;
          }
          
          // If still more tiles left, give second tile to other players
          for (let i = 0; i < otherPlayers.length && remaining > 0; i++) {
            const pId = otherPlayers[i];
            if ((distribution.get(pId) || 0) < 2) {
              distribution.set(pId, (distribution.get(pId) || 0) + 1);
              remaining--;
            }
          }
        }
      }
      
      // Now actually deal the tiles according to the distribution plan
      for (const pId of activePlayerIds) {
        const tilesToDeal = distribution.get(pId) || 0;
        if (tilesToDeal === 0) continue;
        
        const p = await kv.get(`player:${pId}`);
        if (!p) continue;
        
        // Find available rack slots
        const playerRackTiles = tiles.filter((t: any) => 
          t.owner_player_id === pId && t.location_type === 'rack'
        );
        
        const occupiedSlots = new Set(
          playerRackTiles
            .map((t: any) => t.board_col)
            .filter((idx: any) => typeof idx === 'number')
        );
        
        for (let i = 0; i < tilesToDeal; i++) {
          if (letterBag.length === 0) break;
          
          const letter = letterBag.pop();
          if (!letter) break; // Safety check
          
          const tileId = crypto.randomUUID();
          
          // Find first empty slot
          let slot = 0;
          while (occupiedSlots.has(slot) && slot < 7) {
              slot++;
          }
          if (slot >= 7) slot = 6;
          occupiedSlots.add(slot);

          const tile = {
            id: tileId,
            game_id: gameId,
            letter: letter,
            value: getLetterValue(letter),
            location_type: 'rack',
            owner_player_id: pId,
            board_row: null,
            board_col: slot,
            last_moved_by_player_id: pId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          tiles.push(tile);
          p.current_tiles.push(tileId);
        }
        
        await kv.set(`player:${pId}`, p);
      }
    }
    
    // Update game with new letter bag and tiles
    game.letter_bag = letterBag;
    game.updated_at = new Date().toISOString();
    
    // Check if bag is now empty - if so, this is the final round
    if (letterBag.length === 0) {
      game.is_final_round = true;
    }
    
    await kv.set(`game:${gameId}`, game);
    await kv.set(`game:${gameId}:tiles`, tiles);
    
    // Load chat messages (needed for both normal and final round)
    const chatMessages = await kv.get(`game:${gameId}:chat`) || [];
    
    // If this was the final round (bag empty after dealing), automatically finish the game
    if (letterBag.length === 0) {
      console.log(`Bag is now empty after MESS. Game ${gameId} finishing automatically...`);
      
      // Calculate final statistics
      const finalStats = await calculateFinalStatistics(gameId, playerIds, tiles, completedWords);
      
      // Sort by points to get winner
      const sortedStats = finalStats.sort((a, b) => b.totalPoints - a.totalPoints);
      const winner = sortedStats[0];
      
      game.status = 'finished';
      game.winner_player_id = winner.playerId;
      game.updated_at = new Date().toISOString();
      await kv.set(`game:${gameId}`, game);
      
      // Store final stats for the client to retrieve
      await kv.set(`game:${gameId}:final_stats`, finalStats);
      
      // Add game finished message
      const finishMessage = {
        id: crypto.randomUUID(),
        game_id: gameId,
        sender_type: 'system',
        sender_player_id: null,
        content: `Game Finished! ${winner.playerName} wins with ${winner.totalPoints} points!`,
        metadata: { type: 'game_finished', winnerId: winner.playerId },
        created_at: new Date().toISOString(),
      };
      chatMessages.push(finishMessage);
      
      // AI victory comment
      const victoryComment = await generateBananaBotComment('winner', {
        winnerName: winner.playerName,
        scores: finalStats.map((s: any) => ({ name: s.playerName, wordCount: s.wordCount })),
      });
      
      const victoryAiMessage = {
        id: crypto.randomUUID(),
        game_id: gameId,
        sender_type: 'ai',
        sender_player_id: null,
        content: victoryComment,
        metadata: { type: 'ai_comment' },
        created_at: new Date().toISOString(),
      };
      chatMessages.push(victoryAiMessage);
    }
    
    // Add chat messages
    const systemMessage = {
      id: crypto.randomUUID(),
      game_id: gameId,
      sender_type: 'system',
      sender_player_id: null,
      content: `${player.display_name} used MESS IT UP! (+${25 + wordPoints} points). Everyone gets 2 new tiles. ${letterBag.length} tiles remaining.`,
      metadata: { type: 'split', playerId, wordPoints, newWords },
      created_at: new Date().toISOString(),
    };
    chatMessages.push(systemMessage);
    
    // AI comment
    const aiComment = await generateBananaBotComment('split', {
      playerName: player.display_name,
    });
    
    const aiMessage = {
      id: crypto.randomUUID(),
      game_id: gameId,
      sender_type: 'ai',
      sender_player_id: null,
      content: aiComment,
      metadata: { type: 'ai_comment' },
      created_at: new Date().toISOString(),
    };
    chatMessages.push(aiMessage);
    
    await kv.set(`game:${gameId}:chat`, chatMessages);
    
    console.log(`Player ${playerId} triggered split in game ${gameId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error during split:', error);
    // Provide detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: `Failed to split: ${errorMessage}` }, 500);
  }
});

// POST /make-server-6ff8009f/games/:gameId/claim-round - Claim round winner status
app.post('/make-server-6ff8009f/games/:gameId/claim-round', async (c) => {
  try {
    const gameId = c.req.param('gameId');
    const { playerId } = await c.req.json();
    
    const game = await kv.get(`game:${gameId}`);
    if (!game || game.status !== 'in_progress') {
      return c.json({ error: 'Game is not in progress' }, 400);
    }
    
    // Only claim if no one else has claimed
    if (!game.current_round_winner_id) {
      game.current_round_winner_id = playerId;
      game.updated_at = new Date().toISOString();
      await kv.set(`game:${gameId}`, game);
      console.log(`Player ${playerId} claimed round winner in game ${gameId}`);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error claiming round:', error);
    return c.json({ error: 'Failed to claim round' }, 500);
  }
});

// POST /make-server-6ff8009f/games/:gameId/stuck - Player is stuck, draw 2 tiles and lose points
app.post('/make-server-6ff8009f/games/:gameId/stuck', async (c) => {
  try {
    const gameId = c.req.param('gameId');
    const { playerId } = await c.req.json();
    
    const game = await kv.get(`game:${gameId}`);
    if (!game || game.status !== 'in_progress') {
      return c.json({ error: 'Game is not in progress' }, 400);
    }
    
    const player = await kv.get(`player:${playerId}`);
    if (!player) {
      return c.json({ error: 'Player not found' }, 404);
    }
    
    // Check if there are tiles left in the bag
    if (game.letter_bag.length === 0) {
      return c.json({ error: 'No tiles left in the bag!' }, 400);
    }
    
    const tiles = await kv.get(`game:${gameId}:tiles`) || [];
    let letterBag = [...game.letter_bag];
    
    // Deal 2 new tiles (or fewer if bag is running low)
    const tilesToDeal = Math.min(2, letterBag.length);
    
    // Find available slots
    const playerRackTiles = tiles.filter((t: any) => 
        t.owner_player_id === playerId && t.location_type === 'rack'
    );
    const occupiedSlots = new Set(
        playerRackTiles
          .map((t: any) => t.board_col)
          .filter((idx: any) => typeof idx === 'number')
    );

    for (let i = 0; i < tilesToDeal; i++) {
      const letter = letterBag.pop();
      const tileId = crypto.randomUUID();
      
      // Find first empty slot
      let slot = 0;
      while (occupiedSlots.has(slot) && slot < 7) {
        slot++;
      }
      if (slot >= 7) slot = 6;
      occupiedSlots.add(slot);

      const tile = {
        id: tileId,
        game_id: gameId,
        letter: letter,
        value: getLetterValue(letter),
        location_type: 'rack',
        owner_player_id: playerId,
        board_row: null,
        board_col: slot,
        last_moved_by_player_id: playerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      tiles.push(tile);
      player.current_tiles.push(tileId);
    }
    
    // Deduct 5 points from player for being stuck
    if (!player.stuck_penalty_count) {
      player.stuck_penalty_count = 0;
    }
    player.stuck_penalty_count += 1;
    
    await kv.set(`player:${playerId}`, player);
    game.letter_bag = letterBag;
    game.updated_at = new Date().toISOString();
    await kv.set(`game:${gameId}`, game);
    await kv.set(`game:${gameId}:tiles`, tiles);
    
    // Add chat messages
    const chatMessages = await kv.get(`game:${gameId}:chat`) || [];
    
    const systemMessage = {
      id: crypto.randomUUID(),
      game_id: gameId,
      sender_type: 'system',
      sender_player_id: null,
      content: `${player.display_name} is stuck! Drew ${tilesToDeal} new tiles (-5 points).`,
      metadata: { type: 'stuck', playerId, tilesDrawn: tilesToDeal },
      created_at: new Date().toISOString(),
    };
    chatMessages.push(systemMessage);
    
    await kv.set(`game:${gameId}:chat`, chatMessages);
    
    console.log(`Player ${playerId} used stuck button in game ${gameId}`);
    
    return c.json({ success: true, tilesDrawn: tilesToDeal });
  } catch (error) {
    console.error('Error during stuck:', error);
    return c.json({ error: 'Failed to draw tiles' }, 500);
  }
});

// POST /make-server-6ff8009f/games/:gameId/finish - Finish the game
app.post('/make-server-6ff8009f/games/:gameId/finish', async (c) => {
  try {
    const gameId = c.req.param('gameId');
    const { playerId } = await c.req.json();
    
    const game = await kv.get(`game:${gameId}`);
    if (!game) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    // Check if game can be finished: bag empty and all racks empty
    const playerIds = await kv.get(`game:${gameId}:players`) || [];
    let allRacksEmpty = true;
    
    for (const pId of playerIds) {
      const p = await kv.get(`player:${pId}`);
      if (p && p.current_tiles.length > 0) {
        allRacksEmpty = false;
        break;
      }
    }
    
    if (game.letter_bag.length > 0 || !allRacksEmpty) {
      return c.json({ 
        error: 'Game can only finish when bag is empty and all racks are empty' 
      }, 400);
    }
    
    // Calculate scores
    const completedWords = await kv.get(`game:${gameId}:completed_words`) || [];
    const scores = [];
    
    for (const pId of playerIds) {
      const p = await kv.get(`player:${pId}`);
      if (!p) continue;
      
      const playerWords = completedWords.filter((w: any) => w.player_id === pId);
      const wordPoints = playerWords.reduce((sum: number, w: any) => sum + w.length, 0);
      const stuckPenalty = (p.stuck_penalty_count || 0) * 5;
      const messBonus = (p.mess_bonus_count || 0) * 25;
      const totalPoints = wordPoints - stuckPenalty + messBonus;
      
      scores.push({
        playerId: pId,
        playerName: p.display_name,
        wordCount: playerWords.length,
        totalLetters: wordPoints,
        totalPoints: totalPoints,
        stuckPenalty: stuckPenalty,
        messBonus: messBonus,
      });
    }
    
    // Sort by word count (desc), then total letters (desc)
    scores.sort((a, b) => {
      if (b.wordCount !== a.wordCount) return b.wordCount - a.wordCount;
      return b.totalLetters - a.totalLetters;
    });
    
    const winner = scores[0];
    
    game.status = 'finished';
    game.winner_player_id = winner.playerId;
    game.updated_at = new Date().toISOString();
    await kv.set(`game:${gameId}`, game);
    
    // Add chat messages
    const chatMessages = await kv.get(`game:${gameId}:chat`) || [];
    
    const systemMessage = {
      id: crypto.randomUUID(),
      game_id: gameId,
      sender_type: 'system',
      sender_player_id: null,
      content: `Game finished! ${winner.playerName} wins with ${winner.wordCount} words!`,
      metadata: { type: 'game_finished', winnerId: winner.playerId, scores },
      created_at: new Date().toISOString(),
    };
    chatMessages.push(systemMessage);
    
    // AI comment
    const aiComment = await generateBananaBotComment('winner', {
      winnerName: winner.playerName,
      scores: scores.map(s => ({ name: s.playerName, wordCount: s.wordCount })),
    });
    
    const aiMessage = {
      id: crypto.randomUUID(),
      game_id: gameId,
      sender_type: 'ai',
      sender_player_id: null,
      content: aiComment,
      metadata: { type: 'ai_comment' },
      created_at: new Date().toISOString(),
    };
    chatMessages.push(aiMessage);
    
    await kv.set(`game:${gameId}:chat`, chatMessages);
    
    console.log(`Game ${gameId} finished, winner: ${winner.playerId}`);
    
    return c.json({ success: true, winner, scores });
  } catch (error) {
    console.error('Error finishing game:', error);
    return c.json({ error: 'Failed to finish game' }, 500);
  }
});

// POST /make-server-6ff8009f/games/:gameId/chat - Send a chat message
app.post('/make-server-6ff8009f/games/:gameId/chat', async (c) => {
  try {
    const gameId = c.req.param('gameId');
    const { playerId, content } = await c.req.json();
    
    const player = await kv.get(`player:${playerId}`);
    if (!player) {
      return c.json({ error: 'Player not found' }, 404);
    }
    
    const chatMessages = await kv.get(`game:${gameId}:chat`) || [];
    
    const message = {
      id: crypto.randomUUID(),
      game_id: gameId,
      sender_type: 'player',
      sender_player_id: playerId,
      content: content.trim(),
      metadata: {},
      created_at: new Date().toISOString(),
    };
    
    chatMessages.push(message);
    await kv.set(`game:${gameId}:chat`, chatMessages);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// GET /make-server-6ff8009f/games/:joinCode/state - Get game state
app.get('/make-server-6ff8009f/games/:joinCode/state', async (c) => {
  try {
    const joinCode = c.req.param('joinCode').toUpperCase();
    const playerId = c.req.query('playerId');
    
    const gameId = await kv.get(`game:joincode:${joinCode}`);
    if (!gameId) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    const game = await kv.get(`game:${gameId}`);
    const playerIds = await kv.get(`game:${gameId}:players`) || [];
    const tiles = await kv.get(`game:${gameId}:tiles`) || [];
    const chatMessages = await kv.get(`game:${gameId}:chat`) || [];
    const completedWords = await kv.get(`game:${gameId}:completed_words`) || [];
    
    // Get all players
    const players = [];
    for (const pId of playerIds) {
      const p = await kv.get(`player:${pId}`);
      if (p) {
        // Don't expose other players' tile contents in racks
        if (pId !== playerId) {
          players.push({
            ...p,
            current_tiles: p.current_tiles.map(() => 'hidden'),
          });
        } else {
          players.push(p);
        }
      }
    }
    
    // Calculate scores
    const scores = [];
    for (const p of players) {
      const playerWords = completedWords.filter((w: any) => w.player_id === p.id);
      const wordPoints = playerWords.reduce((sum: number, w: any) => sum + w.length, 0);
      const stuckPenalty = (p.stuck_penalty_count || 0) * 5;
      const messBonus = (p.mess_bonus_count || 0) * 25;
      const totalPoints = wordPoints - stuckPenalty + messBonus;
      
      scores.push({
        playerId: p.id,
        wordCount: playerWords.length,
        totalLetters: wordPoints,
        totalPoints: totalPoints,
        stuckPenalty: stuckPenalty,
        messBonus: messBonus,
      });
    }
    
    return c.json({
      game: {
        ...game,
        letter_bag: [game.letter_bag.length], // Only expose count, not actual letters
      },
      players,
      tiles,
      chatMessages,
      scores,
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    return c.json({ error: 'Failed to get game state' }, 500);
  }
});

// GET /make-server-6ff8009f/games/:gameId/final-stats - Get final statistics
app.get('/make-server-6ff8009f/games/:gameId/final-stats', async (c) => {
  try {
    const gameId = c.req.param('gameId');
    
    const finalStats = await kv.get(`game:${gameId}:final_stats`);
    
    if (!finalStats) {
      return c.json({ error: 'Final statistics not found' }, 404);
    }
    
    return c.json({ stats: finalStats });
  } catch (error) {
    console.error('Error getting final stats:', error);
    return c.json({ error: 'Failed to get final statistics' }, 500);
  }
});

// Export the app fetch handler so the Supabase Edge Functions runtime can invoke it.
// Using Deno.serve starts a standalone server which doesn't integrate with the
// Edge Functions router and can lead to 404 responses. Exporting the fetch
// handler allows the platform to route requests to the Hono app.
export default app.fetch;

// Helper function to calculate final statistics
async function calculateFinalStatistics(gameId: string, playerIds: string[], tiles: Tile[], completedWords: DetectedWord[]): Promise<any[]> {
  const stats = [];
  const VOWELS = ['A', 'E', 'I', 'O', 'U'];
  
  for (const pId of playerIds) {
    const p = await kv.get(`player:${pId}`);
    if (!p) continue;
    
    const playerWords = completedWords.filter((w: any) => w.player_id === pId);
    
    // Get unique words only
    const uniqueWordTexts = new Set(playerWords.map((w: any) => w.word.toUpperCase()));
    const uniqueWordCount = uniqueWordTexts.size;
    
    const wordPoints = uniqueWordCount * 5; // +5 points per unique word
    const stuckCount = p.stuck_penalty_count || 0;
    const stuckPenalty = stuckCount * 5;
    const messCount = p.mess_bonus_count || 0;
    const messBonus = messCount * 25;
    const totalPoints = wordPoints - stuckPenalty + messBonus;
    
    // Find longest word
    let longestWord = '';
    for (const wordData of playerWords) {
      if (wordData.word && wordData.word.length > longestWord.length) {
        longestWord = wordData.word;
      }
    }
    
    // Count vowels and consonants that this player has held
    // We'll look at all tiles that this player has touched throughout the game
    // For simplicity, count all tiles currently owned or on the board by them
    const playerTiles = tiles.filter((t: any) => 
      t.owner_player_id === pId || t.last_moved_by_player_id === pId
    );
    
    let totalVowels = 0;
    let totalConsonants = 0;
    const seenTileIds = new Set();
    
    for (const tile of playerTiles) {
      // Avoid double counting
      if (seenTileIds.has(tile.id)) continue;
      seenTileIds.add(tile.id);
      
      const letter = tile.letter.toUpperCase();
      if (VOWELS.includes(letter)) {
        totalVowels++;
      } else if (letter >= 'A' && letter <= 'Z') {
        totalConsonants++;
      }
    }
    
    stats.push({
      playerId: pId,
      playerName: p.display_name,
      avatarSeed: p.avatar_seed,
      color: p.color,
      character: p.character,
      totalPoints: totalPoints,
      wordCount: uniqueWordCount,
      messCount: messCount,
      stuckCount: stuckCount,
      longestWord: longestWord,
      totalVowels: totalVowels,
      totalConsonants: totalConsonants,
    });
  }
  
  return stats;
}