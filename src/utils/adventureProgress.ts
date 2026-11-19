import {
  ADVENTURE_PROGRESS_KEY,
  AdventureLevelId,
  SPARK_LEVELS,
} from './adventureConfig';

export interface AdventureCharacterProgress {
  playerKey: string;
  name: string;
  logo: string;
  passedLevels: AdventureLevelId[];
  bossPassed: boolean;
  updatedAt: number;
}

type Store = Record<string, AdventureCharacterProgress>;

function playerKey(name: string, logo: string): string {
  return `${name.trim().toLowerCase()}::${logo}`;
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(ADVENTURE_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  try {
    localStorage.setItem(ADVENTURE_PROGRESS_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save adventure progress:', err);
  }
}

export function getAdventureProgress(
  name: string,
  logo: string
): AdventureCharacterProgress {
  const key = playerKey(name, logo);
  const store = readStore();
  const existing = store[key];
  if (existing) return existing;
  return {
    playerKey: key,
    name,
    logo,
    passedLevels: [],
    bossPassed: false,
    updatedAt: Date.now(),
  };
}

export function markLevelPassed(
  name: string,
  logo: string,
  levelId: AdventureLevelId
): AdventureCharacterProgress {
  const key = playerKey(name, logo);
  const store = readStore();
  const current = store[key] ?? {
    playerKey: key,
    name,
    logo,
    passedLevels: [],
    bossPassed: false,
    updatedAt: Date.now(),
  };
  const passed = new Set(current.passedLevels);
  if (levelId === 'boss') {
    current.bossPassed = true;
  } else {
    passed.add(levelId);
  }
  const vowelIds = SPARK_LEVELS.filter((l) => l.kind === 'vowel').map((l) => l.id);
  const allVowels = vowelIds.every((id) => passed.has(id));
  const next: AdventureCharacterProgress = {
    ...current,
    name,
    logo,
    passedLevels: Array.from(passed) as AdventureLevelId[],
    bossPassed: levelId === 'boss' ? true : current.bossPassed,
    updatedAt: Date.now(),
  };
  // Boss unlock is derived from passedLevels; keep bossPassed sticky once true.
  void allVowels;
  store[key] = next;
  writeStore(store);
  return next;
}

export function isBossUnlocked(progress: AdventureCharacterProgress): boolean {
  const vowelIds = SPARK_LEVELS.filter((l) => l.kind === 'vowel').map((l) => l.id);
  return vowelIds.every((id) => progress.passedLevels.includes(id));
}

export function isLevelPassed(
  progress: AdventureCharacterProgress,
  levelId: AdventureLevelId
): boolean {
  if (levelId === 'boss') return progress.bossPassed;
  return progress.passedLevels.includes(levelId);
}
