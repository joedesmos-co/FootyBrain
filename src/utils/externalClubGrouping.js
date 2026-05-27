import { getLiveNationalTeams } from '../data/nationalTeamData';
import { AMERICAN_LEAGUE_IDS, EUROPEAN_LEAGUE_IDS } from './browseTaxonomy';
import { normalizeClubName } from './teamPageUtils';

/** @typedef {'americas' | 'europe' | 'middle-east-asia' | 'africa' | 'oceania' | 'world'} OtherClubContinentId */

export const OTHER_CLUB_CONTINENT_ORDER = /** @type {const} */ ([
  'americas',
  'europe',
  'middle-east-asia',
  'africa',
  'oceania',
  'world',
]);

export const OTHER_CLUB_CONTINENT_LABELS = {
  americas: 'Americas',
  europe: 'Europe',
  'middle-east-asia': 'Middle East & Asia',
  africa: 'Africa',
  oceania: 'Oceania',
  world: 'World / Other',
};

const MAIN_LEAGUE_IDS = new Set([...EUROPEAN_LEAGUE_IDS, ...AMERICAN_LEAGUE_IDS]);

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
  'Bolivia',
  'Guatemala',
  'El Salvador',
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
  'Luxembourg',
  'North Macedonia',
  'Montenegro',
  'Kosovo',
]);

const MIDDLE_EAST_ASIA_PLAYER_COUNTRIES = new Set([
  'Saudi Arabia',
  'Qatar',
  'United Arab Emirates',
  'UAE',
  'Iran',
  'IR Iran',
  'Iraq',
  'Jordan',
  'Japan',
  'South Korea',
  'Korea Republic',
  'China',
  "People's Republic of China",
  'Uzbekistan',
  'India',
  'Thailand',
  'Vietnam',
  'Indonesia',
  'Malaysia',
  'Singapore',
  'Oman',
  'Kuwait',
  'Bahrain',
  'Lebanon',
  'Syria',
  'Palestine',
  'Israel',
]);

const AFRICA_PLAYER_COUNTRIES = new Set([
  'Morocco',
  'Senegal',
  'Nigeria',
  'Ghana',
  'Egypt',
  'Cameroon',
  "Côte d'Ivoire",
  'Ivory Coast',
  'South Africa',
  'Tunisia',
  'Algeria',
  'DR Congo',
  'Congo DR',
  'Mali',
  'Burkina Faso',
  'Guinea',
  'Zambia',
  'Zimbabwe',
  'Angola',
  'Kenya',
  'Uganda',
  'Cape Verde',
  'Cabo Verde',
]);

const OCEANIA_PLAYER_COUNTRIES = new Set([
  'New Zealand',
  'Fiji',
  'Papua New Guinea',
  'Solomon Islands',
  'Tahiti',
]);

const AMERICAS_TEAM_HINTS = [
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
  'concacaf',
  'copa libertadores',
];

const EUROPE_TEAM_HINTS = [
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
  'feyenoord',
  'fenerbah',
  'galatasaray',
  'besiktas',
  'eredivisie',
  'groningen',
  'breda',
  'rotterdam',
];

const MIDDLE_EAST_ASIA_TEAM_HINTS = [
  'al hilal',
  'al nassr',
  'al ahli',
  'al ittihad',
  'al fateh',
  'al fayha',
  'al gharafa',
  'al sadd',
  'al duhail',
  'al ain',
  'al shorta',
  'al rayyan',
  'al wakrah',
  'al arabi',
  'al shabab',
  'al taawoun',
  'al raed',
  'al ettifaq',
  'al khaleej',
  'al wehda',
  'persepolis',
  'ulsan',
  'kawasaki',
  'kashima',
  'gamba',
  'urawa',
  'jeonbuk',
  'pohang',
  'saudi',
  'qatar',
  'uae',
  'emirates',
  'dubai',
  'riyadh',
  'jeddah',
  'doha',
  'tehran',
  'istanbul',
  'tel aviv',
  'hong kong',
];

const AFRICA_TEAM_HINTS = [
  'morocco',
  'senegal',
  'nigeria',
  'ghana',
  'egypt',
  'cameroon',
  'ivory',
  "cote d",
  'caf ',
  'kaizer',
  'orlando pirates',
  'mamelodi',
  'zamalek',
  'al ahly sc',
  'esperance',
  'wydad',
  'raja',
];

