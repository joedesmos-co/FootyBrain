/**
 * Country and international quiz pools for World Cup prep expansion.
 * Uses existing quiz eligibility — no tournament logic, no oversized pools.
 */

import {
  WORLD_CUP_NATIONAL_TEAM_IDS,
  WORLD_CUP_QUIZ_COLLECTION_IDS,
  WORLD_CUP_QUIZ_PREP_PARAM,
} from '../data/worldCupQuizConfig';
import { getCollectionById } from '../data/collectionsData';
import {
  getCountryQuizPoolMeta,
  getCountryQuizSessionPool,
  getInternationalQuizSessionPool,
} from './nationalQuizPools';

export {
  getCountryQuizPoolMeta,
  getCountryQuizSessionPool,
  getInternationalQuizSessionPool,
};

/** Metadata for featured World Cup nations (viable flag + counts). */
export function getWorldCupCountryQuizPoolMetas() {
  return WORLD_CUP_NATIONAL_TEAM_IDS.map((id) => getCountryQuizPoolMeta(id)).filter(Boolean);
}

export function getViableWorldCupCountryQuizPoolMetas() {
  return getWorldCupCountryQuizPoolMetas().filter((meta) => meta.isViable);
}

export { isWorldCupQuizPrepParam } from '../data/worldCupQuizConstants';

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
