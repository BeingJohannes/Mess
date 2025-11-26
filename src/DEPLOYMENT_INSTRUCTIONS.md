# Mess Server Deployment Instructions

## Current Issue
Your Supabase Edge Function server is not responding with "Failed to fetch" errors. This is likely because the Edge Function hasn't been deployed yet or needs to be redeployed.

## Quick Fix - Deploy the Edge Function

### Step 1: Install Supabase CLI (if not installed)
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
supabase link --project-ref qlhdhtgpwwbjkksrnehk
```

### Step 4: Deploy the Edge Function
```bash
supabase functions deploy server
```

This command will:
- Bundle your Edge Function code
- Deploy it to Supabase
- Make it available at: `https://qlhdhtgpwwbjkksrnehk.supabase.co/functions/v1/server`

## Testing the Deployment

### Test 1: Root Endpoint (Simplest Test)
Open your browser or use curl:
```bash
curl https://qlhdhtgpwwbjkksrnehk.supabase.co/functions/v1/server
```

Expected response:
```json
{
  "status": "ok",
  "message": "Mess server is running at root",
  "timestamp": "2024-...",
  "routes": [...]
}
```

### Test 2: Health Check (Without Prefix)
```bash
curl https://qlhdhtgpwwbjkksrnehk.supabase.co/functions/v1/server/health
```

### Test 3: Health Check (With Prefix - What Frontend Uses)
```bash
curl https://qlhdhtgpwwbjkksrnehk.supabase.co/functions/v1/server/make-server-6ff8009f/health
```

## Troubleshooting

### Issue: "Failed to fetch" or Network Error

**Possible Causes:**
1. **Edge Function Not Deployed** - Most common issue
   - Solution: Run `supabase functions deploy server`

2. **Cold Start Delay** - Edge Functions can take 5-10 seconds to wake up after being idle
   - Solution: Wait a moment and try again. The frontend now has retry logic with longer timeouts

3. **Wrong Project Reference** 
   - Solution: Verify you're deploying to the correct project: `qlhdhtgpwwbjkksrnehk`

4. **Environment Variables Missing**
   - The Edge Function needs these env vars (already set in your project):
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_ANON_KEY`

### Issue: 500 Internal Server Error

Check the Edge Function logs:
```bash
supabase functions logs server
```

Or view them in the Supabase Dashboard:
https://supabase.com/dashboard/project/qlhdhtgpwwbjkksrnehk/functions/server/logs

### Issue: CORS Errors

The server now has comprehensive CORS configuration:
- Origin: `*` (allows all origins)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization
- Max Age: 24 hours

If you still see CORS errors, check browser console for exact error message.

## Server Endpoints Reference

All endpoints are prefixed with `/make-server-6ff8009f` except health checks:

### Health Checks
- `GET /` - Root endpoint
- `GET /health` - Health check without prefix
- `GET /make-server-6ff8009f/health` - Health check with prefix

### Game Management
- `POST /make-server-6ff8009f/games` - Create new game
- `POST /make-server-6ff8009f/games/:joinCode/join` - Join game
- `POST /make-server-6ff8009f/games/:gameId/start` - Start game
- `GET /make-server-6ff8009f/games/:joinCode/state` - Get game state

### Game Actions
- `POST /make-server-6ff8009f/games/:gameId/move` - Move a tile
- `POST /make-server-6ff8009f/games/:gameId/split` - MESS IT UP!
- `POST /make-server-6ff8009f/games/:gameId/stuck` - I'm Stuck (draw 2 tiles)
- `POST /make-server-6ff8009f/games/:gameId/claim-round` - Claim round winner
- `POST /make-server-6ff8009f/games/:gameId/finish` - Finish game

### Utilities
- `POST /make-server-6ff8009f/validate` - Validate words
- `POST /make-server-6ff8009f/games/:gameId/chat` - Send chat message
- `GET /make-server-6ff8009f/games/:gameId/final-stats` - Get final statistics

## Development Workflow

### Local Development
```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve server --no-verify-jwt
```

### Deploy to Production
```bash
# Deploy the function
supabase functions deploy server

# View logs after deployment
supabase functions logs server --tail
```

### Environment Variables
View/set environment variables:
```bash
# List secrets
supabase secrets list

# Set a secret (if needed)
supabase secrets set MY_SECRET=value
```

## What Changed in This Fix

### 1. Enhanced Health Checks
- Added root endpoint at `/` for easy testing
- Added health check without prefix at `/health`
- Kept health check with prefix at `/make-server-6ff8009f/health`
- All health checks now return useful debugging info

### 2. Improved CORS
- More comprehensive CORS configuration
- Added `exposeHeaders` and `maxAge`
- Disabled credentials (not needed for this app)

### 3. Better Logging
- Added console logs for startup
- Environment variable checks on startup
- Request logging via Hono middleware
- Route hit confirmation logs

### 4. Cold Start Optimization
- Console logs help diagnose cold start issues
- Health check endpoints for warming up the function

## Frontend Changes

The frontend (`Home.tsx`) now:
1. Tries a health check first to wake up the server
2. Uses longer timeouts (10-15 seconds) to handle cold starts
3. Provides better error messages with deployment instructions
4. Includes retry logic for network failures

## Next Steps

After deploying the Edge Function:

1. **Test in Browser**
   - Open your Mess app
   - Click "New Game"
   - Enter your name and settings
   - Click "Start the game"
   - The game should now create successfully!

2. **Monitor the Logs**
   ```bash
   supabase functions logs server --tail
   ```
   Watch for any errors or issues

3. **Test Multiplayer**
   - Create a game
   - Copy the join code
   - Open in another browser/tab
   - Join with the code

## Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
- [Hono Framework Docs](https://hono.dev/)

## Support

If you're still experiencing issues after deploying:

1. Check the Edge Function logs: `supabase functions logs server`
2. Verify the function is deployed: Visit the Supabase Dashboard → Functions
3. Test the health endpoints directly in your browser
4. Check browser console for detailed error messages
