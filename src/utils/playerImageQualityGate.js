/**
 * Runtime gate — prefer placeholder over denylisted or sub-threshold overlay photos.
 * No network calls; reads approved overlay metadata only.
 */

import qualityConfig from '../data/playerImageQuality.json' with { type: 'json' };

const denyFiles = new Set(
  (qualityConfig.denyCommonsFiles ?? []).map((file) => String(file).trim().toLowerCase()),
);

const minApprovalScore = qualityConfig.minApprovalScore ?? 62;

export function isDeniedCommonsFile(commonsFile) {
  const file = String(commonsFile ?? '').trim().toLowerCase();
  if (!file) return false;
  return denyFiles.has(file);
}

export function isDeniedPlayerId(playerId) {
  return Boolean(qualityConfig.denyPlayerIds?.[playerId]);
}

/** @param {string} playerId @param {object | null | undefined} entry */
export function isOverlayImageBlocked(playerId, entry) {
  if (!entry?.imageUrl) return true;
  if (isDeniedPlayerId(playerId)) return true;
  if (isDeniedCommonsFile(entry.commonsFile)) return true;
  if (entry.qualityScore != null && entry.qualityScore < minApprovalScore) return true;
  if (entry.qualityGrade === 'reject' || entry.qualityGrade === 'poor') return true;
  return false;
}
