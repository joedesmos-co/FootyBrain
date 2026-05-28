import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canonicalUrlForPath, pageTitle, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../utils/brand';
import { upsertJsonLdScript } from '../utils/jsonLd';
import { setSeoMeta } from '../utils/seoMeta';

const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og.svg`;

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
    pathname === '/saved' ||
    pathname === '/profile'
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
  if (pathname === '/about') return pageTitle('About');
  if (pathname === '/editorial') return pageTitle('Editorial policy');
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
    return 'Browse football players by club, league, and nationality. Open profiles, then quiz yourself to remember them.';
  if (pathname === '/teams')
    return 'Explore football clubs: squads, rivalries, legends, and quick links into quizzes and player profiles.';
  if (pathname === '/collections')
    return 'Curated football study lists and learning paths—open profiles, follow a route, then finish with a quiz.';
  if (pathname === '/learning-paths')
    return 'Guided football learning routes through collections, profiles, and quizzes. No accounts required.';
  if (pathname === '/national-teams')
    return 'Explore national teams and player pools. Open profiles by country, then try quizzes to lock in recognition.';
  if (pathname === '/world-cup')
    return 'World Cup 2026 hub: featured nations, player pools, study collections, and international quiz prep.';
  if (pathname === '/about')
    return 'About FootyCompass: a football discovery platform for learning players, clubs, and leagues with quizzes.';
  if (pathname === '/editorial')
    return 'Editorial policy & data sources for FootyCompass: snapshot data, original quiz hints, and corrections process.';
  if (pathname === '/privacy')
    return 'Privacy Policy for FootyCompass: local storage, cookies, analytics, and Google AdSense advertising.';
  if (pathname === '/onboarding')
    return 'How FootyCompass works: explore players and clubs, compare sides, and test yourself with quizzes.';
  if (pathname === '/compare')
    return 'Compare football players side-by-side. Use clues, roles, and profiles to settle debates fast.';
  if (pathname === '/compare-clubs')
    return 'Compare football clubs: rivals, culture, squad context, and key players—then explore profiles.';
  if (pathname === '/saved') return 'Your saved players and clubs—stored locally in your browser.';
  if (pathname === '/profile')
    return 'Your local progress and quiz stats—stored on this device only.';
  if (pathname === '/daily')
    return 'Daily football challenge: a quick quiz session designed for streaks and repeat play.';
  if (pathname === '/quiz')
    return 'Football quizzes by league, club, nation, and themed pools (wonderkids, legends, rivalries). Set difficulty and build streaks on FootyCompass.';
  if (pathname === '/club-quiz')
    return 'Club football quizzes: stadiums, leagues, rivalries, history, kits, and legends — multiple choice or hardcore typing, with streaks and XP.';
  if (pathname === '/hubs/quizzes/clubs')
    return 'Index of club knowledge quizzes — stadium, league, rivalry, country, history, trophies, and kit formats.';
  if (pathname.startsWith('/hubs/quizzes/clubs/'))
    return 'Club football quiz landing page — format guide, pool size, and play link on FootyCompass.';
  if (pathname.startsWith('/hubs/quizzes/theme/'))
    return 'Themed football player quiz — curated quiz-ready pool with hints, difficulty tiers, and links to player profiles.';
  if (pathname === '/hubs/quizzes/themes')
    return 'Index of themed football quizzes: wonderkids, legends, World Cup squads, league pools, and rivalry quizzes.';
  if (pathname.startsWith('/league/'))
    return 'League guide with clubs, key players, and quiz links. Explore squads and learn the league faster.';
  if (pathname.startsWith('/team/'))
    return 'Club guide with squad context, rivals, legends, and quiz links. Open player profiles and learn the team.';
  if (pathname.startsWith('/player/'))
    return 'Football player profile with club, league, and national-team context—plus quick links to related players.';
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

    upsertJsonLdScript('jsonld-website', websiteJsonLd());
    if (!isBreadcrumbPath(pathname)) upsertJsonLdScript('jsonld-breadcrumb', null);
    if (!pathname.startsWith('/player/')) upsertJsonLdScript('jsonld-person', null);
    if (!pathname.startsWith('/team/')) upsertJsonLdScript('jsonld-sportsteam', null);
    if (!pathname.startsWith('/hubs')) upsertJsonLdScript('jsonld-landing', null);
  }, [pathname]);

  return null;
}
