/**
 * Curated global giants — premium editorial overlays and layout tier.
 * Unioned with algorithmic top-tier clubs in `topTierPages.js`.
 */
export const PREMIUM_EDITORIAL_CLUB_IDS = [
  'arsenal',
  'liverpool',
  'chelsea',
  'manchester-united',
  'manchester-city',
  'tottenham',
  'real-madrid',
  'barcelona',
  'atletico-madrid',
  'bayern-munich',
  'borussia-dortmund',
  'ac-milan',
  'inter-milan',
  'juventus',
  'napoli',
  'paris-saint-germain',
  'ajax',
];

export const PREMIUM_EDITORIAL_CLUB_ID_SET = new Set(PREMIUM_EDITORIAL_CLUB_IDS);

export function isPremiumEditorialClub(teamOrId) {
  const id = typeof teamOrId === 'string' ? teamOrId : teamOrId?.id;
  return id ? PREMIUM_EDITORIAL_CLUB_ID_SET.has(id) : false;
}
