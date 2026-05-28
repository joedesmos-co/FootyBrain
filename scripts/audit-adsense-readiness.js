#!/usr/bin/env node
/**
 * AdSense / Google quality readiness audit (static checks).
 * Run: npm run audit:adsense-readiness
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStaticRouteSeo } from '../src/utils/seoRouteCopy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

const NOINDEX_PATHS = ['/dev/', '/saved', '/profile', '/compare-clubs'];
const TRUST_PATHS = ['/about', '/editorial', '/privacy'];
const REQUIRED_SITEMAP_PATHS = TRUST_PATHS;
const FORBIDDEN_SITEMAP_PATHS = ['/compare-clubs', '/dev/', '/saved', '/profile'];

let failures = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures += 1;
}

function pass(msg) {
  console.log(`OK: ${msg}`);
}

// ads.txt
const adsPath = path.join(PUBLIC, 'ads.txt');
if (!fs.existsSync(adsPath)) {
  fail('public/ads.txt missing');
} else {
  const ads = fs.readFileSync(adsPath, 'utf8').trim();
  if (!/google\.com,\s*pub-\d+,\s*DIRECT/i.test(ads)) {
    fail('ads.txt missing valid google.com DIRECT line');
  } else {
    pass('ads.txt has Google publisher line');
  }
}

// robots.txt
const robotsPath = path.join(PUBLIC, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  fail('public/robots.txt missing');
} else {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  if (/Sitemap:\s*https?:\/\//i.test(robots)) pass('robots.txt declares sitemap');
  else fail('robots.txt missing Sitemap directive');
  if (!robots.includes('Disallow: /dev/')) fail('robots.txt should disallow /dev/');
  else pass('robots.txt blocks /dev/');
  if (robots.includes('Disallow: /*?')) pass('robots.txt blocks query-string URLs');
  else fail('robots.txt should Disallow: /*? to reduce thin URL variants');
}

// sitemap (may be stale until postbuild — warn if missing trust paths)
const sitemapPath = path.join(PUBLIC, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  fail('public/sitemap.xml missing — run npm run write:sitemap or build');
} else {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  for (const p of REQUIRED_SITEMAP_PATHS) {
    const needle = `<loc>https://footycompass.com${p}</loc>`;
    const alt = p; // also accept env SITE_URL mismatch loosely
    if (!xml.includes(`${p}</loc>`)) {
      fail(`sitemap missing ${p} (run write:sitemap after generate-sitemap.js change)`);
    } else {
      pass(`sitemap includes ${p}`);
    }
  }
  let forbiddenInSitemap = false;
  for (const p of FORBIDDEN_SITEMAP_PATHS) {
    if (xml.includes(`${p}</loc>`) || xml.includes(`>${p}<`)) {
      fail(`sitemap should not list noindex/low-value route ${p}`);
      forbiddenInSitemap = true;
    }
  }
  if (!forbiddenInSitemap) pass('sitemap excludes known noindex routes');
}

// Trust pages SEO + copy presence
for (const p of TRUST_PATHS) {
  const seo = getStaticRouteSeo(p);
  if (!seo?.title || seo.title.length < 12) fail(`${p} missing title in seoRouteCopy`);
  else pass(`${p} has static SEO title`);
  if (!seo?.description || seo.description.length < 40) {
    fail(`${p} description too short for quality signals`);
  } else {
    pass(`${p} has substantive meta description`);
  }
}

// Component files exist
const trustComponents = [
  'src/components/AboutPage.jsx',
  'src/components/EditorialPolicyPage.jsx',
  'src/components/PrivacyPage.jsx',
  'src/utils/siteTrust.js',
];
for (const rel of trustComponents) {
  if (!fs.existsSync(path.join(ROOT, rel))) fail(`missing ${rel}`);
  else pass(`found ${rel}`);
}

// noindex alignment (documented paths)
console.log('\nNoindex paths (must not be in sitemap):', NOINDEX_PATHS.join(', '));

console.log(`\nAdSense readiness audit: ${failures === 0 ? 'PASSED' : `${failures} failure(s)`}`);
if (failures > 0) process.exitCode = 1;
