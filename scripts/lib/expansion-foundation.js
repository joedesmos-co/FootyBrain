/**
 * Phase foundation manifest — waves, gzip budgets, browse tiers.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EXPANSION_LIMITS } from '../phase1-curation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FOUNDATION_PATH = path.join(
  __dirname,
  '../../editorial-overlays/expansion-phase-foundation.json',
);

export const SAMPLE_DATA_GZIP_WARN_KB = 230;
export const SAMPLE_DATA_GZIP_FAIL_KB = 280;

export function loadExpansionFoundation() {
  if (!fs.existsSync(FOUNDATION_PATH)) {
    return {
      dataPolicy: {
        playersHardMax: EXPANSION_LIMITS.playersHardMax,
        sampleDataGzipWarnKb: SAMPLE_DATA_GZIP_WARN_KB,
        sampleDataGzipFailKb: SAMPLE_DATA_GZIP_FAIL_KB,
      },
      leagueWaves: [],
      nationalWaves: [],
      shardStrategy: {},
    };
  }
  return JSON.parse(fs.readFileSync(FOUNDATION_PATH, 'utf8'));
}

export function getPlayersHardMax() {
  const foundation = loadExpansionFoundation();
  return foundation.dataPolicy?.playersHardMax ?? EXPANSION_LIMITS.playersHardMax;
}
