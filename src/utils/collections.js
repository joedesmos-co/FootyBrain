import { getNationalTeamById } from '../data/nationalTeamData';
import { buildCollectionQuizHref, isWorldCupQuizCollection } from './worldCupQuizPools';
import {
  getLeagueById,
  getPlayerById,
  getTeamById,
  getLeagueName,
  getTeamName,
} from '../data/sampleData';

export function resolveCollectionItem(item) {
  if (!item?.type || !item?.id) return null;
  if (item.type === 'player') {
    const player = getPlayerById(item.id);
    return player ? { type: 'player', entity: player, note: item.note } : null;
  }
  if (item.type === 'team') {
    const team = getTeamById(item.id);
    return team ? { type: 'team', entity: team, note: item.note } : null;
  }
  if (item.type === 'league') {
    const league = getLeagueById(item.id);
    return league ? { type: 'league', entity: league, note: item.note } : null;
  }
  if (item.type === 'national-team') {
    const nationalTeam = getNationalTeamById(item.id);
    if (!nationalTeam) return null;
    return {
      type: 'national-team',
      entity: { ...nationalTeam, name: nationalTeam.displayName },
      note: item.note,
    };
  }
  return null;
}

export function resolveCollectionItems(items) {
  return items
    .map((item, index) => {
      const resolved = resolveCollectionItem(item);
      return resolved ? { ...resolved, index, raw: item } : null;
    })
    .filter(Boolean);
}

/**
 * @param {import('../data/collectionsData').collections[number]['quizLaunch']} quizLaunch
 * @param {import('../data/collectionsData').collections[number] | { worldCupPrep?: boolean }} [collectionOrOptions]
 */
export function getCollectionQuizHref(quizLaunch, collectionOrOptions) {
  const worldCupPrep =
    collectionOrOptions && 'tags' in collectionOrOptions
      ? isWorldCupQuizCollection(collectionOrOptions)
      : Boolean(collectionOrOptions?.worldCupPrep);
  return buildCollectionQuizHref(quizLaunch, { worldCupPrep });
}

export function getEntityProfilePath(type, id) {
  if (type === 'player') return `/player/${id}`;
  if (type === 'team') return `/team/${id}`;
  if (type === 'league') return `/league/${id}`;
  if (type === 'national-team') return `/national-team/${id}`;
  return '/browse';
}

export function getEntityLabel(resolved) {
  const { type, entity } = resolved;
  if (type === 'player') {
    return `${entity.name} · ${entity.position} · ${getTeamName(entity.teamId)}`;
  }
  if (type === 'team') {
    return `${entity.name} · ${getLeagueName(entity.leagueId)}`;
  }
  if (type === 'league') {
    return `${entity.name} · ${entity.country}`;
  }
  if (type === 'national-team') {
    return `${entity.displayName ?? entity.name} · ${entity.confederation ?? 'National team'}`;
  }
  return '';
}
