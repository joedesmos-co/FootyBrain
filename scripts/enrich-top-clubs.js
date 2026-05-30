#!/usr/bin/env node
/**
 * Premium editorial pass for top clubs (fact-locked).
 * Merges into src/data/teamEditorialOverlays.json without removing thin-club entries.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildClubOverlay } from './lib/clubOverlayBuilders.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const premiumIdsPath = path.join(ROOT, 'src/data/premiumClubIds.js');
  const premiumMod = await import(premiumIdsPath);
  const focus = premiumMod.PREMIUM_EDITORIAL_CLUB_IDS ?? [];

  const mod = await import(path.join(ROOT, 'src/data/sampleData.js'));
  const { teams, players, leagues, getLeagueName } = mod;
  const byId = new Map((teams ?? []).map((t) => [t.id, t]));
  const leagueById = new Map((leagues ?? []).map((l) => [l.id, l]));

  const outPath = path.join(ROOT, 'src/data/teamEditorialOverlays.json');
  let existing = { overlays: {} };
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  const overlays = { ...(existing.overlays ?? {}) };
  let updated = 0;

  for (const id of focus) {
    const team = byId.get(id);
    if (!team) {
      console.warn(`Skip missing club id: ${id}`);
      continue;
    }
    const leagueName = getLeagueName(team.leagueId);
    const league = leagueById.get(team.leagueId) ?? null;
    const rosterSize = players.filter((p) => p.teamId === team.id).length;
    overlays[team.id] = {
      ...(overlays[team.id] ?? {}),
      ...buildClubOverlay(team, leagueName, league, players, rosterSize),
    };
    updated += 1;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    overlayCount: Object.keys(overlays).length,
    premiumClubPass: { updated, targeted: focus.length },
    overlays,
  };
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, outPath)} (${updated} premium clubs merged, ${payload.overlayCount} total)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
