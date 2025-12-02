# Smoke Tests - Edge Function Deployment Verification

## Overview
Once the Supabase Edge Function deployment succeeds, run these tests to verify the multiplayer backend is working correctly.

## Prerequisites
- ✅ Edge Function deployed successfully (awaiting CI completion)
- ✅ `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN` configured in GitHub Secrets
- ✅ `VITE_PROJECT_ID` and `VITE_PUBLIC_ANON_KEY` available
- ✅ `serverUrl` = `https://<project-ref>.supabase.co/functions/v1/server`

## Test 1: Health Check (Manual)

### Objective
Verify the Edge Function is running and accessible.

### Steps
```bash
# Replace with your actual project ref
PROJECT_REF="your-project-ref"
PUBLIC_ANON_KEY="your-anon-key"

# Test root health endpoint
curl -X GET "https://${PROJECT_REF}.supabase.co/functions/v1/server/health" \
  -H "Authorization: Bearer ${PUBLIC_ANON_KEY}" \
  -H "Content-Type: application/json"

# Expected response (200 OK):
# {
#   "status": "ok",
#   "message": "Health check passed (no prefix)",
#   "timestamp": "2025-11-27T..."
# }
```

### Expected Outcome
- ✅ HTTP 200 OK
- ✅ Response includes `status: "ok"` and timestamp
- ✅ No errors in response

---

## Test 2: Multiplayer Simulation (Automated)

### Objective
Test full multiplayer game flow: game creation, player join, state polling, and game moves.

### Prerequisites
```bash
export serverUrl="https://<project-ref>.supabase.co/functions/v1/server"
export PUBLIC_ANON_KEY="<your-anon-key>"
```

### Steps
```bash
cd /Users/johannes/Documents/Mess-main
node scripts/multiplayer-sim.js
```

### What It Tests
1. **Game Creation** - Player 1 creates a new game
2. **Player Join** - Player 2 joins the game using join code
3. **State Polling** - Both players retrieve game state (tiles, board, etc.)
4. **Game Moves** - Players make moves and state updates
5. **Chat** - Players send chat messages
6. **Game Finish** - Game completes and final scores calculated

### Expected Behavior
```
Using https://<project-ref>.supabase.co/functions/v1/server
Creating game (player 1)...
Created: { gameId: 'xxx', p1: 'xxx', joinCode: 'XXXXXX' }
Joining as player 2...
Player 2 joined: xxx
Polling initial state from both clients...
Client1 tiles: 7
Client2 tiles: 7
...
[Game proceeds through multiple rounds of moves]
...
Game finished!
✓ All tests passed!
```

### Success Criteria
- ✅ Game creation succeeds with valid gameId and joinCode
- ✅ Player 2 successfully joins with joinCode
- ✅ Both clients receive initial state with 7 tiles each
- ✅ Players can make moves and update board
- ✅ Chat messages are received
- ✅ Game completes with final scores
- ✅ No HTTP errors (all requests return 200-299)
- ✅ No timeout errors during polling

### Expected Exit
```
Process exits with code 0 (success)
```

---

## Test 3: Verify Deployment to GitHub Pages (Frontend Build)

### Objective
Ensure frontend built successfully and was published to GitHub Pages.

### Steps
1. Navigate to: `https://beingjohhannes.github.io/Mess/`
2. Wait for page to load
3. Check browser console (F12) for errors

### Expected Behavior
- ✅ Page loads with Mess game UI
- ✅ No 404 errors
- ✅ No console errors about missing environment variables
- ✅ Can see game board, tiles, and chat panel
- ✅ Settings modal appears on page load

### If Failed
- Check GitHub Actions workflow logs for build errors
- Verify `VITE_PROJECT_ID` and `VITE_PUBLIC_ANON_KEY` secrets are set
- Check `vite.config.ts` and `.env.example` for environment variable configuration

---

## Test 4: Live Multiplayer Test (Manual - Two Browsers)

