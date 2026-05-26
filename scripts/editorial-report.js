#!/usr/bin/env node
/**
 * Generate FootyBrain editorial backlog (MD + JSON) and print a console summary.
 * Does not auto-approve players.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { players, teams } from '../src/data/sampleData.js';
import { isQuizEligiblePlayer } from '../src/utils/quizEligibility.js';
import { EXPANSION_LIMITS } from './phase1-curation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DRAFT_PATH = path.join(ROOT, 'editorial-overlays/players.generated-draft.json');
const BACKLOG_MD_PATH = path.join(ROOT, 'EDITORIAL_BACKLOG.md');
const BACKLOG_JSON_PATH = path.join(ROOT, 'generated-data/editorial-backlog-report.json');

const MIN_QUIZ = EXPANSION_LIMITS.minQuizReadyPerClub ?? 5;

const LEAGUE_PRIORITY = {
  'premier-league': 100,
  'la-liga': 90,
  'bundesliga': 85,
  'serie-a': 85,
  'ligue-1': 80,
  eredivisie: 70,
  mls: 78,
  brasileirao: 76,
};

const LEAGUE_LABELS = {
  'premier-league': 'Premier League',
  'la-liga': 'La Liga',
  bundesliga: 'Bundesliga',
  'serie-a': 'Serie A',
  'ligue-1': 'Ligue 1',
  eredivisie: 'Eredivisie',
  mls: 'Major League Soccer',
  brasileirao: 'Brasileirão Série A',
};

const MVP_CLUB_IDS = new Set([
  'manchester-city',
  'arsenal',
  'liverpool',
  'real-madrid',
  'barcelona',
  'bayern-munich',
  'ac-milan',
  'inter-milan',
  'inter-miami',
  'lafc',
  'la-galaxy',
  'seattle-sounders',
  'new-york-city-fc',
  'flamengo',
  'palmeiras',
  'corinthians',
  'sao-paulo',
]);

const DUPLICATE_LAST_NAME_BLOCKLIST = new Set([
  'garcia',
  'gomes',
  'bueno',
  'martinez',
  'gonzalez',
  'rodrigo',
]);

function stripAccents(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function lastNameFromDisplay(displayName) {
  const parts = String(displayName ?? '')
    .trim()
    .split(/\s+/);
  return stripAccents(parts[parts.length - 1] ?? '').toLowerCase();
}

function loadDraft() {
  if (!fs.existsSync(DRAFT_PATH)) {
    return { players: [] };
  }
  return JSON.parse(fs.readFileSync(DRAFT_PATH, 'utf8'));
}

function categorizeClub(row) {
  if (row.quizReady >= MIN_QUIZ) return 'fully-healthy';
  if (row.quizReady === 0 || row.neededForQuizTarget >= 4) {
    return 'needs-editorial-urgently';
  }
  const browseShare = row.total > 0 ? row.browseOnly / row.total : 0;
  if (browseShare >= 0.85 && row.total >= 18) {
    return 'browse-only-heavy';
  }
  return 'ready-for-quiz-expansion';
}

function categoryLabel(key) {
  const labels = {
    'fully-healthy': 'Fully healthy',
    'needs-editorial-urgently': 'Needs editorial urgently',
    'ready-for-quiz-expansion': 'Ready for quiz expansion',
    'browse-only-heavy': 'Browse-only heavy',
  };
  return labels[key] ?? key;
}

function priorityScore(row) {
  const leagueWeight = LEAGUE_PRIORITY[row.leagueId] ?? 50;
  const mvpBonus = MVP_CLUB_IDS.has(row.teamId) ? 30 : 0;
  const coverageGap = row.total > 0 ? row.browseOnly / row.total : 0;
  return (
    row.neededForQuizTarget * 1000 +
    (MIN_QUIZ - row.quizReady) * 200 +
    row.total * 2 +
    coverageGap * 120 +
    leagueWeight +
    mvpBonus
  );
}

function hasLastNameConflict(teamPlayers, candidateName, quizLastNames) {
  const ln = lastNameFromDisplay(candidateName);
  if (!ln) return false;
  if (DUPLICATE_LAST_NAME_BLOCKLIST.has(ln)) return true;

  const teamLastNames = teamPlayers
    .filter((p) => isQuizEligiblePlayer(p))
    .map((p) => lastNameFromDisplay(p.name));

  const combined = [...teamLastNames, ...quizLastNames];
  const count = combined.filter((x) => x === ln).length;
  if (count >= 1) {
    const onTeam = teamPlayers.filter((p) => lastNameFromDisplay(p.name) === ln).length;
    if (onTeam >= 2) return true;
  }
  return false;
}

function suggestForClub(teamPlayers, draftIds, limit = 4) {
  const quizReady = teamPlayers.filter(isQuizEligiblePlayer);
  const quizLastNames = quizReady.map((p) => lastNameFromDisplay(p.name));

  const candidates = teamPlayers
    .filter(
      (p) =>
        p.dataStatus === 'generated-needs-editorial' &&
        String(p.id).startsWith('tm-') &&
        !draftIds.has(p.id),
    )
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0));

  const picks = [];
  for (const player of candidates) {
    if (picks.length >= limit) break;
    if (hasLastNameConflict(teamPlayers, player.name, quizLastNames)) continue;
    picks.push({
      id: player.id,
      name: player.name,
      importanceScore: player.importanceScore ?? null,
      position: player.position ?? null,
      skipReason: null,
    });
  }
  return picks;
}

function buildReport() {
  const draft = loadDraft();
  const draftApprovedIds = new Set(
    draft.players.filter((p) => p.reviewStatus === 'approved').map((p) => p.id),
  );

  const playersByTeam = new Map();
  for (const team of teams) {
    playersByTeam.set(team.id, []);
  }
  for (const player of players) {
    const bucket = playersByTeam.get(player.teamId);
    if (bucket) bucket.push(player);
  }

  const clubRows = teams.map((team) => {
    const teamPlayers = playersByTeam.get(team.id) ?? [];
    const quizReady = teamPlayers.filter(isQuizEligiblePlayer).length;
    const approvedEditorial = teamPlayers.filter(
      (p) =>
        p.dataStatus === 'generated-editorial-approved' ||
        draftApprovedIds.has(p.id),
    ).length;
    const browseOnly = teamPlayers.filter(
      (p) => p.dataStatus === 'generated-needs-editorial',
    ).length;
    const manualQuiz = teamPlayers.filter(
      (p) => isQuizEligiblePlayer(p) && !String(p.id).startsWith('tm-'),
    ).length;
    const neededForQuizTarget = Math.max(0, MIN_QUIZ - quizReady);

    const row = {
      teamId: team.id,
      teamName: team.name,
      leagueId: team.leagueId,
      leagueLabel: LEAGUE_LABELS[team.leagueId] ?? team.leagueId,
      isMvpClub: MVP_CLUB_IDS.has(team.id),
      total: teamPlayers.length,
      quizReady,
      manualQuiz,
      approvedEditorial,
      browseOnly,
      neededForQuizTarget,
      editorialCoveragePct:
        teamPlayers.length > 0
          ? Math.round((approvedEditorial / teamPlayers.length) * 1000) / 10
          : 0,
      suggestions: [],
    };
    row.category = categorizeClub(row);
    row.priorityScore = priorityScore(row);
    row.suggestions = suggestForClub(teamPlayers, draftApprovedIds);
    return row;
  });

  clubRows.sort((a, b) => b.priorityScore - a.priorityScore || a.teamName.localeCompare(b.teamName));

  const globalSuggestions = [];
  for (const row of clubRows) {
    for (const suggestion of row.suggestions) {
      globalSuggestions.push({
        ...suggestion,
        teamId: row.teamId,
        teamName: row.teamName,
        leagueId: row.leagueId,
        leagueLabel: row.leagueLabel,
        clubPriorityScore: row.priorityScore,
        neededForQuizTarget: row.neededForQuizTarget,
      });
    }
  }
  globalSuggestions.sort(
    (a, b) =>
      b.clubPriorityScore - a.clubPriorityScore ||
      (b.importanceScore ?? 0) - (a.importanceScore ?? 0),
  );

  const browseOnlyTotal = players.filter((p) => p.dataStatus === 'generated-needs-editorial').length;
  const quizTotal = players.filter(isQuizEligiblePlayer).length;
  const approvedDraftCount = draftApprovedIds.size;

  const byCategory = {
    'fully-healthy': [],
    'needs-editorial-urgently': [],
    'ready-for-quiz-expansion': [],
    'browse-only-heavy': [],
  };
  for (const row of clubRows) {
    byCategory[row.category].push(row);
  }

  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    targets: { minQuizReadyPerClub: MIN_QUIZ },
    summary: {
      clubs: teams.length,
      quizEligibleTotal: quizTotal,
      approvedDraftOverlayCount: approvedDraftCount,
      browseOnlyTotal,
      clubsUnderQuizTarget: clubRows.filter((r) => r.neededForQuizTarget > 0).length,
      clubsFullyHealthy: byCategory['fully-healthy'].length,
    },
    categories: Object.fromEntries(
      Object.entries(byCategory).map(([key, rows]) => [
        key,
        rows.map((r) => r.teamId),
      ]),
    ),
    clubs: clubRows,
    globalSuggestions: globalSuggestions.slice(0, 30),
    draftPending: draft.players
      .filter((p) => p.reviewStatus && p.reviewStatus !== 'approved')
      .map((p) => ({ id: p.id, displayName: p.displayName, reviewStatus: p.reviewStatus })),
  };
}

function formatSuggestionList(suggestions) {
  if (!suggestions.length) return '—';
  return suggestions
    .map((s) => `${s.name} (\`${s.id}\`, score ${s.importanceScore ?? '—'})`)
    .join('; ');
}

function renderMarkdown(report) {
  const { summary, clubs, globalSuggestions, categories, targets, generatedAt } = report;
  const underTarget = clubs.filter((c) => c.neededForQuizTarget > 0);
  const strongest = [...clubs]
    .filter((c) => c.quizReady >= targets.minQuizReadyPerClub)
    .sort((a, b) => b.quizReady - a.quizReady || b.approvedEditorial - a.approvedEditorial);
  const weakest = [...underTarget].sort(
    (a, b) => a.quizReady - b.quizReady || b.browseOnly - a.browseOnly,
  );

  const lines = [];
  lines.push('# FootyBrain editorial backlog');
  lines.push('');
  lines.push(
    `> Auto-generated by \`npm run editorial:report\` on **${generatedAt}**.`,
  );
  lines.push(
    '> Human approvals live in `editorial-overlays/players.generated-draft.json` — this file is reporting only.',
  );
  lines.push('');
  lines.push('## Snapshot');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|------:|`);
  lines.push(`| Clubs tracked | ${summary.clubs} |`);
  lines.push(`| Quiz-eligible players (live) | ${summary.quizEligibleTotal} |`);
  lines.push(`| Approved in generated draft overlay | ${summary.approvedDraftOverlayCount} |`);
  lines.push(`| Browse-only (needs editorial) | ${summary.browseOnlyTotal} |`);
  lines.push(`| Clubs under ${targets.minQuizReadyPerClub} quiz-ready | ${summary.clubsUnderQuizTarget} |`);
  lines.push(`| Clubs fully healthy (≥ ${targets.minQuizReadyPerClub} quiz-ready) | ${summary.clubsFullyHealthy} |`);
  lines.push('');
  lines.push('## Categories');
  lines.push('');
  for (const key of [
    'needs-editorial-urgently',
    'browse-only-heavy',
    'ready-for-quiz-expansion',
    'fully-healthy',
  ]) {
    const ids = categories[key] ?? [];
    const names = clubs
      .filter((c) => ids.includes(c.teamId))
      .map((c) => c.teamName)
      .join(', ');
    lines.push(`### ${categoryLabel(key)} (${ids.length})`);
    lines.push(names ? names : '_none_');
    lines.push('');
  }
  lines.push('## Priority queue (clubs below quiz target)');
  lines.push('');
  lines.push(
    `Sorted by editorial urgency, squad depth, and league weight. Target: **${targets.minQuizReadyPerClub}** quiz-ready players per club.`,
  );
  lines.push('');
  lines.push(
    '| Rank | Club | League | Squad | Quiz-ready | Approved editorial | Browse-only | Need + | Category | Suggested next approvals |',
  );
  lines.push(
    '|-----:|------|--------|------:|-----------:|-------------------:|------------:|-------:|----------|--------------------------|',
  );
  let rank = 0;
  for (const row of underTarget) {
    rank += 1;
    lines.push(
      `| ${rank} | ${row.teamName} | ${row.leagueLabel} | ${row.total} | ${row.quizReady} | ${row.approvedEditorial} | ${row.browseOnly} | ${row.neededForQuizTarget} | ${categoryLabel(row.category)} | ${formatSuggestionList(row.suggestions)} |`,
    );
  }
  lines.push('');
  lines.push('## Fully healthy clubs');
  lines.push('');
  for (const row of strongest) {
    lines.push(
      `- **${row.teamName}** — ${row.quizReady} quiz-ready (${row.manualQuiz} manual, ${row.approvedEditorial} approved editorial)`,
    );
  }
  lines.push('');
  lines.push('## Global next approval targets (top 30)');
  lines.push('');
  lines.push(
    'Highest-value generated candidates from under-target clubs. Names filtered to reduce duplicate-surname quiz ambiguity.',
  );
  lines.push('');
  lines.push('| Player | Club | League | `id` | TM score | Club need + |');
  lines.push('|--------|------|--------|------|---------:|------------:|');
  for (const s of globalSuggestions) {
    lines.push(
      `| ${s.name} | ${s.teamName} | ${s.leagueLabel} | \`${s.id}\` | ${s.importanceScore ?? '—'} | ${s.neededForQuizTarget} |`,
    );
  }
  lines.push('');
  lines.push('## Weakest editorial coverage (under target)');
  lines.push('');
  for (const row of weakest.slice(0, 15)) {
    lines.push(
      `- **${row.teamName}** (${row.leagueLabel}) — ${row.quizReady}/${targets.minQuizReadyPerClub} quiz-ready, ${row.browseOnly} browse-only, ${row.editorialCoveragePct}% approved editorial share`,
    );
  }
  lines.push('');
  lines.push('## Selection rules (human review)');
  lines.push('');
  lines.push('1. Prefer clubs with the highest **Need +** in the table above.');
  lines.push('2. Balance across leagues; MVP clubs (City, Arsenal, Liverpool, Real, Barça, Bayern, Milan, Inter) rank higher when tied.');
  lines.push('3. Use durable hints: nation, club arc, role — not volatile stats.');
  lines.push('4. Skip crowded surnames (García, Gomes, Bueno, Martínez, González) and ambiguous Rodrigo/Nico pairs when flagged.');
  lines.push('5. Copy approved entries into `editorial-overlays/players.generated-draft.json`, then run `npm run expand:phase3` (Europe) or `npm run expand:phase4` (MLS).');
  lines.push('');
  lines.push('## MLS wave 1 (manual priority)');
  lines.push('');
  lines.push('Target **2–3** quiz-ready players on Inter Miami, LAFC, LA Galaxy, and Seattle first; use full names in hints when surnames collide (Roldán, Miller, Navarro).');
  lines.push('Prioritize USMNT/Canada/Honduras/Uruguay/Argentina crossover names for future World Cup mode.');
  lines.push('');
  lines.push('## Brasileirão wave 1 (manual priority)');
  lines.push('');
  lines.push('Target **2–3** quiz-ready players on Flamengo, Palmeiras, Corinthians, São Paulo, and Santos first. Use full names for mononyms (Pedro, Hulk, Luciano, Danilo) and avoid crowded surnames (Silva, Gabriel, Santos) without club context in hints.');
  lines.push('');
  return lines.join('\n');
}

function printConsoleSummary(report) {
  const { summary, clubs, globalSuggestions } = report;
  const under = clubs.filter((c) => c.neededForQuizTarget > 0);
  const healthy = clubs.filter((c) => c.quizReady >= MIN_QUIZ);

  console.log('FootyBrain editorial report\n');
  console.log(`Wrote ${path.relative(ROOT, BACKLOG_MD_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, BACKLOG_JSON_PATH)}\n`);
  console.log(`Quiz-eligible total: ${summary.quizEligibleTotal}`);
  console.log(`Browse-only remaining: ${summary.browseOnlyTotal}`);
  console.log(`Draft overlay approved: ${summary.approvedDraftOverlayCount}`);
  console.log(`Clubs under ${MIN_QUIZ} quiz-ready: ${summary.clubsUnderQuizTarget}`);
  console.log(`Clubs fully healthy: ${summary.clubsFullyHealthy}\n`);

  console.log('Strongest coverage:');
  for (const row of healthy.sort((a, b) => b.quizReady - a.quizReady).slice(0, 6)) {
    console.log(`  ${row.teamName} — ${row.quizReady} quiz-ready`);
  }

  console.log('\nWeakest coverage (need editorial):');
  for (const row of under.sort((a, b) => a.quizReady - b.quizReady).slice(0, 10)) {
    console.log(
      `  ${row.teamName} — ${row.quizReady}/${MIN_QUIZ} quiz-ready, ${row.browseOnly} browse-only`,
    );
  }

  console.log('\nTop suggested approvals:');
  for (const s of globalSuggestions.slice(0, 12)) {
    console.log(
      `  ${s.name} (${s.teamName}) — ${s.id}, importance ${s.importanceScore ?? '—'}`,
    );
  }
}

function main() {
  const report = buildReport();
  fs.mkdirSync(path.dirname(BACKLOG_JSON_PATH), { recursive: true });
  fs.writeFileSync(BACKLOG_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(BACKLOG_MD_PATH, `${renderMarkdown(report)}\n`);
  printConsoleSummary(report);
}

main();
