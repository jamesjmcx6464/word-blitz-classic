import { AdventureLevelDef, wordsForLevel } from './adventureConfig';
import { DIFFICULTY_PRESETS } from '../types/game';
import { GROUND_Y, SPAWN_Y, SPEED_MULTIPLIER_MAX } from './hexPhysics';

/** Lesson words (uppercase) for a level; a Boss uses every word in its band. */
export function bonusWordsFor(level: AdventureLevelDef): string[] {
  const entries = wordsForLevel(level);
  return Array.from(new Set(entries.map((e) => e.word.trim().toUpperCase()).filter((w) => /^[A-Z]+$/.test(w))));
}

/** Every letter a level's bonus Blitz may ever spawn: only letters in its lesson words. */
export function allowedBonusLetters(level: AdventureLevelDef): Set<string> {
  return new Set(bonusWordsFor(level).join('').split(''));
}

/** Spawn jitter range used by the arcade loop (0.6x..1.4x of the mean gap). */
export const SPAWN_JITTER_MIN = 0.6;

/**
 * How many tiles the arcade loop can spawn in `seconds` on the Normal preset
 * (bonus games run on Normal; Normal never speeds up on its own).
 * Mirrors App's cadence: mean gap = max(150, fallTime / targetOnScreen), with
 * fallTime = (GROUND_Y - SPAWN_Y) / (dropSpeed * screenMultiplier). Uses the
 * worst-case (shortest) jitter for every gap, plus the instant first spawn.
 * Defaults are the fastest possible screen (max multiplier, widest board).
 */
export function bonusLetterCapacity(
  seconds: number,
  speedMultiplier: number = SPEED_MULTIPLIER_MAX,
  boardWidth: number = 1600
): number {
  const preset = DIFFICULTY_PRESETS.normal;
  const widthScale = boardWidth > 1200 ? 5 / 3 : boardWidth > 850 ? 4 / 3 : 1;
  const targetOnScreen = (preset.phoneTargetOnScreen || 3) * widthScale;
  const fallTimeMs = ((GROUND_Y - SPAWN_Y) / Math.max(1, preset.dropSpeed * speedMultiplier)) * 1000;
  const meanInterval = Math.max(150, fallTimeMs / targetOnScreen);
  const shortestGap = meanInterval * SPAWN_JITTER_MIN;
  return 1 + Math.ceil((seconds * 1000) / shortestGap);
}

type Rand = () => number;

function shuffle<T>(arr: readonly T[], rand: Rand): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle a word's letters, guaranteed different from the word when that is possible. */
export function scrambleWord(word: string, rand: Rand): string[] {
  const letters = word.split('');
  if (new Set(letters).size < 2) return letters;
  for (let i = 0; i < 20; i++) {
    const s = shuffle(letters, rand);
    if (s.join('') !== word) return s;
  }
  // Deterministic fallback: rotate by one (always differs when 2+ distinct letters).
  const rot = [...letters.slice(1), letters[0]];
  return rot.join('') !== word ? rot : [...letters].reverse();
}

export interface BonusBatch {
  /** Words used, in drop order (word 1 first). */
  words: string[];
  /** Letters in drop order. */
  letters: string[];
  /** Boss only: [start, end) index ranges of the scrambled words 2 and 3 in `letters`. */
  scrambled: [number, number][];
}

/**
 * Word deck for one Blitz: practiced words first (shuffled), then the rest of the
 * lesson words (shuffled). No word repeats until the pool is used up; then the
 * whole pool is reshuffled (never starting with the word that just dropped).
 */
export class BonusWordDeck {
  private queue: string[] = [];
  private last: string | null = null;
  constructor(
    private readonly pool: string[],
    private readonly practiced: string[],
    private readonly rand: Rand
  ) {
    const set = new Set(pool);
    const prac = Array.from(new Set(practiced.filter((w) => set.has(w))));
    const pracSet = new Set(prac);
    this.queue = [...shuffle(prac, rand), ...shuffle(pool.filter((w) => !pracSet.has(w)), rand)];
  }
  next(): string {
    if (this.queue.length === 0) {
      let fresh = shuffle(this.pool, this.rand);
      if (fresh.length > 1 && fresh[0] === this.last) fresh = [...fresh.slice(1), fresh[0]];
      this.queue = fresh;
    }
    const w = this.queue.shift() as string;
    this.last = w;
    return w;
  }
}

