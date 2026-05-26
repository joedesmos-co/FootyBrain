#!/usr/bin/env node
/**
 * Build a small inspection-only preview from Transfermarkt scraper raw data.
 * Does NOT modify src/data/sampleData.js or the React app.
 *
 * Source: raw-data/transfermarkt-datasets/data/raw/transfermarkt-scraper/{season}/
 * Output: generated-data/footybrain-preview-data.json
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRAPER_DIR = path.join(
  ROOT,
  'raw-data/transfermarkt-datasets/data/raw/transfermarkt-scraper',
);
const COMPETITIONS_PATH = path.join(
  ROOT,
  'raw-data/transfermarkt-datasets/data/competitions.json',
);
const OUTPUT_PATH = path.join(ROOT, 'generated-data/footybrain-preview-data.json');
const PHASE4_OUTPUT_PATH = path.join(ROOT, 'generated-data/footybrain-phase4-preview-data.json');
const PHASE1_CLUBS_PATH = path.join(ROOT, 'editorial-overlays/phase1-clubs.json');
const PHASE2_CLUBS_PATH = path.join(ROOT, 'editorial-overlays/phase2-clubs.json');
const PHASE3_CLUBS_PATH = path.join(ROOT, 'editorial-overlays/phase3-clubs.json');
const PHASE5_PREMIER_LEAGUE_COMPLETION_CLUBS_PATH = path.join(
  ROOT,
  'editorial-overlays/phase5-premier-league-completion-clubs.json',
);
const PHASE4_CLUBS_PATH = path.join(ROOT, 'editorial-overlays/phase4-clubs.json');
const PHASE4_MLS_CLUBS_PATH = path.join(ROOT, 'editorial-overlays/phase4-mls-clubs.json');
const PHASE4_BRASILEIRAO_CLUBS_PATH = path.join(
  ROOT,
  'editorial-overlays/phase4-brasileirao-clubs.json',
);
const PHASE4_ONLY = process.argv.includes('--phase4-only');

const BASE_LEAGUE_BY_TM_CODE = {
  GB1: { id: 'premier-league', name: 'Premier League', country: 'England' },
  ES1: { id: 'la-liga', name: 'La Liga', country: 'Spain' },
  L1: { id: 'bundesliga', name: 'Bundesliga', country: 'Germany' },
  IT1: { id: 'serie-a', name: 'Serie A', country: 'Italy' },
};

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadPhase4Config() {
  if (!fs.existsSync(PHASE4_CLUBS_PATH)) {
    console.error(`Missing ${PHASE4_CLUBS_PATH}`);
    process.exit(1);
  }
  const phase4 = loadJson(PHASE4_CLUBS_PATH);
  const leagueByTmCode = {};
  for (const league of phase4.leagues ?? []) {
    if (!league.tmCompetitionCode || !league.id || !league.name) continue;
    leagueByTmCode[league.tmCompetitionCode] = {
      id: league.id,
      name: league.name,
      country: league.country ?? 'Americas',
    };
  }
  return {
    clubs: phase4.clubs ?? [],
    leagueByTmCode,
    targetLeagueCodes: Object.keys(leagueByTmCode),
    phaseLabel: 'phase4',
  };
}

function loadExpansionConfig() {
  if (!fs.existsSync(PHASE1_CLUBS_PATH)) {
    console.error(`Missing ${PHASE1_CLUBS_PATH}`);
    process.exit(1);
  }

  const configs = [loadJson(PHASE1_CLUBS_PATH)];
  if (fs.existsSync(PHASE2_CLUBS_PATH)) {
    configs.push(loadJson(PHASE2_CLUBS_PATH));
  }
  if (fs.existsSync(PHASE3_CLUBS_PATH)) {
    configs.push(loadJson(PHASE3_CLUBS_PATH));
  }
  if (fs.existsSync(PHASE5_PREMIER_LEAGUE_COMPLETION_CLUBS_PATH)) {
    configs.push(loadJson(PHASE5_PREMIER_LEAGUE_COMPLETION_CLUBS_PATH));
  }
  if (fs.existsSync(PHASE4_MLS_CLUBS_PATH)) {
    configs.push(loadJson(PHASE4_MLS_CLUBS_PATH));
  }
  if (fs.existsSync(PHASE4_BRASILEIRAO_CLUBS_PATH)) {
    configs.push(loadJson(PHASE4_BRASILEIRAO_CLUBS_PATH));
  }

  const clubs = configs.flatMap((config) => config.clubs ?? []);
  const leagueRows = configs.flatMap((config) => config.leagues ?? []);
  const leagueByTmCode = { ...BASE_LEAGUE_BY_TM_CODE };

  for (const league of leagueRows) {
    if (!league.tmCompetitionCode || !league.id || !league.name) continue;
    leagueByTmCode[league.tmCompetitionCode] = {
      id: league.id,
      name: league.name,
      country: league.country ?? 'Europe',
    };
  }

  return {
    clubs,
    leagueByTmCode,
    targetLeagueCodes: Object.keys(leagueByTmCode),
    phaseLabel: 'phases1-3',
  };
}

function loadTargetClubs(expansionConfig) {
  return expansionConfig.clubs.map((club) => ({
    footybrainTeamId: club.footybrainTeamId,
    label: club.label,
    codes: new Set(club.codes ?? []),
    nameKeys: club.nameKeys ?? [],
  }));
}

function normalizeName(value) {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/football club|fussballclub|futbol club|fútbol club|soccer club/g, ' fc ')
    .replace(/\bfc\b/g, ' ')
    .replace(/\bs\.?p\.?a\.?\b/g, ' ')
    .replace(/\bs\.?a\.?d\.?\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function extractSourceId(href, segment) {
  if (!href) return null;
  const match = href.match(new RegExp(`/${segment}/(\\d+)`));
  return match ? match[1] : null;
}

function parseTmDate(value) {
  if (!value || typeof value !== 'string') return null;
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
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
  if (!fs.existsSync(filePath)) return 0;
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
        try {
          onLine(JSON.parse(line), count);
        } catch {
          /* skip */
        }
      }
    });
    stream.on('end', () => {
      if (leftover.trim()) {
        count += 1;
        try {
          onLine(JSON.parse(leftover), count);
        } catch {
          /* skip */
        }
      }
      resolve(count);
    });
    stream.on('error', reject);
  });
}

