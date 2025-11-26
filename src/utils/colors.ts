// Vibrant game colors inspired by modern UI design
const CURSOR_COLORS = [
  '#00D9FF', // Bright Cyan
  '#FF00E5', // Bright Magenta
  '#FF6B00', // Bright Orange  
  '#A855F7', // Bright Purple
  '#FFD600', // Bright Yellow
  '#00FFB3', // Bright Mint
  '#FF1F8E', // Hot Pink
  '#00B8FF', // Sky Blue
];

export function getPlayerColor(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
}

export function darkenColor(hex: string, amount: number = 0.2): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse r, g, b
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Darken
  r = Math.floor(r * (1 - amount));
  g = Math.floor(g * (1 - amount));
  b = Math.floor(b * (1 - amount));
  
  // Clamp
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  
  // Convert back to hex
  const toHex = (n: number) => {
    const h = n.toString(16);
    return h.length === 1 ? '0' + h : h;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}