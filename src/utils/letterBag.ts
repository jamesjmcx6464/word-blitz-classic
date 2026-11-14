export interface LetterTileInfo {
  display: string;
  value: string;
}

export interface LetterSpawnModifiers {
  vowelBoostPct?: number; // e.g. +3%
  rareLetterWeightMultiplier?: number; // e.g. 0.8
}

// Letter frequencies: Cornell English letter frequency table (40,000-word sample)
// https://pi.math.cornell.edu/~mec/2003-2004/cryptography/subs/frequencies.html
const BASE_LETTER_WEIGHTS: Array<{ letter: string; weight: number }> = [
  { letter: 'E', weight: 12.02 },
  { letter: 'T', weight: 9.1 },
  { letter: 'A', weight: 8.12 },
  { letter: 'O', weight: 7.68 },
  { letter: 'I', weight: 7.31 },
  { letter: 'N', weight: 6.95 },
  { letter: 'S', weight: 6.28 },
  { letter: 'R', weight: 6.02 },
  { letter: 'H', weight: 5.92 },
  { letter: 'D', weight: 4.32 },
  { letter: 'L', weight: 3.98 },
  { letter: 'U', weight: 2.88 },
  { letter: 'C', weight: 2.71 },
  { letter: 'M', weight: 2.61 },
  { letter: 'F', weight: 2.3 },
  { letter: 'Y', weight: 2.11 },
  { letter: 'W', weight: 2.09 },
  { letter: 'G', weight: 2.03 },
  { letter: 'P', weight: 1.82 },
  { letter: 'B', weight: 1.49 },
  { letter: 'V', weight: 1.11 },
  { letter: 'K', weight: 0.69 },
  { letter: 'X', weight: 0.17 },
  { letter: 'Q', weight: 0.11 },
  { letter: 'J', weight: 0.1 },
  { letter: 'Z', weight: 0.07 },
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

// Beginner/Easy balance: after 5 vowels in a row force a consonant, after 5 consonants force a vowel.
// Otherwise the standard Cornell distribution. Y counts as a consonant.
export const BALANCE_STREAK_LIMIT = 5;
let streakKind: 'vowel' | 'consonant' | null = null;
let streakCount = 0;

export function resetLetterStreak(): void {
  streakKind = null;
  streakCount = 0;
}

function drawFrom(pool: Array<{ letter: string; weight: number }>): string {
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  const r = Math.random() * total;
  let running = 0;
  for (const item of pool) {
    running += item.weight;
    if (r <= running) return item.letter;
  }
  return pool[pool.length - 1].letter;
}

export function drawBalancedLetter(): LetterTileInfo {
  let chosen: string;
  if (streakCount >= BALANCE_STREAK_LIMIT && streakKind === 'vowel') {
    chosen = drawFrom(BASE_LETTER_WEIGHTS.filter((i) => !VOWELS.has(i.letter)));
  } else if (streakCount >= BALANCE_STREAK_LIMIT && streakKind === 'consonant') {
    chosen = drawFrom(BASE_LETTER_WEIGHTS.filter((i) => VOWELS.has(i.letter)));
  } else {
    chosen = drawFrom(BASE_LETTER_WEIGHTS);
  }
  const kind = VOWELS.has(chosen) ? 'vowel' : 'consonant';
  if (kind === streakKind) {
    streakCount += 1;
  } else {
    streakKind = kind;
    streakCount = 1;
  }
  return { display: chosen, value: chosen };
}
