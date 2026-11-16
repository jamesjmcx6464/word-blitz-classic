import { DifficultyChoice, LeaderboardMode } from '../types/game';

export interface HighScoreEntry {
  id: string;
  mode: LeaderboardMode;
  timeBucket: string; // e.g. 'time:60', 'time:30', 'time:120', 'time:0', 'words:3'
  timeSeconds?: number;
  difficulty?: DifficultyChoice; // 'custom' = played with the player's saved Settings
  playerName?: string;
  playerLogo?: string;
  score: number;
  longestWord: string;
  totalWords: number;
  date: string;
  timestamp: number;
  /** Words made this game (saved from Nov 2026 on). */
  words?: { word: string; score: number }[];
  /** Letter mix label at the time, e.g. 'Standard', 'Sound focus · oo'. */
  letterMix?: string;
}

const STORAGE_KEY = 'word_blitz_high_scores_v1';

const MAX_ENTRIES_PER_BUCKET = 30;

export function makeTimeBucketKey(kind: 'timer' | 'words', value: number): string {
  const safeVal = Number.isFinite(value) && value >= 0 ? Math.round(value) : 60;
  return kind === 'words' ? `words:${safeVal}` : `time:${safeVal}`;
}

export function formatTimeBucketLabel(timeBucket: string): string {
  if (timeBucket.startsWith('words:')) {
    const count = Number(timeBucket.slice('words:'.length));
    if (count === 1) return '1 Word Goal';
    return `${count} Words Goal`;
  }
  if (timeBucket.startsWith('time:')) {
    const sec = Number(timeBucket.slice('time:'.length));
    if (!Number.isFinite(sec) || sec <= 0) return 'No timer';
    if (sec === 60) return '1 min';
    if (sec < 60 || sec % 60 !== 0) return `${sec}s`;
    const mins = sec / 60;
    return `${mins} min`;
  }
  return '1 min';
}

export function sortTimeBuckets(buckets: string[]): string[] {
  return [...buckets].sort((a, b) => {
    const aIsWords = a.startsWith('words:');
    const bIsWords = b.startsWith('words:');
    if (aIsWords !== bIsWords) return aIsWords ? 1 : -1;

    if (aIsWords && bIsWords) {
      return Number(a.slice(6)) - Number(b.slice(6));
    }

    const aSec = Number(a.slice(5));
    const bSec = Number(b.slice(5));
    // Put 'No Timer' (0) after timed buckets
    if (aSec === 0 && bSec !== 0) return 1;
    if (bSec === 0 && aSec !== 0) return -1;
    return aSec - bSec;
  });
}

function isValidMode(val: unknown): val is LeaderboardMode {
  return val === 'quick' || val === 'solo' || val === 'team';
}

