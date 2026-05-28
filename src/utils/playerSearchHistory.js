/**
 * Recent player-name searches (device-local) for autocomplete empty states.
 */

const STORAGE_KEY = 'footycompass.playerSearchHistory';
const MAX_ENTRIES = 6;

export function recordPlayerSearchQuery(query) {
  const trimmed = String(query ?? '').trim();
  if (trimmed.length < 2) return;
  try {
    const norm = trimmed.toLowerCase();
    const existing = readRaw().filter((row) => row.query.toLowerCase() !== norm);
    const next = [{ query: trimmed, searchedAt: Date.now() }, ...existing].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // private mode / quota
  }
}

/**
 * @returns {string[]}
 */
export function getRecentPlayerSearchQueries() {
  return readRaw().map((row) => row.query);
}

function readRaw() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row) => typeof row?.query === 'string' && row.query.trim());
  } catch {
    return [];
  }
}
