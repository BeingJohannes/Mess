import { test, expect } from '@playwright/test';

// This test uses the deployed server URL from environment variables.
// It will:
// 1. Create a game via the Edge Function API
// 2. Join a second player via the API
// 3. Launch two browser pages with localStorage primed to enter the game
// 4. Trigger a server-side move for player1
// 5. Wait for page2's polling request to /games/:joinCode/state and assert the
//    moved tile is visible in the JSON response.

const SERVER_URL = process.env.SERVER_URL || '';
const PUBLIC_ANON_KEY = process.env.PUBLIC_ANON_KEY || '';

if (!SERVER_URL || !PUBLIC_ANON_KEY) {
  console.warn('Please set SERVER_URL and PUBLIC_ANON_KEY for the E2E test.');
}

async function fetchJson(url: string, opts: any = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, body: JSON.parse(text) }; } catch(e) { return { ok: res.ok, status: res.status, body: text }; }
}

test('multiplayer propagation via polling (two real browsers)', async ({ browser }) => {
  test.skip(!SERVER_URL || !PUBLIC_ANON_KEY, 'SERVER_URL and PUBLIC_ANON_KEY not provided');

  // 1) Create game as player1
  const create = await fetchJson(`${SERVER_URL}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PUBLIC_ANON_KEY}`,
    },
    body: JSON.stringify({ displayName: 'E2E-Player1' })
  });
  expect(create.ok).toBeTruthy();
  const { gameId, playerId: p1, joinCode } = create.body as any;
  expect(gameId).toBeTruthy();

  // 2) Player2 joins
  const join = await fetchJson(`${SERVER_URL}/games/${joinCode}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PUBLIC_ANON_KEY}`,
    },
    body: JSON.stringify({ displayName: 'E2E-Player2' })
  });
  expect(join.ok).toBeTruthy();
  const { playerId: p2 } = join.body as any;
  expect(p2).toBeTruthy();

  // 3) Launch two pages and prime localStorage
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  await page1.goto('about:blank');
  await page1.evaluate(([jc, pid]) => {
    localStorage.setItem('mess_join_code', jc);
    localStorage.setItem('mess_player_id', pid);
  }, [joinCode, p1]);

  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto('about:blank');
  await page2.evaluate(([jc, pid]) => {
    localStorage.setItem('mess_join_code', jc);
    localStorage.setItem('mess_player_id', pid);
  }, [joinCode, p2]);

  // Navigate both to app root (playwright.config sets baseURL to http://localhost:3000)
  await Promise.all([
    page1.goto('/'),
    page2.goto('/'),
  ]);

  // Wait for page2 to issue a polling request - we'll wait for a response that
  // matches /games/:joinCode/state and capture it after the move.
  const stateUrlRegex = new RegExp(`/games/${joinCode}/state`);

  // Setup a waitForResponse promise on page2
  const waitForStateAfterMove = page2.waitForResponse(resp => {
    try { return resp.url().includes(`/games/${joinCode}/state`) && resp.status() === 200; } catch { return false; }
  }, { timeout: 10_000 });

  // 4) Perform a server-side move as player1 (move first available tile)
  // Fetch current state to pick a tile
  const s1 = await fetchJson(`${SERVER_URL}/games/${joinCode}/state?playerId=${p1}`, {
    headers: { 'Authorization': `Bearer ${PUBLIC_ANON_KEY}` }
  });
  expect(s1.ok).toBeTruthy();
  const tiles = s1.body?.tiles || [];
  expect(tiles.length).toBeGreaterThan(0);
  const tile = tiles.find((t: any) => t.location_type === 'rack' && t.owner_player_id === p1) || tiles[0];

  // Issue move to board 0,0
  const move = await fetchJson(`${SERVER_URL}/games/${gameId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PUBLIC_ANON_KEY}` },
    body: JSON.stringify({ playerId: p1, tileId: tile.id, to: { locationType: 'board', row: 0, col: 0 } })
  });
  expect(move.ok).toBeTruthy();

  // 5) Wait for page2 to poll and get updated state
  const resp = await waitForStateAfterMove;
  const json = await resp.json();
  const seen = (json?.tiles || []).some((t: any) => t.board_row === 0 && t.board_col === 0 && t.id === tile.id);
  expect(seen).toBeTruthy();

  await context1.close();
  await context2.close();
});
