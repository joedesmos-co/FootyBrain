#!/usr/bin/env node
/**
 * Generate sitemap.xml for static hosting.
 *
 * - Frontend-only: reads local data files at build time.
 * - Excludes dev routes and query-parameter spam routes (quiz, compare, etc.).
 * - Supports future scaling via sitemap index when URL count grows.
 *
 * Env:
 * - SITE_URL (recommended): https://footycompass.com
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const DEFAULT_SITE_URL = 'https://footycompass.com';
const SITE_URL = String(process.env.SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, '');
const DATA_AS_OF = (() => {
  try {
    const raw = fs.readFileSync(path.join(ROOT, 'src/data/datasetMeta.js'), 'utf8');
    const m = raw.match(/dataAsOf:\s*'([^']+)'/);
    return m?.[1] ?? new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
})();

const MAX_URLS_PER_SITEMAP = 45000;

function toIsoDate(dateLike) {
  const value = String(dateLike ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absUrl(pathname) {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${SITE_URL}${p}`;
}

function urlEntry({ loc, lastmod }) {
  const last = toIsoDate(lastmod);
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    last ? `    <lastmod>${escapeXml(last)}</lastmod>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

function writeSitemapFile(filename, urls) {
  const body = urls.map(urlEntry).join('\n');
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</urlset>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(PUBLIC_DIR, filename), xml);
}

function writeSitemapIndex(files) {
  const entries = files
    .map((file) => {
      const loc = absUrl(`/${file}`);
      return [
        '  <sitemap>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${escapeXml(DATA_AS_OF)}</lastmod>`,
        '  </sitemap>',
      ].join('\n');
    })
    .join('\n');
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</sitemapindex>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), xml);
}

async function loadData() {
  const { players, teams, leagues } = await import('../src/data/sampleData.js');
  const { QUIZ_THEME_CATALOG } = await import('../src/data/quizThemes.js');
  const { CLUB_QUIZ_CATEGORY_CATALOG } = await import('../src/data/clubQuizCategories.js');
  const ntLive = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/data/nationalTeamLive.json'), 'utf8'),
  );
  const { collections } = await import('../src/data/collectionsData.js');
  const { learningPaths } = await import('../src/data/learningPathsData.js');
  return {
    players,
    teams,
    leagues,
    liveNationalTeamIds: ntLive?.meta?.liveNationalTeamIds ?? [],
    collections,
    learningPaths,
    quizThemes: QUIZ_THEME_CATALOG,
    clubQuizCategories: CLUB_QUIZ_CATEGORY_CATALOG,
  };
}

function buildIndexableRoutes(data) {
  const urls = [];

  // Static pages (indexable)
  const staticIndexable = [
    '/',
    '/browse',
    '/teams',
    '/collections',
    '/learning-paths',
    '/national-teams',
    '/world-cup',
    '/quiz',
    '/compare',
    '/daily',
    '/onboarding',
    '/about',
    '/editorial',
    '/privacy',
    '/hubs',
    '/hubs/quizzes',
    '/hubs/quizzes/themes',
    '/hubs/quizzes/clubs',
    '/club-quiz',
    '/hubs/players/by-nationality',
    '/hubs/players/best-young-footballers',
    '/hubs/world-cup/player-quiz',
    '/hubs/learn/football-players',
  ];

  for (const p of staticIndexable) {
    urls.push({ loc: absUrl(p), lastmod: DATA_AS_OF });
  }

  for (const theme of data.quizThemes ?? []) {
    if (!theme?.id) continue;
    urls.push({ loc: absUrl(`/hubs/quizzes/theme/${theme.id}`), lastmod: DATA_AS_OF });
  }

  for (const cat of data.clubQuizCategories ?? []) {
    if (!cat?.id) continue;
    urls.push({ loc: absUrl(`/hubs/quizzes/clubs/${cat.id}`), lastmod: DATA_AS_OF });
  }

  // Leagues
  for (const league of data.leagues ?? []) {
    urls.push({ loc: absUrl(`/league/${league.id}`), lastmod: DATA_AS_OF });
    if (league.id !== 'external') {
      urls.push({ loc: absUrl(`/hubs/quizzes/league/${league.id}`), lastmod: DATA_AS_OF });
    }
  }

  // Teams (exclude external league: still valid routes, but keep sitemap focused on core clubs)
  for (const team of data.teams ?? []) {
    if (team.leagueId === 'external') continue;
    urls.push({ loc: absUrl(`/team/${team.id}`), lastmod: DATA_AS_OF });
    urls.push({ loc: absUrl(`/hubs/quizzes/team/${team.id}`), lastmod: DATA_AS_OF });
  }

  // Players (exclude external league players to avoid indexing low-signal stubs)
  for (const player of data.players ?? []) {
    if (player.leagueId === 'external') continue;
    const browseOnly =
      player.quizEligible === false ||
      player.dataStatus === 'generated-needs-editorial' ||
      !(Array.isArray(player.quizHints) && player.quizHints.length > 0);
    if (browseOnly) continue;
    urls.push({ loc: absUrl(`/player/${player.id}`), lastmod: DATA_AS_OF });
  }

  // Nationality hubs (index top N by player count to avoid sitemap bloat).
  const nationCounts = new Map();
  for (const player of data.players ?? []) {
    const nation = String(player?.nationality ?? '').trim();
    if (!nation) continue;
    nationCounts.set(nation, (nationCounts.get(nation) ?? 0) + 1);
  }
  const topNations = [...nationCounts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, 80)
    .map(([nation]) => nation);
  for (const nation of topNations) {
    urls.push({
      loc: absUrl(`/hubs/players/nationality/${encodeURIComponent(nation)}`),
      lastmod: DATA_AS_OF,
    });
  }

  // National teams (live only)
  for (const id of data.liveNationalTeamIds ?? []) {
    urls.push({ loc: absUrl(`/national-team/${id}`), lastmod: DATA_AS_OF });
  }

  // Collections and learning paths
  for (const c of data.collections ?? []) {
    if (!c?.id) continue;
    urls.push({ loc: absUrl(`/collections/${c.id}`), lastmod: DATA_AS_OF });
  }

  for (const p of data.learningPaths ?? []) {
    if (!p?.id) continue;
    urls.push({ loc: absUrl(`/learning-paths/${p.id}`), lastmod: DATA_AS_OF });
  }

  // Safety: ensure no /dev routes and no query params
  return urls
    .filter((u) => !u.loc.includes('/dev/'))
    .filter((u) => !u.loc.includes('?'))
    .filter((u) => !u.loc.includes('#'));
}

async function main() {
  const data = await loadData();
  const urls = buildIndexableRoutes(data);

  if (urls.length <= MAX_URLS_PER_SITEMAP) {
    writeSitemapFile('sitemap.xml', urls);
    console.log(`Wrote public/sitemap.xml (${urls.length} urls)`);
    return;
  }

  // Split into multiple sitemap files and write index.
  const files = [];
  let i = 0;
  for (let offset = 0; offset < urls.length; offset += MAX_URLS_PER_SITEMAP) {
    i += 1;
    const chunk = urls.slice(offset, offset + MAX_URLS_PER_SITEMAP);
    const filename = `sitemap-${String(i).padStart(3, '0')}.xml`;
    writeSitemapFile(filename, chunk);
    files.push(filename);
  }
  writeSitemapIndex(files);
  console.log(`Wrote public/sitemap.xml index + ${files.length} chunks (${urls.length} urls)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

