/**
 * Precomputed player name index for universal search and large browse scans.
 * Built once per players[] reference — avoids re-normalizing 2k+ names per keystroke.
 */

import { getPlayerAliases } from './searchAliases.js';
import { compactForSearch, normalizeForSearch, typoToleranceScore } from './textSearch';

/** @typedef {{ player: object, normalizedName: string, parts: string[], lastName: string, aliasNorms: string[] }} PlayerSearchEntry */

/** @type {WeakMap<object, { entries: PlayerSearchEntry[], prefixMap: Map<string, PlayerSearchEntry[]> }>} */
const indexByPlayersRef = new WeakMap();

function playerAliasList(player) {
  return [...getPlayerAliases(player.id), ...(player.aliases ?? [])];
}

function buildEntry(player) {
  const normalizedName = normalizeForSearch(player.name);
  const parts = normalizedName.split(' ').filter(Boolean);
  const aliasNorms = playerAliasList(player)
    .map((alias) => normalizeForSearch(alias))
    .filter(Boolean);
  return {
    player,
    normalizedName,
    parts,
    lastName: parts[parts.length - 1] ?? '',
    aliasNorms,
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

function indexTokens(prefixMap, entry, tokens) {
  for (const token of tokens) {
    if (!token) continue;
    const maxLen = Math.min(token.length, 4);
    for (let len = 2; len <= maxLen; len += 1) {
      addToPrefixMap(prefixMap, token.slice(0, len), entry);
    }
    const compact = token.replace(/ /g, '');
    if (compact.length >= 2 && compact !== token) {
      for (let len = 2; len <= Math.min(compact.length, 4); len += 1) {
        addToPrefixMap(prefixMap, compact.slice(0, len), entry);
      }
    }
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

    const tokens = new Set([
      entry.normalizedName,
      ...entry.parts,
      ...entry.aliasNorms,
      ...entry.aliasNorms.map(compactForSearch).filter((c) => c.length >= 2),
    ]);
    if (entry.parts.length >= 2) {
      const initials = entry.parts.map((part) => part[0]).join('');
      if (initials.length >= 2) tokens.add(initials);
      const firstInitialLast = `${entry.parts[0][0] ?? ''}${entry.lastName}`.trim();
      if (firstInitialLast.length >= 3) tokens.add(firstInitialLast);
    }
    indexTokens(prefixMap, entry, tokens);
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

  const compact = compactForSearch(normalizedQuery);
  const prefixKeys = new Set([
    normalizedQuery.slice(0, Math.min(4, normalizedQuery.length)),
    compact.slice(0, Math.min(4, compact.length)),
  ]);

  const merged = [];
  const seen = new Set();
  for (const prefixKey of prefixKeys) {
    const bucket = prefixMap.get(prefixKey);
    if (!bucket) continue;
    for (const entry of bucket) {
      if (seen.has(entry.player.id)) continue;
      seen.add(entry.player.id);
      merged.push(entry);
    }
  }

  if (merged.length > 0 && merged.length <= FULL_SCAN_FALLBACK) {
    return merged;
  }

  return entries;
}

function scoreAliasNorms(aliasNorms, normalizedQuery) {
  let best = 0;
  for (const alias of aliasNorms) {
    if (alias === normalizedQuery) best = Math.max(best, 96);
    else if (alias.startsWith(normalizedQuery)) best = Math.max(best, 88);
    else if (normalizedQuery.length >= 3 && alias.includes(normalizedQuery)) {
      best = Math.max(best, 72);
    }
    const aliasCompact = alias.replace(/ /g, '');
    const qCompact = compactForSearch(normalizedQuery);
    if (qCompact.length >= 2) {
      if (aliasCompact === qCompact) best = Math.max(best, 98);
      else if (aliasCompact.startsWith(qCompact)) best = Math.max(best, 90);
    }
  }
  return best;
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

  const aliasScore = scoreAliasNorms(entry.aliasNorms, normalizedQuery);
  if (aliasScore > best) best = aliasScore;

  if (best === 0 && normalizedQuery.length >= 3) {
    const nameTypo = typoToleranceScore(name, normalizedQuery);
    if (nameTypo > best) best = nameTypo;
    for (const alias of entry.aliasNorms) {
      const aliasTypo = typoToleranceScore(alias, normalizedQuery);
      if (aliasTypo > best) best = aliasTypo;
    }
  }

  const nameCompact = name.replace(/ /g, '');
  const qCompact = compactForSearch(normalizedQuery);
  if (best < 90 && qCompact.length >= 2) {
    if (nameCompact === qCompact) best = Math.max(best, 98);
    else if (nameCompact.startsWith(qCompact)) best = Math.max(best, 92);
    else if (qCompact.length >= 3 && nameCompact.includes(qCompact)) best = Math.max(best, 65);
  }

  if (best < 85 && entry.parts.length >= 2) {
    const initials = entry.parts.map((part) => part[0]).join('');
    if (initials === normalizedQuery || initials === qCompact) best = Math.max(best, 82);
    const firstInitialLast = `${entry.parts[0][0] ?? ''}${entry.lastName}`;
    if (
      firstInitialLast === normalizedQuery ||
      firstInitialLast.startsWith(normalizedQuery) ||
      firstInitialLast.startsWith(qCompact)
    ) {
      best = Math.max(best, 78);
    }
  }

  return best;
}