function migrateEntry(raw: Record<string, unknown>): {
  entry: HighScoreEntry;
  didMigrate: boolean;
} {
  let didMigrate = false;

  // Scores saved by the retired word list feature carry a list name; they now join the
  // normal board for their mode and timer, and the stored copy is rewritten without it.
  if ('wordList' in raw) {
    didMigrate = true;
  }

  const rawMode = raw.mode;
  const rawTimeBucket = typeof raw.timeBucket === 'string' && raw.timeBucket.length > 0 ? raw.timeBucket : undefined;
  const rawTimeSeconds =
    typeof raw.timeSeconds === 'number'
      ? raw.timeSeconds
      : typeof raw.timeLimit === 'number'
      ? raw.timeLimit
      : undefined;

  const playerName =
    typeof raw.playerName === 'string' && raw.playerName.trim().length > 0
      ? raw.playerName.trim()
      : undefined;
  const playerLogo =
    typeof raw.playerLogo === 'string' && raw.playerLogo.length > 0
      ? raw.playerLogo
      : undefined;

  let mode: LeaderboardMode;
  let timeBucket: string;
  let timeSeconds: number | undefined = rawTimeSeconds;

  if (isValidMode(rawMode)) {
    mode = rawMode;
  } else if (playerName && playerLogo) {
    // Legacy named student score from Solo Play
    mode = 'solo';
    didMigrate = true;
  } else {
    // Unknown mode falls back to Quick Play
    mode = 'quick';
    didMigrate = true;
  }

  if (rawTimeBucket && (rawTimeBucket.startsWith('time:') || rawTimeBucket.startsWith('words:'))) {
    timeBucket = rawTimeBucket;
    if (rawTimeBucket.startsWith('time:') && timeSeconds === undefined) {
      timeSeconds = Number(rawTimeBucket.slice('time:'.length));
    }
  } else if (typeof rawTimeSeconds === 'number' && Number.isFinite(rawTimeSeconds)) {
    timeBucket = makeTimeBucketKey('timer', rawTimeSeconds);
    didMigrate = true;
  } else {
    // Unknown time: default Quick Play / Solo bucket is 1 min (60s), put under Quick Play if mode was also unknown
    if (!isValidMode(rawMode) && !(playerName && playerLogo)) {
      mode = 'quick';
    }
    timeBucket = 'time:60';
    timeSeconds = 60;
    didMigrate = true;
  }

  const entry: HighScoreEntry = {
    id:
      typeof raw.id === 'string' && raw.id.length > 0
        ? raw.id
        : 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    mode,
    timeBucket,
    timeSeconds,
    difficulty:
      raw.difficulty === 'beginner' ||
      raw.difficulty === 'easy' ||
      raw.difficulty === 'normal' ||
      raw.difficulty === 'hard' ||
      raw.difficulty === 'nightmare' ||
      raw.difficulty === 'custom'
        ? raw.difficulty
        : undefined,
    playerName,
    playerLogo,
    words: Array.isArray(raw.words)
      ? (raw.words as unknown[])
          .filter((w): w is { word: string; score: number } =>
            !!w && typeof (w as { word?: unknown }).word === 'string'
          )
          .map((w) => ({ word: w.word, score: typeof w.score === 'number' ? w.score : 0 }))
      : undefined,
    letterMix: typeof raw.letterMix === 'string' && raw.letterMix ? raw.letterMix : undefined,
    score: typeof raw.score === 'number' ? raw.score : 0,
    longestWord: typeof raw.longestWord === 'string' && raw.longestWord ? raw.longestWord : '-',
    totalWords: typeof raw.totalWords === 'number' ? raw.totalWords : 0,
    date:
      typeof raw.date === 'string' && raw.date
        ? raw.date
        : new Date().toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
    timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
  };

  return { entry, didMigrate };
}

function capBuckets(entries: HighScoreEntry[]): HighScoreEntry[] {
  const byBucket = new Map<string, HighScoreEntry[]>();
  for (const e of entries) {
    const key = `${e.mode}::${e.timeBucket}`;
    const arr = byBucket.get(key) || [];
    arr.push(e);
    byBucket.set(key, arr);
  }
  const result: HighScoreEntry[] = [];
  for (const arr of byBucket.values()) {
    arr.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
    result.push(...arr.slice(0, MAX_ENTRIES_PER_BUCKET));
  }
  result.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
  return result;
}


/**
 * One-time: scores earned on the old constant-speed Hard (now Nightmare) are
 * moved to the nightmare bucket. Old nightmare scores are kept. After this flag
 * is set, new Hard scores (time-ramp) stay under 'hard'.
 */
const HARD_RELABEL_KEY = 'word_blitz_hard_scores_moved_to_nightmare_v1';

function relabelLegacyHardScores(entries: HighScoreEntry[]): {
  entries: HighScoreEntry[];
  changed: boolean;
} {
  try {
    if (localStorage.getItem(HARD_RELABEL_KEY) === '1') {
      return { entries, changed: false };
    }
    let changed = false;
    const next = entries.map((e) => {
      if (e.difficulty === 'hard') {
        changed = true;
        return { ...e, difficulty: 'nightmare' as const };
      }
      return e;
    });
    localStorage.setItem(HARD_RELABEL_KEY, '1');
    return { entries: next, changed };
  } catch {
    return { entries, changed: false };
  }
}

