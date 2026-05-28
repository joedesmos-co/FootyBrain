#!/usr/bin/env node
/**
 * Generate public/data/quiz-registry.json
 *
 * Full quiz ecosystem (all in-league players) with slim fields + synthetic clues where needed.
 * Editorial quiz-ready count is tracked separately in meta.quizEligibleCount.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { players, teams, leagues } from '../src/data/sampleData.js';
import { DATASET_META } from '../src/data/datasetMeta.js';
import { isQuizEligiblePlayer } from '../src/utils/quizPlayerRules.js';
import { buildQuizRegistryPayload } from '../src/utils/quizRegistryBuild.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/data');
const OUT_PATH = path.join(OUT_DIR, 'quiz-registry.json');

const liveNtRaw = fs.readFileSync(path.join(ROOT, 'src/data/nationalTeamLive.json'), 'utf8');
const liveNt = JSON.parse(liveNtRaw);

const editorialCount = players.filter(isQuizEligiblePlayer).length;

if (typeof DATASET_META?.quizEligibleCount === 'number') {
  if (editorialCount !== DATASET_META.quizEligibleCount) {
    console.warn(
      `[write-quiz-registry] Warning: editorial quiz-ready ${editorialCount} != DATASET_META.quizEligibleCount ${DATASET_META.quizEligibleCount}`,
    );
  }
}

const registry = buildQuizRegistryPayload({
  players,
  teams,
  leagues,
  liveNt,
  dataAsOf: DATASET_META.dataAsOf,
  source: 'write-quiz-registry',
});

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(registry)}\n`);

const rawKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
console.log(
  `Wrote ${OUT_PATH} (${registry.meta.quizEcosystemCount} ecosystem players, ${registry.meta.quizEligibleCount} editorial, ${rawKb} KB raw)`,
);
