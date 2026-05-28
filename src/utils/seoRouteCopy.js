/**
 * Static route title/description copy (no heavy data imports — safe for Node audits).
 */

import { pageTitle } from './brand.js';

const STATIC_ROUTE_SEO = {
  '/': {
    title: pageTitle('Learn football with free player & club quizzes'),
    description:
      'FootyCompass helps you learn football: 4,800+ player profiles, club guides, league hubs, national teams, and daily quizzes — free, no account.',
    faqs: [
      {
        question: 'What is FootyCompass?',
        answer:
          'A football discovery and learning site with player profiles, club pages, quizzes, and daily challenges built from a curated dataset snapshot.',
      },
      {
        question: 'Do I need an account?',
        answer: 'No — quizzes, browse, and progress stored locally in your browser.',
      },
    ],
  },
  '/browse': {
    title: pageTitle('Browse football players by club & league'),
    description:
      'Search and filter 4,800+ football players by club, league, and nationality. Open profiles, then test yourself with quizzes on FootyCompass.',
  },
  '/teams': {
    title: pageTitle('Football clubs — squads, rivals & quizzes'),
    description:
      'Explore football clubs worldwide: full squads, rivalries, stadium notes, and club quizzes. Jump to player profiles from any team page.',
  },
  '/collections': {
    title: pageTitle('Football study collections & learning paths'),
    description:
      'Curated football study lists and guided learning paths — open player profiles in order, then finish with a linked quiz. World Cup prep included.',
  },
  '/learning-paths': {
    title: pageTitle('Guided football learning paths'),
    description:
      'Step-by-step football study routes: collections, profile deep-dives, and quizzes. World Cup and national team paths — no account required.',
  },
  '/national-teams': {
    title: pageTitle('National football teams — squads & quizzes'),
    description:
      'Browse men\'s national teams on FootyCompass: linked club players, quiz pools, World Cup prep, and nationality discovery hubs.',
  },
  '/world-cup': {
    title: pageTitle('World Cup 2026 hub — nations, quizzes & study'),
    description:
      'World Cup 2026 prep on FootyCompass: featured nations, group draw, study collections, international quizzes, and links to every national team page.',
  },
  '/about': {
    title: pageTitle('About FootyCompass'),
    description:
      'FootyCompass is an independent football learning project — player profiles, quizzes, and discovery hubs built for fans who want to remember names faster.',
  },
  '/editorial': {
    title: pageTitle('Editorial policy & data sources'),
    description:
      'How FootyCompass handles data: dataset snapshots, original quiz hints, corrections, and what we do (and don\'t) claim about accuracy.',
  },
  '/privacy': {
    title: pageTitle('Privacy policy'),
    description:
      'FootyCompass privacy policy: local storage, cookies, analytics, and Google AdSense. What we store on your device and how to contact us.',
  },
  '/onboarding': {
    title: pageTitle('How FootyCompass works'),
    description:
      'New to FootyCompass? Learn how to browse players, compare clubs, build quiz streaks, and use daily challenges — quick start guide.',
  },
  '/compare': {
    title: pageTitle('Compare football players & clubs'),
    description:
      'Compare two football players or two clubs side by side — roles, squads, rivals, and importance scores. Open profiles, then quiz on FootyCompass.',
  },
  '/daily': {
    title: pageTitle('Daily football quiz challenge'),
    description:
      'Today\'s daily football challenge: five guess-the-player questions, streak tracking, and bonus XP. New set every day on FootyCompass.',
  },
  '/quiz': {
    title: pageTitle('Football player quiz — guess from hints'),
    description:
      'Free football player quiz: guess names from hints by club, league, nation, or theme. Streaks, XP, and links to 4,800+ profiles on FootyCompass.',
  },
  '/club-quiz': {
    title: pageTitle('Club football quiz — stadiums, rivalries & kits'),
    description:
      'Club football quizzes: stadiums, leagues, rivalries, history, kits, and legends. Multiple choice or typing — streaks and XP on FootyCompass.',
  },
  '/hubs': {
    title: pageTitle('Football discovery hubs — quizzes & players'),
    description:
      'SEO-friendly football hubs: quizzes by league and club, players by nationality, young stars, and World Cup prep — all linking into FootyCompass profiles.',
  },
  '/hubs/quizzes': {
    title: pageTitle('Football quiz hubs by league & club'),
    description:
      'Find football quizzes by league, club, and theme. Landing pages link to squads, player profiles, and play modes on FootyCompass.',
  },
  '/hubs/quizzes/themes': {
    title: pageTitle('Themed football quizzes — legends, wonderkids & more'),
    description:
      'Themed player quizzes: wonderkids, legends, World Cup squads, and league pools. See pool size, difficulty, and play on FootyCompass.',
  },
  '/hubs/quizzes/clubs': {
    title: pageTitle('Club quiz guides — stadium, rivalry & history'),
    description:
      'Index of club knowledge quizzes on FootyCompass — stadium, league, rivalry, country, history, trophies, and kit formats with play links.',
  },
  '/hubs/players/by-nationality': {
    title: pageTitle('Football players by nationality'),
    description:
      'Browse football players grouped by nationality — top countries in our dataset with profile links and quiz suggestions on FootyCompass.',
  },
  '/hubs/players/best-young-footballers': {
    title: pageTitle('Best young footballers to know'),
    description:
      'Best young footballers in the FootyCompass dataset: high-importance U23 players with profiles, clubs, and wonderkid quiz links.',
  },
  '/hubs/world-cup/player-quiz': {
    title: pageTitle('World Cup player quiz hub'),
    description:
      'World Cup player quiz landing page — international pools, featured nations, and links to national team profiles on FootyCompass.',
  },
  '/hubs/learn/football-players': {
    title: pageTitle('Learn football players — study guide'),
    description:
      'How to learn football players faster: browse by club and nationality, use quizzes for spaced repetition, and follow collections on FootyCompass.',
  },
};

