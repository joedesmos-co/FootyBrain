/**
 * Shell league records for hub UI — no player/team arrays.
 * Regenerate counts via scripts/write-content-manifest.js after merge.
 */

import {
  CONTENT_MANIFEST,
  getManifestLeague,
  getManifestLeagues,
} from './contentManifest';

export const HOME_LEAGUE_HUB_IDS = ['brasileirao', 'mls', 'premier-league'];

const HUB_SUBLINES = {
  brasileirao: (league) => `${league.country} · browse all clubs`,
  mls: () => 'United States · 30 clubs',
  'premier-league': (league) => league.country,
};

/** League row shaped for LeagueBadge + hub cards. */
export function getHubLeague(leagueId) {
  const league = getManifestLeague(leagueId);
  if (!league) return null;
  const sublineFn = HUB_SUBLINES[leagueId];
  return {
    id: league.id,
    name: league.name,
    country: league.country,
    logoUrl: null,
    badgeTheme: league.badgeTheme,
    hubSubline: sublineFn ? sublineFn(league) : league.country,
    teamCount: league.teamCount,
    playerCount: league.playerCount,
  };
}

export function getHubLeagues(ids = HOME_LEAGUE_HUB_IDS) {
  return ids.map((id) => getHubLeague(id)).filter(Boolean);
}

export { CONTENT_MANIFEST, getManifestLeague, getManifestLeagues };
