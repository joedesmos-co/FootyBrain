#!/usr/bin/env node
/**
 * Stage World Cup 2026 national-team expansion (preview only).
 * Does NOT modify sampleData.js, nationalTeamLive.json, or React routes.
 *
 * Sources:
 *   editorial-overlays/world-cup-2026-qualified-teams.json (48 teams + groups)
 *   raw-data/.../national_teams.json.gz + players.json.gz
 *   generated-data/footybrain-app-ready-preview.json (club registry)
 *
 * Output: generated-data/world-cup-national-teams-preview.json
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { players } from '../src/data/sampleData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRAPER_DIR = path.join(
  ROOT,
  'raw-data/transfermarkt-datasets/data/raw/transfermarkt-scraper',
);
const QUALIFIED_PATH = path.join(
  ROOT,
  'editorial-overlays/world-cup-2026-qualified-teams.json',
);
const CLUB_REGISTRY_PATH = path.join(ROOT, 'generated-data/footybrain-app-ready-preview.json');
const OUTPUT_PATH = path.join(ROOT, 'generated-data/world-cup-national-teams-preview.json');
const LIVE_WAVE_1 = new Set(['england', 'france', 'spain', 'brazil', 'argentina']);
const MIN_LINKS_HEALTHY = 8;
const MIN_LINKS_QUIZ_READY = 3;

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
  const map = {
    'South American Football Confederation': 'CONMEBOL',
    'Asian Football Confederation': 'AFC',
    'Confederation of African Football': 'CAF',
    'Confederation of North, Central America and Caribbean Association Football': 'CONCACAF',
    'Oceania Football Confederation': 'OFC',
    'Union of European Football Associations': 'UEFA',
  };
  return map[value] ?? value;
}

function displayNameFromPlayer(p) {
  const full = [p.name, p.last_name].filter(Boolean).join(' ').trim();
  return p.full_name || full || null;
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
  if (!fs.existsSync(CLUB_REGISTRY_PATH)) {
    throw new Error(
      `Missing club registry ${path.relative(ROOT, CLUB_REGISTRY_PATH)} — run npm run build:app-ready-preview first.`,
    );
  }
  const data = JSON.parse(fs.readFileSync(CLUB_REGISTRY_PATH, 'utf8'));
  const bySourceId = new Map();
  const byPlayerId = new Map();
  for (const p of data.players ?? []) {
    byPlayerId.set(p.id, p);
    if (p.sourceId) bySourceId.set(String(p.sourceId), p);
    if (String(p.id).startsWith('tm-')) {
      const fromId = p.id.slice(3);
      if (fromId && !bySourceId.has(fromId)) bySourceId.set(fromId, p);
    }
  }
  return { bySourceId, byPlayerId, meta: data.meta ?? {} };
}

function buildLinkRecord({ team, p, clubPlayer, playerMissing, linkSource }) {
  const sourceId = extractSourceId(p.href, 'spieler');
  return {
    nationalTeamId: team.id,
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

function buildUnmatchedRecord({ team, p, playerMissing, linkSource }) {
  const sourceId = extractSourceId(p.href, 'spieler');
  return {
    nationalTeamId: team.id,
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
    previewOnly: true,
    missingFields: playerMissing,
  };
}

function resolveTmRows(qualifiedConfig, rowsByCode) {
  const byName = new Map();
  for (const row of rowsByCode.values()) {
    if (row.name) byName.set(row.name, row);
  }

  const resolved = [];
  const unresolved = [];

  for (const team of qualifiedConfig.teams) {
    let raw = null;
    for (const name of team.tmSearchNames ?? [team.displayName]) {
      if (byName.has(name)) {
        raw = byName.get(name);
        break;
      }
    }
    if (!raw && team.tmCode) {
      raw = rowsByCode.get(team.tmCode) ?? null;
    }
    if (!raw) {
      for (const row of rowsByCode.values()) {
        if (row.code === team.id || row.code === team.tmCode) {
          raw = row;
          break;
        }
      }
    }
    if (!raw) {
      unresolved.push(team.id);
      resolved.push({
        ...team,
        tmCode: null,
        tmTeamId: null,
        tmResolved: false,
        confederation: team.confederationId?.toUpperCase() ?? null,
        fifaRanking: null,
        squadSizeReported: null,
        sourceUrl: null,
      });
      continue;
    }
    const tmTeam = extractNationalTeamId(raw.href);
    resolved.push({
      ...team,
      tmCode: raw.code ?? team.id,
      tmTeamId: tmTeam?.tmTeamId ?? null,
      tmResolved: true,
      confederation: normalizeConfederation(raw.confederation),
      confederationId: team.confederationId,
      fifaRanking:
        raw.fifa_ranking != null && raw.fifa_ranking !== '' ? Number(raw.fifa_ranking) : null,
      squadSizeReported:
        raw.squad_size != null && raw.squad_size !== '' ? Number(raw.squad_size) : null,
      averageAge:
        raw.average_age != null && raw.average_age !== '' ? Number(raw.average_age) : null,
      coachName: raw.coach_name ?? null,
      sourceUrl: raw.href ? `https://www.transfermarkt.co.uk${raw.href}` : null,
      crestPolicy: 'text-only',
      isLiveWave1: LIVE_WAVE_1.has(team.id),
      worldCupGroup: findGroupForTeam(qualifiedConfig.groups, team.id),
    });
  }

  return { resolved, unresolved };
}

function findGroupForTeam(groups, teamId) {
  for (const [groupId, ids] of Object.entries(groups ?? {})) {
    if (ids.includes(teamId)) return groupId;
  }
  return null;
}

function countRegistryByNationality(teamList) {
  const counts = new Map();
  for (const team of teamList) {
    counts.set(team.id, { registryPlayers: 0, registryQuizEligible: 0 });
  }
  const labelToId = new Map();
  for (const team of teamList) {
    labelToId.set(team.displayName.toLowerCase(), team.id);
    for (const alias of team.tmSearchNames ?? []) {
      labelToId.set(alias.toLowerCase(), team.id);
    }
  }

  for (const p of players) {
    const labels = [p.nationality, p.nationalTeam, p.country].filter(Boolean);
    for (const label of labels) {
      const id = labelToId.get(String(label).toLowerCase());
      if (!id) continue;
      const row = counts.get(id);
      row.registryPlayers += 1;
      if (p.quizEligible) row.registryQuizEligible += 1;
      break;
    }
  }
  return counts;
}

async function main() {
  const qualifiedConfig = JSON.parse(fs.readFileSync(QUALIFIED_PATH, 'utf8'));
  const expectedTeams = qualifiedConfig.teams.length;
  const groupTeamIds = Object.values(qualifiedConfig.groups ?? {}).flat();
  const uniqueGroupTeams = new Set(groupTeamIds);

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

  const { resolved: nationalTeams, unresolved: tmUnresolvedIds } = resolveTmRows(
    qualifiedConfig,
    rowsByCode,
  );
  const qualifiedCodes = new Set(
    nationalTeams.filter((t) => t.tmCode).map((t) => t.tmCode),
  );
  const priorityByCode = new Map(nationalTeams.filter((t) => t.tmCode).map((t) => [t.tmCode, t]));
  const priorityByName = new Map(
    nationalTeams.flatMap((t) =>
      (t.tmSearchNames ?? [t.displayName]).map((name) => [name, t]),
    ),
  );

  const registry = loadClubRegistry();
  const registryCounts = countRegistryByNationality(nationalTeams);

  const playerLinks = [];
  const unmatchedNationalTeamPlayers = [];
  const linkedKeys = new Set();
  const warnings = [];
  const playerIdToTeams = new Map();

  let ntParentRows = 0;
  let skippedNonPriority = 0;
  let clubParentNtFieldRows = 0;
  const squadCounts = new Map();
  const tmNationalTeamFieldCounts = new Map();
  for (const t of nationalTeams) {
    if (t.tmCode) {
      squadCounts.set(t.tmCode, 0);
      tmNationalTeamFieldCounts.set(t.tmCode, 0);
    }
  }

  function tryLinkTmPlayer(p, team, linkSource, { recordUnmatched = false } = {}) {
    const sourceId = extractSourceId(p.href, 'spieler');
    const playerMissing = collectPlayerMissingFields(p);
    const linkKey = `${team.id}::${sourceId ?? displayNameFromPlayer(p)}`;
    const clubPlayer = sourceId ? registry.bySourceId.get(String(sourceId)) : null;

    if (clubPlayer) {
      if (!linkedKeys.has(linkKey)) {
        linkedKeys.add(linkKey);
        const link = buildLinkRecord({ team, p, clubPlayer, playerMissing, linkSource });
        playerLinks.push(link);
        const prev = playerIdToTeams.get(link.playerId) ?? [];
        if (!prev.includes(team.id)) playerIdToTeams.set(link.playerId, [...prev, team.id]);
      }
      return true;
    }

    if (!recordUnmatched) return false;

    const unmatchedKey = `${team.id}::unmatched::${sourceId ?? displayNameFromPlayer(p)}`;
    if (!linkedKeys.has(unmatchedKey)) {
      linkedKeys.add(unmatchedKey);
      unmatchedNationalTeamPlayers.push(
        buildUnmatchedRecord({ team, p, playerMissing, linkSource }),
      );
    }
    return false;
  }

  await readNdjsonGz(playersPath, (p) => {
    if (p.parent?.type === 'national_team') {
      const code = p.parent?.code;
      if (!code || !qualifiedCodes.has(code)) {
        skippedNonPriority += 1;
        return;
      }
      ntParentRows += 1;
      squadCounts.set(code, (squadCounts.get(code) ?? 0) + 1);
      const team = priorityByCode.get(code);
      tryLinkTmPlayer(p, team, 'tm_nt_squad_parent', { recordUnmatched: true });
      return;
    }

    if (p.parent?.type === 'club' && p.national_team?.country) {
      const team = priorityByName.get(p.national_team.country);
      if (!team?.tmCode) return;
      clubParentNtFieldRows += 1;
      tmNationalTeamFieldCounts.set(
        team.tmCode,
        (tmNationalTeamFieldCounts.get(team.tmCode) ?? 0) + 1,
      );
      tryLinkTmPlayer(p, team, 'tm_player_national_team_country', { recordUnmatched: false });
    }
  });

  const MIN_NT_PARENT_ROWS_FOR_CLEAN_SQUAD = 80;
  const ntSquadParentDataClean = ntParentRows >= MIN_NT_PARENT_ROWS_FOR_CLEAN_SQUAD;
  if (!ntSquadParentDataClean) {
    warnings.push(
      `NT-parent squad scrape incomplete for World Cup nations (${ntParentRows} rows; expected ≥${MIN_NT_PARENT_ROWS_FOR_CLEAN_SQUAD}). Using TM national_team.country on club-parent rows as fallback linker.`,
    );
  }

  const thinLinkedCountries = [];
  const teamSummaries = [];

  for (const team of nationalTeams) {
    const linked = playerLinks.filter((l) => l.nationalTeamId === team.id);
    const linkedQuiz = linked.filter((l) => l.quizEligible).length;
    const unmatched = unmatchedNationalTeamPlayers.filter((u) => u.nationalTeamId === team.id);
    const reg = registryCounts.get(team.id) ?? { registryPlayers: 0, registryQuizEligible: 0 };
    const scraped = team.tmCode ? (squadCounts.get(team.tmCode) ?? 0) : 0;
    const tmFieldRows = team.tmCode ? (tmNationalTeamFieldCounts.get(team.tmCode) ?? 0) : 0;

    team.squadScrapedCount = scraped;
    team.tmNationalTeamFieldCount = tmFieldRows;
    team.playerLinksCount = linked.length;
    team.playerLinksQuizEligibleCount = linkedQuiz;
    team.unmatchedPreviewCount = unmatched.length;
    team.registryPlayersByNationality = reg.registryPlayers;
    team.registryQuizEligibleByNationality = reg.registryQuizEligible;

    if (!team.tmResolved) {
      warnings.push(`${team.id}: no Transfermarkt national_teams.json row — entity metadata incomplete`);
    }
    if (team.tmResolved && scraped === 0 && tmFieldRows === 0) {
      warnings.push(`${team.id}: no TM squad rows and no national_team.country matches in raw players`);
    }
    if (linked.length < MIN_LINKS_HEALTHY && reg.registryPlayers < MIN_LINKS_HEALTHY) {
      thinLinkedCountries.push({
        nationalTeamId: team.id,
        displayName: team.displayName,
        playerLinks: linked.length,
        quizEligibleLinks: linkedQuiz,
        registryPlayers: reg.registryPlayers,
        reason: 'low_tm_links_and_low_registry_nationality',
      });
    } else if (linked.length < MIN_LINKS_HEALTHY) {
      thinLinkedCountries.push({
        nationalTeamId: team.id,
        displayName: team.displayName,
        playerLinks: linked.length,
        quizEligibleLinks: linkedQuiz,
        registryPlayers: reg.registryPlayers,
        reason: 'low_tm_field_links_registry_may_backfill',
      });
    }
    if (linkedQuiz < MIN_LINKS_QUIZ_READY && !LIVE_WAVE_1.has(team.id)) {
      warnings.push(
        `${team.id}: only ${linkedQuiz} quiz-eligible TM links (min ${MIN_LINKS_QUIZ_READY} suggested before public NT quiz)`,
      );
    }

    teamSummaries.push({
      id: team.id,
      displayName: team.displayName,
      confederationId: team.confederationId,
      worldCupGroup: team.worldCupGroup,
      host: team.host === true,
      isLiveWave1: LIVE_WAVE_1.has(team.id),
      tmResolved: team.tmResolved,
      playerLinks: linked.length,
      quizEligibleLinks: linkedQuiz,
      unmatchedPreviewRows: unmatched.length,
      registryPlayers: reg.registryPlayers,
      registryQuizEligible: reg.registryQuizEligible,
    });
  }

  const crossNtDuplicates = [...playerIdToTeams.entries()].filter(([, ids]) => ids.length > 1);

  if (crossNtDuplicates.length) {
    warnings.push(
      `${crossNtDuplicates.length} playerIds linked to more than one WC nation via TM field (expected for dual nationals; review before memberships merge)`,
    );
  }

  if (tmUnresolvedIds.length) {
    warnings.push(`TM entity unresolved for: ${tmUnresolvedIds.join(', ')}`);
  }

  if (uniqueGroupTeams.size !== expectedTeams) {
    warnings.push(
      `Group draw lists ${uniqueGroupTeams.size} unique teams; qualified manifest has ${expectedTeams}`,
    );
  }

  const report = {
    teamsIncluded: nationalTeams.map((t) => t.id),
    teamsCount: nationalTeams.length,
    hosts: qualifiedConfig.hosts,
    liveWave1Already: [...LIVE_WAVE_1],
    linkedExistingPlayers: playerLinks.length,
    unmatchedPlayers: unmatchedNationalTeamPlayers.length,
    quizEligibleLinkedPlayers: playerLinks.filter((l) => l.quizEligible).length,
    dataQualityWarnings: warnings,
    thinLinkedCountries,
    crossNationalDuplicates: crossNtDuplicates.map(([playerId, nationalTeamIds]) => ({
      playerId,
      nationalTeamIds,
    })),
    tmUnresolvedNationalTeamIds: tmUnresolvedIds,
  };

  const inspection = {
    passed: tmUnresolvedIds.length === 0 && nationalTeams.length === expectedTeams,
    previewOnly: true,
    safeForLiveRoutes: false,
    safeForLiveRoutesReason:
      'Preview staging only — verification gate, membership backfill, and per-nation editorial required before nationalTeamLive merge.',
    ntSquadParentDataClean,
    ntParentRowsWorldCup: ntParentRows,
    ntParentRowsSkippedNonQualified: skippedNonPriority,
    clubParentNationalTeamFieldRows: clubParentNtFieldRows,
    clubRegistryPlayers: registry.byPlayerId.size,
    qualifiedTeamsExpected: expectedTeams,
    qualifiedTeamsWithTmEntity: nationalTeams.filter((t) => t.tmResolved).length,
    totalRawNationalTeams: rowsByCode.size,
    notes: [
      'Unmatched rows are preview-only (no new players[] rows).',
      'playerLinks reference existing club registry playerId only.',
      'Do not enable World Cup quiz mode from this file.',
    ],
  };

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      purpose: 'world-cup-2026-national-teams-staging — do not merge into sampleData or enable routes',
      previewSeason: season,
      dataAsOf: new Date().toISOString().slice(0, 10),
      competitionId: qualifiedConfig.competitionId,
      verification: qualifiedConfig.verification,
      inspectionPassed: inspection.passed,
      counts: {
        nationalTeams: nationalTeams.length,
        playerLinks: playerLinks.length,
        unmatchedNationalTeamPlayers: unmatchedNationalTeamPlayers.length,
        warnings: warnings.length,
        thinLinkedCountries: thinLinkedCountries.length,
      },
    },
    competition: {
      id: qualifiedConfig.competitionId,
      editionYear: qualifiedConfig.editionYear,
      hosts: qualifiedConfig.hosts,
      qualifiedNationalTeamIds: nationalTeams.map((t) => t.id),
      groups: qualifiedConfig.groups,
      verification: qualifiedConfig.verification,
    },
    inspection,
    report,
    nationalTeams,
    playerLinks,
    unmatchedNationalTeamPlayers,
    warnings,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  const publicPath = path.join(ROOT, 'public/dev-data/world-cup-national-teams-preview.json');
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.writeFileSync(publicPath, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, publicPath)}`);
  console.log(
    `Teams: ${report.teamsCount} | Linked: ${report.linkedExistingPlayers} | Unmatched preview: ${report.unmatchedPlayers} | Warnings: ${warnings.length}`,
  );
  console.log(`Thin linked countries: ${thinLinkedCountries.length}`);
  if (tmUnresolvedIds.length) {
    console.warn(`Unresolved TM entities (${tmUnresolvedIds.length}): ${tmUnresolvedIds.join(', ')}`);
    console.warn('Preview written — resolve TM gaps or add manual entity rows before live import.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
