#!/usr/bin/env node
/**
 * Controlled expansion: write curated players + teams into sampleData.js.
 * Preserves MVP editorial content; adds browseable generated squad rows.
 *
 * Run after: build:data-preview → build:app-ready-preview
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  players as mvpPlayers,
  teams as mvpTeams,
  leagues as mvpLeagues,
} from '../src/data/sampleData.js';
import { curatePhase1PreviewPlayers, EXPANSION_LIMITS } from './phase1-curation.js';
import {
  buildCurrentClubCareer,
  buildGeneratedPlayingStyle,
  buildGeneratedQuickFact,
} from './generated-player-facts.js';
import { DATA_PATHS, loadExpansionClubConfigs } from './lib/data-pipeline-paths.js';
import {
  injectRequiredTmPlayers,
  loadGeneratedDraftSourceIds,
  loadRequiredImportSourceIds,
} from './lib/expansion-player-cap.js';
import {
  applyCuratedTmCap,
  applyGeneratedBaseCap,
  getPlayerHardCap,
} from './lib/player-cap-policy.js';
import { checkMergePlayerIntegrity } from './lib/merge-player-integrity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PREVIEW_PATH = DATA_PATHS.tmPreview;
const APP_READY_PATH = DATA_PATHS.appReadyPreview;
const EXPANSION_IDENTITY_STUBS_PATH = DATA_PATHS.expansionIdentityStubs;
const SAMPLE_PATH = DATA_PATHS.sampleData;
const DATASET_META_PATH = path.join(ROOT, 'src/data/datasetMeta.js');
const EXPANSION_CLUB_PLACEHOLDER = 'controlled expansion club set';
const OVERLAY_PATH = DATA_PATHS.manualOverlay;
const REQUIRED_IMPORTS_PATH = path.join(ROOT, 'editorial-overlays/required-import-sourceIds.json');
const EXTERNAL_CLUB_STUBS_PATH = path.join(ROOT, 'editorial-overlays/external-club-stubs.json');
const DATA_AS_OF = '2026-05-25';

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadOptionalJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return loadJson(filePath);
}

function loadExternalClubStubs() {
  const stubs = loadOptionalJson(EXTERNAL_CLUB_STUBS_PATH, { leagues: [], teams: [] });
  return {
    leagues: Array.isArray(stubs.leagues) ? stubs.leagues : [],
    teams: Array.isArray(stubs.teams) ? stubs.teams : [],
  };
}

function ageFromDateOfBirth(dateOfBirth, asOf = new Date(DATA_AS_OF)) {
  if (!dateOfBirth) return null;
  const [y, m, d] = dateOfBirth.split('-').map(Number);
  if (!y || !m || !d) return null;
  const born = new Date(y, m - 1, d);
  let age = asOf.getFullYear() - born.getFullYear();
  const md = asOf.getMonth() - born.getMonth();
  if (md < 0 || (md === 0 && asOf.getDate() < born.getDate())) age -= 1;
  return age;
}

function leagueCountry(leagueId) {
  const map = {
    'premier-league': 'England',
    'la-liga': 'Spain',
    'bundesliga': 'Germany',
    'serie-a': 'Italy',
    'ligue-1': 'France',
    eredivisie: 'Netherlands',
    mls: 'United States',
    brasileirao: 'Brazil',
  };
  return map[leagueId] ?? 'Europe';
}

function stripRuntimeFields(player) {
  const { imageUrl, visualTheme, ...rest } = player;
  return rest;
}

function buildGeneratedBasePlayer(row, clubIndex, teamName, leagueName) {
  const age = row.age ?? ageFromDateOfBirth(row.dateOfBirth);
  const fallbackImportanceScore = 48 + Math.max(0, 6 - (clubIndex % 7));
  const hasApprovedEditorial = row.dataStatus === 'generated-editorial-approved';
  const careerHistory =
    hasApprovedEditorial && Array.isArray(row.careerHistory) && row.careerHistory.length > 0
      ? row.careerHistory
      : [];

  return {
    id: row.id,
    name: row.name,
    dateOfBirth: row.dateOfBirth ?? null,
    age: age ?? 25,
    position: row.position ?? 'Player',
    teamId: row.teamId,
    leagueId: row.leagueId,
    nationalTeam: row.nationalTeam ?? row.nationality ?? '—',
    nationality: row.nationality ?? '—',
    importanceScore: hasApprovedEditorial ? row.importanceScore : fallbackImportanceScore,
    // Browse-only rows stay out of quiz by default; keep content fields empty to
    // reduce `sampleData` size on mobile until an editorial pass promotes them.
    quickFact: hasApprovedEditorial ? row.quickFact : '',
    playingStyle: hasApprovedEditorial ? row.playingStyle : '',
    careerHistory,
    quizHints: hasApprovedEditorial ? row.quizHints : [],
    quizEligible: hasApprovedEditorial ? true : false,
    rosterTier: hasApprovedEditorial ? 'featured' : 'squad',
    dataStatus: row.dataStatus ?? 'generated-needs-editorial',
  };
}

/** Brasileirão merge policy: browse/search/compare unless explicitly editorial-approved. */
function applyLeagueQuizPolicy(player) {
  if (player.leagueId !== 'brasileirao') return player;
  if (player.dataStatus === 'generated-editorial-approved') return player;
  return {
    ...player,
    quizEligible: false,
    rosterTier: 'squad',
    dataStatus: player.dataStatus ?? 'generated-needs-editorial',
  };
}

