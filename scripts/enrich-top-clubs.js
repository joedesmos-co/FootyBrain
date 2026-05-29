#!/usr/bin/env node
/**
 * Premium editorial pass for top clubs (fact-locked).
 *
 * Generates `src/data/teamEditorialOverlays.json` from existing structured team fields only.
 * Does not invent trophies, titles, or historical claims.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TAG_PHRASES = {
  possession: 'possession-oriented build-up',
  'counter-attacking': 'quick transitions',
  'youth-focused': 'youth in the first team',
  'historic-giant': 'long trophy pedigree',
  pressing: 'coordinated high press',
  'direct-play': 'direct vertical play',
  'set-pieces': 'set-piece threat',
  'defensive-block': 'compact defensive block',
  'high-line': 'high defensive line',
  academy: 'academy-led identity',
  'european-heavyweight': 'European pedigree',
  'title-challenger': 'title-chasing expectations',
  physical: 'physical duels',
  technical: 'technical ball retention',
  'fan-culture': 'vocal supporter culture',
  'underdog-spirit': 'underdog mentality',
};

function clean(v) {
  return String(v ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

function truncate(text, max = 158) {
  const t = clean(text);
  if (t.length <= max) return t;
  const slice = t.slice(0, max - 1);
  const cut = slice.lastIndexOf(' ') > max * 0.55 ? slice.slice(0, slice.lastIndexOf(' ')) : slice;
  return `${cut.trimEnd()}…`;
}

function list(names, max = 4) {
  const xs = (Array.isArray(names) ? names : []).map(clean).filter(Boolean).slice(0, max);
  if (!xs.length) return '';
  if (xs.length === 1) return xs[0];
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`;
}

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function keyPlayerNames(team) {
  return (team.currentKeyPlayers ?? [])
    .map((line) => clean(String(line).split(' — ')[0]))
    .filter(Boolean);
}

function legendNames(team, max = 3) {
  return (team.legends ?? [])
    .map((line) => clean(String(line).split(' — ')[0]))
    .filter(Boolean)
    .slice(0, max);
}

function tagPhrases(team, max = 3) {
  const keys = (team.identityTags ?? []).map((t) => clean(typeof t === 'string' ? t : t?.key)).filter(Boolean);
  return keys
    .map((k) => TAG_PHRASES[k])
    .filter(Boolean)
    .slice(0, max);
}

function buildMetaDescription(team, leagueName) {
  const story = clean(team.shortHistory);
  const stadium = clean(team.stadium);
  const rivals = (team.rivals ?? []).map(clean).filter(Boolean);
  const variant = hashId(team.id) % 4;

  if (variant === 0 && story) {
    return truncate(
      `${team.name} (${leagueName}): ${story} Squad, rivals, and club quizzes on FootyCompass.`,
      158,
    );
  }
  if (variant === 1) {
    const bits = [`${team.name} (${leagueName})`];
    if (stadium) bits.push(stadium);
    if (rivals.length) bits.push(`rivals include ${list(rivals, 2)}`);
    const hook = story ? truncate(story, 72) : clean(team.fanGuide);
    return truncate(`${bits.join(' · ')}. ${hook} FootyCompass club profile.`, 158);
  }
  if (variant === 2 && clean(team.fanGuide)) {
    return truncate(
      `${team.name} fan culture & squad: ${truncate(clean(team.fanGuide), 90)} ${leagueName} quizzes and player profiles on FootyCompass.`,
      158,
    );
  }
  const legends = legendNames(team, 2);
  const legendBit = legends.length ? ` Legends: ${list(legends, 2)}.` : '';
  const hook = story ? truncate(story, 85) : '';
  return truncate(
    `${team.name} — ${hook}${legendBit} ${leagueName} squad study & quizzes on FootyCompass.`,
    158,
  );
}

function buildTacticalIdentity(team) {
  const phrases = tagPhrases(team, 3);
  const manager = clean(team.manager);
  const parts = [];
  if (phrases.length) {
    parts.push(
      `Dataset tags describe ${team.name} as ${list(phrases, 3)}.`,
    );
  }
  if (manager) {
    parts.push(`Head coach listed: ${manager}.`);
  }
  return truncate(parts.join(' '), 240) || null;
}

function buildStadiumContext(team) {
  const bits = [];
  if (team.stadium) {
    bits.push(`${team.name} list ${team.stadium} as their home ground.`);
  }
  if (team.founded) {
    bits.push(`Founded in ${team.founded}.`);
  }
  const manager = clean(team.manager);
  if (manager) {
    bits.push(`Current head coach in the dataset: ${manager}.`);
  }
  return truncate(bits.join(' '), 240) || null;
}

function buildRivalsSummary(team) {
  const rivals = (team.rivals ?? []).map(clean).filter(Boolean);
  if (!rivals.length) return null;
  const guide = clean(team.fanGuide);
  const guideMentionsRival = rivals.some((r) => guide.toLowerCase().includes(r.toLowerCase().slice(0, 8)));
  if (guideMentionsRival && guide) {
    const sentence = guide.split(/(?<=[.!?])\s+/).find((s) =>
      rivals.some((r) => s.toLowerCase().includes(r.toLowerCase().slice(0, 6))),
    );
    if (sentence) return truncate(sentence, 220);
  }
  return truncate(
    `Rivalries noted for ${team.name}: ${list(rivals, 4)}. Compare squads on linked club profiles before a derby quiz.`,
    220,
  );
}

function buildLegendsSummary(team) {
  const names = legendNames(team, 4);
  if (!names.length) return null;
  const firstLine = clean(team.legends?.[0] ?? '');
  const note = firstLine.includes(' — ') ? clean(firstLine.split(' — ').slice(1).join(' — ')) : '';
  if (note) {
    return truncate(
      `Club legends in the dataset include ${list(names, 4)} — for example, ${names[0]} (${note}).`,
      240,
    );
  }
  return truncate(`Club legends in the dataset: ${list(names, 4)}.`, 220);
}

function buildPlayersToKnowIntro(team) {
  const names = keyPlayerNames(team);
  if (names.length < 2) return null;
  const variant = hashId(team.id) % 3;
  if (variant === 0) {
    return `Start with ${list(names, 4)} — names fans and quizzes reference most in the current squad.`;
  }
  if (variant === 1) {
    return `Players to know now: ${list(names, 4)}. Open each profile for position, nationality, and quiz clues.`;
  }
  return `Before the full squad list, learn ${list(names, 3)}${names.length > 3 ? `, and ${names[3]}` : ''}.`;
}

function buildQuizDiscoveryLead(team, leagueName) {
  const stadium = clean(team.stadium);
  const rival = clean(team.rivals?.[0]);
  const parts = [`Lock in ${team.name} names with the club player quiz`];
  if (stadium) parts.push(`after studying ${stadium}`);
  if (rival) parts.push(`then try rivalry pools vs ${rival}`);
  if (leagueName) parts.push(`or the ${leagueName} league guide`);
  return truncate(`${parts.join(' — ')}.`, 200);
}

async function main() {
  const premiumIdsPath = path.join(ROOT, 'src/data/premiumClubIds.js');
  const premiumMod = await import(premiumIdsPath);
  const focus = premiumMod.PREMIUM_EDITORIAL_CLUB_IDS ?? [];

  const mod = await import(path.join(ROOT, 'src/data/sampleData.js'));
  const { teams, getLeagueName } = mod;
  const byId = new Map((teams ?? []).map((t) => [t.id, t]));
  const overlays = {};

  for (const id of focus) {
    const team = byId.get(id);
    if (!team) {
      console.warn(`Skip missing club id: ${id}`);
      continue;
    }
    const leagueName = getLeagueName(team.leagueId);

    overlays[team.id] = {
      metaDescription: buildMetaDescription(team, leagueName),
      tacticalIdentity: buildTacticalIdentity(team),
      stadiumContext: buildStadiumContext(team),
      rivalsSummary: buildRivalsSummary(team),
      legendsSummary: buildLegendsSummary(team),
      playersToKnowIntro: buildPlayersToKnowIntro(team),
      quizDiscoveryLead: buildQuizDiscoveryLead(team, leagueName),
    };
  }

  const outPath = path.join(ROOT, 'src/data/teamEditorialOverlays.json');
  const payload = {
    generatedAt: new Date().toISOString(),
    overlayCount: Object.keys(overlays).length,
    overlays,
  };
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, outPath)} (${payload.overlayCount} clubs)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
