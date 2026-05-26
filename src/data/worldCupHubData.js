/**
 * Lightweight World Cup 2026 hub copy and featured IDs (prep only — no fixtures/scores).
 */

import { getCollectionById } from './collectionsData';
import {
  countLinkedPlayers,
  getLiveNationalTeams,
  getNationalTeamQuizReadyCount,
} from './nationalTeamData';
import { getPlayerById } from './sampleData';
import { getWorldCup2026GroupsSummary } from './worldCup2026Prep';
import { isQuizEligiblePlayer } from '../utils/quizPlayerRules';
import { getViableWorldCupCountryQuizPoolMetas } from '../utils/worldCupQuizPools';

export const WORLD_CUP_HUB_META = {
  editionYear: 2026,
  hosts: ['United States', 'Mexico', 'Canada'],
  eyebrow: 'Men’s football · World Cup learning',
  title: 'World Cup 2026',
  lede:
    'Featured nations, group draw prep, tournament legends, quiz-ready squads, collections, and country learning paths — all from the FootyBrain player database.',
  prepNote:
    'Prep hub only: study names, nations, and quizzes. No fixtures, brackets, live scores, or external tournament APIs.',
  formatNote: '48-team edition · co-hosted across North America',
};

/** Live nations highlighted on the hub (order = editorial priority). */
export const FEATURED_NATIONAL_TEAM_IDS = [
  'argentina',
  'brazil',
  'france',
  'england',
  'germany',
  'netherlands',
  'spain',
  'united-states',
  'mexico',
];

const TOP_PLAYERS_COLLECTION_ID = 'world-cup-stars';
const LEGENDS_COLLECTION_ID = 'world-cup-legends';
const TOURNAMENT_STARS_COLLECTION_ID = 'tournament-stars';

export function getFeaturedNationalTeams() {
  const byId = new Map(getLiveNationalTeams().map((t) => [t.id, t]));
  return FEATURED_NATIONAL_TEAM_IDS.map((id) => byId.get(id)).filter(Boolean);
}

/**
 * @param {string} collectionId
 * @returns {{ collection: import('./collectionsData').collections[number] | null, players: Array<{ player: object, note?: string }> }}
 */
export function getCollectionSpotlightPlayers(collectionId, limit = 6) {
  const collection = getCollectionById(collectionId);
  if (!collection) return { collection: null, players: [] };

  const players = collection.items
    .filter((item) => item.type === 'player')
    .slice(0, limit)
    .map((item) => {
      const player = getPlayerById(item.id);
      if (!player) return null;
      return { player, note: item.note };
    })
    .filter(Boolean);

  return { collection, players };
}

export function getWorldCupTopPlayers() {
  return getCollectionSpotlightPlayers(TOP_PLAYERS_COLLECTION_ID, 8);
}

export function getTournamentLegendsSpotlight() {
  return getCollectionSpotlightPlayers(LEGENDS_COLLECTION_ID, 6);
}

export function getTournamentStarsSpotlight() {
  return getCollectionSpotlightPlayers(TOURNAMENT_STARS_COLLECTION_ID, 6);
}

/** Quiz-viable live nations ranked by quiz-ready pool size. */
export function getTopQuizNations(limit = 10) {
  return getViableWorldCupCountryQuizPoolMetas()
    .sort((a, b) => b.quizReadyCount - a.quizReadyCount)
    .slice(0, limit);
}

export function getWorldCupHubStats() {
  const featured = getFeaturedNationalTeams();
  const linked = featured.reduce((sum, t) => sum + countLinkedPlayers(t.id), 0);
  const quizReady = featured.reduce((sum, t) => sum + getNationalTeamQuizReadyCount(t.id), 0);
  const { players } = getWorldCupTopPlayers();
  const topQuizReady = players.filter(({ player }) => isQuizEligiblePlayer(player)).length;
  const draw = getWorldCup2026GroupsSummary();
  const quizViableCount = getViableWorldCupCountryQuizPoolMetas().length;

  return {
    nationCount: featured.length,
    linkedPlayers: linked,
    quizReadyMemberships: quizReady,
    topPlayerCount: players.length,
    topQuizReady,
    quizViableCount,
    ...draw,
  };
}
