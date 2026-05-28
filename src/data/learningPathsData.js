/**
 * Curated learning paths — chains existing collections, quizzes, and profiles.
 * No lesson engine; each step is a normal FootyCompass route.
 */

export const learningPaths = [
  {
    id: 'learn-premier-league',
    title: 'Learn the Premier League',
    description:
      'League page, flagship clubs, headline players, then a Premier League quiz pool.',
    difficulty: 'Beginner',
    tags: ['England', 'League'],
    collectionId: 'learn-premier-league',
    steps: [
      {
        type: 'collection',
        collectionId: 'learn-premier-league',
        title: 'Study the starter collection',
        hint: 'League page, three clubs, and three quiz-ready stars in order.',
      },
      {
        type: 'profile',
        entityType: 'league',
        id: 'premier-league',
        title: 'Premier League league page',
        hint: 'Clubs, quiz-ready count, and league context in the database.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'saka',
        title: 'Spotlight: Bukayo Saka',
        hint: 'Position, club, and career stops on the player profile.',
      },
      {
        type: 'quiz',
        quizLaunch: { leagueId: 'premier-league' },
        title: 'Premier League quiz',
        hint: 'Guess players from hints scoped to the division.',
      },
    ],
  },
  {
    id: 'learn-world-cup-stars',
    title: 'Learn World Cup Stars',
    description:
      '2026 prep route — contender collection, two country pages, then a national-team quiz.',
    difficulty: 'Intermediate',
    tags: ['World Cup', 'National teams', '2026'],
    collectionId: 'world-cup-2026-contenders',
    steps: [
      {
        type: 'collection',
        collectionId: 'world-cup-2026-contenders',
        title: '2026 contenders collection',
        hint: 'Five live nations and one linked star each — mark items learned.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'brazil',
        title: 'Brazil national team',
        hint: 'Fan guide, linked squad, and rivals on the country page.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'argentina',
        title: 'Argentina national team',
        hint: '2022 winners — compare squad depth to Brazil.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'brazil' },
        title: 'Brazil national-team quiz',
        hint: 'Quiz-ready players with live Seleção membership only.',
      },
    ],
  },
  {
    id: 'learn-england-national-team',
    title: 'Learn England',
    description:
      'Three Lions — England Core collection, country page, Eze profile, national quiz.',
    difficulty: 'Intermediate',
    tags: ['England', 'World Cup', 'National teams'],
    collectionId: 'england-core',
    steps: [
      {
        type: 'collection',
        collectionId: 'england-core',
        title: 'England Core collection',
        hint: 'Linked quiz-ready Three Lions in the database.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'england',
        title: 'England national team page',
        hint: 'Squad list, fan guide, and quiz-ready count.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'tm-479999',
        title: 'Spotlight: Eberechi Eze',
        hint: 'Arsenal playmaker — Euro 2024 and England caps.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'england' },
        title: 'England national-team quiz',
        hint: 'Hints from linked England membership pool.',
      },
    ],
  },
  {
    id: 'learn-france-national-team',
    title: 'Learn France',
    description:
      'Les Bleus — World Cup talent collection, country page, Camavinga, France quiz.',
    difficulty: 'Intermediate',
    tags: ['France', 'World Cup', 'National teams'],
    collectionId: 'france-world-cup-talent',
    steps: [
      {
        type: 'collection',
        collectionId: 'france-world-cup-talent',
        title: 'France World Cup Talent',
        hint: '2018 and 2022 pedigree players with live links.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'france',
        title: 'France national team page',
        hint: 'Rivals, fan guide, and full linked squad.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'tm-640428',
        title: 'Spotlight: Eduardo Camavinga',
        hint: 'Real Madrid — 2022 World Cup final midfielder.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'france' },
        title: 'France national-team quiz',
        hint: 'Practice Les Bleus names from linked players.',
      },
    ],
  },
  {
    id: 'learn-spain-national-team',
    title: 'Learn Spain',
    description:
      'La Roja — midfield collection, country page, Merino spotlight, Spain quiz.',
    difficulty: 'Intermediate',
    tags: ['Spain', 'World Cup', 'National teams'],
    collectionId: 'spain-midfield-masters',
    steps: [
      {
        type: 'collection',
        collectionId: 'spain-midfield-masters',
        title: 'Spain Midfield Masters',
        hint: 'Euro 2024 core plus Isco’s 2010 World Cup arc.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'spain',
        title: 'Spain national team page',
        hint: 'Linked squad and La Roja identity copy.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'tm-338424',
        title: 'Spotlight: Mikel Merino',
        hint: 'Euro 2024 hero — Arsenal and Real Sociedad roots.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'spain' },
        title: 'Spain national-team quiz',
        hint: 'Linked Spanish players with quiz hints.',
      },
    ],
  },
  {
    id: 'learn-brazil-national-team',
    title: 'Learn Brazil',
    description:
      'Seleção — Brazil Stars collection, country page, Rodrygo profile, Brazil quiz.',
    difficulty: 'Intermediate',
    tags: ['Brazil', 'World Cup', 'National teams'],
    collectionId: 'brazil-stars',
    steps: [
      {
        type: 'collection',
        collectionId: 'brazil-stars',
        title: 'Brazil Stars collection',
        hint: 'Linked Seleção quiz-ready players in FootyCompass.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'brazil',
        title: 'Brazil national team page',
        hint: 'Yellow shirts, rivals, and squad database.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'tm-412363',
        title: 'Spotlight: Rodrygo',
        hint: 'Real Madrid winger — 2022 World Cup Seleção.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'brazil' },
        title: 'Brazil national-team quiz',
        hint: 'National membership pool only.',
      },
    ],
  },
  {
    id: 'learn-argentina-national-team',
    title: 'Learn Argentina',
    description:
      'Albiceleste — icons collection, country page, Lautaro spotlight, Argentina quiz.',
    difficulty: 'Intermediate',
    tags: ['Argentina', 'World Cup', 'National teams'],
    collectionId: 'argentina-icons',
    steps: [
      {
        type: 'collection',
        collectionId: 'argentina-icons',
        title: 'Argentina Icons collection',
        hint: 'Every linked quiz-ready Albiceleste player today.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'argentina',
        title: 'Argentina national team page',
        hint: '2022 World Cup story and linked squad.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'lautaro',
        title: 'Spotlight: Lautaro Martínez',
        hint: 'Inter striker — Argentina’s main goal threat.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'argentina' },
        title: 'Argentina national-team quiz',
        hint: 'Eight linked quiz-ready players in the pool.',
      },
    ],
  },
  {
    id: 'learn-germany-national-team',
    title: 'Learn Germany',
    description:
      'Die Mannschaft — European stars collection, country page, Musiala spotlight, Germany quiz.',
    difficulty: 'Intermediate',
    tags: ['Germany', 'World Cup', 'National teams'],
    collectionId: 'european-national-team-stars',
    steps: [
      {
        type: 'collection',
        collectionId: 'european-national-team-stars',
        title: 'European National Team Stars',
        hint: 'England, France, and Germany pages with linked quiz-ready names.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'germany',
        title: 'Germany national team page',
        hint: 'Linked squad, rivals, and quiz-ready count.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'musiala',
        title: 'Spotlight: Jamal Musiala',
        hint: 'Bayern playmaker — Germany’s dribbling star.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'germany' },
        title: 'Germany national-team quiz',
        hint: 'National membership pool only — capped session size.',
      },
    ],
  },
  {
    id: 'learn-netherlands-national-team',
    title: 'Learn Netherlands',
    description:
      'Oranje — captains collection, country page, Van Dijk spotlight, Netherlands quiz.',
    difficulty: 'Intermediate',
    tags: ['Netherlands', 'World Cup', 'National teams'],
    collectionId: 'elite-national-team-captains',
    steps: [
      {
        type: 'collection',
        collectionId: 'elite-national-team-captains',
        title: 'Elite National-Team Captains',
        hint: 'Armband leaders tied to country and club.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'netherlands',
        title: 'Netherlands national team page',
        hint: 'Orange shirts, rivals, and full linked squad.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'van-dijk',
        title: 'Spotlight: Virgil van Dijk',
        hint: 'Liverpool captain — Netherlands defensive leader.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'netherlands' },
        title: 'Netherlands national-team quiz',
        hint: 'Linked Oranje players with quiz hints.',
      },
    ],
  },
  {
    id: 'learn-portugal-national-team',
    title: 'Learn Portugal',
    description:
      'A Seleção — golden generations collection, country page, Bruno Fernandes, Portugal quiz.',
    difficulty: 'Intermediate',
    tags: ['Portugal', 'World Cup', 'National teams'],
    collectionId: 'golden-generations',
    steps: [
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'portugal',
        title: 'Portugal national team page',
        hint: 'Linked squad and Iberian rivals in FootyCompass.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'tm-240306',
        title: 'Spotlight: Bruno Fernandes',
        hint: 'Manchester United — Portugal playmaker and captain.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'portugal' },
        title: 'Portugal national-team quiz',
        hint: 'Quiz-ready players with live Portugal membership.',
      },
    ],
  },
  {
    id: 'learn-italy-national-team',
    title: 'Learn Italy',
    description:
      'Gli Azzurri — country page, Barella spotlight, Italy national quiz.',
    difficulty: 'Intermediate',
    tags: ['Italy', 'World Cup', 'National teams'],
    steps: [
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'italy',
        title: 'Italy national team page',
        hint: 'Four World Cups, blue shirts, and linked squad.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'barella',
        title: 'Spotlight: Nicolò Barella',
        hint: 'Inter midfielder — Italy’s box-to-box engine.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'italy' },
        title: 'Italy national-team quiz',
        hint: 'Linked Azzurri with editorial quiz profiles.',
      },
    ],
  },
  {
    id: 'learn-united-states-national-team',
    title: 'Learn United States',
    description:
      'USMNT — CONCACAF watchlist collection, country page, Reyna spotlight, USA quiz.',
    difficulty: 'Beginner',
    tags: ['USA', 'World Cup 2026', 'National teams'],
    collectionId: 'usmnt-concacaf-watchlist',
    steps: [
      {
        type: 'collection',
        collectionId: 'usmnt-concacaf-watchlist',
        title: 'USMNT / CONCACAF Watchlist',
        hint: 'United States page and linked quiz-ready USMNT players.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'united-states',
        title: 'United States national team page',
        hint: '2026 co-host — squad list and rivals.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'tm-504215',
        title: 'Spotlight: Giovanni Reyna',
        hint: 'Attacking midfielder in the USMNT quiz pool.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'united-states' },
        title: 'United States national-team quiz',
        hint: 'National membership pool — minimum three quiz-ready.',
      },
    ],
  },
  {
    id: 'learn-world-cup-legends',
    title: 'Learn World Cup Legends',
    description:
      'Legends collection, Argentina page, Messi profile, then an Albiceleste quiz.',
    difficulty: 'Advanced',
    tags: ['World Cup', 'National teams'],
    collectionId: 'world-cup-legends',
    steps: [
      {
        type: 'collection',
        collectionId: 'world-cup-legends',
        title: 'World Cup Legends collection',
        hint: 'Seven quiz-ready names from 2010 through 2022 — mark each learned.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'argentina',
        title: 'Argentina national team',
        hint: '2022 winners — linked squad and fan guide.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'tm-28003',
        title: 'Spotlight: Lionel Messi',
        hint: 'Captain, clubs, and Qatar 2022 arc on the profile.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'argentina' },
        title: 'Argentina national-team quiz',
        hint: 'Quiz-ready players with live Albiceleste membership.',
      },
    ],
  },
  {
    id: 'learn-tournament-stars',
    title: 'Learn Tournament Stars',
    description:
      'Tournament stars collection, France page, Pavard profile, France national quiz.',
    difficulty: 'Advanced',
    tags: ['World Cup', 'National teams'],
    collectionId: 'tournament-stars',
    steps: [
      {
        type: 'collection',
        collectionId: 'tournament-stars',
        title: 'Tournament Stars collection',
        hint: 'Final heroes and award winners — compare two profiles before the quiz.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'france',
        title: 'France national team',
        hint: '2018 winners and 2022 finalists — full linked pool.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'tm-353366',
        title: 'Spotlight: Benjamin Pavard',
        hint: '2018 World Cup winner — versatile France defender.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'france' },
        title: 'France national-team quiz',
        hint: 'Practice Les Bleus from linked quiz-ready players.',
      },
    ],
  },
  {
    id: 'learn-international-midfielders',
    title: 'Learn International Midfielders',
    description:
      'Modern midfield collection, Spain page, Merino spotlight, La Roja quiz.',
    difficulty: 'Intermediate',
    tags: ['National teams', 'Midfield'],
    collectionId: 'modern-international-midfielders',
    steps: [
      {
        type: 'collection',
        collectionId: 'modern-international-midfielders',
        title: 'Modern International Midfielders',
        hint: 'Eight national-team mids — open profiles and use Compare on two names.',
      },
      {
        type: 'profile',
        entityType: 'national-team',
        id: 'spain',
        title: 'Spain national team',
        hint: 'Euro 2024 champions — midfield depth in the linked squad.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'tm-338424',
        title: 'Spotlight: Mikel Merino',
        hint: 'Spain box-to-box star — Euro 2024 and Arsenal.',
      },
      {
        type: 'quiz',
        quizLaunch: { nationalTeamId: 'spain' },
        title: 'Spain national-team quiz',
        hint: 'Linked Spanish players with quiz hints only.',
      },
    ],
  },
  {
    id: 'learn-tactical-midfielders',
    title: 'Learn Tactical Midfielders',
    description:
      'Pivots and playmakers — read profiles for role and club, then quiz the pool.',
    difficulty: 'Intermediate',
    tags: ['Midfield', 'Tactics'],
    collectionId: 'tactical-midfielders',
    steps: [
      {
        type: 'collection',
        collectionId: 'tactical-midfielders',
        title: 'Midfielder study list',
        hint: 'Six profiles spanning pivot, metronome, and advanced playmaker roles.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'rodri',
        title: 'Spotlight: Rodri',
        hint: 'Manchester City pivot — defensive screen and progression.',
      },
      {
        type: 'profile',
        entityType: 'player',
        id: 'modric',
        title: 'Spotlight: Luka Modrić',
        hint: 'Tempo, press resistance, and Madrid Champions League era.',
      },
      {
        type: 'quiz',
        quizLaunch: { teamId: 'manchester-city' },
        title: 'City midfield quiz',
        hint: 'Reinforce Rodri and Foden-era names from one club pool.',
      },
    ],
  },
  {
    id: 'learn-ucl-clubs',
    title: 'Learn UCL Clubs',
    description:
      'European giants in the database — club profiles first, then Madrid-focused quiz.',
    difficulty: 'Intermediate',
    tags: ['Champions League', 'Clubs'],
    collectionId: 'ucl-clubs',
    steps: [
      {
        type: 'collection',
        collectionId: 'ucl-clubs',
        title: 'UCL club identity collection',
        hint: 'Six team profiles — squads, fan guides, and league links.',
      },
      {
        type: 'profile',
        entityType: 'team',
        id: 'real-madrid',
        title: 'Real Madrid club page',
        hint: 'History, legends strings, and full squad database view.',
      },
      {
        type: 'profile',
        entityType: 'team',
        id: 'bayern-munich',
        title: 'Bayern Munich club page',
        hint: 'Bundesliga context and European pedigree in one profile.',
      },
      {
        type: 'quiz',
        quizLaunch: { teamId: 'real-madrid' },
        title: 'Real Madrid quiz',
        hint: 'Guess Los Blancos players from editorial hints.',
      },
      {
        type: 'collection',
        collectionId: 'ucl-legends',
        title: 'Optional: UCL legends players',
        hint: 'Eight knockout-era stars if you want names beyond club pages.',
      },
    ],
  },
];

