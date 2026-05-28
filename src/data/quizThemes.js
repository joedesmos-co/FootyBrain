/**
 * Themed quiz catalog — metadata for UI, SEO hubs, and recommendations.
 * Pool logic lives in src/utils/quizThemePools.js.
 */

export const QUIZ_THEME_CATEGORIES = [
  { id: 'competition', label: 'Competitions & eras' },
  { id: 'players', label: 'Player types' },
  { id: 'geography', label: 'Leagues & nations' },
];

/** @typedef {'competition' | 'players' | 'geography'} QuizThemeCategory */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   description: string,
 *   icon: string,
 *   category: QuizThemeCategory,
 *   defaultDifficulty: 'easy' | 'medium' | 'hard' | 'hardcore' | 'nerd',
 *   minPool: number,
 *   seoTitle: string,
 *   seoDescription: string,
 *   collectionIds?: string[],
 *   preset?: { poolFocus?: string, leagueId?: string, nationalTeamId?: string, worldCup?: boolean },
 * }} QuizThemeDefinition
 */

/** @type {QuizThemeDefinition[]} */
export const QUIZ_THEME_CATALOG = [
  {
    id: 'wonderkids',
    label: 'Wonderkids',
    description: 'Young quiz-ready stars (23 or under) with real clues — learn them before they become icons.',
    icon: '✨',
    category: 'players',
    defaultDifficulty: 'easy',
    minPool: 3,
    seoTitle: 'Wonderkids football quiz',
    seoDescription:
      'Guess young footballers from hints. A curated wonderkids quiz using FootyCompass quiz-ready players.',
    collectionIds: ['wonderkids'],
  },
  {
    id: 'legends',
    label: 'Legends',
    description: 'Household names and trophy-winning eras — Ballon d’Or winners, UCL icons, and headline stars.',
    icon: '👑',
    category: 'players',
    defaultDifficulty: 'medium',
    minPool: 3,
    seoTitle: 'Football legends quiz',
    seoDescription:
      'Legend player quiz: Champions League icons, award winners, and high-impact names with quiz clues.',
    collectionIds: ['ballon-dor-winners', 'ucl-legends'],
  },
  {
    id: 'cult-heroes',
    label: 'Cult heroes',
    description: 'Beloved squad players and fan favourites — recognizable, but not always the cover star.',
    icon: '🧣',
    category: 'players',
    defaultDifficulty: 'medium',
    minPool: 3,
    seoTitle: 'Cult hero football quiz',
    seoDescription:
      'Quiz on cult heroes and fan-favourite players — mid-tier importance, strong clues, great for replay.',
  },
  {
    id: 'top-scorers',
    label: 'Top scorers',
    description: 'Forwards and attacking players who carry goal threat — strikers and wingers with high impact.',
    icon: '⚽',
    category: 'players',
    defaultDifficulty: 'medium',
    minPool: 3,
    seoTitle: 'Top scorer football quiz',
    seoDescription:
      'Guess goal scorers and attackers from hints — a forward-focused quiz pool on FootyCompass.',
  },
  {
    id: 'champions-league',
    label: 'Champions League',
    description: 'European nights energy — UCL-era players and clubs built for knockout football.',
    icon: '🏆',
    category: 'competition',
    defaultDifficulty: 'hard',
    minPool: 3,
    seoTitle: 'Champions League player quiz',
    seoDescription:
      'Champions League player quiz with European club context — UCL legends and veterans in the dataset.',
    collectionIds: ['ucl-legends', 'champions-league-veterans'],
  },
  {
    id: 'world-cup',
    label: 'World Cup squads',
    description: 'International prep — featured nations and linked player pools for tournament recognition.',
    icon: '🌍',
    category: 'competition',
    defaultDifficulty: 'medium',
    minPool: 3,
    seoTitle: 'World Cup player quiz',
    seoDescription:
      'World Cup player quiz hub session — international lineups and national-team linked players.',
    preset: { poolFocus: 'international', worldCup: true },
  },
  {
    id: 'veterans',
    label: 'Veteran era',
    description: 'Experienced pros (32+) still shaping squads — recognition through clubs and national teams.',
    icon: '🎖️',
    category: 'competition',
    defaultDifficulty: 'hard',
    minPool: 3,
    seoTitle: 'Veteran footballers quiz',
    seoDescription:
      'Quiz on veteran footballers aged 32+ with quiz clues — experience, leadership, and longevity.',
  },
  {
    id: 'premier-league',
    label: 'Premier League',
    description: 'England’s top flight — clubs, rivalries, and quiz-ready players from the Premier League pool.',
    icon: '🦁',
    category: 'geography',
    defaultDifficulty: 'medium',
    minPool: 3,
    seoTitle: 'Premier League player quiz',
    seoDescription:
      'Premier League player quiz — guess players from hints across English top-flight squads.',
    preset: { poolFocus: 'league', leagueId: 'premier-league' },
  },
  {
    id: 'la-liga',
    label: 'La Liga',
    description: 'Spanish football flavour — technical midfielders, wide forwards, and Clásico-era names.',
    icon: '🇪🇸',
    category: 'geography',
    defaultDifficulty: 'medium',
    minPool: 3,
    seoTitle: 'La Liga player quiz',
    seoDescription: 'La Liga player quiz — Spanish league squads and quiz-ready players on FootyCompass.',
    preset: { poolFocus: 'league', leagueId: 'la-liga' },
  },
  {
    id: 'serie-a',
    label: 'Serie A',
    description: 'Italian defensive craft and attacking flair — Serie A quiz-ready players only.',
    icon: '🇮🇹',
    category: 'geography',
    defaultDifficulty: 'medium',
    minPool: 3,
    seoTitle: 'Serie A player quiz',
    seoDescription: 'Serie A football quiz — guess Italian league players from curated hints.',
    preset: { poolFocus: 'league', leagueId: 'serie-a' },
  },
  {
    id: 'bundesliga',
    label: 'Bundesliga',
    description: 'German pressing and transition — Bundesliga squads with enough clues for fair sessions.',
    icon: '🇩🇪',
    category: 'geography',
    defaultDifficulty: 'medium',
    minPool: 3,
    seoTitle: 'Bundesliga player quiz',
    seoDescription: 'Bundesliga player quiz — German league recognition with FootyCompass quiz clues.',
    preset: { poolFocus: 'league', leagueId: 'bundesliga' },
  },
  {
    id: 'derby-rivalries',
    label: 'Derby rivalries',
    description: 'Players from clubs with listed rivals — derbies, feuds, and local bragging rights.',
    icon: '⚔️',
    category: 'competition',
    defaultDifficulty: 'hard',
    minPool: 3,
    seoTitle: 'Football rivalry quiz',
    seoDescription:
      'Rivalry football quiz — players from derby clubs in the dataset. Learn names through local feuds.',
  },
];

export function getQuizThemeById(themeId) {
  const id = String(themeId ?? '').trim();
  if (!id) return null;
  return QUIZ_THEME_CATALOG.find((t) => t.id === id) ?? null;
}

export function getQuizThemeIdForLeague(leagueId) {
  const id = String(leagueId ?? '').trim();
  if (!id) return null;
  return QUIZ_THEME_CATALOG.find((t) => t.preset?.leagueId === id)?.id ?? null;
}

export function getQuizThemePlayHref(themeId, { difficulty } = {}) {
  const params = new URLSearchParams();
  params.set('theme', themeId);
  const theme = getQuizThemeById(themeId);
  if (theme?.defaultDifficulty && !difficulty) {
    params.set('difficulty', theme.defaultDifficulty);
  } else if (difficulty) {
    params.set('difficulty', difficulty);
  }
  const preset = theme?.preset;
  if (preset?.poolFocus) params.set('poolFocus', preset.poolFocus);
  if (preset?.leagueId) params.set('league', preset.leagueId);
  if (preset?.nationalTeamId) params.set('nationalTeam', preset.nationalTeamId);
  if (preset?.worldCup) params.set('worldCup', 'prep');
  return `/quiz?${params.toString()}`;
}
