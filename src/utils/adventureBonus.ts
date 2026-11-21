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


/** Vowels for the drop rhythm rule (Y counts as a consonant). */
export const isBonusVowel = (ch: string): boolean => 'AEIOU'.includes(ch);

/** Number of 3-in-a-row same-type (vowel/consonant) windows in `seq` that end at index >= from. */
export function countTypeTriples(seq: readonly string[], from = 2, to = seq.length): number {
  let n = 0;
  for (let i = Math.max(2, from); i < to; i++) {
    const a = isBonusVowel(seq[i - 2]), b = isBonusVowel(seq[i - 1]), c = isBonusVowel(seq[i]);
    if (a === b && b === c) n++;
  }
  return n;
}

/**
 * Can `nv` vowels and `nc` consonants still be placed with at most `capV` vowels /
 * `capC` consonants in a row, given the current run (`runV` = run is vowels, `run` long)?
 */
function rhythmFeasible(nv: number, nc: number, runV: boolean, run: number, capV: number, capC: number): boolean {
  const [same, other, capS, capO] = runV ? [nv, nc, capV, capC] : [nc, nv, capC, capV];
  return same <= Math.max(0, capS - run) + capS * other && other <= capO * (same + 1);
}

function runState(prefix: readonly string[]): { runV: boolean; run: number } {
  if (prefix.length === 0) return { runV: false, run: 0 };
  const runV = isBonusVowel(prefix[prefix.length - 1]);
  let run = 0;
  for (let i = prefix.length - 1; i >= 0 && isBonusVowel(prefix[i]) === runV; i--) run++;
  return { runV, run };
}

/** True when the letters can follow `before` with no 3 same-type in a row. */
export function rhythmPossible(letters: readonly string[], before: readonly string[]): boolean {
  const nv = letters.filter(isBonusVowel).length;
  const { runV, run } = runState(before.slice(-2));
  return rhythmFeasible(nv, letters.length - nv, runV, run, 2, 2);
}

/**
 * Shuffle `letters` so that, after `before` and followed by the fixed `after`, no 3
 * vowels or 3 consonants drop in a row. Same multiset, always. When the pool makes
 * that impossible (e.g. far more consonants than vowels), the longer runs are spread
 * as evenly as possible instead of piling up at the end.
 */
export function arrangeRhythm(
  letters: readonly string[],
  rand: Rand,
  before: readonly string[] = [],
  after: readonly string[] = []
): string[] {
  if (letters.length === 0) return [];
  const vowels0 = letters.filter(isBonusVowel);
  const cons0 = letters.filter((c) => !isBonusVowel(c));
  const prev = before.slice(-2);
  const st0 = runState(prev);
  // Smallest run caps that fit this pool (2/2 unless impossible).
  if (!rhythmFeasible(vowels0.length, cons0.length, st0.runV, st0.run, 2, 2)) {
    return spreadEvenly(vowels0, cons0, prev, rand);
  }
  const score = (out: string[]) => countTypeTriples([...prev, ...out, ...after.slice(0, 2)], 2);
  // Exact check (memoised): can the remaining letters be placed, then the fixed
  // `after` letters, with no 3 same-type in a row? Falls back to ignoring `after`.
  const makeCanFinish = (tail: readonly string[]) => {
    const memo = new Map<number, boolean>();
    const tailV = tail.map(isBonusVowel);
    const can = (nv: number, nc: number, lastV: boolean, run: number): boolean => {
      if (nv === 0 && nc === 0) {
        let lv = lastV, r = run;
        for (const v of tailV) {
          r = r && lv === v ? r + 1 : 1;
          lv = v;
          if (r > 2) return false;
        }
        return true;
      }
      const key = ((nv * 512 + nc) * 2 + (lastV ? 1 : 0)) * 4 + run;
      const hit = memo.get(key);
      if (hit !== undefined) return hit;
      let ok = false;
      if (nv > 0) {
        const r = run && lastV ? run + 1 : 1;
        ok = r <= 2 && can(nv - 1, nc, true, r);
      }
      if (!ok && nc > 0) {
        const r = run && !lastV ? run + 1 : 1;
        ok = r <= 2 && can(nv, nc - 1, false, r);
      }
      memo.set(key, ok);
      return ok;
    };
    return can;
  };
  let canFinish = makeCanFinish(after.slice(0, 2));
  if (!canFinish(vowels0.length, cons0.length, st0.runV, Math.min(st0.run, 2))) canFinish = makeCanFinish([]);
  let best: string[] = [];
  let bestScore = Infinity;
  for (let attempt = 0; attempt < 8 && bestScore > 0; attempt++) {
    const vs = shuffle(vowels0, rand), cs = shuffle(cons0, rand);
    const out: string[] = [];
    let runV = st0.runV, run = Math.min(st0.run, 2);
    while (vs.length || cs.length) {
      const opts: boolean[] = [];
      for (const v of [true, false]) {
        if (!(v ? vs.length : cs.length)) continue;
        const nr = run && runV === v ? run + 1 : 1;
        if (nr > 2) continue;
        if (canFinish(vs.length - (v ? 1 : 0), cs.length - (v ? 0 : 1), v, nr)) opts.push(v);
      }
      const pickV =
        opts.length === 2 ? rand() * (vs.length + cs.length) < vs.length : opts.length === 1 ? opts[0] : vs.length > 0;
      out.push((pickV ? vs : cs).pop() as string);
      run = run && runV === pickV ? run + 1 : 1;
      runV = pickV;
    }
    const sc = score(out);
    if (sc < bestScore) {
      best = out;
      bestScore = sc;
    }
  }
  return best;
}

