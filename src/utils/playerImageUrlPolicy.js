/**
 * URL policy for player/crest images (app + validators via scripts re-export).
 * See PLAYER_IMAGE_POLICY.md and PLAYER_IMAGE_SYSTEM_PLAN.md.
 */

import manifest from '../data/playerImageManifest.json' with { type: 'json' };

const DISALLOWED_URL_SUBSTRINGS = [
  'transfermarkt',
  'fotmob',
  'googleusercontent',
  'gstatic.com',
  'gettyimages',
  'alamy',
  'shutterstock',
  'dreamstime',
  'istockphoto',
];

export function isDisallowedImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return DISALLOWED_URL_SUBSTRINGS.some((token) => lower.includes(token));
}

export function getApprovedCdnHosts() {
  return manifest.approvedCdnHosts ?? [];
}

export function isApprovedCdnHost(hostname) {
  const host = String(hostname ?? '').toLowerCase();
  if (!host) return false;
  return getApprovedCdnHosts().some((allowed) => {
    const pattern = String(allowed).toLowerCase();
    return host === pattern || host.endsWith(`.${pattern}`);
  });
}

export function isApprovedLocalImagePath(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('/images/') && !trimmed.includes('..');
}

/**
 * Production-safe URL: local /images/* or HTTPS on approved CDN hosts only.
 * @param {string | null | undefined} url
 */
export function isApprovedAssetUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || isDisallowedImageUrl(trimmed)) return false;

  if (isApprovedLocalImagePath(trimmed)) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && isApprovedCdnHost(parsed.hostname);
  } catch {
    return false;
  }
}

/** @deprecated alias — validators use this name */
export function isApprovedImageUrl(url) {
  return isApprovedAssetUrl(url);
}
