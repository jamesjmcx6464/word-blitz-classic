import { LetterTileInfo } from './letterBag';

/**
 * Parses a raw user-entered string into a deduplicated list of uppercase words.
 * Accepts commas, newlines, spaces, semicolons, tabs, etc. as separators.
 * Strips non-A-Z characters.
 */
export function parseSpellingWords(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];

  const rawTokens = raw.split(/[\s,;\n\r\t]+/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const token of rawTokens) {
    const cleaned = token.toUpperCase().replace(/[^A-Z]/g, '');
    if (cleaned.length >= 2 && !seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }

  return result;
}

export interface LetterWeight {
  letter: string;
  weight: number;
}

/**
 * Calculates letter weights strictly based on the letter counts across all spelling words.
 * If a letter has 0 occurrences (e.g. Z is never used), its weight is 0 and it is omitted.
 */
export function getSpellingLetterWeights(words: string[]): LetterWeight[] {
  if (!words || words.length === 0) return [];

  const counts: Record<string, number> = {};

  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const ch = word[i].toUpperCase();
      if (ch >= 'A' && ch <= 'Z') {
        counts[ch] = (counts[ch] || 0) + 1;
      }
    }
  }

  const weights: LetterWeight[] = [];
  for (const [letter, count] of Object.entries(counts)) {
    if (count > 0) {
      weights.push({ letter, weight: count });
    }
  }

  return weights;
}

/**
 * Balanced Shuffled Bag (Deck) Manager for Spelling Words mode.
 * 
 * Instead of pure independent random dice rolls (which can cause statistical starvation,
 * e.g. dealing 8 C's and T's without an A), the Shuffled Bag deals letters in exact
 * proportional batches (like Tetris 7-bag or Scrabble tile bag).
 * 
 * For "CAT", every batch of 3 tiles contains EXACTLY one C, one A, and one T (1:1:1 ratio).
 * Furthermore, it monitors live board tiles: if a required letter is completely absent
 * from the board while other letters have accumulated, it prioritizes drawing that missing letter
 * so the player can actually spell their word!
 */
export class SpellingBag {
  private wordsKey: string = '';
  private bag: string[] = [];
  private targetWeights: Record<string, number> = {};
  private totalTargetLetters: number = 0;

  /**
   * Syncs the bag with the current list of spelling words.
   * If the word list changes, the bag is rebuilt.
   */
  public syncWords(words: string[]): void {
    const key = words.slice().sort().join('|');
    if (key !== this.wordsKey) {
      this.wordsKey = key;
      this.bag = [];
      this.targetWeights = {};
      this.totalTargetLetters = 0;

      for (const word of words) {
        for (let i = 0; i < word.length; i++) {
          const ch = word[i].toUpperCase();
          if (ch >= 'A' && ch <= 'Z') {
            this.targetWeights[ch] = (this.targetWeights[ch] || 0) + 1;
            this.totalTargetLetters++;
          }
        }
      }
    }
  }

  /**
   * Refills the bag with exact proportional letter counts and shuffles them.
   */
  private refill(): void {
    if (this.totalTargetLetters === 0) return;

    // Small word lists (e.g. "CAT" with 3 letters) use a 2x batch multiplier
    // so the shuffle has slight local variety while maintaining strictly balanced ratios
    const multiplier = this.totalTargetLetters <= 6 ? 2 : 1;
    const newPool: string[] = [];

    for (const [letter, count] of Object.entries(this.targetWeights)) {
      for (let i = 0; i < count * multiplier; i++) {
        newPool.push(letter);
      }
    }

    // Fisher-Yates shuffle
    for (let i = newPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = newPool[i];
      newPool[i] = newPool[j];
      newPool[j] = temp;
    }

    this.bag = newPool;
  }

  /**
   * Draws the next letter from the bag, taking active board tiles into account
   * to guarantee that letters are roughly 1:1:1 and never starved.
   */
  public drawNextLetter(boardTiles?: Array<{ letter: { value: string } }>): LetterTileInfo {
    if (this.totalTargetLetters === 0) {
      return { display: 'E', value: 'E' };
    }

    if (this.bag.length === 0) {
      this.refill();
    }

    // Anti-starvation check:
    // If the board already has multiple copies of some letters but ZERO copies of another
    // required letter, search the current bag for the missing letter and draw it!
    if (boardTiles && boardTiles.length >= 2) {
      const boardCounts: Record<string, number> = {};
      for (const t of boardTiles) {
        const val = t.letter.value.toUpperCase();
        if (this.targetWeights[val]) {
          boardCounts[val] = (boardCounts[val] || 0) + 1;
        }
      }

      // Check which required letters currently have 0 on the board
      const missingLetters = Object.keys(this.targetWeights).filter(
        (l) => (boardCounts[l] || 0) === 0
      );

      // If at least one letter has 2+ copies on board while another letter has 0,
      // pluck a missing letter from the bag to rescue the board balance!
      if (missingLetters.length > 0) {
        const maxOnBoard = Math.max(...Object.values(boardCounts), 0);
        if (maxOnBoard >= 2) {
          const bagIdx = this.bag.findIndex((l) => missingLetters.includes(l));
          if (bagIdx !== -1) {
            const [chosen] = this.bag.splice(bagIdx, 1);
            return { display: chosen, value: chosen };
          }
        }
      }
    }

    const chosen = this.bag.pop() || Object.keys(this.targetWeights)[0] || 'E';
    return { display: chosen, value: chosen };
  }

  /**
   * Resets the bag completely (e.g. on new game start).
   */
  public reset(): void {
    this.bag = [];
  }
}

// Global singleton instance for spelling bag
export const spellingBag = new SpellingBag();

/**
 * Draws a random letter strictly matching the spelling words letter distribution.
 * Uses the balanced bag algorithm so letters appear roughly 1:1:1 without starvation streaks.
 */
export function drawSpellingBagLetter(
  words: string[],
  boardTiles?: Array<{ letter: { value: string } }>
): LetterTileInfo {
  spellingBag.syncWords(words);
  return spellingBag.drawNextLetter(boardTiles);
}

/**
 * Backward-compatible helper for letter weights array.
 */
export function drawSpellingLetter(
  weights: LetterWeight[],
  boardTiles?: Array<{ letter: { value: string } }>
): LetterTileInfo {
  if (!weights || weights.length === 0) {
    return { display: 'E', value: 'E' };
  }

  const words = weights.map((w) => w.letter.repeat(w.weight));
  return drawSpellingBagLetter(words, boardTiles);
}

export interface SpellingWordsStats {
  words: string[];
  totalLetters: number;
  activeLetters: string[];
  excludedLetters: string[];
  letterCounts: Record<string, number>;
}

export function getSpellingWordsStats(raw: string): SpellingWordsStats {
  const words = parseSpellingWords(raw);
  const letterCounts: Record<string, number> = {};
  let totalLetters = 0;

  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const ch = word[i].toUpperCase();
      if (ch >= 'A' && ch <= 'Z') {
        letterCounts[ch] = (letterCounts[ch] || 0) + 1;
        totalLetters++;
      }
    }
  }

  const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const activeLetters = ALL_LETTERS.filter((l) => (letterCounts[l] || 0) > 0);
  const excludedLetters = ALL_LETTERS.filter((l) => !letterCounts[l]);

  return {
    words,
    totalLetters,
    activeLetters,
    excludedLetters,
    letterCounts,
  };
}
