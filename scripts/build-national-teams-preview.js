#!/usr/bin/env node
/**
 * Build national-team preview from Transfermarkt raw data.
 * Does NOT modify sampleData.js, overlays, or React.
 *
 * Source:
 *   raw-data/transfermarkt-datasets/data/raw/transfermarkt-scraper/{season}/national_teams.json.gz
 *   raw-data/transfermarkt-datasets/data/raw/transfermarkt-scraper/{season}/players.json.gz
 * Club registry (read-only, join-only):
 *   src/data/sampleData.js — existing player IDs (no new players)
 *
 * Output: generated-data/national-teams-preview.json
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { players as clubPlayers } from '../src/data/sampleData.js';
import {
  PRIORITY_NATIONAL_TEAMS,
  PRIORITY_TM_CODES,
  WAVE_1_NATIONAL_TEAM_IDS,
  WAVE_2_NATIONAL_TEAM_IDS,
  WAVE_3_NATIONAL_TEAM_IDS,
} from './lib/national-team-expansion-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRAPER_DIR = path.join(
  ROOT,
  'raw-data/transfermarkt-datasets/data/raw/transfermarkt-scraper',
);
const OUTPUT_PATH = path.join(ROOT, 'generated-data/national-teams-preview.json');

const PRIORITY_CODES = PRIORITY_TM_CODES;

function extractSourceId(href, segment = 'spieler') {
  if (!href) return null;
  const match = href.match(new RegExp(`/${segment}/(\\d+)`));
  return match ? match[1] : null;
}

function extractNationalTeamId(href) {
  if (!href) return null;
  const match = href.match(/\/([^/]+)\/startseite\/verein\/(\d+)/);
  return match ? { code: match[1], tmTeamId: match[2] } : null;
}

function normalizeConfederation(value) {
  if (!value) return null;
  if (value === 'South American Football Confederation') return 'CONMEBOL';
  return value;
}

function displayNameFromPlayer(p) {
  const full = [p.name, p.last_name].filter(Boolean).join(' ').trim();
  return p.full_name || full || null;
}

function latestSeasonDir() {
  if (!fs.existsSync(SCRAPER_DIR)) return null;
  const years = fs
    .readdirSync(SCRAPER_DIR)
    .filter((n) => /^\d{4}$/.test(n))
    .map(Number)
    .sort((a, b) => b - a);
  return years.length ? String(years[0]) : null;
}

async function readNdjsonGz(filePath, onLine) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing raw file: ${path.relative(ROOT, filePath)}`);
  }
  return new Promise((resolve, reject) => {
    let count = 0;
    const stream = fs.createReadStream(filePath).pipe(zlib.createGunzip()).setEncoding('utf8');
    let leftover = '';
    stream.on('data', (chunk) => {
      leftover += chunk;
      const parts = leftover.split('\n');
      leftover = parts.pop() ?? '';
      for (const line of parts) {
        if (!line.trim()) continue;
        count += 1;
        onLine(JSON.parse(line), count);
      }
    });
    stream.on('end', () => {
      if (leftover.trim()) {
        count += 1;
        onLine(JSON.parse(leftover), count);
      }
      resolve(count);
    });
    stream.on('error', reject);
  });
}

function loadClubRegistry() {
  const bySourceId = new Map();
  const byPlayerId = new Map();
  for (const p of clubPlayers) {
    byPlayerId.set(p.id, p);
    if (p.sourceId) {
      bySourceId.set(String(p.sourceId), p);
    }
    if (String(p.id).startsWith('tm-')) {
      const fromId = p.id.slice(3);
      if (fromId && !bySourceId.has(fromId)) {
        bySourceId.set(fromId, p);
      }
    }
  }
  return { bySourceId, byPlayerId, meta: { source: 'sampleData.js', playerCount: clubPlayers.length } };
}

function inspectRawNationalTeams(rowsByCode) {
  const warnings = [];
  const missingFields = { teams: [], fields: {} };
  let passed = true;

  for (const priority of PRIORITY_NATIONAL_TEAMS) {
    if (priority.tmMissing || !priority.tmCode) {
      warnings.push(
        `${priority.id}: no TM national_teams.json entity — registry-only preview until raw TM adds squad`,
      );
      missingFields.teams.push({ nationalTeamId: priority.id, reason: 'tm_entity_missing' });
      continue;
    }
    const raw = rowsByCode.get(priority.tmCode);
    if (!raw) {
      passed = false;
      warnings.push(`Priority national team missing in TM raw: ${priority.displayName} (${priority.tmCode})`);
      missingFields.teams.push({ nationalTeamId: priority.id, reason: 'not_in_raw' });
      continue;
    }
    const teamMissing = [];
    if (!raw.name) teamMissing.push('name');
    if (!raw.code) teamMissing.push('code');
    if (!raw.href) teamMissing.push('href');
    if (!raw.confederation) teamMissing.push('confederation');
    if (raw.squad_size == null || raw.squad_size === '') teamMissing.push('squad_size');
    if (teamMissing.length) {
      warnings.push(`${priority.id}: raw entity missing ${teamMissing.join(', ')}`);
      missingFields.teams.push({ nationalTeamId: priority.id, fields: teamMissing });
    }
  }

  const tmBackedTargets = PRIORITY_NATIONAL_TEAMS.filter((t) => t.tmCode && !t.tmMissing);
  const inspection = {
    passed,
    entityDataClean: passed,
    priorityTeamsExpected: tmBackedTargets.length,
    priorityTeamsFound: tmBackedTargets.filter((t) => rowsByCode.has(t.tmCode)).length,
    totalRawNationalTeams: rowsByCode.size,
    notes: [
      'Entity metadata: national_teams.json.gz (119 teams).',
      'Squad rows: players.json.gz with parent.type=national_team (often incomplete for big nations).',
      'Fallback links: club-parent rows where TM national_team.country matches (still raw TM).',
      'Curated national_teams.csv not required for this preview.',
    ],
  };

  if (inspection.priorityTeamsFound < inspection.priorityTeamsExpected) {
    inspection.passed = false;
    inspection.entityDataClean = false;
  }

  return { inspection, warnings, missingFields };
}

function buildLinkRecord({ priority, p, clubPlayer, playerMissing, linkSource }) {
  const sourceId = extractSourceId(p.href, 'spieler');
  return {
    nationalTeamId: priority.id,
    playerId: clubPlayer.id,
    sourceId: String(sourceId),
    linkSource,
    displayName: clubPlayer.name ?? displayNameFromPlayer(p),
    tmDisplayName: displayNameFromPlayer(p),
    position: p.position ?? clubPlayer.position ?? null,
    citizenship: p.citizenship ?? clubPlayer.nationality ?? null,
    tmNationalTeamCountry: p.national_team?.country ?? null,
    internationalCaps:
      p.international_caps != null && String(p.international_caps).trim() !== ''
        ? Number(p.international_caps)
        : null,
    internationalGoals:
      p.international_goals != null && String(p.international_goals).trim() !== ''
        ? Number(p.international_goals)
        : null,
    clubTeamId: clubPlayer.teamId ?? null,
    clubLeagueId: clubPlayer.leagueId ?? null,
    quizEligible: clubPlayer.quizEligible === true,
    missingFields: playerMissing,
  };
}

function buildUnmatchedRecord({ priority, p, playerMissing, linkSource }) {
  const sourceId = extractSourceId(p.href, 'spieler');
  return {
    nationalTeamId: priority.id,
    sourceId: sourceId ? String(sourceId) : null,
    linkSource,
    tmDisplayName: displayNameFromPlayer(p),
    position: p.position ?? null,
    citizenship: p.citizenship ?? null,
    tmNationalTeamCountry: p.national_team?.country ?? null,
    dateOfBirthRaw: p.date_of_birth ?? null,
    internationalCaps:
      p.international_caps != null && String(p.international_caps).trim() !== ''
        ? Number(p.international_caps)
        : null,
    internationalGoals:
      p.international_goals != null && String(p.international_goals).trim() !== ''
        ? Number(p.international_goals)
        : null,
    reason: sourceId ? 'not_in_club_registry' : 'missing_tm_source_id',
    missingFields: playerMissing,
  };
}

function tmRepresentsNationalTeam(priority, p) {
  const ntCountry = p.national_team?.country;
  return Boolean(ntCountry && ntCountry === priority.displayName);
}

function collectPlayerMissingFields(p) {
  const missing = [];
  if (!extractSourceId(p.href, 'spieler')) missing.push('sourceId');
  if (!displayNameFromPlayer(p)) missing.push('displayName');
  if (!p.position) missing.push('position');
  if (!p.date_of_birth) missing.push('dateOfBirth');
  if (!p.citizenship) missing.push('citizenship');
  return missing;
}

async function main() {
  const season = latestSeasonDir();
  if (!season) {
    console.error('No transfermarkt-scraper season folder found.');
    process.exit(1);
  }

  const ntPath = path.join(SCRAPER_DIR, season, 'national_teams.json.gz');
  const playersPath = path.join(SCRAPER_DIR, season, 'players.json.gz');

  const rowsByCode = new Map();
  await readNdjsonGz(ntPath, (row) => {
    if (row.code) rowsByCode.set(row.code, row);
  });

  const { inspection: baseInspection, warnings, missingFields } = inspectRawNationalTeams(rowsByCode);
  if (!baseInspection.passed) {
    console.error('Raw national-team inspection failed — preview will still be written with warnings.');
  }

  const registry = loadClubRegistry();

  const nationalTeams = [];
  for (const priority of PRIORITY_NATIONAL_TEAMS) {
    if (priority.tmMissing || !priority.tmCode) {
      nationalTeams.push({
        id: priority.id,
        displayName: priority.displayName,
        tmCode: null,
        tmTeamId: null,
        confederationId: null,
        confederation: null,
        fifaRanking: null,
        squadSizeReported: null,
        averageAge: null,
        coachName: null,
        sourceUrl: null,
        searchAliases: priority.searchAliases ?? [],
        crestPolicy: 'text-only',
        expansionWave: priority.expansionWave,
        tmEntityMissing: true,
      });
      continue;
    }
    const raw = rowsByCode.get(priority.tmCode);
    if (!raw) continue;
    const tmTeam = extractNationalTeamId(raw.href);
    nationalTeams.push({
      id: priority.id,
      displayName: priority.displayName,
      tmCode: raw.code,
      tmTeamId: tmTeam?.tmTeamId ?? null,
      confederationId: normalizeConfederation(raw.confederation)?.toLowerCase() ?? null,
      confederation: normalizeConfederation(raw.confederation),
      fifaRanking: raw.fifa_ranking != null && raw.fifa_ranking !== '' ? Number(raw.fifa_ranking) : null,
      squadSizeReported: raw.squad_size != null && raw.squad_size !== '' ? Number(raw.squad_size) : null,
      averageAge: raw.average_age != null && raw.average_age !== '' ? Number(raw.average_age) : null,
      coachName: raw.coach_name ?? null,
      sourceUrl: raw.href ? `https://www.transfermarkt.co.uk${raw.href}` : null,
      searchAliases: priority.searchAliases ?? [],
      crestPolicy: 'text-only',
      expansionWave: priority.expansionWave,
      tmEntityMissing: false,
    });
  }

  const playerLinks = [];
  const unmatchedNationalTeamPlayers = [];
  const linkedKeys = new Set();
  const squadCounts = new Map();
  const tmNationalTeamFieldCounts = new Map();
  for (const code of PRIORITY_CODES) {
    squadCounts.set(code, 0);
    tmNationalTeamFieldCounts.set(code, 0);
  }

  let ntParentRows = 0;
  let skippedNonPriority = 0;
  let clubParentNtFieldRows = 0;

  const priorityByCode = new Map(
    PRIORITY_NATIONAL_TEAMS.filter((t) => t.tmCode).map((t) => [t.tmCode, t]),
  );
  const priorityByName = new Map();
  for (const t of PRIORITY_NATIONAL_TEAMS) {
    priorityByName.set(t.displayName, t);
    for (const label of t.registryLabels ?? []) {
      const titled = label.replace(/\b\w/g, (c) => c.toUpperCase());
      priorityByName.set(titled, t);
      priorityByName.set(label, t);
    }
    for (const alias of t.searchAliases ?? []) {
      const titled = alias.replace(/\b\w/g, (c) => c.toUpperCase());
      priorityByName.set(titled, t);
    }
  }
  priorityByName.set('United States', PRIORITY_NATIONAL_TEAMS.find((t) => t.id === 'united-states'));
  priorityByName.set('South Korea', PRIORITY_NATIONAL_TEAMS.find((t) => t.id === 'korea-republic'));
  priorityByName.set('Czech Republic', PRIORITY_NATIONAL_TEAMS.find((t) => t.id === 'czechia'));
  priorityByName.set("Cote d'Ivoire", PRIORITY_NATIONAL_TEAMS.find((t) => t.id === 'cote-divoire'));
  priorityByName.set("Côte d'Ivoire", PRIORITY_NATIONAL_TEAMS.find((t) => t.id === 'cote-divoire'));
  priorityByName.set('Ivory Coast', PRIORITY_NATIONAL_TEAMS.find((t) => t.id === 'cote-divoire'));

  function tryLinkTmPlayer(p, priority, linkSource, { recordUnmatched = false } = {}) {
    const sourceId = extractSourceId(p.href, 'spieler');
    const playerMissing = collectPlayerMissingFields(p);
    const linkKey = `${priority.id}::${sourceId ?? displayNameFromPlayer(p)}`;
    const clubPlayer = sourceId ? registry.bySourceId.get(String(sourceId)) : null;

    if (clubPlayer) {
      if (!linkedKeys.has(linkKey)) {
        linkedKeys.add(linkKey);
        playerLinks.push(
          buildLinkRecord({ priority, p, clubPlayer, playerMissing, linkSource }),
        );
      }
      return true;
    }

    if (!recordUnmatched) return false;

    const unmatchedKey = `${priority.id}::unmatched::${sourceId ?? displayNameFromPlayer(p)}`;
    if (!linkedKeys.has(unmatchedKey)) {
      linkedKeys.add(unmatchedKey);
      unmatchedNationalTeamPlayers.push(
        buildUnmatchedRecord({ priority, p, playerMissing, linkSource }),
      );
      if (playerMissing.length) {
        if (!missingFields.unmatchedPlayers) missingFields.unmatchedPlayers = [];
        missingFields.unmatchedPlayers.push({
          nationalTeamId: priority.id,
          sourceId,
          fields: playerMissing,
        });
      }
    }
    return false;
  }

  await readNdjsonGz(playersPath, (p) => {
    if (p.parent?.type === 'national_team') {
      const code = p.parent?.code;
      if (!code || !PRIORITY_CODES.has(code)) {
        skippedNonPriority += 1;
        return;
      }
      ntParentRows += 1;
      squadCounts.set(code, (squadCounts.get(code) ?? 0) + 1);
      const priority = priorityByCode.get(code);
      tryLinkTmPlayer(p, priority, 'tm_nt_squad_parent', { recordUnmatched: true });
      return;
    }

    if (p.parent?.type === 'club' && p.national_team?.country) {
      const priority = priorityByName.get(p.national_team.country);
      if (!priority) return;
      clubParentNtFieldRows += 1;
      tmNationalTeamFieldCounts.set(
        priority.tmCode,
        (tmNationalTeamFieldCounts.get(priority.tmCode) ?? 0) + 1,
      );
      tryLinkTmPlayer(p, priority, 'tm_player_national_team_country', { recordUnmatched: false });
    }
  });

  const MIN_NT_PARENT_ROWS_FOR_CLEAN_SQUAD = 80;
  const ntSquadParentDataClean = ntParentRows >= MIN_NT_PARENT_ROWS_FOR_CLEAN_SQUAD;

  if (!ntSquadParentDataClean) {
    warnings.push(
      `NT-parent squad scrape incomplete for priority nations (${ntParentRows} rows; expected ≥${MIN_NT_PARENT_ROWS_FOR_CLEAN_SQUAD}). Using TM national_team.country on club-parent rows as fallback linker.`,
    );
  }

  for (const team of nationalTeams) {
    const priority = PRIORITY_NATIONAL_TEAMS.find((t) => t.id === team.id);
    const scraped = squadCounts.get(priority.tmCode) ?? 0;
    const tmFieldRows = tmNationalTeamFieldCounts.get(priority.tmCode) ?? 0;
    const linked = playerLinks.filter((l) => l.nationalTeamId === team.id).length;
    const linkedFromSquad = playerLinks.filter(
      (l) => l.nationalTeamId === team.id && l.linkSource === 'tm_nt_squad_parent',
    ).length;
    const linkedFromField = playerLinks.filter(
      (l) => l.nationalTeamId === team.id && l.linkSource === 'tm_player_national_team_country',
    ).length;
    const unmatched = unmatchedNationalTeamPlayers.filter((u) => u.nationalTeamId === team.id).length;
    team.squadScrapedCount = scraped;
    team.tmNationalTeamFieldCount = tmFieldRows;
    team.playerLinksCount = linked;
    team.playerLinksFromNtSquad = linkedFromSquad;
    team.playerLinksFromNationalTeamField = linkedFromField;
    team.unmatchedCount = unmatched;
    if (team.squadSizeReported != null && scraped !== team.squadSizeReported) {
      warnings.push(
        `${team.id}: NT-parent squad ${scraped} ≠ TM squad_size ${team.squadSizeReported}`,
      );
    }
    if (scraped === 0 && tmFieldRows === 0) {
      warnings.push(`${team.id}: no TM squad rows and no national_team.country matches in raw players`);
    }
  }

  const ntSquadLinkRate =
    ntParentRows > 0
      ? Math.round(
          (playerLinks.filter((l) => l.linkSource === 'tm_nt_squad_parent').length / ntParentRows) *
            1000,
        ) / 10
      : 0;

  const tmBackedTeams = PRIORITY_NATIONAL_TEAMS.filter((t) => t.tmCode && !t.tmMissing);
  const tmBackedFound = tmBackedTeams.filter((t) => rowsByCode.has(t.tmCode)).length;

  const inspection = {
    ...baseInspection,
    expansionWave: 3,
    wave1TeamCount: WAVE_1_NATIONAL_TEAM_IDS.length,
    wave2TeamCount: WAVE_2_NATIONAL_TEAM_IDS.length,
    wave3TeamCount: WAVE_3_NATIONAL_TEAM_IDS.length,
    tmBackedTeamsExpected: tmBackedTeams.length,
    tmBackedTeamsFound: tmBackedFound,
    tmEntityMissingTeamIds: PRIORITY_NATIONAL_TEAMS.filter((t) => t.tmMissing).map((t) => t.id),
    passed:
      baseInspection.entityDataClean &&
      nationalTeams.length === PRIORITY_NATIONAL_TEAMS.length &&
      tmBackedFound === tmBackedTeams.length,
    ntSquadParentDataClean,
    ntParentRowsPriority: ntParentRows,
    ntParentRowsSkippedNonPriority: skippedNonPriority,
    clubParentNationalTeamFieldRows: clubParentNtFieldRows,
    clubRegistryPlayers: registry.byPlayerId.size,
    ntSquadLinkRatePercent: ntSquadLinkRate,
    playerLinksFromNtSquad: playerLinks.filter((l) => l.linkSource === 'tm_nt_squad_parent').length,
    playerLinksFromNationalTeamField: playerLinks.filter(
      (l) => l.linkSource === 'tm_player_national_team_country',
    ).length,
  };

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      purpose: 'staging-only — do not merge into sampleData until reviewed',
      expansionWave: 3,
      previewSeason: season,
      dataAsOf: new Date().toISOString().slice(0, 10),
      inspectionPassed: inspection.passed,
      waveCounts: {
        wave1: WAVE_1_NATIONAL_TEAM_IDS.length,
        wave2: WAVE_2_NATIONAL_TEAM_IDS.length,
        wave3: WAVE_3_NATIONAL_TEAM_IDS.length,
        total: PRIORITY_NATIONAL_TEAMS.length,
      },
      counts: {
        nationalTeams: nationalTeams.length,
        playerLinks: playerLinks.length,
        unmatchedNationalTeamPlayers: unmatchedNationalTeamPlayers.length,
        warnings: warnings.length,
      },
    },
    inspection,
    nationalTeams,
    playerLinks,
    unmatchedNationalTeamPlayers,
    warnings,
    missingFields,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

  const publicPath = path.join(ROOT, 'public/dev-data/national-teams-preview.json');
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.copyFileSync(OUTPUT_PATH, publicPath);
  console.log('Copied to', path.relative(ROOT, publicPath));

  console.log('Wrote', path.relative(ROOT, OUTPUT_PATH));
  console.log('Inspection passed:', inspection.passed);
  console.log('National teams:', nationalTeams.length);
  console.log('Player links (existing club IDs):', playerLinks.length);
  console.log('Unmatched NT squad players:', unmatchedNationalTeamPlayers.length);
  console.log('Warnings:', warnings.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
