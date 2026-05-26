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
import { EXPANSION_LIMITS } from './phase1-curation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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

  console.log('FootyBrain dataset scale validation\n');
  validatePlayerCount();
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
