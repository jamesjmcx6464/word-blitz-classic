import { SPARK_WORDS } from '../data/adventureLexicon';
import { AdventureLevelDef, BONUS_SEED_CHANCE } from './adventureConfig';
import { KID_LETTER_WEIGHTS, LetterDrawOptions, LetterWeightTable } from './letterBag';

/** Lesson words (uppercase) for a Spark level; the Boss uses all Spark words. */
export function bonusWordsFor(level: AdventureLevelDef): string[] {
  const entries = level.soundGroup
    ? SPARK_WORDS.filter((e) => e.soundGroup === level.soundGroup)
    : SPARK_WORDS;
  return Array.from(new Set(entries.map((e) => e.word.trim().toUpperCase()).filter((w) => /^[A-Z]+$/.test(w))));
}

/**
 * Letter draw for a bonus Blitz: the Sound Focus seed machinery fed with the lesson words,
 * over a 50/50 blend of the kid letter table and the lesson words' own letter mix.
 */
export function bonusLetterDraw(level: AdventureLevelDef): LetterDrawOptions {
  const words = bonusWordsFor(level);
  const counts: Record<string, number> = {};
  let total = 0;
  for (const w of words) {
    for (const ch of w) {
      counts[ch] = (counts[ch] ?? 0) + 1;
      total += 1;
    }
  }
  const kidTotal = KID_LETTER_WEIGHTS.reduce((s, i) => s + i.weight, 0);
  const table: LetterWeightTable = KID_LETTER_WEIGHTS.map((i) => ({
    letter: i.letter,
    weight: (i.weight / kidTotal) * 50 + (total > 0 ? ((counts[i.letter] ?? 0) / total) * 50 : 0),
  })).filter((i) => i.weight > 0);
  return { table, streakLimit: 5, seedWords: words, seedChance: BONUS_SEED_CHANCE };
}
