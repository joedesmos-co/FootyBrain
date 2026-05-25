// Achievement definitions for FootyBrain's progression system.
// Tier: 'beginner' | 'intermediate' — expand as the game grows.
//
// TODO: Future Firebase sync — achievements can be verified and stored server-side
//       under users/{uid}/achievements to prevent local manipulation.

export const ACHIEVEMENTS = [
  {
    id: 'first_correct',
    icon: '⚽',
    label: 'First Touch',
    description: 'Answer your first quiz question correctly.',
    tier: 'beginner',
  },
  {
    id: 'streak_5',
    icon: '🔥',
    label: 'On Fire',
    description: 'Get 5 correct answers in a row in a single session.',
    tier: 'beginner',
  },
  {
    id: 'streak_10',
    icon: '⚡',
    label: 'Unstoppable',
    description: 'Get 10 correct answers in a row in a single session.',
    tier: 'intermediate',
  },
  {
    id: 'answered_10',
    icon: '📚',
    label: 'Getting Started',
    description: 'Answer 10 quiz questions in total.',
    tier: 'beginner',
  },
  {
    id: 'answered_50',
    icon: '🎓',
    label: 'Student of the Game',
    description: 'Answer 50 quiz questions in total.',
    tier: 'intermediate',
  },
  {
    id: 'level_5',
    icon: '⭐',
    label: 'FootyBrain Pro',
    description: 'Reach level 5.',
    tier: 'intermediate',
  },
  {
    id: 'team_quiz_first',
    icon: '🏆',
    label: 'Club Beginner',
    description: 'Complete your first team quiz session (5+ questions).',
    tier: 'beginner',
  },
  {
    id: 'league_quiz_first',
    icon: '🌍',
    label: 'League Explorer',
    description: 'Complete your first league quiz session (5+ questions).',
    tier: 'beginner',
  },
];

export function getAchievementById(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) ?? null;
}

// Level title names — one per level, final entry covers all higher levels.
export const LEVEL_TITLES = [
  '',              // index 0 unused
  'Kickabout',    // 1
  'Sunday League', // 2
  'Semi-Pro',     // 3
  'Professional', // 4
  'World Class',  // 5
  'Legendary',    // 6+
];

export function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];
}
