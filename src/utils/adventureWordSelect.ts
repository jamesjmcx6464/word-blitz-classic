import { AdventureLexiconEntry, SPARK_WORDS } from '../data/adventureLexicon';
import {
  ADVENTURE_ROUNDS_PER_LEVEL,
  ADVENTURE_WORDS_PER_ROUND,
} from './adventureConfig';

/** Mulberry32 — tiny seeded PRNG for varied-but-stable order. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Heggerty-style order within a Sound_Group:
 * 1) pick a rime family (Pattern) and take onset swaps
 * 2) then another family
 * 3) sprinkle cross-family final-sound swaps when helpful
 * Avoid repeating a word until the pool is exhausted.
 * Never put two cards with the same emoji in one round.
 */
export function buildLevelRounds(
  soundGroup: string | null,
  seed: number
): AdventureLexiconEntry[][] {
  const rand = mulberry32(seed || 1);
  const pool =
    soundGroup == null
      ? SPARK_WORDS.slice()
      : SPARK_WORDS.filter((e) => e.soundGroup === soundGroup);

  if (soundGroup == null) {
    // Boss: fully random from all Spark, no emoji dupes per round.
    return packRounds(shuffle(pool, rand), rand);
  }

  // Group by pattern (rime family)
  const byPattern = new Map<string, AdventureLexiconEntry[]>();
  for (const e of pool) {
    const list = byPattern.get(e.pattern) ?? [];
    list.push(e);
    byPattern.set(e.pattern, list);
  }

  const patterns = shuffle(Array.from(byPattern.keys()), rand);
  // Prefer larger families first for onset-swap feel
  patterns.sort((a, b) => {
    const diff = (byPattern.get(b)?.length ?? 0) - (byPattern.get(a)?.length ?? 0);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
  // Light reshuffle of equal-ish sizes
  const orderedFamilies: AdventureLexiconEntry[] = [];
  for (const p of patterns) {
    orderedFamilies.push(...shuffle(byPattern.get(p) ?? [], rand));
  }

  // Cross-family final-sound swaps: group by final letter, interleave lightly
  const byFinal = new Map<string, AdventureLexiconEntry[]>();
  for (const e of pool) {
    const fin = e.word.slice(-1);
    const list = byFinal.get(fin) ?? [];
    list.push(e);
    byFinal.set(fin, list);
  }
  const crossHints: AdventureLexiconEntry[] = [];
  for (const [, list] of byFinal) {
    if (list.length >= 2) {
      crossHints.push(...shuffle(list, rand).slice(0, Math.min(3, list.length)));
    }
  }

  // Merge: family blocks first, then weave a few cross-family words not already early
  const seen = new Set<string>();
  const sequence: AdventureLexiconEntry[] = [];
  for (const e of orderedFamilies) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    sequence.push(e);
  }
  // Insert cross-family pairs later in the deck (after first family block)
  const insertAt = Math.min(sequence.length, Math.max(4, Math.floor(sequence.length * 0.35)));
  const extras = crossHints.filter((e) => !seen.has(e.id));
  for (let i = 0; i < extras.length; i++) {
    sequence.splice(insertAt + i * 2, 0, extras[i]);
    seen.add(extras[i].id);
  }
  // Append any leftovers
  for (const e of shuffle(pool, rand)) {
    if (!seen.has(e.id)) sequence.push(e);
  }

  return packRounds(sequence, rand);
}

function packRounds(
  sequence: AdventureLexiconEntry[],
  rand: () => number
): AdventureLexiconEntry[][] {
  const need = ADVENTURE_ROUNDS_PER_LEVEL * ADVENTURE_WORDS_PER_ROUND;
  const rounds: AdventureLexiconEntry[][] = [];
  const usedInLevel = new Set<string>();
  let cursor = 0;
  const deck = sequence.slice();

  for (let r = 0; r < ADVENTURE_ROUNDS_PER_LEVEL; r++) {
    const round: AdventureLexiconEntry[] = [];
    const emojiUsed = new Set<string>();
    let guard = 0;
    while (round.length < ADVENTURE_WORDS_PER_ROUND && guard < deck.length * 4) {
      guard++;
      if (cursor >= deck.length) {
        // Pool exhausted — reshuffle unused-for-emoji picks from full pool
        cursor = 0;
        // allow repeats of words only after full pool used
        usedInLevel.clear();
      }
      const candidate = deck[cursor++];
      if (!candidate) break;
      if (emojiUsed.has(candidate.emoji)) continue;
      if (usedInLevel.has(candidate.id) && usedInLevel.size < deck.length) continue;
      round.push(candidate);
      emojiUsed.add(candidate.emoji);
      usedInLevel.add(candidate.id);
    }
    // Fallback fill if emoji collisions blocked us
    while (round.length < ADVENTURE_WORDS_PER_ROUND) {
      const pool = shuffle(deck, rand);
      const pick = pool.find(
        (e) => !emojiUsed.has(e.emoji) && !round.some((x) => x.id === e.id)
      );
      if (!pick) break;
      round.push(pick);
      emojiUsed.add(pick.emoji);
    }
    rounds.push(round);
  }

  void need;
  return rounds;
}

/** Letters for the even-layer tile tray (jumbled). */
export function buildLetterTray(words: AdventureLexiconEntry[], seed: number): string[] {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const letters: string[] = [];
  for (const w of words) {
    for (const ch of w.word.toUpperCase()) {
      letters.push(ch);
    }
  }
  return shuffle(letters, rand);
}

/** Letters a round needs: the full multiset of its words' letters (unshuffled). */
export function roundLetterMultiset(words: AdventureLexiconEntry[]): string[] {
  const out: string[] = [];
  for (const w of words) for (const ch of w.word.toUpperCase()) out.push(ch);
  return out;
}

export interface RoundTileSpec {
  id: string;
  letter: string;
}

/**
 * Checks a round's tile set before anything drops: the count matches the
 * total letters, every word can be spelled from the tiles, and ids are unique.
 * Returns a list of problems (empty = valid).
 */
export function validateRoundTiles(words: AdventureLexiconEntry[], tiles: RoundTileSpec[]): string[] {
  const problems: string[] = [];
  const need = roundLetterMultiset(words);
  if (tiles.length !== need.length) problems.push(`count ${tiles.length} != ${need.length}`);
  const ids = new Set(tiles.map((t) => t.id));
  if (ids.size !== tiles.length) problems.push('duplicate tile ids');
  const have = new Map<string, number>();
  for (const t of tiles) have.set(t.letter, (have.get(t.letter) ?? 0) + 1);
  // Every word on its own, and all words together (exact multiset)
  for (const w of words) {
    const want = new Map<string, number>();
    for (const ch of w.word.toUpperCase()) want.set(ch, (want.get(ch) ?? 0) + 1);
    for (const [ch, n] of want) if ((have.get(ch) ?? 0) < n) problems.push(`cannot spell ${w.word}`);
  }
  const needCounts = new Map<string, number>();
  for (const ch of need) needCounts.set(ch, (needCounts.get(ch) ?? 0) + 1);
  for (const [ch, n] of needCounts) if (have.get(ch) !== n) problems.push(`letter ${ch}: ${have.get(ch) ?? 0} != ${n}`);
  for (const ch of have.keys()) if (!needCounts.has(ch)) problems.push(`extra letter ${ch}`);
  return problems;
}

/**
 * Builds every tile for a round up front (shuffled with the round's seed),
 * validates it, and rebuilds if anything is off. Never returns a short set.
 */
export function buildRoundTiles(
  words: AdventureLexiconEntry[],
  seed: number,
  idPrefix: string
): RoundTileSpec[] {
  for (let attempt = 0; attempt < 3; attempt++) {
    const letters = buildLetterTray(words, seed + attempt * 7919);
    const tiles = letters.map((letter, i) => ({ id: `${idPrefix}-${i}`, letter }));
    const problems = validateRoundTiles(words, tiles);
    if (problems.length === 0) return tiles;
    console.warn('[adventure] round tiles failed validation, rebuilding', problems);
  }
  // Last resort: the plain, unshuffled multiset (always valid by construction)
  return roundLetterMultiset(words).map((letter, i) => ({ id: `${idPrefix}-${i}`, letter }));
}
