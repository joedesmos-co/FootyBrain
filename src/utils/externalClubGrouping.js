import { getLiveNationalTeams } from '../data/nationalTeamData';

/** @typedef {'american' | 'european' | 'worldTeams' | 'other'} ExternalClubGroupId */

export const EXTERNAL_CLUB_GROUP_ORDER = /** @type {const} */ ([
  'american',
  'european',
  'worldTeams',
  'other',
]);

export const EXTERNAL_CLUB_GROUP_LABELS = {
  american: 'American clubs',
  european: 'European clubs',
  worldTeams: 'World teams',
  other: 'Other international clubs',
};

const AMERICAS_PLAYER_COUNTRIES = new Set([
  'United States',
  'USA',
  'Mexico',
  'Canada',
  'Brazil',
  'Argentina',
  'Colombia',
  'Chile',
  'Uruguay',
  'Ecuador',
  'Paraguay',
  'Peru',
  'Venezuela',
  'Panama',
  'Curaçao',
  'Curacao',
  'Haiti',
  'Costa Rica',
  'Honduras',
  'Jamaica',
  'Trinidad and Tobago',
]);

const EUROPE_PLAYER_COUNTRIES = new Set([
  'England',
  'France',
  'Germany',
  'Spain',
  'Italy',
  'Portugal',
  'Netherlands',
  'Belgium',
  'Croatia',
  'Switzerland',
  'Austria',
  'Poland',
  'Serbia',
  'Wales',
  'Scotland',
  'Norway',
  'Sweden',
  'Denmark',
  'Greece',
  'Ukraine',
  'Turkey',
  'Türkiye',
  'Czechia',
  'Czech Republic',
  'Republic of Ireland',
  'Ireland',
  'Romania',
  'Hungary',
  'Slovakia',
  'Slovenia',
  'Finland',
  'Iceland',
  'Albania',
  'Bosnia and Herzegovina',
  'Bosnia-Herzegovina',
  'Georgia',
  'Armenia',
  'Cyprus',
]);

const AMERICAS_TEAM_COUNTRY_HINTS = [
  'united states',
  'usa',
  'u.s.',
  'mexico',
  'canada',
  'brazil',
  'argentina',
  'colombia',
  'chile',
  'uruguay',
  'ecuador',
  'paraguay',
  'peru',
  'venezuela',
  'panama',
  'curaçao',
  'curacao',
  'haiti',
  'costa rica',
  'honduras',
  'jamaica',
  'mls',
  'mls ',
  ' mls',
  'liga mx',
  'concacaf',
];

const EUROPE_TEAM_COUNTRY_HINTS = [
  'england',
  'france',
  'germany',
  'spain',
  'italy',
  'portugal',
  'netherlands',
  'belgium',
  'scotland',
  'wales',
  'ireland',
  'turkey',
  'türkiye',
  'greece',
  'poland',
  'serbia',
  'croatia',
  'switzerland',
  'austria',
  'norway',
  'sweden',
  'denmark',
  'ukraine',
  'romania',
  'hungary',
  'czech',
  'slovak',
  'sloven',
  'finland',
  'iceland',
  'cyprus',
  'larnaca',
  'anderlecht',
  'benfica',
  'porto',
  'ajax',
  'psv',
  'fenerbah',
  'galatasaray',
  'besiktas',
];

function normalizeKey(value) {
  return (value ?? '').trim().toLowerCase();
}

function buildNationalTeamNameSet() {
  return new Set(getLiveNationalTeams().map((team) => normalizeKey(team.displayName)));
}

function isNationalTeamLikeClub(team, nationalTeamNames) {
  const name = normalizeKey(team.name);
  if (!name) return false;
  return nationalTeamNames.has(name);
}

function teamCountryHintBucket(team) {
  const country = normalizeKey(team.country);
  if (country) {
    if (AMERICAS_TEAM_COUNTRY_HINTS.some((hint) => country.includes(hint))) return 'american';
    if (EUROPE_TEAM_COUNTRY_HINTS.some((hint) => country.includes(hint))) return 'european';
  }

  const name = normalizeKey(team.name);
  if (AMERICAS_TEAM_COUNTRY_HINTS.some((hint) => name.includes(hint))) return 'american';
  if (EUROPE_TEAM_COUNTRY_HINTS.some((hint) => name.includes(hint))) return 'european';
  return null;
}

function dominantPlayerNationality(teamId, players) {
  const counts = new Map();
  for (const player of players) {
    if (player.teamId !== teamId) continue;
    const nat = player.nationality?.trim();
    if (!nat) continue;
    counts.set(nat, (counts.get(nat) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function nationalityBucket(nationality) {
  if (!nationality) return null;
  if (AMERICAS_PLAYER_COUNTRIES.has(nationality)) return 'american';
  if (EUROPE_PLAYER_COUNTRIES.has(nationality)) return 'european';
  return 'other';
}

function classifyExternalClubTeam(team, players, nationalTeamNames) {
  if (isNationalTeamLikeClub(team, nationalTeamNames)) {
    return 'worldTeams';
  }

  const hintBucket = teamCountryHintBucket(team);
  if (hintBucket) return hintBucket;

  const dominantNat = dominantPlayerNationality(team.id, players);
  const playerBucket = nationalityBucket(dominantNat);
  if (playerBucket === 'american' || playerBucket === 'european') return playerBucket;
  if (dominantNat) return 'other';
  return 'other';
}

/**
 * Best-effort sections for International clubs (external league) browse UI.
 * @param {object[]} teams
 * @param {object[]} [players]
 * @returns {Array<{ id: ExternalClubGroupId, label: string, teams: object[] }>}
 */
export function groupExternalClubTeams(teams, players = []) {
  const nationalTeamNames = buildNationalTeamNameSet();
  const buckets = {
    american: [],
    european: [],
    worldTeams: [],
    other: [],
  };

  for (const team of teams) {
    const bucket = classifyExternalClubTeam(team, players, nationalTeamNames);
    buckets[bucket].push(team);
  }

  for (const id of EXTERNAL_CLUB_GROUP_ORDER) {
    buckets[id].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }));
  }

  return EXTERNAL_CLUB_GROUP_ORDER.map((id) => ({
    id,
    label: EXTERNAL_CLUB_GROUP_LABELS[id],
    teams: buckets[id],
  })).filter((section) => section.teams.length > 0);
}
