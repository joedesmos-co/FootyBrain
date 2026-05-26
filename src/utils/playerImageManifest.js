/**
 * Licensed player image manifest — single source for approved URLs and CDN hosts.
 * See PLAYER_IMAGE_SYSTEM_PLAN.md and PLAYER_IMAGE_POLICY.md.
 */

import manifest from '../data/playerImageManifest.json' with { type: 'json' };
import { isApprovedAssetUrl, isDisallowedImageUrl } from './playerImageUrlPolicy.js';

/** @typedef {'manifest' | 'playerField' | 'genericPlaceholder' | 'gradientInitials'} ImageDisplayTier */

const entriesByPlayerId = new Map(
  Object.entries(manifest.entries ?? {}).map(([id, entry]) => [id, normalizeManifestEntry(id, entry)]),
);

function normalizeManifestEntry(playerId, entry) {
  if (!entry || typeof entry !== 'object') return null;
  const source = entry.source === 'cdn' ? 'cdn' : 'local';
  const path = String(entry.path ?? entry.url ?? '').trim();
  if (!path) return null;

  return {
    playerId,
    source,
    path,
    width: entry.width ?? null,
    height: entry.height ?? null,
    alt: String(entry.alt ?? '').trim() || null,
    credit: String(entry.credit ?? '').trim() || null,
    license: String(entry.license ?? '').trim() || null,
    imageSource: String(entry.imageSource ?? entry.sourceLabel ?? 'FootyBrain image manifest').trim(),
    srcSet: String(entry.srcSet ?? '').trim() || null,
  };
}

export function getImageManifestMeta() {
  return {
    schemaVersion: manifest.schemaVersion,
    updatedAt: manifest.updatedAt,
    entryCount: entriesByPlayerId.size,
    approvedCdnHosts: manifest.approvedCdnHosts ?? [],
    placeholderHierarchy: manifest.placeholderHierarchy ?? [],
    genericPlaceholder: manifest.assets?.genericPlaceholder ?? null,
  };
}

function resolveManifestEntryUrl(entry) {
  if (!entry) return null;
  return isApprovedAssetUrl(entry.path) ? entry.path : null;
}

/**
 * @param {string} playerId
 */
export function getManifestImageForPlayer(playerId) {
  const entry = entriesByPlayerId.get(playerId);
  if (!entry) return null;
  const url = resolveManifestEntryUrl(entry);
  if (!url) return null;
  return {
    tier: 'manifest',
    url,
    alt: entry.alt,
    credit: entry.credit,
    license: entry.license,
    imageSource: entry.imageSource,
    srcSet: entry.srcSet,
    width: entry.width,
    height: entry.height,
  };
}

export function getGenericPlaceholderUrl() {
  const path = manifest.assets?.genericPlaceholder;
  return path && isApprovedAssetUrl(path) ? path : null;
}

/**
 * Resolve display source for a player row (manifest wins over inline fields).
 * @param {object | null | undefined} player
 */
export function resolvePlayerImageSource(player) {
  if (!player?.id) {
    return { tier: 'gradientInitials', url: null };
  }

  const fromManifest = getManifestImageForPlayer(player.id);
  if (fromManifest?.url) {
    return {
      tier: 'manifest',
      url: fromManifest.url,
      alt: fromManifest.alt ?? player.imageAlt,
      credit: fromManifest.credit ?? player.imageCredit,
      license: fromManifest.license ?? player.imageLicense,
      imageSource: fromManifest.imageSource ?? player.imageSource,
      srcSet: fromManifest.srcSet ?? player.imageSrcSet,
    };
  }

  const fieldUrl = String(player.imageUrl ?? '').trim();
  if (fieldUrl && !isDisallowedImageUrl(fieldUrl) && isApprovedAssetUrl(fieldUrl)) {
    return {
      tier: 'playerField',
      url: fieldUrl,
      alt: player.imageAlt,
      credit: player.imageCredit,
      license: player.imageLicense,
      imageSource: player.imageSource,
      srcSet: player.imageSrcSet,
    };
  }

  const generic = getGenericPlaceholderUrl();
  if (generic) {
    return {
      tier: 'genericPlaceholder',
      url: generic,
      alt: `${player.name ?? 'Player'} — placeholder silhouette`,
      credit: 'FootyBrain',
      license: 'FootyBrain asset',
      imageSource: 'FootyBrain placeholders',
    };
  }

  return { tier: 'gradientInitials', url: null };
}

/**
 * @param {object} player
 * @param {{ err?: Function, warn?: Function }} [hooks]
 */
export function validateManifestEntryForPlayer(player, hooks = {}) {
  const err = hooks.err ?? (() => {});
  const warn = hooks.warn ?? (() => {});
  const id = player?.id;
  if (!id) return;

  const entry = manifest.entries?.[id];
  if (!entry) return;

  const normalized = normalizeManifestEntry(id, entry);
  if (!normalized) {
    err(`Invalid manifest entry for ${id}`);
    return;
  }

  if (!resolveManifestEntryUrl(normalized)) {
    err(`Manifest path not approved for ${id}: ${entry.path ?? entry.url}`);
  }

  if (!normalized.credit || !normalized.license) {
    warn(`Manifest entry ${id} missing credit or license`);
  }
}
