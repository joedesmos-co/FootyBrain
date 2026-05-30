#!/usr/bin/env node
/**
 * Manual-quality editorial enrichment pass (fact-locked).
 *
 * Generates `src/data/playerEditorialOverlays.json` for the top N players by importanceScore.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildPlayerOverlay,
  buildStrengthsFromPlayingStyle,
  clean,
  isPlaceholderQuickFact,
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
  const TOP_N = Number(process.env.TOP_N ?? 350) || 350;
  const ctx = await import(path.join(ROOT, 'src/data/sampleData.js'));
  const allPlayers = ctx.players ?? [];

  const top = [...allPlayers]
    .filter((p) => p && p.leagueId !== 'external')
    .sort((a, b) => (Number(b.importanceScore) || 0) - (Number(a.importanceScore) || 0))
    .slice(0, TOP_N);

  const outPath = path.join(ROOT, 'src/data/playerEditorialOverlays.json');
  let existing = { overlays: {} };
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  const overlays = { ...(existing.overlays ?? {}) };
  let i = 0;

  for (const player of top) {
    const teamName = ctx.getTeamName(player.teamId);
    const leagueName = ctx.getLeagueName(player.leagueId);
    const built = buildPlayerOverlay(player, { teamName, leagueName }, i);
    const strengths = buildStrengthsFromPlayingStyle(player.playingStyle);
    const quizHints = buildQuizHints(player, { teamName, leagueName });

    overlays[player.id] = {
      ...(overlays[player.id] ?? {}),
      ...built,
      strengths: built.strengths ?? strengths,
      quizHints,
    };
    i += 1;
  }

  const payload = {
    ...existing,
    generatedAt: new Date().toISOString(),
    topN: TOP_N,
    overlayCount: Object.keys(overlays).length,
    overlays,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, outPath)} (${payload.overlayCount} players, top ${TOP_N})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
