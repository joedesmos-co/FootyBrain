#!/usr/bin/env node
/**
 * Inspect Transfermarkt raw + curated data under raw-data/transfermarkt-datasets.
 * Run after: cd raw-data/transfermarkt-datasets && dvc pull
 *
 * Does not modify app data. Read-only inspection.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TM_ROOT = path.join(ROOT, 'raw-data', 'transfermarkt-datasets');
const DATA_DIR = path.join(TM_ROOT, 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const SCRAPER_DIR = path.join(RAW_DIR, 'transfermarkt-scraper');
const API_DIR = path.join(RAW_DIR, 'transfermarkt-api');

const CURATED_CSV_NAMES = [
  'players.csv',
  'clubs.csv',
  'competitions.csv',
  'transfers.csv',
  'appearances.csv',
  'games.csv',
  'player_valuations.csv',
  'game_events.csv',
  'game_lineups.csv',
  'club_games.csv',
  'countries.csv',
  'national_teams.csv',
];

const INSPECT_TABLES = [
  { key: 'players', label: 'players' },
  { key: 'clubs', label: 'clubs' },
  { key: 'competitions', label: 'competitions' },
  { key: 'transfers', label: 'transfers' },
  { key: 'appearances', label: 'appearances' },
  { key: 'games', label: 'games' },
  { key: 'valuations', label: 'player_valuations / market_values' },
];

const FOOTYBRAIN_FIELDS = {
  players: [
    'name / first_name + last_name',
    'date_of_birth → age',
    'position / sub_position',
    'current_club_id / current_club_name / parent (club)',
    'citizenship / country_of_citizenship → nationality & nationalTeam',
    'height_in_cm, foot',
    'international_caps, international_goals',
    'Avoid: image_url, current_market_value (use FootyBrain Importance Score instead)',
  ],
  clubs: [
    'club_id / code / name',
    'domestic_competition_id (from parent league or clubs join)',
    'stadium_name, squad_size',
    'country / league context',
  ],
  competitions: [
    'competition_id / competition_code (GB1, ES1, DE1, IT1)',
    'name, country_name, type / competition_type',
  ],
  transfers: [
    'player_id / player name',
    'from_club_id, to_club_id, transfer_date, transfer_season',
    'Build careerHistory[] from ordered transfers',
  ],
  appearances: [
    'player_id, game_id, club_id, goals, assists, minutes (optional stats)',
  ],
  games: [
    'game_id, competition_id, home_club_id, away_club_id, date, score',
  ],
  valuations: [
    'player_id, date, market_value_in_eur — analytics only; not for UI rating',
  ],
};

function warn(msg) {
  console.log(`⚠️  ${msg}`);
}

function info(msg) {
  console.log(msg);
}

function section(title) {
  console.log(`\n${'='.repeat(72)}\n${title}\n${'='.repeat(72)}`);
}

function isDvcPointer(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const text = fs.readFileSync(filePath, 'utf8');
  return text.includes('outs:') && text.includes('path:');
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else if (/\.(csv|csv\.gz|json|json\.gz|dvc)$/i.test(entry.name)) acc.push(full);
  }
  return acc;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function flattenKeys(obj, prefix = '', depth = 0, maxDepth = 2) {
  const keys = [];
  if (!obj || typeof obj !== 'object' || depth > maxDepth) return keys;
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    keys.push(p);
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, p, depth + 1, maxDepth));
    }
  }
  return keys;
}

async function countNdjsonGz(filePath) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const stream = fs
      .createReadStream(filePath)
      .pipe(zlib.createGunzip())
      .setEncoding('utf8');
    let leftover = '';
    stream.on('data', (chunk) => {
      leftover += chunk;
      const parts = leftover.split('\n');
      leftover = parts.pop() ?? '';
      for (const line of parts) {
        if (line.trim()) count += 1;
      }
    });
    stream.on('end', () => {
      if (leftover.trim()) count += 1;
      resolve(count);
    });
    stream.on('error', reject);
  });
}

async function sampleNdjsonGz(filePath, limit = 3) {
  const samples = [];
  return new Promise((resolve, reject) => {
    const stream = fs
      .createReadStream(filePath)
      .pipe(zlib.createGunzip())
      .setEncoding('utf8');
    let leftover = '';
    stream.on('data', (chunk) => {
      if (samples.length >= limit) return;
      leftover += chunk;
      const parts = leftover.split('\n');
      leftover = parts.pop() ?? '';
      for (const line of parts) {
        if (samples.length >= limit) break;
        if (line.trim()) {
          try {
            samples.push(JSON.parse(line));
          } catch {
            /* skip bad line */
          }
        }
      }
    });
    stream.on('end', () => {
      if (samples.length < limit && leftover.trim()) {
        try {
          samples.push(JSON.parse(leftover));
        } catch {
          /* ignore */
        }
      }
      resolve(samples);
    });
    stream.on('error', reject);
  });
}

