# MESS - Multiplayer Word Game 🍌

A real-time multiplayer word game where players collaborate and compete on a shared board to create crossword-style word formations.

## 🚨 IMPORTANT: Deploy First!

**You're seeing "Failed to fetch" errors because the server hasn't been deployed yet!**

Your code is 100% ready. Just run these 4 commands:

```bash
# 1. Login to Supabase
supabase login

# 2. Link to your project  
supabase link --project-ref qlhdhtgpwwbjkksrnehk

# 3. Deploy the Edge Function (this fixes the error!)
supabase functions deploy server

# 4. Test it worked
curl https://qlhdhtgpwwbjkksrnehk.supabase.co/functions/v1/server
```

**Expected output:**
```json
{
  "status": "ok",
  "message": "Mess server is running at root",
  "timestamp": "..."
}
```

✅ **After deployment:** Refresh your app and the errors will disappear!

📖 **Need more help?** See [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md) for detailed instructions.

---

## 🚀 Quick Start & Deployment

### First Time Setup

**Important**: The game requires a Supabase Edge Function server. You must deploy it first!

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to Your Project**
   ```bash
   supabase link --project-ref qlhdhtgpwwbjkksrnehk
   ```

4. **Deploy the Edge Function**
   ```bash
   supabase functions deploy server
   ```

5. **Test the Deployment**
   Open in browser: `https://qlhdhtgpwwbjkksrnehk.supabase.co/functions/v1/server/health`
   
   You should see:
   ```json
   {
     "status": "ok",
     "message": "Health check passed",
     "timestamp": "..."
   }
   ```

6. **Start Playing!**
   - Open the Mess app in your browser
   - Click "New Game"
   - Invite friends with the join code!

### Troubleshooting Deployment Issues

If you see "Failed to fetch" errors:

1. **Check if the function is deployed**
   ```bash
   supabase functions list
   ```

2. **View function logs**
   ```bash
   supabase functions logs server
   ```

3. **Re-deploy the function**
   ```bash
   supabase functions deploy server --no-verify-jwt
   ```

4. **Test the health endpoint**
   Visit: `https://qlhdhtgpwwbjkksrnehk.supabase.co/functions/v1/server`

For detailed troubleshooting, see [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)

## How to Play

### Game Setup
1. **Create a Game**: One player creates a new game and receives a unique join code
2. **Invite Friends**: Share the join code with up to 7 other players (8 players max)
3. **Start Playing**: Creator starts the game when ready

### Gameplay
- Each player starts with 4 random letter tiles in their rack
- **Shared Board**: All players work on ONE big 25x25 grid board
- **Place Tiles**: Drag tiles from your rack onto the board to form words
- **Any Player Can Move Any Tile**: True collaborative chaos!
- **Form Valid Words**: Create horizontal or vertical words (2+ letters)
- **Complete Words to Score**: When you complete a new valid word, you get credit for it

### MESS IT UP! 🎉
When you've used all tiles in your rack (all on the board) and formed at least one valid word:
- Press the **"MESS IT UP!"** button
- Server validates all words on the board
- If valid, **everyone** gets 2 new random tiles
- BananaBot celebrates your achievement!

### Winning
**Game ends when:**
- The letter bag is empty AND
- All players have empty racks (all tiles on board)

**Winner determined by:**
1. Most completed words (sets)
2. If tied: highest total letter count
3. If still tied: whoever finished their last word first

### Scoring
- Each valid word you complete = 1 "set"
- Total letters in your words used for tiebreakers
- Real-time scoreboard shows current standings

## Features

### Multiplayer Experience
- **Real-time synchronization**: See other players' moves instantly
- **Figma-style cursors**: Track where other players are working
- **Live chat**: Communicate with teammates/opponents
- **AI BananaBot**: Fun commentary on impressive words, splits, and victories

### Visual Design
- **Colorful gradient backgrounds** with smooth animations
- **Clean white cards** with modern shadows
- **Animated gradient blobs** moving behind the game board
- **Scrabble-style tiles** with letter values
- **Player avatars** with unique colors and patterns

### Technical Stack
- **Frontend**: React + TypeScript, Tailwind CSS
- **Backend**: Supabase Edge Functions (Hono server)
- **Database**: Supabase KV Store
- **Real-time**: Polling (2-second intervals)
- **Dictionary**: Built-in English word validation

## Game Rules

### Valid Words
- Must be 2+ letters
- Must be in the dictionary
- Can be horizontal or vertical
- All words on board must remain valid

### Letter Distribution
Uses standard Scrabble-style letter distribution:
- Common letters (E, A, I, etc.) appear more frequently
- Rare letters (Q, Z, etc.) are less common but worth more points
- Total of 98 tiles in the bag

### Strategy Tips
- **Collaborate early**: Help each other form words to get more tiles
- **Plan ahead**: Position tiles strategically for future words
- **Use MESS IT UP wisely**: Only when you've completed good words
- **Watch the board**: Someone might complete your word for you!

## Current Limitations

This is a prototype/demo version:
- Uses polling instead of true WebSockets
- Simplified dictionary (subset of common English words)
- AI comments are pre-generated (not using OpenAI API)
- No persistent user accounts

## Future Enhancements

- Real WebSocket connections for instant updates
- Comprehensive dictionary
- OpenAI-powered BananaBot with dynamic commentary
- Player statistics and game history
- Multiple language support
- Custom game modes (timed, team-based, etc.)
- Sound effects and animations
- Mobile-responsive design improvements

---

**Have fun creating chaos on the board! 🎮✨**