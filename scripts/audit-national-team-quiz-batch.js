#!/usr/bin/env node
/**
 * Audit thin national-team quiz strengthening batch (read-only).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { players, teams, leagues, getTeamName } from '../src/data/sampleData.js';
import { isQuizEligiblePlayer } from '../src/utils/quizPlayerRules.js';
import {
  getLiveNationalTeams,
  getNationalTeamQuizReadyCount,
  isLiveNationalTeamQuizViable,
  getLiveNationalTeamForPlayer,
} from '../src/data/nationalTeamData.js';
import { buildQuizPlayerPool, buildAmbiguousLastNames } from '../src/utils/quizSession.js';
import { searchUniversalGrouped } from '../src/utils/universalSearch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const live = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/nationalTeamLive.json'), 'utf8'),
);

const AUDITED = [
  'poland',
  'austria',
  'ukraine',
  'scotland',
  'paraguay',
  'serbia',
  'mexico',
  'chile',
  'turkey',
  'korea-republic',
];

const memByNt = {};
for (const m of live.nationalMemberships) {
  (memByNt[m.nationalTeamId] ??= []).push(m.playerId);
}
const pmap = new Map(players.map((p) => [p.id, p]));

function lastToken(name) {
  const parts = String(name)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const suffixes = new Set(['jr', 'sr', 'ii', 'iii', 'iv']);
  const last = parts.at(-1) ?? '';
  if (suffixes.has(last) && parts.length >= 2) return parts.at(-2);
  return last;
}

const nations = {};
const surnameCollisions = [];
const placeholderLeaks = [];
const profileIssues = [];
const searchFails = [];

for (const nt of AUDITED) {
  const team = live.nationalTeams.find((t) => t.id === nt);
  const squad = (memByNt[nt] ?? []).map((id) => pmap.get(id)).filter(Boolean);
  const quiz = squad.filter(isQuizEligiblePlayer);
  const pool = buildQuizPlayerPool(
    players,
    {
      poolFocus: 'national',
      leagueFilter: '',
      teamFilter: '',
      positionFilter: '',
      nationalTeamFilter: nt,
    },
    'classic',
  );
  const ambig = buildAmbiguousLastNames(pool);
  const surnames = new Map();
  for (const p of quiz) {
    const ln = lastToken(p.name);
    if (ln.length > 3) surnames.set(ln, [...(surnames.get(ln) ?? []), p.name]);
  }
  const dups = [...surnames.entries()].filter(([, names]) => names.length > 1);
  nations[nt] = {
    displayName: team?.displayName,
    linked: squad.length,
    quizReady: quiz.length,
    quizPool: pool.length,
    metaQuiz: getNationalTeamQuizReadyCount(nt),
    viable: isLiveNationalTeamQuizViable(nt),
    dupSurnames: dups,
    ambiguousLastNames: [...ambig],
    quizPlayers: quiz.map((p) => ({
      id: p.id,
      name: p.name,
      dataStatus: p.dataStatus,
      hints: p.quizHints?.length ?? 0,
    })),
  };
  if (dups.length) surnameCollisions.push({ nt, dups });
  for (const p of quiz) {
    const fact = String(p.quickFact ?? '');
    if (/needs editorial|generated-needs|placeholder|TBD|TODO/i.test(fact + (p.dataStatus ?? ''))) {
      placeholderLeaks.push({ nt, id: p.id, name: p.name, dataStatus: p.dataStatus });
    }
    const liveNt = getLiveNationalTeamForPlayer(p);
    if (!liveNt || liveNt.id !== nt) profileIssues.push({ nt, id: p.id, name: p.name, got: liveNt?.id });
  }
}

const ntTeams = getLiveNationalTeams();
const nationQueries = {
  poland: 'poland',
  austria: 'austria',
  ukraine: 'ukraine',
  scotland: 'scotland',
  paraguay: 'paraguay',
  serbia: 'serbia',
  mexico: 'mexico',
  chile: 'chile',
  turkey: 'turkey',
  'korea-republic': 'south korea',
};

for (const [id, q] of Object.entries(nationQueries)) {
  const { flatResults } = searchUniversalGrouped(q, {
    players,
    teams,
    leagues,
    nationalTeams: ntTeams,
    getTeamName,
    getLeagueName: (lid) => leagues.find((l) => l.id === lid)?.name ?? '',
  });
  if (!flatResults.some((r) => r.type === 'national-team' && r.id === id)) {
    searchFails.push({ kind: 'nation', id, q });
  }
}

// Daily challenge eligibility
const dailyNtEligible = ntTeams
  .filter((t) => getNationalTeamQuizReadyCount(t.id) >= 5)
  .map((t) => t.id);
const auditedInDaily = AUDITED.filter((id) => dailyNtEligible.includes(id));

console.log('=== National team quiz batch audit ===\n');
for (const nt of AUDITED) {
  const n = nations[nt];
  console.log(
    `${nt}: quiz=${n.quizReady} pool=${n.quizPool} viable=${n.viable} dupSurnames=${n.dupSurnames.length} ambiguous=${n.ambiguousLastNames.join(',') || 'none'}`,
  );
}
console.log('\nSurname collisions:', JSON.stringify(surnameCollisions, null, 2));
console.log('\nPlaceholder leaks:', placeholderLeaks.length ? placeholderLeaks : 'none');
console.log('\nProfile link issues:', profileIssues.length ? profileIssues : 'none');
console.log('\nSearch fails:', searchFails.length ? searchFails : 'none');
console.log('\nAudited nations in daily NT pool (>=5 quiz):', auditedInDaily.join(', '));
console.log('Thin live (not audited, <5 quiz):', ntTeams.filter((t) => getNationalTeamQuizReadyCount(t.id) < 5).map((t) => `${t.id}(${getNationalTeamQuizReadyCount(t.id)})`).join(', '));
