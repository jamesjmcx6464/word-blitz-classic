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
  SoundFocusId,
  WeightMap,
} from '../data/phonicsLists';
import { DifficultyChoice } from '../types/game';

export type { LetterPresetId, SoundFocusId };
export { LETTER_PRESET_IDS, SOUND_FOCUS_IDS, SOUND_FOCUS, SOUND_GROUPS, PRESET_META } from '../data/phonicsLists';

export interface LetterDistributionSettings {
  preset: LetterPresetId;
  sound: SoundFocusId | null;
}

export const DEFAULT_LETTER_DISTRIBUTION: LetterDistributionSettings = {
  preset: 'standard',
  sound: null,
};

const STORAGE_KEY = 'word_blitz_letter_distribution_v1';

function isPreset(v: unknown): v is LetterPresetId {
  return LETTER_PRESET_IDS.includes(v as LetterPresetId);
}

function isSound(v: unknown): v is SoundFocusId {
  return SOUND_FOCUS_IDS.includes(v as SoundFocusId);
}

export function loadLetterDistribution(): LetterDistributionSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LETTER_DISTRIBUTION };
    const p = JSON.parse(raw) as Record<string, unknown>;
    const preset = isPreset(p.preset) ? p.preset : 'standard';
    const sound = p.sound === null || p.sound === undefined ? null : isSound(p.sound) ? p.sound : null;
    return { preset, sound };
  } catch {
    return { ...DEFAULT_LETTER_DISTRIBUTION };
  }
}

export function saveLetterDistribution(settings: LetterDistributionSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

function weightMapToTable(map: WeightMap): LetterWeightTable {
  return Object.entries(map)
    .filter(([, w]) => typeof w === 'number' && w > 0)
    .map(([letter, weight]) => ({ letter, weight: weight as number }));
}

export function isStandardLetterMix(settings: LetterDistributionSettings): boolean {
  return settings.sound === null && settings.preset === 'standard';
}

/** Short label for the start menu / HUD, or null when using the usual mix. */
export function getLetterMixLabel(settings: LetterDistributionSettings): string | null {
  if (settings.sound) {
    return `Sound focus · ${SOUND_FOCUS[settings.sound].label}`;
  }
  if (settings.preset !== 'standard') {
    return PRESET_META[settings.preset].label;
  }
  return null;
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

  if (settings.sound) {
    const def = SOUND_FOCUS[settings.sound];
    return {
      table: weightMapToTable(def.weights),
      streakLimit,
      seedWords: def.words,
      seedChance: def.seedChance,
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
