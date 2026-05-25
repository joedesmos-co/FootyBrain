#!/usr/bin/env node
/**
 * Validate generated-data/footybrain-app-ready-preview.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { leagues, teams } from '../src/data/sampleData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PREVIEW_PATH = path.join(ROOT, 'generated-data/footybrain-app-ready-preview.json');

const KNOWN_TEAM_IDS = new Set(teams.map((t) => t.id));
const KNOWN_LEAGUE_IDS = new Set(leagues.map((l) => l.id));

const REQUIRED_PLAYER_KEYS = [
  'id',
  'teamId',
  'leagueId',
  'position',
  'nationality',
  'dateOfBirth',
  'dataStatus',
  'quizEligible',
  'rosterTier',
];

const FORBIDDEN_KEYS = new Set(['image_url', 'marketValue', 'market_value', 'url']);
const EDITORIAL_FIELDS = ['quickFact', 'quizHints', 'playingStyle', 'importanceScore'];
const QUIZ_READY_FIELDS = ['quickFact', 'quizHints', 'playingStyle', 'importanceScore'];

const errors = [];
const warnings = [];
const duplicateNameRisks = { displayNames: [], lastNamesPerTeam: [] };

function err(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function getDisplayName(player) {
  return player.displayName ?? player.name ?? null;
}

function lastNameFromDisplay(displayName) {
  const parts = displayName.trim().split(/\s+/);
  return parts[parts.length - 1]?.toLowerCase() ?? '';
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

function isEmptyEditorial(value, field) {
  if (field === 'quizHints') return !Array.isArray(value) || value.length === 0;
  if (field === 'importanceScore') return value === null || value === undefined;
  return value === null || value === undefined || String(value).trim() === '';
}

function hasQuizReadyContent(player) {
  const hints = player.quizHints;
  const hasHints = Array.isArray(hints) && hints.length > 0;
  const hasScore =
    player.importanceScore !== null &&
    player.importanceScore !== undefined &&
    player.importanceScore !== '';
  const hasFact = String(player.quickFact ?? '').trim() !== '';
  const hasStyle = String(player.playingStyle ?? '').trim() !== '';
  return hasHints || hasScore || hasFact || hasStyle;
}

function main() {
  console.log('Validating app-ready preview…\n');

  if (!fs.existsSync(PREVIEW_PATH)) {
    err(`File not found: ${PREVIEW_PATH}`);
    printSummary();
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(PREVIEW_PATH, 'utf8'));
  } catch (e) {
    err(`Invalid JSON: ${e.message}`);
    printSummary();
    process.exit(1);
  }

  const players = data.players;
  const meta = data.meta ?? {};

  if (!Array.isArray(players)) {
    err('Root "players" must be an array.');
    printSummary();
    process.exit(1);
  }

  // Meta counts
  const featured = players.filter((p) => p.rosterTier === 'featured');
  const linked = players.filter((p) => p.dataStatus === 'mvp-linked');
  const manualOnly = players.filter((p) => p.dataStatus === 'manual-only');
  const needsEditorial = players.filter((p) => p.dataStatus === 'generated-needs-editorial');

  const actual = {
    totalPlayers: players.length,
    mvpFeatured: featured.length,
    mvpLinked: linked.length,
    mvpManualOnly: manualOnly.length,
    generatedNeedsEditorial: needsEditorial.length,
  };

  if (meta.counts) {
    for (const [key, expected] of Object.entries(meta.counts)) {
      if (actual[key] !== undefined && actual[key] !== expected) {
        err(`meta.counts.${key} is ${expected} but actual is ${actual[key]}`);
      }
    }
  } else {
    err('meta.counts is missing');
  }

  if (Array.isArray(meta.linkedPlayers) && meta.linkedPlayers.length !== actual.mvpLinked) {
    err(`meta.linkedPlayers length ${meta.linkedPlayers.length} !== mvpLinked ${actual.mvpLinked}`);
  }
  if (Array.isArray(meta.manualOnlyPlayers) && meta.manualOnlyPlayers.length !== actual.mvpManualOnly) {
    err(
      `meta.manualOnlyPlayers length ${meta.manualOnlyPlayers.length} !== mvpManualOnly ${actual.mvpManualOnly}`,
    );
  }
  if (
    Array.isArray(meta.generatedNeedsEditorialPlayers) &&
    meta.generatedNeedsEditorialPlayers.length !== actual.generatedNeedsEditorial
  ) {
    err(
      `meta.generatedNeedsEditorialPlayers length ${meta.generatedNeedsEditorialPlayers.length} !== generatedNeedsEditorial ${actual.generatedNeedsEditorial}`,
    );
  }

  const ids = new Set();
  const sourceIds = new Map();

  const displayByTeam = new Map();
  const lastByTeam = new Map();
  let usesNameNotDisplayName = 0;

  for (const player of players) {
    const id = player.id;

    if (!id) err('Player missing id');
    else if (ids.has(id)) err(`Duplicate id: ${id}`);
    else ids.add(id);

    for (const key of REQUIRED_PLAYER_KEYS) {
      if (!(key in player)) err(`Missing required key "${key}" on player ${id ?? '(unknown)'}`);
    }

    const displayName = getDisplayName(player);
    if (!displayName || !String(displayName).trim()) {
      err(`Missing displayName/name on player ${id}`);
    } else if (!player.displayName && player.name) {
      usesNameNotDisplayName += 1;
    }

    if (player.dateOfBirth === null || player.dateOfBirth === undefined || player.dateOfBirth === '') {
      if (player.dataStatus === 'manual-only') {
        warn(`dateOfBirth null on manual-only MVP ${id}`);
      } else {
        err(`Missing dateOfBirth value on player ${id} (${player.dataStatus})`);
      }
    }

    if (player.position === null || player.position === undefined || String(player.position).trim() === '') {
      err(`Missing position on player ${id}`);
    }

    if (!player.nationality || !String(player.nationality).trim()) {
      err(`Missing nationality on player ${id}`);
    }

    if (!KNOWN_TEAM_IDS.has(player.teamId)) {
      err(`Unknown teamId "${player.teamId}" on player ${id}`);
    }

    if (!KNOWN_LEAGUE_IDS.has(player.leagueId)) {
      err(`Unknown leagueId "${player.leagueId}" on player ${id}`);
    }

    const forbidden = collectForbiddenKeys(player);
    for (const key of forbidden) {
      err(`Forbidden field "${key}" on player ${id}`);
    }

    if (player.rosterTier === 'featured') {
      for (const field of EDITORIAL_FIELDS) {
        if (isEmptyEditorial(player[field], field)) {
          err(`MVP featured player ${id} missing editorial field: ${field}`);
        }
      }
      if (!Array.isArray(player.quizHints) || player.quizHints.some((h) => typeof h !== 'string' || !h.trim())) {
        err(`MVP featured player ${id} has invalid quizHints`);
      }
      if (typeof player.importanceScore !== 'number' || player.importanceScore < 1 || player.importanceScore > 99) {
        err(`MVP featured player ${id} has invalid importanceScore`);
      }
    }

    if (player.dataStatus === 'generated-needs-editorial') {
      if (player.quizEligible !== false) {
        err(`generated-needs-editorial player ${id} must have quizEligible: false`);
      }
      if (hasQuizReadyContent(player)) {
        err(
          `generated-needs-editorial player ${id} must not have quiz-ready editorial content (quickFact, quizHints, playingStyle, importanceScore)`,
        );
      }
      for (const field of EDITORIAL_FIELDS) {
        if (!isEmptyEditorial(player[field], field)) {
          warn(`generated-needs-editorial player ${id} has non-empty ${field} (unexpected)`);
        }
      }
    }

    if (player.sourceId != null && player.sourceId !== '') {
      const sid = String(player.sourceId);
      if (!sourceIds.has(sid)) sourceIds.set(sid, []);
      sourceIds.get(sid).push(id);
    }

    if (displayName && player.teamId) {
      const dnKey = `${player.teamId}::${displayName.toLowerCase()}`;
      if (!displayByTeam.has(dnKey)) displayByTeam.set(dnKey, []);
      displayByTeam.get(dnKey).push(id);

      const ln = lastNameFromDisplay(displayName);
      const lnKey = `${player.teamId}::${ln}`;
      if (!lastByTeam.has(lnKey)) lastByTeam.set(lnKey, []);
      lastByTeam.get(lnKey).push({ id, displayName });
    }
  }

  for (const [sid, idsList] of sourceIds) {
    if (idsList.length > 1) err(`Duplicate sourceId ${sid}: ${idsList.join(', ')}`);
  }

  if (usesNameNotDisplayName > 0) {
    warn(
      `${usesNameNotDisplayName} player(s) use "name" instead of "displayName" (current merge schema; OK for dev preview)`,
    );
  }

  if (needsEditorial.length > 0) {
    const missingEditorialCount = needsEditorial.filter((p) =>
      EDITORIAL_FIELDS.some((field) => isEmptyEditorial(p[field], field)),
    ).length;
    if (missingEditorialCount > 0) {
      warn(
        `${missingEditorialCount} generated-needs-editorial player(s) missing one or more editorial fields (expected until overlay pass)`,
      );
    }
  }

  for (const [key, idList] of displayByTeam) {
    if (idList.length > 1) {
      duplicateNameRisks.displayNames.push({ key, ids: idList });
      warn(`Duplicate display name on same team: ${key} → ${idList.join(', ')}`);
    }
  }

  for (const [key, entries] of lastByTeam) {
    if (entries.length > 1) {
      duplicateNameRisks.lastNamesPerTeam.push({
        key,
        players: entries,
      });
      warn(
        `Duplicate last name on same team: ${key} → ${entries.map((e) => e.id).join(', ')}`,
      );
    }
  }

  printSummary();
  assessDevPreview();

  process.exit(errors.length > 0 ? 1 : 0);
}

function printSummary() {
  if (duplicateNameRisks.displayNames.length) {
    console.log('--- Duplicate display name risks (same team) ---');
    for (const row of duplicateNameRisks.displayNames) {
      console.log(`  ${row.key}: ${row.ids.join(', ')}`);
    }
    console.log('');
  }

  if (duplicateNameRisks.lastNamesPerTeam.length) {
    console.log('--- Duplicate last name risks (same team) ---');
    for (const row of duplicateNameRisks.lastNamesPerTeam) {
      console.log(
        `  ${row.key}: ${row.players.map((p) => `${p.id} (${p.displayName})`).join('; ')}`,
      );
    }
    console.log('');
  }

  if (warnings.length) {
    console.log(`--- Warnings (${warnings.length}) ---`);
    const preview = warnings.slice(0, 15);
    preview.forEach((w) => console.log(`  ⚠ ${w}`));
    if (warnings.length > 15) console.log(`  … and ${warnings.length - 15} more`);
    console.log('');
  }

  if (errors.length) {
    console.log(`--- Errors (${errors.length}) ---`);
    errors.forEach((e) => console.log(`  ✖ ${e}`));
    console.log('');
    console.log('FAILED validation.');
  } else {
    console.log(`PASSED validation with ${warnings.length} warning(s).`);
  }
}

function assessDevPreview() {
  console.log('--- Dev preview page safety ---');
  if (errors.length) {
    console.log('  Not safe: fix errors before any dev preview route.');
    return;
  }
  const editorialWarns = warnings.filter((w) => w.includes('missing editorial'));
  const nameWarns = warnings.filter(
    (w) => w.includes('Duplicate display') || w.includes('Duplicate last name'),
  );
  if (nameWarns.length) {
    console.log('  Caution: use full-name quiz matching or MVP-only filter on dev preview.');
  }
  if (editorialWarns.length) {
    console.log(
      `  OK for browse-only dev preview (${editorialWarns.length} squad rows lack editorial by design).`,
    );
  }
  console.log(
    '  Safe for hidden dev preview if scoped to rosterTier "featured" or quizEligible true only (36 MVP).',
  );
  console.log('  Do not expose full 213-player quiz pool without editorial pass.\n');
}

main();
