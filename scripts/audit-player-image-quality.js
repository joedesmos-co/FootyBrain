#!/usr/bin/env node
/**
 * Score all approved player images for portrait/quality heuristics.
 * Run: npm run audit:player-image-quality
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { players } from '../src/data/sampleData.js';
import {
  isDeniedCommonsFile,
  scorePlayerImage,
  MIN_APPROVAL_SCORE,
  MIN_AUTO_APPROVE_SCORE,
} from './lib/playerImageQuality.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const APPROVED_PATH = join(root, 'src/data/playerImageApproved.json');
const OUT_JSON = join(root, 'generated-data/player-image-quality-audit.json');
const OUT_MD = join(root, 'generated-data/player-image-quality-audit.md');

function readJson(path, fallback = {}) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function main() {
  const approved = readJson(APPROVED_PATH);
  const playerById = new Map(players.map((p) => [p.id, p]));
  const entries = approved.entries ?? {};

  const rows = Object.entries(entries).map(([playerId, entry]) => {
    const player = playerById.get(playerId);
    const meta = {
      commonsFile: entry.commonsFile,
      description: entry.commonsDescription,
      width: entry.imageWidth,
      height: entry.imageHeight,
    };
    const quality = scorePlayerImage(meta, player?.name ?? playerId);
    const denylisted = isDeniedCommonsFile(entry.commonsFile);
    return {
      playerId,
      name: player?.name ?? playerId,
      importance: player?.importanceScore ?? 0,
      commonsFile: entry.commonsFile,
      imageUrl: entry.imageUrl,
      width: entry.imageWidth ?? null,
      height: entry.imageHeight ?? null,
      qualityScore: quality.score,
      qualityGrade: quality.grade,
      flags: quality.flags,
      reasons: quality.reasons,
      pass: quality.pass && !denylisted,
      denylisted,
      storedScore: entry.qualityScore ?? null,
    };
  });

  rows.sort((a, b) => a.qualityScore - b.qualityScore || b.importance - a.importance);

  const failing = rows.filter((r) => !r.pass);
  const top100 = [...rows]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 100);

  const borderline = rows.filter(
    (r) => r.pass && r.qualityScore < MIN_AUTO_APPROVE_SCORE && r.qualityScore >= MIN_APPROVAL_SCORE,
  );

  const report = {
    generatedAt: new Date().toISOString(),
    thresholds: { minApprovalScore: MIN_APPROVAL_SCORE, minAutoApproveScore: MIN_AUTO_APPROVE_SCORE },
    totals: {
      approved: rows.length,
      passing: rows.filter((r) => r.pass).length,
      failing: failing.length,
      denylisted: rows.filter((r) => r.denylisted).length,
    },
    failing,
    borderline,
    all: rows,
    top100Review: top100.map((r) => ({
      playerId: r.playerId,
      name: r.name,
      score: r.qualityScore,
      grade: r.qualityGrade,
      pass: r.pass,
      commonsFile: r.commonsFile,
      flags: r.flags,
    })),
  };

  writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const md = [
    '# Player image quality audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `**Approved:** ${report.totals.approved} | **Passing:** ${report.totals.passing} | **Failing:** ${report.totals.failing} | **Borderline:** ${borderline.length}`,
    '',
    'Manual review: `npm run review:player-images` → `generated-data/player-image-review.html`',
    '',
    '## Top 100 players (by importance)',
    '',
    '| Player | Score | Grade | Pass | Flags | Commons file |',
    '| --- | ---: | --- | --- | --- | --- |',
    ...top100.map(
      (r) =>
        `| ${r.name} | ${r.qualityScore} | ${r.qualityGrade} | ${r.pass ? '✓' : '✗'} | ${r.flags.join(', ') || '—'} | ${r.commonsFile ?? '—'} |`,
    ),
    '',
    '## Failing images (replace or remove)',
    '',
    ...failing.map(
      (r) =>
        `- **${r.name}** (${r.playerId}) — score ${r.qualityScore}, ${r.flags.join(', ')} — \`${r.commonsFile}\``,
    ),
    '',
  ].join('\n');

  writeFileSync(OUT_MD, md, 'utf8');

  console.log(`Quality audit: ${report.totals.passing}/${report.totals.approved} passing`);
  console.log(`Failing: ${report.totals.failing} (${report.totals.denylisted} denylisted)`);
  console.log(`JSON: ${OUT_JSON}`);
  console.log(`Markdown: ${OUT_MD}`);
}

main();
