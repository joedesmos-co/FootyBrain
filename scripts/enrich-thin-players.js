#!/usr/bin/env node
/**
 * Enrich high-importance browse-only players (fact-locked overlays).
 * Merges into src/data/playerEditorialOverlays.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildPlayerOverlay,
  isBrowseOnlyPlayer,
  isPlaceholderQuickFact,
} from './lib/playerOverlayBuilders.mjs';

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

async function main() {
  const TOP_N = Number(process.env.THIN_PLAYERS_N ?? 120) || 120;
  /** Browse-only rows cap near 54 in the current dataset. */
  const MIN_IMPORTANCE = Number(process.env.THIN_PLAYERS_MIN_SCORE ?? 48) || 48;

  const mod = await import(path.join(ROOT, 'src/data/sampleData.js'));
  const { players, getTeamName, getLeagueName } = mod;

  const outPath = path.join(ROOT, 'src/data/playerEditorialOverlays.json');
  let existing = { overlays: {} };
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  const candidates = (players ?? [])
    .filter(
      (p) =>
        p?.id &&
        p.leagueId !== 'external' &&
        isBrowseOnlyPlayer(p) &&
        (Number(p.importanceScore) || 0) >= MIN_IMPORTANCE,
    )
    .map((p) => {
      let rank = Number(p.importanceScore) || 0;
      if (isPlaceholderQuickFact(p)) rank += 5;
      if (PRIORITY_LEAGUES.has(p.leagueId)) rank += 3;
      if (String(p.playingStyle ?? '').trim()) rank += 4;
      return { player: p, rank };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, TOP_N);

  const overlays = { ...(existing.overlays ?? {}) };
  let added = 0;
  let updated = 0;
  let i = 0;

  for (const { player } of candidates) {
    const teamName = getTeamName(player.teamId);
    const leagueName = getLeagueName(player.leagueId);
    const next = buildPlayerOverlay(player, { teamName, leagueName }, i);
    i += 1;

    const had = Boolean(overlays[player.id]);
    const prev = overlays[player.id] ?? {};
    overlays[player.id] = {
      ...prev,
      ...next,
      strengths: next.strengths ?? prev.strengths,
      knownFor: next.knownFor ?? prev.knownFor,
    };
    if (had) updated += 1;
    else added += 1;
  }

  const payload = {
    ...existing,
    generatedAt: new Date().toISOString(),
    thinPlayerPass: { added, updated, targeted: candidates.length },
    overlayCount: Object.keys(overlays).length,
    overlays,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    `Wrote ${path.relative(ROOT, outPath)} — ${candidates.length} browse-only players (${added} new, ${updated} merged)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
