#!/usr/bin/env node
/**
 * Generate an HTML gallery for manual player image review.
 * Run: npm run review:player-images
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { players } from '../src/data/sampleData.js';
import { MIN_APPROVAL_SCORE, MIN_AUTO_APPROVE_SCORE, scorePlayerImage } from './lib/playerImageQuality.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const APPROVED_PATH = join(root, 'src/data/playerImageApproved.json');
const OUT_HTML = join(root, 'generated-data/player-image-review.html');

function readJson(path, fallback = {}) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function card(row) {
  const img = row.imageUrl
    ? `<img src="${esc(row.imageUrl)}" alt="${esc(row.name)}" loading="lazy" />`
    : '<div class="ph">No image</div>';
  const badgeClass = row.pass ? 'pass' : 'fail';
  return `<article class="card ${badgeClass}">
    <div class="img">${img}</div>
    <div class="meta">
      <h2>${esc(row.name)}</h2>
      <p class="id">${esc(row.playerId)} · importance ${row.importance}</p>
      <p class="score">Score <strong>${row.qualityScore}</strong> · ${esc(row.qualityGrade)}</p>
      <p class="flags">${esc(row.flags.join(', ') || '—')}</p>
      <p class="file">${esc(row.commonsFile ?? '—')}</p>
      <p class="dims">${row.width ?? '?'}×${row.height ?? '?'}</p>
    </div>
  </article>`;
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
    return {
      playerId,
      name: player?.name ?? playerId,
      importance: player?.importanceScore ?? 0,
      imageUrl: entry.imageUrl,
      commonsFile: entry.commonsFile,
      width: entry.imageWidth,
      height: entry.imageHeight,
      qualityScore: quality.score,
      qualityGrade: quality.grade,
      flags: quality.flags,
      pass: quality.pass,
    };
  });

  const top100 = [...rows].sort((a, b) => b.importance - a.importance).slice(0, 100);
  const borderline = rows
    .filter((r) => r.pass && r.qualityScore < MIN_AUTO_APPROVE_SCORE && r.qualityScore >= MIN_APPROVAL_SCORE)
    .sort((a, b) => a.qualityScore - b.qualityScore);
  const failing = rows.filter((r) => !r.pass);

  mkdirSync(dirname(OUT_HTML), { recursive: true });

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>FootyCompass player image review</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b1511; color: #e8f0ea; margin: 0; padding: 1rem; }
    h1 { font-size: 1.25rem; }
    section { margin: 2rem 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .card { background: #101a17; border: 1px solid rgba(167,243,208,.16); border-radius: 10px; overflow: hidden; }
    .card.fail { border-color: rgba(251,113,133,.45); }
    .card .img { aspect-ratio: 4/5; background: #07110d; display: grid; place-items: center; }
    .card img { width: 100%; height: 100%; object-fit: cover; }
    .ph { color: #6b7f74; font-size: 0.85rem; }
    .meta { padding: 0.65rem 0.75rem; font-size: 0.78rem; line-height: 1.35; }
    .meta h2 { margin: 0 0 0.25rem; font-size: 0.95rem; }
    .score strong { color: #34d399; }
    .flags, .file, .dims { color: #9fb0a6; word-break: break-word; }
    .summary { color: #9fb0a6; }
  </style>
</head>
<body>
  <h1>Player image review</h1>
  <p class="summary">Generated ${new Date().toISOString()} · ${rows.length} approved · thresholds: pass ≥ ${MIN_APPROVAL_SCORE}, auto ≥ ${MIN_AUTO_APPROVE_SCORE}</p>

  <section>
    <h2>Failing (${failing.length})</h2>
    <div class="grid">${failing.map(card).join('') || '<p>None</p>'}</div>
  </section>

  <section>
    <h2>Borderline passing (${borderline.length})</h2>
    <div class="grid">${borderline.map(card).join('') || '<p>None</p>'}</div>
  </section>

  <section>
    <h2>Top 100 by importance</h2>
    <div class="grid">${top100.map(card).join('')}</div>
  </section>
</body>
</html>`;

  writeFileSync(OUT_HTML, html, 'utf8');
  console.log(`Review gallery: ${OUT_HTML}`);
  console.log(`Approved: ${rows.length} | Failing: ${failing.length} | Borderline: ${borderline.length}`);
}

main();
