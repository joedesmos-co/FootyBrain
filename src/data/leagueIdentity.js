/**
 * League-level identity tags for hub display (editorial, not live data).
 */

/** @type {Record<string, { identityTags: string[] }>} */
export const LEAGUE_IDENTITY_META = {
  'premier-league': {
    identityTags: ['physical', 'attacking', 'tactical', 'youth-focused'],
  },
  'la-liga': {
    identityTags: ['technical', 'tactical', 'youth-focused', 'attacking'],
  },
  bundesliga: {
    identityTags: ['attacking', 'youth-focused', 'physical', 'tactical'],
  },
  'serie-a': {
    identityTags: ['tactical', 'physical', 'technical'],
  },
  'ligue-1': {
    identityTags: ['technical', 'youth-focused', 'attacking', 'physical'],
  },
  eredivisie: {
    identityTags: ['technical', 'youth-focused', 'attacking', 'tactical'],
  },
  mls: {
    identityTags: ['physical', 'attacking', 'youth-focused'],
  },
  brasileirao: {
    identityTags: ['technical', 'attacking', 'youth-focused'],
  },
};

export function getLeagueIdentityMeta(leagueId) {
  return LEAGUE_IDENTITY_META[leagueId] ?? { identityTags: [] };
}
