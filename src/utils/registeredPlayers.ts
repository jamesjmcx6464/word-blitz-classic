import { getHighScores } from './highScores';

export interface RegisteredPlayer {
  id: string;
  name: string;
  logo: string;
  createdAt: number;
  lastPlayedAt: number;
  gamesPlayed: number;
  bestScore: number;
}

const PLAYERS_STORAGE_KEY = 'word_blitz_registered_players_v1';

function readStoredPlayers(): RegisteredPlayer[] {
  try {
    const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (p) =>
          p &&
          typeof p === 'object' &&
          typeof p.name === 'string' &&
          p.name.trim().length > 0 &&
          typeof p.logo === 'string' &&
          p.logo.length > 0
      );
    }
  } catch (err) {
    console.error('Failed to read registered players:', err);
  }
  return [];
}

const DELETED_STORAGE_KEY = 'word_blitz_deleted_players_v1';

function playerKey(name: string, logo: string): string {
  return `${name.trim().toLowerCase()}::${logo}`;
}

function readDeletedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) return new Set(parsed.filter((k) => typeof k === 'string'));
  } catch {
    /* ignore */
  }
  return new Set();
}

function writeDeletedKeys(keys: Set<string>): void {
  try {
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(Array.from(keys)));
  } catch (err) {
    console.error('Failed to save deleted players:', err);
  }
}

/** Re-registering a deleted name + logo brings the player back. */
function undelete(name: string, logo: string): void {
  const keys = readDeletedKeys();
  if (keys.delete(playerKey(name, logo))) writeDeletedKeys(keys);
}

/**
 * Removes a Solo player from the picker and frees their logo.
 * Their past leaderboard scores stay (reset a leaderboard section to clear those).
 */
export function deleteRegisteredPlayer(player: { name: string; logo: string }): void {
  const key = playerKey(player.name, player.logo);
  writeStoredPlayers(readStoredPlayers().filter((p) => playerKey(p.name, p.logo) !== key));
  const keys = readDeletedKeys();
  keys.add(key);
  writeDeletedKeys(keys);
}

function writeStoredPlayers(players: RegisteredPlayer[]): void {
  try {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  } catch (err) {
    console.error('Failed to save registered players:', err);
  }
}

/**
 * Returns all registered Solo players, backfilling any existing Solo leaderboard entries
 * so previously played students also appear in the player picker carousel.
 */
export function getRegisteredPlayers(): RegisteredPlayer[] {
  const deleted = readDeletedKeys();
  const players = readStoredPlayers().filter((p) => !deleted.has(playerKey(p.name, p.logo)));
  const byKey = new Map<string, RegisteredPlayer>();
  for (const p of players) {
    const key = `${p.name.trim().toLowerCase()}::${p.logo}`;
    byKey.set(key, p);
  }

  let updated = false;
  const soloScores = getHighScores().filter((s) => s.mode === 'solo' && s.playerName && s.playerLogo);
  for (const entry of soloScores) {
    const cleanName = entry.playerName!.trim();
    const logo = entry.playerLogo!;
    const key = `${cleanName.toLowerCase()}::${logo}`;
    if (deleted.has(key)) continue;
    const existing = byKey.get(key);
    if (!existing) {
      const created: RegisteredPlayer = {
        id: 'player_' + entry.timestamp + '_' + Math.random().toString(36).substring(2, 6),
        name: cleanName,
        logo,
        createdAt: entry.timestamp || Date.now(),
        lastPlayedAt: entry.timestamp || Date.now(),
        gamesPlayed: 1,
        bestScore: entry.score,
      };
      byKey.set(key, created);
      updated = true;
    } else if (entry.score > existing.bestScore) {
      existing.bestScore = entry.score;
      updated = true;
    }
  }

  const list = Array.from(byKey.values()).sort(
    (a, b) => (b.lastPlayedAt || b.createdAt) - (a.lastPlayedAt || a.createdAt)
  );

  if (updated) {
    writeStoredPlayers(list);
  }

  return list;
}

/**
 * Registers a new Solo player or updates lastPlayedAt for an existing player.
 */
export function registerOrSelectPlayer(name: string, logo: string): RegisteredPlayer {
  const cleanName = name.trim();
  undelete(cleanName, logo);
  const players = getRegisteredPlayers();
  const now = Date.now();

  const existingIdx = players.findIndex(
    (p) => p.name.toLowerCase() === cleanName.toLowerCase() && p.logo === logo
  );

  if (existingIdx !== -1) {
    const updatedPlayer: RegisteredPlayer = {
      ...players[existingIdx],
      lastPlayedAt: now,
    };
    const next = [...players];
    next[existingIdx] = updatedPlayer;
    writeStoredPlayers(next);
    return updatedPlayer;
  }

  const newPlayer: RegisteredPlayer = {
    id: 'player_' + now + '_' + Math.random().toString(36).substring(2, 6),
    name: cleanName,
    logo,
    createdAt: now,
    lastPlayedAt: now,
    gamesPlayed: 0,
    bestScore: 0,
  };

  writeStoredPlayers([newPlayer, ...players]);
  return newPlayer;
}

/**
 * Updates stats for a Solo player after completing a round.
 */
export function recordSoloPlayerResult(name: string, logo: string, score: number): void {
  const cleanName = name.trim();
  if (!cleanName || !logo) return;
  undelete(cleanName, logo);

  const players = getRegisteredPlayers();
  const now = Date.now();
  const idx = players.findIndex(
    (p) => p.name.toLowerCase() === cleanName.toLowerCase() && p.logo === logo
  );

  if (idx !== -1) {
    const cur = players[idx];
    const next = [...players];
    next[idx] = {
      ...cur,
      lastPlayedAt: now,
      gamesPlayed: (cur.gamesPlayed || 0) + 1,
      bestScore: Math.max(cur.bestScore || 0, score),
    };
    writeStoredPlayers(next);
  } else {
    writeStoredPlayers([
      {
        id: 'player_' + now + '_' + Math.random().toString(36).substring(2, 6),
        name: cleanName,
        logo,
        createdAt: now,
        lastPlayedAt: now,
        gamesPlayed: 1,
        bestScore: score,
      },
      ...players,
    ]);
  }
}

/**
 * Returns combined map of logo emoji -> student name for all claimed Solo logos
 * (both registered players and Solo leaderboard entries).
 */
export function getClaimedLogos(): Map<string, string> {
  const deleted = readDeletedKeys();
  const claimed = new Map<string, string>();
  for (const entry of getHighScores()) {
    if (entry.mode !== 'solo' || !entry.playerLogo || claimed.has(entry.playerLogo)) continue;
    const name = entry.playerName || 'Student';
    if (deleted.has(playerKey(name, entry.playerLogo))) continue;
    claimed.set(entry.playerLogo, name);
  }
  const players = getRegisteredPlayers();
  for (const p of players) {
    if (p.logo && !claimed.has(p.logo)) {
      claimed.set(p.logo, p.name);
    }
  }
  return claimed;
}
