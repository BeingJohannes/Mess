import React from 'react';
import { Timer, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export interface GameSettingsOptions {
  pieceCount: number;
  timerEnabled: boolean;
  timerDuration: number; // in minutes
}

interface GameSettingsProps {
  settings: GameSettingsOptions;
  onChange: (settings: GameSettingsOptions) => void;
}

const PIECE_OPTIONS = [12, 30, 60, 100, 150, 200];
const TIMER_DURATIONS = [5, 10, 15, 20, 30]; // minutes

export function GameSettings({ settings, onChange }: GameSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Piece Count Selection */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
          <Zap className="w-4 h-4" />
          Number of Pieces
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PIECE_OPTIONS.map((count) => (
            <button
              key={count}
              onClick={() => onChange({ ...settings, pieceCount: count })}
              className={`
                px-4 py-3 rounded-xl font-semibold transition-all
                ${settings.pieceCount === count
                  ? 'bg-black text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:shadow-md'
                }
              `}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Timer Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
          <Timer className="w-4 h-4" />
          Game Timer
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ ...settings, timerEnabled: false })}
            className={`
              flex-1 px-4 py-3 rounded-xl font-semibold transition-all
              ${!settings.timerEnabled
                ? 'bg-black text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:shadow-md'
              }
            `}
          >
            No Timer
          </button>
          <button
            onClick={() => onChange({ ...settings, timerEnabled: true })}
            className={`
              flex-1 px-4 py-3 rounded-xl font-semibold transition-all
              ${settings.timerEnabled
                ? 'bg-black text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:shadow-md'
              }
            `}
          >
            Timed Game
          </button>
        </div>
      </div>

      {/* Timer Duration Selection (only if timer enabled) */}
      {settings.timerEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <label className="block text-sm font-semibold mb-3 text-gray-700">
            Timer Duration
          </label>
          <div className="grid grid-cols-5 gap-2">
            {TIMER_DURATIONS.map((duration) => (
              <button
                key={duration}
                onClick={() => onChange({ ...settings, timerDuration: duration })}
                className={`
                  px-3 py-3 rounded-xl font-semibold transition-all
                  ${settings.timerDuration === duration
                    ? 'bg-black text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:shadow-md'
                  }
                `}
              >
                {duration}m
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Game ends when time runs out. Player with most points wins!
          </p>
        </motion.div>
      )}
    </div>
  );
}
