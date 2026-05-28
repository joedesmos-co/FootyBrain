#!/usr/bin/env node
/**
 * Dataset scale guardrails — player count soft/hard limits and sample-data bundle size.
 * Run after merge and optionally after `npm run build` (pass --dist for gzip check).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';
import { players } from '../src/data/sampleData.js';
import { DATASET_META } from '../src/data/datasetMeta.js';
import { isQuizEligiblePlayer } from '../src/utils/quizPlayerRules.js';
import { EXPANSION_LIMITS } from './phase1-curation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUIZ_REGISTRY_PATH = path.join(ROOT, 'public/data/quiz-registry.json');

const SAMPLE_DATA_GZIP_WARN_KB = 230;
const SAMPLE_DATA_GZIP_FAIL_KB = 280;

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function findSampleDataChunk(distDir) {
  if (!fs.existsSync(distDir)) return null;
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) return null;
  const match = fs
    .readdirSync(assetsDir)
    .find((name) => name.startsWith('sample-data') && name.endsWith('.js'));
  return match ? path.join(assetsDir, match) : null;
}

function measureGzipKb(filePath) {
  const raw = fs.readFileSync(filePath);
  const gz = gzipSync(raw);
  return { rawKb: raw.length / 1024, gzipKb: gz.length / 1024 };
}

function validatePlayerCount() {
  const count = players.length;
  const { playersSoftMax, playersHardMax } = EXPANSION_LIMITS;

  console.log(`Player count: ${count}`);
  console.log(`  Soft max (warn): ${playersSoftMax}`);
  console.log(`  Hard max (fail): ${playersHardMax}`);

  if (count > playersHardMax) {
    fail(`Player count ${count} exceeds hard max ${playersHardMax}`);
  } else if (count > playersSoftMax) {
    warn(`Player count ${count} exceeds soft max ${playersSoftMax} — review before next expansion wave`);
  }
}

function validateQuizRegistry() {
  const liveQuizReady = players.filter(isQuizEligiblePlayer);
  const liveCount = liveQuizReady.length;

  console.log(`\nQuiz registry:`);
  console.log(`  Live quiz-ready (rules): ${liveCount}`);
  if (typeof DATASET_META?.quizEligibleCount === 'number') {
    console.log(`  DATASET_META.quizEligibleCount: ${DATASET_META.quizEligibleCount}`);
    if (DATASET_META.quizEligibleCount !== liveCount) {
      fail(
        `DATASET_META.quizEligibleCount (${DATASET_META.quizEligibleCount}) != live quiz-ready (${liveCount}) — re-run merge`,
      );
    }
  }

  if (!fs.existsSync(QUIZ_REGISTRY_PATH)) {
    fail(`Missing ${path.relative(ROOT, QUIZ_REGISTRY_PATH)} — run npm run write:quiz-registry`);
    return;
  }

  const registry = JSON.parse(fs.readFileSync(QUIZ_REGISTRY_PATH, 'utf8'));
  const registryCount = registry?.players?.length ?? 0;
  const metaCount = registry?.meta?.quizEligibleCount;
  const registryLeagues = registry?.leagues ?? [];
  const nationalBuckets = registry?.national?.quizReadyPlayerIdsByNationalTeamId ?? {};

  console.log(`  quiz-registry.json players: ${registryCount}`);
  if (typeof metaCount === 'number') {
    console.log(`  quiz-registry meta.quizEligibleCount: ${metaCount}`);
    if (metaCount !== registryCount) {
      fail(
        `quiz-registry meta.quizEligibleCount (${metaCount}) != players.length (${registryCount})`,
      );
    }
  }

  if (registryCount !== liveCount) {
    fail(
      `quiz-registry has ${registryCount} players but live quiz-ready count is ${liveCount} — run npm run write:post-merge-artifacts`,
    );
  }

  if (registryLeagues.some((l) => l?.id === 'external')) {
    fail('quiz-registry.leagues must not include external');
  }

  for (const [nationalTeamId, ids] of Object.entries(nationalBuckets)) {
    const count = Array.isArray(ids) ? ids.length : 0;
    if (count > 0 && count < 3) {
      fail(
        `quizReadyPlayerIdsByNationalTeamId contains under-min bucket: ${nationalTeamId} (${count})`,
      );
      break;
    }
  }

  const registryIds = new Set((registry.players ?? []).map((p) => p.id));
  const liveIds = new Set(liveQuizReady.map((p) => p.id));
  if (registryIds.size !== liveIds.size) {
    fail('quiz-registry player ids do not match live quiz-ready set (duplicate or missing ids)');
  }
  for (const id of liveIds) {
    if (!registryIds.has(id)) {
      fail(`quiz-registry missing quiz-ready player id: ${id}`);
      break;
    }
  }
}

function validateSampleDataSource() {
  const samplePath = path.join(ROOT, 'src/data/sampleData.js');
  if (!fs.existsSync(samplePath)) {
    warn('sampleData.js not found — skipping source size check');
    return;
  }
  const { gzipKb } = measureGzipKb(samplePath);
  console.log(`\nsampleData.js source gzip (approx): ${gzipKb.toFixed(1)} KB`);
  if (gzipKb >= SAMPLE_DATA_GZIP_FAIL_KB) {
    fail(
      `sampleData.js gzip ${gzipKb.toFixed(1)} KB >= fail threshold ${SAMPLE_DATA_GZIP_FAIL_KB} KB`,
    );
  } else if (gzipKb >= SAMPLE_DATA_GZIP_WARN_KB) {
    warn(
      `sampleData.js gzip ${gzipKb.toFixed(1)} KB >= warn threshold ${SAMPLE_DATA_GZIP_WARN_KB} KB`,
    );
  }
}

function validateDistChunk(distDir) {
  const chunkPath = findSampleDataChunk(distDir);
  if (!chunkPath) {
    warn(`No sample-data chunk in ${distDir} — run npm run build first for dist gzip check`);
    return;
  }
  const { rawKb, gzipKb } = measureGzipKb(chunkPath);
  console.log(`\nVite sample-data chunk: ${path.basename(chunkPath)}`);
  console.log(`  Raw: ${rawKb.toFixed(1)} KB · Gzip: ${gzipKb.toFixed(1)} KB`);

  if (gzipKb >= SAMPLE_DATA_GZIP_FAIL_KB) {
    fail(
      `sample-data chunk gzip ${gzipKb.toFixed(1)} KB >= fail threshold ${SAMPLE_DATA_GZIP_FAIL_KB} KB`,
    );
  } else if (gzipKb >= SAMPLE_DATA_GZIP_WARN_KB) {
    warn(
      `sample-data chunk gzip ${gzipKb.toFixed(1)} KB >= warn threshold ${SAMPLE_DATA_GZIP_WARN_KB} KB`,
    );
  }
}

function main() {
  const checkDist = process.argv.includes('--dist');
  const distDir = path.join(ROOT, 'dist');

  console.log('FootyCompass dataset scale validation\n');
  validatePlayerCount();
  validateQuizRegistry();
  validateSampleDataSource();
  if (checkDist) validateDistChunk(distDir);

  if (warnings.length) {
    console.log('\nWarnings:');
    warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  }

  if (errors.length) {
    console.error('\nErrors:');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log('\nDataset scale validation passed.');
}

main();
