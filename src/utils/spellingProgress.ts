import { parseSpellingWords } from './spellingWords';

export interface SpellingAnalysis {
  words: string[];
  notes: string[];
}

export interface SpellingProgress {
  foundWords: string[];
  missingWords: string[];
  foundCount: number;
  totalCount: number;
  allFound: boolean;
}

/**
 * Analyzes raw spelling input and generates friendly, child- and teacher-readable notes.
 * Max 5 notes, each a short, single sentence.
 */
export function analyzeSpellingInput(raw: string): SpellingAnalysis {
  const keptWords = parseSpellingWords(raw);
  const notes: string[] = [];

  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return { words: [], notes: [] };
  }

  // Split on line breaks, commas, semicolons to analyze user phrases
  const rawEntries = raw.split(/[\n\r,;]+/);
  const seenWords = new Set<string>();
  const repeatedWords = new Set<string>();

  for (const entry of rawEntries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    // Check if an entry with spaces produced multiple words
    const spaceParts = trimmed.split(/\s+/).filter(Boolean);
    if (spaceParts.length > 1) {
      const validParts = spaceParts
        .map((p) => p.toUpperCase().replace(/[^A-Z]/g, ''))
        .filter((w) => w.length >= 2);
      if (validParts.length > 1 && notes.length < 5) {
        const note = `"${trimmed}" became separate words: ${validParts.join(' and ')}.`;
        if (!notes.includes(note)) {
          notes.push(note);
        }
      }
    }

    // Check tokens within this entry
    for (const token of spaceParts) {
      if (/[0-9'’\-_/\\#@!$%^&*()]/.test(token) && notes.length < 5) {
        const cleaned = token.toUpperCase().replace(/[^A-Z]/g, '');
        if (cleaned.length >= 2) {
          const note = `We cleaned "${token}" into ${cleaned}.`;
          if (!notes.includes(note)) {
            notes.push(note);
          }
        }
      }

      const lettersOnly = token.toUpperCase().replace(/[^A-Z]/g, '');
      if (token.length > 0 && lettersOnly.length < 2 && notes.length < 5) {
        const note = `"${token}" was skipped because words need at least 2 letters.`;
        if (!notes.includes(note)) {
          notes.push(note);
        }
      }

      if (lettersOnly.length >= 2) {
        if (seenWords.has(lettersOnly)) {
          repeatedWords.add(lettersOnly);
        } else {
          seenWords.add(lettersOnly);
        }
      }
    }
  }

  // Duplicate word notes
  for (const dup of repeatedWords) {
    if (notes.length < 5) {
      const note = `"${dup}" was in the list more than once; we kept one copy.`;
      if (!notes.includes(note)) {
        notes.push(note);
      }
    }
  }

  return {
    words: keptWords,
    notes: notes.slice(0, 5),
  };
}

/**
 * Tracks player progress against the active spelling words list.
 * Each word counts as found at most once. All comparisons in uppercase.
 */
export function getSpellingProgress(
  wordEntries: Array<{ word: string }>,
  spellingWords: string[]
): SpellingProgress {
  if (!spellingWords || spellingWords.length === 0) {
    return {
      foundWords: [],
      missingWords: [],
      foundCount: 0,
      totalCount: 0,
      allFound: false,
    };
  }

  // Deduplicate and uppercase spelling words
  const cleanSpellingWords: string[] = [];
  const seenSpelling = new Set<string>();
  for (const w of spellingWords) {
    const up = w.toUpperCase().trim();
    if (up && !seenSpelling.has(up)) {
      seenSpelling.add(up);
      cleanSpellingWords.push(up);
    }
  }

  // Gather uppercase words submitted
  const submittedSet = new Set<string>();
  if (wordEntries) {
    for (const entry of wordEntries) {
      if (entry && typeof entry.word === 'string') {
        submittedSet.add(entry.word.toUpperCase().trim());
      }
    }
  }

  const foundWords: string[] = [];
  const missingWords: string[] = [];

  for (const target of cleanSpellingWords) {
    if (submittedSet.has(target)) {
      foundWords.push(target);
    } else {
      missingWords.push(target);
    }
  }

  const totalCount = cleanSpellingWords.length;
  const foundCount = foundWords.length;
  const allFound = totalCount > 0 && foundCount >= totalCount;

  return {
    foundWords,
    missingWords,
    foundCount,
    totalCount,
    allFound,
  };
}
