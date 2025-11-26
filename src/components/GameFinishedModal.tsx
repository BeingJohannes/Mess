import React from 'react';
import { motion } from 'motion/react';
import { Player, PlayerScore } from '../types/game';
import { Button } from './ui/button';
import { Trophy, Award, Zap, AlertCircle, TrendingUp, Type } from 'lucide-react';
import { AnimalAvatar } from './AnimalAvatar';

export interface GameFinishedStats {
  playerId: string;
  playerName: string;
  avatarSeed: string;
  color: string;
  character?: {
    animalType: number;
  };
  totalPoints: number;
  wordCount: number;
  messCount: number;
  stuckCount: number;
  longestWord: string;
  totalVowels: number;
  totalConsonants: number;
}

interface GameFinishedModalProps {
  isOpen: boolean;
  stats: GameFinishedStats[];
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export function GameFinishedModal({ 
  isOpen, 
  stats, 
  onPlayAgain, 
  onReturnHome 
}: GameFinishedModalProps) {
  if (!isOpen || stats.length === 0) return null;

  // Sort by total points (descending)
  const sortedStats = [...stats].sort((a, b) => b.totalPoints - a.totalPoints);
  const winner = sortedStats[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Lighter blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md z-50"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden pointer-events-auto"
              style={{
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.05)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Clean White with Gradient Text */}
              <div className="p-8 text-center relative overflow-hidden border-b border-gray-100">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="absolute top-6 right-6"
                >
                  <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
                </motion.div>
                
                <motion.h1
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent"
                  style={{ fontFamily: 'Fredoka, Nunito, sans-serif' }}
                >
                  Game Finished!
                </motion.h1>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-3"
                >
                  <AnimalAvatar 
                    options={winner.character || { animalType: 0 }}
                    color={winner.color}
                    size="lg" 
                  />
                  <div className="text-left">
                    <p className="text-sm text-gray-500">Winner</p>
                    <p className="text-2xl text-gray-900" style={{ fontFamily: 'Fredoka, Nunito, sans-serif' }}>{winner.playerName}</p>
                  </div>
                </motion.div>
              </div>

              {/* Leaderboard */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-280px)]">
                <div className="space-y-3">
                  {sortedStats.map((stat, index) => (
                    <motion.div
                      key={stat.playerId}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className={`
                        rounded-2xl p-3 border transition-all
                        ${index === 0 
                          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 shadow-md' 
                          : 'bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Rank */}
                        <div className={`
                          flex items-center justify-center w-10 h-10 rounded-full text-xl shrink-0
                          ${index === 0 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'}
                        `}>
                          {index === 0 ? '🏆' : index + 1}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <AnimalAvatar 
                              options={stat.character || { animalType: 0 }}
                              color={stat.color}
                              size="sm" 
                            />
                            <div className="flex-1">
                              <h3 className="truncate" style={{ fontFamily: 'Fredoka, Nunito, sans-serif' }}>{stat.playerName}</h3>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Trophy className="w-3 h-3 text-purple-600" />
                                <span className="text-purple-600" style={{ fontFamily: 'Fredoka, Nunito, sans-serif' }}>{stat.totalPoints} pts</span>
                              </div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {/* Words */}
                            <div className="bg-white rounded-xl p-2 border border-gray-200">
                              <div className="flex items-center gap-1 text-blue-600 mb-0.5">
                                <Type className="w-3 h-3" />
                                <span className="text-xs">Words</span>
                              </div>
                              <p className="text-sm">{stat.wordCount}</p>
                            </div>

                            {/* Messes */}
                            <div className="bg-white rounded-xl p-2 border border-gray-200">
                              <div className="flex items-center gap-1 text-pink-600 mb-0.5">
                                <Zap className="w-3 h-3" />
                                <span className="text-xs">Messes</span>
                              </div>
                              <p className="text-sm">{stat.messCount}</p>
                            </div>

                            {/* I'm Stuck */}
                            <div className="bg-white rounded-xl p-2 border border-gray-200">
                              <div className="flex items-center gap-1 text-orange-600 mb-0.5">
                                <AlertCircle className="w-3 h-3" />
                                <span className="text-xs">Stuck</span>
                              </div>
                              <p className="text-sm">{stat.stuckCount}</p>
                            </div>

                            {/* Longest Word */}
                            <div className="bg-white rounded-xl p-2 border border-gray-200">
                              <div className="flex items-center gap-1 text-green-600 mb-0.5">
                                <TrendingUp className="w-3 h-3" />
                                <span className="text-xs">Longest</span>
                              </div>
                              <p className="text-xs truncate uppercase">{stat.longestWord || '-'}</p>
                            </div>

                            {/* Vowels */}
                            <div className="bg-white rounded-xl p-2 border border-gray-200">
                              <div className="text-xs text-indigo-600 mb-0.5">Vowels</div>
                              <p className="text-sm">{stat.totalVowels}</p>
                            </div>

                            {/* Consonants */}
                            <div className="bg-white rounded-xl p-2 border border-gray-200">
                              <div className="text-xs text-violet-600 mb-0.5">Consonants</div>
                              <p className="text-sm">{stat.totalConsonants}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <Button
                  onClick={onReturnHome}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl bg-white text-gray-800 hover:bg-gray-50 border-2 border-gray-800"
                  style={{ fontFamily: 'Fredoka, Nunito, sans-serif' }}
                >
                  Return to Home
                </Button>
                <Button
                  onClick={onPlayAgain}
                  className="flex-1 h-11 rounded-xl bg-black text-white hover:bg-gray-800"
                  style={{ fontFamily: 'Fredoka, Nunito, sans-serif' }}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}