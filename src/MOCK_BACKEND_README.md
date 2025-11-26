# 🎭 Mock Backend - Local Testing Mode

## What Is This?

The mock backend allows you to test the Mess game UI locally **without deploying the Supabase Edge Function**. It simulates multiplayer functionality using browser localStorage.

## Current Status

✅ **Mock Backend is ENABLED** - You can test the game immediately!

## How to Use

### Testing Locally (Current Mode)

1. **Create a game** - Click "New Game" on the home screen
2. **Get a join code** - You'll see a 6-letter code (e.g., "ABC123")
3. **Test multiplayer** - Open a new browser tab and join with that code
4. **Note**: Data is stored in localStorage and resets when you clear browser data

### Switching to Real Server

When you're ready to deploy the real multiplayer server:

1. **Open** `/services/mockBackend.ts`
2. **Change line 7** from:
   ```typescript
   export const USE_MOCK_BACKEND = true;
   ```
   to:
   ```typescript
   export const USE_MOCK_BACKEND = false;
   ```

3. **Deploy the Edge Function**:
   ```bash
   supabase login
   supabase link --project-ref qlhdhtgpwwbjkksrnehk
   supabase functions deploy server
   ```

4. **Refresh the app** - Real multiplayer will now work!

## Mock vs Real Backend

| Feature | Mock Backend | Real Server |
|---------|-------------|-------------|
| Multiplayer | ❌ Simulated (same browser) | ✅ Real (different devices) |
| Data Persistence | ❌ localStorage only | ✅ Database |
| Deployment Required | ❌ No | ✅ Yes (~2 minutes) |
| Real-time Updates | ❌ Local polling | ✅ Supabase Realtime |
| Word Validation | ❌ Basic (length only) | ✅ Dictionary API |
| Testing UI | ✅ Perfect | ✅ Perfect |

## Features in Mock Mode

✅ **What Works:**
- Create game with custom settings
- Join game with code
- Character customization
- Color selection
- Game settings (piece count, timer)
- UI and visual design
- Local state management

❌ **What Doesn't Work:**
- Real multiplayer (different devices/browsers)
- Persistent data across sessions
- Real word validation
- Leaderboard
- Real-time synchronization

## Troubleshooting

### "Game not found" when joining
- Make sure you created the game in the same browser
- Check if you cleared browser data (localStorage)
- The mock backend only stores games in the current browser session

### Can't see multiplayer updates
- Open game in two tabs of the SAME browser
- Mock mode uses polling (2 second delay)
- For real multiplayer, deploy the Edge Function

### Want to reset all games?
```javascript
// Run in browser console:
localStorage.removeItem('mess_mock_data');
```

## Next Steps

Once you've tested the UI and are happy with it:

1. Set `USE_MOCK_BACKEND = false` in `/services/mockBackend.ts`
2. Deploy the Edge Function (see instructions above)
3. Enjoy real multiplayer! 🎉

## Need Help?

- **Deployment issues?** See `DEPLOYMENT_READY.md`
- **Code questions?** Check the mock backend code in `/services/mockBackend.ts`
- **Feature requests?** The mock backend is simple and can be extended!
