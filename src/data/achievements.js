// Achievement definitions for FootyCompass's progression system.
// category: quiz_streak | league_mastery | club_mastery | collections | compare | general
//
// TODO: Future Firebase sync — achievements can be verified and stored server-side
//       under users/{uid}/achievements to prevent local manipulation.

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'general', label: 'Getting started' },
  { id: 'quiz_streak', label: 'Quiz streaks' },
  { id: 'quiz_milestones', label: 'Quiz milestones' },
  { id: 'club_mastery', label: 'Club mastery' },
  { id: 'league_mastery', label: 'League mastery' },
  { id: 'collections', label: 'Collections' },
  { id: 'compare', label: 'Compare tool' },
];

export const ACHIEVEMENTS = [
  {
    id: 'first_correct',
    icon: '⚽',
    label: 'First Touch',
    description: 'Answer your first quiz question correctly.',
    tier: 'beginner',
    category: 'general',
  },
  {
    id: 'answered_10',
    icon: '📚',
    label: 'Getting Started',
    description: 'Answer 10 quiz questions in total.',
    tier: 'beginner',
    category: 'general',
  },
  {
    id: 'answered_50',
    icon: '🎓',
    label: 'Student of the Game',
    description: 'Answer 50 quiz questions in total.',
    tier: 'intermediate',
    category: 'general',
  },
  {
    id: 'answered_100',
    icon: '🏅',
    label: 'Century Club',
    description: 'Answer 100 quiz questions in total.',
    tier: 'intermediate',
    category: 'general',
  },
  {
    id: 'level_5',
    icon: '⭐',
    label: 'FootyCompass Pro',
    description: 'Reach level 5.',
    tier: 'intermediate',
    category: 'general',
  },
  {
    id: 'streak_3',
    icon: '✨',
    label: 'Warming Up',
    description: '3 correct answers in a row in one quiz session.',
    tier: 'beginner',
    category: 'quiz_streak',
  },
  {
    id: 'streak_5',
    icon: '🔥',
    label: 'On Fire',
    description: '5 correct answers in a row in one quiz session.',
    tier: 'beginner',
    category: 'quiz_streak',
  },
  {
    id: 'streak_10',
    icon: '⚡',
    label: 'Unstoppable',
    description: '10 correct answers in a row in one quiz session.',
    tier: 'intermediate',
    category: 'quiz_streak',
  },
  {
    id: 'best_streak_10',
    icon: '🌟',
    label: 'Streak Record',
    description: 'Reach a best streak of 10 across all quiz sessions.',
    tier: 'intermediate',
    category: 'quiz_streak',
  },
  {
    id: 'quiz_session_first',
    icon: '🎯',
    label: 'Session Finisher',
    description: 'Complete a 5-question quiz session milestone.',
    tier: 'beginner',
    category: 'quiz_milestones',
  },
  {
    id: 'quiz_sessions_5',
    icon: '📋',
    label: 'Regular Trainer',
    description: 'Finish 5 quiz session milestones.',
    tier: 'beginner',
    category: 'quiz_milestones',
  },
  {
    id: 'quiz_sessions_15',
    icon: '🧠',
    label: 'Quiz Regular',
    description: 'Finish 15 quiz session milestones.',
    tier: 'intermediate',
    category: 'quiz_milestones',
  },
  {
    id: 'team_quiz_first',
    icon: '🏟️',
    label: 'Club Beginner',
    description: 'Complete your first club quiz session (5+ answers).',
    tier: 'beginner',
    category: 'club_mastery',
  },
  {
    id: 'team_quiz_5',
    icon: '🛡️',
    label: 'Club Scholar',
    description: 'Complete club quiz sessions for 5 different teams.',
    tier: 'intermediate',
    category: 'club_mastery',
  },
  {
    id: 'team_quiz_10',
    icon: '👕',
    label: 'Club Expert',
    description: 'Complete club quiz sessions for 10 different teams.',
    tier: 'intermediate',
    category: 'club_mastery',
  },
  {
    id: 'league_quiz_first',
    icon: '🌍',
    label: 'League Explorer',
    description: 'Complete your first league quiz session (5+ answers).',
    tier: 'beginner',
    category: 'league_mastery',
  },
  {
    id: 'league_quiz_3',
    icon: '🗺️',
    label: 'League Traveller',
    description: 'Complete league quiz sessions in 3 different leagues.',
    tier: 'intermediate',
    category: 'league_mastery',
  },
  {
    id: 'league_quiz_all',
    icon: '🏆',
    label: 'League Master',
    description: 'Complete a quiz session milestone in every FootyCompass league.',
    tier: 'intermediate',
    category: 'league_mastery',
  },
  {
    id: 'collection_first',
    icon: '📖',
    label: 'Path Starter',
    description: 'Complete your first learning collection.',
    tier: 'beginner',
    category: 'collections',
  },
  {
    id: 'collection_3',
    icon: '🧭',
    label: 'Curator',
    description: 'Complete 3 learning collections.',
    tier: 'beginner',
    category: 'collections',
  },
  {
    id: 'collection_all',
    icon: '✅',
    label: 'Collection Master',
    description: 'Complete every curated learning collection.',
    tier: 'intermediate',
    category: 'collections',
  },
  {
    id: 'compare_first',
    icon: '⚖️',
    label: 'Side by Side',
    description: 'Run your first player or club comparison.',
    tier: 'beginner',
    category: 'compare',
  },
  {
    id: 'compare_5',
    icon: '🔍',
    label: 'Scout Mode',
    description: 'Run 5 comparisons.',
    tier: 'beginner',
    category: 'compare',
  },
  {
    id: 'compare_15',
    icon: '📊',
    label: 'Analyst',
    description: 'Run 15 comparisons.',
    tier: 'intermediate',
    category: 'compare',
  },
];

export function getAchievementById(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) ?? null;
}

export function groupAchievementsByCategory() {
  return ACHIEVEMENT_CATEGORIES.map((category) => ({
    ...category,
    achievements: ACHIEVEMENTS.filter((a) => a.category === category.id),
  })).filter((group) => group.achievements.length > 0);
}

export const LEVEL_TITLES = [
  '',
  'Kickabout',
  'Sunday League',
  'Semi-Pro',
  'Professional',
  'World Class',
  'Legendary',
];

export function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];
}
