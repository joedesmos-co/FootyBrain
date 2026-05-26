/**
 * World Cup quiz expansion config (prep only — no fixtures, brackets, or live scores).
 * Pool caps keep sessions curated; eligibility still uses quizPlayerRules.
 */

import { FEATURED_NATIONAL_TEAM_IDS } from './worldCupHubData';
import { getViableLiveNationalTeams, LIVE_NATIONAL_TEAM_IDS } from './nationalTeamData';

/** URL flag: `?worldCup=prep` marks a prep-session (not live tournament mode). */
export const WORLD_CUP_QUIZ_PREP_PARAM = 'prep';

/** Hub spotlight nations (editorial priority on World Cup prep page). */
export const WORLD_CUP_HUB_FEATURED_IDS = FEATURED_NATIONAL_TEAM_IDS;

/** All live nations in the app registry. */
export const WORLD_CUP_LIVE_NATIONAL_TEAM_IDS = LIVE_NATIONAL_TEAM_IDS;

/** International quiz union — live nations with ≥3 quiz-ready linked players. */
export const WORLD_CUP_NATIONAL_TEAM_IDS = getViableLiveNationalTeams().map((team) => team.id);

/** Max quiz-ready players per single-country session (importance order). */
export const COUNTRY_SESSION_POOL_CAP = 12;

/** Max quiz-ready players taken from each nation in the international union. */
export const INTERNATIONAL_PER_NATION_CAP = 4;

/** Max total players in the international-only union pool. */
export const INTERNATIONAL_UNION_POOL_CAP = 24;

/**
 * World Cup–tagged collections with a national-team quiz launch.
 * Study lists only — pool size comes from country quiz infrastructure.
 */
export const WORLD_CUP_QUIZ_COLLECTION_IDS = [
  'world-cup-legends',
  'tournament-stars',
  'golden-generations',
  'elite-national-team-captains',
  'modern-international-midfielders',
  'world-cup-2026-contenders',
  'world-cup-recent-winners',
  'world-cup-stars',
  'brazil-stars',
  'argentina-icons',
  'england-core',
  'france-world-cup-talent',
  'spain-midfield-masters',
];
