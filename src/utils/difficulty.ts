import {
  DifficultyChoice,
  DifficultyConfig,
  DifficultyLevel,
  DIFFICULTY_PRESETS,
} from '../types/game';
import { CustomGameSettings, buildCustomConfig, loadCustomSettings } from './customSettings';

const DIFFICULTY_STORAGE_KEY = 'word_blitz_difficulty_v1';

const VALID_DIFFICULTIES: DifficultyLevel[] = ['beginner', 'easy', 'normal', 'hard', 'nightmare'];

export function getSavedDifficulty(): DifficultyChoice {
  try {
    const raw = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    if (raw === 'custom' && loadCustomSettings()) return 'custom';
    if (raw && VALID_DIFFICULTIES.includes(raw as DifficultyLevel)) {
      return raw as DifficultyLevel;
    }
  } catch {
    // ignore storage errors
  }
  return 'normal';
}

export function saveDifficulty(level: DifficultyChoice): void {
  try {
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, level);
  } catch {
    // ignore storage errors
  }
}

/** Config for a difficulty choice. 'custom' without saved settings falls back to Normal. */
export function getDifficultyConfig(
  choice: DifficultyChoice,
  custom: CustomGameSettings | null
): DifficultyConfig {
  if (choice === 'custom') {
    return custom ? buildCustomConfig(custom) : DIFFICULTY_PRESETS.normal;
  }
  return DIFFICULTY_PRESETS[choice] ?? DIFFICULTY_PRESETS.normal;
}
