import {
  LetterDrawOptions,
  LetterWeightTable,
  KID_LETTER_WEIGHTS,
  EASY_LETTER_WEIGHTS,
  CORNELL_LETTER_WEIGHTS,
} from './letterBag';
import {
  LETTER_PRESET_IDS,
  LetterPresetId,
  PRESET_META,
  PRESET_WEIGHTS,
  SOUND_FOCUS,
  SOUND_FOCUS_IDS,
  SOUND_SEED_CHANCE,
  SoundFocusId,
  WeightMap,
  soundFocusSamples,
} from '../data/phonicsLists';
import { DifficultyChoice } from '../types/game';

export type { LetterPresetId, SoundFocusId };
export { LETTER_PRESET_IDS, SOUND_FOCUS_IDS, SOUND_FOCUS, SOUND_GROUPS, PRESET_META } from '../data/phonicsLists';

export interface LetterDistributionSettings {
  preset: LetterPresetId;
  /** Selected Sound focuses (any number). Empty = no sound focus. Kept in SOUND_FOCUS_IDS order. */
  sounds: SoundFocusId[];
}

export const DEFAULT_LETTER_DISTRIBUTION: LetterDistributionSettings = {
  preset: 'standard',
  sounds: [],
};

const STORAGE_KEY = 'word_blitz_letter_distribution_v1';

function isPreset(v: unknown): v is LetterPresetId {
  return LETTER_PRESET_IDS.includes(v as LetterPresetId);
}

function isSound(v: unknown): v is SoundFocusId {
  return SOUND_FOCUS_IDS.includes(v as SoundFocusId);
}

/** Canonical order (SOUND_FOCUS_IDS), no duplicates, unknown ids dropped. */
export function normalizeSounds(sounds: readonly unknown[]): SoundFocusId[] {
  const set = new Set(sounds.filter(isSound));
  return SOUND_FOCUS_IDS.filter((id) => set.has(id));
}

/** Reads saved settings; migrates the old single-select `{ sound: 'oo' }` shape to `{ sounds: ['oo'] }`. */
export function parseLetterDistribution(p: Record<string, unknown> | null | undefined): LetterDistributionSettings {
  if (!p || typeof p !== 'object') return { ...DEFAULT_LETTER_DISTRIBUTION, sounds: [] };
  const preset = isPreset(p.preset) ? p.preset : 'standard';
  const raw = Array.isArray(p.sounds) ? p.sounds : p.sound != null ? [p.sound] : [];
  return { preset, sounds: normalizeSounds(raw) };
}

export function loadLetterDistribution(): LetterDistributionSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LETTER_DISTRIBUTION, sounds: [] };
    return parseLetterDistribution(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return { ...DEFAULT_LETTER_DISTRIBUTION, sounds: [] };
  }
}

export function saveLetterDistribution(settings: LetterDistributionSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ preset: settings.preset, sounds: normalizeSounds(settings.sounds) }));
  } catch {
    // ignore storage errors
  }
}

/** Toggle one focus on/off (multi-select). */
export function toggleSound(settings: LetterDistributionSettings, id: SoundFocusId): LetterDistributionSettings {
  const on = settings.sounds.includes(id);
  return { ...settings, sounds: normalizeSounds(on ? settings.sounds.filter((s) => s !== id) : [...settings.sounds, id]) };
}

// ---------------------------------------------------------------------------
// Sound focus letter weights: CALCULATED from each focus's top-20 word list,
// once at module load (single source of truth; no hand-typed tables to drift).
//   1. Letter frequency across the top-20 words (percent).
//   2. Floor: 85% list frequency + 15% common letters (A E I O U 2% each,
//      T N S R D 1% each) so a board never stalls without vowels.
//   3. Cap any one letter at 30% (the old tables held pattern letters near
//      20-30%); the excess is shared by the other letters in proportion.
// ---------------------------------------------------------------------------

export const FOCUS_FLOOR_SHARE = 0.15;
const FLOOR_LETTERS: Record<string, number> = { A: 2, E: 2, I: 2, O: 2, U: 2, T: 1, N: 1, S: 1, R: 1, D: 1 };
export const FOCUS_LETTER_CAP = 30;

export type LetterPercentMap = Record<string, number>;

function normalize(map: Record<string, number>): LetterPercentMap {
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
  const out: LetterPercentMap = {};
  for (const [k, v] of Object.entries(map)) if (v > 0) out[k] = (v / total) * 100;
  return out;
}

function capLetters(map: LetterPercentMap, cap: number): LetterPercentMap {
  let out = { ...map };
  for (let pass = 0; pass < 10; pass++) {
    const over = Object.keys(out).filter((k) => out[k] > cap + 1e-9);
    if (over.length === 0) break;
    const excess = over.reduce((a, k) => a + (out[k] - cap), 0);
    const under = Object.keys(out).filter((k) => out[k] < cap - 1e-9);
    const underTotal = under.reduce((a, k) => a + out[k], 0) || 1;
    const next: LetterPercentMap = { ...out };
    for (const k of over) next[k] = cap;
    for (const k of under) next[k] = out[k] + (excess * out[k]) / underTotal;
    out = next;
  }
  return out;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Calculates one focus's letter weights (percent, sums to ~100) from a word list. */
export function computeFocusWeights(words: readonly string[]): LetterPercentMap {
  const counts: Record<string, number> = {};
  for (const w of words) for (const ch of w.toUpperCase()) if (ch >= 'A' && ch <= 'Z') counts[ch] = (counts[ch] ?? 0) + 1;
  const freq = normalize(counts);
  const mixed: Record<string, number> = {};
  for (const [k, v] of Object.entries(freq)) mixed[k] = v * (1 - FOCUS_FLOOR_SHARE);
  const floorTotal = Object.values(FLOOR_LETTERS).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(FLOOR_LETTERS)) mixed[k] = (mixed[k] ?? 0) + (v / floorTotal) * FOCUS_FLOOR_SHARE * 100;
  const capped = capLetters(normalize(mixed), FOCUS_LETTER_CAP);
  const out: LetterPercentMap = {};
  for (const k of Object.keys(capped).sort()) out[k] = round2(capped[k]);
  return out;
}