async function countCsvRows(filePath) {
  const isGz = filePath.endsWith('.gz');
  const input = isGz
    ? fs.createReadStream(filePath).pipe(zlib.createGunzip())
    : fs.createReadStream(filePath);
  const rl = readline.createInterface({ input, crlfDelay: true });
  let count = 0;
  let header = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!header) {
      header = line;
      continue;
    }
    count += 1;
  }
  const columns = header ? header.split(',').map((c) => c.replace(/^"|"$/g, '')) : [];
  return { count, columns, header };
}

async function inspectCsvFile(filePath, label) {
  const stat = fs.statSync(filePath);
  info(`\n── ${label} ──`);
  info(`Path: ${path.relative(ROOT, filePath)}`);
  info(`Size: ${formatBytes(stat.size)}`);
  const { count, columns } = await countCsvRows(filePath);
  info(`Rows: ${count.toLocaleString()} (excluding header)`);
  info(`Columns (${columns.length}): ${columns.join(', ')}`);
  const samples = await readCsvSamples(filePath, 3);
  if (samples.length) {
    info('Sample rows (first 3):');
    samples.forEach((row, i) => {
      console.log(`  [${i + 1}]`, JSON.stringify(row, null, 0).slice(0, 500));
    });
  }
  return { count, columns, filePath };
}

async function readCsvSamples(filePath, limit) {
  const isGz = filePath.endsWith('.gz');
  const input = isGz
    ? fs.createReadStream(filePath).pipe(zlib.createGunzip())
    : fs.createReadStream(filePath);
  const rl = readline.createInterface({ input, crlfDelay: true });
  const rows = [];
  let header = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!header) {
      header = line.split(',').map((c) => c.replace(/^"|"$/g, ''));
      continue;
    }
    const values = line.split(',').map((c) => c.replace(/^"|"$/g, ''));
    const row = Object.fromEntries(header.map((h, i) => [h, values[i] ?? '']));
    rows.push(row);
    if (rows.length >= limit) break;
  }
  return rows;
}

async function inspectNdjsonGz(filePath, label) {
  const stat = fs.statSync(filePath);
  info(`\n── ${label} ──`);
  info(`Path: ${path.relative(ROOT, filePath)}`);
  info(`Size: ${formatBytes(stat.size)} (compressed)`);
  const count = await countNdjsonGz(filePath);
  info(`Rows: ${count.toLocaleString()} (NDJSON lines)`);
  const samples = await sampleNdjsonGz(filePath, 3);
  if (samples.length) {
    const keys = [...new Set(samples.flatMap((s) => flattenKeys(s)))].slice(0, 40);
    info(`Sample fields (flattened, up to 40): ${keys.join(', ')}`);
    info('Sample rows (first 3, truncated):');
    samples.forEach((row, i) => {
      console.log(`  [${i + 1}]`, JSON.stringify(row, null, 0).slice(0, 600));
    });
  }
  return { count, filePath, samples };
}

async function streamNdjsonFile(filePath, onRecord) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, 'utf8'),
    crlfDelay: true,
  });
  let lineCount = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    lineCount += 1;
    try {
      await onRecord(JSON.parse(line), lineCount);
    } catch {
      /* skip malformed line */
    }
  }
  return lineCount;
}

async function inspectApiTransfers(filePath, label) {
  const stat = fs.statSync(filePath);
  info(`\n── ${label} ──`);
  info(`Path: ${path.relative(ROOT, filePath)}`);
  info(`Size: ${formatBytes(stat.size)}`);
  info('Format: NDJSON (one API response object per line); streaming.');

  let transferCount = 0;
  let fileLines = 0;
  const samples = [];

  fileLines = await streamNdjsonFile(filePath, (record) => {
    const transfers = record?.response?.transfers ?? record?.transfers ?? [];
    if (!Array.isArray(transfers)) return;
    transferCount += transfers.length;
    for (const t of transfers) {
      if (samples.length < 3) samples.push(t);
      if (samples.length >= 3) break;
    }
  });

  info(`File lines: ${fileLines.toLocaleString()} (player-level API responses)`);
  info(`Transfer rows (sum of transfers[] arrays): ${transferCount.toLocaleString()}`);
  if (samples[0]) {
    const keys = flattenKeys(samples[0]);
    info(`Columns/fields (${keys.length}): ${keys.join(', ')}`);
    info('Sample transfer objects (first 3, truncated):');
    samples.forEach((row, i) => {
      console.log(`  [${i + 1}]`, JSON.stringify(row, null, 0).slice(0, 600));
    });
  }
  return { count: transferCount, filePath };
}

