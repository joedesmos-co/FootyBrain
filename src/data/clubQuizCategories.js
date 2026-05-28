/**
 * Club quiz catalog — club-knowledge formats (not player guess-the-name).
 * Pool builders live in src/utils/clubQuizEngine.js.
 */

/** @typedef {'stadium' | 'league' | 'rivalry' | 'country' | 'player-to-club' | 'history' | 'trophy' | 'kit'} ClubQuizCategoryId */

/**
 * @typedef {{
 *   id: ClubQuizCategoryId,
 *   label: string,
 *   description: string,
 *   icon: string,
 *   defaultDifficulty: 'easy' | 'medium' | 'hard' | 'hardcore' | 'nerd',
 *   seoTitle: string,
 *   seoDescription: string,
 *   mvpTier: 1 | 2 | 3,
 * }} ClubQuizCategoryDefinition
 */

/** @type {ClubQuizCategoryDefinition[]} */
export const CLUB_QUIZ_CATEGORY_CATALOG = [
  {
    id: 'stadium',
    label: 'Guess the club by stadium',
    description: 'Home ground recognition — from iconic arenas to newer builds.',
    icon: '🏟️',
    defaultDifficulty: 'medium',
    mvpTier: 1,
    seoTitle: 'Guess the club by stadium quiz',
    seoDescription:
      'Football stadium quiz: match famous grounds to clubs using FootyCompass editorial data.',
  },
  {
    id: 'league',
    label: 'Guess the league',
    description: 'Which competition does this club play in? Great for learning league geography.',
    icon: '🗺️',
    defaultDifficulty: 'easy',
    mvpTier: 1,
    seoTitle: 'Guess the football league quiz',
    seoDescription:
      'Club league quiz — identify Premier League, La Liga, Serie A, and more from club context.',
  },
  {
    id: 'rivalry',
    label: 'Rivalry & derby',
    description: 'Local feuds and named rivals — derby culture without obscure filler.',
    icon: '⚔️',
    defaultDifficulty: 'medium',
    mvpTier: 1,
    seoTitle: 'Football rivalry quiz',
    seoDescription:
      'Rivalry and derby quiz: match clubs to their listed rivals in the FootyCompass dataset.',
  },
  {
    id: 'country',
    label: 'Club nationality',
    description: 'Where is the club based? Country recognition for global leagues.',
    icon: '🌐',
    defaultDifficulty: 'easy',
    mvpTier: 1,
    seoTitle: 'Club country quiz',
    seoDescription:
      'Guess the country for football clubs — quick geography practice across leagues.',
  },
  {
    id: 'player-to-club',
    label: 'Famous player → club',
    description: 'Legends and key names from club lore — link stars to the right shirt.',
    icon: '⭐',
    defaultDifficulty: 'medium',
    mvpTier: 2,
    seoTitle: 'Famous player to club quiz',
    seoDescription:
      'Which club is this legend associated with? Player-to-club quiz using editorial legend lines.',
  },
  {
    id: 'history',
    label: 'Club history',
    description: 'Recognize clubs from short history snippets — eras, identity, and story beats.',
    icon: '📜',
    defaultDifficulty: 'hard',
    mvpTier: 2,
    seoTitle: 'Football club history quiz',
    seoDescription:
      'Club history quiz: identify teams from curated short-history lines in FootyCompass.',
  },
  {
    id: 'trophy',
    label: 'Trophies & achievements',
    description: 'Titles, European nights, and trophy-era sentences from club histories.',
    icon: '🏆',
    defaultDifficulty: 'hard',
    mvpTier: 2,
    seoTitle: 'Club trophies quiz',
    seoDescription:
      'Trophy and achievement quiz — match achievement clues to the right football club.',
  },
  {
    id: 'kit',
    label: 'Kit & colours',
    description: 'Shirt colours and kit cues from fan guides — visual memory without fake assets.',
    icon: '👕',
    defaultDifficulty: 'medium',
    mvpTier: 3,
    seoTitle: 'Football kit colours quiz',
    seoDescription:
      'Kit and colours quiz: guess the club from shirt colour cues in editorial fan guides.',
  },
];

export const CLUB_QUIZ_MVP_CATEGORY_IDS = CLUB_QUIZ_CATEGORY_CATALOG.filter((c) => c.mvpTier === 1).map(
  (c) => c.id,
);

export function getClubQuizCategoryById(categoryId) {
  const id = String(categoryId ?? '').trim();
  if (!id) return null;
  return CLUB_QUIZ_CATEGORY_CATALOG.find((c) => c.id === id) ?? null;
}

export function getClubQuizPlayHref(categoryId, { difficulty, leagueId } = {}) {
  const params = new URLSearchParams();
  params.set('category', categoryId);
  const cat = getClubQuizCategoryById(categoryId);
  if (cat?.defaultDifficulty && !difficulty) {
    params.set('difficulty', cat.defaultDifficulty);
  } else if (difficulty) {
    params.set('difficulty', difficulty);
  }
  if (leagueId) params.set('league', leagueId);
  return `/club-quiz?${params.toString()}`;
}