async function readNdjson(filePath, onLine) {
  if (!fs.existsSync(filePath)) return 0;
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, 'utf8'),
    crlfDelay: true,
  });
  let count = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    count += 1;
    try {
      onLine(JSON.parse(line), count);
    } catch {
      /* skip */
    }
  }
  return count;
}

const CLUB_NAME_BLOCKLIST = [
  { pattern: /espanyol/, blocks: 'barcelona' },
  { pattern: /inter miami/, blocks: 'inter-milan' },
  { pattern: /internacional de bogota/, blocks: 'inter-milan' },
  { pattern: /sport club internacional/, blocks: 'inter-milan' },
];

function resolveTargetClub(clubRecord, targetClubs) {
  const code = clubRecord.code ?? '';
  const norm = normalizeName(clubRecord.name);

  for (const target of targetClubs) {
    if (target.codes.has(code)) {
      return { target, method: 'code', confidence: 'high' };
    }
  }

  for (const target of TARGET_CLUBS) {
    const blocked = CLUB_NAME_BLOCKLIST.some(
      (rule) => rule.pattern.test(norm) && rule.blocks === target.footybrainTeamId,
    );
    if (blocked) continue;

    if (target.nameKeys.some((key) => norm === key)) {
      const confidence =
        target.footybrainTeamId === 'ac-milan' && norm === 'milan' ? 'medium' : 'high';
      return { target, method: 'name-exact', confidence };
    }
  }

  return null;
}

