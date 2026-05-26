/**
 * Quiz eligibility rules are pure.
 *
 * Do not import the full `sampleData.js` player registry here — quiz/daily should be able
 * to run on the slim quiz registry without pulling the full monolith.
 */

import { isQuizEligiblePlayer } from './quizPlayerRules.js';

export { isQuizEligiblePlayer } from './quizPlayerRules.js';

/**
 * @param {Array<any>} pool
 */
export function getQuizEligiblePlayers(pool) {
  if (!Array.isArray(pool)) return [];
  return pool.filter(isQuizEligiblePlayer);
}
