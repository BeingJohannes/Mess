// AI BananaBot commentator using OpenAI

const OPENAI_ENABLED = false; // Set to true when user provides API key

export async function generateBananaBotComment(
  type: 'word' | 'split' | 'winner',
  context: {
    playerName?: string;
    word?: string;
    winnerName?: string;
    scores?: Array<{ name: string; wordCount: number }>;
  }
): Promise<string> {
  // For prototype, use predefined fun responses
  // In production, this would call OpenAI API
  
  if (type === 'word' && context.word && context.playerName) {
    const responses = [
      `${context.playerName} just spelled "${context.word}" like a boss!`,
      `Whoa! ${context.playerName} with the big word "${context.word}"!`,
      `${context.word}? ${context.playerName} is showing off now!`,
      `Nice one ${context.playerName}, "${context.word}" is a keeper!`,
      `${context.playerName} brought the heat with "${context.word}"!`,
      `Look at ${context.playerName} go with "${context.word}"!`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (type === 'split' && context.playerName) {
    const responses = [
      `${context.playerName} hit MESS IT UP! Fresh tiles for everyone!`,
      `Boom! ${context.playerName} just split the bag!`,
      `${context.playerName} called it! Time for new letters!`,
      `And ${context.playerName} messes it all up! Love it!`,
      `${context.playerName} keeps things interesting!`,
      `Fresh tiles incoming thanks to ${context.playerName}!`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (type === 'winner' && context.winnerName) {
    const responses = [
      `${context.winnerName} takes the crown! What a game!`,
      `Victory goes to ${context.winnerName}! Well played!`,
      `${context.winnerName} dominated that board!`,
      `And the winner is... ${context.winnerName}! Congrats!`,
      `${context.winnerName} proved they have the best vocabulary!`,
      `Game over! ${context.winnerName} wins this round!`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  return 'What a game!';
}

// Future: Add OpenAI integration
/*
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.9,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content.trim();
}
*/