function loadExpansionIdentityStubs() {
  const file = loadOptionalJson(EXPANSION_IDENTITY_STUBS_PATH, { teams: {} });
  return file.teams ?? {};
}

function buildTeamFromConfig(club, mvpTeamById, previewTeamById, expansionIdentityStubs) {
  const mvp = mvpTeamById.get(club.footybrainTeamId);
  const externalStub = expansionIdentityStubs[club.footybrainTeamId] ?? {};
  const mergedStub = { ...externalStub, ...(club.stub ?? {}) };
  const preview = previewTeamById.get(club.footybrainTeamId);
  const stub = mergedStub;
  const base = mvp ? stripTeamRuntime(mvp) : {};
  const leagueId = club.leagueId ?? preview?.footybrainLeagueId ?? base.leagueId ?? inferLeagueId(club);
  const isExpansionLeague = leagueId === 'mls' || leagueId === 'brasileirao';

  if (mvp && !club.stub && Object.keys(mergedStub).length === 0 && !isExpansionLeague) {
    return stripTeamRuntime(mvp);
  }
  let identityTags = stub.identityTags ?? base.identityTags ?? [];
  if (identityTags.length === 0 && isExpansionLeague) {
    identityTags =
      leagueId === 'brasileirao' ? ['fan-culture', 'technical'] : ['fan-culture'];
  }
  const team = {
    id: club.footybrainTeamId,
    name: club.label,
    leagueId,
    country: leagueCountry(leagueId),
    stadium: stub.stadium ?? preview?.stadium ?? base.stadium ?? '—',
    founded: stub.founded ?? base.founded ?? 1900,
    rivals: stub.rivals ?? base.rivals ?? [],
    shortHistory:
      stub.shortHistory ??
      base.shortHistory ??
      `${club.label} is in the FootyBrain ${EXPANSION_CLUB_PLACEHOLDER}.`,
    fanGuide:
      stub.fanGuide ??
      base.fanGuide ??
      `Learn ${club.label}'s colours and main rivalries as editorial coverage expands.`,
    legends: stub.legends ?? base.legends ?? [],
    currentKeyPlayers: stub.currentKeyPlayers ?? base.currentKeyPlayers ?? [],
    manager: stub.manager ?? base.manager ?? null,
    identityTags,
  };
  if (
    team.shortHistory.includes(EXPANSION_CLUB_PLACEHOLDER) &&
    team.identityTags.length === 0
  ) {
    team.identityTags =
      leagueId === 'brasileirao' ? ['fan-culture', 'technical'] : ['fan-culture'];
  }
  return team;
}

