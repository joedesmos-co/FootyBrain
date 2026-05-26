import { getNationalTeamById } from '../data/nationalTeamData';
import {
  getLeagueById,
  getLeagueName,
  getPlayerById,
  getTeamById,
  getTeamName,
} from '../data/sampleData';
import { getRecentViews } from './recentlyViewed';

/**
 * @param {{ type: string, id: string, viewedAt: number }} entry
 */
export function resolveRecentView(entry) {
  if (!entry?.type || !entry?.id) return null;

  if (entry.type === 'player') {
    const player = getPlayerById(entry.id);
    if (!player) return null;
    return {
      ...entry,
      name: player.name,
      subtitle: `${player.position} · ${getTeamName(player.teamId)}`,
      path: `/player/${player.id}`,
    };
  }

  if (entry.type === 'team') {
    const team = getTeamById(entry.id);
    if (!team) return null;
    return {
      ...entry,
      name: team.name,
      subtitle: getLeagueName(team.leagueId),
      path: `/team/${entry.id}`,
    };
  }

  if (entry.type === 'league') {
    const league = getLeagueById(entry.id);
    if (!league) return null;
    return {
      ...entry,
      name: league.name,
      subtitle: league.country,
      path: `/league/${entry.id}`,
    };
  }

  if (entry.type === 'national-team') {
    const nationalTeam = getNationalTeamById(entry.id);
    if (!nationalTeam) return null;
    return {
      ...entry,
      name: nationalTeam.displayName,
      subtitle: nationalTeam.confederation ?? 'National team',
      path: `/national-team/${entry.id}`,
    };
  }

  return null;
}

export function getResolvedRecentViews() {
  return getRecentViews()
    .map((entry) => resolveRecentView(entry))
    .filter(Boolean);
}
