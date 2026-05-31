#!/usr/bin/env node
/**
 * Full content completeness audit — players, clubs, leagues, national teams, images.
 *
 * Run: npm run audit:content-completeness
 * Outputs:
 *   generated-data/content-completeness-report.json
 *   generated-data/content-completeness-report.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { players, teams, leagues } from '../src/data/sampleData.js';
import liveNt from '../src/data/nationalTeamLive.json' with { type: 'json' };
import playerOverlays from '../src/data/playerEditorialOverlays.json' with { type: 'json' };
import teamOverlays from '../src/data/teamEditorialOverlays.json' with { type: 'json' };
import imageApproved from '../src/data/playerImageApproved.json' with { type: 'json' };
import {
  TOP_PLAYER_COUNT,
  auditLeagueGaps,
  auditNationalTeamGaps,
  auditPlayerGaps,
  auditTeamGaps,
  countClubEditorialDepth,
  countLeagueEditorialDepth,
  countNationalEditorialDepth,
  countPlayerEditorialDepth,
  gapCount,
  isMajorClub,
  isPlaceholderClubCopy,
  isThinLeague,
  isThinNationalTeam,
  isThinPlayer,
  isThinTeam,
} from '../src/utils/entityDepthAudit.js';
import { mergePlayerOverlay, mergeTeamOverlay } from '../src/data/editorialOverlayAccess.js';
import { isBrowseOnlyPlayer } from './lib/playerOverlayBuilders.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'generated-data/content-completeness-report.json');
const OUT_MD = path.join(ROOT, 'generated-data/content-completeness-report.md');

const BROWSE_MIN = Number(process.env.BROWSE_MIN_IMPORTANCE ?? 48) || 48;

function rosterImportanceSum(teamId) {
  return players
    .filter((p) => p.teamId === teamId)
    .reduce((s, p) => s + (Number(p.importanceScore) || 0), 0);
}

const inLeaguePlayers = players.filter((p) => p.leagueId !== 'external');
const playerOverlayMap = playerOverlays.overlays ?? {};
const teamOverlayMap = teamOverlays.overlays ?? {};
const imageMap = imageApproved.entries ?? {};

const mergedPlayers = inLeaguePlayers.map((p) => {
  const merged = mergePlayerOverlay(p);
  const gaps = auditPlayerGaps(merged);
  return {
    id: p.id,
    name: p.name,
    importance: Number(p.importanceScore) || 0,
    leagueId: p.leagueId,
    browseOnly: isBrowseOnlyPlayer(p),
    hasOverlay: Boolean(playerOverlayMap[p.id]),
    hasApprovedImage: Boolean(imageMap[p.id]?.imageUrl),
    depth: countPlayerEditorialDepth(merged),
    thin: isThinPlayer(merged, 3),
    gapCount: gapCount(gaps),
    gaps,
  };
});

const topPlayers = [...mergedPlayers]
  .sort((a, b) => b.importance - a.importance)
  .slice(0, TOP_PLAYER_COUNT);

const browseHigh = mergedPlayers.filter((p) => p.browseOnly && p.importance >= BROWSE_MIN);

const majorClubs = teams.filter(isMajorClub).map((t) => {
  const merged = mergeTeamOverlay(t);
  const gaps = auditTeamGaps(merged);
  return {
    id: t.id,
    name: t.name,
    leagueId: t.leagueId,
    rosterImportanceSum: rosterImportanceSum(t.id),
    placeholder: isPlaceholderClubCopy(t),
    hasOverlay: Boolean(teamOverlayMap[t.id]),
    depth: countClubEditorialDepth(merged),
    thin: isThinTeam(merged, 3),
    gapCount: gapCount(gaps),
    gaps,
  };
});

const hubLeagues = leagues.filter((l) => l.id && l.id !== 'external').map((l) => {
  const gaps = auditLeagueGaps(l);
  return {
    id: l.id,
    name: l.name,
    depth: countLeagueEditorialDepth(l),
    thin: isThinLeague(l, 3),
    gapCount: gapCount(gaps),
    gaps,
  };
});

const nationalTeams = (liveNt.nationalTeams ?? []).map((nt) => {
  const gaps = auditNationalTeamGaps(nt);
  return {
    id: nt.id,
    displayName: nt.displayName,
    depth: countNationalEditorialDepth(nt),
    thin: isThinNationalTeam(nt, 3),
    gapCount: gapCount(gaps),
    gaps,
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    players: {
      inLeague: inLeaguePlayers.length,
      withOverlay: mergedPlayers.filter((p) => p.hasOverlay).length,
      thinDepthLe3: mergedPlayers.filter((p) => p.thin).length,
      top300Thin: topPlayers.filter((p) => p.thin).length,
      browseOnlyGte48: browseHigh.length,
      browseOnlyGte48NoOverlay: browseHigh.filter((p) => !p.hasOverlay).length,
      missingApprovedImageTop100: topPlayers
        .slice(0, 100)
        .filter((p) => !p.hasApprovedImage).length,
      approvedImagesTotal: Object.keys(imageMap).length,
    },
    clubs: {
      major: majorClubs.length,
      withOverlay: majorClubs.filter((c) => c.hasOverlay).length,
      thin: majorClubs.filter((c) => c.thin).length,
      placeholderCopy: majorClubs.filter((c) => c.placeholder).length,
    },
    leagues: {
      hub: hubLeagues.length,
      thin: hubLeagues.filter((l) => l.thin).length,
      withGaps: hubLeagues.filter((l) => l.gapCount > 0).length,
    },
    nationalTeams: {
      live: nationalTeams.length,
      thin: nationalTeams.filter((n) => n.thin).length,
      withGaps: nationalTeams.filter((n) => n.gapCount > 0).length,
    },
  },
  samples: {
    thinTopPlayers: topPlayers.filter((p) => p.thin).slice(0, 15),
    browseNoOverlay: browseHigh.filter((p) => !p.hasOverlay).slice(0, 15),
    thinClubs: majorClubs.filter((c) => c.thin || c.placeholder).slice(0, 15),
    thinLeagues: hubLeagues.filter((l) => l.thin).slice(0, 10),
    thinNationalTeams: nationalTeams.filter((n) => n.thin).slice(0, 10),
  },
};

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

const s = report.summary;
const md = `# Content completeness report

Generated: ${report.generatedAt}

## Players

| Metric | Count |
|--------|------:|
| In-league players | ${s.players.inLeague} |
| With editorial overlay | ${s.players.withOverlay} |
| Thin (depth ≤3) | ${s.players.thinDepthLe3} |
| Top 300 thin | ${s.players.top300Thin} |
| Browse-only (importance ≥${BROWSE_MIN}) | ${s.players.browseOnlyGte48} |
| Browse-only ≥${BROWSE_MIN} without overlay | ${s.players.browseOnlyGte48NoOverlay} |
| Top 100 missing approved image | ${s.players.missingApprovedImageTop100} |
| Approved Wikimedia images | ${s.players.approvedImagesTotal} |

## Clubs

| Metric | Count |
|--------|------:|
| Major clubs | ${s.clubs.major} |
| With overlay | ${s.clubs.withOverlay} |
| Thin | ${s.clubs.thin} |
| Placeholder expansion copy | ${s.clubs.placeholderCopy} |

## Leagues

| Metric | Count |
|--------|------:|
| Hub leagues | ${s.leagues.hub} |
| Thin | ${s.leagues.thin} |
| With content gaps | ${s.leagues.withGaps} |

## National teams

| Metric | Count |
|--------|------:|
| Live nations | ${s.nationalTeams.live} |
| Thin | ${s.nationalTeams.thin} |
| With content gaps | ${s.nationalTeams.withGaps} |

## Commands

\`\`\`bash
npm run enrich:content-depth-full
npm run audit:content-completeness
npm run audit:weak-entities
\`\`\`
`;

fs.writeFileSync(OUT_MD, md);

console.log('Content completeness audit');
console.log(`  Players: ${s.players.withOverlay}/${s.players.inLeague} overlays, ${s.players.thinDepthLe3} thin`);
console.log(`  Browse-only ≥${BROWSE_MIN} without overlay: ${s.players.browseOnlyGte48NoOverlay}`);
console.log(`  Clubs: ${s.clubs.withOverlay}/${s.clubs.major} overlays, ${s.clubs.thin} thin`);
console.log(`  Leagues thin: ${s.leagues.thin}, Nations thin: ${s.nationalTeams.thin}`);
console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
