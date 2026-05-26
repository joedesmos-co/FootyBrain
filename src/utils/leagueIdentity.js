import { getLeagueIdentityMeta } from '../data/leagueIdentity';

export const LEAGUE_IDENTITY_TAG_LABELS = {
  tactical: 'Tactical',
  physical: 'Physical',
  technical: 'Technical',
  'youth-focused': 'Youth-focused',
  attacking: 'Attacking',
};

export function formatLeagueIdentityTags(leagueId) {
  const { identityTags } = getLeagueIdentityMeta(leagueId);
  if (!Array.isArray(identityTags) || identityTags.length === 0) return [];

  return identityTags
    .map((key) => {
      const label = LEAGUE_IDENTITY_TAG_LABELS[key];
      return label ? { key, label } : null;
    })
    .filter(Boolean);
}

/** Famous club lines are stored as "Club — note". */
export function parseFamousClubLabel(entry) {
  const text = String(entry ?? '').trim();
  const dash = text.indexOf(' — ');
  if (dash > 0) return text.slice(0, dash).trim();
  const hyphen = text.indexOf(' - ');
  if (hyphen > 0) return text.slice(0, hyphen).trim();
  return text;
}

export function truncateLeagueText(text, maxLength = 180) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.length <= maxLength) return trimmed;
  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}
