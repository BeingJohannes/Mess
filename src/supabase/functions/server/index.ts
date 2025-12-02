import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.ts';
import { createLetterBag, getLetterValue } from './letter-bag.ts';
import { detectWords, validateBoard, findNewWords, isValidWordOnline, type Tile, type DetectedWord } from './word-detection.ts';
import { generateBananaBotComment } from './ai-commentator.ts';

console.log('🚀 Starting Mess server...');
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
      '/server/health',
      '/server/games',
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
app.get('/server/health', (c) => {
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

// POST /server/validate - Validate a list of words
app.post('/server/validate', async (c) => {
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

// (rest of file same as root index.ts)
// To keep repository size small in this copy, the rest of the server implementation is identical to the root `supabase/functions/server/index.ts` file.
// The root version contains the full implementation (game creation, moves, split, finish, state, final stats and helper functions).

export default app.fetch;