/**
 * Builds one batch of at least `minLetters` letters.
 * Level: word 1 in order, then every letter of words 2..N shuffled together.
 * Boss: word 1 in order, words 2 and 3 each scrambled as their own block,
 * then every letter of words 4..N shuffled together.
 */
export function buildBonusBatch(deck: BonusWordDeck, isBoss: boolean, minLetters: number, rand: Rand): BonusBatch {
  const words: string[] = [];
  let total = 0;
  while (total < minLetters || words.length < (isBoss ? 4 : 2)) {
    const w = deck.next();
    words.push(w);
    total += w.length;
  }
  const letters: string[] = words[0].split('');
  const scrambled: [number, number][] = [];
  let restFrom = 1;
  if (isBoss) {
    for (const w of words.slice(1, 3)) {
      const start = letters.length;
      letters.push(...scrambleWord(w, rand));
      scrambled.push([start, letters.length]);
    }
    restFrom = 3;
  }
  letters.push(...shuffle(words.slice(restFrom).join('').split(''), rand));
  return { words, letters, scrambled };
}

/** Problems with a batch (empty = valid): exact letter multiset, word 1 in order, scrambled blocks intact. */
export function validateBonusBatch(batch: BonusBatch, allowed: Set<string>): string[] {
  const problems: string[] = [];
  const want = new Map<string, number>();
  for (const ch of batch.words.join('')) want.set(ch, (want.get(ch) ?? 0) + 1);
  const have = new Map<string, number>();
  for (const ch of batch.letters) have.set(ch, (have.get(ch) ?? 0) + 1);
  if (batch.letters.length !== batch.words.join('').length) problems.push('letter count');
  for (const [ch, n] of want) if (have.get(ch) !== n) problems.push(`letter ${ch}`);
  for (const ch of have.keys()) if (!allowed.has(ch)) problems.push(`not allowed ${ch}`);
  if (batch.letters.slice(0, batch.words[0].length).join('') !== batch.words[0]) problems.push('word 1 not in order');
  batch.scrambled.forEach(([s, e], i) => {
    const w = batch.words[i + 1];
    if (batch.letters.slice(s, e).sort().join('') !== w.split('').sort().join('')) problems.push(`word ${i + 2} block`);
  });
  return problems;
}

/**
 * The bonus Blitz letter queue: pre-built, validated batches of lesson words.
 * If play outlasts the first batch, another batch is built the same way.
 */
export class BonusLetterQueue {
  readonly allowed: Set<string>;
  readonly batches: BonusBatch[] = [];
  private buffer: string[] = [];
  private deck: BonusWordDeck;
  private readonly isBoss: boolean;
  constructor(
    level: AdventureLevelDef,
    readonly capacity: number,
    practiced: string[] = [],
    private readonly rand: Rand = Math.random
  ) {
    const pool = bonusWordsFor(level);
    this.allowed = allowedBonusLetters(level);
    this.isBoss = level.kind === 'boss';
    this.deck = new BonusWordDeck(pool, practiced.map((w) => w.toUpperCase()), rand);
    this.addBatch();
  }
  private addBatch(): void {
    for (let attempt = 0; attempt < 5; attempt++) {
      const batch = buildBonusBatch(this.deck, this.isBoss, this.capacity, this.rand);
      const problems = validateBonusBatch(batch, this.allowed);
      if (problems.length === 0 || attempt === 4) {
        if (problems.length) console.warn('[bonus] batch failed validation', problems);
        this.batches.push(batch);
        this.buffer.push(...batch.letters);
        return;
      }
    }
  }
  /** Letters already queued (not yet dropped). */
  get remaining(): number {
    return this.buffer.length;
  }
  next(): string {
    if (this.buffer.length === 0) this.addBatch();
    return this.buffer.shift() as string;
  }
}
