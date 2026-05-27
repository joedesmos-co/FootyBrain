/**
 * National-team expansion targets (men's only).
 * Used by preview build + Wave 3 rollout report — does not modify sampleData.
 */

/** @typedef {{ id: string, tmCode: string | null, displayName: string, expansionWave: 1 | 2 | 3, searchAliases?: string[], tmMissing?: boolean, registryLabels?: string[] }} NationalTeamTarget */

export const WAVE_1_NATIONAL_TEAM_IDS = [
  'england',
  'france',
  'spain',
  'brazil',
  'argentina',
];

export const WAVE_2_NATIONAL_TEAM_IDS = [
  'germany',
  'portugal',
  'italy',
  'netherlands',
  'belgium',
  'croatia',
  'switzerland',
  'denmark',
  'serbia',
  'turkey',
  'united-states',
  'mexico',
  'uruguay',
  'colombia',
  'chile',
  'morocco',
  'senegal',
  'nigeria',
  'japan',
  'korea-republic',
];

/** Wave 3 — new preview targets (not live until rollout gate passes). */
export const WAVE_3_NATIONAL_TEAM_IDS = [
  'norway',
  'sweden',
  'poland',
  'austria',
  'czechia',
  'ukraine',
  'wales',
  'scotland',
  'republic-of-ireland',
  'ghana',
  'cameroon',
  'egypt',
  'algeria',
  'tunisia',
  'cote-divoire',
  'australia',
  'iran',
  'saudi-arabia',
  'qatar',
  'costa-rica',
  'canada',
  'paraguay',
  'ecuador',
  'peru',
  'bosnia-herzegovina',
  'congo-dr',
  'haiti',
];

