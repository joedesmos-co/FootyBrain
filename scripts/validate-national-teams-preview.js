#!/usr/bin/env node
/**
 * Validate generated-data/national-teams-preview.json (read-only).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { players } from '../src/data/sampleData.js';
import { NATIONAL_TEAM_TARGETS } from './lib/national-team-expansion-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PREVIEW_PATH = path.join(ROOT, 'generated-data/national-teams-preview.json');

const EXPECTED_TEAM_IDS = new Set(NATIONAL_TEAM_TARGETS.map((t) => t.id));

function main() {
  if (!fs.existsSync(PREVIEW_PATH)) {
    console.error(`Missing ${path.relative(ROOT, PREVIEW_PATH)} — run npm run build:national-teams-preview`);
    process.exit(1);
  }

  const preview = JSON.parse(fs.readFileSync(PREVIEW_PATH, 'utf8'));
  const registryIds = new Set(players.map((p) => p.id));
  const registrySourceIds = new Set(
    players.flatMap((p) => {
      const ids = [];
      if (p.sourceId) ids.push(String(p.sourceId));
      if (String(p.id).startsWith('tm-')) ids.push(p.id.slice(3));
      return ids;
    }),
  );

  const errors = [];
  const warnings = [];

  const teamIds = new Set((preview.nationalTeams ?? []).map((t) => t.id));
  for (const id of EXPECTED_TEAM_IDS) {
    if (!teamIds.has(id)) errors.push(`Missing priority national team: ${id}`);
  }

  const linkKeys = new Set();
  for (const link of preview.playerLinks ?? []) {
    if (!registryIds.has(link.playerId)) {
      errors.push(`playerLinks references unknown playerId: ${link.playerId}`);
    }
    if (link.sourceId && registrySourceIds.has(String(link.sourceId))) {
      const key = `${link.nationalTeamId}::${link.sourceId}`;
      if (linkKeys.has(key)) errors.push(`Duplicate link: ${key}`);
      linkKeys.add(key);
    }
    if (String(link.playerId).startsWith('tm-') && link.sourceId) {
      const expected = `tm-${link.sourceId}`;
      if (link.playerId !== expected && !registryIds.has(link.playerId)) {
        warnings.push(`playerId ${link.playerId} ≠ tm-${link.sourceId} (may be MVP slug — ok if in registry)`);
      }
    }
  }

  for (const u of preview.unmatchedNationalTeamPlayers ?? []) {
    if (u.sourceId && registrySourceIds.has(String(u.sourceId))) {
      errors.push(
        `Unmatched player tm-${u.sourceId} (${u.tmDisplayName}) is actually in club registry — matching bug`,
      );
    }
  }

  const duplicatePlayerIds = new Map();
  for (const link of preview.playerLinks ?? []) {
    const k = link.playerId;
    if (!duplicatePlayerIds.has(k)) duplicatePlayerIds.set(k, []);
    duplicatePlayerIds.get(k).push(link.nationalTeamId);
  }
  for (const [playerId, nts] of duplicatePlayerIds) {
    if (nts.length > 1) {
      warnings.push(`Same club playerId on multiple NT squads: ${playerId} → ${nts.join(', ')}`);
    }
  }

  if (errors.length) {
    console.error('FAILED validation:');
    errors.forEach((e) => console.error('  ✗', e));
  } else {
    console.log('PASSED national-teams-preview validation.');
  }
  if (warnings.length) {
    console.log(`Warnings (${warnings.length}):`);
    warnings.slice(0, 15).forEach((w) => console.log('  ⚠', w));
    if (warnings.length > 15) console.log(`  … and ${warnings.length - 15} more`);
  }

  console.log('\nSummary:');
  console.log('  Teams:', preview.nationalTeams?.length ?? 0);
  console.log('  Linked:', preview.playerLinks?.length ?? 0);
  console.log('  Unmatched:', preview.unmatchedNationalTeamPlayers?.length ?? 0);
  console.log('  Inspection passed:', preview.inspection?.passed ?? preview.meta?.inspectionPassed);

  process.exit(errors.length ? 1 : 0);
}

main();