const OCEANIA_TEAM_HINTS = [
  'new zealand',
  'auckland',
  'wellington',
  'sydney fc',
  'melbourne',
  'brisbane',
  'perth glory',
  'central coast',
  'a-league',
  'a league',
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

function buildMainLeagueClubNameSet(allTeams) {
  const names = new Set();
  for (const team of allTeams) {
    if (!team?.leagueId || !MAIN_LEAGUE_IDS.has(team.leagueId)) continue;
    const key = normalizeClubName(team.name);
    if (key) names.add(key);
  }
  return names;
}

function shouldExcludeFromOtherClubs(team, mainLeagueClubNames) {
  const key = normalizeClubName(team.name);
  return key && mainLeagueClubNames.has(key);
}

function textMatchesHints(text, hints) {
  const hay = normalizeKey(text);
  if (!hay) return false;
  return hints.some((hint) => hay.includes(hint));
}

function teamHintContinent(team) {
  const country = normalizeKey(team.country);
  if (country) {
    if (textMatchesHints(country, AMERICAS_TEAM_HINTS)) return 'americas';
    if (textMatchesHints(country, EUROPE_TEAM_HINTS)) return 'europe';
    if (textMatchesHints(country, MIDDLE_EAST_ASIA_TEAM_HINTS)) return 'middle-east-asia';
    if (textMatchesHints(country, AFRICA_TEAM_HINTS)) return 'africa';
    if (textMatchesHints(country, OCEANIA_TEAM_HINTS)) return 'oceania';
  }
  const name = normalizeKey(team.name);
  if (textMatchesHints(name, AMERICAS_TEAM_HINTS)) return 'americas';
  if (textMatchesHints(name, EUROPE_TEAM_HINTS)) return 'europe';
  if (textMatchesHints(name, MIDDLE_EAST_ASIA_TEAM_HINTS)) return 'middle-east-asia';
  if (textMatchesHints(name, AFRICA_TEAM_HINTS)) return 'africa';
  if (textMatchesHints(name, OCEANIA_TEAM_HINTS)) return 'oceania';
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

function nationalityContinent(nationality) {
  if (!nationality) return null;
  if (AMERICAS_PLAYER_COUNTRIES.has(nationality)) return 'americas';
  if (EUROPE_PLAYER_COUNTRIES.has(nationality)) return 'europe';
  if (MIDDLE_EAST_ASIA_PLAYER_COUNTRIES.has(nationality)) return 'middle-east-asia';
  if (AFRICA_PLAYER_COUNTRIES.has(nationality)) return 'africa';
  if (OCEANIA_PLAYER_COUNTRIES.has(nationality)) return 'oceania';
  return null;
}

function classifyOtherClubTeam(team, players, nationalTeamNames) {
  if (isNationalTeamLikeClub(team, nationalTeamNames)) return null;

  const hint = teamHintContinent(team);
  if (hint) return hint;

  const dominantNat = dominantPlayerNationality(team.id, players);
  const fromNat = nationalityContinent(dominantNat);
  if (fromNat) return fromNat;

  return 'world';
}

/**
 * Filter and group external-league clubs for Browse “Other clubs”.
 * @param {object[]} teams — external league teams only
 * @param {object[]} [players]
 * @param {object[]} [allTeams] — full index for main-league duplicate exclusion
 * @returns {Array<{ id: OtherClubContinentId, label: string, teams: object[] }>}
 */
export function groupOtherClubTeamsForBrowse(teams, players = [], allTeams = []) {
  const nationalTeamNames = buildNationalTeamNameSet();
  const mainLeagueClubNames = buildMainLeagueClubNameSet(allTeams);
  const buckets = Object.fromEntries(
    OTHER_CLUB_CONTINENT_ORDER.map((id) => [id, []]),
  );

  for (const team of teams) {
    if (shouldExcludeFromOtherClubs(team, mainLeagueClubNames)) continue;
    const continent = classifyOtherClubTeam(team, players, nationalTeamNames);
    if (!continent) continue;
    buckets[continent].push(team);
  }

  for (const id of OTHER_CLUB_CONTINENT_ORDER) {
    buckets[id].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }),
    );
  }

  return OTHER_CLUB_CONTINENT_ORDER.map((id) => ({
    id,
    label: OTHER_CLUB_CONTINENT_LABELS[id],
    teams: buckets[id],
  })).filter((section) => section.teams.length > 0);
}
