import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canonicalUrlForPath, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../utils/brand';
import { upsertJsonLdScript } from '../utils/jsonLd';
import { applyPageSeo, clearPageSeoExtras, getStaticRouteSeo } from '../utils/seoCtr';

function isBreadcrumbPath(pathname) {
  return (
    pathname.startsWith('/league/') ||
    pathname.startsWith('/team/') ||
    pathname.startsWith('/player/') ||
    pathname.startsWith('/national-team/')
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
    pathname === '/profile' ||
    pathname === '/compare-clubs'
  );
}

/**
 * Baseline SPA SEO per route; entity pages upgrade title/description after load.
 */
export default function Seo() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const canonicalUrl = canonicalUrlForPath(pathname);
    const indexable = !isNoIndexPath(pathname);
    const staticSeo = getStaticRouteSeo(pathname);

    applyPageSeo({
      title: staticSeo.title,
      description: staticSeo.description,
      canonicalUrl,
      robots: indexable ? 'index,follow' : 'noindex,nofollow',
      faqs: staticSeo.faqs,
    });

    upsertJsonLdScript('jsonld-website', websiteJsonLd());

    if (!isBreadcrumbPath(pathname)) {
      upsertJsonLdScript('jsonld-breadcrumb', null);
    }
    if (!pathname.startsWith('/player/')) upsertJsonLdScript('jsonld-person', null);
    if (!pathname.startsWith('/team/') && !pathname.startsWith('/national-team/')) {
      upsertJsonLdScript('jsonld-sportsteam', null);
    }
    if (!pathname.startsWith('/league/')) upsertJsonLdScript('jsonld-sportsleague', null);
    if (!pathname.startsWith('/hubs')) upsertJsonLdScript('jsonld-landing', null);

    return () => {
      if (!isBreadcrumbPath(pathname)) clearPageSeoExtras();
    };
  }, [pathname]);

  return null;
}
