import { AdventureLevelDef, BONUS_SEED_CHANCE, wordsForLevel } from './adventureConfig';
import { LetterDrawOptions, LetterWeightTable } from './letterBag';

/** Lesson words (uppercase) for a level; a Boss uses every word in its band. */
export function bonusWordsFor(level: AdventureLevelDef): string[] {
  const entries = wordsForLevel(level);
  return Array.from(new Set(entries.map((e) => e.word.trim().toUpperCase()).filter((w) => /^[A-Z]+$/.test(w))));
}

/** Every letter a level's bonus Blitz may ever spawn: only letters in its lesson words. */
export function allowedBonusLetters(level: AdventureLevelDef): Set<string> {
  return new Set(bonusWordsFor(level).join('').split(''));
}

/**
 * Letter draw for a bonus Blitz: a restricted weight table built ONLY from the
 * lesson words' letters (each weighted by how often it appears across them), plus
 * seed-word injection so whole lesson words show up often. No arcade letter mix,
 * so Short E never spawns another vowel and a Boss only uses its band's letters.
 */
export function bonusLetterDraw(level: AdventureLevelDef): LetterDrawOptions {
  const words = bonusWordsFor(level);
  const counts = new Map<string, number>();
  for (const w of words) for (const ch of w) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const table: LetterWeightTable = Array.from(counts, ([letter, weight]) => ({ letter, weight })).sort((a, b) =>
    a.letter.localeCompare(b.letter)
  );
  return { table, streakLimit: 5, seedWords: words, seedChance: BONUS_SEED_CHANCE };
}
