import { DifficultyLevel } from '../types/game';

const DIFFICULTY_STORAGE_KEY = 'word_blitz_difficulty_v1';

const VALID_DIFFICULTIES: DifficultyLevel[] = ['easy', 'normal', 'hard', 'nightmare'];

export function getSavedDifficulty(): DifficultyLevel {
  try {
    const raw = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    if (raw && VALID_DIFFICULTIES.includes(raw as DifficultyLevel)) {
      return raw as DifficultyLevel;
    }
  } catch {
    // ignore storage errors
  }
  return 'normal';
}

export function saveDifficulty(level: DifficultyLevel): void {
  try {
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, level);
  } catch {
    // ignore storage errors
  }
}
