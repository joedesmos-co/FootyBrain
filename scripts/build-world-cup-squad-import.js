#!/usr/bin/env node
/**
 * Broad World Cup national-pool import (browse-only):
 * - Generate required-import sourceIds for selected WC nations
 * - Generate external club stubs for clubs not modeled as FootyBrain teams yet
 *
 * Source:
 *   raw-data/transfermarkt-datasets/.../players.json.gz (season autodetected)
 *
 * Outputs:
 *   editorial-overlays/required-import-sourceIds.json
 *   editorial-overlays/external-club-stubs.json
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { teams as footyTeams, leagues as footyLeagues } from '../src/data/sampleData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRAPER_DIR = path.join(
  ROOT,
  'raw-data/transfermarkt-datasets/data/raw/transfermarkt-scraper',
);

const MANIFEST_PATH = path.join(ROOT, 'editorial-overlays/world-cup-squad-import.json');
const WC_QUALIFIED_PATH = path.join(ROOT, 'editorial-overlays/world-cup-2026-qualified-teams.json');
const REQUIRED_OUT_PATH = path.join(ROOT, 'editorial-overlays/required-import-sourceIds.json');
const EXTERNAL_STUBS_OUT_PATH = path.join(ROOT, 'editorial-overlays/external-club-stubs.json');

function latestSeasonDir() {
  if (!fs.existsSync(SCRAPER_DIR)) return null;
  const years = fs
    .readdirSync(SCRAPER_DIR)
    .filter((n) => /^\d{4}$/.test(n))
    .map(Number)
    .sort((a, b) => b - a);
  return years.length ? String(years[0]) : null;
}

function extractSourceId(href, segment = 'spieler') {
  if (!href) return null;
  const match = href.match(new RegExp(`/${segment}/(\\d+)`));
  return match ? match[1] : null;
}

function extractTmClubId(currentClubHref) {
  if (!currentClubHref) return null;
  const match = String(currentClubHref).match(/\/verein\/(\d+)/);
  return match ? match[1] : null;
}

function externalTeamIdFromTmClubId(tmClubId) {
  return `ext-tm-club-${tmClubId}`;
}

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function displayNameFromClubHref(href) {
  if (!href) return null;
  const parts = String(href).split('/').filter(Boolean);
  if (!parts.length) return null;
  const slug = parts[0];
  return slug
    .split('-')
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ')
    .trim();
}

function readNdjsonGz(filePath, onLine) {
  const raw = zlib.gunzipSync(fs.readFileSync(filePath)).toString('utf8');
  const lines = raw.split('\n');
  let count = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    count += 1;
    onLine(JSON.parse(line), count);
  }
  return count;
}

function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`Missing manifest: ${MANIFEST_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(WC_QUALIFIED_PATH)) {
    console.error(`Missing WC qualified manifest: ${WC_QUALIFIED_PATH}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const wcQualified = JSON.parse(fs.readFileSync(WC_QUALIFIED_PATH, 'utf8'));
  const wcMetaById = new Map((wcQualified.teams ?? []).map((t) => [t.id, t]));

  const season = latestSeasonDir();
  if (!season) {
    console.error('No transfermarkt-scraper season folder found.');
    process.exit(1);
  }
  const playersPath = path.join(SCRAPER_DIR, season, 'players.json.gz');
  if (!fs.existsSync(playersPath)) {
    console.error(`Missing raw file: ${playersPath}`);
    process.exit(1);
  }

  const nationTargets = manifest.nations ?? [];
  const emergencyMaxDefault = manifest.emergencyMaxPlayersPerNation ?? 250;
  const blockedSourceIds = new Set((manifest.blockedSourceIds ?? []).map(String));

  const sourceIds = new Set();
  const pickedByNation = new Map(nationTargets.map((n) => [n.nationalTeamId, 0]));
  const pickedMethodByNation = new Map(
    nationTargets.map((n) => [n.nationalTeamId, { nationalTeamParent: 0, clubParentFallback: 0 }]),
  );
  const emergencyHits = [];

  const existingTeamIds = new Set(footyTeams.map((t) => t.id));
  const externalTeams = new Map();
  const externalLeagueId = 'external';

  const externalLeague = {
    id: externalLeagueId,
    name: 'External clubs',
    country: 'World',
    description:
      'Placeholder league for imported national-pool players whose real clubs are not yet modeled as full FootyBrain teams.',
  };

  const nationNameToId = new Map();
  const nationLabelsById = new Map();
  for (const target of nationTargets) {
    const id = target.nationalTeamId;
    const meta = wcMetaById.get(id);
    const names = new Set();
    if (meta?.displayName) names.add(meta.displayName);
    for (const n of meta?.tmSearchNames ?? []) names.add(n);
    if (names.size === 0) names.add(id);
    nationLabelsById.set(
      id,
      new Set([...names].map((name) => normalizeKey(name)).filter(Boolean)),
    );
    for (const name of names) {
      nationNameToId.set(normalizeKey(name), id);
    }
  }

  function emergencyGuardForNation(nationalTeamId) {
    if (!pickedByNation.has(nationalTeamId)) return false;
    const maxPlayers =
      nationTargets.find((t) => t.nationalTeamId === nationalTeamId)?.emergencyMaxPlayers ??
      emergencyMaxDefault;
    const picked = pickedByNation.get(nationalTeamId) ?? 0;
    return picked < maxPlayers;
  }

  function ensureExternalStubTeam(tmClubId, currentClubHref) {
    const extTeamId = externalTeamIdFromTmClubId(tmClubId);
    if (existingTeamIds.has(extTeamId)) return;
    if (externalTeams.has(extTeamId)) return;
    externalTeams.set(extTeamId, {
      id: extTeamId,
      name: displayNameFromClubHref(currentClubHref) ?? `TM Club ${tmClubId}`,
      country: null,
      leagueId: externalLeagueId,
      dataStatus: 'external-stub',
      tmClubId: String(tmClubId),
      tmHref: `https://www.transfermarkt.co.uk${currentClubHref ?? ''}`,
    });
  }

  function tryPickPlayer(p, nationalTeamId, method) {
    if (!emergencyGuardForNation(nationalTeamId)) {
      if ((pickedByNation.get(nationalTeamId) ?? 0) >= emergencyMaxDefault) {
        if (!emergencyHits.includes(nationalTeamId)) emergencyHits.push(nationalTeamId);
      }
      return false;
    }

    const sid = extractSourceId(p.href, 'spieler');
    if (!sid) return false;
    if (blockedSourceIds.has(String(sid))) return false;
    if (sourceIds.has(String(sid))) return false;

    const tmClubId = extractTmClubId(p.current_club?.href);
    if (!tmClubId) return false;

    ensureExternalStubTeam(tmClubId, p.current_club?.href);

    const picked = pickedByNation.get(nationalTeamId) ?? 0;
    sourceIds.add(String(sid));
    pickedByNation.set(nationalTeamId, picked + 1);

    const meta = pickedMethodByNation.get(nationalTeamId) ?? {
      nationalTeamParent: 0,
      clubParentFallback: 0,
    };
    if (method === 'national_team_parent') meta.nationalTeamParent += 1;
    if (method === 'club_parent_fallback') meta.clubParentFallback += 1;
    pickedMethodByNation.set(nationalTeamId, meta);
    return true;
  }

  // Pass 1: TM national_team parent rows.
  readNdjsonGz(playersPath, (p) => {
    if (p.parent?.type !== 'national_team') return;
    const nationName = normalizeKey(p.parent?.name);
    const nationalTeamId = nationNameToId.get(nationName);
    if (!nationalTeamId) return;
    tryPickPlayer(p, nationalTeamId, 'national_team_parent');
  });

  // Pass 2: club-parent rows matched by national_team.country (augments pool).
  readNdjsonGz(playersPath, (p) => {
    if (p.parent?.type !== 'club') return;
    const natCountry = normalizeKey(p.national_team?.country);
    if (!natCountry) return;

    for (const [nationalTeamId, labels] of nationLabelsById.entries()) {
      if (!labels.has(natCountry)) continue;
      tryPickPlayer(p, nationalTeamId, 'club_parent_fallback');
    }
  });

  const requiredOut = {
    description:
      'Forced national-pool import sourceIds (browse-only unless editorially approved; not official WC rosters).',
    sourceIds: [...sourceIds].sort(),
  };

  const externalOut = {
    description: 'External club stubs for browse-only imported national-pool players (no logos/crests).',
    leagues: footyLeagues.find((l) => l.id === externalLeagueId) ? [] : [externalLeague],
    teams: [...externalTeams.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };

  fs.writeFileSync(REQUIRED_OUT_PATH, `${JSON.stringify(requiredOut, null, 2)}\n`);
  fs.writeFileSync(EXTERNAL_STUBS_OUT_PATH, `${JSON.stringify(externalOut, null, 2)}\n`);

  console.log(`Wrote ${path.relative(ROOT, REQUIRED_OUT_PATH)} (${requiredOut.sourceIds.length} sourceId(s))`);
  console.log(`Wrote ${path.relative(ROOT, EXTERNAL_STUBS_OUT_PATH)} (${externalOut.teams.length} stub team(s))`);
  console.log('Picked per nation:', Object.fromEntries([...pickedByNation.entries()]));
  console.log('Pick method per nation:', Object.fromEntries([...pickedMethodByNation.entries()]));
  if (emergencyHits.length) {
    console.warn('Emergency cap reached for:', emergencyHits.join(', '));
  }
}

main();
