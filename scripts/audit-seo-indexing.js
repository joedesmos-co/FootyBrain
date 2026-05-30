#!/usr/bin/env node
/**
 * Final SEO / indexing sanity audit — sitemap, robots, meta copy, crawl shell, noindex routes.
 * Run: node scripts/audit-seo-indexing.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalUrlForPath, SITE_URL } from '../src/utils/brand.js';
import { getStaticRouteSeo } from '../src/utils/seoRouteCopy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'public/sitemap.xml');
const ROBOTS_PATH = path.join(ROOT, 'public/robots.txt');

const NOINDEX_PATHS = new Set(['/saved', '/profile', '/compare-clubs']);
const NOINDEX_PREFIXES = ['/dev/'];

const STATIC_SITEMAP_ROUTES = [
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

const REQUIRED_INDEX_TAGS = [
  'rel="canonical"',
  'property="og:title"',
  'property="og:description"',
  'property="og:url"',
  'property="og:image"',
  'name="twitter:card"',
  'name="twitter:title"',
  'name="twitter:description"',
  'name="twitter:image"',
  'id="crawl-shell"',
  'applyBootSeoFromLocation',
];

const H1_COMPONENTS = [
  'src/components/Home.jsx',
  'src/components/BrowseDatabase.jsx',
  'src/components/PlayerProfile.jsx',
  'src/components/TeamProfile.jsx',
  'src/components/LeagueProfile.jsx',
  'src/components/NationalTeamProfile.jsx',
  'src/components/NationalTeamsPage.jsx',
  'src/components/QuizMode.jsx',
  'src/components/ClubQuizMode.jsx',
  'src/components/CollectionsPage.jsx',
  'src/components/CollectionDetailPage.jsx',
  'src/components/LearningPathsPage.jsx',
  'src/components/TeamLearning.jsx',
  'src/components/NotFoundPage.jsx',
  'src/components/SeoHubs.jsx',
];

const issues = [];
const notes = [];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function pathFromLoc(loc) {
  try {
    const u = new URL(loc);
    return u.pathname.replace(/\/$/, '') || '/';
  } catch {
    return null;
  }
}

function isNoIndexPath(pathname) {
  if (NOINDEX_PATHS.has(pathname)) return true;
  return NOINDEX_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ——— Sitemap ———
if (!fs.existsSync(SITEMAP_PATH)) {
  issues.push('public/sitemap.xml missing — run npm run build or write:sitemap');
} else {
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const paths = locs.map(pathFromLoc);

  notes.push(`Sitemap URLs: ${locs.length}`);

  for (const loc of locs) {
    if (!loc.startsWith(`${SITE_URL}/`) && loc !== `${SITE_URL}`) {
      issues.push(`Sitemap loc not on ${SITE_URL}: ${loc}`);
    }
    if (loc.includes('?') || loc.includes('#')) {
      issues.push(`Sitemap loc has query/fragment: ${loc}`);
    }
  }

  for (const p of paths) {
    if (!p) continue;
    if (p.startsWith('/dev/')) issues.push(`Sitemap includes dev route: ${p}`);
    if (NOINDEX_PATHS.has(p)) issues.push(`Sitemap includes noindex route: ${p}`);
  }

  for (const route of STATIC_SITEMAP_ROUTES) {
    const expected = canonicalUrlForPath(route);
    if (!locs.includes(expected)) {
      issues.push(`Sitemap missing static route: ${route}`);
    }
  }

  const dupPaths = paths.filter((p, i) => paths.indexOf(p) !== i);
  if (dupPaths.length) {
    issues.push(`Sitemap duplicate paths: ${[...new Set(dupPaths)].slice(0, 5).join(', ')}`);
  }
}

// ——— robots.txt ———
if (!fs.existsSync(ROBOTS_PATH)) {
  issues.push('public/robots.txt missing');
} else {
  const robots = fs.readFileSync(ROBOTS_PATH, 'utf8');
  if (!robots.includes('Sitemap:')) {
    issues.push('robots.txt missing Sitemap directive');
  }
  for (const p of NOINDEX_PATHS) {
    if (!robots.includes(`Disallow: ${p}`)) {
      issues.push(`robots.txt missing Disallow: ${p}`);
    }
  }
  if (!robots.includes('Disallow: /dev/')) {
    issues.push('robots.txt missing Disallow: /dev/');
  }
  if (!robots.includes('Disallow: /*?')) {
    issues.push('robots.txt missing Disallow: /*?');
  }
}

// ——— index.html crawl shell + social ———
const indexHtml = read('index.html');
for (const tag of REQUIRED_INDEX_TAGS) {
  if (!indexHtml.includes(tag)) {
    issues.push(`index.html missing ${tag}`);
  }
}

// ——— Static route meta ———
const titles = new Map();
const descriptions = new Map();

for (const route of STATIC_SITEMAP_ROUTES) {
  const seo = getStaticRouteSeo(route);
  if (!seo.title || seo.title.length < 8) {
    issues.push(`Static route ${route}: missing or short title`);
  }
  if (!seo.description || seo.description.length < 40) {
    issues.push(`Static route ${route}: missing or short description`);
  }
  const canon = canonicalUrlForPath(route);
  if (!canon.startsWith(SITE_URL)) {
    issues.push(`Static route ${route}: bad canonical host`);
  }

  if (titles.has(seo.title)) titles.get(seo.title).push(route);
  else titles.set(seo.title, [route]);

  if (descriptions.has(seo.description)) descriptions.get(seo.description).push(route);
  else descriptions.set(seo.description, [route]);
}

for (const [title, routes] of titles) {
  if (routes.length > 1) {
    issues.push(`Duplicate title on routes: ${routes.join(', ')} → "${title.slice(0, 60)}…"`);
  }
}

for (const [desc, routes] of descriptions) {
  if (routes.length > 1) {
    issues.push(
      `Duplicate description on routes: ${routes.join(', ')} → "${desc.slice(0, 60)}…"`,
    );
  }
}

// ——— Breadcrumb JSON-LD absolute URLs (mirrors buildBreadcrumbJsonLd) ———
function normalizeBreadcrumbItem(rawItem) {
  return rawItem && String(rawItem).startsWith('http')
    ? rawItem
    : canonicalUrlForPath(rawItem || '/');
}

const sampleItems = [
  { name: 'Home', item: '/' },
  { name: 'Browse', item: '/browse' },
];
for (const row of sampleItems) {
  const item = normalizeBreadcrumbItem(row.item);
  if (!String(item).startsWith('http')) {
    issues.push('Breadcrumb JSON-LD: relative item URLs not normalized');
    break;
  }
}

// ——— seoBoot noindex parity ———
const bootSrc = read('src/utils/seoBoot.js');
for (const p of NOINDEX_PATHS) {
  if (!bootSrc.includes(`'${p}'`)) {
    issues.push(`seoBoot.js missing noindex path: ${p}`);
  }
}

const seoComponent = read('src/components/Seo.jsx');
for (const p of NOINDEX_PATHS) {
  if (!seoComponent.includes(`'${p}'`)) {
    issues.push(`Seo.jsx missing noindex path: ${p}`);
  }
}

// ——— H1 heuristics ———
for (const file of H1_COMPONENTS) {
  if (!read(file).includes('<h1')) {
    issues.push(`${file}: no <h1> found (heuristic)`);
  }
}

// ——— Entity SEO hooks ———
const entitySeoFiles = [
  ['src/components/PlayerProfile.jsx', 'applyPageSeo'],
  ['src/components/TeamProfile.jsx', 'applyPageSeo'],
  ['src/components/NationalTeamProfile.jsx', 'applyPageSeo'],
  ['src/components/CollectionDetailPage.jsx', 'applyPageSeo'],
  ['src/components/CollectionDetailPage.jsx', 'applyEntityNotFoundSeo'],
  ['src/components/QuizMode.jsx', 'canonicalUrl'],
  ['src/components/ClubQuizMode.jsx', 'canonicalUrl'],
];

for (const [file, needle] of entitySeoFiles) {
  if (!read(file).includes(needle)) {
    issues.push(`${file}: missing ${needle} for entity SEO`);
  }
}

notes.push(`Checked ${STATIC_SITEMAP_ROUTES.length} static sitemap routes for meta copy`);
notes.push(`H1 heuristic on ${H1_COMPONENTS.length} priority components`);

const outDir = path.join(ROOT, 'generated-data');
fs.mkdirSync(outDir, { recursive: true });
const reportPath = path.join(outDir, 'seo-indexing-audit.md');
const lines = [
  '# SEO indexing audit',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  issues.length === 0 ? '**Status: pass**' : `**Status: ${issues.length} issue(s)**`,
  '',
  '## Notes',
  ...notes.map((n) => `- ${n}`),
  '',
];

if (issues.length) {
  lines.push('## Issues', '', ...issues.map((i) => `- ${i}`), '');
}

fs.writeFileSync(reportPath, lines.join('\n'));

console.log('SEO indexing audit\n');
for (const n of notes) console.log(`  · ${n}`);
if (issues.length === 0) {
  console.log('\nNo issues found.');
} else {
  console.log(`\nIssues (${issues.length}):`);
  for (const i of issues.slice(0, 25)) console.log(`  ✗ ${i}`);
  if (issues.length > 25) console.log(`  … and ${issues.length - 25} more`);
}
console.log(`\nReport: ${reportPath}`);

if (issues.length) process.exitCode = 1;
