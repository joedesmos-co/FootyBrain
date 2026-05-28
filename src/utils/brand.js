/** User-facing product name and default SEO copy. */
export const SITE_NAME = 'FootyCompass';

/**
 * Canonical public host for SEO.
 *
 * Keep this as the marketing domain (not a deploy preview host).
 */
export const SITE_URL = 'https://footycompass.com';

export const SITE_TAGLINE = 'Navigate the world of football.';

export const SITE_DESCRIPTION =
  'FootyCompass is a football discovery and learning platform. Explore players, clubs, leagues, national teams, and quizzes.';

export const SITE_DESCRIPTION_SHORT =
  'Explore players, clubs, leagues, national teams, and quizzes — a football discovery and learning platform.';

export const SITE_FOOTER_LINE = `${SITE_NAME} · ${SITE_TAGLINE}`;

export function canonicalUrlForPath(pathname) {
  const base = String(SITE_URL).replace(/\/+$/, '');
  const path = String(pathname || '/');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function pageTitle(suffix) {
  if (!suffix || suffix === SITE_NAME) return SITE_NAME;
  return `${suffix} · ${SITE_NAME}`;
}
