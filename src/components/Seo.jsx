import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canonicalUrlForPath, pageTitle, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../utils/brand';
import { upsertJsonLdScript } from '../utils/jsonLd';
import { setSeoMeta } from '../utils/seoMeta';

function buildCanonical(pathname) {
  return canonicalUrlForPath(pathname);
}

function isBreadcrumbPath(pathname) {
  return (
    pathname.startsWith('/league/') ||
    pathname.startsWith('/team/') ||
    pathname.startsWith('/player/')
  );
}

function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
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
  if (pathname === '/browse') return pageTitle('Browse players');
  if (pathname === '/teams') return pageTitle('Clubs');
  if (pathname === '/collections') return pageTitle('Collections & paths');
  if (pathname === '/learning-paths') return pageTitle('Learning paths');
  if (pathname === '/national-teams') return pageTitle('National teams');
  if (pathname === '/world-cup') return pageTitle('World Cup 2026');
  if (pathname === '/privacy') return pageTitle('Privacy Policy');
  if (pathname === '/onboarding') return pageTitle('How it works');
  if (pathname === '/compare') return pageTitle('Compare players');
  if (pathname === '/compare-clubs') return pageTitle('Compare clubs');
  if (pathname === '/saved') return pageTitle('Saved');
  if (pathname === '/profile') return pageTitle('Progress');
  if (pathname === '/daily') return pageTitle('Daily challenge');
  if (pathname === '/quiz') return pageTitle('Quiz');
  if (pathname.startsWith('/collections/')) return pageTitle('Collection');
  if (pathname.startsWith('/learning-paths/')) return pageTitle('Learning path');
  if (pathname.startsWith('/national-team/')) return pageTitle('National team');
  if (pathname.startsWith('/league/')) return pageTitle('League');
  if (pathname.startsWith('/team/')) return pageTitle('Club');
  if (pathname.startsWith('/player/')) return pageTitle('Player');
  return SITE_NAME;
}

function descriptionForPath(pathname) {
  if (pathname === '/') return SITE_DESCRIPTION;
  if (pathname === '/browse')
    return 'Search and explore players across leagues, clubs, and nationalities on FootyCompass.';
  if (pathname === '/teams')
    return 'Explore club profiles with squads, rivals, legends, and quizzes when available.';
  if (pathname === '/collections')
    return 'Curated study lists and learning paths to explore players, clubs, and national teams.';
  if (pathname === '/learning-paths')
    return 'Guided routes through collections, profiles, and quizzes—no accounts required.';
  if (pathname === '/national-teams')
    return 'Browse men’s national-team pages with linked player pools and quiz readiness indicators.';
  if (pathname === '/world-cup')
    return 'World Cup 2026 hub with featured nations, groups, collections, and international quizzes.';
  if (pathname === '/privacy')
    return 'Privacy Policy for FootyCompass: local storage, cookies, analytics, and Google AdSense advertising.';
  if (pathname === '/onboarding')
    return 'How FootyCompass works: explore players and clubs, compare sides, and test yourself with quizzes.';
  if (pathname === '/compare') return 'Compare players side-by-side: roles, clues, and key profile details.';
  if (pathname === '/compare-clubs') return 'Compare clubs: culture, rivals, legends, and squad context.';
  if (pathname === '/saved') return 'Your saved players and clubs—stored locally in your browser.';
  if (pathname === '/profile')
    return 'Your local progress and quiz stats—stored on this device only.';
  if (pathname === '/daily') return 'Daily football challenge—short sessions, saved locally.';
  if (pathname === '/quiz') return 'Football quizzes across leagues, clubs, and national teams.';
  if (pathname.startsWith('/league/'))
    return 'League profile with featured clubs, key players, rivalry notes, and league quiz options.';
  if (pathname.startsWith('/team/'))
    return 'Club profile with squad context, rivalries, legends, fan culture, and team quiz options.';
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

    upsertJsonLdScript('jsonld-website', websiteJsonLd());
    if (!isBreadcrumbPath(pathname)) upsertJsonLdScript('jsonld-breadcrumb', null);
    if (!pathname.startsWith('/player/')) upsertJsonLdScript('jsonld-person', null);
    if (!pathname.startsWith('/team/')) upsertJsonLdScript('jsonld-sportsteam', null);
  }, [pathname]);

  return null;
}