export function getHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    let anyMigrated = false;
    const migrated: HighScoreEntry[] = [];
    for (const item of parsed) {
      if (item && typeof item === 'object') {
        const { entry, didMigrate } = migrateEntry(item as Record<string, unknown>);
        if (didMigrate) anyMigrated = true;
        migrated.push(entry);
      }
    }

    const relabeled = relabelLegacyHardScores(migrated);
    if (relabeled.changed) anyMigrated = true;
    const capped = capBuckets(relabeled.entries);
    if (anyMigrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
      } catch {
        // ignore write errors during migration
      }
    }
    return capped;
  } catch (err) {
    console.error('Failed to read high scores:', err);
  }
  return [];
}

/**
 * Returns a mapping of logo emoji -> Solo player name who claimed it from leaderboard entries.
 * Only inspects Solo Play scores so Team Play emojis never lock Solo student logos.
 */
export function getClaimedSoloScoreLogos(): Map<string, string> {
  const scores = getHighScores();
  const claimed = new Map<string, string>();
  for (const entry of scores) {
    if (entry.mode === 'solo' && entry.playerLogo && !claimed.has(entry.playerLogo)) {
      claimed.set(entry.playerLogo, entry.playerName || 'Student');
    }
  }
  return claimed;
}

export interface SaveHighScoreParams {
  mode: LeaderboardMode;
  timeBucket: string;
  timeSeconds?: number;
  difficulty?: DifficultyChoice; // 'custom' = played with the player's saved Settings
  score: number;
  longestWord: string;
  totalWords: number;
  playerName?: string;
  playerLogo?: string;
  allowZeroScore?: boolean;
  words?: { word: string; score: number }[];
  letterMix?: string;
}

export function saveHighScore(
  params: SaveHighScoreParams
): { isNewHighScore: boolean; rank: number; entryId?: string } {
  const {
    mode,
    timeBucket,
    timeSeconds,
    difficulty,
    score,
    longestWord,
    totalWords,
    playerName,
    playerLogo,
    allowZeroScore = false,
    words,
    letterMix,
  } = params;

  const hasPlayer = Boolean(playerName?.trim());
  if (score <= 0 && !hasPlayer && !allowZeroScore) {
    return { isNewHighScore: false, rank: -1 };
  }

  const scores = getHighScores();
  const entry: HighScoreEntry = {
    id: 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    mode,
    timeBucket,
    timeSeconds,
    difficulty,
    playerName: playerName?.trim() || undefined,
    playerLogo: playerLogo || undefined,
    score,
    longestWord: longestWord || '-',
    totalWords,
    words: words && words.length > 0 ? words : [],
    letterMix,
    date: new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timestamp: Date.now(),
  };

  scores.push(entry);
  const capped = capBuckets(scores);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch (err) {
    console.error('Failed to save high scores:', err);
  }

  // Compute rank strictly within this (mode, timeBucket) bucket
  const bucketScores = capped
    .filter((s) => s.mode === mode && s.timeBucket === timeBucket)
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);

  const rank = bucketScores.findIndex((s) => s.id === entry.id);
  const isNewHighScore = rank === 0 && score > 0;

  return { isNewHighScore, rank: rank !== -1 ? rank + 1 : -1, entryId: entry.id };
}

export function clearHighScores() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Removes every score for one mode (all timers). Returns the remaining scores.
 */
export function clearHighScoresForMode(mode: LeaderboardMode): HighScoreEntry[] {
  const remaining = getHighScores().filter((s) => s.mode !== mode);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.error('Failed to clear leaderboard mode:', err);
  }
  return remaining;
}
