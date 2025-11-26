
// List of 2-letter words for basic validation
const TWO_LETTER_WORDS = new Set([
  'AA', 'AB', 'AD', 'AE', 'AG', 'AH', 'AI', 'AL', 'AM', 'AN', 'AR', 'AS', 'AT', 'AW', 'AX', 'AY',
  'BA', 'BE', 'BI', 'BO', 'BY',
  'CH', 'DA', 'DE', 'DI', 'DO',
  'EA', 'ED', 'EE', 'EF', 'EH', 'EL', 'EM', 'EN', 'ER', 'ES', 'ET', 'EW', 'EX',
  'FA', 'FE', 'FY',
  'GI', 'GO', 'GU',
  'HA', 'HE', 'HI', 'HM', 'HO',
  'ID', 'IF', 'IN', 'IO', 'IS', 'IT',
  'JA', 'JO',
  'KA', 'KI', 'KO', 'KY',
  'LA', 'LI', 'LO',
  'MA', 'ME', 'MI', 'MM', 'MO', 'MU', 'MY',
  'NA', 'NE', 'NO', 'NU',
  'OB', 'OD', 'OE', 'OF', 'OH', 'OI', 'OK', 'OM', 'ON', 'OP', 'OR', 'OS', 'OW', 'OX', 'OY',
  'PA', 'PE', 'PI', 'PO',
  'QI',
  'RE',
  'SH', 'SI', 'SO', 'ST',
  'TA', 'TE', 'TI', 'TO',
  'UG', 'UH', 'UM', 'UN', 'UP', 'UR', 'US', 'UT',
  'WE', 'WO',
  'XI', 'XU',
  'YA', 'YE', 'YO',
  'ZA', 'ZO'
]);

export function isValidWord(word: string): boolean {
  const w = word.toUpperCase();
  if (w.length < 2) return false;
  // Strict check for 2-letter words
  if (w.length === 2) return TWO_LETTER_WORDS.has(w);
  
  // For 3+ letters, we ideally need a full dictionary. 
  // For now, we'll optimistically accept them to avoid false negatives on valid words,
  // assuming the players are validating longer words themselves.
  return true;
}
