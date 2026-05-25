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

const TARGET_LEAGUE_CODES = ['GB1', 'ES1', 'L1', 'IT1'];

const LEAGUE_BY_TM_CODE = {
  GB1: { id: 'premier-league', name: 'Premier League', country: 'England' },
  ES1: { id: 'la-liga', name: 'La Liga', country: 'Spain' },
  L1: { id: 'bundesliga', name: 'Bundesliga', country: 'Germany' },
  IT1: { id: 'serie-a', name: 'Serie A', country: 'Italy' },
};

/** FootyBrain team ids and how we recognize them in TM data */
const TARGET_CLUBS = [
  {
    footybrainTeamId: 'arsenal',
    label: 'Arsenal',
    codes: new Set(['fc-arsenal']),
    nameKeys: ['arsenal'],
  },
  {
    footybrainTeamId: 'manchester-city',
    label: 'Manchester City',
    codes: new Set(['manchester-city']),
    nameKeys: ['manchester city'],
  },
  {
    footybrainTeamId: 'liverpool',
    label: 'Liverpool',
    codes: new Set(['fc-liverpool']),
    nameKeys: ['liverpool'],
  },
  {
    footybrainTeamId: 'real-madrid',
    label: 'Real Madrid',
    codes: new Set(['real-madrid']),
    nameKeys: ['real madrid'],
  },
  {
    footybrainTeamId: 'barcelona',
    label: 'Barcelona',
    codes: new Set(['fc-barcelona']),
    nameKeys: ['barcelona', 'futbol club barcelona'],
  },
  {
    footybrainTeamId: 'bayern-munich',
    label: 'Bayern Munich',
    codes: new Set(['fc-bayern-munchen', 'fc-bayern-muenchen']),
    nameKeys: ['bayern munchen', 'bayern munich', 'fc bayern munchen'],
  },
  {
    footybrainTeamId: 'inter-milan',
    label: 'Inter Milan',
    codes: new Set(['inter-mailand', 'inter-milan']),
    nameKeys: ['inter milan', 'internazionale milano', 'football club internazionale milano'],
  },
  {
    footybrainTeamId: 'ac-milan',
    label: 'AC Milan',
    codes: new Set(['ac-mailand', 'ac-milan']),
    nameKeys: ['ac milan', 'milan', 'associazione calcio milan'],
  },
];

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

function resolveTargetClub(clubRecord) {
  const code = clubRecord.code ?? '';
  const norm = normalizeName(clubRecord.name);

  for (const target of TARGET_CLUBS) {
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

function loadCompetitions(warnings) {
  const leagues = [];
  const seen = new Set();

  if (!fs.existsSync(COMPETITIONS_PATH)) {
    warnings.push('Missing data/competitions.json — league metadata built from club parents only.');
    for (const code of TARGET_LEAGUE_CODES) {
      if (LEAGUE_BY_TM_CODE[code]) {
        leagues.push({
          source: 'static-map',
          tmCompetitionCode: code,
          ...LEAGUE_BY_TM_CODE[code],
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
    if (!TARGET_LEAGUE_CODES.includes(code)) continue;
    if (row.competition_type && row.competition_type !== 'first_tier') continue;
    if (seen.has(code)) continue;
    seen.add(code);
    const mapped = LEAGUE_BY_TM_CODE[code];
    if (!mapped) continue;
    leagues.push({
      source: 'competitions.json',
      tmCompetitionCode: code,
      tmCompetitionName: row.competition_name ?? null,
      tmCompetitionType: row.competition_type ?? null,
      ...mapped,
    });
  }

  for (const code of TARGET_LEAGUE_CODES) {
    if (!seen.has(code) && LEAGUE_BY_TM_CODE[code]) {
      leagues.push({
        source: 'static-map-fallback',
        tmCompetitionCode: code,
        ...LEAGUE_BY_TM_CODE[code],
      });
      warnings.push(`No first_tier row for ${code} in competitions.json — used static map.`);
    }
  }

  return leagues.sort((a, b) => a.id.localeCompare(b.id));
}

async function main() {
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

  const leagues = loadCompetitions(warnings);
  const matchedTeamsById = new Map();
  const clubCodeToTeam = new Map();
  const matchedTargetIds = new Set();
  const METHOD_RANK = { code: 0, 'name-exact': 1 };

  await readNdjsonGz(clubsPath, (club) => {
    const parent = club.parent ?? {};
    const tmCode = parent.country_code;
    if (!TARGET_LEAGUE_CODES.includes(tmCode)) return;
    if (parent.competition_type && parent.competition_type !== 'first_tier') return;

    const resolved = resolveTargetClub({
      code: club.code,
      name: club.name,
    });
    if (!resolved) return;

    const { target, method, confidence } = resolved;
    const sourceClubId = extractSourceId(club.href, 'verein');
    const league = LEAGUE_BY_TM_CODE[tmCode];

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

  const unmatchedTargetClubs = TARGET_CLUBS.filter(
    (t) => !matchedTargetIds.has(t.footybrainTeamId),
  ).map((t) => t.label);

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
        teamMeta?.footybrainLeagueId ?? LEAGUE_BY_TM_CODE[leagueCode]?.id ?? null;

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
      `Skipped ${skippedWrongClub.toLocaleString()} club-parent players outside the 8 target squads.`,
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

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      purpose: 'inspection-only — do not import into React yet',
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
      targetClubsRequested: TARGET_CLUBS.length,
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`Season: ${season}`);
  console.log(`Leagues matched: ${output.stats.leagues}`);
  console.log(`Teams matched: ${output.stats.teams} / ${output.stats.targetClubsRequested}`);
  console.log(`Players exported: ${output.stats.players}`);
  if (unmatchedTargetClubs.length) {
    console.log(`Unmatched clubs: ${unmatchedTargetClubs.join(', ')}`);
  } else {
    console.log('Unmatched clubs: none');
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
