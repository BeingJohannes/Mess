import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, Player } from '../types/game';
import { AnimalAvatar } from './AnimalAvatar';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ChatPanelProps {
  messages: ChatMessage[];
  players: Player[];
  currentPlayerId: string;
  onSendMessage: (content: string) => void;
}

export function ChatPanel({ messages, players, currentPlayerId, onSendMessage }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  
  // Filter to only show player messages
  const playerMessages = messages.filter(msg => msg.sender_type === 'player');
  
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [playerMessages]);
  
  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const getPlayer = (playerId: string | null) => {
    if (!playerId) return null;
    return players.find(p => p.id === playerId);
  };
  
  return (
    <div className="flex flex-col h-full font-sans">
      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {playerMessages.map((message) => {
          const player = getPlayer(message.sender_player_id);
          
          if (message.sender_type === 'player' && player) {
            const isOwnMessage = player.id === currentPlayerId;
            
            return (
              <div key={message.id} className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                <AnimalAvatar 
                  options={player.character || { animalType: 0 }}
                  color={player.color} 
                  size="sm" 
                />
                <div className={`flex-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                  <p className="text-[10px] text-gray-400 mb-1 px-1 font-medium">{player.display_name}</p>
                  <div 
                    className={`inline-block px-4 py-2.5 rounded-2xl text-sm shadow-sm border ${
                      isOwnMessage 
                        ? 'bg-blue-600 text-white border-blue-600 rounded-tr-sm' 
                        : 'bg-white text-gray-800 border-gray-100 rounded-tl-sm'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            );
          }
          
          return null;
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="flex gap-2 pt-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-4 py-5 rounded-xl bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 shadow-sm"
        />
        <Button 
          onClick={handleSend} 
          size="icon" 
          className="h-[42px] w-[42px] rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all hover:scale-105"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}