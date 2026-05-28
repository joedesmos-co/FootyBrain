import { getQuizThemeById, getQuizThemePlayHref, QUIZ_THEME_CATALOG } from '../data/quizThemes';
import { countThemedQuizPool } from './quizThemePools';
import { QUIZ_MIN_SESSION_POOL } from './quizSession';

/**
 * @param {{
 *   themeId?: string,
 *   leagueFilter?: string,
 *   teamFilter?: string,
 *   nationalTeamFilter?: string,
 *   difficulty?: string,
 *   accuracy?: number,
 *   bestStreak?: number,
 *   missedCount?: number,
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
    difficulty = 'medium',
    accuracy = 100,
    bestStreak = 0,
    missedCount = 0,
    players = [],
    teams = [],
  } = ctx;

  const poolContext = { teams, difficulty };
  const viable = QUIZ_THEME_CATALOG.filter(
    (theme) =>
      theme.id !== themeId &&
      countThemedQuizPool(players, theme.id, poolContext) >= QUIZ_MIN_SESSION_POOL,
  );

  /** @type {Array<{ id: string, label: string, href: string, reason: string }>} */
  const picks = [];

  const push = (id, reason, diffOverride) => {
    const theme = getQuizThemeById(id);
    if (!theme || picks.some((p) => p.id === id)) return;
    picks.push({
      id,
      label: theme.label,
      href: getQuizThemePlayHref(id, { difficulty: diffOverride }),
      reason,
    });
  };

  const isHardMode = difficulty === 'hard' || difficulty === 'hardcore' || difficulty === 'nerd';

  if (missedCount >= 3 || accuracy < 50) {
    push('wonderkids', 'Rebuild with younger stars — try Easy difficulty', 'easy');
    push('premier-league', 'One league you watch every week — Medium is a sweet spot', 'medium');
  } else if (accuracy < 65) {
    push('wonderkids', 'Confidence builder: recognizable wonderkids', 'easy');
    push('legends', 'Household names with strong clues', 'medium');
  } else if (accuracy >= 90 && isHardMode) {
    push('cult-heroes', 'You crushed hard mode — mid-tier fan favourites next', 'hard');
    push('veterans', 'Experience and longevity — deep squad knowledge', 'hardcore');
    push('derby-rivalries', 'Rivalry context for the ultimate nerd flex', 'nerd');
  } else if (accuracy >= 85) {
    push('legends', 'Step up to trophy-winning icons', 'hard');
    push('champions-league', 'European knockout flavour', 'hard');
    push('cult-heroes', 'Fan favourites — tricky but fair', 'medium');
  } else if (bestStreak >= 5 && accuracy >= 70) {
    push('champions-league', 'Your streak is hot — test UCL depth', 'hard');
    push('world-cup', 'International recognition challenge', 'medium');
  }

  if (themeId === 'wonderkids') push('legends', 'Graduate to headline legends', 'medium');
  if (themeId === 'legends' && !isHardMode) {
    push('champions-league', 'More European knockout flavour', 'hard');
  }
  if (themeId === 'premier-league') push('derby-rivalries', 'Derbies inside England', 'hard');
  if (leagueFilter === 'premier-league') push('derby-rivalries', 'Local derby context', 'hard');
  if (nationalTeamFilter || themeId === 'world-cup') {
    push('legends', 'Switch to club legends for variety', 'medium');
  }
  if (teamFilter && missedCount > 0) {
    push('cult-heroes', 'Fan favourites from squads like yours', 'medium');
  }

  if (difficulty === 'easy' && accuracy >= 80) {
    push('top-scorers', 'Ready for Medium? Attackers with high impact', 'medium');
  }
  if (difficulty === 'medium' && accuracy >= 75 && bestStreak >= 3) {
    push('veterans', 'Try Hard — veterans still shape squads', 'hard');
  }

  for (const theme of viable) {
    if (picks.length >= 3) break;
    if (picks.some((p) => p.id === theme.id)) continue;
    push(theme.id, 'Another themed pool with enough quiz-ready players');
  }

  if (picks.length < 2) {
    push('wonderkids', 'Quick replay with a fresh themed pool', 'easy');
    push('top-scorers', 'Attack-minded recognition practice', 'medium');
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
