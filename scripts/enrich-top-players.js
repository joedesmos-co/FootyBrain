#!/usr/bin/env node
/**
 * Manual-quality editorial enrichment pass (fact-locked).
 *
 * Generates `src/data/playerEditorialOverlays.json` for the top N players by importanceScore.
 *
 * Rules:
 * - Do NOT invent facts or achievements.
 * - Only rephrase / synthesize from existing structured fields on the player row:
 *   name, age/dateOfBirth, position, teamId, leagueId, nationality/nationalTeam,
 *   quickFact, playingStyle, quizHints, careerHistory.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function cleanText(v) {
  return String(v ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

function splitTags(text, limit = 8) {
  return cleanText(text)
    .split(/[·•,;|/]/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function titleCaseWord(w) {
  const t = String(w ?? '').trim();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function buildStrengthsFromPlayingStyle(playingStyle) {
  const raw = cleanText(playingStyle).toLowerCase();
  if (!raw) return [];

  /** @type {string[]} */
  const strengths = [];
  const add = (s) => {
    const t = cleanText(s);
    if (!t) return;
    if (strengths.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    strengths.push(t);
  };

  // Keyword -> concise strength label (derived from the phrase; no new claims).
  const rules = [
    [/finisher|finishing|clinical|ruthless/, 'Finishing'],
    [/box|in the box|penalty area/, 'Penalty-box movement'],
    [/aerial|header|heading/, 'Aerial threat'],
    [/press|pressing/, 'Pressing'],
    [/counter|transition/, 'Transition threat'],
    [/pace|fast|explosive|rapid/, 'Pace'],
    [/dribble|1v1|take-ons?/, '1v1 dribbling'],
    [/creative|chance|playmaker|final ball|through ball/, 'Chance creation'],
    [/cross|wide delivery/, 'Crossing'],
    [/ball carry|carries the ball|carry the ball/, 'Ball carrying'],
    [/progress|line-breaking/, 'Progressive passing'],
    [/passing range|switches play|diagonal/, 'Passing range'],
    [/duel|physical|strength/, 'Duels'],
    [/tackle|ball-winning|intercept/, 'Ball winning'],
    [/position|positioning|reads the game/, 'Positioning'],
    [/composure|calm|under pressure/, 'Composure'],
    [/shot-stopp|reflex|saves?/, 'Shot-stopping'],
    [/distribution|sweeper|plays out/, 'Distribution'],
  ];

  for (const [re, label] of rules) {
    if (re.test(raw)) add(label);
  }

  // If nothing matched, fall back to cleaned tags.
  if (strengths.length === 0) {
    for (const t of splitTags(playingStyle, 4)) add(titleCaseWord(t));
  }

  return strengths.slice(0, 6);
}

function pickNationality(player) {
  return cleanText(player?.nationalTeam || player?.nationality || '');
}

function buildQuizHints(player, ctx) {
  const existing = (Array.isArray(player.quizHints) ? player.quizHints : [])
    .map(cleanText)
    .filter(Boolean);

  const out = [];
  const seen = new Set();
  const add = (h) => {
    const t = cleanText(h);
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  for (const h of existing) add(h);

  // Ensure we have at least 3 crisp hints, derived from structured fields only.
  const nat = pickNationality(player);
  const position = cleanText(player.position);
  const club = cleanText(ctx.teamName);
  const league = cleanText(ctx.leagueName);

  if (out.length < 3 && nat && position && league) {
    add(`${nat} ${position.toLowerCase()} in ${league}.`);
  }
  if (out.length < 3 && club && league) {
    add(`Plays for ${club} in ${league}.`);
  }
  if (out.length < 3 && nat) {
    add(`${nat} national-team pool on FootyCompass.`);
  }

  const career = Array.isArray(player.careerHistory) ? player.careerHistory : [];
  const clubs = career.map((c) => cleanText(c.club)).filter(Boolean);
  if (out.length < 3 && clubs.length >= 2) {
    add(`Career path includes ${clubs.slice(-3).join(' → ')}.`);
  }

  // Keep hints short-ish for quiz UX.
  return out
    .map((h) => (h.length > 110 ? `${h.slice(0, 107).trimEnd()}…` : h))
    .slice(0, 5);
}

function rewriteQuickFact(player, ctx, variant = 0) {
  const fact = cleanText(player.quickFact);
  const nat = pickNationality(player);
  const position = cleanText(player.position);
  const club = cleanText(ctx.teamName);
  const league = cleanText(ctx.leagueName);

  // If the existing quickFact is already specific and non-placeholder, keep it but clean punctuation.
  const placeholderRe = /editorial profile coming soon|editorial quiz profile pending|footybrain|footycompass sample/i;
  if (fact && !placeholderRe.test(fact) && fact.length >= 28) return fact;

  const openers = [
    () => `${player.name} is a ${position.toLowerCase()} for ${club} in ${league}.`,
    () => `${club} ${position.toLowerCase()} ${player.name} plays in ${league}.`,
    () => `${player.name} is a ${nat ? `${nat} ` : ''}${position.toLowerCase()} in ${league} (${club}).`,
    () => `${player.name} plays ${position.toLowerCase()} for ${club}.`,
  ];
  const pick = openers[variant % openers.length];
  return cleanText(pick());
}

function buildPlayStyleSummary(player, strengths) {
  const style = cleanText(player.playingStyle);
  if (!style) return '';

  // Prefer a single concise sentence (human, not listy).
  const s = style.endsWith('.') ? style : `${style}.`;
  if (s.length <= 160) return s;

  // If long, compress using derived strengths labels.
  if (strengths.length > 0) {
    return cleanText(`${strengths.slice(0, 3).join(' · ')}.`);
  }
  return cleanText(`${s.slice(0, 157).trimEnd()}…`);
}

async function loadContext() {
  const mod = await import(path.join(ROOT, 'src/data/sampleData.js'));
  const { getTeamName, getLeagueName } = mod;
  return { ...mod, getTeamName, getLeagueName };
}

async function main() {
  const TOP_N = Number(process.env.TOP_N ?? 200) || 200;
  const ctx = await loadContext();
  const allPlayers = ctx.players ?? [];

  const top = [...allPlayers]
    .filter((p) => p && p.leagueId !== 'external')
    .sort((a, b) => (Number(b.importanceScore) || 0) - (Number(a.importanceScore) || 0))
    .slice(0, TOP_N);

  const overlays = {};

  let i = 0;
  for (const player of top) {
    const teamName = ctx.getTeamName(player.teamId);
    const leagueName = ctx.getLeagueName(player.leagueId);

    const strengths = buildStrengthsFromPlayingStyle(player.playingStyle);
    const quickFact = rewriteQuickFact(player, { teamName, leagueName }, i);
    const playStyleSummary = buildPlayStyleSummary(player, strengths);
    const quizHints = buildQuizHints(player, { teamName, leagueName });

    overlays[player.id] = {
      quickFact,
      playStyleSummary,
      // Preserve existing `playingStyle` (tags come from it); strengths drive “Known for” + Strengths.
      strengths,
      quizHints,
    };

    i += 1;
  }

  const outPath = path.join(ROOT, 'src/data/playerEditorialOverlays.json');
  const payload = {
    generatedAt: new Date().toISOString(),
    topN: TOP_N,
    overlayCount: Object.keys(overlays).length,
    overlays,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, outPath)} (${payload.overlayCount} players)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

