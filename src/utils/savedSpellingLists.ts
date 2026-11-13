export interface SavedSpellingList {
  id: string;
  name: string;
  words: string;
  updatedAt: number;
}

export interface UiPrefs {
  showSpellingList: boolean;
}

const SAVED_LISTS_STORAGE_KEY = 'word_blitz_saved_spelling_lists';
const UI_PREFS_STORAGE_KEY = 'word_blitz_ui_prefs';

const DEFAULT_UI_PREFS: UiPrefs = {
  showSpellingList: true,
};

/**
 * Loads saved spelling lists from localStorage (max 10, newest first).
 */
export function loadSavedLists(): SavedSpellingList[] {
  try {
    const raw = localStorage.getItem(SAVED_LISTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 10);
    }
    return [];
  } catch (err) {
    console.error('Failed to load saved spelling lists:', err);
    return [];
  }
}

/**
 * Saves a new or updated spelling list. Prepends to front, capped at 10 items.
 */
export function saveList(name: string, words: string): SavedSpellingList[] {
  try {
    const current = loadSavedLists();
    const cleanName = (name && name.trim()) || `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const cleanWords = (words || '').trim();

    const newItem: SavedSpellingList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      words: cleanWords,
      updatedAt: Date.now(),
    };

    const updated = [newItem, ...current.filter((item) => item.name.toLowerCase() !== cleanName.toLowerCase())].slice(0, 10);
    localStorage.setItem(SAVED_LISTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save spelling list:', err);
    return [];
  }
}

/**
 * Deletes a list by id. Returns remaining lists and the deleted list (for undo support).
 */
export function deleteList(id: string): { remaining: SavedSpellingList[]; deleted: SavedSpellingList | null } {
  try {
    const current = loadSavedLists();
    const deleted = current.find((item) => item.id === id) || null;
    const remaining = current.filter((item) => item.id !== id);
    localStorage.setItem(SAVED_LISTS_STORAGE_KEY, JSON.stringify(remaining));
    return { remaining, deleted };
  } catch (err) {
    console.error('Failed to delete spelling list:', err);
    return { remaining: [], deleted: null };
  }
}

/**
 * Restores a deleted list back to the saved lists (e.g. on Undo).
 */
export function restoreList(list: SavedSpellingList): SavedSpellingList[] {
  try {
    const current = loadSavedLists();
    const updated = [list, ...current.filter((item) => item.id !== list.id)].slice(0, 10);
    localStorage.setItem(SAVED_LISTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to restore spelling list:', err);
    return [];
  }
}

/**
 * Loads UI preferences like showSpellingList (defaults to true).
 */
export function getUiPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(UI_PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_UI_PREFS };
    const parsed = JSON.parse(raw);
    return {
      showSpellingList: typeof parsed?.showSpellingList === 'boolean' ? parsed.showSpellingList : true,
    };
  } catch (err) {
    console.error('Failed to get UI prefs:', err);
    return { ...DEFAULT_UI_PREFS };
  }
}

/**
 * Updates UI preferences.
 */
export function setUiPrefs(prefs: Partial<UiPrefs>): UiPrefs {
  try {
    const current = getUiPrefs();
    const updated = { ...current, ...prefs };
    localStorage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to set UI prefs:', err);
    return { ...DEFAULT_UI_PREFS };
  }
}
