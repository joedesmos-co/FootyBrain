/**
 * Top 100 learner-priority pages (50 players · 25 clubs · 8 leagues · 17 national teams).
 * IDs derived once from the dataset — used for premium layout and copy only.
 */

import { players, teams, leagues } from '../data/sampleData.js';
import { PREMIUM_EDITORIAL_CLUB_IDS } from '../data/premiumClubIds.js';
import liveNt from '../data/nationalTeamLive.json' with { type: 'json' };
import { isMajorClub } from './entityDepthAudit.js';

export const TOP_TIER_COUNTS = {
  players: 50,
  clubs: 25,
  leagues: 8,
  national: 17,
};

function rosterImportanceSum(teamId) {
  return players
    .filter((p) => p.teamId === teamId)
    .reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
}

const TOP_PLAYER_IDS = new Set(
  [...players]
    .sort((a, b) => (Number(b.importanceScore) || 0) - (Number(a.importanceScore) || 0))
    .slice(0, TOP_TIER_COUNTS.players)
    .map((p) => p.id),
);

const TOP_CLUB_IDS = new Set([
  ...teams
    .filter(isMajorClub)
    .map((team) => ({
      id: team.id,
      sum: rosterImportanceSum(team.id),
    }))
    .sort((a, b) => b.sum - a.sum)
    .slice(0, TOP_TIER_COUNTS.clubs)
    .map((t) => t.id),
  ...PREMIUM_EDITORIAL_CLUB_IDS,
]);

const TOP_LEAGUE_IDS = new Set(
  leagues
    .filter((l) => l?.id && l.id !== 'external')
    .map((league) => league.id),
);

const membershipsPerTeam = liveNt.meta?.membershipsPerTeam ?? {};

const TOP_NATIONAL_IDS = new Set(
  (liveNt.nationalTeams ?? [])
    .map((nt) => ({
      id: nt.id,
      linked: membershipsPerTeam[nt.id] ?? 0,
    }))
    .sort((a, b) => b.linked - a.linked)
    .slice(0, TOP_TIER_COUNTS.national)
    .map((n) => n.id),
);

export function isTopTierPlayer(playerOrId) {
  const id = typeof playerOrId === 'string' ? playerOrId : playerOrId?.id;
  return id ? TOP_PLAYER_IDS.has(id) : false;
}

export function isTopTierClub(teamOrId) {
  const id = typeof teamOrId === 'string' ? teamOrId : teamOrId?.id;
  return id ? TOP_CLUB_IDS.has(id) : false;
}

export function isTopTierLeague(leagueOrId) {
  const id = typeof leagueOrId === 'string' ? leagueOrId : leagueOrId?.id;
  return id ? TOP_LEAGUE_IDS.has(id) : false;
}

export function isTopTierNationalTeam(nationalTeamOrId) {
  const id = typeof nationalTeamOrId === 'string' ? nationalTeamOrId : nationalTeamOrId?.id;
  return id ? TOP_NATIONAL_IDS.has(id) : false;
}