/** FootyBrain id ↔ TM slug ↔ registry nationality labels */
export const NATIONAL_TEAM_TARGETS = [
  // Wave 1
  { id: 'england', tmCode: 'england', displayName: 'England', expansionWave: 1 },
  { id: 'france', tmCode: 'france', displayName: 'France', expansionWave: 1 },
  { id: 'spain', tmCode: 'spain', displayName: 'Spain', expansionWave: 1 },
  { id: 'brazil', tmCode: 'brazil', displayName: 'Brazil', expansionWave: 1 },
  { id: 'argentina', tmCode: 'argentina', displayName: 'Argentina', expansionWave: 1 },
  // Wave 2
  { id: 'germany', tmCode: 'germany', displayName: 'Germany', expansionWave: 2 },
  { id: 'portugal', tmCode: 'portugal', displayName: 'Portugal', expansionWave: 2 },
  { id: 'italy', tmCode: 'italy', displayName: 'Italy', expansionWave: 2 },
  {
    id: 'netherlands',
    tmCode: 'netherlands',
    displayName: 'Netherlands',
    expansionWave: 2,
    searchAliases: ['holland', 'ned', 'oranje', 'dutch national team'],
  },
  { id: 'belgium', tmCode: 'belgium', displayName: 'Belgium', expansionWave: 2 },
  { id: 'croatia', tmCode: 'croatia', displayName: 'Croatia', expansionWave: 2 },
  { id: 'switzerland', tmCode: 'switzerland', displayName: 'Switzerland', expansionWave: 2 },
  { id: 'denmark', tmCode: 'denmark', displayName: 'Denmark', expansionWave: 2 },
  { id: 'serbia', tmCode: 'serbia', displayName: 'Serbia', expansionWave: 2 },
  {
    id: 'turkey',
    tmCode: 'turkiye',
    displayName: 'Turkey',
    expansionWave: 2,
    searchAliases: ['turkiye', 'türkiye', 'tur'],
  },
  {
    id: 'united-states',
    tmCode: 'united-states',
    displayName: 'United States',
    expansionWave: 2,
    searchAliases: ['usa', 'usmnt', 'us soccer', 'united states'],
    registryLabels: ['united states', 'usa', 'american', 'us'],
  },
  {
    id: 'mexico',
    tmCode: 'mexico',
    displayName: 'Mexico',
    expansionWave: 2,
    searchAliases: ['mex', 'el tri', 'mexico nt'],
    registryLabels: ['mexico', 'mexican'],
  },
  { id: 'uruguay', tmCode: 'uruguay', displayName: 'Uruguay', expansionWave: 2 },
  { id: 'colombia', tmCode: 'colombia', displayName: 'Colombia', expansionWave: 2 },
  { id: 'chile', tmCode: 'chile', displayName: 'Chile', expansionWave: 2 },
  { id: 'morocco', tmCode: 'morocco', displayName: 'Morocco', expansionWave: 2 },
  { id: 'senegal', tmCode: 'senegal', displayName: 'Senegal', expansionWave: 2 },
  { id: 'nigeria', tmCode: 'nigeria', displayName: 'Nigeria', expansionWave: 2 },
  { id: 'japan', tmCode: 'japan', displayName: 'Japan', expansionWave: 2 },
  {
    id: 'korea-republic',
    tmCode: 'south-korea',
    displayName: 'South Korea',
    expansionWave: 2,
    searchAliases: ['korea republic', 'south korea', 'kor'],
    registryLabels: ['south korea', 'korea republic', 'korean', 'korea'],
  },
  // Wave 3
  { id: 'norway', tmCode: 'norway', displayName: 'Norway', expansionWave: 3, registryLabels: ['norway', 'norwegian'] },
  { id: 'sweden', tmCode: 'sweden', displayName: 'Sweden', expansionWave: 3, registryLabels: ['sweden', 'swedish'] },
  { id: 'poland', tmCode: 'poland', displayName: 'Poland', expansionWave: 3, registryLabels: ['poland', 'polish'] },
  { id: 'austria', tmCode: 'austria', displayName: 'Austria', expansionWave: 3, registryLabels: ['austria', 'austrian'] },
  {
    id: 'czechia',
    tmCode: 'czech-republic',
    displayName: 'Czechia',
    expansionWave: 3,
    searchAliases: ['czech republic', 'czechia', 'cze'],
    registryLabels: ['czechia', 'czech republic', 'czech'],
  },
  { id: 'ukraine', tmCode: 'ukraine', displayName: 'Ukraine', expansionWave: 3, registryLabels: ['ukraine', 'ukrainian'] },
  { id: 'wales', tmCode: 'wales', displayName: 'Wales', expansionWave: 3, registryLabels: ['wales', 'welsh'] },
  { id: 'scotland', tmCode: 'scotland', displayName: 'Scotland', expansionWave: 3, registryLabels: ['scotland', 'scottish'] },
  {
    id: 'republic-of-ireland',
    tmCode: 'republic-of-ireland',
    displayName: 'Republic of Ireland',
    expansionWave: 3,
    searchAliases: ['ireland', 'roi', 'republic of ireland nt'],
    registryLabels: ['republic of ireland', 'ireland', 'irish'],
  },
  { id: 'ghana', tmCode: 'ghana', displayName: 'Ghana', expansionWave: 3, registryLabels: ['ghana', 'ghanaian'] },
  {
    id: 'cameroon',
    tmCode: null,
    displayName: 'Cameroon',
    expansionWave: 3,
    tmMissing: true,
    registryLabels: ['cameroon', 'cameroonian'],
  },
  { id: 'egypt', tmCode: 'egypt', displayName: 'Egypt', expansionWave: 3, registryLabels: ['egypt', 'egyptian'] },
  { id: 'algeria', tmCode: 'algeria', displayName: 'Algeria', expansionWave: 3, registryLabels: ['algeria', 'algerian'] },
  { id: 'tunisia', tmCode: 'tunisia', displayName: 'Tunisia', expansionWave: 3, registryLabels: ['tunisia', 'tunisian'] },
  {
    id: 'cote-divoire',
    tmCode: null,
    displayName: "Côte d'Ivoire",
    expansionWave: 3,
    searchAliases: ['ivory coast', 'cote divoire', "côte d'ivoire", 'civ'],
    registryLabels: ["cote d'ivoire", 'cote divoire', 'ivory coast', 'ivorian'],
  },
  { id: 'australia', tmCode: 'australia', displayName: 'Australia', expansionWave: 3, registryLabels: ['australia', 'australian'] },
  {
    id: 'iran',
    tmCode: 'iran',
    displayName: 'IR Iran',
    expansionWave: 3,
    searchAliases: ['iran', 'ir iran', 'persian'],
    registryLabels: ['iran', 'iranian'],
  },
  {
    id: 'saudi-arabia',
    tmCode: 'saudi-arabia',
    displayName: 'Saudi Arabia',
    expansionWave: 3,
    registryLabels: ['saudi arabia', 'saudi'],
  },
  { id: 'qatar', tmCode: 'qatar', displayName: 'Qatar', expansionWave: 3, registryLabels: ['qatar', 'qatari'] },
  {
    id: 'costa-rica',
    tmCode: 'costa-rica',
    displayName: 'Costa Rica',
    expansionWave: 3,
    registryLabels: ['costa rica', 'costa rican'],
  },
  { id: 'canada', tmCode: 'canada', displayName: 'Canada', expansionWave: 3, registryLabels: ['canada', 'canadian'] },
  { id: 'paraguay', tmCode: 'paraguay', displayName: 'Paraguay', expansionWave: 3, registryLabels: ['paraguay', 'paraguayan'] },
  { id: 'ecuador', tmCode: 'ecuador', displayName: 'Ecuador', expansionWave: 3, registryLabels: ['ecuador', 'ecuadorian'] },
  {
    id: 'bosnia-herzegovina',
    tmCode: 'bosnia-herzegovina',
    displayName: 'Bosnia and Herzegovina',
    expansionWave: 3,
    searchAliases: ['bosnia', 'bosnia-herzegovina', 'bosnia and herzegovina', 'bih'],
    registryLabels: ['bosnia-herzegovina', 'bosnia and herzegovina', 'bosnian', 'bosnia'],
  },
  {
    id: 'congo-dr',
    tmCode: null,
    displayName: 'Congo DR',
    expansionWave: 3,
    tmMissing: true,
    searchAliases: ['dr congo', 'congo dr', 'drc', 'democratic republic of the congo'],
    registryLabels: [
      'dr congo',
      'congo dr',
      'democratic republic of the congo',
      'drc',
    ],
  },
  {
    id: 'haiti',
    tmCode: null,
    displayName: 'Haiti',
    expansionWave: 3,
    tmMissing: true,
    searchAliases: ['haiti', 'hayti'],
    registryLabels: ['haiti', 'haitian'],
  },
  { id: 'peru', tmCode: 'peru', displayName: 'Peru', expansionWave: 3, registryLabels: ['peru', 'peruvian'] },
];

export const PRIORITY_NATIONAL_TEAMS = NATIONAL_TEAM_TARGETS;

export const PRIORITY_TM_CODES = new Set(
  NATIONAL_TEAM_TARGETS.map((t) => t.tmCode).filter(Boolean),
);

export const REGISTRY_NATIONALITY_LABELS = Object.fromEntries(
  NATIONAL_TEAM_TARGETS.map((t) => [t.id, t.registryLabels ?? [t.displayName.toLowerCase()]]),
);

export const QUIZ_MIN_LIVE = 3;
export const LINKED_MIN_HEALTHY = 8;
