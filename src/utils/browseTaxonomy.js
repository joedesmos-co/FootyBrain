import { getManifestLeagues } from '../data/contentManifest';
import { getLiveNationalTeams } from '../data/nationalTeamData';
import { EXTERNAL_LEAGUE_ID } from './footballDisplay';

/** @typedef {'americas' | 'europe' | 'middle-east-asia' | 'africa' | 'oceania' | 'world'} OtherClubRegionId */

export const EUROPEAN_LEAGUE_IDS = [
  'premier-league',
  'la-liga',
  'bundesliga',
  'serie-a',
  'ligue-1',
  'eredivisie',
];

export const AMERICAN_LEAGUE_IDS = ['mls', 'brasileirao'];

export const OTHER_CLUBS_LEAGUE_ID = EXTERNAL_LEAGUE_ID;

export const OTHER_CLUB_REGION_ORDER = /** @type {const} */ ([
  'americas',
  'europe',
  'middle-east-asia',
  'africa',
  'oceania',
  'world',
]);

export const OTHER_CLUB_REGION_LABELS = {
  americas: 'Americas',
  europe: 'Europe',
  'middle-east-asia': 'Middle East & Asia',
  africa: 'Africa',
  oceania: 'Oceania',
  world: 'World / Other',
};

const LEGACY_OTHER_CLUB_REGION_MAP = {
  american: 'americas',
  european: 'europe',
  worldTeams: 'world',
  other: 'world',
};

const EUROPEAN_LEAGUE_COUNTRIES = new Set([
  'England',
  'Spain',
  'Germany',
  'Italy',
  'France',
  'Netherlands',
  'Portugal',
  'Belgium',
  'Scotland',
  'Wales',
  'Turkey',
  'Türkiye',
  'Greece',
  'Austria',
  'Switzerland',
  'Poland',
  'Ukraine',
  'Czechia',
  'Czech Republic',
  'Denmark',
  'Sweden',
  'Norway',
  'Serbia',
  'Croatia',
]);

const AMERICAN_LEAGUE_COUNTRIES = new Set([
  'United States',
  'USA',
  'Mexico',
  'Brazil',
  'Argentina',
  'Colombia',
  'Chile',
  'Uruguay',
  'Ecuador',
  'Paraguay',
  'Peru',
  'Venezuela',
  'Canada',
]);

function sortByIdOrder(items, order) {
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...items].sort(
    (a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999),
  );
}

/**
 * @param {import('../data/contentManifest').CONTENT_MANIFEST['leagues'][number][]} [leagues]
 */
export function buildBrowseLeagueTaxonomy(leagues = getManifestLeagues()) {
  const european = [];
  const american = [];

  for (const league of leagues) {
    if (league.id === OTHER_CLUBS_LEAGUE_ID) continue;
    if (EUROPEAN_LEAGUE_IDS.includes(league.id) || EUROPEAN_LEAGUE_COUNTRIES.has(league.country)) {
      european.push(league);
    } else if (AMERICAN_LEAGUE_IDS.includes(league.id) || AMERICAN_LEAGUE_COUNTRIES.has(league.country)) {
      american.push(league);
    }
  }

  return {
    european: sortByIdOrder(european, EUROPEAN_LEAGUE_IDS),
    american: sortByIdOrder(american, AMERICAN_LEAGUE_IDS),
  };
}

/** Live men's national sides for Browse (country squads — not clubs). */
export function getBrowseNationalTeams() {
  return [...getLiveNationalTeams()].sort((a, b) =>
    (a.displayName ?? '').localeCompare(b.displayName ?? '', undefined, { sensitivity: 'base' }),
  );
}

export function normalizeBrowseLeagueParam(value) {
  if (!value) return '';
  if (value === 'international') return OTHER_CLUBS_LEAGUE_ID;
  return value;
}

/** @param {string | null | undefined} value */
export function normalizeOtherClubRegionParam(value) {
  if (!value) return '';
  const mapped = LEGACY_OTHER_CLUB_REGION_MAP[value] ?? value;
  if (OTHER_CLUB_REGION_ORDER.includes(mapped)) return mapped;
  return '';
}
