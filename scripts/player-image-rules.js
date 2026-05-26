/**
 * Shared player image field rules for validators and build scripts.
 * URL policy lives in src/utils/playerImageUrlPolicy.js (single source).
 * See PLAYER_IMAGE_POLICY.md and PLAYER_IMAGE_SYSTEM_PLAN.md.
 */

import {
  isApprovedAssetUrl,
  isApprovedImageUrl,
  isDisallowedImageUrl,
} from '../src/utils/playerImageUrlPolicy.js';

export { isDisallowedImageUrl, isApprovedImageUrl, isApprovedAssetUrl };

export const APPROVED_IMAGE_FIELDS = [
  'imageUrl',
  'imageAlt',
  'imageCredit',
  'imageSource',
  'imageLicense',
  'imageSrcSet',
];

/** TM / scraper keys — never import into app data */
export const FORBIDDEN_IMAGE_KEYS = new Set([
  'image_url',
  'photo_url',
  'headshot',
  'headshot_url',
  'player_photo',
]);

export function nullImageFields() {
  return {
    imageUrl: null,
    imageAlt: null,
    imageCredit: null,
    imageSource: null,
    imageLicense: null,
    imageSrcSet: null,
  };
}

/**
 * Collect forbidden image-related keys on a player/overlay object.
 * @param {object} obj
 * @param {string} [prefix]
 */
export function collectForbiddenImageKeys(obj, prefix = '') {
  const hits = [];
  if (!obj || typeof obj !== 'object') return hits;
  for (const [key, val] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (FORBIDDEN_IMAGE_KEYS.has(key)) hits.push(full);
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      hits.push(...collectForbiddenImageKeys(val, full));
    }
  }
  return hits;
}

/**
 * @param {object} player
 * @param {{ err?: (msg: string) => void, warn?: (msg: string) => void, id?: string }} hooks
 */
export function validatePlayerImageFields(player, hooks = {}) {
  const err = hooks.err ?? (() => {});
  const warn = hooks.warn ?? (() => {});
  const id = hooks.id ?? player?.id ?? '(unknown)';

  for (const key of collectForbiddenImageKeys(player)) {
    err(`Forbidden image field "${key}" on ${id}`);
  }

  const url = player?.imageUrl;
  if (url != null && url !== '') {
    if (isDisallowedImageUrl(url)) {
      err(`Disallowed imageUrl on ${id} (blocked source pattern)`);
    } else if (!isApprovedAssetUrl(url)) {
      err(
        `imageUrl on ${id} must be /images/* or HTTPS on an approved CDN host (see PLAYER_IMAGE_SYSTEM_PLAN.md)`,
      );
    }
    const credit = String(player.imageCredit ?? '').trim();
    const license = String(player.imageLicense ?? '').trim();
    if (!credit || !license) {
      warn(`imageUrl set on ${id} but imageCredit and/or imageLicense is missing`);
    }
  }

  if (player?.imageSrcSet != null && player.imageSrcSet !== '') {
    const parts = String(player.imageSrcSet)
      .split(',')
      .map((p) => p.trim().split(/\s+/)[0])
      .filter(Boolean);
    for (const partUrl of parts) {
      if (!isApprovedAssetUrl(partUrl)) {
        err(`imageSrcSet on ${id} contains non-approved URL: ${partUrl}`);
      }
    }
  }

  for (const field of APPROVED_IMAGE_FIELDS) {
    if (field in player && player[field] !== null && typeof player[field] !== 'string') {
      err(`${field} on ${id} must be a string or null`);
    }
  }
}
