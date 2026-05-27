import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { upsertJsonLdScript } from '../utils/jsonLd';
import { setSeoMeta } from '../utils/seoMeta';

const SITE_NAME = 'FootyBrain';
const SITE_DESCRIPTION =
  'FootyBrain helps you learn football players, clubs, leagues, history, and national teams through interactive quizzes and profiles.';

function buildCanonical(pathname) {
  const origin = window.location.origin;
  return `${origin}${pathname}`;
}

function isBreadcrumbPath(pathname) {
  return (
    pathname.startsWith('/league/') ||
    pathname.startsWith('/team/') ||
    pathname.startsWith('/player/')
  );
}

function websiteJsonLd(origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: origin,
    description: SITE_DESCRIPTION,
  };
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
  if (pathname === '/privacy') return 'Privacy Policy · FootyBrain';
  if (pathname === '/onboarding') return 'How it works · FootyBrain';
  if (pathname === '/compare') return 'Compare players · FootyBrain';
  if (pathname === '/compare-clubs') return 'Compare clubs · FootyBrain';
  if (pathname === '/saved') return 'Saved · FootyBrain';
  if (pathname === '/profile') return 'Progress · FootyBrain';
  if (pathname === '/daily') return 'Daily challenge · FootyBrain';
  if (pathname === '/quiz') return 'Quiz · FootyBrain';
  if (pathname.startsWith('/collections/')) return 'Collection · FootyBrain';
  if (pathname.startsWith('/learning-paths/')) return 'Learning path · FootyBrain';
  if (pathname.startsWith('/national-team/')) return 'National team · FootyBrain';
  if (pathname.startsWith('/league/')) return 'League · FootyBrain';
  if (pathname.startsWith('/team/')) return 'Club · FootyBrain';
  if (pathname.startsWith('/player/')) return 'Player · FootyBrain';
  return SITE_NAME;
}

function descriptionForPath(pathname) {
  if (pathname === '/') return SITE_DESCRIPTION;
  if (pathname === '/browse')
    return 'Search and filter the FootyBrain player database by league, club, nationality, position, and quiz readiness.';
  if (pathname === '/teams')
    return 'Explore club learning pages with squad breakdowns, rivals, legends, and team quizzes when available.';
  if (pathname === '/collections')
    return 'Curated study lists and learning paths to help you recognize players, clubs, and national teams faster.';
  if (pathname === '/learning-paths')
    return 'Step-by-step learning flows through collections, profiles, and quizzes—no accounts required.';
  if (pathname === '/national-teams')
    return 'Browse men’s national-team pages with linked player pools and quiz readiness indicators.';
  if (pathname === '/world-cup')
    return 'World Cup 2026 prep hub with featured nations, groups, learning collections, and international quizzes.';
  if (pathname === '/privacy')
    return 'How FootyBrain handles data, cookies, analytics, and future advertising (AdSense) readiness.';
  if (pathname === '/onboarding')
    return 'How FootyBrain works: browse, learn, compare, and quiz yourself on football players and clubs.';
  if (pathname === '/compare') return 'Compare players side-by-side: roles, clues, and key profile details.';
  if (pathname === '/compare-clubs') return 'Compare clubs: culture, rivals, legends, and squad context.';
  if (pathname === '/saved') return 'Your saved players and clubs—stored locally in your browser.';
  if (pathname === '/profile')
    return 'Your local progress and learning stats—stored on this device only.';
  if (pathname === '/daily') return 'Daily football learning challenge—short sessions, saved locally.';
  if (pathname === '/quiz') return 'Football quizzes across leagues, clubs, and national teams.';
  if (pathname.startsWith('/league/'))
    return 'League profile with featured clubs, key players, rivalry notes, and league quiz options.';
  if (pathname.startsWith('/team/'))
    return 'Club profile with squad learning, rivalries, legends, fan context, and team quiz options.';
  if (pathname.startsWith('/player/'))
    return 'Player profile with club, league, national-team context, and quiz eligibility.';
  if (pathname.startsWith('/national-team/'))
    return 'National-team pool page with linked players and quiz readiness, separate from official World Cup rosters.';
  if (pathname.startsWith('/collections/'))
    return 'Collection detail page with a curated checklist of profiles and an optional linked quiz.';
  if (pathname.startsWith('/learning-paths/'))
    return 'Learning path detail page: an ordered route through collections, profiles, and a quiz.';
  return SITE_DESCRIPTION;
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
    const origin = window.location.origin;
    const canonicalUrl = buildCanonical(pathname);
    const title = titleForPath(pathname);
    const indexable = !isNoIndexPath(pathname);
    const description = descriptionForPath(pathname);

    setSeoMeta({
      title,
      description,
      canonicalUrl,
      robots: indexable ? 'index,follow' : 'noindex,nofollow',
      og: {
        site_name: SITE_NAME,
        type: 'website',
        title,
        description,
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    });

    // JSON-LD
    upsertJsonLdScript('jsonld-website', websiteJsonLd(origin));
    if (!isBreadcrumbPath(pathname)) upsertJsonLdScript('jsonld-breadcrumb', null);
    if (!pathname.startsWith('/player/')) upsertJsonLdScript('jsonld-person', null);
    if (!pathname.startsWith('/team/')) upsertJsonLdScript('jsonld-sportsteam', null);
  }, [pathname]);

  return null;
}

