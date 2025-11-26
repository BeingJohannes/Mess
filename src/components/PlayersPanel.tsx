import React from 'react';
import { Player, PlayerScore, Tile } from '../types/game';
import { AnimalAvatar } from './AnimalAvatar';
import { Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface PlayersPanelProps {
  players: Player[];
  scores: PlayerScore[];
  currentPlayerId: string;
  winnerId?: string | null;
  tiles: Tile[];
}

// Track previous scores to detect changes
const previousScores = new Map<string, number>();

export function PlayersPanel({ players, scores, currentPlayerId, winnerId, tiles }: PlayersPanelProps) {
  const [scorePopups, setScorePopups] = React.useState<Map<string, { value: number; id: number }>>(new Map());
  
  const getScore = (playerId: string) => {
    return scores.find(s => s.playerId === playerId) || { wordCount: 0, totalLetters: 0, totalPoints: 0, stuckPenalty: 0 };
  };
  
  // Get rack tile count for a player
  const getRackTileCount = (playerId: string) => {
    return tiles.filter(t => t.owner_player_id === playerId && t.location_type === 'rack').length;
  };
  
  // Detect score changes and trigger popups
  React.useEffect(() => {
    scores.forEach(score => {
      const prevScore = previousScores.get(score.playerId) || 0;
      const currentScore = score.totalPoints;
      
      if (currentScore !== prevScore && prevScore !== 0) {
        const change = currentScore - prevScore;
        // Add a popup with unique ID
        setScorePopups(prev => {
          const newMap = new Map(prev);
          newMap.set(score.playerId, { value: change, id: Date.now() });
          return newMap;
        });
        
        // Remove popup after animation
        setTimeout(() => {
          setScorePopups(prev => {
            const newMap = new Map(prev);
            newMap.delete(score.playerId);
            return newMap;
          });
        }, 2000);
      }
      
      previousScores.set(score.playerId, currentScore);
    });
  }, [scores]);
  
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = getScore(a.id);
    const scoreB = getScore(b.id);
    
    if (scoreB.wordCount !== scoreA.wordCount) {
      return scoreB.wordCount - scoreA.wordCount;
    }
    return scoreB.totalLetters - scoreA.totalLetters;
  });
  
  // Lighten player color for background
  const lightenColor = (hexColor: string, amount: number = 0.92) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.round(r + (255 - r) * amount);
    const newG = Math.round(g + (255 - g) * amount);
    const newB = Math.round(b + (255 - b) * amount);
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  };
  
  return (
    <div className="w-full font-sans">
      <div className="space-y-2.5">
        {sortedPlayers.map((player) => {
          const score = getScore(player.id);
          const isCurrentPlayer = player.id === currentPlayerId;
          const isWinner = player.id === winnerId;
          const rackTileCount = getRackTileCount(player.id);
          const maxTiles = 7;
          const scorePopup = scorePopups.get(player.id);
          
          return (
            <div
              key={player.id}
              className="relative flex items-stretch gap-4 px-4 py-3 rounded-2xl transition-all duration-300 border-2 bg-white/90 backdrop-blur-sm shadow-lg"
              style={{ 
                borderColor: isCurrentPlayer ? player.color : 'rgba(0,0,0,0.05)',
              }}
            >
              {/* Score popup animation */}
              <AnimatePresence>
                {scorePopup && (
                  <motion.div
                    key={scorePopup.id}
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -40, scale: 1 }}
                    exit={{ opacity: 0, y: -60, scale: 0.8 }}
                    transition={{ 
                      duration: 0.5,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none z-50"
                  >
                    <div 
                      className="px-3 py-1.5 rounded-full shadow-lg font-black text-sm"
                      style={{
                        backgroundColor: scorePopup.value > 0 ? '#10b981' : '#ef4444',
                        color: 'white',
                      }}
                    >
                      {scorePopup.value > 0 ? '+' : ''}{scorePopup.value}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Avatar with "You" badge overlay */}
              <div className="relative flex-shrink-0 flex items-center">
                <AnimalAvatar 
                  options={player.character || { animalType: 0 }}
                  color={player.color} 
                  size="xs" 
                />
                {isWinner && (
                   <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1 rounded-full shadow-sm">
                     <Crown className="w-3 h-3" />
                   </div>
                )}
                {isCurrentPlayer && (
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] px-2 py-[2px] rounded-full font-bold uppercase tracking-wider border-2"
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderColor: '#1a1a1a',
                      color: 'white',
                    }}
                  >
                    You
                  </div>
                )}
              </div>
              
              {/* Content area - vertically centered */}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                {/* Left column: Name and Tiles */}
                <div className="flex flex-col justify-center gap-1.5">
                  <p className="font-bold truncate text-gray-900">
                    {player.display_name}
                  </p>
                  
                  {/* Tile count indicators */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: maxTiles }).map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-sm"
                            style={{
                              backgroundColor: i < rackTileCount ? player.color : 'rgba(150, 150, 170, 0.2)',
                            }}
                          />
                        ))}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{rackTileCount} / {maxTiles} tiles in hand</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Right column: Word count and score */}
                <div className="flex items-center gap-3 justify-center">
                  {/* Words count with badges */}
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <span>Words:</span>
                          <span className="font-bold text-gray-900">{score.wordCount}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Number of valid words placed</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* Badges inline */}
                    {score.stuckPenalty > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] text-orange-700 font-bold bg-orange-200/60 px-1.5 py-0.5 rounded ml-1">
                            -{score.stuckPenalty}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>"I'm stuck" penalty: -{score.stuckPenalty} points</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {score.messBonus > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1" style={{
                            backgroundColor: `${player.color}40`,
                            color: player.color
                          }}>
                            +{score.messBonus}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>MESS bonus: +{score.messBonus} points</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  
                  {/* Big score number */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-4xl font-black leading-none cursor-help" style={{ color: player.color }}>
                        {score.totalPoints}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm space-y-1">
                        <p className="font-bold">Total Score Breakdown:</p>
                        <p>Words: {score.wordCount}</p>
                        <p>Letters placed: {score.totalLetters}</p>
                        {score.messBonus > 0 && <p className="text-green-400">MESS bonus: +{score.messBonus}</p>}
                        {score.stuckPenalty > 0 && <p className="text-orange-400">Stuck penalty: -{score.stuckPenalty}</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}