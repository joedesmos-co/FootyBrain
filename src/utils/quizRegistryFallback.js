/**
 * Build quiz-registry shape from bundled data when public/data/quiz-registry.json fails.
 */

import { DATASET_META } from '../data/datasetMeta.js';
import { buildQuizRegistryPayload } from './quizRegistryBuild.js';

/** @returns {Promise<object>} Quiz registry shape (matches public/data/quiz-registry.json). */
export async function buildQuizRegistryFromBundledData() {
  const [{ players, teams, leagues }, liveNtModule] = await Promise.all([
    import('../data/sampleData.js'),
    import('../data/nationalTeamLive.json', { with: { type: 'json' } }),
  ]);

  return buildQuizRegistryPayload({
    players,
    teams,
    leagues,
    liveNt: liveNtModule.default,
    dataAsOf: DATASET_META.dataAsOf,
    source: 'bundled-fallback',
  });
}