function loadCompetitions(warnings, targetLeagueCodes, leagueByTmCode) {
  const leagues = [];
  const seen = new Set();

  if (!fs.existsSync(COMPETITIONS_PATH)) {
    warnings.push('Missing data/competitions.json — league metadata built from club parents only.');
    for (const code of targetLeagueCodes) {
      if (leagueByTmCode[code]) {
        leagues.push({
          source: 'static-map',
          tmCompetitionCode: code,
          ...leagueByTmCode[code],
        });
      }
    }
    return leagues;
  }

  const lines = fs.readFileSync(COMPETITIONS_PATH, 'utf8').trim().split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    const code = row.country_code;
    if (!targetLeagueCodes.includes(code)) continue;
    if (row.competition_type && row.competition_type !== 'first_tier') continue;
    if (seen.has(code)) continue;
    seen.add(code);
    const mapped = leagueByTmCode[code];
    if (!mapped) continue;
    leagues.push({
      source: 'competitions.json',
      tmCompetitionCode: code,
      tmCompetitionName: row.competition_name ?? null,
      tmCompetitionType: row.competition_type ?? null,
      ...mapped,
    });
  }

  for (const code of targetLeagueCodes) {
    if (!seen.has(code) && leagueByTmCode[code]) {
      leagues.push({
        source: 'static-map-fallback',
        tmCompetitionCode: code,
        ...leagueByTmCode[code],
      });
      warnings.push(`No first_tier row for ${code} in competitions.json — used static map.`);
    }
  }

  return leagues.sort((a, b) => a.id.localeCompare(b.id));
}

