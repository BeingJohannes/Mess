// Type definitions for the game

export type GameStatus = 'waiting' | 'in_progress' | 'finished';

export interface GameSettings {
  pieceCount: number;
  timerEnabled: boolean;
  timerDuration: number; // in minutes
}

export interface Game {
  id: string;
  join_code: string;
  creator_id: string;
  status: GameStatus;
  max_players: number;
  letter_bag: any[];
  total_tiles_initial: number;
  language: string;
  created_at: string;
  updated_at: string;
  winner_player_id: string | null;
  current_round_winner_id?: string | null;
  is_final_round?: boolean;
  settings?: GameSettings;
  timer_started_at?: string | null;
  timer_ends_at?: string | null;
}

export interface Player {
  id: string;
  game_id: string;
  display_name: string;
  is_creator: boolean;
  is_active: boolean;
  current_tiles: string[];
  color: string;
  avatar_seed: string;
  character?: {
    hairStyle: number;
    accessory: number;
    skinTone: number;
    expression: number;
  };
  has_finished: boolean;
  finish_time: string | null;
  created_at: string;
  updated_at: string;
}

export type LocationType = 'bag' | 'rack' | 'board';

export interface Tile {
  id: string;
  game_id: string;
  letter: string;
  value: number;
  location_type: LocationType;
  owner_player_id: string | null;
  board_row: number | null;
  board_col: number | null;
  last_moved_by_player_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  game_id: string;
  sender_type: 'player' | 'system' | 'ai';
  sender_player_id: string | null;
  content: string;
  metadata: any;
  created_at: string;
}

export interface PlayerScore {
  playerId: string;
  wordCount: number;
  totalLetters: number;
  totalPoints: number;
  stuckPenalty: number;
  messBonus?: number;
}

export interface PlayerCursor {
  playerId: string;
  x: number;
  y: number;
  isDragging: boolean;
}