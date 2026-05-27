import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
  if (pathname === '/') return 'FootyBrain';
  if (pathname === '/browse') return 'Browse players · FootyBrain';
  if (pathname === '/teams') return 'Teams · FootyBrain';
  if (pathname === '/collections') return 'Collections & paths · FootyBrain';
  if (pathname === '/learning-paths') return 'Learning paths · FootyBrain';
  if (pathname === '/national-teams') return 'National teams · FootyBrain';
  if (pathname === '/world-cup') return 'World Cup 2026 · FootyBrain';
  if (pathname === '/privacy') return 'Privacy · FootyBrain';
  if (pathname === '/onboarding') return 'How it works · FootyBrain';
  return 'FootyBrain';
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
    const canonical = ensureLink('canonical');
    canonical.setAttribute('href', buildCanonical(pathname));

    const robots = ensureMeta('robots');
    robots.setAttribute('content', isNoIndexPath(pathname) ? 'noindex,nofollow' : 'index,follow');

    document.title = titleForPath(pathname);
  }, [pathname]);

  return null;
}