### Objective
Test actual multiplayer gameplay with real UI interaction.

### Prerequisites
- ✅ Frontend deployed to GitHub Pages
- ✅ Edge Function deployed and working

### Steps
1. Open Browser 1: `https://beingjohhannes.github.io/Mess/`
2. Open Browser 2: `https://beingjohhannes.github.io/Mess/`
3. In Browser 1:
   - Enter player name
   - Click "Create Game"
   - Note the join code displayed
4. In Browser 2:
   - Enter player name
   - Click "Join Game"
   - Paste join code from Browser 1
5. In both browsers:
   - Verify both players appear in players panel
   - Place some tiles on the board
   - Make a move
   - Send a chat message
   - Verify state syncs between browsers (if using realtime)

### Expected Behavior
- ✅ Game creation succeeds
- ✅ Both players join successfully
- ✅ Player lists show both players in both browsers
- ✅ Moves appear in other player's view (eventually)
- ✅ Chat messages appear in both browsers
- ✅ No console errors
- ✅ Game state is consistent

### Common Issues
- **Tiles don't sync:** Check if realtime subscriptions are working or polling is frequent enough
- **Chat doesn't appear:** Verify chat endpoint in `index.ts` and frontend chat panel
- **Moves fail:** Check browser console for specific error messages

---

## Test 5: Error Handling

### Objective
Verify the Edge Function handles errors gracefully.

### Test Cases

#### 5a. Invalid Join Code
```bash
curl -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/server/games/INVALID/join" \
  -H "Authorization: Bearer ${PUBLIC_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Player"}'
```
**Expected:** 404 or 400 error with clear message

#### 5b. Missing Authorization
```bash
curl -X GET "https://${PROJECT_REF}.supabase.co/functions/v1/server/health"
```
**Expected:** 401 Unauthorized or allowed (depends on implementation)

#### 5c. Invalid Move Data
```bash
curl -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/server/games/${joinCode}/move" \
  -H "Authorization: Bearer ${PUBLIC_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```
**Expected:** 400 Bad Request with validation error

---

## Smoke Test Checklist

Use this checklist to track all tests:

- [ ] **Test 1:** Health check endpoint responds with 200 OK
- [ ] **Test 2:** Multiplayer simulation script runs to completion
- [ ] **Test 3:** Frontend deployed to GitHub Pages and loads without errors
- [ ] **Test 4:** Live multiplayer game works between two browsers
- [ ] **Test 5a:** Invalid join code returns appropriate error
- [ ] **Test 5b:** Missing auth is handled correctly
- [ ] **Test 5c:** Invalid move data returns validation error
- [ ] **General:** No console errors in browser
- [ ] **General:** No unhandled errors in CI logs
- [ ] **Performance:** All requests complete within 2 seconds

---

## Debugging Commands

If tests fail, use these commands to debug:

### View Edge Function Logs
```bash
npx supabase@latest functions list --project-ref=${PROJECT_REF}
# Logs may be available in Supabase dashboard
```

### Test Specific Endpoint
```bash
curl -v -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/server/games" \
  -H "Authorization: Bearer ${PUBLIC_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Debug Player"}'
```

### Check Network Tab
Browser DevTools → Network tab → Filter by "server" → Check request/response for errors

### Verify Environment Variables
```bash
# In CI logs, check that these are set:
echo "serverUrl: $VITE_FUNCTION_SLUG"
echo "PROJECT_ID: $VITE_PROJECT_ID"
# (PUBLIC_ANON_KEY is injected at build time)
```

---

## Success Criteria Summary

✅ All tests pass when Edge Function is deployed  
✅ No critical errors in browser console  
✅ Health check endpoint responds  
✅ Multiplayer simulation completes successfully  
✅ Frontend builds and deploys to GitHub Pages  
✅ Live multiplayer game works in real browsers  
✅ Error handling works as expected  

**Once all smoke tests pass, multiplayer is ready for live testing! 🎉**
