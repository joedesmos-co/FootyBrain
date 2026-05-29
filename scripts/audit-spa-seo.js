#!/usr/bin/env node
/**
 * SPA SEO readiness audit — static shell, route copy, boot script, H1 heuristics.
 * Run: node scripts/audit-spa-seo.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStaticRouteSeo } from '../src/utils/seoRouteCopy.js';
import { canonicalUrlForPath } from '../src/utils/brand.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const MAJOR_ROUTES = [
  '/',
  '/browse',
  '/teams',
  '/collections',
  '/learning-paths',
  '/national-teams',
  '/world-cup',
  '/compare',
  '/daily',
  '/quiz',
  '/club-quiz',
  '/hubs',
  '/hubs/quizzes',
  '/about',
  '/editorial',
  '/privacy',
  '/player/example-player',
  '/team/example-club',
  '/league/premier-league',
  '/national-team/england',
];

const issues = [];
const notes = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

// ——— index.html shell ———
const indexHtml = read('index.html');
if (!indexHtml.includes('id="crawl-shell"')) {
  issues.push('index.html: missing #crawl-shell static crawl block');
}
if (!indexHtml.includes('<noscript')) {
  issues.push('index.html: missing <noscript> fallback');
}
if (!indexHtml.includes('utils/seoBoot')) {
  issues.push('index.html: missing early seoBoot module script');
}

// ——— Route SEO coverage ———
for (const route of MAJOR_ROUTES) {
  const seo = getStaticRouteSeo(route);
  if (!seo.title || seo.title.length < 8) {
    issues.push(`Route ${route}: missing or short title`);
  }
  if (!seo.description || seo.description.length < 40) {
    issues.push(`Route ${route}: missing or short description`);
  }
  const canonical = canonicalUrlForPath(route);
  if (!canonical.startsWith('https://footycompass.com')) {
    issues.push(`Route ${route}: canonical does not use production host`);
  }
}

// ——— Component H1 heuristics ———
const h1Checks = [
  { file: 'src/components/Home.jsx', pattern: /<h1\b/ },
  { file: 'src/components/BrowseDatabase.jsx', pattern: /<h1\b/ },
  { file: 'src/components/PlayerProfile.jsx', pattern: /<h1\b/ },
  { file: 'src/components/TeamProfile.jsx', pattern: /<h1\b/ },
  { file: 'src/components/LeagueProfile.jsx', pattern: /<h1\b/ },
  { file: 'src/components/NationalTeamProfile.jsx', pattern: /<h1\b/ },
  { file: 'src/components/QuizMode.jsx', pattern: /<h1\b/ },
  { file: 'src/components/NotFoundPage.jsx', pattern: /<h1\b/ },
  { file: 'src/components/SeoHubs.jsx', pattern: /<h1\b/ },
];

for (const { file, pattern } of h1Checks) {
  const src = read(file);
  if (!pattern.test(src)) {
    issues.push(`${file}: no <h1> found (heuristic)`);
  }
}

// ——— BreadcrumbNav semantics ———
const breadcrumbSrc = read('src/components/BreadcrumbNav.jsx');
if (!breadcrumbSrc.includes('<ol')) {
  issues.push('BreadcrumbNav.jsx: expected semantic <ol> list');
}
if (!breadcrumbSrc.includes('aria-current')) {
  issues.push('BreadcrumbNav.jsx: expected aria-current on current crumb');
}

// ——— Boot + layout timing ———
if (!read('src/utils/seoBoot.js').includes('applyBootSeo')) {
  issues.push('src/utils/seoBoot.js: missing applyBootSeo');
}
if (!read('src/main.jsx').includes('seoBoot')) {
  issues.push('src/main.jsx: should import seoBoot before React render');
}
if (!read('src/components/Seo.jsx').includes('useLayoutEffect')) {
  issues.push('Seo.jsx: should use useLayoutEffect for route meta');
}

notes.push(`Checked ${MAJOR_ROUTES.length} major routes for title/description/canonical`);
notes.push(`H1 heuristic on ${h1Checks.length} key components`);

const outDir = path.join(root, 'generated-data');
fs.mkdirSync(outDir, { recursive: true });
const reportPath = path.join(outDir, 'spa-seo-audit.md');
const lines = [
  '# SPA SEO audit',
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

console.log('SPA SEO audit\n');
for (const n of notes) console.log(`  · ${n}`);
if (issues.length === 0) {
  console.log('\nNo issues found.');
  console.log(`Report: ${reportPath}`);
} else {
  console.log(`\nIssues (${issues.length}):`);
  for (const i of issues) console.log(`  ✗ ${i}`);
  console.log(`\nReport: ${reportPath}`);
  process.exitCode = 1;
}
