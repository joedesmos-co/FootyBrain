#!/usr/bin/env node
/**
 * Generate public/data/search-index.json
 * Lightweight search index — IDs, names, routing metadata, aliases, ranking signals only.
 * No quiz hints, career history, or full player profiles.
 *
 * Run: node scripts/write-search-index.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'public/data/search-index.json');

const { players, teams, leagues, getTeamName, getLeagueName } = await import(
  '../src/data/sampleData.js'
);

// Read nationalTeamLive.json directly to avoid pulling nationalTeamData.js (it imports sampleData).
const ntLiveRaw = fs.readFileSync(path.join(ROOT, 'src/data/nationalTeamLive.json'), 'utf8');
const ntLive = JSON.parse(ntLiveRaw);
const allNationalTeams = ntLive.nationalTeams ?? [];

const {
  getPlayerAliases,
  getTeamAliases,
  getLeagueAliases,
  getNationalTeamAliases,
} = await import('../src/utils/searchAliases.js');

// ── Players ─────────────────────────────────────────────────────────────────
const indexPlayers = players.map((p) => {
  const entry = {
    id: p.id,
    type: 'player',
    name: p.name,
    teamId: p.teamId,
    teamName: getTeamName(p.teamId),
    leagueId: p.leagueId,
    leagueName: getLeagueName(p.leagueId),
    nationality: p.nationality || null,
    nationalTeam: p.nationalTeam || null,
    position: p.position || null,
    importanceScore: p.importanceScore ?? 0,
  };
  const aliases = getPlayerAliases(p.id);
  if (aliases.length) entry.aliases = aliases;
  if (p.visualTheme) entry.visualTheme = p.visualTheme;
  return entry;
});

// ── Teams ────────────────────────────────────────────────────────────────────
const indexTeams = teams.map((t) => {
  const entry = {
    id: t.id,
    type: 'team',
    name: t.name,
    leagueId: t.leagueId,
    leagueName: getLeagueName(t.leagueId),
    country: t.country || null,
  };
  const aliases = getTeamAliases(t.id);
  if (aliases.length) entry.aliases = aliases;
  if (t.badgeTheme) entry.badgeTheme = t.badgeTheme;
  if (t.crestUrl) entry.crestUrl = t.crestUrl;
  return entry;
});

// ── Leagues ──────────────────────────────────────────────────────────────────
const indexLeagues = leagues.map((l) => {
  const entry = {
    id: l.id,
    type: 'league',
    name: l.name,
    country: l.country || null,
  };
  const aliases = getLeagueAliases(l.id);
  if (aliases.length) entry.aliases = aliases;
  if (l.badgeTheme) entry.badgeTheme = l.badgeTheme;
  if (l.logoUrl) entry.logoUrl = l.logoUrl;
  return entry;
});

// ── National teams ───────────────────────────────────────────────────────────
const indexNationalTeams = allNationalTeams.map((nt) => {
  const entry = {
    id: nt.id,
    type: 'national-team',
    displayName: nt.displayName,
    country: nt.country || null,
    confederation: nt.confederation || null,
    confederationId: nt.confederationId || null,
  };
  const hardAliases = getNationalTeamAliases(nt.id);
  const softAliases = nt.searchAliases ?? [];
  const combined = [...new Set([...hardAliases, ...softAliases])];
  if (combined.length) entry.aliases = combined;
  return entry;
});

const index = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  counts: {
    players: indexPlayers.length,
    teams: indexTeams.length,
    leagues: indexLeagues.length,
    nationalTeams: indexNationalTeams.length,
  },
  players: indexPlayers,
  teams: indexTeams,
  leagues: indexLeagues,
  nationalTeams: indexNationalTeams,
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(index)}\n`);

const rawKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
console.log(
  `Wrote ${OUT_PATH} (${indexPlayers.length} players, ${indexTeams.length} teams, ${indexLeagues.length} leagues, ${indexNationalTeams.length} national teams, ${rawKb} KB raw)`,
);
