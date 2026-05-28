/**
 * Autocomplete suggestion chips from existing dataset (no invented entities).
 */

import { POPULAR_SEARCHES } from './popularSearches.js';
import { getRecentPlayerSearchQueries } from './playerSearchHistory.js';
import { normalizeForSearch } from './textSearch.js';

/**
 * Top-importance players as quick-search chips.
 * @param {object[]} players
 * @param {number} [limit]
 */
export function buildPopularPlayerChips(players, limit = 8) {
  if (!Array.isArray(players) || players.length === 0) return [];

  const seen = new Set();
  const chips = [];

  for (const player of [...players].sort(
    (a, b) => (Number(b.importanceScore) || 0) - (Number(a.importanceScore) || 0),
  )) {
    if (chips.length >= limit) break;
    const label = String(player?.name ?? '').trim();
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    chips.push({ label, query: label, playerId: player.id });
  }

  return chips;
}

/**
 * @param {object[]} players
 * @param {{ includeCurated?: boolean, includeRecent?: boolean }} [opts]
 */
export function buildAutocompleteSuggestionChips(players, opts = {}) {
  const { includeCurated = true, includeRecent = true } = opts;
  const seen = new Set();
  const out = [];

  const add = (chip) => {
    const key = normalizeForSearch(chip.query || chip.label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(chip);
  };

  if (includeRecent) {
    for (const query of getRecentPlayerSearchQueries()) {
      add({ label: query, query, kind: 'recent' });
    }
  }

  for (const chip of buildPopularPlayerChips(players, 6)) {
    add({ ...chip, kind: 'trending' });
  }

  if (includeCurated) {
    for (const chip of POPULAR_SEARCHES.slice(0, 6)) {
      add({ ...chip, kind: 'popular' });
    }
  }

  return out.slice(0, 12);
}

export const SEARCH_NO_RESULTS_HINT =
  'Try a last name, nickname, or club name — or pick a suggestion below.';
