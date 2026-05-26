#!/usr/bin/env node
/**
 * Validate editorial overlay files.
 * - players.manual.json vs sampleData + TM scraper preview
 * - players.generated-draft.json vs app-ready preview
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { players as samplePlayers } from '../src/data/sampleData.js';
import {
  collectForbiddenImageKeys,
  validatePlayerImageFields,
} from './player-image-rules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANUAL_OVERLAY_PATH = path.join(ROOT, 'editorial-overlays/players.manual.json');
const DRAFT_OVERLAY_PATH = path.join(ROOT, 'editorial-overlays/players.generated-draft.json');
const TM_PREVIEW_PATH = path.join(ROOT, 'generated-data/footybrain-preview-data.json');
const APP_READY_PATH = path.join(ROOT, 'generated-data/footybrain-app-ready-preview.json');

const MANUAL_REQUIRED_FIELDS = [
  'id',
  'displayName',
  'quickFact',
  'quizHints',
  'playingStyle',
  'importanceScore',
  'quizEligible',
  'rosterTier',
];

const DRAFT_REQUIRED_FIELDS = [
  ...MANUAL_REQUIRED_FIELDS,
  'sourceId',
  'reviewStatus',
];

const FORBIDDEN_KEYS = new Set(['image_url', 'marketValue', 'market_value', 'url']);

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
    err(`[${label}] File not found: ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    err(`[${label}] Invalid JSON: ${e.message}`);
    return null;
  }
}

function collectForbiddenKeys(obj, prefix = '') {
  const hits = [];
  if (!obj || typeof obj !== 'object') return hits;
  for (const [key, val] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (FORBIDDEN_KEYS.has(key)) hits.push(full);
    if (/href/i.test(key)) hits.push(full);
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      hits.push(...collectForbiddenKeys(val, full));
    }
  }
  return hits;
}

function findPreviewBySourceId(previewBySourceId, sourceId) {
  return previewBySourceId.get(String(sourceId)) ?? null;
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

function findPreviewByName(allPreviewPlayers, samplePlayer) {
  const last = stripAccents(samplePlayer.name.split(/\s+/).pop() ?? '');
  const team = samplePlayer.teamId;
  const onTeam = [];
  const elsewhere = [];

  for (const p of allPreviewPlayers) {
    const plast = stripAccents((p.lastName || '').trim());
    // Split the display name into whitespace-separated tokens for whole-word matching.
    // This avoids false positives like "sane" matching inside "Alassane" (Pléa at PSV).
    const pnameTokens = stripAccents((p.name || '').split(',')[0]).split(/\s+/);
    const hit =
      (plast && plast === last) ||
      (last.length > 3 && pnameTokens.some((tok) => tok === last)) ||
      matchMononym(samplePlayer.id, p);

    if (!hit) continue;
    if (p.footybrainTeamId === team) onTeam.push(p);
    else elsewhere.push(p);
  }

  return { onTeam, elsewhere };
}

function validateManualOverlay(overlay, tmPreview) {
  if (!overlay || typeof overlay !== 'object') return null;
  if (!Array.isArray(overlay.players)) {
    err('[manual] Root must contain a "players" array.');
    return null;
  }

  const sampleById = new Map(samplePlayers.map((p) => [p.id, p]));
  const mvpIds = overlay.players.map((p) => p?.id).filter(Boolean);
  const seen = new Set();

  for (const id of mvpIds) {
    if (seen.has(id)) err(`[manual] Duplicate overlay id: ${id}`);
    seen.add(id);
  }

  for (const entry of overlay.players) {
    if (!entry || typeof entry !== 'object') {
      err('[manual] Invalid overlay entry (not an object).');
      continue;
    }

    if (!sampleById.has(entry.id)) {
      err(`[manual] Overlay id not in sampleData.js: ${entry.id}`);
    }

    for (const field of MANUAL_REQUIRED_FIELDS) {
      if (!(field in entry)) {
        err(`[manual] Missing required field "${field}" on id: ${entry.id}`);
        continue;
      }
      const val = entry[field];
      if (val === null || val === undefined || val === '') {
        err(`[manual] Empty required field "${field}" on id: ${entry.id}`);
      }
    }

    for (const key of collectForbiddenKeys(entry)) {
      err(`[manual] Forbidden field "${key}" on id: ${entry.id}`);
    }

    for (const key of collectForbiddenImageKeys(entry)) {
      err(`[manual] Forbidden image field "${key}" on id: ${entry.id}`);
    }
    validatePlayerImageFields(entry, { err: (msg) => err(`[manual] ${msg}`), warn, id: entry.id });

    if (!String(entry.quickFact ?? '').trim()) {
      err(`[manual] quickFact must not be empty on id: ${entry.id}`);
    }

    if (!Array.isArray(entry.quizHints) || entry.quizHints.length < 3) {
      err(`[manual] quizHints must have at least 3 items on id: ${entry.id}`);
    } else if (entry.quizHints.some((h) => typeof h !== 'string' || !h.trim())) {
      err(`[manual] quizHints must be non-empty strings on id: ${entry.id}`);
    }

    if (typeof entry.importanceScore !== 'number' || entry.importanceScore < 1 || entry.importanceScore > 99) {
      err(`[manual] importanceScore must be a number 1–99 on id: ${entry.id}`);
    }

    if (entry.quizEligible !== true) {
      warn(`[manual] quizEligible is not true on id: ${entry.id} (expected MVP featured pool)`);
    }

    if (entry.rosterTier !== 'featured') {
      warn(`[manual] rosterTier is not "featured" on id: ${entry.id}`);
    }

    if (!('sourceId' in entry)) {
      err(`[manual] Missing sourceId key (use null) on id: ${entry.id}`);
    } else if (entry.sourceId !== null && typeof entry.sourceId !== 'string') {
      err(`[manual] sourceId must be string or null on id: ${entry.id}`);
    }
  }

  if (!tmPreview?.players) {
    warn('[manual] Skipping sourceId checks — TM preview unavailable.');
    return { sampleById, overlayPlayers: overlay.players, nullSourceIds: [] };
  }

  const previewBySourceId = new Map(tmPreview.players.map((p) => [String(p.sourceId), p]));
  const sourceIdToOverlayIds = new Map();
  const nullSourceIds = [];

  for (const entry of overlay.players) {
    if (entry.sourceId === null) {
      nullSourceIds.push(entry.id);
      continue;
    }

    const sid = String(entry.sourceId);
    if (!sourceIdToOverlayIds.has(sid)) sourceIdToOverlayIds.set(sid, []);
    sourceIdToOverlayIds.get(sid).push(entry.id);

    const tm = findPreviewBySourceId(previewBySourceId, sid);
    if (!tm) {
      err(`[manual] sourceId ${sid} (${entry.id}) not found in footybrain-preview-data.json`);
      continue;
    }

    const sample = sampleById.get(entry.id);
    if (sample && tm.footybrainTeamId !== sample.teamId) {
      err(
        `[manual] sourceId ${sid} (${entry.id}) maps to TM club ${tm.footybrainTeamId}, but sampleData teamId is ${sample.teamId}`,
      );
    }
  }

  for (const [sid, idsList] of sourceIdToOverlayIds) {
    if (idsList.length > 1) {
      err(`[manual] Duplicate sourceId ${sid} used by overlay ids: ${idsList.join(', ')}`);
    }
  }

  reportStaleRosters(overlay.players, sampleById, previewBySourceId, tmPreview.players, nullSourceIds);

  return { sampleById, overlayPlayers: overlay.players, nullSourceIds };
}

function reportStaleRosters(overlayPlayers, sampleById, previewBySourceId, allPreviewPlayers, nullSourceIds) {
  if (nullSourceIds.length) {
    console.log('--- [manual] sourceId null (report) ---');
    for (const id of nullSourceIds) console.log(`  - ${id}`);
    console.log(`Total: ${nullSourceIds.length}\n`);
  }

  const staleClubMismatch = [];
  const missingFromExpectedSquad = [];

  for (const entry of overlayPlayers) {
    const sample = sampleById.get(entry.id);
    if (!sample) continue;

    if (entry.sourceId) {
      const tm = findPreviewBySourceId(previewBySourceId, entry.sourceId);
      if (tm && tm.footybrainTeamId !== sample.teamId) {
        staleClubMismatch.push({
          id: entry.id,
          sampleTeamId: sample.teamId,
          tmTeamId: tm.footybrainTeamId,
        });
      }
      continue;
    }

    const { onTeam, elsewhere } = findPreviewByName(allPreviewPlayers, sample);

    if (onTeam.length === 0 && elsewhere.length === 0) {
      missingFromExpectedSquad.push({ id: entry.id, sampleTeamId: sample.teamId });
    } else if (onTeam.length === 0 && elsewhere.length > 0) {
      staleClubMismatch.push({
        id: entry.id,
        sampleTeamId: sample.teamId,
        tmTeamId: elsewhere[0].footybrainTeamId,
      });
    } else if (onTeam.length > 1) {
      warn(
        `[manual] Ambiguous TM name match on ${sample.teamId} for ${entry.id} (${onTeam.length} candidates)`,
      );
    }
  }

  if (staleClubMismatch.length) {
    console.log('--- [manual] Stale roster: TM 2025 club ≠ sampleData teamId ---');
    for (const row of staleClubMismatch) {
      console.log(`  - ${row.id}: sample=${row.sampleTeamId}, TM=${row.tmTeamId}`);
      warn(`[manual] Stale roster: ${row.id} — sampleData ${row.sampleTeamId}, TM 2025 ${row.tmTeamId}`);
    }
    console.log('');
  }

  if (missingFromExpectedSquad.length) {
    console.log('--- [manual] Missing from TM preview (expected squad) ---');
    for (const row of missingFromExpectedSquad) {
      console.log(`  - ${row.id} (${row.sampleTeamId})`);
      warn(`[manual] Missing from TM 2025 preview squad: ${row.id} (${row.sampleTeamId})`);
    }
    console.log('');
  }
}

function validateGeneratedDraft(draft, appReady) {
  if (!draft || typeof draft !== 'object') return;
  if (!Array.isArray(draft.players)) {
    err('[generated-draft] Root must contain a "players" array.');
    return;
  }

  if (!appReady?.players) {
    err('[generated-draft] Cannot validate — app-ready preview has no players array.');
    return;
  }

  const appReadyById = new Map(appReady.players.map((p) => [p.id, p]));
  const seenIds = new Set();
  const seenSourceIds = new Set();

  for (const entry of draft.players) {
    if (!entry || typeof entry !== 'object') {
      err('[generated-draft] Invalid entry (not an object).');
      continue;
    }

    const id = entry.id;
    if (!id) {
      err('[generated-draft] Entry missing id.');
      continue;
    }
    if (seenIds.has(id)) err(`[generated-draft] Duplicate id: ${id}`);
    seenIds.add(id);

    const previewPlayer = appReadyById.get(id);
    if (!previewPlayer) {
      err(`[generated-draft] id ${id} not found in footybrain-app-ready-preview.json`);
    } else if (
      previewPlayer.dataStatus !== 'generated-needs-editorial' &&
      previewPlayer.dataStatus !== 'generated-editorial-approved'
    ) {
      warn(
        `[generated-draft] id ${id} is dataStatus "${previewPlayer.dataStatus}" in app-ready preview (expected generated-needs-editorial or generated-editorial-approved)`,
      );
    }

    for (const field of DRAFT_REQUIRED_FIELDS) {
      if (!(field in entry)) {
        err(`[generated-draft] Missing required field "${field}" on id: ${id}`);
        continue;
      }
      if (entry[field] === null || entry[field] === undefined || entry[field] === '') {
        err(`[generated-draft] Empty required field "${field}" on id: ${id}`);
      }
    }

    for (const key of collectForbiddenKeys(entry)) {
      err(`[generated-draft] Forbidden field "${key}" on id: ${id}`);
    }

    for (const key of collectForbiddenImageKeys(entry)) {
      err(`[generated-draft] Forbidden image field "${key}" on id: ${id}`);
    }
    validatePlayerImageFields(entry, {
      err: (msg) => err(`[generated-draft] ${msg}`),
      warn,
      id,
    });

    if (!String(entry.quickFact ?? '').trim()) {
      err(`[generated-draft] quickFact must not be empty on id: ${id}`);
    }

    if (!Array.isArray(entry.quizHints) || entry.quizHints.length < 3) {
      err(`[generated-draft] quizHints must have at least 3 items on id: ${id}`);
    } else if (entry.quizHints.some((h) => typeof h !== 'string' || !h.trim())) {
      err(`[generated-draft] quizHints must be non-empty strings on id: ${id}`);
    }

    if (typeof entry.importanceScore !== 'number' || entry.importanceScore < 1 || entry.importanceScore > 99) {
      err(`[generated-draft] importanceScore must be a number 1–99 on id: ${id}`);
    }

    if (entry.quizEligible !== true) {
      err(`[generated-draft] quizEligible must be true on id: ${id}`);
    }

    if (entry.rosterTier !== 'featured') {
      err(`[generated-draft] rosterTier must be "featured" on id: ${id}`);
    }

    if (entry.reviewStatus !== 'approved') {
      err(`[generated-draft] reviewStatus must be "approved" on id: ${id}`);
    }

    const sid = String(entry.sourceId);
    if (seenSourceIds.has(sid)) {
      err(`[generated-draft] Duplicate sourceId ${sid} on id: ${id}`);
    }
    seenSourceIds.add(sid);

    if (previewPlayer) {
      if (String(previewPlayer.sourceId) !== sid) {
        err(
          `[generated-draft] sourceId mismatch on ${id}: overlay ${sid}, app-ready preview ${previewPlayer.sourceId}`,
        );
      }
      if (previewPlayer.id !== `tm-${sid}` && previewPlayer.id !== id) {
        warn(`[generated-draft] id ${id} does not follow tm-{sourceId} pattern (preview id: ${previewPlayer.id})`);
      }
    }
  }

  console.log(`--- [generated-draft] validated ${draft.players.length} player(s) ---\n`);
}

// --- main ---
console.log('Validating editorial overlays…\n');

const manual = loadJson(MANUAL_OVERLAY_PATH, 'manual');
const draft = loadJson(DRAFT_OVERLAY_PATH, 'generated-draft');
const tmPreview = loadJson(TM_PREVIEW_PATH, 'tm-preview');
const appReady = loadJson(APP_READY_PATH, 'app-ready');

if (manual) {
  console.log('--- players.manual.json ---');
  validateManualOverlay(manual, tmPreview);
  console.log('');
}

if (draft) {
  console.log('--- players.generated-draft.json ---');
  validateGeneratedDraft(draft, appReady);
}

if (warnings.length) {
  console.log(`--- Warnings (${warnings.length}) ---`);
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  console.log('');
}

if (errors.length) {
  console.log(`--- Errors (${errors.length}) ---`);
  errors.forEach((e) => console.log(`  ✖ ${e}`));
  console.log(`\nFAILED: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}

const manualCount = manual?.players?.length ?? 0;
const draftCount = draft?.players?.length ?? 0;
console.log(
  `PASSED: manual ${manualCount} players, generated-draft ${draftCount} players, ${warnings.length} warning(s).`,
);
process.exit(0);
