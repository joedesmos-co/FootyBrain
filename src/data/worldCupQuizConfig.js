/**
 * World Cup quiz expansion config (prep only — no fixtures, brackets, or live scores).
 * Pool caps keep sessions curated; eligibility still uses quizPlayerRules.
 */

import {
  COUNTRY_SESSION_POOL_CAP,
  INTERNATIONAL_PER_NATION_CAP,
  INTERNATIONAL_UNION_POOL_CAP,
  WORLD_CUP_QUIZ_COLLECTION_IDS,
  WORLD_CUP_QUIZ_PREP_PARAM,
} from './worldCupQuizConstants';
import { FEATURED_NATIONAL_TEAM_IDS } from './worldCupHubData';
import { getViableLiveNationalTeams, LIVE_NATIONAL_TEAM_IDS } from './nationalTeamData';

export {
  COUNTRY_SESSION_POOL_CAP,
  INTERNATIONAL_PER_NATION_CAP,
  INTERNATIONAL_UNION_POOL_CAP,
  WORLD_CUP_QUIZ_COLLECTION_IDS,
  WORLD_CUP_QUIZ_PREP_PARAM,
};

/** Hub spotlight nations (editorial priority on World Cup prep page). */
export const WORLD_CUP_HUB_FEATURED_IDS = FEATURED_NATIONAL_TEAM_IDS;

/** All live nations in the app registry. */
export const WORLD_CUP_LIVE_NATIONAL_TEAM_IDS = LIVE_NATIONAL_TEAM_IDS;

/** International quiz union — live nations with ≥3 quiz-ready linked players. */
export const WORLD_CUP_NATIONAL_TEAM_IDS = getViableLiveNationalTeams().map((team) => team.id);
