export interface LetterTileInfo {
  display: string;
  value: string;
}

export interface LetterSpawnModifiers {
  vowelBoostPct?: number; // e.g. +3%
  rareLetterWeightMultiplier?: number; // e.g. 0.8
}

export type LetterWeightTable = Array<{ letter: string; weight: number }>;

// Letter frequencies: Cornell English letter frequency table (40,000-word sample)
// https://pi.math.cornell.edu/~mec/2003-2004/cryptography/subs/frequencies.html
export const CORNELL_LETTER_WEIGHTS: LetterWeightTable = [
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

// Beginner: letter mix from common elementary 2–4 letter words
// (Dolch pre-primer through 2nd + nouns, Fry first 300, K–2 CVC).
// Unique words, 3-letter ×1.5, CVC-only ×0.5; Q=0; J/X capped at 0.30;
// vowels (AEIOU) rescaled to 40%. Y is a consonant. Research notes:
// /workspace/wordblitz_classic_v2/kid_letter_freq.md
export const KID_LETTER_WEIGHTS: LetterWeightTable = [
  { letter: 'E', weight: 11.05 },
  { letter: 'A', weight: 10.00 },
  { letter: 'O', weight: 9.07 },
  { letter: 'T', weight: 7.28 },
  { letter: 'I', weight: 6.01 },
  { letter: 'N', weight: 5.59 },
  { letter: 'S', weight: 4.72 },
  { letter: 'D', weight: 4.54 },
  { letter: 'L', weight: 4.29 },
  { letter: 'R', weight: 4.10 },
  { letter: 'H', weight: 3.92 },
  { letter: 'U', weight: 3.87 },
  { letter: 'M', weight: 3.45 },
  { letter: 'W', weight: 3.29 },
  { letter: 'G', weight: 3.20 },
  { letter: 'B', weight: 3.11 },
  { letter: 'P', weight: 2.92 },
  { letter: 'Y', weight: 2.45 },
  { letter: 'F', weight: 2.29 },
  { letter: 'C', weight: 2.02 },
  { letter: 'K', weight: 1.38 },
  { letter: 'V', weight: 0.76 },
  { letter: 'J', weight: 0.29 },
  { letter: 'X', weight: 0.29 },
  { letter: 'Z', weight: 0.11 },
  { letter: 'Q', weight: 0.00 },
];

// Easy: 50/50 blend of the Beginner kid table and Cornell, renormalized.
export const EASY_LETTER_WEIGHTS: LetterWeightTable = [
  { letter: 'E', weight: 11.55 },
  { letter: 'A', weight: 9.06 },
  { letter: 'O', weight: 8.38 },
  { letter: 'T', weight: 8.19 },
  { letter: 'I', weight: 6.66 },
  { letter: 'N', weight: 6.27 },
  { letter: 'S', weight: 5.50 },
  { letter: 'R', weight: 5.06 },
  { letter: 'H', weight: 4.92 },
  { letter: 'D', weight: 4.43 },
  { letter: 'L', weight: 4.13 },
  { letter: 'U', weight: 3.37 },
  { letter: 'M', weight: 3.03 },
  { letter: 'W', weight: 2.69 },
  { letter: 'G', weight: 2.61 },
  { letter: 'P', weight: 2.37 },
  { letter: 'C', weight: 2.36 },
  { letter: 'B', weight: 2.30 },
  { letter: 'F', weight: 2.29 },
  { letter: 'Y', weight: 2.28 },
  { letter: 'K', weight: 1.04 },
  { letter: 'V', weight: 0.94 },
  { letter: 'X', weight: 0.23 },
  { letter: 'J', weight: 0.19 },
  { letter: 'Z', weight: 0.09 },
  { letter: 'Q', weight: 0.06 },
];

const BASE_TOTAL_WEIGHT = CORNELL_LETTER_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const RARE_LETTERS = new Set(['Q', 'Z', 'X', 'J']);

/**
 * Draws a random letter.
 * In Free Play, called without modifiers: uses default letter frequencies.
 * In Career Mode, supports Vowel Drip and Rare Letter Filter upgrades.
 */
export function drawRandomLetter(modifiers?: LetterSpawnModifiers): LetterTileInfo {
  let weights = CORNELL_LETTER_WEIGHTS;
  let totalWeight = BASE_TOTAL_WEIGHT;

  // Apply Career Mode spawn weight adjustments only if modifiers provided and active
  if (modifiers && (modifiers.vowelBoostPct || modifiers.rareLetterWeightMultiplier !== undefined)) {
    const rareMult = modifiers.rareLetterWeightMultiplier ?? 1.0;
    const vowelBoost = modifiers.vowelBoostPct ?? 0;

    weights = CORNELL_LETTER_WEIGHTS.map((item) => {
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

// Beginner/Easy balance: after N vowels in a row force a consonant, after N consonants force a vowel.
// Otherwise the provided distribution (kid table, Easy blend, or Cornell). Y counts as a consonant.
export const BALANCE_STREAK_LIMIT = 5;
let streakKind: 'vowel' | 'consonant' | null = null;
let streakCount = 0;
let seedQueue: string[] = [];

export function resetLetterStreak(): void {
  streakKind = null;
  streakCount = 0;
  seedQueue = [];
}

/** A restricted table (e.g. a lesson's letters) may have no vowels or no consonants at all. */
function hasWeighted(table: LetterWeightTable, vowel: boolean): boolean {
  return table.some((i) => i.weight > 0 && VOWELS.has(i.letter) === vowel);
}

function drawFrom(pool: LetterWeightTable): string {
  const usable = pool.filter((item) => item.weight > 0);
  const total = usable.reduce((sum, item) => sum + item.weight, 0);
  const r = Math.random() * total;
  let running = 0;
  for (const item of usable) {
    running += item.weight;
    if (r <= running) return item.letter;
  }
  return usable[usable.length - 1].letter;
}

export function drawBalancedLetter(
  limit: number = BALANCE_STREAK_LIMIT,
  table: LetterWeightTable = CORNELL_LETTER_WEIGHTS,
): LetterTileInfo {
  let chosen: string;
  if (streakCount >= limit && streakKind === 'vowel') {
    chosen = drawFrom(table.filter((i) => !VOWELS.has(i.letter)));
  } else if (streakCount >= limit && streakKind === 'consonant') {
    chosen = drawFrom(table.filter((i) => VOWELS.has(i.letter)));
  } else {
    chosen = drawFrom(table);
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

export interface LetterDrawOptions {
  table: LetterWeightTable;
  /** 0 = no vowel/consonant streak cap. */
  streakLimit: number;
  /** When set, sometimes queue the letters of a target word so the pattern is formable. */
  seedWords?: readonly string[];
  seedChance?: number;
}

/**
 * Draw the next tile letter. Seeded target words (sound focus) bypass the streak cap
 * so patterns like "oo" can appear as two vowels in a row. Random fills still obey the cap.
 */
export function drawLetter(opts: LetterDrawOptions): LetterTileInfo {
  const { table, streakLimit, seedWords, seedChance = 0 } = opts;

  if (
    seedQueue.length === 0 &&
    seedWords &&
    seedWords.length > 0 &&
    seedChance > 0 &&
    Math.random() < seedChance
  ) {
    const word = seedWords[Math.floor(Math.random() * seedWords.length)];
    seedQueue.push(...word.split(''));
  }

  let chosen: string;
  if (seedQueue.length > 0) {
    chosen = seedQueue.shift() as string;
  } else if (streakLimit > 0 && streakCount >= streakLimit && streakKind === 'vowel' && hasWeighted(table, false)) {
    chosen = drawFrom(table.filter((i) => !VOWELS.has(i.letter)));
  } else if (streakLimit > 0 && streakCount >= streakLimit && streakKind === 'consonant' && hasWeighted(table, true)) {
    chosen = drawFrom(table.filter((i) => VOWELS.has(i.letter)));
  } else {
    chosen = drawFrom(table);
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

