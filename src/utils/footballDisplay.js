/**
 * Consistent football-learning labels: positions, nationalities, subtle accents.
 * Display-only — does not mutate sample data.
 */

/** ISO 3166-1 alpha-2 → flag emoji (men’s football nations in dataset). */
const COUNTRY_FLAG = {
  Argentina: 'AR',
  Brazil: 'BR',
  England: 'GB',
  France: 'FR',
  Germany: 'DE',
  Spain: 'ES',
  Italy: 'IT',
  Portugal: 'PT',
  Netherlands: 'NL',
  Belgium: 'BE',
  Croatia: 'HR',
  Uruguay: 'UY',
  Colombia: 'CO',
  Mexico: 'MX',
  'United States': 'US',
  USA: 'US',
  Japan: 'JP',
  'South Korea': 'KR',
  Norway: 'NO',
  Sweden: 'SE',
  Denmark: 'DK',
  Switzerland: 'CH',
  Austria: 'AT',
  Poland: 'PL',
  Serbia: 'RS',
  Wales: 'GB',
  Scotland: 'GB',
  Ireland: 'IE',
  'Republic of Ireland': 'IE',
  Canada: 'CA',
  Morocco: 'MA',
  Senegal: 'SN',
  Nigeria: 'NG',
  Ghana: 'GH',
  Egypt: 'EG',
  Australia: 'AU',
  Ecuador: 'EC',
  Chile: 'CL',
  Paraguay: 'PY',
  Peru: 'PE',
  Venezuela: 'VE',
  Turkey: 'TR',
  Türkiye: 'TR',
  Greece: 'GR',
  Ukraine: 'UA',
  Russia: 'RU',
  Cameroon: 'CM',
  "Côte d'Ivoire": 'CI',
  'Ivory Coast': 'CI',
  'South Africa': 'ZA',
  Panama: 'PA',
  Iraq: 'IQ',
  Jordan: 'JO',
  Uzbekistan: 'UZ',
  'New Zealand': 'NZ',
  'Cape Verde': 'CV',
  'Cabo Verde': 'CV',
  Curaçao: 'CW',
  Curacao: 'CW',
  Qatar: 'QA',
  'Saudi Arabia': 'SA',
  Iran: 'IR',
  'IR Iran': 'IR',
  Tunisia: 'TN',
  Algeria: 'DZ',
  'Czechia': 'CZ',
  'Czech Republic': 'CZ',
  'Bosnia and Herzegovina': 'BA',
  'Bosnia-Herzegovina': 'BA',
  Haiti: 'HT',
  'DR Congo': 'CD',
  'Congo DR': 'CD',
};

/** League id for TM external club stubs (national-pool imports). */
export const EXTERNAL_LEAGUE_ID = 'external';

/** Consumer-facing label — sample data may still say "External clubs". */
export const EXTERNAL_LEAGUE_DISPLAY_NAME = 'International club stubs';

export function isExternalLeagueId(leagueId) {
  return leagueId === EXTERNAL_LEAGUE_ID;
}

/**
 * @param {{ id?: string, name?: string } | string} leagueOrId
 */
export function getLeagueDisplayName(leagueOrId) {
  if (!leagueOrId) return '—';
  if (typeof leagueOrId === 'string') {
    return leagueOrId === EXTERNAL_LEAGUE_ID ? EXTERNAL_LEAGUE_DISPLAY_NAME : leagueOrId;
  }
  if (leagueOrId.id === EXTERNAL_LEAGUE_ID) return EXTERNAL_LEAGUE_DISPLAY_NAME;
  return leagueOrId.name ?? '—';
}

/**
 * @param {{ leagueId?: string, dataStatus?: string } | null | undefined} team
 */
export function isExternalClubStubTeam(team) {
  if (!team) return false;
  return team.leagueId === EXTERNAL_LEAGUE_ID || team.dataStatus === 'external-stub';
}

