/**
 * User-facing copy for /hubs/* routes — URLs and sitemap paths stay as /hubs.
 * Use these labels in navigation, breadcrumbs, CTAs, and on-page UI only.
 */

export const EXPLORE_PATH = '/hubs';

/** Primary nav label (replaces “Hubs”). */
export const EXPLORE_NAV_LABEL = 'Explore';

/** Breadcrumb root for all /hubs pages. */
export const EXPLORE_BREADCRUMB = { label: EXPLORE_NAV_LABEL, to: EXPLORE_PATH };

/**
 * @param {Array<{ label: string, to?: string }>} tail
 */
export function exploreBreadcrumbs(tail = []) {
  return [{ label: 'Home', to: '/' }, EXPLORE_BREADCRUMB, ...tail];
}

export const EXPLORE_INDEX_EYEBROW = 'Explore football';
export const EXPLORE_INDEX_TITLE = 'Explore players, clubs & quizzes';
export const EXPLORE_INDEX_LEDE =
  'Curated paths into player profiles, club pages, league quizzes, and international study — pick a topic and play.';

export const EXPLORE_QUIZZES_TITLE = 'Football quizzes';
export const EXPLORE_QUIZZES_LEDE =
  'Player quizzes from hints plus club knowledge formats — stadiums, rivalries, and league geography.';

export function leagueQuizGuideLabel(leagueName) {
  return `${leagueName} quiz guide`;
}

export function clubQuizGuideLabel(clubName) {
  return `${clubName} quiz guide`;
}

export function nationalityPlayersLabel(countryLabel) {
  return `${countryLabel} players`;
}

export function leagueExploreLabel(leagueName) {
  return `${leagueName} league`;
}

export const LINK_EXPLORE_ALL = 'Explore all topics';
export const LINK_EXPLORE_QUIZZES = 'Explore quizzes';
export const LINK_PLAYERS_BY_NATIONALITY = 'Players by nationality';
export const LINK_THEMED_QUIZZES = 'Themed quiz pools';
export const LINK_CLUB_QUIZ_GUIDES = 'Club quiz guides';
export const LINK_WORLD_CUP_PREP = 'World Cup 2026 prep';
export const LINK_LEARN_PLAYERS = 'Learn football players';
