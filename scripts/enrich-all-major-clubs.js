#!/usr/bin/env node
/**
 * Fact-locked overlay pass for every in-league major club.
 * Merges into src/data/teamEditorialOverlays.json.
 *
 * Run: npm run enrich:all-clubs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildClubOverlay } from './lib/clubOverlayBuilders.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const mod = await import(path.join(ROOT, 'src/data/sampleData.js'));
  const { isMajorClub } = await import(path.join(ROOT, 'src/utils/entityDepthAudit.js'));
  const { teams, players, leagues, getLeagueName } = mod;
  const leagueById = new Map((leagues ?? []).map((l) => [l.id, l]));

  const targets = (teams ?? []).filter(isMajorClub);
  const outPath = path.join(ROOT, 'src/data/teamEditorialOverlays.json');
  let existing = { overlays: {} };
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  const overlays = { ...(existing.overlays ?? {}) };
  let added = 0;
  let updated = 0;

  for (const team of targets) {
    const leagueName = getLeagueName(team.leagueId);
    const league = leagueById.get(team.leagueId) ?? null;
    const rosterSize = players.filter((p) => p.teamId === team.id).length;
    const next = buildClubOverlay(team, leagueName, league, players, rosterSize);
    const had = Boolean(overlays[team.id]);
    overlays[team.id] = { ...(overlays[team.id] ?? {}), ...next };
    if (had) updated += 1;
    else added += 1;
  }

  const payload = {
    ...existing,
    generatedAt: new Date().toISOString(),
    allMajorClubsPass: { added, updated, targeted: targets.length },
    overlayCount: Object.keys(overlays).length,
    overlays,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    `Wrote ${path.relative(ROOT, outPath)} — ${targets.length} clubs (${added} new, ${updated} merged, ${payload.overlayCount} total)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
