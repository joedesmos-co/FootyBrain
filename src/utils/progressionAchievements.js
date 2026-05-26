import { collections } from '../data/collectionsData';
import { leagues } from '../data/sampleData';
import { calculateLevel } from './progressionLevel';

export const LEAGUE_MASTERY_TARGET = leagues.length;
export const COLLECTION_MASTERY_TARGET = collections.length;

/**
 * @param {import('../hooks/useProgression').ProgressionState} state
 * @param {number} sessionStreak
 */
export function resolveAchievements(state, sessionStreak = 0) {
  const earned = new Set(state.earnedAchievements);

  if (state.totalCorrect >= 1) earned.add('first_correct');
  if (sessionStreak >= 3) earned.add('streak_3');
  if (sessionStreak >= 5) earned.add('streak_5');
  if (sessionStreak >= 10) earned.add('streak_10');
  if (state.bestStreak >= 10) earned.add('best_streak_10');
  if (state.totalAnswered >= 10) earned.add('answered_10');
  if (state.totalAnswered >= 50) earned.add('answered_50');
  if (state.totalAnswered >= 100) earned.add('answered_100');
  if (calculateLevel(state.xp).level >= 5) earned.add('level_5');

  if (state.quizSessionsCompleted >= 1) earned.add('quiz_session_first');
  if (state.quizSessionsCompleted >= 5) earned.add('quiz_sessions_5');
  if (state.quizSessionsCompleted >= 15) earned.add('quiz_sessions_15');

  if (state.completedTeamQuizzes.length >= 1) earned.add('team_quiz_first');
  if (state.completedTeamQuizzes.length >= 5) earned.add('team_quiz_5');
  if (state.completedTeamQuizzes.length >= 10) earned.add('team_quiz_10');

  if (state.completedLeagueQuizzes.length >= 1) earned.add('league_quiz_first');
  if (state.completedLeagueQuizzes.length >= 3) earned.add('league_quiz_3');
  if (state.completedLeagueQuizzes.length >= LEAGUE_MASTERY_TARGET) {
    earned.add('league_quiz_all');
  }

  if (state.collectionsCompleted >= 1) earned.add('collection_first');
  if (state.collectionsCompleted >= 3) earned.add('collection_3');
  if (state.collectionsCompleted >= COLLECTION_MASTERY_TARGET) {
    earned.add('collection_all');
  }

  if (state.compareCount >= 1) earned.add('compare_first');
  if (state.compareCount >= 5) earned.add('compare_5');
  if (state.compareCount >= 15) earned.add('compare_15');

  return [...earned];
}

/** IDs unlocked on this transition (for toasts). */
export function getNewAchievementIds(before, after) {
  const prev = new Set(before);
  return after.filter((id) => !prev.has(id));
}
