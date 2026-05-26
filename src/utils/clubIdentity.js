/** Canonical club identity tag keys → short display labels. */
export const CLUB_IDENTITY_TAG_LABELS = {
  possession: 'Possession',
  'counter-attacking': 'Counter-attacking',
  'youth-focused': 'Youth-focused',
  'historic-giant': 'Historic giant',
  pressing: 'High press',
  'direct-play': 'Direct play',
  'set-pieces': 'Set-piece threat',
  'defensive-block': 'Defensive block',
  'high-line': 'High defensive line',
  academy: 'Academy club',
  'european-heavyweight': 'European heavyweight',
  'title-challenger': 'Title challenger',
  physical: 'Physical style',
  technical: 'Technical football',
  'fan-culture': 'Strong fan culture',
  'underdog-spirit': 'Underdog spirit',
};

export function formatClubIdentityTags(tagKeys) {
  if (!Array.isArray(tagKeys) || tagKeys.length === 0) return [];
  return tagKeys
    .map((key) => {
      const label = CLUB_IDENTITY_TAG_LABELS[key];
      return label ? { key, label } : null;
    })
    .filter(Boolean);
}

export function truncateClubText(text, maxLength = 200) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.length <= maxLength) return trimmed;
  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}
