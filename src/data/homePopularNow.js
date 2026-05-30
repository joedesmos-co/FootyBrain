/**
 * Homepage “Popular right now” lanes — curated from existing routes and manifest only.
 */

import { CLUB_QUIZ_CATEGORY_CATALOG } from './clubQuizCategories.js';
import { DATASET_META } from './datasetMeta.js';
import { getHubLeagues } from './leagueManifest.js';

/** Mirror worldCupHubData featured IDs — avoid heavy nationalTeamLive import on home chunk. */
const FEATURED_NATION_LINKS = [
  { id: 'argentina', label: 'Argentina' },
  { id: 'brazil', label: 'Brazil' },
  { id: 'france', label: 'France' },
  { id: 'england', label: 'England' },
  { id: 'germany', label: 'Germany' },
  { id: 'spain', label: 'Spain' },
  { id: 'united-states', label: 'United States' },
  { id: 'mexico', label: 'Mexico' },
];

const TOP_CLUB_LINKS = [
  { to: '/team/barcelona', label: 'Barcelona', hint: 'La Liga · squad & quiz' },
  { to: '/team/real-madrid', label: 'Real Madrid', hint: 'La Liga · rivals' },
  { to: '/team/arsenal', label: 'Arsenal', hint: 'Premier League' },
  { to: '/team/liverpool', label: 'Liverpool', hint: 'Premier League' },
  { to: '/team/manchester-city', label: 'Manchester City', hint: 'Premier League' },
  { to: '/hubs/quizzes/team/barcelona', label: 'Barcelona quiz guide', hint: 'Club quiz tips' },
];

const DISCOVER_LINKS = [
  { to: '/hubs/quizzes/league/premier-league', label: 'Premier League quiz guide', hint: 'League study' },
  { to: '/hubs/quizzes/clubs/stadium', label: 'Guess club by stadium', hint: 'Club quiz' },
  { to: '/hubs/players/by-nationality', label: 'Players by nationality', hint: 'Explore' },
  { to: '/world-cup', label: 'World Cup 2026 prep', hint: 'Nations & quizzes' },
  { to: '/national-teams', label: 'National teams', hint: 'International squads' },
  { to: '/collections', label: 'Study collections', hint: 'Themed lists' },
];

/**
 * @returns {Array<{ id: string, title: string, subtitle?: string, items: Array<{ to: string, label: string, hint?: string }> }>}
 */
export function getHomePopularSections() {
  const stadiumQuiz = CLUB_QUIZ_CATEGORY_CATALOG.find((c) => c.id === 'stadium');
  const quizReady = DATASET_META.quizEligibleCount ?? 518;

  return [
    {
      id: 'play-now',
      title: 'Popular right now',
      subtitle: 'Jump into quizzes — streaks, hints, and daily XP on device',
      items: [
        {
          to: '/quiz',
          label: 'Player name quiz',
          hint: `${quizReady.toLocaleString()} players with clues`,
        },
        {
          to: '/club-quiz',
          label: 'Club knowledge quiz',
          hint: 'Stadiums, leagues, rivalries',
        },
        {
          to: '/daily',
          label: 'Daily challenge',
          hint: '5 questions · build a streak',
        },
        {
          to: '/quiz?theme=world-cup',
          label: 'World Cup football quiz',
          hint: '2026 prep player pool',
        },
        {
          to: '/club-quiz?category=stadium',
          label: stadiumQuiz?.label ?? 'Guess club by stadium',
          hint: 'Iconic grounds',
        },
        { to: '/browse', label: 'Browse football players', hint: 'Profiles before you quiz' },
      ],
    },
    {
      id: 'leagues',
      title: 'Explore by league',
      subtitle: 'Squads, quizzes, and league context',
      items: getHubLeagues().map((league) => ({
        to: `/league/${league.id}`,
        label: league.name,
        hint: `${league.teamCount} clubs · ${league.playerCount} players`,
      })),
    },
    {
      id: 'clubs',
      title: 'Clubs fans open most',
      items: TOP_CLUB_LINKS,
    },
    {
      id: 'nations',
      title: 'World Cup & national teams',
      subtitle: 'International squads from club football — not official rosters',
      items: [
        { to: '/world-cup', label: 'World Cup 2026 prep', hint: 'Featured nations' },
        ...FEATURED_NATION_LINKS.slice(0, 6).map((nation) => ({
          to: `/national-team/${nation.id}`,
          label: nation.label,
          hint: 'National squad & quiz',
        })),
        { to: '/national-teams', label: 'All national teams', hint: '55+ live pools' },
      ],
    },
    {
      id: 'discover',
      title: 'Discover deeper',
      items: DISCOVER_LINKS,
    },
  ];
}