export function getLearningPathById(id) {
  return learningPaths.find((path) => path.id === id) ?? null;
}

/** @type {Record<string, string>} */
export const NATIONAL_TEAM_LEARNING_PATH_IDS = {
  england: 'learn-england-national-team',
  france: 'learn-france-national-team',
  spain: 'learn-spain-national-team',
  brazil: 'learn-brazil-national-team',
  argentina: 'learn-argentina-national-team',
  germany: 'learn-germany-national-team',
  netherlands: 'learn-netherlands-national-team',
  portugal: 'learn-portugal-national-team',
  italy: 'learn-italy-national-team',
  'united-states': 'learn-united-states-national-team',
};

export function getLearningPathIdForNationalTeam(nationalTeamId) {
  return NATIONAL_TEAM_LEARNING_PATH_IDS[nationalTeamId] ?? null;
}

export function getLearningPathForNationalTeam(nationalTeamId) {
  const pathId = getLearningPathIdForNationalTeam(nationalTeamId);
  return pathId ? getLearningPathById(pathId) : null;
}

/** Per-country paths (collection → nation page → player → national quiz). */
export function getCountryLearningPaths() {
  return Object.values(NATIONAL_TEAM_LEARNING_PATH_IDS)
    .map((id) => getLearningPathById(id))
    .filter(Boolean);
}

const WORLD_CUP_HUB_PATH_IDS = [
  'learn-world-cup-legends',
  'learn-tournament-stars',
  'learn-international-midfielders',
  ...Object.values(NATIONAL_TEAM_LEARNING_PATH_IDS),
];

/** Curated paths surfaced on /world-cup (country routes + tournament study arcs). */
export function getWorldCupHubLearningPaths() {
  return WORLD_CUP_HUB_PATH_IDS.map((id) => getLearningPathById(id)).filter(Boolean);
}

export function getWorldCupLearningPaths() {
  return learningPaths.filter((path) => path.tags?.includes('World Cup'));
}
