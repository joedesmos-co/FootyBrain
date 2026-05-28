/**
 * Final relevance ranking for player search — composes match score with importance and context.
 */

import { isQuizEligiblePlayer } from './quizPlayerRules.js';
import { normalizeForSearch } from './textSearch.js';

/**
 * @param {object} player
 */
export function getRecognizabilityBoost(player) {
  const importance = Number(player?.importanceScore) || 0;
  let boost = Math.min(22, Math.floor(importance / 4));
  if (isQuizEligiblePlayer(player)) boost += 4;
  if (player?.hasEditorialClues || player?.quizClueTier === 'editorial') boost += 2;
  return boost;
}

/**
 * @param {number} matchScore
 * @param {object} player
 * @param {{ intent?: object, clubNameNorm?: string, leagueNameNorm?: string, normalizedQuery?: string }} [ctx]
 */
export function rankPlayerSearchResult(matchScore, player, ctx = {}) {
  if (matchScore <= 0) return 0;

  let total = matchScore + getRecognizabilityBoost(player);

  const q = ctx.normalizedQuery ?? '';
  const name = normalizeForSearch(player?.name);
  if (q && name === q) total += 12;
  else if (q && name.startsWith(q)) total += 6;

  const intent = ctx.intent;
  if (intent?.kind === 'club' && intent.teamId && player?.teamId === intent.teamId) {
    total += 14;
  }
  if (intent?.kind === 'country' && intent.nationalTeamId) {
    total += 8;
  }

  if (q.length >= 3 && ctx.clubNameNorm && ctx.clubNameNorm.includes(q)) {
    total += 10;
  }
  if (q.length >= 4 && ctx.leagueNameNorm && ctx.leagueNameNorm.includes(q)) {
    total += 6;
  }

  return total;
}

/**
 * @param {{ player: object, score: number }[]} scored
 */
export function sortPlayerSearchResults(scored) {
  return [...scored].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ib = (Number(b.player?.importanceScore) || 0) - (Number(a.player?.importanceScore) || 0);
    if (ib !== 0) return ib;
    return String(a.player?.name ?? '').localeCompare(String(b.player?.name ?? ''));
  });
}
