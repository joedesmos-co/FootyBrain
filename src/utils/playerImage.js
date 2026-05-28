/**
 * Runtime helpers for licensed player photos. See PLAYER_IMAGE_POLICY.md.
 */

import { resolvePlayerImageSource } from './playerImageManifest.js';
import { isApprovedAssetUrl, isDisallowedImageUrl } from './playerImageUrlPolicy.js';

/** Layout hints for <img> and the `sizes` attribute (no network cost). */
export const PLAYER_VISUAL_DIMENSIONS = {
  thumb: { width: 52, height: 64, sizes: '52px' },
  card: { width: 320, height: 200, sizes: '(min-width: 720px) 285px, 90vw' },
  profile: { width: 192, height: 240, sizes: '192px' },
};

export { isDisallowedImageUrl, isApprovedAssetUrl } from './playerImageUrlPolicy.js';
export {
  getImageManifestMeta,
  getManifestImageForPlayer,
  resolvePlayerImageSource,
} from './playerImageManifest.js';

/**
 * Licensed app-hosted or approved-CDN asset URL (players, crests, league marks).
 * @param {string | null | undefined} url
 */
export function resolveLicensedAssetUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || isDisallowedImageUrl(trimmed)) return null;
  if (!isApprovedAssetUrl(trimmed)) return null;
  return trimmed;
}

/** Resolved photo URL after manifest + policy (null → placeholder tier). */
export function resolvePlayerImageUrl(player) {
  return resolvePlayerImageSource(player).url;
}

/** Optional responsive srcset from manifest or player data. */
export function resolvePlayerImageSrcSet(player) {
  const source = resolvePlayerImageSource(player);
  const raw = source.srcSet ?? player?.imageSrcSet;
  if (!raw || typeof raw !== 'string') return undefined;

  const entries = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const safe = entries.filter((entry) => {
    const urlPart = entry.split(/\s+/)[0]?.trim();
    return urlPart && isApprovedAssetUrl(urlPart);
  });

  return safe.length > 0 ? safe.join(', ') : undefined;
}

/**
 * Props for a licensed player <img> (null when no loadable URL).
 * @param {{ size?: 'thumb' | 'card' | 'profile', priority?: boolean }} options
 */
export function getPlayerImageAttributes(player, options = {}) {
  const source = resolvePlayerImageSource(player);
  const src = source.url;
  if (!src) return null;

  const size = options.size ?? 'card';
  const priority = Boolean(options.priority);
  const dim = PLAYER_VISUAL_DIMENSIONS[size] ?? PLAYER_VISUAL_DIMENSIONS.card;
  const srcSet = resolvePlayerImageSrcSet(player);

  return {
    src,
    alt: getPlayerImageAlt(player, source),
    width: dim.width,
    height: dim.height,
    sizes: dim.sizes,
    ...(srcSet ? { srcSet } : {}),
    loading: priority ? 'eager' : 'lazy',
    ...(priority ? { fetchPriority: 'high' } : {}),
    decoding: 'async',
  };
}

export function getPlayerImageAlt(player, source = null) {
  const resolved = source ?? resolvePlayerImageSource(player);
  const custom = String(resolved.alt ?? player?.imageAlt ?? '').trim();
  if (custom) return custom;
  const name = player?.name ?? 'Player';
  const position = player?.position ? `, ${player.position}` : '';
  return `${name}${position} — FootyCompass player photo`;
}

export function hasImageAttribution(player, source = null) {
  const resolved = source ?? resolvePlayerImageSource(player);
  return Boolean(
    String(resolved.credit ?? player?.imageCredit ?? '').trim() &&
      String(resolved.license ?? player?.imageLicense ?? '').trim(),
  );
}

const warnedMissingAttribution = new Set();

/** Dev-only: warn once per player id when a photo URL lacks credit/license. */
export function warnMissingImageAttribution(player) {
  if (!import.meta.env.DEV) return;
  const source = resolvePlayerImageSource(player);
  if (!source.url || hasImageAttribution(player, source)) return;
  const key = player?.id ?? source.url;
  if (warnedMissingAttribution.has(key)) return;
  warnedMissingAttribution.add(key);
  console.warn(
    `[FootyCompass] Player "${player?.name ?? key}" (${source.tier}) has image without imageCredit/imageLicense. See PLAYER_IMAGE_POLICY.md.`,
  );
}
