import {
  CLUB_QUIZ_CATEGORY_CATALOG,
  getClubQuizCategoryById,
  getClubQuizPlayHref,
} from '../data/clubQuizCategories.js';
import { countClubQuizPool } from './clubQuizEngine.js';

/**
 * @param {{
 *   teams: any[],
 *   currentCategoryId?: string,
 *   leagueId?: string,
 *   limit?: number,
 * }} ctx
 */
export function getRecommendedNextClubQuizzes(ctx) {
  const { teams, currentCategoryId = '', leagueId = '', limit = 3 } = ctx;
  const scored = [];

  for (const cat of CLUB_QUIZ_CATEGORY_CATALOG) {
    if (cat.id === currentCategoryId) continue;
    const count = countClubQuizPool(teams, cat.id, { leagueId });
    if (count < 4) continue;
    let score = cat.mvpTier === 1 ? 10 : cat.mvpTier === 2 ? 7 : 5;
    if (leagueId && (cat.id === 'league' || cat.id === 'stadium')) score += 2;
    scored.push({
      score,
      categoryId: cat.id,
      label: cat.label,
      href: getClubQuizPlayHref(cat.id, { leagueId: leagueId || undefined }),
      poolSize: count,
    });
  }

  scored.sort((a, b) => b.score - a.score || b.poolSize - a.poolSize);
  return scored.slice(0, limit);
}

export function getClubQuizCategoryHubHref(categoryId) {
  const cat = getClubQuizCategoryById(categoryId);
  if (!cat) return '/hubs/quizzes/clubs';
  return `/hubs/quizzes/clubs/${cat.id}`;
}
