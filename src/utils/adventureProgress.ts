import {
  ADVENTURE_BANDS,
  ADVENTURE_PROGRESS_KEY,
  AdventureBandDef,
  AdventureBandId,
  AdventureLevelId,
  SPARK_LEVELS,
} from './adventureConfig';

/** Later bands store their bonus bests here so the total score helper stays band-agnostic. */
export interface AdventureBandScore {
  bonusBest?: Record<string, number>;
  bossPassed?: boolean;
}

export interface AdventureCharacterProgress {
  playerKey: string;
  name: string;
  logo: string;
  passedLevels: AdventureLevelId[];
  bossPassed: boolean;
  /** Best Word Blitz bonus score per Spark level (vowel levels + boss). */
  bonusBest?: Partial<Record<AdventureLevelId, number>>;
  /**
   * Per-band bonus scores for future adventures (Flame, Blaze, Nova).
   * Spark keeps using top-level bonusBest / bossPassed for backward compatibility.
   */
  bands?: Partial<Record<string, AdventureBandScore>>;
  /** Completion stickers, keyed by band id (e.g. spark). */
  stickers?: Partial<Record<string, boolean>>;
  updatedAt: number;
}

type Store = Record<string, AdventureCharacterProgress>;

function playerKey(name: string, logo: string): string {
  return `${name.trim().toLowerCase()}::${logo}`;
}

function sumFinite(values: Iterable<unknown>): number {
  let sum = 0;
  for (const v of values) {
    if (typeof v === 'number' && Number.isFinite(v)) sum += v;
  }
  return sum;
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

function emptyProgress(name: string, logo: string): AdventureCharacterProgress {
  return {
    playerKey: playerKey(name, logo),
    name,
    logo,
    passedLevels: [],
    bossPassed: false,
    updatedAt: Date.now(),
  };
}

/** Derive Spark-complete from bossPassed so older saves still show the sticker. */
function withDerivedStickers(progress: AdventureCharacterProgress): AdventureCharacterProgress {
  if (progress.bossPassed && !progress.stickers?.spark) {
    return { ...progress, stickers: { ...progress.stickers, spark: true } };
  }
  return progress;
}

export function getAdventureProgress(
  name: string,
  logo: string
): AdventureCharacterProgress {
  const key = playerKey(name, logo);
  const store = readStore();
  const existing = store[key];
  if (existing) return withDerivedStickers(existing);
  return emptyProgress(name, logo);
}

export function markLevelPassed(
  name: string,
  logo: string,
  levelId: AdventureLevelId
): { progress: AdventureCharacterProgress; stickerJustEarned?: AdventureBandId } {
  const key = playerKey(name, logo);
  const store = readStore();
  const current = store[key] ?? emptyProgress(name, logo);
  const hadSparkSticker = !!(current.stickers?.spark || current.bossPassed);
  const passed = new Set(current.passedLevels);
  if (levelId !== 'boss') passed.add(levelId);
  const bossPassed = levelId === 'boss' ? true : current.bossPassed;
  const stickerJustEarned: AdventureBandId | undefined =
    levelId === 'boss' && !hadSparkSticker ? 'spark' : undefined;
  const next: AdventureCharacterProgress = {
    ...current,
    name,
    logo,
    passedLevels: Array.from(passed) as AdventureLevelId[],
    bossPassed,
    stickers: {
      ...current.stickers,
      ...(bossPassed ? { spark: true } : {}),
    },
    updatedAt: Date.now(),
  };
  store[key] = next;
  writeStore(store);
  return { progress: next, stickerJustEarned };
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

/** A level's bonus Blitz unlocks once that level (or the Boss) is beaten. */
export function isBonusUnlocked(
  progress: AdventureCharacterProgress,
  levelId: AdventureLevelId
): boolean {
  return isLevelPassed(progress, levelId);
}

export function getBonusBest(
  progress: AdventureCharacterProgress,
  levelId: AdventureLevelId
): number | null {
  const v = progress.bonusBest?.[levelId];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Spark Adventure score = sum of best bonus scores (5 level blitzes + boss blitz). */
export function getSparkScore(progress: AdventureCharacterProgress): number {
  return SPARK_LEVELS.reduce((sum, l) => sum + (getBonusBest(progress, l.id) ?? 0), 0);
}

/** Score for one adventure band. Spark uses top-level bonusBest; later bands use progress.bands. */
export function getBandScore(progress: AdventureCharacterProgress, bandId: string): number {
  if (bandId === 'spark') return getSparkScore(progress);
  const bests = progress.bands?.[bandId]?.bonusBest;
  return bests ? sumFinite(Object.values(bests)) : 0;
}

/**
 * Total adventure score: sum of every band's score.
 * Known bands plus any extra keys in saved `bands` so future adventures count automatically.
 */
export function getTotalAdventureScore(progress: AdventureCharacterProgress): number {
  const ids = new Set<string>(ADVENTURE_BANDS.map((b) => b.id));
  for (const id of Object.keys(progress.bands ?? {})) ids.add(id);
  let sum = 0;
  for (const id of ids) sum += getBandScore(progress, id);
  return sum;
}

export function hasSticker(progress: AdventureCharacterProgress, bandId: string): boolean {
  if (progress.stickers?.[bandId]) return true;
  if (bandId === 'spark' && progress.bossPassed) return true;
  if (progress.bands?.[bandId]?.bossPassed) return true;
  return false;
}

/** Earned completion stickers, including known bands and any extra keys stored on the character. */
export function getEarnedStickers(progress: AdventureCharacterProgress): AdventureBandDef[] {
  const known = new Map(ADVENTURE_BANDS.map((b) => [b.id, b]));
  const ids = new Set<string>(ADVENTURE_BANDS.map((b) => b.id));
  for (const id of Object.keys(progress.stickers ?? {})) ids.add(id);
  for (const id of Object.keys(progress.bands ?? {})) ids.add(id);
  const earned: AdventureBandDef[] = [];
  for (const id of ids) {
    if (!hasSticker(progress, id)) continue;
    earned.push(known.get(id as AdventureBandId) ?? { id: id as AdventureBandId, title: id, stickerEmoji: '⭐' });
  }
  return earned;
}

/** Save a bonus Blitz score; keeps the best per level per character. */
export function recordBonusScore(
  name: string,
  logo: string,
  levelId: AdventureLevelId,
  score: number
): { progress: AdventureCharacterProgress; best: number; isNewBest: boolean; previousBest: number | null } {
  const key = playerKey(name, logo);
  const store = readStore();
  const current = store[key] ?? getAdventureProgress(name, logo);
  const previousBest = getBonusBest(current, levelId);
  const isNewBest = previousBest === null || score > previousBest;
  const best = isNewBest ? score : (previousBest as number);
  const next: AdventureCharacterProgress = {
    ...withDerivedStickers(current),
    playerKey: key,
    name,
    logo,
    bonusBest: { ...(current.bonusBest ?? {}), [levelId]: best },
    updatedAt: Date.now(),
  };
  store[key] = next;
  writeStore(store);
  return { progress: next, best, isNewBest, previousBest };
}
