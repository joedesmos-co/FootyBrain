/**
 * Detect country-first vs club-first search intent for ranking and result grouping.
 */

import {
  getNationalTeamSearchFields,
  getTeamSearchFields,
} from './searchAliases';
import { matchScoreForFields, normalizeForSearch } from './textSearch';

const STRONG_MATCH = 85;
const SOFT_COUNTRY = 75;

/**
 * @param {string} normalizedQuery from normalizeForSearch
 * @param {{
 *   teams?: object[],
 *   nationalTeams?: object[],
 *   getLeagueName?: (id: string) => string,
 * }} ctx
 * @returns {{ kind: 'neutral' | 'country' | 'country-soft' | 'club', nationalTeamId?: string, teamId?: string, countryLabel?: string }}
 */
export function detectSearchIntent(normalizedQuery, ctx = {}) {
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return { kind: 'neutral' };
  }

  const { teams = [], nationalTeams = [], getLeagueName } = ctx;

  let bestNational = { score: 0, id: null, label: '' };
  for (const nt of nationalTeams) {
    const score = matchScoreForFields(getNationalTeamSearchFields(nt), normalizedQuery);
    if (score > bestNational.score) {
      bestNational = {
        score,
        id: nt.id,
        label: normalizeForSearch(nt.displayName),
      };
    }
    const countryScore = matchScoreForFields([nt.country], normalizedQuery);
    if (countryScore > bestNational.score) {
      bestNational = {
        score: countryScore,
        id: nt.id,
        label: normalizeForSearch(nt.country),
      };
    }
  }

  let bestTeam = { score: 0, id: null };
  for (const team of teams) {
    const score = matchScoreForFields(getTeamSearchFields(team, getLeagueName), normalizedQuery);
    if (score > bestTeam.score) {
      bestTeam = { score, id: team.id };
    }
  }

  if (bestNational.score >= STRONG_MATCH && bestNational.score >= bestTeam.score + 5) {
    return {
      kind: 'country',
      nationalTeamId: bestNational.id,
      countryLabel: bestNational.label,
    };
  }

  if (bestTeam.score >= STRONG_MATCH) {
    return { kind: 'club', teamId: bestTeam.id };
  }

  if (
    bestNational.score >= SOFT_COUNTRY &&
    normalizedQuery.length >= 4 &&
    bestNational.score >= bestTeam.score
  ) {
    return {
      kind: 'country-soft',
      nationalTeamId: bestNational.id,
      countryLabel: bestNational.label,
    };
  }

  return { kind: 'neutral' };
}

/**
 * @param {object} player
 * @param {ReturnType<typeof detectSearchIntent>} intent
 * @param {(id: string) => { nationalTeamId?: string } | null} getMembershipForPlayer
 */
export function scorePlayerIntentBoost(player, intent, getMembershipForPlayer) {
  if (!player || intent.kind === 'neutral') return 0;

  if (intent.kind === 'club' && intent.teamId && player.teamId === intent.teamId) {
    return 20;
  }

  if (
    (intent.kind === 'country' || intent.kind === 'country-soft') &&
    intent.nationalTeamId
  ) {
    const membership = getMembershipForPlayer?.(player.id);
    if (membership?.nationalTeamId === intent.nationalTeamId) return 18;

    const nation = normalizeForSearch(player.nationalTeam || player.nationality || '');
    const label = intent.countryLabel ?? '';
    if (label && nation) {
      if (nation === label) return 14;
      if (nation.includes(label) || label.includes(nation)) return 10;
    }
  }

  return 0;
}

/** Group order for universal search modal. */
export function getSearchGroupOrder(intent) {
  if (intent.kind === 'country' || intent.kind === 'country-soft') {
    return ['national-team', 'player', 'team', 'league'];
  }
  if (intent.kind === 'club') {
    return ['team', 'player', 'national-team', 'league'];
  }
  return ['player', 'team', 'league', 'national-team'];
}
