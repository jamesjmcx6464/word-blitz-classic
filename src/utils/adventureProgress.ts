import {
  ADVENTURE_BANDS,
  ADVENTURE_PROGRESS_KEY,
  AdventureBandDef,
  AdventureBandId,
  AdventureLevelDef,
  AdventureLevelId,
  SPARK_LEVELS,
  levelsForBand,
} from './adventureConfig';

/** Later bands store their bonus bests here so the total score helper stays band-agnostic. */
export interface AdventureBandScore {
  /** Beaten lesson levels (Boss tracked by bossPassed). */
  passedLevels?: string[];
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
  /** Words spelled correctly in each level (keyed by level id), used first by that level's bonus Blitz. */
  practiced?: Partial<Record<string, string[]>>;
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

/** Spark lives at the top level of the save (older saves); every other band under bands[id]. */
function bandState(progress: AdventureCharacterProgress, bandId: AdventureBandId): AdventureBandScore {
  if (bandId === 'spark') {
    return {
      passedLevels: progress.passedLevels,
      bonusBest: progress.bonusBest as Record<string, number> | undefined,
      bossPassed: progress.bossPassed,
    };
  }
  return progress.bands?.[bandId] ?? {};
}

function withBandState(
  progress: AdventureCharacterProgress,
  bandId: AdventureBandId,
  state: AdventureBandScore
): AdventureCharacterProgress {
  if (bandId === 'spark') {
    return {
      ...progress,
      passedLevels: (state.passedLevels ?? []) as AdventureLevelId[],
      bossPassed: !!state.bossPassed,
      bonusBest: state.bonusBest as Partial<Record<AdventureLevelId, number>> | undefined,
    };
  }
  return { ...progress, bands: { ...(progress.bands ?? {}), [bandId]: state } };
}

export function markLevelPassed(
  name: string,
  logo: string,
  level: AdventureLevelDef
): { progress: AdventureCharacterProgress; stickerJustEarned?: AdventureBandId } {
  const key = playerKey(name, logo);
  const store = readStore();
  const current = store[key] ?? emptyProgress(name, logo);
  const bandId = level.band;
  const state = bandState(current, bandId);
  const hadSticker = hasSticker(current, bandId);
  const passed = new Set(state.passedLevels ?? []);
  if (level.kind !== 'boss') passed.add(level.id);
  const bossPassed = level.kind === 'boss' ? true : !!state.bossPassed;
  const stickerJustEarned: AdventureBandId | undefined =
    level.kind === 'boss' && !hadSticker ? bandId : undefined;
  const updated = withBandState(current, bandId, {
    ...state,
    passedLevels: Array.from(passed),
    bossPassed,
  });
  const next: AdventureCharacterProgress = {
    ...updated,
    name,
    logo,
    stickers: {
      ...current.stickers,
      ...(bossPassed ? { [bandId]: true } : {}),
    },
    updatedAt: Date.now(),
  };
  store[key] = next;
  writeStore(store);
  return { progress: next, stickerJustEarned };
}

export function isBossUnlocked(progress: AdventureCharacterProgress, bandId: AdventureBandId = 'spark'): boolean {
  const passed = bandState(progress, bandId).passedLevels ?? [];
  return levelsForBand(bandId)
    .filter((l) => l.kind !== 'boss')
    .every((l) => passed.includes(l.id));
}

export function isBandBossPassed(progress: AdventureCharacterProgress, bandId: AdventureBandId): boolean {
  return !!bandState(progress, bandId).bossPassed;
}

export function isLevelPassed(progress: AdventureCharacterProgress, level: AdventureLevelDef): boolean {
  const state = bandState(progress, level.band);
  if (level.kind === 'boss') return !!state.bossPassed;
  return (state.passedLevels ?? []).includes(level.id);
}

/** A level's bonus Blitz unlocks once that level (or the Boss) is beaten. */
export function isBonusUnlocked(progress: AdventureCharacterProgress, level: AdventureLevelDef): boolean {
  return isLevelPassed(progress, level);
}

export function getBonusBest(progress: AdventureCharacterProgress, level: AdventureLevelDef): number | null {
  const v = bandState(progress, level.band).bonusBest?.[level.id];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Spark Adventure score = sum of best bonus scores (5 level blitzes + boss blitz). */
export function getSparkScore(progress: AdventureCharacterProgress): number {
  return SPARK_LEVELS.reduce((sum, l) => sum + (getBonusBest(progress, l) ?? 0), 0);
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
export type AdventureStickerDef = Pick<AdventureBandDef, 'id' | 'title' | 'stickerEmoji'>;

export function getEarnedStickers(progress: AdventureCharacterProgress): AdventureStickerDef[] {
  const known = new Map(ADVENTURE_BANDS.map((b) => [b.id, b]));
  const ids = new Set<string>(ADVENTURE_BANDS.map((b) => b.id));
  for (const id of Object.keys(progress.stickers ?? {})) ids.add(id);
  for (const id of Object.keys(progress.bands ?? {})) ids.add(id);
  const earned: AdventureStickerDef[] = [];
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
  level: AdventureLevelDef,
  score: number
): { progress: AdventureCharacterProgress; best: number; isNewBest: boolean; previousBest: number | null } {
  const key = playerKey(name, logo);
  const store = readStore();
  const current = withDerivedStickers(store[key] ?? getAdventureProgress(name, logo));
  const previousBest = getBonusBest(current, level);
  const isNewBest = previousBest === null || score > previousBest;
  const best = isNewBest ? score : (previousBest as number);
  const state = bandState(current, level.band);
  const next: AdventureCharacterProgress = {
    ...withBandState(current, level.band, {
      ...state,
      bonusBest: { ...(state.bonusBest ?? {}), [level.id]: best },
    }),
    playerKey: key,
    name,
    logo,
    updatedAt: Date.now(),
  };
  store[key] = next;
  writeStore(store);
  return { progress: next, best, isNewBest, previousBest };
}

const LAST_BAND_KEY = 'word_blitz_adventure_band_v1';

/** Which adventure map was open last (so returning from a bonus Blitz lands on the same map). */
export function getLastAdventureBand(): AdventureBandId {
  try {
    const v = localStorage.getItem(LAST_BAND_KEY);
    if (v && ADVENTURE_BANDS.some((b) => b.id === v)) return v as AdventureBandId;
  } catch {
    /* ignore */
  }
  return 'spark';
}

export function setLastAdventureBand(id: AdventureBandId): void {
  try {
    localStorage.setItem(LAST_BAND_KEY, id);
  } catch {
    /* ignore */
  }
}

const RETURN_TO_MAP_KEY = 'word_blitz_adventure_return_to_map';

/** Set when a bonus Blitz starts so finishing it lands back on that map, not Adventure Home. */
export function markReturnToMap(): void {
  try {
    sessionStorage.setItem(RETURN_TO_MAP_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumeReturnToMap(): boolean {
  try {
    const v = sessionStorage.getItem(RETURN_TO_MAP_KEY) === '1';
    sessionStorage.removeItem(RETURN_TO_MAP_KEY);
    return v;
  } catch {
    return false;
  }
}

/** Remember a word the player spelled correctly in a level (feeds that level's bonus Blitz). */
export function recordPracticedWord(name: string, logo: string, level: AdventureLevelDef, word: string): void {
  const key = playerKey(name, logo);
  const store = readStore();
  const current = store[key] ?? emptyProgress(name, logo);
  const list = current.practiced?.[level.id] ?? [];
  const w = word.trim().toLowerCase();
  if (list.includes(w)) return;
  store[key] = {
    ...current,
    practiced: { ...(current.practiced ?? {}), [level.id]: [...list, w] },
    updatedAt: Date.now(),
  };
  writeStore(store);
}

/** Words practiced in a level. A Boss Blitz also counts words practiced in that band's levels. */
export function getPracticedWords(progress: AdventureCharacterProgress, level: AdventureLevelDef): string[] {
  const ids = level.kind === 'boss' ? levelsForBand(level.band).map((l) => l.id) : [level.id];
  return Array.from(new Set(ids.flatMap((id) => progress.practiced?.[id] ?? [])));
}