/** Stable league accent colours (database chips, hub cards). */
export const LEAGUE_DISPLAY_ACCENTS = {
  'premier-league': { from: '#22c55e', to: '#052e16', accent: '#86efac' },
  'la-liga': { from: '#f97316', to: '#7f1d1d', accent: '#fdba74' },
  bundesliga: { from: '#ef4444', to: '#1f2937', accent: '#fca5a5' },
  'serie-a': { from: '#38bdf8', to: '#1e3a8a', accent: '#7dd3fc' },
  'ligue-1': { from: '#6366f1', to: '#1e1b4b', accent: '#a5b4fc' },
  eredivisie: { from: '#f59e0b', to: '#78350f', accent: '#fcd34d' },
  mls: { from: '#dc2626', to: '#1e3a8a', accent: '#93c5fd' },
  brasileirao: { from: '#eab308', to: '#14532d', accent: '#fef08a' },
};

const POSITION_LINE_RE =
  /^(Goalkeeper|Defender|Midfield|Attack)\s*-\s*(.+)$/i;

const POSITION_SHORT = {
  'central midfield': 'Central midfielder',
  'defensive midfield': 'Defensive midfielder',
  'attacking midfield': 'Attacking midfielder',
  'right midfield': 'Right midfielder',
  'left midfield': 'Left midfielder',
  'right winger': 'Right winger',
  'left winger': 'Left winger',
  'centre-forward': 'Centre-forward',
  'center-forward': 'Centre-forward',
  'centre-back': 'Centre-back',
  'center-back': 'Centre-back',
  'left-back': 'Left-back',
  'right-back': 'Right-back',
  'second striker': 'Second striker',
};

function regionFlag(iso) {
  if (!iso || iso.length !== 2) return '';
  const upper = iso.toUpperCase();
  return String.fromCodePoint(
    ...[...upper].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65),
  );
}

/**
 * @param {string} [countryOrNationality]
 * @returns {string} flag emoji or empty
 */
export function getCountryFlag(countryOrNationality) {
  const label = String(countryOrNationality ?? '').trim();
  if (!label) return '';
  const iso = COUNTRY_FLAG[label];
  return iso ? regionFlag(iso) : '';
}

/**
 * @param {string} [countryOrNationality]
 */
export function formatCountryLabel(countryOrNationality) {
  const label = String(countryOrNationality ?? '').trim();
  if (!label) return '—';
  const flag = getCountryFlag(label);
  return flag ? `${flag} ${label}` : label;
}

/**
 * Normalise Transfermarkt-style lines to short learning labels.
 * @param {string} [position]
 */
export function formatPosition(position) {
  const raw = String(position ?? '').trim();
  if (!raw) return '—';

  const lineMatch = raw.match(POSITION_LINE_RE);
  if (lineMatch) {
    const role = lineMatch[2].trim().toLowerCase();
    if (POSITION_SHORT[role]) return POSITION_SHORT[role];
    return role
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  if (/^goalkeeper$/i.test(raw)) return 'Goalkeeper';
  if (/^striker$/i.test(raw)) return 'Striker';

  return raw
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {{ badgeTheme?: { from: string, to: string, accent: string } }} entity
 */
export function getFootballAccentStyle(entity) {
  const theme = entity?.badgeTheme;
  if (!theme?.from) return undefined;
  return {
    '--football-accent-from': theme.from,
    '--football-accent-to': theme.to,
    '--football-accent': theme.accent ?? theme.from,
  };
}

/**
 * @param {string} leagueId
 */
export function getLeagueAccentStyle(leagueId) {
  const theme = LEAGUE_DISPLAY_ACCENTS[leagueId];
  if (!theme) return undefined;
  return {
    '--football-accent-from': theme.from,
    '--football-accent-to': theme.to,
    '--football-accent': theme.accent,
  };
}

/**
 * @param {object} player
 */
export function formatPlayerNationality(player) {
  return formatCountryLabel(player?.nationality || player?.nationalTeam);
}

/**
 * @param {object} player
 */
export function formatPlayerNationalTeam(player) {
  return formatCountryLabel(player?.nationalTeam || player?.nationality);
}