async function inspectApiMarketValues(filePath, label) {
  const stat = fs.statSync(filePath);
  info(`\n── ${label} ──`);
  info(`Path: ${path.relative(ROOT, filePath)}`);
  info(`Size: ${formatBytes(stat.size)}`);
  info('Format: NDJSON (one API response per line); streaming.');

  let valuationPoints = 0;
  let fileLines = 0;
  const samples = [];

  fileLines = await streamNdjsonFile(filePath, (record) => {
    const list =
      record?.response?.list ??
      record?.response?.market_values ??
      record?.response?.marketValueDevelopment ??
      record?.market_values ??
      (Array.isArray(record?.response) ? record.response : null);
    if (!list) return;
    const arr = Array.isArray(list) ? list : [list];
    valuationPoints += arr.length;
    for (const item of arr) {
      if (samples.length < 3) samples.push(item);
      if (samples.length >= 3) break;
    }
  });

  info(`File lines: ${fileLines.toLocaleString()} (player-level API responses)`);
  info(`Valuation points (sum across lines): ${valuationPoints.toLocaleString()}`);
  if (samples[0]) {
    const keys = flattenKeys(samples[0]);
    info(`Columns/fields (${keys.length}): ${keys.join(', ')}`);
    info('Sample valuation objects (first 3, truncated):');
    samples.forEach((row, i) => {
      console.log(`  [${i + 1}]`, JSON.stringify(row, null, 0).slice(0, 600));
    });
  }
  return { count: valuationPoints, filePath };
}

async function inspectCompetitionsJson(filePath, label) {
  const stat = fs.statSync(filePath);
  info(`\n── ${label} ──`);
  info(`Path: ${path.relative(ROOT, filePath)}`);
  info(`Size: ${formatBytes(stat.size)}`);
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, 'utf8'),
    crlfDelay: true,
  });
  let count = 0;
  const samples = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    count += 1;
    if (samples.length < 3) {
      try {
        samples.push(JSON.parse(line));
      } catch {
        /* skip */
      }
    }
  }
  info(`Rows: ${count.toLocaleString()} (NDJSON lines)`);
  if (samples.length) {
    const keys = [...new Set(samples.flatMap((s) => flattenKeys(s)))].slice(0, 35);
    info(`Sample fields: ${keys.join(', ')}`);
    info('Sample rows (first 3, truncated):');
    samples.forEach((row, i) => {
      console.log(`  [${i + 1}]`, JSON.stringify(row, null, 0).slice(0, 600));
    });
  }
  return { count, filePath };
}

