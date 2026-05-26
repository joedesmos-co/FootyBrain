#!/usr/bin/env node
/**
 * Validate live Brasileirão tranche in sampleData.js (post-merge rollout).
 * Does not modify data — reports accents, duplicates, squads, quiz policy.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { players, teams, leagues } from '../src/data/sampleData.js';
import { isQuizEligiblePlayer } from '../src/utils/quizEligibility.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'editorial-overlays/phase4-brasileirao-clubs.json');
const AUDIT_PATH = path.join(ROOT, 'generated-data/phase4-preview-audit-report.json');
const REPORT_PATH = path.join(ROOT, 'generated-data/brasileirao-live-rollout-report.json');

const LEAGUE_ID = 'brasileirao';
const EXPECTED_CLUBS = 20;
const EXPECTED_PLAYERS = 440;
const MAX_PER_CLUB = 22;
const MIN_PER_CLUB = 18;

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

function stripAccents(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeName(value) {
  return stripAccents(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function hasLatinDisplayName(name) {
  return /^[\p{Script=Latin}\p{Mark}\d\s.'’\-]+$/u.test(String(name ?? '').trim());
}

function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const expectedTeamIds = new Set(config.clubs.map((c) => c.footybrainTeamId));

  const league = leagues.find((l) => l.id === LEAGUE_ID);
  if (!league) err(`League "${LEAGUE_ID}" missing from sampleData leagues`);

  const braTeams = teams.filter((t) => t.leagueId === LEAGUE_ID);
  const braPlayers = players.filter((p) => p.leagueId === LEAGUE_ID);

  if (braTeams.length !== EXPECTED_CLUBS) {
    err(`Expected ${EXPECTED_CLUBS} Brasileirão clubs, found ${braTeams.length}`);
  }

  for (const id of expectedTeamIds) {
    if (!braTeams.some((t) => t.id === id)) err(`Configured club missing in live data: ${id}`);
  }

  if (braPlayers.length !== EXPECTED_PLAYERS) {
    warn(`Expected ~${EXPECTED_PLAYERS} players, found ${braPlayers.length}`);
  }

  const squadByTeam = new Map();
  for (const p of braPlayers) {
    squadByTeam.set(p.teamId, (squadByTeam.get(p.teamId) ?? 0) + 1);
  }

  for (const team of braTeams) {
    const count = squadByTeam.get(team.id) ?? 0;
    if (count < MIN_PER_CLUB) err(`${team.name}: squad ${count} < ${MIN_PER_CLUB}`);
    if (count > MAX_PER_CLUB) err(`${team.name}: squad ${count} > ${MAX_PER_CLUB}`);
  }

  let missingDob = 0;
  let missingNationality = 0;
  let missingPosition = 0;
  let missingSource = 0;
  let nonLatinNames = 0;

  for (const p of braPlayers) {
    if (!p.dateOfBirth) missingDob += 1;
    if (!p.nationality) missingNationality += 1;
    if (!p.position) missingPosition += 1;
    if (!p.id?.startsWith('tm-') && !['lautaro'].includes(p.id)) {
      if (!p.sourceId) missingSource += 1;
    }
    if (!hasLatinDisplayName(p.name)) nonLatinNames += 1;
  }

  if (missingDob) err(`${missingDob} players missing dateOfBirth`);
  if (missingNationality) err(`${missingNationality} players missing nationality`);
  if (missingPosition) err(`${missingPosition} players missing position`);

  if (nonLatinNames) {
    warn(`${nonLatinNames} non-Latin display name(s) — browse/compare only; review encoding`);
  }

  const sameNameSameTeam = [];
  const byTeamName = new Map();
  for (const p of braPlayers) {
    const key = `${p.teamId}|${normalizeName(p.name)}`;
    if (!byTeamName.has(key)) byTeamName.set(key, []);
    byTeamName.get(key).push(p.id);
  }
  for (const [key, ids] of byTeamName) {
    if (ids.length > 1) sameNameSameTeam.push({ key, ids });
  }
  if (sameNameSameTeam.length) {
    warn(`${sameNameSameTeam.length} duplicate display name(s) on same club`);
  }

  const lastNameCollisions = new Map();
  for (const p of braPlayers) {
    const parts = normalizeName(p.name).split(' ');
    const last = parts[parts.length - 1];
    if (!last) continue;
    const key = `${p.teamId}|${last}`;
    if (!lastNameCollisions.has(key)) lastNameCollisions.set(key, []);
    lastNameCollisions.get(key).push(p.name);
  }
  const lastNameDupes = [...lastNameCollisions.values()].filter((names) => names.length > 1);
  if (lastNameDupes.length) {
    warn(`${lastNameDupes.length} same-last-name groups per club (quiz caution)`);
  }

  const quizReady = braPlayers.filter(isQuizEligiblePlayer);
  const autoQuiz = braPlayers.filter(
    (p) => p.quizEligible && p.dataStatus !== 'generated-editorial-approved',
  );
  if (autoQuiz.length) {
    err(`${autoQuiz.length} Brasileirão player(s) quiz-eligible without editorial approval`);
  }

  const browseOnly = braPlayers.length - quizReady.length;
  if (quizReady.length > 0) {
    warn(
      `${quizReady.length} editorial quiz-ready Brasileirão players (wave-1 batch); ${browseOnly} browse-only`,
    );
  }

  const report = {
    validatedAt: new Date().toISOString(),
    leagueId: LEAGUE_ID,
    auditVerdict: 'pass_after_curation',
    live: {
      clubs: braTeams.length,
      players: braPlayers.length,
      browseOnlyPlayers: browseOnly,
      editorialQuizReady: quizReady.length,
      squadMin: Math.min(...[...squadByTeam.values()]),
      squadMax: Math.max(...[...squadByTeam.values()]),
    },
    encoding: { nonLatinDisplayNames: nonLatinNames },
    duplicates: {
      sameDisplaySameTeam: sameNameSameTeam.length,
      sameLastNameSameTeam: lastNameDupes.length,
    },
    missingFields: { missingDob, missingNationality, missingPosition, missingSource },
    errors,
    warnings,
    verdict: errors.length ? 'fail' : warnings.length ? 'pass_with_warnings' : 'pass',
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  if (fs.existsSync(AUDIT_PATH)) {
    const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8'));
    audit.notLive = false;
    audit.liveRolloutAt = report.validatedAt.slice(0, 10);
    audit.liveRollout = report.live;
    fs.writeFileSync(AUDIT_PATH, `${JSON.stringify(audit, null, 2)}\n`);
  }

  console.log('Brasileirão live validation\n');
  console.log(`Clubs: ${report.live.clubs}`);
  console.log(`Players: ${report.live.players} (${report.live.browseOnlyPlayers} browse-only)`);
  console.log(`Editorial quiz-ready: ${report.live.editorialQuizReady}`);
  console.log(`Squad sizes: ${report.live.squadMin}–${report.live.squadMax}`);
  console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)}`);

  if (warnings.length) {
    console.log('\nWarnings:');
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }
  if (errors.length) {
    console.log('\nErrors:');
    for (const e of errors) console.log(`  ✖ ${e}`);
    process.exit(1);
  }

  console.log('\nPASSED: Brasileirão live rollout checks OK.');
}

main();
