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
  getViableLiveNationalTeams,
} from '../data/nationalTeamData';
import { canAppearInQuizSession } from './quizEcosystem';

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
export function getCountryQuizSessionPool() {
  throw new Error(
    'getCountryQuizSessionPool now requires an explicit quiz-player pool (use buildCountryQuizSessionPool)',
  );
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
  throw new Error(
    'getInternationalQuizSessionPool now requires an explicit quiz-player pool (use buildInternationalQuizSessionPool)',
  );
}

/**
 * Build a country quiz pool from an explicit quiz-player set (e.g. quiz-registry players).
 * This avoids importing `sampleData.js` on hot paths.
 */
export function buildCountryQuizSessionPool(
  nationalTeamId,
  quizPlayers,
  getMembershipForPlayer,
  difficulty = 'medium',
) {
  const eligible = (quizPlayers ?? []).filter((p) => {
    if (!canAppearInQuizSession(p, difficulty)) return false;
    const membership = getMembershipForPlayer?.(p.id);
    return membership?.nationalTeamId === nationalTeamId;
  });
  return capSessionPool(
    eligible.sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0)),
    COUNTRY_SESSION_POOL_CAP,
  );
}

export function buildInternationalQuizSessionPool(quizPlayers, getMembershipForPlayer) {
  const byPlayerId = new Map();
  for (const { id: nationalTeamId } of getViableLiveNationalTeams()) {
    const meta = getCountryQuizPoolMeta(nationalTeamId);
    if (!meta?.isViable) continue;
    const slice = buildCountryQuizSessionPool(nationalTeamId, quizPlayers, getMembershipForPlayer).slice(
      0,
      INTERNATIONAL_PER_NATION_CAP,
    );
    for (const player of slice) byPlayerId.set(player.id, player);
  }
  return [...byPlayerId.values()]
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
    .slice(0, INTERNATIONAL_UNION_POOL_CAP);
}
