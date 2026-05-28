import { getQuizThemeById, getQuizThemePlayHref, QUIZ_THEME_CATALOG } from '../data/quizThemes';
import { countThemedQuizPool } from './quizThemePools';
import { QUIZ_MIN_SESSION_POOL } from './quizSession';

/**
 * @param {{
 *   themeId?: string,
 *   leagueFilter?: string,
 *   teamFilter?: string,
 *   nationalTeamFilter?: string,
 *   accuracy?: number,
 *   players: any[],
 *   teams?: any[],
 * }} ctx
 */
export function getRecommendedNextQuizzes(ctx) {
  const {
    themeId = '',
    leagueFilter = '',
    teamFilter = '',
    nationalTeamFilter = '',
    accuracy = 100,
    players = [],
    teams = [],
  } = ctx;

  const poolContext = { teams };
  const viable = QUIZ_THEME_CATALOG.filter(
    (theme) =>
      theme.id !== themeId &&
      countThemedQuizPool(players, theme.id, poolContext) >= QUIZ_MIN_SESSION_POOL,
  );

  /** @type {Array<{ id: string, label: string, href: string, reason: string }>} */
  const picks = [];

  const push = (id, reason) => {
    const theme = getQuizThemeById(id);
    if (!theme || picks.some((p) => p.id === id)) return;
    picks.push({
      id,
      label: theme.label,
      href: getQuizThemePlayHref(id),
      reason,
    });
  };

  if (accuracy < 60) {
    push('wonderkids', 'Rebuild confidence with younger stars and easier clues');
    push('premier-league', 'Stick to one league you watch every week');
  } else if (accuracy >= 85) {
    push('legends', 'You’re ready for headline names and harder clues');
    push('champions-league', 'European nights — UCL-era players');
    push('cult-heroes', 'Fan favourites — still tricky, less household-name pressure');
  }

  if (themeId === 'wonderkids') push('legends', 'Step up to trophy-winning icons');
  if (themeId === 'legends') push('champions-league', 'More European knockout flavour');
  if (themeId === 'premier-league') push('derby-rivalries', 'Add local derby context');
  if (leagueFilter === 'premier-league') push('derby-rivalries', 'Derbies inside England');
  if (nationalTeamFilter || themeId === 'world-cup') {
    push('legends', 'Switch back to club legends for variety');
  }
  if (teamFilter) push('cult-heroes', 'Fan favourites from squads like yours');

  for (const theme of viable) {
    if (picks.length >= 3) break;
    if (picks.some((p) => p.id === theme.id)) continue;
    push(theme.id, 'Another themed pool with enough quiz-ready players');
  }

  if (picks.length < 2) {
    push('wonderkids', 'Quick replay with a fresh themed pool');
    push('top-scorers', 'Attack-minded recognition practice');
  }

  if (!picks.some((p) => p.id === 'club-quiz')) {
    picks.push({
      id: 'club-quiz',
      label: 'Club stadium quiz',
      href: '/club-quiz?category=stadium',
      reason: 'Mix in club knowledge — stadiums and rivalries',
    });
  }

  return picks.slice(0, 3);
}