function stripTeamRuntime(team) {
  const { crestUrl, badgeTheme, ...rest } = team;
  return rest;
}

function inferLeagueId(club) {
  if (club.leagueId) return club.leagueId;
  const id = club.footybrainTeamId;
  const pl = new Set([
    'manchester-city',
    'arsenal',
    'liverpool',
    'chelsea',
    'manchester-united',
    'tottenham',
    'newcastle',
    'aston-villa',
  ]);
  const laliga = new Set(['real-madrid', 'barcelona', 'atletico-madrid', 'sevilla']);
  const bundes = new Set([
    'bayern-munich',
    'borussia-dortmund',
    'bayer-leverkusen',
    'rb-leipzig',
    'eintracht-frankfurt',
  ]);
  const ligue1 = new Set([
    'paris-saint-germain',
    'marseille',
    'lyon',
    'monaco',
    'lille',
  ]);
  const eredivisie = new Set(['ajax', 'psv', 'feyenoord', 'az-alkmaar', 'fc-twente']);
  if (pl.has(id)) return 'premier-league';
  if (laliga.has(id)) return 'la-liga';
  if (bundes.has(id)) return 'bundesliga';
  if (ligue1.has(id)) return 'ligue-1';
  if (eredivisie.has(id)) return 'eredivisie';
  return 'serie-a';
}

function buildLeagues(expansionLeagues) {
  const leagueById = new Map(
    mvpLeagues.map((league) => {
      const { logoUrl, badgeTheme, ...rest } = league;
      return [rest.id, rest];
    }),
  );

  for (const league of expansionLeagues) {
    if (!league.id) continue;
    const appLeague = { ...league };
    delete appLeague.tmCompetitionCode;
    leagueById.set(league.id, {
      ...(leagueById.get(league.id) ?? {}),
      ...appLeague,
    });
  }

  return [...leagueById.values()];
}

function serializeValue(value, indent) {
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const inner = value
      .map((item) => `${indent}  ${serializeValue(item, `${indent}  `)}`)
      .join(',\n');
    return `[\n${inner},\n${indent}]`;
  }
  const entries = Object.entries(value);
  const inner = entries
    .map(([k, v]) => `${indent}  ${k}: ${serializeValue(v, `${indent}  `)}`)
    .join(',\n');
  return `{\n${inner},\n${indent}}`;
}

function writeDatasetMeta({ dataAsOf, playerCount, teamCount, leagueCount, quizEligibleCount }) {
  const body = `/**
 * Lightweight dataset stats for shell UI (no player rows).
 * Regenerated by scripts/merge-phase1-sample-data.js on each merge.
 */
export const DATASET_META = {
  dataAsOf: '${dataAsOf}',
  playerCount: ${playerCount},
  teamCount: ${teamCount},
  leagueCount: ${leagueCount},
  quizEligibleCount: ${quizEligibleCount},
};
`;
  fs.writeFileSync(DATASET_META_PATH, body, 'utf8');
}

function serializeObjectArray(name, items, indent = '') {
  const blocks = items.map((item) => `${indent}  ${serializeValue(item, `${indent}  `)}`);
  return `${indent}const ${name} = [\n${blocks.join(',\n')},\n${indent}];`;
}

