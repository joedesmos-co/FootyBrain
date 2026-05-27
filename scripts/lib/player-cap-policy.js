/**
 * Player hard-cap policy for merge / app-ready preview.
 *
 * Normal builds: fail with a clear report when over playersHardMax (no silent browse trim).
 * Emergency: set ALLOW_EMERGENCY_TRIM=1 to run legacy priority trim (draft/required preserved).
 */

import { EXPANSION_LIMITS } from '../phase1-curation.js';
import { trimCuratedTmToCap, trimGeneratedBaseToCap } from './expansion-player-cap.js';

export function allowEmergencyTrim() {
  return process.env.ALLOW_EMERGENCY_TRIM === '1';
}

export function getPlayerHardCap() {
  return EXPANSION_LIMITS.playersHardMax ?? EXPANSION_LIMITS.playersMax;
}

function capExceededMessage({ label, actual, limit, overBy, hint }) {
  return [
    `Player hard cap exceeded during ${label}.`,
    `  Count: ${actual} (limit ${limit}, over by ${overBy})`,
    `  Hard max (playersHardMax): ${getPlayerHardCap()}`,
    hint,
  ].join('\n');
}

/**
 * @returns {{ curatedTm: object[], trimmedBrowse: number }}
 */
export function applyCuratedTmCap(curatedTm, { maxSquadRows, requiredSourceIds, label }) {
  if (curatedTm.length <= maxSquadRows) {
    return { curatedTm, trimmedBrowse: 0 };
  }

  const overBy = curatedTm.length - maxSquadRows;
  if (!allowEmergencyTrim()) {
    console.error(
      capExceededMessage({
        label,
        actual: curatedTm.length,
        limit: maxSquadRows,
        overBy,
        hint:
          '  Normal merge does not trim browse-only players. Raise playersHardMax in scripts/phase1-curation.js, or re-run with ALLOW_EMERGENCY_TRIM=1 for emergency trim only.',
      }),
    );
    process.exit(1);
  }

  const result = trimCuratedTmToCap(curatedTm, { maxSquadRows, requiredSourceIds });
  console.warn(
    `Emergency trim (${label}): ${result.trimmedBrowse} browse-only TM row(s) (hard cap ${getPlayerHardCap()}, required imports preserved).`,
  );
  return result;
}

/**
 * @returns Return type of trimGeneratedBaseToCap
 */
export function applyGeneratedBaseCap(generatedBase, maxGenerated, label) {
  if (generatedBase.length <= maxGenerated) {
    return trimGeneratedBaseToCap(generatedBase, maxGenerated);
  }

  const overBy = generatedBase.length - maxGenerated;
  if (!allowEmergencyTrim()) {
    console.error(
      capExceededMessage({
        label,
        actual: generatedBase.length,
        limit: maxGenerated,
        overBy,
        hint:
          '  Normal merge does not trim browse-only players. Raise playersHardMax in scripts/phase1-curation.js, or re-run with ALLOW_EMERGENCY_TRIM=1 for emergency trim only.',
      }),
    );
    process.exit(1);
  }

  const result = trimGeneratedBaseToCap(generatedBase, maxGenerated);
  if (result.trimmedBrowse > 0) {
    console.warn(
      `Emergency trim (${label}): ${result.trimmedBrowse} browse-only generated player(s) (hard cap ${getPlayerHardCap()}, editorial/quiz rows preserved).`,
    );
  }
  return result;
}