function findCuratedCsv(basename) {
  const candidates = [
    path.join(DATA_DIR, basename),
    path.join(DATA_DIR, `${basename}.gz`),
    path.join(DATA_DIR, 'prep', basename),
    path.join(TM_ROOT, basename),
    path.join(TM_ROOT, 'dbt', 'duckdb', basename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const all = walkFiles(TM_ROOT);
  return all.find((f) => path.basename(f) === basename || path.basename(f) === `${basename}.gz`);
}

function latestYearDir(baseDir) {
  if (!fs.existsSync(baseDir)) return null;
  const years = fs
    .readdirSync(baseDir)
    .filter((n) => /^\d{4}$/.test(n))
    .map(Number)
    .sort((a, b) => b - a);
  return years.length ? String(years[0]) : null;
}

function resolveRawTable(key, year) {
  const y = year ?? latestYearDir(SCRAPER_DIR);
  const apiYear = year ?? latestYearDir(API_DIR);
  switch (key) {
    case 'players':
      return y ? path.join(SCRAPER_DIR, y, 'players.json.gz') : null;
    case 'clubs':
      return y ? path.join(SCRAPER_DIR, y, 'clubs.json.gz') : null;
    case 'competitions':
      return fs.existsSync(path.join(DATA_DIR, 'competitions.json'))
        ? path.join(DATA_DIR, 'competitions.json')
        : null;
    case 'transfers':
      return apiYear ? path.join(API_DIR, apiYear, 'transfers.json') : null;
    case 'appearances':
      return y ? path.join(SCRAPER_DIR, y, 'appearances.json.gz') : null;
    case 'games':
      return y ? path.join(SCRAPER_DIR, y, 'games.json.gz') : null;
    case 'valuations':
      return apiYear ? path.join(API_DIR, apiYear, 'market_values.json') : null;
    default:
      return null;
  }
}

async function main() {
  section('Transfermarkt dataset inspection');
  info(`Project root: ${ROOT}`);
  info(`Dataset root: ${path.relative(ROOT, TM_ROOT)}`);

  if (!fs.existsSync(TM_ROOT)) {
    warn(`Missing ${path.relative(ROOT, TM_ROOT)} — clone or add raw-data first.`);
    process.exit(1);
  }

  section('DVC pointer check');
  for (const name of ['transfermarkt-scraper', 'transfermarkt-api']) {
    const dvcFile = path.join(RAW_DIR, `${name}.dvc`);
    const dataDir = path.join(RAW_DIR, name);
    if (!fs.existsSync(dvcFile)) {
      warn(`Missing ${path.relative(ROOT, dvcFile)}`);
      continue;
    }
    if (isDvcPointer(dvcFile)) {
      const hasData = fs.existsSync(dataDir) && fs.readdirSync(dataDir).length > 0;
      if (hasData) {
        info(`✓ ${name}: .dvc present, data directory populated (${path.relative(ROOT, dataDir)})`);
      } else {
        warn(`${name}: .dvc pointer only — run: cd raw-data/transfermarkt-datasets && dvc pull`);
      }
    }
  }

  section('Curated CSV files (dbt export / zip — expected for FootyBrain import)');
  let curatedFound = 0;
  for (const csv of CURATED_CSV_NAMES) {
    const found = findCuratedCsv(csv);
    if (found) {
      curatedFound += 1;
      info(`✓ ${csv} → ${path.relative(ROOT, found)}`);
    } else {
      warn(`Missing curated ${csv} (not in repo; download zip or run dbt export)`);
    }
  }
  if (curatedFound === 0) {
    warn('No curated CSV tables on disk — inspecting RAW scraper/API files instead.');
  }

  section('Important files under data/raw/transfermarkt-scraper');
  if (fs.existsSync(SCRAPER_DIR)) {
    const files = walkFiles(SCRAPER_DIR).filter((f) => !f.endsWith('.dvc'));
    const byType = {};
    for (const f of files) {
      const base = path.basename(f);
      byType[base] = (byType[base] || 0) + 1;
    }
    info(`Total files: ${files.length}`);
    info('File types (count across seasons):');
    Object.entries(byType)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([name, n]) => info(`  ${name}: ${n} season file(s)`));
    const latest = latestYearDir(SCRAPER_DIR);
    info(`Latest scraper season folder: ${latest ?? 'none'}`);
  } else {
    warn(`Missing ${path.relative(ROOT, SCRAPER_DIR)}`);
  }

  section('Important files under data/raw/transfermarkt-api');
  if (fs.existsSync(API_DIR)) {
    const files = walkFiles(API_DIR);
    const byType = {};
    for (const f of files) {
      const base = path.basename(f);
      byType[base] = (byType[base] || 0) + 1;
    }
    info(`Total files: ${files.length}`);
    Object.entries(byType)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([name, n]) => info(`  ${name}: ${n} season file(s)`));
    const latest = latestYearDir(API_DIR);
    info(`Latest API season folder: ${latest ?? 'none'}`);
  } else {
    warn(`Missing ${path.relative(ROOT, API_DIR)}`);
  }

  const scraperYear = latestYearDir(SCRAPER_DIR);
  const apiYear = latestYearDir(API_DIR);
  info(`\nInspection year: scraper=${scraperYear ?? 'n/a'}, api=${apiYear ?? 'n/a'}`);

  section('Table inspection (curated CSV if present, else latest raw files)');

  for (const { key, label } of INSPECT_TABLES) {
    const csvName = key === 'valuations' ? 'player_valuations.csv' : `${key}.csv`;
    const curated = findCuratedCsv(csvName);

    try {
      if (curated && fs.existsSync(curated)) {
        await inspectCsvFile(curated, `${label} (curated CSV)`);
        continue;
      }

      const rawPath = resolveRawTable(key);
      if (!rawPath || !fs.existsSync(rawPath)) {
        warn(`${label}: no curated CSV and no raw file found.`);
        continue;
      }

      if (rawPath.endsWith('.json.gz')) {
        await inspectNdjsonGz(rawPath, `${label} (raw scraper NDJSON.gz)`);
      } else if (rawPath.endsWith('transfers.json')) {
        await inspectApiTransfers(rawPath, `${label} (raw API JSON)`);
      } else if (rawPath.endsWith('market_values.json')) {
        await inspectApiMarketValues(rawPath, `${label} (raw API JSON)`);
      } else if (rawPath.endsWith('competitions.json')) {
        await inspectCompetitionsJson(rawPath, `${label} (acquisition NDJSON)`);
      }
    } catch (err) {
      warn(`${label}: inspection failed — ${err.message}`);
    }
  }

  section('Likely fields for FootyBrain (from PROJECT_BRIEF)');
  for (const [table, fields] of Object.entries(FOOTYBRAIN_FIELDS)) {
    info(`\n${table}:`);
    fields.forEach((f) => info(`  • ${f}`));
  }

  section('Summary');
  info('Curated CSVs are the intended import source after dbt/zip export.');
  info('Current workspace has RAW per-season .json.gz (scraper) and .json (API) under data/raw/.');
  info('Use a build script to map TM IDs → FootyBrain slugs; keep quickFact/quizHints editorial.');
  info('Do not bundle raw files or image_url into the React app.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
