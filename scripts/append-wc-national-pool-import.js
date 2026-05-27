#!/usr/bin/env node
/**
 * Append browse-only national-pool imports for specific WC nations.
 * Merges into required-import-sourceIds.json and external-club-stubs.json (does not replace).
 *
 * Usage: node scripts/append-wc-national-pool-import.js cape-verde curacao
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { teams as footyTeams } from '../src/data/sampleData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const nationIds = process.argv.slice(2);
if (!nationIds.length) {
  console.error('Usage: node scripts/append-wc-national-pool-import.js <nationalTeamId> [...]');
  process.exit(1);
}

const SCRAPER_DIR = path.join(
  ROOT,
  'raw-data/transfermarkt-datasets/data/raw/transfermarkt-scraper',
);
const WC_QUALIFIED_PATH = path.join(ROOT, 'editorial-overlays/world-cup-2026-qualified-teams.json');
const REQUIRED_OUT_PATH = path.join(ROOT, 'editorial-overlays/required-import-sourceIds.json');
const EXTERNAL_STUBS_OUT_PATH = path.join(ROOT, 'editorial-overlays/external-club-stubs.json');
const EMERGENCY_MAX = 55;
const BLOCKED = new Set(['148455']);

function latestSeasonDir() {
  const years = fs
    .readdirSync(SCRAPER_DIR)
    .filter((n) => /^\d{4}$/.test(n))
    .map(Number)
    .sort((a, b) => b - a);
  return years.length ? String(years[0]) : null;
}

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function extractSourceId(href) {
  const match = String(href ?? '').match(/\/spieler\/(\d+)/);
  return match ? match[1] : null;
}

function extractTmClubId(href) {
  const match = String(href ?? '').match(/\/verein\/(\d+)/);
  return match ? match[1] : null;
}

function externalTeamIdFromTmClubId(tmClubId) {
  return `ext-tm-club-${tmClubId}`;
}

function displayNameFromClubHref(href) {
  const parts = String(href ?? '').split('/').filter(Boolean);
  if (!parts.length) return null;
  return parts[0]
    .split('-')
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ');
}

function readNdjsonGz(filePath, onLine) {
  const raw = zlib.gunzipSync(fs.readFileSync(filePath)).toString('utf8');
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    onLine(JSON.parse(line));
  }
}

function main() {
  const wcQualified = JSON.parse(fs.readFileSync(WC_QUALIFIED_PATH, 'utf8'));
  const wcMetaById = new Map((wcQualified.teams ?? []).map((t) => [t.id, t]));

  const existingRequired = new Set(
    JSON.parse(fs.readFileSync(REQUIRED_OUT_PATH, 'utf8')).sourceIds?.map(String) ?? [],
  );
  const externalFile = JSON.parse(fs.readFileSync(EXTERNAL_STUBS_OUT_PATH, 'utf8'));
  const externalTeams = new Map((externalFile.teams ?? []).map((t) => [t.id, t]));
  const existingTeamIds = new Set(footyTeams.map((t) => t.id));

  const nationLabelsById = new Map();
  const nationNameToId = new Map();
  const pickedByNation = new Map(nationIds.map((id) => [id, 0]));

  for (const id of nationIds) {
    const meta = wcMetaById.get(id);
    const names = new Set([meta?.displayName, ...(meta?.tmSearchNames ?? [])].filter(Boolean));
    nationLabelsById.set(id, new Set([...names].map(normalizeKey)));
    for (const name of names) nationNameToId.set(normalizeKey(name), id);
  }

  const newSourceIds = new Set();

  function tryPick(p, nationalTeamId) {
    if ((pickedByNation.get(nationalTeamId) ?? 0) >= EMERGENCY_MAX) return false;
    const sid = extractSourceId(p.href);
    if (!sid || BLOCKED.has(sid)) return false;
    if (existingRequired.has(sid) || newSourceIds.has(sid)) return false;
    const tmClubId = extractTmClubId(p.current_club?.href);
    if (!tmClubId) return false;

    const extId = externalTeamIdFromTmClubId(tmClubId);
    if (!existingTeamIds.has(extId) && !externalTeams.has(extId)) {
      externalTeams.set(extId, {
        id: extId,
        name: displayNameFromClubHref(p.current_club?.href) ?? `TM Club ${tmClubId}`,
        country: null,
        leagueId: 'external',
        dataStatus: 'external-stub',
        tmClubId: String(tmClubId),
      });
    }

    newSourceIds.add(sid);
    pickedByNation.set(nationalTeamId, (pickedByNation.get(nationalTeamId) ?? 0) + 1);
    return true;
  }

  const season = latestSeasonDir();
  const playersPath = path.join(SCRAPER_DIR, season, 'players.json.gz');

  readNdjsonGz(playersPath, (p) => {
    if (p.parent?.type === 'national_team') {
      const ntId = nationNameToId.get(normalizeKey(p.parent?.name));
      if (ntId) tryPick(p, ntId);
      return;
    }
    if (p.parent?.type === 'club') {
      const nat = normalizeKey(p.national_team?.country);
      if (!nat) return;
      for (const [ntId, labels] of nationLabelsById.entries()) {
        if (labels.has(nat)) tryPick(p, ntId);
      }
    }
  });

  const mergedIds = [...new Set([...existingRequired, ...newSourceIds])].sort();
  fs.writeFileSync(
    REQUIRED_OUT_PATH,
    `${JSON.stringify(
      {
        description:
          'Forced national-pool import sourceIds (browse-only unless editorially approved; not official WC rosters).',
        sourceIds: mergedIds,
      },
      null,
      2,
    )}\n`,
  );

  fs.writeFileSync(
    EXTERNAL_STUBS_OUT_PATH,
    `${JSON.stringify(
      {
        ...externalFile,
        teams: [...externalTeams.values()].sort((a, b) => a.name.localeCompare(b.name)),
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Appended ${newSourceIds.size} sourceId(s) for: ${nationIds.join(', ')}`);
  console.log('Picked per nation:', Object.fromEntries(pickedByNation));
  console.log(`required-import total: ${mergedIds.length}`);
  console.log(`external stub teams: ${externalTeams.size}`);
}

main();
