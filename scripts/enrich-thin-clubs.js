#!/usr/bin/env node
/**
 * Enrich thin / placeholder club profiles (fact-locked overlays).
 * Merges into src/data/teamEditorialOverlays.json without removing premium club entries.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildClubOverlay,
  isPlaceholderClubCopy,
} from './lib/clubOverlayBuilders.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PRIORITY_LEAGUES = new Set([
  'premier-league',
  'la-liga',
  'bundesliga',
  'serie-a',
  'ligue-1',
  'eredivisie',
  'mls',
  'brasileirao',
]);

function rosterImportanceSum(players, teamId) {
  return players
    .filter((p) => p.teamId === teamId)
    .reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
}

async function main() {
  const TOP_N = Number(process.env.THIN_CLUBS_N ?? 55) || 55;
  const mod = await import(path.join(ROOT, 'src/data/sampleData.js'));
  const { teams, players, leagues, getLeagueName } = mod;
  const { isMajorClub, isThinTeam } = await import(
    path.join(ROOT, 'src/utils/entityDepthAudit.js')
  );

  const leagueById = new Map((leagues ?? []).map((l) => [l.id, l]));

  const candidates = (teams ?? [])
    .filter(isMajorClub)
    .map((team) => {
      const rosterSize = players.filter((p) => p.teamId === team.id).length;
      const sum = rosterImportanceSum(players, team.id);
      const placeholder = isPlaceholderClubCopy(team);
      const thin = isThinTeam(team, 3);
      let score = sum;
      if (placeholder) score += 3000;
      if (thin) score += 800;
      if (PRIORITY_LEAGUES.has(team.leagueId)) score += 400;
      return { team, rosterSize, sum, placeholder, thin, score };
    })
    .filter((row) => row.placeholder || row.thin)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N);

  const outPath = path.join(ROOT, 'src/data/teamEditorialOverlays.json');
  let existing = { overlays: {} };
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  const overlays = { ...(existing.overlays ?? {}) };
  let added = 0;
  let updated = 0;

  for (const { team, rosterSize } of candidates) {
    const leagueName = getLeagueName(team.leagueId);
    const league = leagueById.get(team.leagueId) ?? null;
    const next = buildClubOverlay(team, leagueName, league, players, rosterSize);
    const had = Boolean(overlays[team.id]);
    overlays[team.id] = { ...(overlays[team.id] ?? {}), ...next };
    if (had) updated += 1;
    else added += 1;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    overlayCount: Object.keys(overlays).length,
    thinClubPass: { added, updated, targeted: candidates.length },
    overlays,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    `Wrote ${path.relative(ROOT, outPath)} — ${candidates.length} thin clubs (${added} new, ${updated} merged)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
