/**
 * World Cup quiz caps and flags — no data imports (safe for quizSession / nationalQuizPools).
 */

/** URL flag: `?worldCup=prep` marks a prep-session (not live tournament mode). */
export const WORLD_CUP_QUIZ_PREP_PARAM = 'prep';

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

export function isWorldCupQuizPrepParam(value) {
  return value === WORLD_CUP_QUIZ_PREP_PARAM || value === '1' || value === 'true';
}
