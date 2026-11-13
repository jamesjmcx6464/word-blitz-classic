export interface LetterTileInfo {
  display: string;
  value: string;
}

export interface LetterSpawnModifiers {
  vowelBoostPct?: number; // e.g. +3%
  rareLetterWeightMultiplier?: number; // e.g. 0.8
}

// Letter frequency table based on English usage with sensible floor
// Rare letters (J, X, Q, Z) have a floor of 1.0% to keep gameplay fair and engaging
const BASE_LETTER_WEIGHTS: Array<{ letter: string; weight: number }> = [
  { letter: 'E', weight: 12.0 },
  { letter: 'A', weight: 8.5 },
  { letter: 'I', weight: 7.5 },
  { letter: 'O', weight: 7.5 },
  { letter: 'T', weight: 7.0 },
  { letter: 'N', weight: 6.5 },
  { letter: 'S', weight: 6.2 },
  { letter: 'R', weight: 6.0 },
  { letter: 'H', weight: 5.5 },
  { letter: 'L', weight: 4.2 },
  { letter: 'D', weight: 4.0 },
  { letter: 'C', weight: 3.2 },
  { letter: 'U', weight: 3.2 },
  { letter: 'M', weight: 2.8 },
  { letter: 'P', weight: 2.5 },
  { letter: 'F', weight: 2.2 },
  { letter: 'G', weight: 2.2 },
  { letter: 'W', weight: 2.2 },
  { letter: 'Y', weight: 2.0 },
  { letter: 'B', weight: 1.8 },
  { letter: 'V', weight: 1.4 },
  { letter: 'K', weight: 1.2 },
  { letter: 'J', weight: 1.0 },
  { letter: 'X', weight: 1.0 },
  { letter: 'Z', weight: 1.0 },
  { letter: 'Q', weight: 1.0 },
];

const BASE_TOTAL_WEIGHT = BASE_LETTER_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const RARE_LETTERS = new Set(['Q', 'Z', 'X', 'J']);

/**
 * Draws a random letter.
 * In Free Play, called without modifiers: uses default letter frequencies.
 * In Career Mode, supports Vowel Drip and Rare Letter Filter upgrades.
 */
export function drawRandomLetter(modifiers?: LetterSpawnModifiers): LetterTileInfo {
  let weights = BASE_LETTER_WEIGHTS;
  let totalWeight = BASE_TOTAL_WEIGHT;

  // Apply Career Mode spawn weight adjustments only if modifiers provided and active
  if (modifiers && (modifiers.vowelBoostPct || modifiers.rareLetterWeightMultiplier !== undefined)) {
    const rareMult = modifiers.rareLetterWeightMultiplier ?? 1.0;
    const vowelBoost = modifiers.vowelBoostPct ?? 0;

    weights = BASE_LETTER_WEIGHTS.map((item) => {
      let w = item.weight;
      if (RARE_LETTERS.has(item.letter)) {
        w *= rareMult;
      }
      if (VOWELS.has(item.letter) && vowelBoost > 0) {
        // Boost vowels proportionately to increase overall vowel probability
        w *= (1 + vowelBoost / 30);
      }
      return { letter: item.letter, weight: w };
    });

    totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  }

  const r = Math.random() * totalWeight;
  let running = 0;
  let chosen = 'E';

  for (const item of weights) {
    running += item.weight;
    if (r <= running) {
      chosen = item.letter;
      break;
    }
  }

  // Q and U are always separate single letters
  return { display: chosen, value: chosen };
}