function matchPrefix(pathname, prefix, fallback) {
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    return { ...fallback, pathPrefix: prefix };
  }
  return null;
}

/**
 * @param {string} pathname
 */
export function getStaticRouteSeo(pathname) {
  if (STATIC_ROUTE_SEO[pathname]) {
    return { ...STATIC_ROUTE_SEO[pathname] };
  }

  const hubNationality = pathname.match(/^\/hubs\/players\/nationality\/(.+)$/);
  if (hubNationality) {
    const nation = decodeURIComponent(hubNationality[1]);
    return {
      title: pageTitle(`${nation} football players — profiles & quiz`),
      description: `Explore ${nation} football players in the FootyCompass dataset: top profiles by importance, club links, and quiz practice.`,
    };
  }

  if (pathname.startsWith('/hubs/quizzes/league/')) {
    return {
      title: pageTitle('League player quiz hub'),
      description:
        'League quiz landing page — browse clubs and star players, then play the guess-the-player quiz on FootyCompass.',
    };
  }

  if (pathname.startsWith('/hubs/quizzes/team/')) {
    return {
      title: pageTitle('Club player quiz hub'),
      description:
        'Club quiz landing page — key squad players with profile links and a focused team quiz on FootyCompass.',
    };
  }

  if (pathname.startsWith('/hubs/quizzes/theme/')) {
    return {
      title: pageTitle('Themed football player quiz'),
      description:
        'Themed quiz landing page — curated player pool, hints, and play link on FootyCompass.',
    };
  }

  if (pathname.startsWith('/hubs/quizzes/clubs/')) {
    return {
      title: pageTitle('Club quiz format guide'),
      description:
        'Club quiz category guide — how the format works, pool size, and play link on FootyCompass.',
    };
  }

  const prefixFallbacks = [
    matchPrefix(pathname, '/collections', {
      title: pageTitle('Football study collection'),
      description:
        'Curated football collection on FootyCompass — profile checklist, progress tracking, and optional linked quiz.',
    }),
    matchPrefix(pathname, '/learning-paths', {
      title: pageTitle('Football learning path'),
      description:
        'Guided football learning path: ordered profiles, collections, and a finishing quiz on FootyCompass.',
    }),
    matchPrefix(pathname, '/national-team', {
      title: pageTitle('National football team'),
      description:
        'National team player pool, quiz readiness, and World Cup links on FootyCompass.',
    }),
    matchPrefix(pathname, '/league', {
      title: pageTitle('Football league guide'),
      description:
        'League guide with clubs, featured players, rivalries, and quiz links on FootyCompass.',
    }),
    matchPrefix(pathname, '/team', {
      title: pageTitle('Football club profile'),
      description:
        'Club profile with squad, rivals, stadium context, and quizzes on FootyCompass.',
    }),
    matchPrefix(pathname, '/player', {
      title: pageTitle('Football player profile'),
      description:
        'Player profile with club, league, nationality, quiz clues, and related players on FootyCompass.',
    }),
  ];

  for (const row of prefixFallbacks) {
    if (row) return row;
  }

  return {
    title: pageTitle(),
    description:
      'FootyCompass — football discovery and learning with player profiles, clubs, leagues, national teams, and quizzes.',
  };
}
