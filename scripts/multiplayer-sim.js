// Simple headless multiplayer simulation using polling (no realtime client).
// Usage:
//   SERVER_URL="https://<project>.supabase.co/functions/v1/<slug>" PUBLIC_ANON_KEY="<anon>" node scripts/multiplayer-sim.js

const SERVER_URL = process.env.SERVER_URL;
const PUBLIC_ANON_KEY = process.env.PUBLIC_ANON_KEY;

if (!SERVER_URL || !PUBLIC_ANON_KEY) {
  console.error('ERROR: Please set SERVER_URL and PUBLIC_ANON_KEY environment variables.');
  process.exit(2);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${PUBLIC_ANON_KEY}`
};

const wait = ms => new Promise(res => setTimeout(res, ms));

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, body: JSON.parse(text) }; } catch(e) { return { ok: res.ok, status: res.status, body: text }; }
}

(async () => {
  console.log('Using', SERVER_URL);

  // 1) Create a new game (player 1)
  console.log('Creating game (player 1)...');
  const create = await fetchJson(`${SERVER_URL}/games`, { method: 'POST', headers, body: JSON.stringify({ displayName: 'Sim-1' }) });
  if (!create.ok) { console.error('Create failed', create.status, create.body); process.exit(1); }
  const { gameId, playerId: p1, joinCode } = create.body;
  console.log('Created:', { gameId, p1, joinCode });

  // 2) Player 2 joins the game
  console.log('Joining as player 2...');
  const join = await fetchJson(`${SERVER_URL}/games/${joinCode}/join`, { method: 'POST', headers, body: JSON.stringify({ displayName: 'Sim-2' }) });
  if (!join.ok) { console.error('Join failed', join.status, join.body); process.exit(1); }
  const { playerId: p2 } = join.body;
  console.log('Player 2 joined:', p2);

  // 3) Poll initial state from both clients
  const stateUrl = (playerId) => `${SERVER_URL}/games/${joinCode}/state?playerId=${playerId}`;
  console.log('Polling initial state from both clients...');
  const s1 = await fetchJson(stateUrl(p1), { headers });
  const s2 = await fetchJson(stateUrl(p2), { headers });
  console.log('Client1 tiles:', Array.isArray(s1.body?.tiles) ? s1.body.tiles.length : 'N/A');
  console.log('Client2 tiles:', Array.isArray(s2.body?.tiles) ? s2.body.tiles.length : 'N/A');

  // 4) If there is at least one movable tile, move it as player1
  const tiles = s1.body?.tiles || [];
  if (tiles.length === 0) {
    console.warn('No tiles available to move; finishing.');
    process.exit(0);
  }

  const tile = tiles.find(t => t.location_type === 'rack' && t.owner_player_id === p1) || tiles[0];
  console.log('Selected tile for move:', tile.id || tile);

  // Move tile to board position (row 0, col 0)
  console.log('Player1 moving tile -> board 0,0');
  const move = await fetchJson(`${SERVER_URL}/games/${gameId}/move`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ playerId: p1, tileId: tile.id, to: { locationType: 'board', row: 0, col: 0 } })
  });
  console.log('Move response:', move.status, move.body);

  // 5) Wait a moment and poll from client2
  await wait(1200);
  const s2After = await fetchJson(stateUrl(p2), { headers });

  // Check whether client2 sees tile at 0,0
  const seen = (s2After.body?.tiles || []).some(t => t.board_row === 0 && t.board_col === 0 && (t.id === tile.id));
  console.log('Client2 sees moved tile at 0,0?', seen);
  console.log('Done');
  process.exit(0);
})();
