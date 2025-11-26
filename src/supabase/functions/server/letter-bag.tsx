// Letter distribution for the game (Scrabble-style)

export interface LetterDefinition {
  letter: string;
  count: number;
  value: number;
}

export const LETTER_DISTRIBUTION: LetterDefinition[] = [
  { letter: 'A', count: 9, value: 1 },
  { letter: 'B', count: 2, value: 3 },
  { letter: 'C', count: 2, value: 3 },
  { letter: 'D', count: 4, value: 2 },
  { letter: 'E', count: 12, value: 1 },
  { letter: 'F', count: 2, value: 4 },
  { letter: 'G', count: 3, value: 2 },
  { letter: 'H', count: 2, value: 4 },
  { letter: 'I', count: 9, value: 1 },
  { letter: 'J', count: 1, value: 8 },
  { letter: 'K', count: 1, value: 5 },
  { letter: 'L', count: 4, value: 1 },
  { letter: 'M', count: 2, value: 3 },
  { letter: 'N', count: 6, value: 1 },
  { letter: 'O', count: 8, value: 1 },
  { letter: 'P', count: 2, value: 3 },
  { letter: 'Q', count: 1, value: 10 },
  { letter: 'R', count: 6, value: 1 },
  { letter: 'S', count: 4, value: 1 },
  { letter: 'T', count: 6, value: 1 },
  { letter: 'U', count: 4, value: 1 },
  { letter: 'V', count: 2, value: 4 },
  { letter: 'W', count: 2, value: 4 },
  { letter: 'X', count: 1, value: 8 },
  { letter: 'Y', count: 2, value: 4 },
  { letter: 'Z', count: 1, value: 10 },
];

export function createLetterBag(targetCount: number = 100): string[] {
  const bag: string[] = [];
  
  // Calculate total letters in standard distribution
  const standardTotal = LETTER_DISTRIBUTION.reduce((sum, def) => sum + def.count, 0);
  
  // Calculate scaling factor
  const scaleFactor = targetCount / standardTotal;
  
  // Create scaled bag
  for (const letterDef of LETTER_DISTRIBUTION) {
    const scaledCount = Math.max(1, Math.round(letterDef.count * scaleFactor));
    for (let i = 0; i < scaledCount; i++) {
      bag.push(letterDef.letter);
    }
  }
  
  // Trim or pad to exact target count
  if (bag.length > targetCount) {
    // Randomly remove excess letters
    while (bag.length > targetCount) {
      const randomIndex = Math.floor(Math.random() * bag.length);
      bag.splice(randomIndex, 1);
    }
  } else if (bag.length < targetCount) {
    // Pad with common vowels
    const commonVowels = ['A', 'E', 'I', 'O'];
    while (bag.length < targetCount) {
      bag.push(commonVowels[Math.floor(Math.random() * commonVowels.length)]);
    }
  }
  
  // Shuffle the bag
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  
  return bag;
}

export function getLetterValue(letter: string): number {
  const letterDef = LETTER_DISTRIBUTION.find(l => l.letter === letter.toUpperCase());
  return letterDef?.value || 1;
}