import React from 'react';
import { motion } from 'motion/react';
import { Shuffle } from 'lucide-react';

export interface CharacterOptions {
  animalType: number; // 0-14: different animals
}

interface CharacterCustomizerProps {
  options: CharacterOptions;
  onChange: (options: CharacterOptions) => void;
  className?: string;
}

// 15 different animal types
const ANIMAL_TYPES = 15;

export function CharacterCustomizer({ options, onChange, className = '' }: CharacterCustomizerProps) {
  const randomize = () => {
    onChange({ animalType: Math.floor(Math.random() * ANIMAL_TYPES) });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <button
        type="button"
        onClick={randomize}
        className="w-full py-3 px-6 bg-white text-gray-800 hover:bg-gray-50 border-2 border-gray-800 rounded-full font-semibold hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Shuffle className="w-5 h-5" />
        Randomize Animal
      </button>
    </div>
  );
}

export { ANIMAL_TYPES };