/** Every focus's calculated weights, built once when this module loads. */
export const SOUND_FOCUS_WEIGHTS: Record<SoundFocusId, LetterPercentMap> = Object.fromEntries(
  SOUND_FOCUS_IDS.map((id) => [id, computeFocusWeights(SOUND_FOCUS[id].top20)])
) as Record<SoundFocusId, LetterPercentMap>;

/**
 * Several focuses at once: average each focus's normalized distribution with
 * equal weight (a long list can't drown a short one).
 */
export function combineFocusWeights(ids: readonly SoundFocusId[]): LetterPercentMap {
  if (ids.length === 0) return {};
  const sum: Record<string, number> = {};
  for (const id of ids) for (const [k, v] of Object.entries(SOUND_FOCUS_WEIGHTS[id])) sum[k] = (sum[k] ?? 0) + v / ids.length;
  const out: LetterPercentMap = {};
  for (const k of Object.keys(sum).sort()) out[k] = round2(sum[k]);
  return out;
}

/** Seed words for the selected focuses: the union of their word lists. */
export function combinedSeedWords(ids: readonly SoundFocusId[]): string[] {
  return Array.from(new Set(ids.flatMap((id) => SOUND_FOCUS[id].words)));
}

/** Stable key for a letter mix: sorted (canonical) selection. One focus keeps its old key. */
export function letterMixKey(settings: LetterDistributionSettings): string {
  const sounds = normalizeSounds(settings.sounds);
  if (sounds.length) return `sound:${sounds.join('+')}`;
  return `preset:${settings.preset}`;
}

function weightMapToTable(map: WeightMap): LetterWeightTable {
  return Object.entries(map)
    .filter(([, w]) => typeof w === 'number' && w > 0)
    .map(([letter, weight]) => ({ letter, weight: weight as number }));
}

export function isStandardLetterMix(settings: LetterDistributionSettings): boolean {
  return settings.sounds.length === 0 && settings.preset === 'standard';
}

/** Short label for the start menu / HUD, or null when using the usual mix. */
export function getLetterMixLabel(settings: LetterDistributionSettings): string | null {
  const sounds = normalizeSounds(settings.sounds);
  if (sounds.length) {
    // One focus keeps the old label ("Sound focus · oo") so existing records stay grouped.
    return `Sound focus · ${sounds.map((id) => SOUND_FOCUS[id].label).join(' + ')}`;
  }
  if (settings.preset !== 'standard') {
    return PRESET_META[settings.preset].label;
  }
  return null;
}

/** Copy for the arena ground-strip reminder (null on Standard). */
export interface GroundLetterHint {
  kind: 'sound' | 'preset';
  title: string;
  pattern?: string;
  shortLabel: string;
  samples?: string[];
}

export function getGroundLetterHint(settings: LetterDistributionSettings): GroundLetterHint | null {
  if (isStandardLetterMix(settings)) return null;
  const sounds = normalizeSounds(settings.sounds);
  if (sounds.length) {
    const pattern = sounds.map((id) => SOUND_FOCUS[id].label).join(' + ');
    const samples =
      sounds.length === 1
        ? soundFocusSamples(sounds[0]).slice(0, 2)
        : sounds.slice(0, 2).map((id) => soundFocusSamples(id)[0]);
    return {
      kind: 'sound',
      title: 'Sound focus',
      pattern,
      shortLabel: sounds.length === 1 ? `${pattern} words` : `${sounds.length} sounds`,
      samples: [...samples],
    };
  }
  const title = PRESET_META[settings.preset].label;
  return {
    kind: 'preset',
    title,
    shortLabel: title,
  };
}

export function streakLimitFor(difficulty: DifficultyChoice): number {
  if (difficulty === 'beginner') return 3;
  if (difficulty === 'easy') return 5;
  return 0;
}

export function resolveLetterDraw(
  difficulty: DifficultyChoice,
  settings: LetterDistributionSettings,
): LetterDrawOptions {
  const streakLimit = streakLimitFor(difficulty);

  const sounds = normalizeSounds(settings.sounds);
  if (sounds.length) {
    return {
      table: weightMapToTable(combineFocusWeights(sounds)),
      streakLimit,
      seedWords: combinedSeedWords(sounds),
      seedChance: SOUND_SEED_CHANCE,
    };
  }

  if (settings.preset === 'sight' || settings.preset === 'cvc' || settings.preset === 'families' || settings.preset === 'blends') {
    return {
      table: weightMapToTable(PRESET_WEIGHTS[settings.preset]),
      streakLimit,
    };
  }

  // Standard: current behaviour by difficulty
  if (difficulty === 'beginner') {
    return { table: KID_LETTER_WEIGHTS, streakLimit };
  }
  if (difficulty === 'easy') {
    return { table: EASY_LETTER_WEIGHTS, streakLimit };
  }
  return { table: CORNELL_LETTER_WEIGHTS, streakLimit };
}
