export interface HighScoreEntry {
  id: string;
  playerName?: string;
  playerLogo?: string;
  score: number;
  longestWord: string;
  totalWords: number;
  date: string;
  timestamp: number;
}

const STORAGE_KEY = 'word_blitz_high_scores_v1';
const MAX_ENTRIES = 50;

export function getHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
    }
  } catch (err) {
    console.error('Failed to read high scores:', err);
  }
  return [];
}

/**
 * Returns a mapping of logo emoji -> player name who claimed it
 */
export function getClaimedLogos(): Map<string, string> {
  const scores = getHighScores();
  const claimed = new Map<string, string>();
  for (const entry of scores) {
    if (entry.playerLogo && !claimed.has(entry.playerLogo)) {
      claimed.set(entry.playerLogo, entry.playerName || 'Student');
    }
  }
  return claimed;
}

export function saveHighScore(
  score: number,
  longestWord: string,
  totalWords: number,
  playerName?: string,
  playerLogo?: string
): { isNewHighScore: boolean; rank: number; entryId?: string } {
  const hasPlayer = Boolean(playerName?.trim());
  if (score <= 0 && !hasPlayer) return { isNewHighScore: false, rank: -1 };

  const scores = getHighScores();
  const entry: HighScoreEntry = {
    id: 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    playerName: playerName?.trim() || undefined,
    playerLogo: playerLogo || undefined,
    score,
    longestWord: longestWord || '-',
    totalWords,
    date: new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timestamp: Date.now(),
  };

  scores.push(entry);
  scores.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
  const topScores = scores.slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topScores));
  } catch (err) {
    console.error('Failed to save high scores:', err);
  }

  const rank = topScores.findIndex((s) => s.id === entry.id);
  const isNewHighScore = rank === 0 && score > 0;

  return { isNewHighScore, rank: rank !== -1 ? rank + 1 : -1, entryId: entry.id };
}

export function clearHighScores() {
  localStorage.removeItem(STORAGE_KEY);
}
