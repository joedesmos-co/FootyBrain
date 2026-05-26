#!/usr/bin/env node
/**
 * Wave 3 national-team rollout summary (preview + registry simulation).
 * Does not modify sampleData.js or nationalTeamLive.json.
 *
 * Reads:
 *   generated-data/national-teams-preview.json
 *   src/data/sampleData.js (players registry)
 *
 * Output: generated-data/national-teams-wave3-rollout-summary.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { players } from '../src/data/sampleData.js';
import { isQuizEligiblePlayer } from '../src/utils/quizEligibility.js';
import {
  NATIONAL_TEAM_TARGETS,
  REGISTRY_NATIONALITY_LABELS,
  QUIZ_MIN_LIVE,
  LINKED_MIN_HEALTHY,
  WAVE_3_NATIONAL_TEAM_IDS,
} from './lib/national-team-expansion-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PREVIEW_PATH = path.join(ROOT, 'generated-data/national-teams-preview.json');
const OUTPUT_PATH = path.join(ROOT, 'generated-data/national-teams-wave3-rollout-summary.json');

function normalizeName(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv']);

function lastToken(name) {
  const parts = normalizeName(name).split(' ').filter(Boolean);
  if (!parts.length) return '';
  const last = parts.at(-1);
  if (SUFFIXES.has(last) && parts.length >= 2) return parts.at(-2);
  return last;
}

function playerMatchesNationalTeam(player, nationalTeamId) {
  const labels = REGISTRY_NATIONALITY_LABELS[nationalTeamId] ?? [];
  const fields = [player.nationality, player.nationalTeam, player.country].filter(Boolean);
  for (const field of fields) {
    const norm = String(field).trim().toLowerCase();
    for (const label of labels) {
      if (norm === label || norm.includes(label)) return true;
    }
  }
  return false;
}

function assessNation(nationalTeamId, preview, playerList) {
  const target = NATIONAL_TEAM_TARGETS.find((t) => t.id === nationalTeamId);
  const previewTeam = (preview.nationalTeams ?? []).find((t) => t.id === nationalTeamId);
  const previewLinks = (preview.playerLinks ?? []).filter((l) => l.nationalTeamId === nationalTeamId);
  const unmatched = (preview.unmatchedNationalTeamPlayers ?? []).filter(
    (u) => u.nationalTeamId === nationalTeamId,
  );

  const registryCandidates = playerList.filter((p) => playerMatchesNationalTeam(p, nationalTeamId));
  const registryLinkedIds = new Set(registryCandidates.map((p) => p.id));
  const previewOnlyIds = new Set(previewLinks.map((l) => l.playerId));
  const combinedIds = new Set([...registryLinkedIds, ...previewOnlyIds]);

  const quizReady = [...combinedIds]
    .map((id) => playerList.find((p) => p.id === id))
    .filter(Boolean)
    .filter(isQuizEligiblePlayer);

  const linkedCount = combinedIds.size;
  const quizReadyCount = quizReady.length;

  const surnameCounts = new Map();
  for (const p of quizReady) {
    const last = lastToken(p.name);
    if (last.length <= 3) continue;
    surnameCounts.set(last, (surnameCounts.get(last) ?? 0) + 1);
  }
  const dupSurnames = [...surnameCounts.entries()].filter(([, c]) => c > 1);

  const risks = [];
  if (target?.tmMissing) risks.push('tm_entity_missing');
  if (linkedCount < LINKED_MIN_HEALTHY) risks.push('low_linked_count');
  if (quizReadyCount < QUIZ_MIN_LIVE) risks.push('low_quiz_ready');
  if (unmatched.length > 15) risks.push('high_unmatched_tm_rows');
  if (dupSurnames.length > 0) risks.push('duplicate_surname_pool');

  const safeToLive =
    !target?.tmMissing &&
    linkedCount >= LINKED_MIN_HEALTHY &&
    quizReadyCount >= QUIZ_MIN_LIVE &&
    dupSurnames.length === 0;

  const previewOnlySafe =
    linkedCount >= QUIZ_MIN_LIVE && quizReadyCount >= QUIZ_MIN_LIVE && !target?.tmMissing;

  return {
    nationalTeamId,
    displayName: target?.displayName ?? previewTeam?.displayName ?? nationalTeamId,
    expansionWave: target?.expansionWave ?? previewTeam?.expansionWave ?? null,
    tmEntityMissing: Boolean(target?.tmMissing ?? previewTeam?.tmEntityMissing),
    linkedFromPreview: previewLinks.length,
    registryBackfillCandidates: registryCandidates.length,
    linkedTotal: linkedCount,
    quizReadyCount,
    unmatchedCount: unmatched.length,
    duplicateSurnameCount: dupSurnames.length,
    worstDuplicateSurname: dupSurnames[0]
      ? { surname: dupSurnames[0][0], count: dupSurnames[0][1] }
      : null,
    risks,
    safeToLive,
    previewOnlyViable: previewOnlySafe && !safeToLive,
    recommendedAction: safeToLive
      ? 'promote_to_live'
      : previewOnlySafe
        ? 'live_with_caution'
        : 'preview_only',
  };
}

function main() {
  if (!fs.existsSync(PREVIEW_PATH)) {
    console.error(`Missing ${PREVIEW_PATH} — run npm run build:national-teams-preview`);
    process.exit(1);
  }

  const preview = JSON.parse(fs.readFileSync(PREVIEW_PATH, 'utf8'));
  const nations = NATIONAL_TEAM_TARGETS.map((t) => t.id);
  const byNation = nations.map((id) => assessNation(id, preview, players));

  const wave3 = byNation.filter((n) => WAVE_3_NATIONAL_TEAM_IDS.includes(n.nationalTeamId));
  const safeToLive = byNation.filter((n) => n.safeToLive);
  const risky = byNation.filter((n) => n.risks.length > 0 && !n.safeToLive);

  const rolloutOrder = [...byNation].sort((a, b) => {
    if (a.safeToLive !== b.safeToLive) return a.safeToLive ? -1 : 1;
    if (b.quizReadyCount !== a.quizReadyCount) return b.quizReadyCount - a.quizReadyCount;
    return b.linkedTotal - a.linkedTotal;
  });

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      expansionWave: 3,
      previewInspectionPassed: preview.inspection?.passed ?? preview.meta?.inspectionPassed,
      gates: {
        quizMinLive: QUIZ_MIN_LIVE,
        linkedMinHealthy: LINKED_MIN_HEALTHY,
      },
      counts: {
        nationsPreviewed: nations.length,
        wave3Nations: wave3.length,
        safeToLive: safeToLive.length,
        risky: risky.length,
      },
    },
    recommendedLiveRolloutOrder: rolloutOrder
      .filter((n) => n.safeToLive)
      .map((n) => n.nationalTeamId),
    safeToLiveTeams: safeToLive,
    riskyTeams: risky,
    wave3Teams: wave3,
    nations: byNation,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

  console.log('Wrote', path.relative(ROOT, OUTPUT_PATH));
  console.log('Nations assessed:', nations.length);
  console.log('Safe to live:', safeToLive.length);
  console.log('Wave 3 preview nations:', wave3.length);
  console.log(
    'Wave 3 safe to live:',
    wave3.filter((n) => n.safeToLive).length,
  );
}

main();
