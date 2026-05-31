#!/usr/bin/env node
/**
 * Fact-locked overlay pass for all browse-only players above an importance floor.
 * No TOP_N cap — processes the full eligible set.
 *
 * Run: npm run enrich:all-browse-players
 * Env: BROWSE_MIN_IMPORTANCE (default 48)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildPlayerOverlay,
  buildStrengthsFromPlayingStyle,
  clean,
  isBrowseOnlyPlayer,
} from './lib/playerOverlayBuilders.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function buildQuizHints(player, ctx) {
  const existing = (Array.isArray(player.quizHints) ? player.quizHints : [])
    .map(clean)
    .filter(Boolean);

  const out = [];
  const seen = new Set();
  const add = (h) => {
    const t = clean(h);
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  for (const h of existing) add(h);

  const nat = clean(player.nationalTeam || player.nationality);
  const position = clean(player.position);
  const club = clean(ctx.teamName);
  const league = clean(ctx.leagueName);

  if (out.length < 3 && nat && position && league) {
    add(`${nat} ${position.toLowerCase()} in ${league}.`);
  }
  if (out.length < 3 && club && league) {
    add(`Plays for ${club} in ${league}.`);
  }
  if (out.length < 3 && nat) {
    add(`${nat} international.`);
  }

  const career = Array.isArray(player.careerHistory) ? player.careerHistory : [];
  const clubs = career.map((c) => clean(c.club)).filter(Boolean);
  if (out.length < 3 && clubs.length >= 2) {
    add(`Career path includes ${clubs.slice(-3).join(' → ')}.`);
  }

  return out.map((h) => (h.length > 110 ? `${h.slice(0, 107).trimEnd()}…` : h)).slice(0, 5);
}

async function main() {
  const MIN_IMPORTANCE = Number(process.env.BROWSE_MIN_IMPORTANCE ?? 48) || 48;

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
    .sort(
      (a, b) =>
        (Number(b.importanceScore) || 0) - (Number(a.importanceScore) || 0) ||
        a.id.localeCompare(b.id),
    );

  const overlays = { ...(existing.overlays ?? {}) };
  let added = 0;
  let updated = 0;
  let i = 0;

  for (const player of candidates) {
    const teamName = getTeamName(player.teamId);
    const leagueName = getLeagueName(player.leagueId);
    const built = buildPlayerOverlay(player, { teamName, leagueName }, i);
    const strengths = buildStrengthsFromPlayingStyle(player.playingStyle);
    const quizHints = buildQuizHints(player, { teamName, leagueName });

    const had = Boolean(overlays[player.id]);
    overlays[player.id] = {
      ...(overlays[player.id] ?? {}),
      ...built,
      strengths: built.strengths ?? strengths,
      quizHints,
    };
    if (had) updated += 1;
    else added += 1;
    i += 1;
  }

  const payload = {
    ...existing,
    generatedAt: new Date().toISOString(),
    allBrowsePlayersPass: {
      minImportance: MIN_IMPORTANCE,
      targeted: candidates.length,
      added,
      updated,
    },
    overlayCount: Object.keys(overlays).length,
    overlays,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    `Wrote ${path.relative(ROOT, outPath)} — ${candidates.length} browse-only players (≥${MIN_IMPORTANCE}) — ${added} new, ${updated} merged, ${payload.overlayCount} total`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
