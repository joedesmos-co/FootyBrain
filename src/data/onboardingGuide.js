import { CONTENT_MANIFEST } from './contentManifest';

/** Short “how it works” steps for onboarding and home feature grid. */
export const ONBOARDING_STEPS = [
  {
    id: 'browse',
    label: 'Browse',
    title: 'Browse players & clubs',
    description:
      'Search by name, filter by league or club, and open rich profiles with career stops and fan context.',
    to: '/browse',
    stat: 'Explore',
  },
  {
    id: 'quiz',
    label: 'Quizzes',
    title: 'Play quizzes',
    description:
      'Guess players from hints—classic clues, career paths, and more. Scope by club, league, or national team.',
    to: '/quiz',
    stat: 'Hints',
  },
  {
    id: 'collections',
    label: 'Collections',
    title: 'Study collections',
    description:
      'Curated lists and learning paths that chain profiles, collections, and quizzes into one route.',
    to: '/learning-paths',
    stat: 'Paths',
  },
  {
    id: 'compare',
    label: 'Compare',
    title: 'Compare players or clubs',
    description:
      'Put two players or two clubs side by side—roles, importance score, and squad snapshots.',
    to: '/compare',
    stat: '2-up',
  },
  {
    id: 'daily',
    label: 'Daily',
    title: 'Daily challenge',
    description:
      'Five fresh questions once per day. Track score, XP, and streaks on your profile.',
    to: '/daily',
    stat: '5 / day',
  },
];

const NATIONAL_TEAMS_STEP = {
  id: 'national-teams',
  label: 'Nations',
  title: 'National teams',
  description:
    'Country guides, rivals, and player pools for live men’s sides—linked from profiles and search.',
  to: '/national-teams',
  stat: 'Nations',
};

const WORLD_CUP_STEP = {
  id: 'world-cup',
  label: 'World Cup',
  title: 'World Cup 2026 prep',
  description:
    'Featured nations, the group draw, tournament collections, and international quizzes.',
  to: '/world-cup',
  stat: '2026',
};

/** Ordered steps for /onboarding and home (national teams inserted when live). */
export function getOnboardingSteps() {
  const steps = [...ONBOARDING_STEPS];
  if (CONTENT_MANIFEST.liveNationalTeamIds.length > 0) {
    steps.splice(4, 0, NATIONAL_TEAMS_STEP);
    steps.splice(5, 0, WORLD_CUP_STEP);
  }
  return steps;
}

/**
 * @param {{ players: number, teams: number, leagues: number }} counts
 */
export function getHomeFeatureCards(counts) {
  const statById = {
    browse: `${counts.players} players · ${counts.teams} clubs`,
    quiz: 'Hints & streaks',
    collections: 'Study lists',
    compare: 'Players & clubs',
    daily: '5 questions',
    'national-teams': `${CONTENT_MANIFEST.liveNationalTeamIds.length} nations`,
    'world-cup': '2026 prep',
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
  return CONTENT_MANIFEST.liveNationalTeamIds.length > 0;
}
