#!/usr/bin/env node
/**
 * Validate staged Phase 4 preview (MLS + Brasileirão).
 * Does not touch sampleData.js or the live app.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PREVIEW_PATH = path.join(ROOT, 'generated-data/footybrain-phase4-preview-data.json');
const CONFIG_PATH = path.join(ROOT, 'editorial-overlays/phase4-clubs.json');

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

function main() {
  console.log('Validating Phase 4 staged preview…\n');

  if (!fs.existsSync(CONFIG_PATH)) {
    err(`Missing ${CONFIG_PATH}`);
    printResult();
    process.exit(1);
  }
  if (!fs.existsSync(PREVIEW_PATH)) {
    err(`Missing ${PREVIEW_PATH} — run npm run build:phase4-preview`);
    printResult();
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const preview = JSON.parse(fs.readFileSync(PREVIEW_PATH, 'utf8'));
  const report = preview.inspectionReport;

  if (!report) {
    err('inspectionReport missing from preview — rebuild with npm run build:phase4-preview');
  }

  const expectedClubs = config.clubs?.length ?? 0;
  if (preview.stats?.teams !== expectedClubs) {
    err(`clubs matched ${preview.stats?.teams} !== config ${expectedClubs}`);
  }

  if (preview.meta?.phase !== 'phase4') {
    warn(`meta.phase is "${preview.meta?.phase}" (expected phase4)`);
  }

  if (report) {
    if (report.unmatchedTargetClubs?.length) {
      err(`Unmatched clubs: ${report.unmatchedTargetClubs.join(', ')}`);
    }
    if (report.clubsUnder18Players?.length) {
      warn(
        `Clubs under 18 players: ${report.clubsUnder18Players.map((c) => `${c.label} (${c.playerCount})`).join('; ')}`,
      );
    }
    const mf = report.missingFields ?? {};
    if (mf.noDob || mf.noNationality || mf.noPosition || mf.noSourceId || mf.noName) {
      err(`Missing required fields: ${JSON.stringify(mf)}`);
    }
    if (report.duplicateNameRisks?.sameDisplayNameSameTeam?.length) {
      warn(
        `Duplicate display names (same team): ${report.duplicateNameRisks.sameDisplayNameSameTeam.length} — quiz caution`,
      );
    }
    if (report.duplicateNameRisks?.sameLastNameSameTeam?.length) {
      warn(
        `Duplicate last names (same team): ${report.duplicateNameRisks.sameLastNameSameTeam.length} — quiz caution`,
      );
    }

    const leagues = report.leaguesFound?.map((l) => l.id) ?? [];
    if (!leagues.includes('mls') || !leagues.includes('brasileirao')) {
      err(`Expected leagues mls + brasileirao; got ${leagues.join(', ')}`);
    }

    console.log('--- Phase 4 inspection summary ---');
    console.log(`Leagues found: ${report.leaguesFound?.map((l) => `${l.name} (${l.tmCompetitionCode})`).join(', ')}`);
    console.log(`Clubs matched: ${report.clubsMatched} / ${report.clubsRequested}`);
    console.log(`Players exported: ${report.playersExported}`);
    console.log(`Clubs under 18 players: ${report.clubsUnder18Players?.length ?? 0}`);
    console.log(`Missing fields: ${JSON.stringify(report.missingFields)}`);
    console.log(
      `Duplicate display-name risks: ${report.duplicateNameRisks?.sameDisplayNameSameTeam?.length ?? 0}`,
    );
    console.log(
      `Duplicate last-name risks: ${report.duplicateNameRisks?.sameLastNameSameTeam?.length ?? 0}`,
    );
    console.log('');
  }

  for (const p of preview.players ?? []) {
    if (p.quizEligible === true) {
      err(`Player ${p.sourceId} has quizEligible true — Phase 4 preview must not auto-approve quiz`);
    }
  }

  printResult();
  process.exit(errors.length > 0 ? 1 : 0);
}

function printResult() {
  if (warnings.length) {
    console.log(`Warnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  ⚠ ${w}`));
    console.log('');
  }
  if (errors.length) {
    console.log(`Errors (${errors.length}):`);
    errors.forEach((e) => console.log(`  ✖ ${e}`));
    console.log('\nFAILED — not ready to merge to sampleData.');
  } else {
    console.log('PASSED — Phase 4 preview is structurally ready for a reviewed merge (not live yet).');
  }
}

main();
