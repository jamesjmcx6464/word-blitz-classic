import { AdventureLexiconEntry, wordsForLexiconBand } from '../data/adventureLexicon';

/** Adventure Mode tuning knobs (Spark, Flame). */

/** Wrong Enters a vowel level forgives: at most this many and it still passes; one more fails it. */
export const ADVENTURE_MAX_MISSES = 1;

export const ADVENTURE_WORDS_PER_ROUND = 4;
export const ADVENTURE_ROUNDS_PER_LEVEL = 3;
export const ADVENTURE_WORDS_PER_LEVEL =
  ADVENTURE_WORDS_PER_ROUND * ADVENTURE_ROUNDS_PER_LEVEL; // 12

export const ADVENTURE_BOSS_MAX_MISSES = 3;

export type AdventureBandId = 'spark' | 'flame' | 'blaze' | 'nova';

export type AdventureLevelId =
  | 'short-a'
  | 'short-o'
  | 'short-u'
  | 'short-i'
  | 'short-e'
  | 'boss'
  | 'flame-initial-blends'
  | 'flame-final-blends'
  | 'flame-digraphs'
  | 'flame-ending-rules'
  | 'flame-boss'
  | 'blaze-a-e'
  | 'blaze-i-e'
  | 'blaze-o-e'
  | 'blaze-long-e'
  | 'blaze-long-a'
  | 'blaze-long-o'
  | 'blaze-boss'
  | 'nova-ar'
  | 'nova-or'
  | 'nova-er'
  | 'nova-ou'
  | 'nova-oi'
  | 'nova-oo'
  | 'nova-long-i'
  | 'nova-boss';

export interface AdventureLevelDef {
  id: AdventureLevelId;
  /** Adventure this level belongs to. */
  band: AdventureBandId;
  title: string;
  subtitle: string;
  soundGroup: string | null; // null = Boss (all words in the band)
  emoji: string;
  /** 'vowel' = a regular lesson level (1 mistake allowed); 'boss' = the band's Boss. */
  kind: 'vowel' | 'boss';
}

export const SPARK_LEVELS: AdventureLevelDef[] = [
  { id: 'short-a', band: 'spark', title: 'Short A', subtitle: 'cat · hat · map', soundGroup: 'Short A', emoji: '🅰️', kind: 'vowel' },
  { id: 'short-o', band: 'spark', title: 'Short O', subtitle: 'dog · top · fox', soundGroup: 'Short O', emoji: '🅾️', kind: 'vowel' },
  { id: 'short-u', band: 'spark', title: 'Short U', subtitle: 'bug · sun · cup', soundGroup: 'Short U', emoji: '🇺', kind: 'vowel' },
  { id: 'short-i', band: 'spark', title: 'Short I', subtitle: 'pig · pin · six', soundGroup: 'Short I', emoji: 'ℹ️', kind: 'vowel' },
  { id: 'short-e', band: 'spark', title: 'Short E', subtitle: 'pen · bed · web', soundGroup: 'Short E', emoji: '🇪', kind: 'vowel' },
  { id: 'boss', band: 'spark', title: 'Spark Boss', subtitle: 'All short vowels', soundGroup: null, emoji: '⚡', kind: 'boss' },
];

export const FLAME_LEVELS: AdventureLevelDef[] = [
  { id: 'flame-initial-blends', band: 'flame', title: 'Blends', subtitle: 'frog · crab · swim', soundGroup: 'Initial Blends', emoji: '🐸', kind: 'vowel' },
  { id: 'flame-final-blends', band: 'flame', title: 'End Blends', subtitle: 'tent · hand · lamp', soundGroup: 'Final Blends', emoji: '⛺', kind: 'vowel' },
  { id: 'flame-digraphs', band: 'flame', title: 'Digraphs', subtitle: 'fish · chick · thumb', soundGroup: 'Digraphs', emoji: '🐟', kind: 'vowel' },
  { id: 'flame-ending-rules', band: 'flame', title: 'Endings', subtitle: 'duck · ring · bell', soundGroup: 'Ending Rules', emoji: '🦆', kind: 'vowel' },
  { id: 'flame-boss', band: 'flame', title: 'Flame Boss', subtitle: 'All Flame words', soundGroup: null, emoji: '🔥', kind: 'boss' },
];

export const BLAZE_LEVELS: AdventureLevelDef[] = [
  { id: 'blaze-a-e', band: 'blaze', title: 'a_e', subtitle: 'cake · snake', soundGroup: 'Silent E (a_e)', emoji: '🎂', kind: 'vowel' },
  { id: 'blaze-i-e', band: 'blaze', title: 'i_e', subtitle: 'bike · kite', soundGroup: 'Silent E (i_e)', emoji: '🚲', kind: 'vowel' },
  { id: 'blaze-o-e', band: 'blaze', title: 'o_e u_e', subtitle: 'bone · cube', soundGroup: 'Silent E (o_e, u_e)', emoji: '🦴', kind: 'vowel' },
  { id: 'blaze-long-e', band: 'blaze', title: 'ee ea', subtitle: 'bee · leaf', soundGroup: 'Long E Teams', emoji: '🐝', kind: 'vowel' },
  { id: 'blaze-long-a', band: 'blaze', title: 'ai ay', subtitle: 'rain · hay', soundGroup: 'Long A Teams', emoji: '🚂', kind: 'vowel' },
  { id: 'blaze-long-o', band: 'blaze', title: 'oa ow', subtitle: 'boat · snow', soundGroup: 'Long O Teams', emoji: '🐐', kind: 'vowel' },
  { id: 'blaze-boss', band: 'blaze', title: 'Blaze Boss', subtitle: 'All Blaze words', soundGroup: null, emoji: '☀️', kind: 'boss' },
];