function main() {
  const mlsOnlyMerge = process.argv.includes('--mls-only');

  if (!fs.existsSync(PREVIEW_PATH)) {
    console.error(`Missing ${PREVIEW_PATH} — run npm run build:data-preview`);
    process.exit(1);
  }
  if (!fs.existsSync(APP_READY_PATH)) {
    console.error(`Missing ${APP_READY_PATH} — run npm run build:app-ready-preview`);
    process.exit(1);
  }

  const expansion = loadExpansionClubConfigs({ mlsOnly: mlsOnlyMerge });
  const expansionClubs = expansion.clubs;
  const expansionLeagues = expansion.leagues;
  if (expansion.duplicateTeamIds.length) {
    console.error(
      `Duplicate footybrainTeamId in phase configs: ${expansion.duplicateTeamIds.join(', ')}`,
    );
    process.exit(1);
  }
  if (mlsOnlyMerge) {
    console.log('MLS-only merge: phase4 Brasileirão clubs/leagues omitted from expansion config.');
  }
  console.log(`Expansion config sources: ${expansion.sources.join(', ')}`);
  const preview = loadJson(PREVIEW_PATH);
  const appReady = loadJson(APP_READY_PATH);
  const overlay = fs.existsSync(OVERLAY_PATH) ? loadJson(OVERLAY_PATH) : { players: [] };
  const manualMvpIds = new Set(overlay.players.map((p) => p.id));
  const reservedSourceIds = new Set(
    appReady.players
      .filter((p) => p.sourceId && manualMvpIds.has(p.id))
      .map((p) => String(p.sourceId)),
  );

  const requiredDraftSourceIds = loadGeneratedDraftSourceIds(DATA_PATHS.draftOverlay);
  const requiredImportSourceIds = loadRequiredImportSourceIds(REQUIRED_IMPORTS_PATH);
  const requiredSourceIds = new Set([...requiredDraftSourceIds, ...requiredImportSourceIds]);
  const tmBySourceId = new Map(preview.players.map((p) => [String(p.sourceId), p]));

  const appReadyBySource = new Map(
    appReady.players.filter((p) => p.sourceId).map((p) => [String(p.sourceId), p]),
  );

  const overlayById = new Map(overlay.players.map((p) => [p.id, p]));

  const mvpBase = mvpPlayers
    .filter((player) => manualMvpIds.has(player.id))
    .map((player) => {
      const base = stripRuntimeFields(player);
      const ov = overlayById.get(player.id);
      return {
        ...base,
        quizEligible: ov?.quizEligible !== false,
      };
    });

  // Block generated players whose display name exactly matches an MVP player.
  // Handles null-sourceId MVPs (e.g. 'trent') who appear in TM data at their
  // new club — without this guard they produce a duplicate name in the dataset.
  const reservedPlayerNames = new Set(
    mvpBase.map((p) => (p.name ?? '').trim().toLowerCase()),
  );

  let curatedTm = curatePhase1PreviewPlayers(
    preview.players,
    reservedSourceIds,
    ageFromDateOfBirth,
  );
  curatedTm = injectRequiredTmPlayers(curatedTm, {
    requiredSourceIds,
    tmBySourceId,
    reservedSourceIds,
  });
  const hardCap = getPlayerHardCap();
  const maxSquadRows = Math.max(0, hardCap - mvpBase.length);
  const { curatedTm: cappedCuratedTm } = applyCuratedTmCap(curatedTm, {
    maxSquadRows,
    requiredSourceIds,
    label: 'merge:phase3-sample curated TM',
  });
  curatedTm = cappedCuratedTm;

  const mvpTeamById = new Map(mvpTeams.map((t) => [t.id, t]));
  const previewTeamById = new Map(
    (preview.teams ?? []).map((t) => [t.footybrainTeamId, t]),
  );

  const expansionIdentityStubs = loadExpansionIdentityStubs();
  const baseTeams = expansionClubs.map((club) =>
    buildTeamFromConfig(club, mvpTeamById, previewTeamById, expansionIdentityStubs),
  );

  const externalStubs = loadExternalClubStubs();
  const baseLeagues = buildLeagues(expansionLeagues);
  for (const league of externalStubs.leagues) {
    if (!league?.id || !league?.name) continue;
    if (!baseLeagues.find((l) => l.id === league.id)) {
      baseLeagues.push(league);
    }
  }

  for (const team of externalStubs.teams) {
    if (!team?.id || !team?.name || !team?.leagueId) continue;
    if (!baseTeams.find((t) => t.id === team.id)) {
      baseTeams.push(team);
    }
  }

  const teamNameById = new Map(baseTeams.map((t) => [t.id, t.name]));
  const leagueNameById = new Map(baseLeagues.map((l) => [l.id, l.name]));
  for (const club of expansionClubs) {
    teamNameById.set(club.footybrainTeamId, club.label);
  }

  const clubPickIndex = new Map();
  const generatedBase = [];

  for (const tm of curatedTm) {
    const merged = appReadyBySource.get(String(tm.sourceId));
    if (!merged) continue;
    const mergedName = (merged.name ?? merged.displayName ?? '').trim().toLowerCase();
    if (reservedPlayerNames.has(mergedName)) continue; // skip: MVP already covers this player
    const idx = clubPickIndex.get(tm.footybrainTeamId) ?? 0;
    clubPickIndex.set(tm.footybrainTeamId, idx + 1);
    generatedBase.push(
      applyLeagueQuizPolicy(
        buildGeneratedBasePlayer(
          merged,
          idx,
          teamNameById.get(merged.teamId) ?? 'Unknown',
          leagueNameById.get(merged.leagueId) ?? '',
        ),
      ),
    );
  }

  const maxGenerated = Math.max(0, hardCap - mvpBase.length);
  const {
    players: trimmedGenerated,
    priorityCount,
    browseCount,
    trimmedBrowse,
  } = applyGeneratedBaseCap(generatedBase, maxGenerated, 'merge:phase3-sample generated base');

  const allBasePlayers = [...mvpBase, ...trimmedGenerated];

  const integrity = checkMergePlayerIntegrity(allBasePlayers);
  for (const warning of integrity.warnings) {
    console.warn(`merge integrity warning: ${warning}`);
  }
  if (!integrity.ok) {
    console.error('Merge blocked — player integrity check failed:');
    integrity.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const header = `// Local sample data for FootyBrain MVP.
// Future: replace with API/Firebase fetch — see fetchPlayers(), fetchTeams() stubs at bottom.
// Full squad expansion (${DATA_AS_OF}): ${baseLeagues.length} leagues, ${baseTeams.length} clubs, ${allBasePlayers.length} players (${mvpBase.length} editorial + ${trimmedGenerated.length} squad listings).

`;

  const leagueThemes = `const leagueBadgeThemes = [
  { from: '#22c55e', to: '#134e4a', accent: '#dcfce7' },
  { from: '#f97316', to: '#7f1d1d', accent: '#ffedd5' },
  { from: '#ef4444', to: '#111827', accent: '#fee2e2' },
  { from: '#38bdf8', to: '#1e3a8a', accent: '#e0f2fe' },
];
`;

  const teamThemes = `const teamBadgeThemes = [
  { from: '#0f9f6e', to: '#14532d', accent: '#d1fae5' },
  { from: '#e11d48', to: '#7f1d1d', accent: '#ffe4e6' },
  { from: '#0891b2', to: '#164e63', accent: '#cffafe' },
  { from: '#f59e0b', to: '#78350f', accent: '#fffbeb' },
  { from: '#2563eb', to: '#172554', accent: '#dbeafe' },
  { from: '#7c3aed', to: '#3b0764', accent: '#ede9fe' },
  { from: '#dc2626', to: '#111827', accent: '#fee2e2' },
  { from: '#0f172a', to: '#1d4ed8', accent: '#bfdbfe' },
];
`;

  const playerThemes = `const playerVisualThemes = [
  { from: '#22c55e', to: '#0f766e', accent: '#bbf7d0' },
  { from: '#38bdf8', to: '#1d4ed8', accent: '#e0f2fe' },
  { from: '#f97316', to: '#be123c', accent: '#ffedd5' },
  { from: '#a78bfa', to: '#4338ca', accent: '#ede9fe' },
  { from: '#facc15', to: '#b45309', accent: '#fef9c3' },
  { from: '#fb7185', to: '#9f1239', accent: '#ffe4e6' },
  { from: '#2dd4bf', to: '#155e75', accent: '#ccfbf1' },
  { from: '#94a3b8', to: '#334155', accent: '#f8fafc' },
];
`;

  const body = [
    header.trim(),
    '',
    leagueThemes,
    serializeObjectArray('baseLeagues', baseLeagues),
    '',
    `// TODO: Replace null logoUrl values only with licensed league marks or approved original artwork.
export const leagues = baseLeagues.map((league, index) => ({
  logoUrl: null,
  badgeTheme: leagueBadgeThemes[index % leagueBadgeThemes.length],
  ...league,
}));`,
    '',
    teamThemes,
    serializeObjectArray('baseTeams', baseTeams),
    '',
    `// TODO: Replace null crestUrl values only with licensed club crest assets.
export const teams = baseTeams.map((team, index) => ({
  crestUrl: null,
  badgeTheme: teamBadgeThemes[index % teamBadgeThemes.length],
  ...team,
}));`,
    '',
    playerThemes,
    serializeObjectArray('basePlayers', allBasePlayers),
    '',
    `// Player images: see PLAYER_IMAGE_POLICY.md — set imageUrl + attribution on basePlayers when licensed.
export const players = basePlayers.map((player, index) => ({
  ...player,
  imageUrl: player.imageUrl ?? null,
  imageAlt: player.imageAlt ?? null,
  imageCredit: player.imageCredit ?? null,
  imageSource: player.imageSource ?? null,
  imageLicense: player.imageLicense ?? null,
  visualTheme: playerVisualThemes[index % playerVisualThemes.length],
}));`,
    '',
    `// Indexed lookups for ~2k+ row datasets (rebuilt on each merge).
const playerById = new Map(players.map((p) => [p.id, p]));
const teamById = new Map(teams.map((t) => [t.id, t]));
const leagueById = new Map(leagues.map((l) => [l.id, l]));
const playersByTeamId = new Map();
const playersByLeagueId = new Map();
for (const player of players) {
  const teamBucket = playersByTeamId.get(player.teamId);
  if (teamBucket) teamBucket.push(player);
  else playersByTeamId.set(player.teamId, [player]);

  const leagueBucket = playersByLeagueId.get(player.leagueId);
  if (leagueBucket) leagueBucket.push(player);
  else playersByLeagueId.set(player.leagueId, [player]);
}

// Helpers for local data — swap implementations when API/Firebase is wired up.
export function getPlayerById(id) {
  return playerById.get(id);
}

export function getTeamById(id) {
  return teamById.get(id);
}

export function getLeagueById(id) {
  return leagueById.get(id);
}

export function getPlayersForTeam(teamId) {
  return playersByTeamId.get(teamId) ?? [];
}

export function getPlayersForLeague(leagueId) {
  return playersByLeagueId.get(leagueId) ?? [];
}

export function getTeamName(teamId) {
  return getTeamById(teamId)?.name ?? 'Unknown';
}

export function getLeagueName(leagueId) {
  return getLeagueById(leagueId)?.name ?? 'Unknown';
}

// Future API/Firebase integration stubs:
// export async function fetchPlayers(filters) { ... }
// export async function fetchTeams() { ... }
// export async function fetchLeagues() { ... }
`,
  ].join('\n');

  fs.writeFileSync(SAMPLE_PATH, `${body}\n`, 'utf8');

  const quizEligible = allBasePlayers.filter((p) => p.quizEligible !== false).length;
  writeDatasetMeta({
    dataAsOf: DATA_AS_OF,
    playerCount: allBasePlayers.length,
    teamCount: baseTeams.length,
    leagueCount: baseLeagues.length,
    quizEligibleCount: quizEligible,
  });
  console.log(`Wrote ${path.relative(ROOT, SAMPLE_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, DATASET_META_PATH)}`);
  console.log(`Clubs: ${baseTeams.length}`);
  console.log(
    `Players: ${allBasePlayers.length} (MVP ${mvpBase.length}, generated ${trimmedGenerated.length}${trimmedGenerated.length < generatedBase.length ? `, trimmed from ${generatedBase.length} (${priorityCount} editorial-approved kept)` : ''})`,
  );
  console.log(`Quiz-eligible (flag): ${quizEligible}`);
  console.log(
    `Curated TM rows used: ${generatedBase.length} (hard cap ${hardCap}, import max ${EXPANSION_LIMITS.importMaxPerClub}/club)`,
  );
}

main();
