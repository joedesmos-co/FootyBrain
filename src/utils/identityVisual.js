import { formatPosition, getCountryFlag, LEAGUE_DISPLAY_ACCENTS } from './footballDisplay';

const CLUB_STOP_WORDS = new Set([
  'fc',
  'cf',
  'sc',
  'ac',
  'afc',
  'city',
  'united',
  'the',
  'de',
  'real',
  'club',
  'atletico',
  'atlético',
  'sporting',
  'athletic',
]);

/** Best-effort club palette when badgeTheme is missing. */
const CLUB_NAME_THEMES = [
  { pattern: /arsenal/i, theme: { from: '#c41e3a', to: '#4a0000', accent: '#fbbf24' } },
  { pattern: /barcelona|barça/i, theme: { from: '#004d98', to: '#1e1b4b', accent: '#a50044' } },
  { pattern: /real madrid/i, theme: { from: '#f8fafc', to: '#94a3b8', accent: '#fbbf24' } },
  { pattern: /manchester city/i, theme: { from: '#38bdf8', to: '#1e3a8a', accent: '#f8fafc' } },
  { pattern: /manchester united|man utd/i, theme: { from: '#dc2626', to: '#450a0a', accent: '#f8fafc' } },
  { pattern: /liverpool/i, theme: { from: '#dc2626', to: '#450a0a', accent: '#f8fafc' } },
  { pattern: /chelsea/i, theme: { from: '#1d4ed8', to: '#0f172a', accent: '#f8fafc' } },
  { pattern: /tottenham|spurs/i, theme: { from: '#f8fafc', to: '#1e293b', accent: '#0ea5e9' } },
  { pattern: /bayern/i, theme: { from: '#dc2626', to: '#450a0a', accent: '#f8fafc' } },
  { pattern: /dortmund|bvb/i, theme: { from: '#facc15', to: '#713f12', accent: '#0f172a' } },
  { pattern: /juventus|juve/i, theme: { from: '#f8fafc', to: '#0f172a', accent: '#f8fafc' } },
  { pattern: /inter milan|inter\b/i, theme: { from: '#0f172a', to: '#1e3a8a', accent: '#38bdf8' } },
  { pattern: /ac milan|milan\b/i, theme: { from: '#dc2626', to: '#450a0a', accent: '#f8fafc' } },
  { pattern: /psg|paris saint/i, theme: { from: '#1e3a8a', to: '#0f172a', accent: '#dc2626' } },
];

const DEFAULT_CLUB_THEME = {
  from: '#0f9f6e',
  to: '#14532d',
  accent: '#d1fae5',
};

export function getPlayerInitials(name) {
  return String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Short club code for generated badges (e.g. Arsenal → ARS).
 * @param {string} name
 * @param {number} [maxLen]
 */
export function getClubShortCode(name, maxLen = 3) {
  const raw = String(name ?? '').trim();
  if (!raw) return '—';

  const words = raw
    .replace(/\s+fc$/i, '')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const significant = words.filter((word) => !CLUB_STOP_WORDS.has(word.toLowerCase()));
  const pool = significant.length > 0 ? significant : words;

  if (pool.length >= 2) {
    return pool
      .slice(0, maxLen)
      .map((word) => word.replace(/[^a-zA-Z]/g, '')[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, maxLen);
  }

  const letters = pool[0].replace(/[^a-zA-Z]/g, '');
  return letters.slice(0, maxLen).toUpperCase() || '—';
}

/**
 * @param {{ badgeTheme?: object, leagueId?: string, name?: string } | null | undefined} team
 */
export function resolveClubIdentityTheme(team) {
  if (team?.badgeTheme?.from) {
    return {
      from: team.badgeTheme.from,
      to: team.badgeTheme.to ?? team.badgeTheme.from,
      accent: team.badgeTheme.accent ?? team.badgeTheme.from,
    };
  }

  const name = String(team?.name ?? '');
  for (const entry of CLUB_NAME_THEMES) {
    if (entry.pattern.test(name)) return entry.theme;
  }

  const leagueTheme = team?.leagueId ? LEAGUE_DISPLAY_ACCENTS[team.leagueId] : null;
  if (leagueTheme) {
    return {
      from: leagueTheme.from,
      to: leagueTheme.to,
      accent: leagueTheme.accent,
    };
  }

  return DEFAULT_CLUB_THEME;
}

export function getClubIdentityStyle(team) {
  const theme = resolveClubIdentityTheme(team);
  return {
    '--badge-from': theme.from,
    '--badge-to': theme.to,
    '--badge-accent': theme.accent,
    '--visual-from': theme.from,
    '--visual-to': theme.to,
    '--visual-accent': theme.accent,
  };
}

/**
 * @param {object | null | undefined} player
 * @param {object | null | undefined} [team]
 */
export function resolvePlayerAvatarTheme(player, team) {
  const club = resolveClubIdentityTheme(team);
  const nationality = player?.nationality || player?.nationalTeam || team?.country;
  return {
    from: club.from,
    to: club.to,
    accent: club.accent,
    flag: getCountryFlag(nationality),
  };
}

export function getPlayerAvatarStyle(player, team) {
  const theme = resolvePlayerAvatarTheme(player, team);
  return {
    '--visual-from': theme.from,
    '--visual-to': theme.to,
    '--visual-accent': theme.accent,
    '--avatar-ring': theme.accent,
  };
}

/** Compact position label for avatar badges. */
export function getPositionBadgeLabel(position) {
  const label = formatPosition(position);
  if (!label || label === '—') return '';
  const lower = label.toLowerCase();
  if (lower.includes('goal')) return 'GK';
  if (lower.includes('centre-back') || lower.includes('center-back')) return 'CB';
  if (lower.includes('left-back')) return 'LB';
  if (lower.includes('right-back')) return 'RB';
  if (lower.includes('defensive mid')) return 'DM';
  if (lower.includes('attacking mid')) return 'AM';
  if (lower.includes('central mid')) return 'CM';
  if (lower.includes('winger') || lower.includes('wing')) return 'WG';
  if (lower.includes('forward') || lower.includes('striker')) return 'ST';
  return label
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}
