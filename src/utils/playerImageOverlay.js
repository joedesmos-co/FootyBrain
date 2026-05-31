/**
 * Editorial player image overlays — gradual licensed URL rollout.
 * Runtime imports only approved entries (non-empty URLs). See PLAYER_IMAGE_POLICY.md
 */

import approved from '../data/playerImageApproved.json' with { type: 'json' };
import meta from '../data/playerImageOverlays.meta.json' with { type: 'json' };
import { isOverlayImageBlocked } from './playerImageQualityGate.js';
import { isApprovedAssetUrl, isDisallowedImageUrl } from './playerImageUrlPolicy.js';

const entriesByPlayerId = new Map(
  Object.entries(approved.entries ?? {}).map(([id, entry]) => [id, normalizeOverlayEntry(id, entry)]),
);

function normalizeOverlayEntry(playerId, entry) {
  if (!entry || typeof entry !== 'object') return null;

  const imageUrl = String(entry.imageUrl ?? entry.path ?? '').trim() || null;
  const imageSourceUrl = String(entry.imageSourceUrl ?? entry.sourceUrl ?? '').trim() || null;

  return {
    playerId,
    imageUrl,
    imageAlt: String(entry.imageAlt ?? entry.alt ?? '').trim() || null,
    imageCredit: String(entry.imageCredit ?? entry.credit ?? '').trim() || null,
    imageLicense: String(entry.imageLicense ?? entry.license ?? '').trim() || null,
    imageSource: String(entry.imageSource ?? '').trim() || null,
    imageSourceUrl: imageSourceUrl && !isDisallowedImageUrl(imageSourceUrl) ? imageSourceUrl : null,
    imageSrcSet: String(entry.imageSrcSet ?? entry.srcSet ?? '').trim() || null,
    imageAttributionRequired: entry.imageAttributionRequired === true,
    status: String(entry.status ?? 'approved').trim(),
    commonsFile: String(entry.commonsFile ?? '').trim() || null,
    qualityScore: entry.qualityScore ?? null,
    qualityGrade: entry.qualityGrade ?? null,
  };
}

export function getPlayerImageOverlayMeta() {
  return {
    schemaVersion: meta.schemaVersion,
    updatedAt: meta.updatedAt,
    entryCount: entriesByPlayerId.size,
    priorityPlayerIds: meta.priorityPlayerIds ?? [],
  };
}

export function getOverlayImageForPlayer(playerId) {
  const entry = entriesByPlayerId.get(playerId);
  if (!entry?.imageUrl) return null;
  if (isOverlayImageBlocked(playerId, entry)) return null;
  if (isDisallowedImageUrl(entry.imageUrl) || !isApprovedAssetUrl(entry.imageUrl)) return null;

  return {
    tier: 'overlay',
    url: entry.imageUrl,
    alt: entry.imageAlt,
    credit: entry.imageCredit,
    license: entry.imageLicense,
    imageSource: entry.imageSource,
    imageSourceUrl: entry.imageSourceUrl,
    imageAttributionRequired: entry.imageAttributionRequired,
    srcSet: entry.imageSrcSet,
    status: entry.status,
  };
}

/**
 * @param {object | null | undefined} player
 * @param {{ err?: Function, warn?: Function }} [hooks]
 */
export function validateOverlayEntryForPlayer(player, hooks = {}) {
  const err = hooks.err ?? (() => {});
  const warn = hooks.warn ?? (() => {});
  const id = player?.id;
  if (!id) return;

  const raw = approved.entries?.[id];
  if (!raw) return;

  const normalized = normalizeOverlayEntry(id, raw);
  if (!normalized) {
    err(`Invalid overlay entry for ${id}`);
    return;
  }

  if (normalized.imageUrl) {
    if (!isApprovedAssetUrl(normalized.imageUrl)) {
      err(`Overlay imageUrl not approved for ${id}: ${normalized.imageUrl}`);
    }
    if (!normalized.imageCredit || !normalized.imageLicense) {
      warn(`Overlay entry ${id} has imageUrl but missing imageCredit or imageLicense`);
    }
  }
}