/**
 * Pool cannot keep the 2-in-a-row rule (e.g. far more consonants than vowels):
 * single minority letters split the majority into groups as equal in size as
 * possible (counting the run already in progress), so long runs are spread evenly.
 */
function spreadEvenly(vowels0: string[], cons0: string[], prev: readonly string[], rand: Rand): string[] {
  const majV = vowels0.length > cons0.length;
  const maj = shuffle(majV ? vowels0 : cons0, rand);
  const min = shuffle(majV ? cons0 : vowels0, rand);
  const st = runState(prev);
  const carry = st.run && st.runV === majV ? st.run : 0;
  const groups = min.length + 1;
  const total = maj.length + carry;
  const base = Math.floor(total / groups);
  const extra = total - base * groups;
  // Which groups get one more: evenly spaced, random phase.
  const sizes = Array.from({ length: groups }, () => base);
  const phase = rand();
  for (let i = 0; i < extra; i++) sizes[Math.floor(((i + phase) * groups) / extra) % groups]++;
  sizes[0] = Math.max(0, sizes[0] - carry);
  // Rounding/carry leftovers go to the smallest groups.
  let placed = sizes.reduce((a, b) => a + b, 0);
  while (placed < maj.length) {
    let m = 0;
    for (let i = 1; i < groups; i++) if (sizes[i] < sizes[m]) m = i;
    sizes[m]++;
    placed++;
  }
  while (placed > maj.length) {
    let m = 0;
    for (let i = 1; i < groups; i++) if (sizes[i] > sizes[m]) m = i;
    sizes[m]--;
    placed--;
  }
  const out: string[] = [];
  sizes.forEach((g, i) => {
    out.push(...maj.splice(0, g));
    if (i < min.length) out.push(min[i]);
  });
  return out;
}

/** All distinct orderings of a short word's letters (Boss words are 5 letters or fewer). */
function permutations(letters: string[]): string[][] {
  if (letters.length <= 1) return [letters];
  const seen = new Set<string>();
  const out: string[][] = [];
  letters.forEach((ch, i) => {
    if (letters.indexOf(ch) !== i) return;
    for (const rest of permutations([...letters.slice(0, i), ...letters.slice(i + 1)])) {
      const p = [ch, ...rest];
      const k = p.join('');
      if (!seen.has(k)) {
        seen.add(k);
        out.push(p);
      }
    }
  });
  return out;
}

/** Scrambles of `word` (different from it) with no 3 same-type in a row after `before`. */
export function rhythmScrambles(word: string, before: readonly string[]): string[][] {
  if (word.length > 7) return [];
  const prev = before.slice(-2);
  return permutations(word.split('')).filter(
    (p) => p.join('') !== word && countTypeTriples([...prev, ...p], 2) === 0
  );
}

/** Boss block scramble: prefer one that keeps the vowel/consonant rhythm, else any scramble. */
export function scrambleWordRhythm(word: string, rand: Rand, before: readonly string[]): string[] {
  const ok = rhythmScrambles(word, before);
  if (ok.length) return ok[Math.floor(rand() * ok.length)];
  return scrambleWord(word, rand);
}

export interface BonusBatch {
  /** Words used, in drop order (word 1 first). */
  words: string[];
  /** Letters in drop order. */
  letters: string[];
  /** Boss only: [start, end) index ranges of the scrambled words 2 and 3 in `letters`. */
  scrambled: [number, number][];
  /** [start, end) of the shuffled tail (level words 2..N / Boss words 4..N) in `letters`. */
  shuffled: [number, number];
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
  /** The word `next()` will return, without taking it. */
  peek(): string {
    this.refill();
    return this.queue[0];
  }
  private refill(): void {
    if (this.queue.length === 0) {
      let fresh = shuffle(this.pool, this.rand);
      if (fresh.length > 1 && fresh[0] === this.last) fresh = [...fresh.slice(1), fresh[0]];
      this.queue = fresh;
    }
  }
  next(): string {
    this.refill();
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
 * Drop rhythm: shuffled letters never make 3 vowels or 3 consonants in a row,
 * counting the letters before them (`prevTail` = end of the previous batch) and the
 * next batch's word 1, which follows them. Boss blocks use such a scramble when one exists.
 */
export function buildBonusBatch(
  deck: BonusWordDeck,
  isBoss: boolean,
  minLetters: number,
  rand: Rand,
  prevTail: readonly string[] = []
): BonusBatch {
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
      letters.push(...scrambleWordRhythm(w, rand, [...prevTail, ...letters].slice(-2)));
      scrambled.push([start, letters.length]);
    }
    restFrom = 3;
  }
  const start = letters.length;
  const nextWord = deck.peek() ?? '';
  letters.push(
    ...arrangeRhythm(words.slice(restFrom).join('').split(''), rand, [...prevTail, ...letters].slice(-2), nextWord.split(''))
  );
  return { words, letters, scrambled, shuffled: [start, letters.length] };
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
      const prev = this.batches.length ? this.batches[this.batches.length - 1].letters.slice(-2) : [];
      const batch = buildBonusBatch(this.deck, this.isBoss, this.capacity, this.rand, prev);
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
