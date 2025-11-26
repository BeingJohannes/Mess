// Word detection and validation logic for the game board

// Use online dictionary API for validation with timeout
export async function isValidWordOnline(word: string): Promise<boolean> {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    return response.ok; // 200 = valid word, 404 = not found
  } catch (error) {
    // Don't log AbortErrors - they're expected when timeout occurs
    if (error instanceof Error && error.name === 'AbortError') {
      // Timeout occurred - treat as invalid word
      return false;
    }
    console.error(`Error checking word "${word}":`, error);
    return false;
  }
}

export interface Tile {
  id: string;
  letter: string;
  board_row: number | null;
  board_col: number | null;
  location_type: string;
}

export interface DetectedWord {
  word: string;
  tiles: string[];
  direction: 'horizontal' | 'vertical';
  start_row: number;
  start_col: number;
  length: number;
}

const BOARD_SIZE = 25; // 25x25 grid

export function detectWords(tiles: Tile[]): DetectedWord[] {
  // Build 2D map from (row, col) to tile
  const boardMap = new Map<string, Tile>();
  
  for (const tile of tiles) {
    if (tile.location_type === 'board' && tile.board_row !== null && tile.board_col !== null) {
      const key = `${tile.board_row},${tile.board_col}`;
      boardMap.set(key, tile);
    }
  }
  
  const words: DetectedWord[] = [];
  
  // Extract horizontal words
  for (let row = 0; row < BOARD_SIZE; row++) {
    let col = 0;
    while (col < BOARD_SIZE) {
      // Find start of a word (no tile to the left or at left edge)
      const leftKey = `${row},${col - 1}`;
      const currentKey = `${row},${col}`;
      
      if (!boardMap.has(currentKey)) {
        col++;
        continue;
      }
      
      if (col > 0 && boardMap.has(leftKey)) {
        col++;
        continue;
      }
      
      // Start scanning to the right
      const wordTiles: Tile[] = [];
      let scanCol = col;
      
      while (scanCol < BOARD_SIZE) {
        const scanKey = `${row},${scanCol}`;
        const tile = boardMap.get(scanKey);
        
        if (!tile) break;
        
        wordTiles.push(tile);
        scanCol++;
      }
      
      // If word is 2+ letters, add it
      if (wordTiles.length >= 2) {
        const word = wordTiles.map(t => t.letter).join('');
        words.push({
          word,
          tiles: wordTiles.map(t => t.id),
          direction: 'horizontal',
          start_row: row,
          start_col: col,
          length: wordTiles.length,
        });
      }
      
      col = scanCol;
    }
  }
  
  // Extract vertical words
  for (let col = 0; col < BOARD_SIZE; col++) {
    let row = 0;
    while (row < BOARD_SIZE) {
      // Find start of a word (no tile above or at top edge)
      const aboveKey = `${row - 1},${col}`;
      const currentKey = `${row},${col}`;
      
      if (!boardMap.has(currentKey)) {
        row++;
        continue;
      }
      
      if (row > 0 && boardMap.has(aboveKey)) {
        row++;
        continue;
      }
      
      // Start scanning downwards
      const wordTiles: Tile[] = [];
      let scanRow = row;
      
      while (scanRow < BOARD_SIZE) {
        const scanKey = `${scanRow},${col}`;
        const tile = boardMap.get(scanKey);
        
        if (!tile) break;
        
        wordTiles.push(tile);
        scanRow++;
      }
      
      // If word is 2+ letters, add it
      if (wordTiles.length >= 2) {
        const word = wordTiles.map(t => t.letter).join('');
        words.push({
          word,
          tiles: wordTiles.map(t => t.id),
          direction: 'vertical',
          start_row: row,
          start_col: col,
          length: wordTiles.length,
        });
      }
      
      row = scanRow;
    }
  }
  
  return words;
}

export async function validateBoard(tiles: Tile[]): Promise<{ valid: boolean; invalidWords: string[] }> {
  const words = detectWords(tiles);
  const invalidWords: string[] = [];
  
  // Validate words in parallel with error handling
  await Promise.all(words.map(async (wordInfo) => {
    try {
      const isValid = await isValidWordOnline(wordInfo.word);
      if (!isValid) {
        invalidWords.push(wordInfo.word);
      }
    } catch (error) {
      console.error(`Error validating word "${wordInfo.word}":`, error);
      // On validation error, mark as invalid to be safe
      invalidWords.push(wordInfo.word);
    }
  }));
  
  return {
    valid: invalidWords.length === 0,
    invalidWords,
  };
}

export function findNewWords(
  currentWords: DetectedWord[],
  completedWords: Array<{
    word: string;
    start_row: number;
    start_col: number;
    direction: string;
  }>
): DetectedWord[] {
  const newWords: DetectedWord[] = [];
  
  for (const currentWord of currentWords) {
    // Check if this word already exists in completed words
    const alreadyCompleted = completedWords.some(
      cw =>
        cw.word === currentWord.word &&
        cw.start_row === currentWord.start_row &&
        cw.start_col === currentWord.start_col &&
        cw.direction === currentWord.direction
    );
    
    if (!alreadyCompleted) {
      newWords.push(currentWord);
    }
  }
  
  return newWords;
}
