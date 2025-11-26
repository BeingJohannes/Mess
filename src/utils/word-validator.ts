// Client-side word validation helper
import { Tile } from '../types/game';

export interface DetectedWord {
  word: string;
  tiles: string[];
  direction: 'horizontal' | 'vertical';
  start_row: number;
  start_col: number;
}

const BOARD_SIZE = 100;

export function detectWordsFromTiles(tiles: Tile[]): DetectedWord[] {
  // Safety check
  if (!tiles || tiles.length === 0) {
    return [];
  }
  
  // Build 2D map from (row, col) to tile
  const boardMap = new Map<string, Tile>();
  
  const boardTiles = tiles.filter(
    t => t.location_type === 'board' && t.board_row !== null && t.board_col !== null
  );
  
  for (const tile of boardTiles) {
    const key = `${tile.board_row},${tile.board_col}`;
    boardMap.set(key, tile);
  }
  
  const words: DetectedWord[] = [];
  
  // Extract horizontal words
  for (let row = 0; row < BOARD_SIZE; row++) {
    let col = 0;
    while (col < BOARD_SIZE) {
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
        });
      }
      
      col = scanCol;
    }
  }
  
  // Extract vertical words
  for (let col = 0; col < BOARD_SIZE; col++) {
    let row = 0;
    while (row < BOARD_SIZE) {
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
        });
      }
      
      row = scanRow;
    }
  }
  
  return words;
}

export function areAllTilesInWords(playerTiles: Tile[], allTiles: Tile[]): boolean {
  if (playerTiles.length === 0) return false;
  
  const words = detectWordsFromTiles(allTiles);
  const playerTileIds = new Set(playerTiles.map(t => t.id));
  
  // Check if all player tiles are part of at least one word
  for (const tileId of playerTileIds) {
    const isInWord = words.some(word => word.tiles.includes(tileId));
    if (!isInWord) {
      return false;
    }
  }
  
  return true;
}