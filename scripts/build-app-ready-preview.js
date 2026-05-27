#!/usr/bin/env node
/**
 * Merge TM preview facts + editorial overlay into an app-ready staging file.
 * Does NOT modify sampleData.js or import into React.
 *
 * Inputs:
 *   generated-data/footybrain-preview-data.json
 *   editorial-overlays/players.manual.json
 *   src/data/sampleData.js (MVP structure reference)
 *
 * Output:
 *   generated-data/footybrain-app-ready-preview.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { players as samplePlayers } from '../src/data/sampleData.js';
import { curatePhase1PreviewPlayers, EXPANSION_LIMITS } from './phase1-curation.js';
import {
  injectRequiredTmPlayers,
  loadGeneratedDraftSourceIds,
  loadRequiredImportSourceIds,
  trimCuratedTmToCap,
} from './lib/expansion-player-cap.js';
import { nullImageFields, validatePlayerImageFields } from './player-image-rules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PREVIEW_PATH = path.join(ROOT, 'generated-data/footybrain-preview-data.json');
const OVERLAY_PATH = path.join(ROOT, 'editorial-overlays/players.manual.json');
const GENERATED_OVERLAY_PATH = path.join(ROOT, 'editorial-overlays/players.generated-draft.json');
const REQUIRED_IMPORTS_PATH = path.join(
  ROOT,
  'editorial-overlays/required-import-sourceIds.json',
);
const OUTPUT_PATH = path.join(ROOT, 'generated-data/footybrain-app-ready-preview.json');

const DATA_AS_OF = '2026-05-25';

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadOptionalJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return loadJson(filePath);
}

function ageFromDateOfBirth(dateOfBirth, asOf = new Date(DATA_AS_OF)) {
  if (!dateOfBirth) return null;
  const [y, m, d] = dateOfBirth.split('-').map(Number);
  if (!y || !m || !d) return null;
  const born = new Date(y, m - 1, d);
  let age = asOf.getFullYear() - born.getFullYear();
  const md = asOf.getMonth() - born.getMonth();
  if (md < 0 || (md === 0 && asOf.getDate() < born.getDate())) age -= 1;
  return age;
}

function displayNameFromPreview(p) {
  const first = (p.firstName || '').trim();
  const last = (p.lastName || '').trim();
  if (first && last) return `${first} ${last}`;
  const raw = (p.name || '').split(',')[0].trim();
  return raw || null;
}

function nationalTeamFromPreview(p) {
  if (p.nationalTeam && String(p.nationalTeam).trim()) return p.nationalTeam;
  return p.nationality ?? null;
}

function buildMvpPlayer(overlay, sample, tmBySourceId, warnings) {
  const base = {
    id: overlay.id,
    name: overlay.displayName,
    quickFact: overlay.quickFact,
    quizHints: overlay.quizHints,
    playingStyle: overlay.playingStyle,
    importanceScore: overlay.importanceScore,
    quizEligible: overlay.quizEligible,
    rosterTier: overlay.rosterTier,
    ...nullImageFields(),
    careerHistory: sample.careerHistory ?? [],
  };

  if (overlay.sourceId) {
    const tm = tmBySourceId.get(String(overlay.sourceId));
    if (!tm) {
      warnings.push(`sourceId ${overlay.sourceId} (${overlay.id}) missing from preview; using sample factual fields.`);
      return {
        ...base,
        ...factualFromSample(sample),
        sourceId: overlay.sourceId,
        dataStatus: 'manual-only',
      };
    }

    if (tm.footybrainTeamId !== sample.teamId) {
      warnings.push(
        `Team mismatch for ${overlay.id}: sample ${sample.teamId}, TM preview ${tm.footybrainTeamId} (sourceId ${overlay.sourceId}). Using TM team for linked merge.`,
      );
    }

    return {
      ...base,
      dataStatus: 'mvp-linked',
      sourceId: String(overlay.sourceId),
      dateOfBirth: tm.dateOfBirth ?? null,
      age: ageFromDateOfBirth(tm.dateOfBirth),
      nationality: tm.nationality ?? sample.nationality,
      nationalTeam: nationalTeamFromPreview(tm) ?? sample.nationalTeam,
      position: tm.position ?? sample.position,
      teamId: tm.footybrainTeamId ?? sample.teamId,
      leagueId: tm.footybrainLeagueId ?? sample.leagueId,
    };
  }

  return {
    ...base,
    dataStatus: 'manual-only',
    sourceId: null,
    ...factualFromSample(sample),
  };
}

function factualFromSample(sample) {
  return {
    dateOfBirth: null,
    age: sample.age,
    nationality: sample.nationality,
    nationalTeam: sample.nationalTeam,
    position: sample.position,
    teamId: sample.teamId,
    leagueId: sample.leagueId,
  };
}

function buildGeneratedPlayer(tm, generatedOverlayBySourceId) {
  const overlay = generatedOverlayBySourceId.get(String(tm.sourceId));
  if (overlay) {
    return {
      id: overlay.id,
      sourceId: String(tm.sourceId),
      name: overlay.displayName,
      displayName: overlay.displayName,
      dateOfBirth: tm.dateOfBirth ?? null,
      age: ageFromDateOfBirth(tm.dateOfBirth),
      nationality: tm.nationality ?? null,
      nationalTeam: nationalTeamFromPreview(tm),
      position: tm.position ?? null,
      teamId: tm.footybrainTeamId,
      leagueId: tm.footybrainLeagueId,
      quickFact: overlay.quickFact,
      quizHints: overlay.quizHints,
      playingStyle: overlay.playingStyle,
      importanceScore: overlay.importanceScore,
      quizEligible: overlay.quizEligible,
      rosterTier: overlay.rosterTier,
      reviewStatus: overlay.reviewStatus,
      ...nullImageFields(),
      careerHistory: [],
      dataStatus: 'generated-editorial-approved',
    };
  }

  return {
    id: `tm-${tm.sourceId}`,
    sourceId: String(tm.sourceId),
    name: displayNameFromPreview(tm),
    dateOfBirth: tm.dateOfBirth ?? null,
    age: ageFromDateOfBirth(tm.dateOfBirth),
    nationality: tm.nationality ?? null,
    nationalTeam: nationalTeamFromPreview(tm),
    position: tm.position ?? null,
    teamId: tm.footybrainTeamId,
    leagueId: tm.footybrainLeagueId,
    quickFact: '',
    quizHints: [],
    playingStyle: '',
    importanceScore: null,
    quizEligible: false,
    rosterTier: 'squad',
    ...nullImageFields(),
    careerHistory: [],
    dataStatus: 'generated-needs-editorial',
  };
}

function validateOutput(output) {
  const issues = [];
  if (!Array.isArray(output.players)) issues.push('players must be an array');
  const ids = new Set();
  for (const p of output.players) {
    if (!p.id) issues.push('player missing id');
    if (ids.has(p.id)) issues.push(`duplicate id: ${p.id}`);
    ids.add(p.id);
    if ('market_value' in p || 'marketValue' in p || 'sourcePlayerHref' in p) {
      issues.push(`forbidden TM field on ${p.id}`);
    }
    if (!p.dataStatus) issues.push(`missing dataStatus on ${p.id}`);
    validatePlayerImageFields(p, {
      err: (msg) => issues.push(msg),
      id: p.id,
    });
  }
  return issues;
}

function main() {
  const warnings = [];

  if (!fs.existsSync(PREVIEW_PATH)) {
    console.error(`Missing preview: ${PREVIEW_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(OVERLAY_PATH)) {
    console.error(`Missing overlay: ${OVERLAY_PATH}`);
    process.exit(1);
  }

  const preview = loadJson(PREVIEW_PATH);
  const overlay = loadJson(OVERLAY_PATH);
  const generatedOverlay = loadOptionalJson(GENERATED_OVERLAY_PATH, { players: [] });
  const sampleById = new Map(samplePlayers.map((p) => [p.id, p]));
  const tmBySourceId = new Map(preview.players.map((p) => [String(p.sourceId), p]));
  const requiredDraftSourceIds = loadGeneratedDraftSourceIds(GENERATED_OVERLAY_PATH);
  const requiredImportSourceIds = loadRequiredImportSourceIds(REQUIRED_IMPORTS_PATH);
  const requiredSourceIds = new Set([...requiredDraftSourceIds, ...requiredImportSourceIds]);
  const generatedOverlayBySourceId = new Map(
    (generatedOverlay.players ?? []).map((p) => [String(p.sourceId), p]),
  );

  const overlayById = new Map(overlay.players.map((p) => [p.id, p]));
  const mvpIds = new Set(overlay.players.map((p) => p.id));

  for (const id of mvpIds) {
    if (!overlayById.has(id)) {
      warnings.push(`No editorial overlay for MVP id: ${id}`);
    }
  }

  const mvpPlayers = [];
  const linkedPlayers = [];
  const manualOnlyPlayers = [];

  for (const mvpId of mvpIds) {
    const sample = sampleById.get(mvpId);
    const ov = overlayById.get(mvpId);
    if (!sample || !ov) continue;
    const merged = buildMvpPlayer(ov, sample, tmBySourceId, warnings);
    mvpPlayers.push(merged);
    if (merged.dataStatus === 'mvp-linked') linkedPlayers.push(merged.id);
    else manualOnlyPlayers.push(merged.id);
  }

  const usedSourceIds = new Set(
    mvpPlayers.filter((p) => p.sourceId).map((p) => String(p.sourceId)),
  );

  const emergencyCap = EXPANSION_LIMITS.playersHardMax ?? EXPANSION_LIMITS.playersMax;
  const maxSquadRows = Math.max(0, emergencyCap - mvpPlayers.length);
  let curatedTm = curatePhase1PreviewPlayers(
    preview.players,
    usedSourceIds,
    ageFromDateOfBirth,
  );

  curatedTm = injectRequiredTmPlayers(curatedTm, {
    requiredSourceIds,
    tmBySourceId,
    reservedSourceIds: usedSourceIds,
  });

  const { curatedTm: cappedCuratedTm, trimmedBrowse } = trimCuratedTmToCap(curatedTm, {
    maxSquadRows,
    requiredSourceIds,
  });
  curatedTm = cappedCuratedTm;
  if (trimmedBrowse > 0) {
    warnings.push(
      `Emergency trim: ${trimmedBrowse} browse-only TM rows (hard cap ${emergencyCap}; draft-approved preserved).`,
    );
  }
  if (mvpPlayers.length + curatedTm.length < EXPANSION_LIMITS.playersMin) {
    warnings.push(
      `Total player count ${mvpPlayers.length + curatedTm.length} below target min ${EXPANSION_LIMITS.playersMin} — check preview build / club matches.`,
    );
  }

  const generatedNeedsEditorial = [];
  const generatedEditorialApproved = [];
  const squadPlayers = [];
  for (const tm of curatedTm) {
    const row = buildGeneratedPlayer(tm, generatedOverlayBySourceId);
    if (!row.name) {
      warnings.push(`Skipped generated player ${tm.sourceId}: no display name`);
      continue;
    }
    if (row.dataStatus === 'generated-editorial-approved') {
      generatedEditorialApproved.push(row.id);
    } else {
      generatedNeedsEditorial.push(row.id);
    }
    squadPlayers.push(row);
  }

  const allPlayers = [...mvpPlayers, ...squadPlayers];

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      purpose: 'staging-only — do not import into React until reviewed',
      dataAsOf: DATA_AS_OF,
      previewSeason: preview.meta?.season ?? null,
      schemaNote: 'MVP players match sampleData ids; squad rows use tm-{sourceId}',
      counts: {
        totalPlayers: allPlayers.length,
        mvpFeatured: mvpIds.size,
        mvpLinked: linkedPlayers.length,
        mvpManualOnly: manualOnlyPlayers.length,
        generatedNeedsEditorial: generatedNeedsEditorial.length,
        generatedEditorialApproved: generatedEditorialApproved.length,
        quizEligible: allPlayers.filter((p) => p.quizEligible === true).length,
      },
      linkedPlayers,
      manualOnlyPlayers,
      generatedNeedsEditorialPlayers: generatedNeedsEditorial,
      generatedEditorialApprovedPlayers: generatedEditorialApproved,
      warnings,
    },
    players: allPlayers,
  };

  const validationIssues = validateOutput(output);
  if (validationIssues.length) {
    console.error('Output validation failed:');
    validationIssues.forEach((i) => console.error(`  - ${i}`));
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  const publicDevPath = path.join(ROOT, 'public/dev-data/footybrain-app-ready-preview.json');
  fs.mkdirSync(path.dirname(publicDevPath), { recursive: true });
  fs.copyFileSync(OUTPUT_PATH, publicDevPath);

  const bytes = fs.statSync(OUTPUT_PATH).size;

  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Copied to ${publicDevPath}`);
  console.log(`Total players: ${output.meta.counts.totalPlayers}`);
  console.log(`MVP linked: ${output.meta.counts.mvpLinked}`);
  console.log(`MVP manual-only: ${output.meta.counts.mvpManualOnly}`);
  console.log(`Generated editorial approved: ${output.meta.counts.generatedEditorialApproved}`);
  console.log(`Generated needs editorial: ${output.meta.counts.generatedNeedsEditorial}`);
  console.log(`Quiz-eligible: ${output.meta.counts.quizEligible}`);
  console.log(`Warnings: ${warnings.length}`);
  if (warnings.length) warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  console.log(`File size: ${bytes} bytes (${Math.round(bytes / 1024)} KB)`);
}

main();
