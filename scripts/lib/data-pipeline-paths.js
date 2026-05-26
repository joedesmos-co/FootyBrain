/**
 * Canonical paths and expansion club config loading for the data pipeline.
 * Import from merge, preview build, and validation scripts — avoid duplicating paths.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../..');

export const DATA_PATHS = {
  manualOverlay: path.join(REPO_ROOT, 'editorial-overlays/players.manual.json'),
  draftOverlay: path.join(REPO_ROOT, 'editorial-overlays/players.generated-draft.json'),
  expansionIdentityStubs: path.join(
    REPO_ROOT,
    'editorial-overlays/expansion-club-identity-stubs.json',
  ),
  tmPreview: path.join(REPO_ROOT, 'generated-data/footybrain-preview-data.json'),
  appReadyPreview: path.join(REPO_ROOT, 'generated-data/footybrain-app-ready-preview.json'),
  sampleData: path.join(REPO_ROOT, 'src/data/sampleData.js'),
  phase1Clubs: path.join(REPO_ROOT, 'editorial-overlays/phase1-clubs.json'),
  phase2Clubs: path.join(REPO_ROOT, 'editorial-overlays/phase2-clubs.json'),
  phase3Clubs: path.join(REPO_ROOT, 'editorial-overlays/phase3-clubs.json'),
  phase4LegacyClubs: path.join(REPO_ROOT, 'editorial-overlays/phase4-clubs.json'),
  phase4MlsClubs: path.join(REPO_ROOT, 'editorial-overlays/phase4-mls-clubs.json'),
  phase4BrasileiraoClubs: path.join(
    REPO_ROOT,
    'editorial-overlays/phase4-brasileirao-clubs.json',
  ),
};

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadOptionalJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return loadJson(filePath);
}

/**
 * Load phase club/league configs in merge order.
 * @param {{ mlsOnly?: boolean }} [options]
 * @returns {{ clubs: object[], leagues: object[], sources: string[], duplicateTeamIds: string[] }}
 */
export function loadExpansionClubConfigs(options = {}) {
  const { mlsOnly = false } = options;
  const entries = [
    { path: DATA_PATHS.phase1Clubs, required: true, label: 'phase1' },
    { path: DATA_PATHS.phase2Clubs, required: false, label: 'phase2' },
    { path: DATA_PATHS.phase3Clubs, required: false, label: 'phase3' },
    { path: DATA_PATHS.phase4MlsClubs, required: false, label: 'phase4-mls' },
    {
      path: DATA_PATHS.phase4BrasileiraoClubs,
      required: false,
      label: 'phase4-brasileirao',
      skip: mlsOnly,
    },
  ];

  const clubs = [];
  const leagues = [];
  const sources = [];
  const teamIdSources = new Map();

  for (const entry of entries) {
    if (entry.skip) continue;
    if (entry.required && !fs.existsSync(entry.path)) {
      throw new Error(`Missing required expansion config: ${entry.path}`);
    }
    const config = loadOptionalJson(entry.path, { clubs: [], leagues: [] });
    if (!fs.existsSync(entry.path) && !entry.required) continue;

    sources.push(entry.label);
    for (const club of config.clubs ?? []) {
      const teamId = club.footybrainTeamId;
      if (!teamId) continue;
      if (!teamIdSources.has(teamId)) teamIdSources.set(teamId, []);
      teamIdSources.get(teamId).push(entry.label);
      clubs.push(club);
    }
    for (const league of config.leagues ?? []) {
      leagues.push(league);
    }
  }

  const duplicateTeamIds = [...teamIdSources.entries()]
    .filter(([, labels]) => labels.length > 1)
    .map(([teamId]) => teamId);

  return { clubs, leagues, sources, duplicateTeamIds };
}
