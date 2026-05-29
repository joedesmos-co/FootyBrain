/**
 * Synchronous route SEO before React paints — mirrors getStaticRouteSeo + entity slug titles.
 * Safe to import from main.jsx and index.html (via Vite module script).
 */

import { canonicalUrlForPath, pageTitle, SITE_NAME, SITE_URL } from './brand.js';
import { getStaticRouteSeo } from './seoRouteCopy.js';
import { setSeoMeta } from './seoMeta.js';
const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og.png`;

const NOINDEX_EXACT = new Set(['/saved', '/profile', '/compare-clubs']);

function isNoIndexPath(pathname) {
  if (NOINDEX_EXACT.has(pathname)) return true;
  return pathname.startsWith('/dev/');
}

function humanizeSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Boot-time title from URL slug only (no invented player/club facts).
 * @param {string} pathname
 */
function entityBootTitle(pathname) {
  const rules = [
    { re: /^\/player\/([^/]+)\/?$/, prefix: 'Football player' },
    { re: /^\/team\/([^/]+)\/?$/, prefix: 'Football club' },
    { re: /^\/league\/([^/]+)\/?$/, prefix: 'Football league' },
    { re: /^\/national-team\/([^/]+)\/?$/, prefix: 'National football team' },
  ];

  for (const { re, prefix } of rules) {
    const match = pathname.match(re);
    if (match) {
      const label = humanizeSlug(match[1]);
      return pageTitle(`${prefix} — ${label}`);
    }
  }
  return null;
}

function updateCrawlShell({ title, pathname }) {
  const shell = document.getElementById('crawl-shell');
  if (!shell) return;

  const h1 = shell.querySelector('[data-crawl-h1]');
  if (h1 && title) {
    h1.textContent = String(title).replace(/\s*·\s*FootyCompass\s*$/i, '').trim() || SITE_NAME;
  }

  const pathEl = shell.querySelector('[data-crawl-path]');
  if (pathEl) pathEl.textContent = pathname;
}

/**
 * @param {string} [pathname]
 */
export function applyBootSeo(pathname = '/') {
  if (typeof document === 'undefined') return;

  const path = String(pathname || '/');
  const staticSeo = getStaticRouteSeo(path);
  const entityTitle = entityBootTitle(path);
  const title = entityTitle || staticSeo.title;
  const description = staticSeo.description;
  const canonicalUrl = canonicalUrlForPath(path);
  const robots = isNoIndexPath(path) ? 'noindex,nofollow' : 'index,follow';
  const ogType = entityTitle ? 'profile' : 'website';

  setSeoMeta({
    title,
    description,
    canonicalUrl,
    robots,
    og: {
      site_name: SITE_NAME,
      type: ogType,
      title,
      description,
      url: canonicalUrl,
      image: DEFAULT_SOCIAL_IMAGE,
      imageWidth: 1200,
      imageHeight: 630,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: DEFAULT_SOCIAL_IMAGE,
    },
  });

  updateCrawlShell({ title, pathname: path });
}

export function applyBootSeoFromLocation() {
  if (typeof window === 'undefined') return;
  applyBootSeo(window.location.pathname);
}

/** Hide static crawl shell once React has mounted (content remains in HTML source). */
export function dismissCrawlShell() {
  const shell = document.getElementById('crawl-shell');
  if (!shell) return;
  shell.setAttribute('hidden', '');
  shell.setAttribute('aria-hidden', 'true');
}
