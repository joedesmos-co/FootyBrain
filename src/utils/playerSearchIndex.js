/**
 * Precomputed player name index for universal search and large browse scans.
 * Built once per players[] reference — avoids re-normalizing 2k+ names per keystroke.
 */

import { getPlayerAliases } from './searchAliases.js';
import { compactForSearch, normalizeForSearch, typoToleranceScore } from './textSearch';

/** @typedef {{ player: object, normalizedName: string, parts: string[], lastName: string, aliasNorms: string[], teamNameNorm: string, leagueNameNorm: string }} PlayerSearchEntry */

/** @type {WeakMap<object, { entries: PlayerSearchEntry[], prefixMap: Map<string, PlayerSearchEntry[]>, importanceSorted: PlayerSearchEntry[] }>} */
const indexByPlayersRef = new WeakMap();

const MAX_CANDIDATES = 450;
const PREFIX_BUCKET_CAP = 500;
const IMPORTANCE_SCAN_CAP = 1400;

function playerAliasList(player) {
  return [...getPlayerAliases(player.id), ...(player.aliases ?? [])];
}

function buildEntry(player) {
  const normalizedName = normalizeForSearch(player.name);
  const parts = normalizedName.split(' ').filter(Boolean);
  const aliasNorms = playerAliasList(player)
    .map((alias) => normalizeForSearch(alias))
    .filter(Boolean);
  const teamNameNorm = normalizeForSearch(player.teamName ?? player._teamName ?? '');
  const leagueNameNorm = normalizeForSearch(player.leagueName ?? '');
  return {
    player,
    normalizedName,
    parts,
    lastName: parts[parts.length - 1] ?? '',
    aliasNorms,
    teamNameNorm,
    leagueNameNorm,
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
    if (entry.teamNameNorm) tokens.add(entry.teamNameNorm);
    if (entry.leagueNameNorm) tokens.add(entry.leagueNameNorm);
    if (entry.parts.length >= 2) {
      const initials = entry.parts.map((part) => part[0]).join('');
      if (initials.length >= 2) tokens.add(initials);
      const firstInitialLast = `${entry.parts[0][0] ?? ''}${entry.lastName}`.trim();
      if (firstInitialLast.length >= 3) tokens.add(firstInitialLast);
    }
    indexTokens(prefixMap, entry, tokens);
  }

  const importanceSorted = [...entries].sort(
    (a, b) =>
      (Number(b.player.importanceScore) || 0) - (Number(a.player.importanceScore) || 0),
  );

  cached = { entries, prefixMap, importanceSorted };
  indexByPlayersRef.set(players, cached);
  return cached;
}

function mergePrefixBuckets(prefixMap, keys, merged, seen) {
  for (const prefixKey of keys) {
    const bucket = prefixMap.get(prefixKey);
    if (!bucket) continue;
    for (const entry of bucket) {
      if (seen.has(entry.player.id)) continue;
      seen.add(entry.player.id);
      merged.push(entry);
    }
  }
}

function prefixKeysForToken(token) {
  const compact = compactForSearch(token);
  return [
    token.slice(0, Math.min(4, token.length)),
    compact.slice(0, Math.min(4, compact.length)),
  ].filter((key) => key.length >= 2);
}

function capCandidatesByImportance(merged) {
  if (merged.length <= MAX_CANDIDATES) return merged;
  merged.sort(
    (a, b) =>
      (Number(b.player.importanceScore) || 0) - (Number(a.player.importanceScore) || 0),
  );
  return merged.slice(0, MAX_CANDIDATES);
}

/**
 * Narrow player candidates before scoring (full registry only).
 * @param {object[]} players — full `players` export from sampleData
 * @param {string} normalizedQuery
 * @returns {PlayerSearchEntry[]}
 */
export function getPlayerSearchCandidates(players, normalizedQuery) {
  const { entries, prefixMap, importanceSorted } = getPlayerSearchIndex(players);
  if (!normalizedQuery || normalizedQuery.length < 2) return entries;

  const tokens = normalizedQuery.split(' ').filter((t) => t.length >= 2);
  const merged = [];
  const seen = new Set();

  if (tokens.length > 1) {
    for (const token of tokens) {
      mergePrefixBuckets(prefixMap, prefixKeysForToken(token), merged, seen);
    }
  } else {
    mergePrefixBuckets(prefixMap, prefixKeysForToken(normalizedQuery), merged, seen);
  }

  if (merged.length === 0 || merged.length > PREFIX_BUCKET_CAP) {
    const compactQ = compactForSearch(normalizedQuery);
    let scanned = 0;
    for (const entry of importanceSorted) {
      if (scanned >= IMPORTANCE_SCAN_CAP && merged.length >= MAX_CANDIDATES) break;
      scanned += 1;
      if (seen.has(entry.player.id)) continue;

      const quick = playerSearchQuickScoreForEntry(entry, normalizedQuery);
      if (quick > 0) {
        seen.add(entry.player.id);
        merged.push(entry);
        continue;
      }

      if (normalizedQuery.length >= 3) {
        const lastTypo = typoToleranceScore(entry.lastName, normalizedQuery);
        const nameTypo = typoToleranceScore(entry.normalizedName, normalizedQuery);
        if (lastTypo > 0 || nameTypo > 0) {
          seen.add(entry.player.id);
          merged.push(entry);
          continue;
        }
      }

      if (compactQ.length >= 3 && entry.teamNameNorm.includes(compactQ)) {
        seen.add(entry.player.id);
        merged.push(entry);
      }
    }
  }

  return capCandidatesByImportance(merged);
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

function scoreSingleTokenForEntry(entry, normalizedQuery) {
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
    if (entry.lastName.length >= 3) {
      const lastTypo = typoToleranceScore(entry.lastName, normalizedQuery);
      if (lastTypo > best) best = lastTypo;
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

  if (normalizedQuery.length >= 3) {
    if (entry.teamNameNorm.includes(normalizedQuery)) best = Math.max(best, 68);
    if (entry.leagueNameNorm.includes(normalizedQuery)) best = Math.max(best, 62);
  }

  return best;
}

/** Quick score using a precomputed entry (same rules as playerSearchQuickScore). */
export function playerSearchQuickScoreForEntry(entry, normalizedQuery) {
  const tokens = normalizedQuery.split(' ').filter((t) => t.length >= 2);
  if (tokens.length <= 1) {
    return scoreSingleTokenForEntry(entry, normalizedQuery);
  }

  let min = 100;
  for (const token of tokens) {
    const tokenScore = scoreSingleTokenForEntry(entry, token);
    if (tokenScore === 0) return 0;
    min = Math.min(min, tokenScore);
  }
  return Math.min(92, min + 6);
}
