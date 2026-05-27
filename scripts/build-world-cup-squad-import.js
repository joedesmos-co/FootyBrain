#!/usr/bin/env node
/**
 * Controlled World Cup squad import:
 * - Generate required-import sourceIds (browse-only) for selected WC nations
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

function titleCaseWords(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayNameFromClubHref(href) {
  if (!href) return null;
  const parts = String(href).split('/').filter(Boolean);
  if (!parts.length) return null;
  // e.g. /dundee-fc/startseite/verein/511 -> "dundee-fc"
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
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

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
  const maxDefault = manifest.defaultMaxPlayersPerNation ?? 12;
  const blockedSourceIds = new Set((manifest.blockedSourceIds ?? []).map(String));
  const byNation = new Map(nationTargets.map((n) => [n.nationalTeamId, n]));

  const sourceIds = new Set();
  const pickedByNation = new Map(nationTargets.map((n) => [n.nationalTeamId, 0]));

  const existingTeamIds = new Set(footyTeams.map((t) => t.id));
  const externalTeams = new Map(); // extId -> team
  const externalLeagueId = 'external';

  // Ensure external league exists in stubs output (merge script will append if absent).
  const externalLeague = {
    id: externalLeagueId,
    name: 'External clubs',
    country: 'World',
    description:
      'Placeholder league for imported squad players whose real clubs are not yet modeled as full FootyBrain teams.',
  };

  readNdjsonGz(playersPath, (p) => {
    if (p.parent?.type !== 'national_team') return;
    const nationId = p.parent?.code ? byNation.get(p.parent.code)?.nationalTeamId : null;
    // TM national team code does not equal FootyBrain id; we use country name matching instead.
    // For WC imports we key by p.parent.name which is the nation display name.
  });

  // Pass 1: build mapping from WC nation displayName -> nationalTeamId (manifest).
  const nationNameToId = new Map();
  for (const n of nationTargets) {
    nationNameToId.set(titleCaseWords(n.nationalTeamId), n.nationalTeamId);
  }
  // Hard aliases for known WC ids.
  nationNameToId.set('Cabo Verde', 'cape-verde');
  nationNameToId.set('IR Iran', 'iran');
  nationNameToId.set('South Africa', 'south-africa');
  nationNameToId.set('New Zealand', 'new-zealand');
  nationNameToId.set('Saudi Arabia', 'saudi-arabia');
  nationNameToId.set('Curaçao', 'curacao');

  // Pass 2: select players per nation.
  readNdjsonGz(playersPath, (p) => {
    if (p.parent?.type !== 'national_team') return;
    const nationName = titleCaseWords(p.parent?.name);
    const nationalTeamId = nationNameToId.get(nationName);
    if (!nationalTeamId) return;
    if (!pickedByNation.has(nationalTeamId)) return;

    const maxPlayers = byNation.get(nationalTeamId)?.maxPlayers ?? maxDefault;
    const picked = pickedByNation.get(nationalTeamId) ?? 0;
    if (picked >= maxPlayers) return;

    const sid = extractSourceId(p.href, 'spieler');
    if (!sid) return;
    if (blockedSourceIds.has(String(sid))) return;

    const tmClubId = extractTmClubId(p.current_club?.href);
    if (!tmClubId) return; // cannot represent club reliably

    const extTeamId = externalTeamIdFromTmClubId(tmClubId);
    if (!existingTeamIds.has(extTeamId)) {
      externalTeams.set(extTeamId, {
        id: extTeamId,
        name: displayNameFromClubHref(p.current_club?.href) ?? `TM Club ${tmClubId}`,
        country: null,
        leagueId: externalLeagueId,
        dataStatus: 'external-stub',
        tmClubId: String(tmClubId),
        tmHref: `https://www.transfermarkt.co.uk${p.current_club?.href ?? ''}`,
      });
    }

    sourceIds.add(String(sid));
    pickedByNation.set(nationalTeamId, picked + 1);
  });

  const requiredOut = {
    description:
      'Forced mini-import sourceIds (join-only; browse-only unless editorially approved).',
    sourceIds: [...sourceIds].sort(),
  };

  const externalOut = {
    description: 'External club stubs for browse-only imported players (no logos/crests).',
    leagues: footyLeagues.find((l) => l.id === externalLeagueId) ? [] : [externalLeague],
    teams: [...externalTeams.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };

  fs.writeFileSync(REQUIRED_OUT_PATH, `${JSON.stringify(requiredOut, null, 2)}\n`);
  fs.writeFileSync(EXTERNAL_STUBS_OUT_PATH, `${JSON.stringify(externalOut, null, 2)}\n`);

  console.log(`Wrote ${path.relative(ROOT, REQUIRED_OUT_PATH)} (${requiredOut.sourceIds.length} sourceId(s))`);
  console.log(`Wrote ${path.relative(ROOT, EXTERNAL_STUBS_OUT_PATH)} (${externalOut.teams.length} stub team(s))`);
  console.log('Picked per nation:', Object.fromEntries([...pickedByNation.entries()]));
}

main();

