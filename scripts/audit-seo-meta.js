#!/usr/bin/env node
/**
 * Audit static route SEO copy for duplicate descriptions.
 * Run: node scripts/audit-seo-meta.js
 */

import { getStaticRouteSeo } from '../src/utils/seoRouteCopy.js';

const PATHS = [
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
  '/hubs/quizzes/themes',
  '/hubs/quizzes/clubs',
  '/hubs/players/by-nationality',
];

const byDescription = new Map();

for (const path of PATHS) {
  const seo = getStaticRouteSeo(path);
  const key = seo.description;
  if (!byDescription.has(key)) byDescription.set(key, []);
  byDescription.get(key).push(path);
}

const duplicates = [...byDescription.entries()].filter(([, paths]) => paths.length > 1);

console.log('SEO meta audit (static routes)\n');
if (duplicates.length === 0) {
  console.log('No duplicate meta descriptions among sampled static routes.');
} else {
  console.log(`Duplicate description groups: ${duplicates.length}`);
  for (const [desc, paths] of duplicates) {
    console.log(`\n— ${paths.join(', ')}`);
    console.log(`  ${desc.slice(0, 120)}…`);
  }
  process.exitCode = 1;
}
