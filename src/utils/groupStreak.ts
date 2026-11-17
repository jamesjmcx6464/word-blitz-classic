import {
  PRESET_WORDS,
  SOUND_FOCUS,
  SoundFocusId,
  LetterPresetId,
} from '../data/phonicsLists';
import { isStandardLetterMix, LetterDistributionSettings } from './letterDistributions';

/** Streak stages: 1 × 1.5 × 2 … up to 4×. */
export const STREAK_STAGES = [1, 1.5, 2, 2.5, 3, 3.5, 4] as const;
export type StreakMultiplier = (typeof STREAK_STAGES)[number];

/** Readable ROYGBIV shades on a dark HUD (1× red … 4× violet). */
export const STREAK_COLORS: Record<StreakMultiplier, { fill: string; stroke: string; label: string }> = {
  1: { fill: '#f87171', stroke: '#450a0a', label: 'red' },
  1.5: { fill: '#fb923c', stroke: '#431407', label: 'orange' },
  2: { fill: '#facc15', stroke: '#422006', label: 'yellow' },
  2.5: { fill: '#4ade80', stroke: '#052e16', label: 'green' },
  3: { fill: '#60a5fa', stroke: '#1e3a8a', label: 'blue' },
  3.5: { fill: '#818cf8', stroke: '#1e1b4b', label: 'indigo' },
  4: { fill: '#c084fc', stroke: '#3b0764', label: 'violet' },
};

const CONSONANT = 'BCDFGHJKLMNPQRSTVWXYZ';
const VOWEL = 'AEIOU';

const SIGHT_SET: Set<string> = new Set(PRESET_WORDS.sight);
const CVC_SET: Set<string> = new Set(PRESET_WORDS.cvc);
const FAMILY_SET: Set<string> = new Set(PRESET_WORDS.families);
const FAMILY_ENDINGS = ['AT', 'AN', 'IG', 'OP', 'UG'] as const;

/** Blends and digraphs used to build the Blends & Digraphs preset. */
const BLENDS_DIGRAPHS = [
  'SH', 'CH', 'TH', 'WH', 'CK', 'NG',
  'ST', 'BL', 'CL', 'FL', 'PL', 'SL',
  'BR', 'CR', 'DR', 'FR', 'GR', 'TR',
  'SW', 'SM', 'SN', 'SP', 'SK', 'TW',
] as const;

const SOUND_SUBSTRING: Partial<Record<SoundFocusId, string[]>> = {
  oo: ['OO'],
  ee: ['EE'],
  ea: ['EA'],
  ai: ['AI'],
  ay: ['AY'],
  oa: ['OA'],
  ow: ['OW'],
  ou: ['OU'],
  ar: ['AR'],
  or: ['OR'],
  er: ['ER', 'IR', 'UR'],
  sh: ['SH'],
  ch: ['CH'],
  th: ['TH'],
  ck: ['CK'],
  ng: ['NG'],
};

export function normalizeWord(word: string): string {
  return word.toUpperCase().replace(/[^A-Z]/g, '');
}

export function formatStreakMult(m: number): string {
  return m % 1 === 0 ? String(m) : m.toFixed(1);
}

export function clampStreak(m: number): StreakMultiplier {
  const rounded = Math.round(m * 2) / 2;
  const nearest = STREAK_STAGES.reduce((best, s) =>
    Math.abs(s - rounded) < Math.abs(best - rounded) ? s : best
  );
  return nearest;
}

export function applyStreakScore(base: number, multiplier: number): number {
  return Math.floor(base * multiplier);
}

/** Magic e: vowel + one or more consonants + E at the end (e.g. cake, ate, name). */
export function isMagicEWord(word: string, vowel: 'A' | 'I' | 'O' | 'U' | 'E'): boolean {
  const w = normalizeWord(word);
  const re = new RegExp(`${vowel}[${CONSONANT}]+E$`);
  return re.test(w);
}

/**
 * Short-vowel / CVC-ish: the only vowel letter is the target, it is closed
 * (a consonant follows), there is no vowel team, and it is not magic e.
 */
export function isShortVowelWord(word: string, vowel: 'A' | 'E' | 'I' | 'O' | 'U'): boolean {
  const w = normalizeWord(word);
  if (w.length < 2) return false;
  const vowels = [...w].filter((ch) => VOWEL.includes(ch));
  if (vowels.length === 0 || vowels.some((v) => v !== vowel)) return false;
  if (new RegExp(`[${VOWEL}]{2}`).test(w)) return false;
  if (isMagicEWord(w, vowel === 'E' ? 'E' : vowel)) return false;
  const lastVowelAt = w.lastIndexOf(vowel);
  if (lastVowelAt === -1 || lastVowelAt === w.length - 1) return false;
  return true;
}

export function isAnyShortVowelWord(word: string): boolean {
  return (['A', 'E', 'I', 'O', 'U'] as const).some((v) => isShortVowelWord(word, v));
}

export function isWordFamilyWord(word: string): boolean {
  const w = normalizeWord(word);
  if (FAMILY_SET.has(w)) return true;
  return FAMILY_ENDINGS.some((end) => w.length >= end.length && w.endsWith(end));
}

export function isBlendDigraphWord(word: string): boolean {
  const w = normalizeWord(word);
  return BLENDS_DIGRAPHS.some((pat) => w.includes(pat));
}

export function isSoundFocusWord(word: string, sound: SoundFocusId): boolean {
  const w = normalizeWord(word);
  if (w.length < 2) return false;
  if (sound.startsWith('short-')) {
    const v = sound.slice(-1).toUpperCase() as 'A' | 'E' | 'I' | 'O' | 'U';
    return isShortVowelWord(w, v);
  }
  if (sound === 'a-e') return isMagicEWord(w, 'A');
  if (sound === 'i-e') return isMagicEWord(w, 'I');
  if (sound === 'o-e') return isMagicEWord(w, 'O');
  if (sound === 'u-e') return isMagicEWord(w, 'U');
  const pats = SOUND_SUBSTRING[sound];
  if (pats) return pats.some((p) => w.includes(p));
  return SOUND_FOCUS[sound].words.includes(w);
}

export function isPresetGroupWord(word: string, preset: LetterPresetId): boolean {
  const w = normalizeWord(word);
  if (preset === 'sight') return SIGHT_SET.has(w);
  if (preset === 'cvc') return CVC_SET.has(w) || isAnyShortVowelWord(w);
  if (preset === 'families') return isWordFamilyWord(w);
  if (preset === 'blends') return isBlendDigraphWord(w);
  return false;
}

/** False on Standard (streak is off). */
export function isWordInGroup(word: string, settings: LetterDistributionSettings): boolean {
  if (isStandardLetterMix(settings)) return false;
  if (settings.sound) return isSoundFocusWord(word, settings.sound);
  return isPresetGroupWord(word, settings.preset);
}

export function streakStyle(m: number) {
  return STREAK_COLORS[clampStreak(m)];
}
