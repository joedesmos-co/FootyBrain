/**
 * Canonical user-facing labels for players, clubs, leagues, national teams, and quizzes.
 * Display and metadata copy only — never change routes, IDs, or URL slugs here.
 */

// ——— Snapshot & feedback field labels ———
export const FIELD_CLUB = 'Club';
export const FIELD_LEAGUE = 'League';
export const FIELD_NATIONAL_TEAM = 'National team';
export const FIELD_NATIONALITY = 'Nationality';
export const FIELD_POSITION = 'Position';

/** @type {Record<string, string>} */
export const PROFILE_FIELD_LABELS = {
  Club: FIELD_CLUB,
  League: FIELD_LEAGUE,
  'National team': FIELD_NATIONAL_TEAM,
  Nationality: FIELD_NATIONALITY,
  Position: FIELD_POSITION,
};

// ——— Breadcrumbs ———
export const CRUMB_HOME = 'Home';
export const CRUMB_BROWSE = 'Browse';
export const CRUMB_CLUBS = 'Clubs';
export const CRUMB_NATIONAL_TEAMS = 'National teams';
export const CRUMB_COLLECTIONS = 'Collections';
export const CRUMB_LEARNING_PATHS = 'Learning paths';
export const CRUMB_WORLD_CUP = 'World Cup 2026';

// ——— Product & page names (title case) ———
export const NAME_PLAYER_QUIZ = 'Player quiz';
export const NAME_PLAYER_QUIZS = 'Player quizzes';
export const NAME_CLUB_QUIZ = 'Club quiz';
export const NAME_CLUB_QUIZS = 'Club quizzes';
export const NAME_DAILY_CHALLENGE = 'Daily challenge';
export const NAME_FOOTBALL_QUIZZES = 'Football quizzes';

// ——— Explore (/hubs) ———
export const EXPLORE_NAV_LABEL = 'Explore';
export const EXPLORE_PATH = '/hubs';
export const EXPLORE_BREADCRUMB = { label: EXPLORE_NAV_LABEL, to: EXPLORE_PATH };
export const EXPLORE_INDEX_EYEBROW = 'Explore football';
export const EXPLORE_INDEX_TITLE = 'Explore players, clubs & quizzes';
export const EXPLORE_INDEX_LEDE =
  'Curated paths into player profiles, club pages, league quizzes, and international study — pick a topic and play.';
export const EXPLORE_QUIZZES_TITLE = NAME_FOOTBALL_QUIZZES;
export const EXPLORE_QUIZZES_LEDE =
  'Player quizzes from hints plus club knowledge formats — stadiums, rivalries, and league geography.';

export const LINK_EXPLORE_ALL = 'Explore all topics';
export const LINK_EXPLORE_QUIZZES = 'Explore quizzes';
export const LINK_EXPLORE_FOOTBALL = 'Explore football';
export const LINK_PLAYERS_BY_NATIONALITY = 'Players by nationality';
export const LINK_ALL_NATIONALITIES = 'All nationalities';
export const LINK_THEMED_QUIZZES = 'Themed quiz pools';
export const LINK_CLUB_QUIZ_GUIDES = 'Club quiz guides';
export const LINK_WORLD_CUP_PREP = 'World Cup 2026 prep';
export const LINK_LEARN_PLAYERS = 'Learn football players';

// ——— Quiz & study link labels ———
export const LINK_CLUB_QUIZ_GUIDE = 'Club quiz guide';
export const LINK_LEAGUE_QUIZ_GUIDE = 'League quiz guide';
export const LINK_CLUB_PLAYER_QUIZ = 'Club player quiz';
export const LINK_LEAGUE_PLAYER_QUIZ = 'League player quiz';
export const LINK_NATIONAL_TEAM = 'National team';
export const LINK_NATIONAL_TEAM_QUIZ = 'National team quiz';
export const LINK_DAILY_CHALLENGE = 'Daily challenge';
export const LINK_STADIUM_QUIZ = 'Stadium quiz';
export const LINK_RIVALRY_QUIZ = 'Rivalry quiz';
export const LINK_THEMED_LEAGUE_QUIZ = 'Themed league quiz';
export const LINK_ALL_NATIONAL_TEAMS = 'All national teams';
export const LINK_INTERNATIONAL_PLAYER_QUIZ = 'International player quiz';

// ——— CTAs ———
export const CTA_BACK_TO_BROWSE = 'Back to browse';
export const CTA_BACK_TO_CLUBS = 'Back to clubs';
export const CTA_BACK_TO_NATIONAL_TEAMS = 'Back to national teams';
export const CTA_BROWSE_SQUAD = 'Browse squad';
export const CTA_VIEW_SQUAD = 'View squad';
export const CTA_VIEW_PLAYER_PROFILE = 'View player profile';
export const CTA_LEARN_PLAYER = 'Learn this player';

// ——— Badges & inline status ———
export const BADGE_QUIZ_READY = 'Quiz-ready';
export const COPY_IN_QUIZZES = 'in quizzes';

/**
 * @param {string} [clubName]
 */
export function linkClubSquad(clubName) {
  const name = String(clubName ?? '').trim();
  return name ? `${name} squad` : 'Club squad';
}

/**
 * @param {string} [leagueName]
 */
export function linkLeaguePage(leagueName) {
  const name = String(leagueName ?? '').trim();
  return name ? `${name} league` : 'League guide';
}

/**
 * @param {string} [clubName]
 */
export function linkClubQuizGuide(clubName) {
  const name = String(clubName ?? '').trim();
  return name ? `${name} quiz guide` : LINK_CLUB_QUIZ_GUIDE;
}

/**
 * @param {string} [leagueName]
 */
export function linkLeagueQuizGuide(leagueName) {
  const name = String(leagueName ?? '').trim();
  return name ? `${name} quiz guide` : LINK_LEAGUE_QUIZ_GUIDE;
}

/**
 * @param {string} countryOrNationality
 */
export function linkNationalityPlayers(countryOrNationality) {
  const plain = String(countryOrNationality ?? '').trim();
  return plain ? `${plain} players` : LINK_PLAYERS_BY_NATIONALITY;
}

/**
 * @param {string} countryOrNationality
 */
export function linkCountryNationalTeam(countryOrNationality) {
  const plain = String(countryOrNationality ?? '').trim();
  return plain ? `${plain} national team` : LINK_NATIONAL_TEAM;
}

/**
 * @param {Array<{ label: string, to?: string }>} tail
 */
export function exploreBreadcrumbs(tail = []) {
  return [{ label: CRUMB_HOME, to: '/' }, { ...EXPLORE_BREADCRUMB }, ...tail];
}

/**
 * @param {number} count
 */
export function formatQuizReadyInline(count) {
  const n = Number(count) || 0;
  if (n <= 0) return '';
  if (n === 1) return `1 ${COPY_IN_QUIZZES}`;
  return `${n} ${COPY_IN_QUIZZES}`;
}

/**
 * @param {number} quizCount
 */
export function clubChipSubline(quizCount) {
  const n = Number(quizCount) || 0;
  return n > 0 ? formatQuizReadyInline(n) : CTA_VIEW_SQUAD;
}

/**
 * @param {{ clubs: number, players: number }} stats
 */
export function leagueMetaLine({ clubs, players }) {
  return `${clubs} clubs · ${players} players`;
}

/**
 * @param {number} quizReadyCount
 */
export function leagueHubQuizLabel(quizReadyCount) {
  const n = Number(quizReadyCount) || 0;
  if (n <= 0) return 'Explore players';
  return formatQuizReadyInline(n);
}
