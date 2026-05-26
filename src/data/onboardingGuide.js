import { getLiveNationalTeams } from './nationalTeamData';

/** Short “how it works” steps for onboarding and home feature grid. */
export const ONBOARDING_STEPS = [
  {
    id: 'database',
    label: 'Database',
    title: 'Browse the database',
    description:
      'Search players, clubs, and leagues. Profiles show position, club, national link, and career stops.',
    to: '/browse',
    stat: 'Browse',
  },
  {
    id: 'quiz',
    label: 'Quiz',
    title: 'Quiz mode',
    description:
      'Guess the player from hints. Scope by club, league, or national team when enough quiz-ready players exist.',
    to: '/quiz',
    stat: 'Hints',
  },
  {
    id: 'collections',
    label: 'Collections',
    title: 'Collections',
    description:
      'Study lists and learning paths that chain collections, profiles, and quizzes.',
    to: '/learning-paths',
    stat: 'Paths',
  },
  {
    id: 'compare',
    label: 'Compare',
    title: 'Compare',
    description:
      'Place two players or two clubs side by side—roles, Importance Score, and squad snapshots.',
    to: '/compare',
    stat: '2-up',
  },
  {
    id: 'daily',
    label: 'Daily',
    title: 'Daily challenge',
    description:
      'Five questions once per day. Track score, XP, and streaks on your profile.',
    to: '/daily',
    stat: '5 / day',
  },
];

const NATIONAL_TEAMS_STEP = {
  id: 'national-teams',
  label: 'Nations',
  title: 'National teams',
  description:
    'Country guides, rivals, and squads for live men’s sides—linked from player profiles and search.',
  to: '/national-teams',
  stat: 'Live NTs',
};

/** Ordered steps for /onboarding and home (national teams inserted when live). */
export function getOnboardingSteps() {
  const steps = [...ONBOARDING_STEPS];
  if (getLiveNationalTeams().length > 0) {
    steps.splice(4, 0, NATIONAL_TEAMS_STEP);
  }
  return steps;
}

/**
 * @param {{ players: number, teams: number, leagues: number }} counts
 */
export function getHomeFeatureCards(counts) {
  const statById = {
    database: `${counts.players} players · ${counts.teams} clubs`,
    quiz: '3 levels',
    collections: 'Playlists',
    compare: 'Players & clubs',
    daily: '5 questions',
    'national-teams': `${getLiveNationalTeams().length} live`,
  };

  return getOnboardingSteps().map((step) => ({
    to: step.to,
    label: step.label,
    title: step.title,
    description: step.description,
    stat: statById[step.id] ?? step.stat,
  }));
}

export function hasLiveNationalTeams() {
  return getLiveNationalTeams().length > 0;
}
