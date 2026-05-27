import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'FootyBrain';
const SITE_DESCRIPTION =
  'FootyBrain helps you learn football players, clubs, leagues, history, and national teams through interactive quizzes and profiles.';

function ensureLink(rel) {
  let el = document.querySelector(`link[rel='${rel}']`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  return el;
}

function ensureMeta(name) {
  let el = document.querySelector(`meta[name='${name}']`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  return el;
}

function ensureMetaProperty(property) {
  let el = document.querySelector(`meta[property='${property}']`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  return el;
}

function buildCanonical(pathname) {
  const origin = window.location.origin;
  return `${origin}${pathname}`;
}

function isNoIndexPath(pathname) {
  return (
    pathname.startsWith('/dev/') ||
    pathname === '/quiz' ||
    pathname === '/compare' ||
    pathname === '/compare-clubs' ||
    pathname === '/saved' ||
    pathname === '/profile' ||
    pathname === '/daily'
  );
}

function titleForPath(pathname) {
  if (pathname === '/') return SITE_NAME;
  if (pathname === '/browse') return 'Browse players · FootyBrain';
  if (pathname === '/teams') return 'Teams · FootyBrain';
  if (pathname === '/collections') return 'Collections & paths · FootyBrain';
  if (pathname === '/learning-paths') return 'Learning paths · FootyBrain';
  if (pathname === '/national-teams') return 'National teams · FootyBrain';
  if (pathname === '/world-cup') return 'World Cup 2026 · FootyBrain';
  if (pathname === '/privacy') return 'Privacy · FootyBrain';
  if (pathname === '/onboarding') return 'How it works · FootyBrain';
  return SITE_NAME;
}

/**
 * Minimal SPA SEO hygiene:
 * - canonical points to pathname only (no query params)
 * - robots noindex on non-indexable paths (quiz/compare/dev/saved/profile/daily)
 * - title baseline per route (entity pages get upgraded where possible by their own components later)
 */
export default function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const canonicalUrl = buildCanonical(pathname);
    const title = titleForPath(pathname);
    const indexable = !isNoIndexPath(pathname);

    const canonical = ensureLink('canonical');
    canonical.setAttribute('href', canonicalUrl);

    const robots = ensureMeta('robots');
    robots.setAttribute('content', indexable ? 'index,follow' : 'noindex,nofollow');

    const description = ensureMeta('description');
    description.setAttribute('content', SITE_DESCRIPTION);

    // Open Graph + Twitter baseline (static preview; per-entity upgrades can be layered later).
    ensureMetaProperty('og:site_name').setAttribute('content', SITE_NAME);
    ensureMetaProperty('og:type').setAttribute('content', 'website');
    ensureMetaProperty('og:title').setAttribute('content', title);
    ensureMetaProperty('og:description').setAttribute('content', SITE_DESCRIPTION);
    ensureMetaProperty('og:url').setAttribute('content', canonicalUrl);

    ensureMeta('twitter:card').setAttribute('content', 'summary');
    ensureMeta('twitter:title').setAttribute('content', title);
    ensureMeta('twitter:description').setAttribute('content', SITE_DESCRIPTION);

    document.title = title;
  }, [pathname]);

  return null;
}

