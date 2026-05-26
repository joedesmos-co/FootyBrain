/**
 * Country and international quiz pools for World Cup prep expansion.
 * Uses existing quiz eligibility — no tournament logic, no oversized pools.
 */

import {
  COUNTRY_SESSION_POOL_CAP,
  INTERNATIONAL_PER_NATION_CAP,
  INTERNATIONAL_UNION_POOL_CAP,
  WORLD_CUP_NATIONAL_TEAM_IDS,
  WORLD_CUP_QUIZ_COLLECTION_IDS,
  WORLD_CUP_QUIZ_PREP_PARAM,
} from '../data/worldCupQuizConfig';
import { getCollectionById } from '../data/collectionsData';
import {
  getNationalTeamById,
  getNationalTeamQuizReadyCount,
  getQuizEligiblePlayersForNationalTeam,
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

/** Metadata for featured World Cup nations (viable flag + counts). */
export function getWorldCupCountryQuizPoolMetas() {
  return WORLD_CUP_NATIONAL_TEAM_IDS.map((id) => getCountryQuizPoolMeta(id)).filter(Boolean);
}

export function getViableWorldCupCountryQuizPoolMetas() {
  return getWorldCupCountryQuizPoolMetas().filter((meta) => meta.isViable);
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
 * International-only union across featured nations (deduped, capped per nation + total).
 */
export function getInternationalQuizSessionPool() {
  const byPlayerId = new Map();

  for (const nationalTeamId of WORLD_CUP_NATIONAL_TEAM_IDS) {
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

export function isWorldCupQuizPrepParam(value) {
  return value === WORLD_CUP_QUIZ_PREP_PARAM || value === '1' || value === 'true';
}

export function isWorldCupQuizCollectionId(collectionId) {
  return WORLD_CUP_QUIZ_COLLECTION_IDS.includes(collectionId);
}

/**
 * @param {import('../data/collectionsData').collections[number]} collection
 */
export function isWorldCupQuizCollection(collection) {
  if (!collection) return false;
  return (
    collection.tags?.includes('World Cup') ||
    isWorldCupQuizCollectionId(collection.id)
  );
}

/**
 * @param {import('../data/collectionsData').collections[number]['quizLaunch']} quizLaunch
 * @param {{ worldCupPrep?: boolean }} [options]
 */
export function buildCollectionQuizHref(quizLaunch, options = {}) {
  if (!quizLaunch) {
    return options.worldCupPrep
      ? `/quiz?poolFocus=international&worldCup=${WORLD_CUP_QUIZ_PREP_PARAM}`
      : '/quiz';
  }

  const params = new URLSearchParams();

  if (quizLaunch.nationalTeamId) {
    params.set('nationalTeam', quizLaunch.nationalTeamId);
    params.set('poolFocus', 'national');
  } else if (quizLaunch.teamId) {
    params.set('team', quizLaunch.teamId);
    params.set('poolFocus', 'club');
  } else if (quizLaunch.leagueId) {
    params.set('league', quizLaunch.leagueId);
    params.set('poolFocus', 'league');
  }

  if (options.worldCupPrep) {
    params.set('worldCup', WORLD_CUP_QUIZ_PREP_PARAM);
  }

  const query = params.toString();
  return query ? `/quiz?${query}` : '/quiz';
}

/**
 * @param {string} collectionId
 */
export function getWorldCupCollectionQuizHref(collectionId) {
  const collection = getCollectionById(collectionId);
  if (!collection) return '/quiz';
  return buildCollectionQuizHref(collection.quizLaunch, {
    worldCupPrep: isWorldCupQuizCollection(collection),
  });
}

export function getInternationalQuizHref() {
  return `/quiz?poolFocus=international&worldCup=${WORLD_CUP_QUIZ_PREP_PARAM}`;
}

export function getCountryQuizHref(nationalTeamId) {
  return `/quiz?nationalTeam=${nationalTeamId}&poolFocus=national&worldCup=${WORLD_CUP_QUIZ_PREP_PARAM}`;
}
