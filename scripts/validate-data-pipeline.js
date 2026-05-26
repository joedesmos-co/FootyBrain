#!/usr/bin/env node
/**
 * Lightweight pipeline integrity checks (no sampleData writes).
 * Run before merge or in CI alongside validate:overlays.
 */

import fs from 'fs';
import { DATA_PATHS, loadExpansionClubConfigs } from './lib/data-pipeline-paths.js';

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function loadDraft() {
  if (!fs.existsSync(DATA_PATHS.draftOverlay)) {
    fail(`Missing draft overlay: ${DATA_PATHS.draftOverlay}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(DATA_PATHS.draftOverlay, 'utf8'));
}

function validateExpansionConfig() {
  try {
    const { clubs, sources, duplicateTeamIds } = loadExpansionClubConfigs();
    console.log(`Expansion clubs: ${clubs.length} from [${sources.join(', ')}]`);
    if (duplicateTeamIds.length) {
      fail(
        `Duplicate footybrainTeamId across phase configs: ${duplicateTeamIds.join(', ')}`,
      );
    }
  } catch (e) {
    fail(e.message);
  }
}

function validateDraftOverlay(draft) {
  if (!draft?.players) return;
  const ids = new Map();
  const sourceIds = new Map();
  let approved = 0;

  for (const entry of draft.players) {
    if (!entry?.id) {
      fail('[draft] Entry missing id');
      continue;
    }
    if (ids.has(entry.id)) fail(`[draft] Duplicate id: ${entry.id}`);
    ids.set(entry.id, true);

    if (entry.sourceId != null) {
      const sid = String(entry.sourceId);
      if (sourceIds.has(sid)) {
        fail(`[draft] Duplicate sourceId ${sid}: ${sourceIds.get(sid)} and ${entry.id}`);
      }
      sourceIds.set(sid, entry.id);
    }

    if (entry.reviewStatus === 'approved') approved += 1;
  }

  console.log(`Draft overlay: ${draft.players.length} players (${approved} approved)`);
}

function validateRequiredArtifacts() {
  for (const [label, filePath] of [
    ['manual overlay', DATA_PATHS.manualOverlay],
    ['draft overlay', DATA_PATHS.draftOverlay],
    ['phase1 clubs', DATA_PATHS.phase1Clubs],
  ]) {
    if (!fs.existsSync(filePath)) fail(`Missing ${label}: ${filePath}`);
  }

  if (!fs.existsSync(DATA_PATHS.tmPreview)) {
    warn(`TM preview not built — run npm run build:data-preview (${DATA_PATHS.tmPreview})`);
  }
  if (!fs.existsSync(DATA_PATHS.appReadyPreview)) {
    warn(
      `App-ready preview not built — run npm run build:app-ready-preview (${DATA_PATHS.appReadyPreview})`,
    );
  }
}

console.log('Validating data pipeline integrity…\n');

validateRequiredArtifacts();
validateExpansionConfig();
validateDraftOverlay(loadDraft());

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
}

if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  errors.forEach((e) => console.log(`  ✖ ${e}`));
  process.exit(1);
}

console.log('\nPASSED: data pipeline integrity checks.');
process.exit(0);
