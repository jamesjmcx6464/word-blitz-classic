import rawWords from './words.json';
import { POPULAR_COUNTRIES_AND_DEMONYMS } from './countries';
import { COMMON_PROFESSIONS_AND_SCIENCES } from './professions';
import { isAllowedTwoLetter } from './twoLetterAllowlist';

const wordSet = new Set<string>(rawWords as string[]);

function acceptWord(word: string): string | null {
  const normalized = word.toUpperCase().trim();
  if (normalized.length < 2) return null;
  // Block junk 2-letter tokens from runtime splits (e.g. AU from "AU PAIR")
  // and from any stale list entry.
  if (normalized.length === 2 && !isAllowedTwoLetter(normalized)) return null;
  return normalized;
}

function addWord(word: string): void {
  const normalized = acceptWord(word);
  if (normalized) wordSet.add(normalized);
}

// Add top 50+ popular countries, nationalities, and demonyms
for (const word of POPULAR_COUNTRIES_AND_DEMONYMS) {
  addWord(word);
}

// Add 500+ common professions, scientific disciplines, and careers
for (const item of COMMON_PROFESSIONS_AND_SCIENCES) {
  // Support single words and sub-words
  const words = item.toUpperCase().trim().split(/\s+/);
  for (const w of words) {
    addWord(w);
  }
}

// Months of the year (proper nouns missing from the base word list)
const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];
for (const m of MONTHS) addWord(m);

// Days of the week
const DAYS = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
];
for (const d of DAYS) addWord(d);

export function isValidWord(word: string): boolean {
  const normalized = acceptWord(word ?? '');
  if (!normalized) return false;
  return wordSet.has(normalized);
}

export function getWordScore(length: number): number {
  if (length < 2) return 0;
  // 2^length. Safe (exact) in JS for every real English word (2^53 is the
  // integer limit; the longest dictionary word is far shorter). A 15-letter
  // word is worth 32,768 points, which will dominate a short timed round.
  return Math.pow(2, length);
}

export const TOTAL_DICTIONARY_WORDS = wordSet.size;