function buildPhase4InspectionReport(players, matchedTeams, targetClubs, leagues) {
  const byTeam = new Map();
  for (const team of matchedTeams) {
    byTeam.set(team.footybrainTeamId, { team, players: [] });
  }
  for (const p of players) {
    const bucket = byTeam.get(p.footybrainTeamId);
    if (bucket) bucket.players.push(p);
  }

  const clubsUnder18 = [];
  const missingFields = { noDob: 0, noNationality: 0, noPosition: 0, noSourceId: 0, noName: 0 };
  const displayByTeam = new Map();
  const lastByTeam = new Map();

  for (const [teamId, { team, players: squad }] of byTeam) {
    if (squad.length < 18) {
      clubsUnder18.push({
        footybrainTeamId: teamId,
        label: team.displayName,
        playerCount: squad.length,
      });
    }
    for (const p of squad) {
      if (!p.dateOfBirth) missingFields.noDob += 1;
      if (!p.nationality) missingFields.noNationality += 1;
      if (!p.position) missingFields.noPosition += 1;
      if (!p.sourceId) missingFields.noSourceId += 1;
      if (!p.name) missingFields.noName += 1;

      const dn = normalizeName(p.name);
      if (dn) {
        const dKey = `${teamId}::${dn}`;
        if (!displayByTeam.has(dKey)) displayByTeam.set(dKey, []);
        displayByTeam.get(dKey).push(p.sourceId);

        const parts = (p.name || '').trim().split(/\s+/);
        const ln = parts[parts.length - 1]?.toLowerCase() ?? '';
        const lKey = `${teamId}::${ln}`;
        if (!lastByTeam.has(lKey)) lastByTeam.set(lKey, []);
        lastByTeam.get(lKey).push({ sourceId: p.sourceId, name: p.name });
      }
    }
  }

  const duplicateDisplayNames = [];
  for (const [key, ids] of displayByTeam) {
    if (ids.length > 1) duplicateDisplayNames.push({ key, sourceIds: ids });
  }
  const duplicateLastNames = [];
  for (const [key, entries] of lastByTeam) {
    if (entries.length > 1) duplicateLastNames.push({ key, players: entries });
  }

  const unmatchedTargetClubs = targetClubs
    .filter((t) => !byTeam.has(t.footybrainTeamId))
    .map((t) => t.label);

  return {
    leaguesFound: leagues.map((l) => ({
      id: l.id,
      name: l.name,
      tmCompetitionCode: l.tmCompetitionCode,
    })),
    clubsMatched: matchedTeams.length,
    clubsRequested: targetClubs.length,
    playersExported: players.length,
    clubsUnder18Players: clubsUnder18,
    missingFields,
    duplicateNameRisks: {
      sameDisplayNameSameTeam: duplicateDisplayNames,
      sameLastNameSameTeam: duplicateLastNames,
    },
    unmatchedTargetClubs,
    squadCounts: [...byTeam.values()]
      .map(({ team, players: squad }) => ({
        footybrainTeamId: team.footybrainTeamId,
        label: team.displayName,
        tmLeagueCode: team.tmLeagueCode,
        playerCount: squad.length,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}

async function main() {
  const expansionConfig = PHASE4_ONLY ? loadPhase4Config() : loadExpansionConfig();
  const targetLeagueCodes = expansionConfig.targetLeagueCodes;
  const leagueByTmCode = expansionConfig.leagueByTmCode;
  const targetClubs = loadTargetClubs(expansionConfig);
  const outputPath = PHASE4_ONLY ? PHASE4_OUTPUT_PATH : OUTPUT_PATH;

  const warnings = [];
  const mappingNotes = [];
  const suspiciousMappings = [];

  const season = latestSeasonDir();
  if (!season) {
    console.error(`No season folder under ${SCRAPER_DIR}`);
    process.exit(1);
  }

  mappingNotes.push(`Using scraper season folder: ${season}`);
  const clubsPath = path.join(SCRAPER_DIR, season, 'clubs.json.gz');
  const playersPath = path.join(SCRAPER_DIR, season, 'players.json.gz');

  if (!fs.existsSync(clubsPath)) {
    console.error(`Missing ${clubsPath} — run dvc pull in transfermarkt-datasets.`);
    process.exit(1);
  }

  const leagues = loadCompetitions(warnings, targetLeagueCodes, leagueByTmCode);
  const matchedTeamsById = new Map();
  const clubCodeToTeam = new Map();
  const matchedTargetIds = new Set();
  const METHOD_RANK = { code: 0, 'name-exact': 1 };

  await readNdjsonGz(clubsPath, (club) => {
    const parent = club.parent ?? {};
    const tmCode = parent.country_code;
    if (!targetLeagueCodes.includes(tmCode)) return;
    if (parent.competition_type && parent.competition_type !== 'first_tier') return;

    const resolved = resolveTargetClub(
      {
        code: club.code,
        name: club.name,
      },
      targetClubs,
    );
    if (!resolved) return;

    const { target, method, confidence } = resolved;
    const sourceClubId = extractSourceId(club.href, 'verein');
    const league = leagueByTmCode[tmCode];

    const candidate = {
      footybrainTeamId: target.footybrainTeamId,
      displayName: target.label,
      sourceClubId,
      sourceClubCode: club.code,
      sourceClubName: club.name,
      sourceClubHref: club.href ?? null,
      tmLeagueCode: tmCode,
      footybrainLeagueId: league?.id ?? null,
      stadium: club.stadium_name ?? null,
      squadSize: club.squad_size ?? null,
      matchMethod: method,
      matchConfidence: confidence,
    };

    const existing = matchedTeamsById.get(target.footybrainTeamId);
    const shouldReplace =
      !existing ||
      (METHOD_RANK[method] ?? 9) < (METHOD_RANK[existing.matchMethod] ?? 9);

    if (shouldReplace) {
      if (existing && existing.sourceClubCode !== club.code) {
        suspiciousMappings.push({
          type: 'club-duplicate-resolved',
          footybrainTeamId: target.footybrainTeamId,
          kept: `${existing.sourceClubName} (${existing.sourceClubCode})`,
          dropped: `${club.name} (${club.code})`,
          reason: 'Multiple TM clubs matched one FootyBrain team — kept stronger code match',
        });
        clubCodeToTeam.delete(existing.sourceClubCode);
      }
      matchedTeamsById.set(target.footybrainTeamId, candidate);
      clubCodeToTeam.set(club.code, target.footybrainTeamId);
      matchedTargetIds.add(target.footybrainTeamId);
    } else {
      suspiciousMappings.push({
        type: 'club-duplicate-dropped',
        footybrainTeamId: target.footybrainTeamId,
        dropped: `${club.name} (${club.code})`,
        kept: `${existing.sourceClubName} (${existing.sourceClubCode})`,
        reason: 'Weaker name match ignored because code match already exists',
      });
    }
  });

  const matchedTeams = [...matchedTeamsById.values()];
  for (const team of matchedTeams) {
    if (team.matchConfidence === 'medium') {
      suspiciousMappings.push({
        type: 'club-name',
        footybrainTeamId: team.footybrainTeamId,
        tmName: team.sourceClubName,
        tmCode: team.sourceClubCode,
        reason: 'Name-based match with possible ambiguity',
      });
    }
    mappingNotes.push(
      `Club ${team.displayName} ← TM "${team.sourceClubName}" (${team.sourceClubCode}) via ${team.matchMethod} [${team.tmLeagueCode} → ${team.footybrainLeagueId}]`,
    );
  }

  const unmatchedTargetClubs = targetClubs
    .filter((t) => !matchedTargetIds.has(t.footybrainTeamId))
    .map((t) => t.label);

  const players = [];
  let skippedWrongClub = 0;
  let skippedNoClubParent = 0;

  if (!fs.existsSync(playersPath)) {
    warnings.push(`Missing ${playersPath}`);
  } else {
    await readNdjsonGz(playersPath, (player) => {
      const parent = player.parent ?? {};
      if (parent.type !== 'club') {
        skippedNoClubParent += 1;
        return;
      }

      const clubCode = parent.code;
      const footybrainTeamId = clubCodeToTeam.get(clubCode);
      if (!footybrainTeamId) {
        skippedWrongClub += 1;
        return;
      }

      const teamMeta = matchedTeamsById.get(footybrainTeamId);
      const leagueCode = teamMeta?.tmLeagueCode ?? null;
      const footybrainLeagueId =
        teamMeta?.footybrainLeagueId ?? leagueByTmCode[leagueCode]?.id ?? null;

      const fullName = [player.name, player.last_name].filter(Boolean).join(' ').trim();
      const sourceId = extractSourceId(player.href, 'spieler');

      if (!sourceId) {
        suspiciousMappings.push({
          type: 'player-missing-id',
          name: fullName,
          href: player.href,
          reason: 'Could not parse spieler id from href',
        });
      }

      players.push({
        sourceId,
        name: player.full_name || fullName || null,
        firstName: player.name ?? null,
        lastName: player.last_name ?? null,
        dateOfBirth: parseTmDate(player.date_of_birth),
        dateOfBirthRaw: player.date_of_birth ?? null,
        nationality: player.citizenship ?? player.place_of_birth?.country ?? null,
        nationalTeam: player.national_team?.name ?? player.national_team?.country ?? null,
        position: player.position ?? null,
        currentClub: parent.name ?? teamMeta?.sourceClubName ?? null,
        sourceClubCode: clubCode,
        footybrainTeamId,
        tmLeagueCode: leagueCode,
        footybrainLeagueId,
        sourcePlayerHref: player.href ?? null,
      });
    });
  }

  if (skippedNoClubParent > 0) {
    mappingNotes.push(
      `Skipped ${skippedNoClubParent.toLocaleString()} players without club parent (national team rows, etc.).`,
    );
  }
  if (skippedWrongClub > 0) {
    mappingNotes.push(
      `Skipped ${skippedWrongClub.toLocaleString()} club-parent players outside the ${targetClubs.length} target squads.`,
    );
  }

  // Duplicate name check within export
  const nameCounts = new Map();
  for (const p of players) {
    const key = normalizeName(p.name);
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }
  for (const [name, count] of nameCounts) {
    if (count > 1 && name) {
      suspiciousMappings.push({
        type: 'duplicate-name',
        name,
        count,
        reason: 'Multiple exported players share the same normalized name',
      });
    }
  }

  const inspectionReport = PHASE4_ONLY
    ? buildPhase4InspectionReport(players, matchedTeams, targetClubs, leagues)
    : null;

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      purpose: PHASE4_ONLY
        ? 'phase4-staged-preview — MLS + Brasileirão only; not merged to sampleData.js'
        : 'inspection-only — do not import into React yet',
      phase: expansionConfig.phaseLabel,
      source: 'transfermarkt-scraper raw NDJSON.gz',
      season,
      editorialFieldsExcluded: [
        'quickFact',
        'quizHints',
        'fanGuide',
        'importanceScore',
        'image_url',
        'market_value',
      ],
      quizEligibleDefault: false,
    },
    leagues,
    teams: matchedTeams.sort((a, b) => a.footybrainTeamId.localeCompare(b.footybrainTeamId)),
    players: players.sort((a, b) => a.name.localeCompare(b.name)),
    mappingNotes,
    unmatchedTargetClubs,
    warnings,
    suspiciousMappings,
    stats: {
      leagues: leagues.length,
      teams: matchedTeams.length,
      players: players.length,
      targetClubsRequested: targetClubs.length,
    },
    ...(inspectionReport ? { inspectionReport } : {}),
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  const reportPath = path.join(ROOT, 'generated-data/phase4-preview-inspection-summary.json');
  if (inspectionReport) {
    fs.writeFileSync(reportPath, `${JSON.stringify(inspectionReport, null, 2)}\n`, 'utf8');
  }

  console.log(`Wrote ${path.relative(ROOT, outputPath)}`);
  console.log(`Season: ${season}`);
  console.log(`Leagues matched: ${output.stats.leagues}`);
  console.log(`Teams matched: ${output.stats.teams} / ${output.stats.targetClubsRequested}`);
  console.log(`Players exported: ${output.stats.players}`);
  if (unmatchedTargetClubs.length) {
    console.log(`Unmatched clubs: ${unmatchedTargetClubs.join(', ')}`);
  } else {
    console.log('Unmatched clubs: none');
  }
  if (inspectionReport) {
    console.log('\n--- Phase 4 inspection report ---');
    console.log(`Leagues found: ${inspectionReport.leaguesFound.map((l) => l.id).join(', ')}`);
    console.log(`Clubs matched: ${inspectionReport.clubsMatched} / ${inspectionReport.clubsRequested}`);
    console.log(`Players exported: ${inspectionReport.playersExported}`);
    console.log(`Clubs under 18 players: ${inspectionReport.clubsUnder18Players.length}`);
    if (inspectionReport.clubsUnder18Players.length) {
      inspectionReport.clubsUnder18Players.forEach((c) =>
        console.log(`  - ${c.label}: ${c.playerCount}`),
      );
    }
    console.log(`Missing fields: ${JSON.stringify(inspectionReport.missingFields)}`);
    console.log(
      `Duplicate display-name risks (same team): ${inspectionReport.duplicateNameRisks.sameDisplayNameSameTeam.length}`,
    );
    console.log(
      `Duplicate last-name risks (same team): ${inspectionReport.duplicateNameRisks.sameLastNameSameTeam.length}`,
    );
    console.log(`Wrote ${path.relative(ROOT, reportPath)}`);
  }
  if (suspiciousMappings.length) {
    console.log(`Suspicious mappings: ${suspiciousMappings.length}`);
    suspiciousMappings.slice(0, 5).forEach((s) => console.log(`  - ${s.type}: ${s.reason}`));
  }
  if (warnings.length) {
    console.log(`Warnings: ${warnings.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
