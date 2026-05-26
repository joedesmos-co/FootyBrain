import { useMemo } from 'react';
import { useCollectionProgress } from './useCollectionProgress';
import { useFavorites } from './useFavorites';
import { usePreferences } from './usePreferences';
import { useProgression } from './useProgression';
import { getRecentViews } from '../utils/recentlyViewed';
import { getLearningRecommendations } from '../utils/recommendations';

export function useLearningRecommendations() {
  const { preferences, hasPreferences } = usePreferences();
  const { favorites } = useFavorites();
  const {
    totalAnswered,
    totalCorrect,
    completedTeamQuizzes,
    completedLeagueQuizzes,
  } = useProgression();
  const { viewed, learned, completedCollectionIds } = useCollectionProgress();
  const recentViews = useMemo(() => getRecentViews(), []);

  const collectionState = useMemo(
    () => ({
      viewed,
      learned,
      completedCollections: completedCollectionIds,
    }),
    [viewed, learned, completedCollectionIds],
  );

  return useMemo(
    () =>
      getLearningRecommendations({
        preferences: hasPreferences ? preferences : null,
        favorites,
        recentViews,
        progression: {
          totalAnswered,
          totalCorrect,
          completedTeamQuizzes,
          completedLeagueQuizzes,
        },
        collectionState,
      }),
    [
      hasPreferences,
      preferences,
      favorites,
      totalAnswered,
      totalCorrect,
      completedTeamQuizzes,
      completedLeagueQuizzes,
      collectionState,
      recentViews,
    ],
  );
}
