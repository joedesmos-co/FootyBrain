/**
 * Quiz eligibility helpers — pure rules, no sampleData import.
 *
 * Editorial quiz-ready ≠ full ecosystem. Sessions use difficulty-weighted ecosystem pools.
 */

import { filterQuizSessionPool } from './quizEcosystem.js';
import {
  isInQuizEcosystem,
  isQuizEligiblePlayer,
} from './quizPlayerRules.js';

export {
  isInQuizEcosystem,
  isQuizEligiblePlayer,
  hasEditorialQuizClues,
  getQuizClueTier,
} from './quizPlayerRules.js';

export { filterQuizSessionPool, canAppearInQuizSession } from './quizEcosystem.js';

/**
 * Players with hand-written quiz profiles (UI counts, marketing copy).
 * @param {Array<any>} pool
 */
export function getQuizEligiblePlayers(pool) {
  if (!Array.isArray(pool)) return [];
  return pool.filter(isQuizEligiblePlayer);
}

/**
 * All in-league roster players in the quiz ecosystem (registry + future modes).
 * @param {Array<any>} pool
 */
export function getQuizEcosystemPlayers(pool) {
  if (!Array.isArray(pool)) return [];
  return pool.filter(isInQuizEcosystem);
}

/**
 * Difficulty-filtered session pool (editorial favoured on easy/medium).
 * @param {Array<any>} pool
 * @param {string} [difficulty]
 */
export function getPlayableQuizPlayers(pool, difficulty = 'medium') {
  return filterQuizSessionPool(pool, difficulty);
}
