#!/usr/bin/env node
/**
 * Validate editorial-overlays/players.manual.json against sampleData and TM preview.
 * Does not modify any data files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { players as samplePlayers } from '../src/data/sampleData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OVERLAY_PATH = path.join(ROOT, 'editorial-overlays/players.manual.json');
const PREVIEW_PATH = path.join(ROOT, 'generated-data/footybrain-preview-data.json');

const REQUIRED_FIELDS = [
  'id',
  'displayName',
  'quickFact',
  'quizHints',
  'playingStyle',
  'importanceScore',
  'quizEligible',
  'rosterTier',
];

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function stripAccents(s) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function loadJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    err(`${label} not found: ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    err(`${label} is not valid JSON: ${e.message}`);
    return null;
  }
}

function findPreviewBySourceId(previewById, sourceId) {
  return previewById.get(String(sourceId)) ?? null;
}

/** Best-effort locate player anywhere in preview by sample display name */
function findPreviewByName(allPreviewPlayers, samplePlayer) {
  const last = stripAccents(samplePlayer.name.split(/\s+/).pop() ?? '');
  const team = samplePlayer.teamId;
  const onTeam = [];
  const elsewhere = [];

  for (const p of allPreviewPlayers) {
    const plast = stripAccents((p.lastName || '').trim());
    const pname = stripAccents((p.name || '').split(',')[0]);
    const hit =
      (plast && plast === last) ||
      (last.length > 3 && pname.includes(last)) ||
      matchMononym(samplePlayer.id, p);

    if (!hit) continue;
    if (p.footybrainTeamId === team) onTeam.push(p);
    else elsewhere.push(p);
  }

  return { onTeam, elsewhere };
}

function matchMononym(sampleId, previewPlayer) {
  const pname = stripAccents((previewPlayer.name || '').split(',')[0]);
  const plast = stripAccents(previewPlayer.lastName || '');
  switch (sampleId) {
    case 'rodri':
      return pname.trim() === 'rodri';
    case 'pedri':
      return pname.includes('pedri');
    case 'gavi':
      return pname.includes('gavi') || pname.includes('pablo martin');
    case 'alisson':
      return pname.includes('alisson') || plast === 'becker';
    case 'raphinha':
      return pname.includes('raphinha');
    case 'vinicius':
      return pname.includes('vinicius') || plast.includes('junior');
    case 'odegaard':
      return plast.includes('odegaard') || pname.includes('odegaard');
    case 'de-bruyne':
      return plast.includes('bruyne');
    case 'van-dijk':
      return plast.includes('dijk');
    case 'ter-stegen':
      return plast.includes('stegen') || pname.includes('stegen');
    case 'trent':
      return plast.includes('alexander-arnold') || pname.includes('alexander-arnold');
    case 'lautaro':
      return plast.includes('martinez') && pname.includes('lautaro');
    case 'ederson':
      return pname.includes('ederson') || plast.includes('moraes');
    default:
      return false;
  }
}

function validateOverlayShape(overlay) {
  if (!overlay || typeof overlay !== 'object') return;
  if (!Array.isArray(overlay.players)) {
    err('Overlay root must contain a "players" array.');
    return;
  }

  const sampleById = new Map(samplePlayers.map((p) => [p.id, p]));
  const mvpIds = [...sampleById.keys()];
  const overlayIds = overlay.players.map((p) => p?.id);

  // Duplicate overlay ids
  const seen = new Set();
  for (const id of overlayIds) {
    if (!id) {
      err('Overlay entry missing id.');
      continue;
    }
    if (seen.has(id)) err(`Duplicate overlay id: ${id}`);
    seen.add(id);
  }

  // MVP coverage
  for (const id of mvpIds) {
    if (!seen.has(id)) err(`Missing overlay for MVP player id: ${id}`);
  }

  for (const entry of overlay.players) {
    if (!entry || typeof entry !== 'object') {
      err('Invalid overlay entry (not an object).');
      continue;
    }

    if (!sampleById.has(entry.id)) {
      err(`Overlay id not in sampleData.js: ${entry.id}`);
    }

    for (const field of REQUIRED_FIELDS) {
      if (!(field in entry)) {
        err(`Missing required field "${field}" on overlay id: ${entry.id}`);
        continue;
      }
      const val = entry[field];
      if (val === null || val === undefined || val === '') {
        err(`Empty required field "${field}" on overlay id: ${entry.id}`);
      }
    }

    if (!Array.isArray(entry.quizHints) || entry.quizHints.length === 0) {
      err(`quizHints must be a non-empty array on id: ${entry.id}`);
    } else if (entry.quizHints.some((h) => typeof h !== 'string' || !h.trim())) {
      err(`quizHints must be non-empty strings on id: ${entry.id}`);
    }

    if (typeof entry.importanceScore !== 'number' || entry.importanceScore < 1 || entry.importanceScore > 99) {
      err(`importanceScore must be a number 1–99 on id: ${entry.id}`);
    }

    if (entry.quizEligible !== true) {
      warn(`quizEligible is not true on id: ${entry.id} (expected MVP featured pool)`);
    }

    if (entry.rosterTier !== 'featured') {
      warn(`rosterTier is not "featured" on id: ${entry.id}`);
    }

    if ('sourceId' in entry === false) {
      err(`Missing sourceId key (use null) on id: ${entry.id}`);
    } else if (entry.sourceId !== null && typeof entry.sourceId !== 'string') {
      err(`sourceId must be string or null on id: ${entry.id}`);
    }
  }

  return { sampleById, overlayPlayers: overlay.players };
}

