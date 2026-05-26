/**
 * Quiz and daily pools use editorial-quality players only.
 * Generated squad rows stay browseable/searchable but out of quiz until reviewed.
 *
 * Indexes are built lazily on first quiz/daily access — not at module import.
 */

import { players } from '../data/sampleData.js';
import { isQuizEligiblePlayer } from './quizPlayerRules.js';

export { isQuizEligiblePlayer } from './quizPlayerRules.js';

let quizEligibleCache = null;
const quizEligibleByTeamId = new Map();
const quizEligibleByLeagueId = new Map();

function ensureQuizIndexes() {
  if (quizEligibleCache) return;

  quizEligibleCache = players.filter(isQuizEligiblePlayer);

  for (const player of quizEligibleCache) {
    if (!quizEligibleByTeamId.has(player.teamId)) {
      quizEligibleByTeamId.set(player.teamId, []);
    }
    quizEligibleByTeamId.get(player.teamId).push(player);

    if (!quizEligibleByLeagueId.has(player.leagueId)) {
      quizEligibleByLeagueId.set(player.leagueId, []);
    }
    quizEligibleByLeagueId.get(player.leagueId).push(player);
  }
}

/** Full registry quiz pool (lazy-built). */
export function getQuizEligibleRegistry() {
  ensureQuizIndexes();
  return quizEligibleCache;
}

export function getQuizEligiblePlayersForTeam(teamId) {
  ensureQuizIndexes();
  return quizEligibleByTeamId.get(teamId) ?? [];
}

export function getQuizEligiblePlayersForLeague(leagueId) {
  ensureQuizIndexes();
  return quizEligibleByLeagueId.get(leagueId) ?? [];
}

/**
 * @param {typeof players} [pool] — pass a filtered roster; defaults to full cached quiz pool.
 */
export function getQuizEligiblePlayers(pool = players) {
  if (pool === players) return getQuizEligibleRegistry();
  return pool.filter(isQuizEligiblePlayer);
}
