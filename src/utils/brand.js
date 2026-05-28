/** User-facing product name and default SEO copy. */
export const SITE_NAME = 'FootyCompass';

export const SITE_TAGLINE = 'Navigate the world of football.';

export const SITE_DESCRIPTION =
  'FootyCompass is a football discovery and learning platform. Explore players, clubs, leagues, national teams, and quizzes.';

export const SITE_DESCRIPTION_SHORT =
  'Explore players, clubs, leagues, national teams, and quizzes — a football discovery and learning platform.';

export const SITE_FOOTER_LINE = `${SITE_NAME} · ${SITE_TAGLINE}`;

export function pageTitle(suffix) {
  if (!suffix || suffix === SITE_NAME) return SITE_NAME;
  return `${suffix} · ${SITE_NAME}`;
}
