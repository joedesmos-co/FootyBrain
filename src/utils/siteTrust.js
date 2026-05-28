/**
 * Site-wide trust, contact, and E-E-A-T copy constants (single source of truth).
 */

import { DATASET_META } from '../data/datasetMeta.js';
import { SITE_NAME, SITE_URL } from './brand.js';

export const SITE_CONTACT_EMAIL = 'joedesmos.co@gmail.com';

export const SITE_OPERATOR_LABEL = 'FootyCompass (independent publisher)';

export const SITE_PUBLISHER_DESCRIPTION =
  'An independent football learning and discovery website — not affiliated with FIFA, leagues, or clubs.';

export const TRUST_PAGE_LAST_REVIEWED = DATASET_META.dataAsOf;

export const TRUST_NAV_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Editorial & data', to: '/editorial' },
  { label: 'Privacy', to: '/privacy' },
];

export function mailtoContact(subject = 'FootyCompass feedback') {
  const encoded = encodeURIComponent(subject);
  return `mailto:${SITE_CONTACT_EMAIL}?subject=${encoded}`;
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    email: SITE_CONTACT_EMAIL,
    description: SITE_PUBLISHER_DESCRIPTION,
  };
}

export function buildWebSitePublisherJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}