export const NOVA_LEVELS: AdventureLevelDef[] = [
  { id: 'nova-ar', band: 'nova', title: 'ar', subtitle: 'car · star', soundGroup: 'R-Controlled (ar)', emoji: '🚗', kind: 'vowel' },
  { id: 'nova-or', band: 'nova', title: 'or', subtitle: 'corn · fork', soundGroup: 'R-Controlled (or)', emoji: '🌽', kind: 'vowel' },
  { id: 'nova-er', band: 'nova', title: 'er ir ur', subtitle: 'bird · surf', soundGroup: 'R-Controlled (er, ir, ur)', emoji: '🐦', kind: 'vowel' },
  { id: 'nova-ou', band: 'nova', title: 'ou ow', subtitle: 'house · cow', soundGroup: 'Diphthongs (ou, ow)', emoji: '🏠', kind: 'vowel' },
  { id: 'nova-oi', band: 'nova', title: 'oi oy', subtitle: 'coin · toy', soundGroup: 'Diphthongs (oi, oy)', emoji: '🧸', kind: 'vowel' },
  { id: 'nova-oo', band: 'nova', title: 'oo aw', subtitle: 'moon · paw', soundGroup: 'Variant oo & /aw/', emoji: '🌕', kind: 'vowel' },
  { id: 'nova-long-i', band: 'nova', title: 'igh c g', subtitle: 'light · city', soundGroup: 'Long I / Soft C & G', emoji: '💡', kind: 'vowel' },
  { id: 'nova-boss', band: 'nova', title: 'Nova Boss', subtitle: 'All Nova words', soundGroup: null, emoji: '🌟', kind: 'boss' },
];

export interface AdventureBandDef {
  id: AdventureBandId;
  title: string;
  /** Widely supported emoji (Unicode 13 or older) for the completion sticker. */
  stickerEmoji: string;
  /** Lexicon band code (spreadsheet Band column). */
  lexiconBand: 'K' | '1A' | '1B' | '2';
  levels: AdventureLevelDef[];
}

/** Known adventure modes. No gating between bands. */
export const ADVENTURE_BANDS: AdventureBandDef[] = [
  { id: 'spark', title: 'Spark', stickerEmoji: '✨', lexiconBand: 'K', levels: SPARK_LEVELS },
  { id: 'flame', title: 'Flame', stickerEmoji: '🔥', lexiconBand: '1A', levels: FLAME_LEVELS },
  { id: 'blaze', title: 'Blaze', stickerEmoji: '☀️', lexiconBand: '1B', levels: BLAZE_LEVELS },
  { id: 'nova', title: 'Nova', stickerEmoji: '🌟', lexiconBand: '2', levels: NOVA_LEVELS },
];

/** Cards on Adventure Home (comingSoon marks a placeholder with no levels). Emoji are Unicode <= 12. */
export const ADVENTURE_HOME_CARDS: { id: string; title: string; emoji: string; comingSoon?: boolean }[] = [
  { id: 'spark', title: 'Spark', emoji: '✨' },
  { id: 'flame', title: 'Flame', emoji: '🔥' },
  { id: 'blaze', title: 'Blaze', emoji: '☀️' },
  { id: 'nova', title: 'Nova', emoji: '🌟' },
];

export function getBandDef(id: AdventureBandId): AdventureBandDef {
  return ADVENTURE_BANDS.find((b) => b.id === id) ?? ADVENTURE_BANDS[0];
}

export function levelsForBand(id: AdventureBandId): AdventureLevelDef[] {
  return getBandDef(id).levels;
}

/** Every lexicon word in a band (Spark = K, Flame = 1A). */
export function wordsForBand(id: AdventureBandId): AdventureLexiconEntry[] {
  return wordsForLexiconBand(getBandDef(id).lexiconBand);
}

/** Lesson words for one level (Boss = every word in its band). */
export function wordsForLevel(level: Pick<AdventureLevelDef, 'band' | 'soundGroup'>): AdventureLexiconEntry[] {
  const all = wordsForBand(level.band);
  return level.soundGroup ? all.filter((e) => e.soundGroup === level.soundGroup) : all;
}

export const ADVENTURE_PROGRESS_KEY = 'word_blitz_adventure_progress_v1';

/** Word Blitz bonus games (arcade game tuned to a level's words). */
export const BONUS_LEVEL_SECONDS = 30;
export const BONUS_BOSS_SECONDS = 60;
/** Biggest tile size option in Settings ("Huge"). */
export const BONUS_TILE_RADIUS = 34;

export function bonusSecondsFor(level: AdventureLevelDef): number {
  return level.kind === 'boss' ? BONUS_BOSS_SECONDS : BONUS_LEVEL_SECONDS;
}

export function bonusTitleFor(level: AdventureLevelDef): string {
  return level.kind === 'boss' ? 'Boss Blitz' : `${level.title} Blitz`;
}
