import rawWords from './words.json';
import { POPULAR_COUNTRIES_AND_DEMONYMS } from './countries';
import { COMMON_PROFESSIONS_AND_SCIENCES } from './professions';

const wordSet = new Set<string>(rawWords as string[]);

// Add top 50+ popular countries, nationalities, and demonyms
for (const word of POPULAR_COUNTRIES_AND_DEMONYMS) {
  const normalized = word.toUpperCase().trim();
  if (normalized.length >= 2) {
    wordSet.add(normalized);
  }
}

// Add 500+ common professions, scientific disciplines, and careers
for (const item of COMMON_PROFESSIONS_AND_SCIENCES) {
  // Support single words and sub-words
  const words = item.toUpperCase().trim().split(/\s+/);
  for (const w of words) {
    if (w.length >= 2) {
      wordSet.add(w);
    }
  }
}

// Months of the year (proper nouns missing from the base word list)
const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];
for (const m of MONTHS) wordSet.add(m);


export function isValidWord(word: string): boolean {
  if (!word || word.length < 2) return false;
  return wordSet.has(word.toUpperCase().trim());
}

export function getWordScore(length: number): number {
  if (length < 2) return 0;
  return Math.pow(2, length);
}

export const TOTAL_DICTIONARY_WORDS = wordSet.size;

