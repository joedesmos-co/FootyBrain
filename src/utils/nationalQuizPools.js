/**
 * National-team quiz session pools — no worldCupHubData / collections imports.
 */

import {
  COUNTRY_SESSION_POOL_CAP,
  INTERNATIONAL_PER_NATION_CAP,
  INTERNATIONAL_UNION_POOL_CAP,
} from '../data/worldCupQuizConstants';
import {
  getNationalTeamById,
  getNationalTeamQuizReadyCount,
  getQuizEligiblePlayersForNationalTeam,
  getViableLiveNationalTeams,
} from '../data/nationalTeamData';
import { isQuizEligiblePlayer } from './quizPlayerRules';

/** Matches `QUIZ_MIN_SESSION_POOL` in quizSession.js — avoid circular import. */
const QUIZ_MIN_SESSION_POOL = 3;

/**
 * @typedef {{
 *   nationalTeamId: string,
 *   displayName: string,
 *   quizReadyCount: number,
 *   sessionCap: number,
 *   isViable: boolean,
 * }} CountryQuizPoolMeta
 */

function capSessionPool(eligiblePlayers, cap) {
  return eligiblePlayers.slice(0, cap);
}

/**
 * @param {string} nationalTeamId
 * @returns {CountryQuizPoolMeta | null}
 */
export function getCountryQuizPoolMeta(nationalTeamId) {
  const nationalTeam = getNationalTeamById(nationalTeamId);
  if (!nationalTeam) return null;

  const quizReadyCount = getNationalTeamQuizReadyCount(nationalTeamId);
  const sessionCap = Math.min(quizReadyCount, COUNTRY_SESSION_POOL_CAP);

  return {
    nationalTeamId,
    displayName: nationalTeam.displayName,
    quizReadyCount,
    sessionCap,
    isViable: quizReadyCount >= QUIZ_MIN_SESSION_POOL,
  };
}

/**
 * Curated country session pool — quiz-ready only, capped by importance order.
 * @param {string} nationalTeamId
 */
export function getCountryQuizSessionPool(nationalTeamId) {
  const eligible = getQuizEligiblePlayersForNationalTeam(nationalTeamId);
  return capSessionPool(eligible, COUNTRY_SESSION_POOL_CAP);
}

/**
 * International-only union across viable live nations (deduped, capped per nation + total).
 */
export function getViableCountryQuizPoolMetas() {
  return getViableLiveNationalTeams()
    .map((team) => getCountryQuizPoolMeta(team.id))
    .filter((meta) => meta?.isViable);
}

export function getInternationalQuizSessionPool() {
  const byPlayerId = new Map();

  for (const { id: nationalTeamId } of getViableLiveNationalTeams()) {
    const meta = getCountryQuizPoolMeta(nationalTeamId);
    if (!meta?.isViable) continue;

    const slice = getCountryQuizSessionPool(nationalTeamId).slice(0, INTERNATIONAL_PER_NATION_CAP);
    for (const player of slice) {
      if (isQuizEligiblePlayer(player)) {
        byPlayerId.set(player.id, player);
      }
    }
  }

  return [...byPlayerId.values()]
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
    .slice(0, INTERNATIONAL_UNION_POOL_CAP);
}
