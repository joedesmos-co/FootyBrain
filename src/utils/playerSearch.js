/**
 * Accent-insensitive player name search for Browse and Quiz autocomplete.
 */

import { getMembershipForPlayer } from '../data/nationalTeamData';
import { getPlayerAliases, getPlayerSearchFields } from './searchAliases';
import { detectSearchIntent, scorePlayerIntentBoost } from './searchIntent';
import {
  getPlayerSearchCandidates,
  playerSearchQuickScoreForEntry,
} from './playerSearchIndex';
import {
  rankPlayerSearchResult,
  sortPlayerSearchResults,
} from './playerSearchRanking.js';
import { matchScoreForFields, normalizeForSearch, typoToleranceScore } from './textSearch';

export { normalizeForSearch } from './textSearch';

const SCOPED_LINEAR_SCAN_MAX = 150;

function scoreSingleTokenQuick(player, normalizedQuery) {
  if (!normalizedQuery) return 0;

  const name = normalizeForSearch(player.name);
  let best = 0;
  if (name === normalizedQuery) best = 100;
  else if (name.startsWith(normalizedQuery)) best = 90;
  else {
    const parts = name.split(' ');
    if (parts.some((part) => part === normalizedQuery)) best = 85;
    else if (parts.some((part) => part.startsWith(normalizedQuery))) best = 75;
    else {
      const last = parts[parts.length - 1];
      if (last === normalizedQuery) best = 80;
      else if (last?.startsWith(normalizedQuery)) best = 70;
      else if (normalizedQuery.length >= 3 && name.includes(normalizedQuery)) best = 60;
    }
  }

  if (best > 0) return best;

  for (const alias of getPlayerAliases(player.id)) {
    const score = matchScoreForFields([alias], normalizedQuery);
    if (score > best) best = score;
  }

  if (best === 0 && normalizedQuery.length >= 3) {
    const nameTypo = typoToleranceScore(name, normalizedQuery);
    if (nameTypo > best) best = nameTypo;
    const last = name.split(' ').pop();
    if (last) {
      const lastTypo = typoToleranceScore(last, normalizedQuery);
      if (lastTypo > best) best = lastTypo;
    }
  }

  return best;
}

/** Cheap gate before building full alias/team/league search fields. */
export function playerSearchQuickScore(player, normalizedQuery) {
  if (!normalizedQuery) return 0;
  const tokens = normalizedQuery.split(' ').filter((t) => t.length >= 2);
  if (tokens.length <= 1) {
    return scoreSingleTokenQuick(player, normalizedQuery);
  }
  let min = 100;
  for (const token of tokens) {
    const tokenScore = scoreSingleTokenQuick(player, token);
    if (tokenScore === 0) return 0;
    min = Math.min(min, tokenScore);
  }
  return Math.min(92, min + 6);
}

function rankingContext(entryOrPlayer, normalizedQuery, helpers, intent) {
  const player = entryOrPlayer.player ?? entryOrPlayer;
  const teamName =
    player.teamName ?? player._teamName ?? helpers.getTeamName?.(player.teamId) ?? '';
  const leagueName =
    player.leagueName ?? helpers.getLeagueName?.(player.leagueId) ?? '';
  return {
    normalizedQuery,
    intent,
    clubNameNorm: normalizeForSearch(teamName),
    leagueNameNorm: normalizeForSearch(leagueName),
  };
}

function scorePlayerMatch(player, normalizedQuery, helpers, intent) {
  let score = playerSearchQuickScore(player, normalizedQuery);
  if (score === 0) {
    score = matchScoreForFields(getPlayerSearchFields(player, helpers), normalizedQuery);
  }
  if (score <= 0) return 0;
  const intentBoost = scorePlayerIntentBoost(player, intent, getMembershipForPlayer);
  return rankPlayerSearchResult(score + intentBoost, player, rankingContext(player, normalizedQuery, helpers, intent));
}

function scoreIndexedPlayerMatch(entry, normalizedQuery, helpers, intent) {
  let score = playerSearchQuickScoreForEntry(entry, normalizedQuery);
  if (score === 0) {
    score = matchScoreForFields(getPlayerSearchFields(entry.player, helpers), normalizedQuery);
  }
  if (score <= 0) return 0;
  const intentBoost = scorePlayerIntentBoost(entry.player, intent, getMembershipForPlayer);
  const ctx = rankingContext(entry, normalizedQuery, helpers, intent);
  if (entry.teamNameNorm) ctx.clubNameNorm = entry.teamNameNorm;
  if (entry.leagueNameNorm) ctx.leagueNameNorm = entry.leagueNameNorm;
  return rankPlayerSearchResult(score + intentBoost, entry.player, ctx);
}

/**
 * @param {Array} players
 * @param {string} query
 * @param {{
 *   limit?: number,
 *   excludeIds?: string[],
 *   getTeamName?: (id: string) => string,
 *   getLeagueName?: (id: string) => string,
 * }} [options]
 */
export function searchPlayers(players, query, options = {}) {
  const {
    limit = 8,
    excludeIds = [],
    getTeamName,
    getLeagueName,
    intent: intentOverride,
    intentContext,
  } = options;
  const trimmed = query.trim();
  if (!trimmed) return [];

  const normalizedQuery = normalizeForSearch(trimmed);
  const intent =
    intentOverride ??
    (intentContext ? detectSearchIntent(normalizedQuery, intentContext) : { kind: 'neutral' });
  const excluded = new Set(excludeIds);
  const helpers = { getTeamName, getLeagueName };
  const scored = [];
  const registryPool = players;
  const useIndex = registryPool.length > SCOPED_LINEAR_SCAN_MAX;

  if (useIndex) {
    for (const entry of getPlayerSearchCandidates(registryPool, normalizedQuery)) {
      if (excluded.has(entry.player.id)) continue;

      const score = scoreIndexedPlayerMatch(entry, normalizedQuery, helpers, intent);
      if (score > 0) scored.push({ player: entry.player, score });
    }
  } else {
    for (const player of players) {
      if (excluded.has(player.id)) continue;

      const score = scorePlayerMatch(player, normalizedQuery, helpers, intent);
      if (score > 0) scored.push({ player, score });
    }
  }

  return sortPlayerSearchResults(scored)
    .slice(0, limit)
    .map(({ player }) => player);
}

/** Max browse grid matches — avoids scoring/sorting thousands of rows on each keystroke. */
export const BROWSE_SEARCH_RESULT_CAP = 100;

/** Rank matching players by relevance for browse grids (capped for scale). */
export function orderPlayersByQuery(players, query, helpers = {}) {
  const trimmed = query.trim();
  if (!trimmed) return players;
  const limit =
    typeof helpers.limit === 'number' ? helpers.limit : BROWSE_SEARCH_RESULT_CAP;
  return searchPlayers(players, trimmed, { ...helpers, limit });
}

export function playerMatchesQuery(player, query, helpers = {}) {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const normalizedQuery = normalizeForSearch(trimmed);
  if (playerSearchQuickScore(player, normalizedQuery) > 0) return true;
  return matchScoreForFields(getPlayerSearchFields(player, helpers), normalizedQuery) > 0;
}
