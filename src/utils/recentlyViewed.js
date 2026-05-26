/**
 * Recently viewed profiles (localStorage, device-only).
 */

const STORAGE_KEY = 'footybrain.recentlyViewed';
const MAX_ENTRIES = 8;

/** @typedef {'player' | 'team' | 'league' | 'national-team'} RecentViewType */

/**
 * @param {{ type: RecentViewType, id: string }} entry
 */
export function recordRecentView(entry) {
  if (!entry?.type || !entry?.id) return;
  try {
    const existing = readRaw().filter(
      (row) => !(row.type === entry.type && row.id === entry.id),
    );
    const next = [{ type: entry.type, id: entry.id, viewedAt: Date.now() }, ...existing].slice(
      0,
      MAX_ENTRIES,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota / private mode errors.
  }
}

/**
 * @returns {Array<{ type: RecentViewType, id: string, viewedAt: number }>}
 */
export function getRecentViews() {
  return readRaw();
}

function readRaw() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row?.type && row?.id)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}