function validateSourceIds(overlayPlayers, sampleById, preview) {
  if (!preview?.players) {
    err('Preview file has no players array.');
    return;
  }

  const previewById = new Map(preview.players.map((p) => [String(p.sourceId), p]));
  const sourceIdToOverlayIds = new Map();
  const nullSourceIds = [];

  for (const entry of overlayPlayers) {
    if (entry.sourceId === null) {
      nullSourceIds.push(entry.id);
      continue;
    }

    const sid = String(entry.sourceId);
    if (!sourceIdToOverlayIds.has(sid)) sourceIdToOverlayIds.set(sid, []);
    sourceIdToOverlayIds.get(sid).push(entry.id);

    const tm = findPreviewBySourceId(previewById, sid);
    if (!tm) {
      err(`sourceId ${sid} (${entry.id}) not found in footybrain-preview-data.json`);
      continue;
    }

    const sample = sampleById.get(entry.id);
    if (sample && tm.footybrainTeamId !== sample.teamId) {
      err(
        `sourceId ${sid} (${entry.id}) maps to TM club ${tm.footybrainTeamId}, but sampleData teamId is ${sample.teamId}`,
      );
    }
  }

  for (const [sid, ids] of sourceIdToOverlayIds) {
    if (ids.length > 1) {
      err(`Duplicate sourceId ${sid} used by overlay ids: ${ids.join(', ')}`);
    }
  }

  return { nullSourceIds, previewById, allPreviewPlayers: preview.players };
}

function reportStaleRosters(overlayPlayers, sampleById, previewById, allPreviewPlayers) {
  const staleClubMismatch = [];
  const missingFromExpectedSquad = [];

  for (const entry of overlayPlayers) {
    const sample = sampleById.get(entry.id);
    if (!sample) continue;

    if (entry.sourceId) {
      const tm = findPreviewBySourceId(previewById, entry.sourceId);
      if (tm && tm.footybrainTeamId !== sample.teamId) {
        staleClubMismatch.push({
          id: entry.id,
          sampleTeamId: sample.teamId,
          tmTeamId: tm.footybrainTeamId,
          sourceId: entry.sourceId,
          tmName: tm.name,
        });
      }
      continue;
    }

    const { onTeam, elsewhere } = findPreviewByName(allPreviewPlayers, sample);

    if (onTeam.length === 0 && elsewhere.length === 0) {
      missingFromExpectedSquad.push({
        id: entry.id,
        displayName: entry.displayName,
        sampleTeamId: sample.teamId,
        note: 'Not found on expected club squad or elsewhere in TM 2025 preview',
      });
      continue;
    }

    if (onTeam.length === 0 && elsewhere.length > 0) {
      const tm = elsewhere[0];
      staleClubMismatch.push({
        id: entry.id,
        sampleTeamId: sample.teamId,
        tmTeamId: tm.footybrainTeamId,
        sourceId: tm.sourceId,
        tmName: tm.name,
        overlaySourceId: null,
      });
    } else if (onTeam.length > 1) {
      warn(
        `Ambiguous TM name match on ${sample.teamId} for ${entry.id} (${onTeam.length} candidates); stale check skipped`,
      );
    }
  }

  return { staleClubMismatch, missingFromExpectedSquad };
}

// --- main ---
console.log('Validating editorial overlays…\n');

const overlay = loadJson(OVERLAY_PATH, 'Overlay');
const preview = loadJson(PREVIEW_PATH, 'Preview');

const ctx = overlay ? validateOverlayShape(overlay) : null;

let nullSourceIds = [];
if (ctx && preview) {
  const src = validateSourceIds(ctx.overlayPlayers, ctx.sampleById, preview);
  nullSourceIds = src.nullSourceIds;
  const stale = reportStaleRosters(
    ctx.overlayPlayers,
    ctx.sampleById,
    src.previewById,
    src.allPreviewPlayers,
  );

  if (nullSourceIds.length) {
    console.log('--- sourceId null (report) ---');
    for (const id of nullSourceIds) console.log(`  - ${id}`);
    console.log(`Total: ${nullSourceIds.length}\n`);
  }

  if (stale.staleClubMismatch.length) {
    console.log('--- Stale roster: TM 2025 club ≠ sampleData teamId ---');
    for (const row of stale.staleClubMismatch) {
      console.log(
        `  - ${row.id}: sample=${row.sampleTeamId}, TM=${row.tmTeamId}, sourceId=${row.sourceId ?? row.overlaySourceId ?? 'n/a'} (${row.tmName?.slice(0, 50)})`,
      );
    }
    console.log(`Total: ${stale.staleClubMismatch.length}\n`);
    for (const row of stale.staleClubMismatch) {
      warn(
        `Stale roster: ${row.id} — sampleData ${row.sampleTeamId}, TM 2025 ${row.tmTeamId}`,
      );
    }
  }

  if (stale.missingFromExpectedSquad.length) {
    console.log('--- Missing from TM preview (expected squad) ---');
    for (const row of stale.missingFromExpectedSquad) {
      console.log(`  - ${row.id} (${row.displayName}) — ${row.sampleTeamId}: ${row.note}`);
    }
    console.log(`Total: ${stale.missingFromExpectedSquad.length}\n`);
    for (const row of stale.missingFromExpectedSquad) {
      warn(`Missing from TM 2025 preview squad: ${row.id} (${row.sampleTeamId})`);
    }
  }
} else if (!preview) {
  warn('Skipping sourceId / roster checks — preview file unavailable.');
}

if (warnings.length) {
  console.log('--- Warnings ---');
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  console.log('');
}

if (errors.length) {
  console.log('--- Errors ---');
  errors.forEach((e) => console.log(`  ✖ ${e}`));
  console.log(`\nFAILED: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}

const playerCount = overlay?.players?.length ?? 0;
console.log(
  `PASSED: ${playerCount} overlay players, ${samplePlayers.length} MVP ids, ${warnings.length} warning(s).`,
);
process.exit(0);
