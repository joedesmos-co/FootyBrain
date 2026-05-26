/**
 * Accent-insensitive team search for compare and filters.
 */

import { getTeamSearchFields } from './searchAliases';
import { matchScoreForFields, normalizeForSearch } from './textSearch';
import { getTeamSearchCandidates } from './entitySearchIndex';

/**
 * @param {Array} teams
 * @param {string} query
 * @param {{
 *   limit?: number,
 *   excludeIds?: string[],
 *   getLeagueName: (id: string) => string,
 * }} options
 */
export function searchTeams(teams, query, options) {
  const { limit = 8, excludeIds = [], getLeagueName } = options;
  const trimmed = query.trim();
  if (!trimmed) return [];

  const excluded = new Set(excludeIds);
  const normalizedQuery = normalizeForSearch(trimmed);
  const candidates = getTeamSearchCandidates(teams, normalizedQuery, getLeagueName);

  return candidates
    .filter((team) => !excluded.has(team.id))
    .map((team) => ({
      team,
      score: matchScoreForFields(getTeamSearchFields(team, getLeagueName), trimmed),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ team }) => team);
}
