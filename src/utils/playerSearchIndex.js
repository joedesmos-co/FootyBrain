/**
 * Precomputed player name index for universal search and large browse scans.
 * Built once per players[] reference — avoids re-normalizing 2k+ names per keystroke.
 */

import { normalizeForSearch } from './textSearch';

/** @typedef {{ player: object, normalizedName: string, parts: string[], lastName: string }} PlayerSearchEntry */

/** @type {WeakMap<object, { entries: PlayerSearchEntry[], prefixMap: Map<string, PlayerSearchEntry[]> }>} */
const indexByPlayersRef = new WeakMap();

function buildEntry(player) {
  const normalizedName = normalizeForSearch(player.name);
  const parts = normalizedName.split(' ').filter(Boolean);
  return {
    player,
    normalizedName,
    parts,
    lastName: parts[parts.length - 1] ?? '',
  };
}

function addToPrefixMap(prefixMap, prefix, entry) {
  if (prefix.length < 2) return;
  let bucket = prefixMap.get(prefix);
  if (!bucket) {
    bucket = [];
    prefixMap.set(prefix, bucket);
  }
  if (bucket[bucket.length - 1]?.player.id !== entry.player.id) {
    bucket.push(entry);
  }
}

/**
 * @param {object[]} players
 */
export function getPlayerSearchIndex(players) {
  let cached = indexByPlayersRef.get(players);
  if (cached) return cached;

  const entries = [];
  const prefixMap = new Map();

  for (const player of players) {
    const entry = buildEntry(player);
    entries.push(entry);

    const tokens = new Set([entry.normalizedName, ...entry.parts]);
    for (const token of tokens) {
      const maxLen = Math.min(token.length, 3);
      for (let len = 2; len <= maxLen; len += 1) {
        addToPrefixMap(prefixMap, token.slice(0, len), entry);
      }
    }
  }

  cached = { entries, prefixMap };
  indexByPlayersRef.set(players, cached);
  return cached;
}

const FULL_SCAN_FALLBACK = 500;

/**
 * Narrow player candidates before scoring (full registry only).
 * @param {object[]} players — full `players` export from sampleData
 * @param {string} normalizedQuery
 * @returns {PlayerSearchEntry[]}
 */
export function getPlayerSearchCandidates(players, normalizedQuery) {
  const { entries, prefixMap } = getPlayerSearchIndex(players);
  if (!normalizedQuery || normalizedQuery.length < 2) return entries;

  const prefixKey = normalizedQuery.slice(0, Math.min(3, normalizedQuery.length));
  const bucket = prefixMap.get(prefixKey);
  if (bucket && bucket.length > 0 && bucket.length <= FULL_SCAN_FALLBACK) {
    return bucket;
  }

  return entries;
}

/** Quick score using a precomputed entry (same rules as playerSearchQuickScore). */
export function playerSearchQuickScoreForEntry(entry, normalizedQuery) {
  if (!normalizedQuery) return 0;

  const name = entry.normalizedName;
  let best = 0;
  if (name === normalizedQuery) best = 100;
  else if (name.startsWith(normalizedQuery)) best = 90;
  else {
    const parts = entry.parts;
    if (parts.some((part) => part === normalizedQuery)) best = 85;
    else if (parts.some((part) => part.startsWith(normalizedQuery))) best = 75;
    else {
      const last = entry.lastName;
      if (last === normalizedQuery) best = 80;
      else if (last.startsWith(normalizedQuery)) best = 70;
      else if (normalizedQuery.length >= 3 && name.includes(normalizedQuery)) best = 60;
    }
  }

  return best;
}
