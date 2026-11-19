/** Adventure Mode tuning knobs (Spark MVP). */

export const ADVENTURE_PASS_THRESHOLD = 1; // 1 = 100% correct Enters required to pass a vowel level

export const ADVENTURE_WORDS_PER_ROUND = 4;
export const ADVENTURE_ROUNDS_PER_LEVEL = 3;
export const ADVENTURE_WORDS_PER_LEVEL =
  ADVENTURE_WORDS_PER_ROUND * ADVENTURE_ROUNDS_PER_LEVEL; // 12

export const ADVENTURE_BOSS_MAX_MISSES = 3;

export type AdventureLevelId =
  | 'short-a'
  | 'short-o'
  | 'short-u'
  | 'short-i'
  | 'short-e'
  | 'boss';

export interface AdventureLevelDef {
  id: AdventureLevelId;
  title: string;
  subtitle: string;
  soundGroup: string | null; // null = Boss (all Spark)
  emoji: string;
  kind: 'vowel' | 'boss';
}

export const SPARK_LEVELS: AdventureLevelDef[] = [
  { id: 'short-a', title: 'Short A', subtitle: 'cat · hat · map', soundGroup: 'Short A', emoji: '🅰️', kind: 'vowel' },
  { id: 'short-o', title: 'Short O', subtitle: 'dog · top · fox', soundGroup: 'Short O', emoji: '🅾️', kind: 'vowel' },
  { id: 'short-u', title: 'Short U', subtitle: 'bug · sun · cup', soundGroup: 'Short U', emoji: '🇺', kind: 'vowel' },
  { id: 'short-i', title: 'Short I', subtitle: 'pig · pin · six', soundGroup: 'Short I', emoji: 'ℹ️', kind: 'vowel' },
  { id: 'short-e', title: 'Short E', subtitle: 'pen · bed · web', soundGroup: 'Short E', emoji: '🇪', kind: 'vowel' },
  { id: 'boss', title: 'Spark Boss', subtitle: 'All short vowels', soundGroup: null, emoji: '⚡', kind: 'boss' },
];

export const ADVENTURE_PROGRESS_KEY = 'word_blitz_adventure_progress_v1';

/** Word Blitz bonus games (arcade game tuned to a level's words). */
export const BONUS_LEVEL_SECONDS = 30;
export const BONUS_BOSS_SECONDS = 60;
/** Biggest tile size option in Settings ("Huge"). */
export const BONUS_TILE_RADIUS = 34;
/** Chance a new tile starts spelling a lesson word (Sound Focus uses 0.4). */
export const BONUS_SEED_CHANCE = 0.45;

export function bonusSecondsFor(level: AdventureLevelDef): number {
  return level.kind === 'boss' ? BONUS_BOSS_SECONDS : BONUS_LEVEL_SECONDS;
}

export function bonusTitleFor(level: AdventureLevelDef): string {
  return level.kind === 'boss' ? 'Boss Blitz' : `${level.title} Blitz`;
}
