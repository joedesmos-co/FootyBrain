/**
 * Controlled expansion player cap — priority trim shared by app-ready preview and sample merge.
 *
 * Order preserved when trimming:
 * 1. Manual MVP players (handled outside this module)
 * 2. Draft-overlay / generated-editorial-approved rows
 * 3. Browse-only generated squad rows
 */

import fs from 'fs';

export function loadGeneratedDraftSourceIds(
  draftPath,
  { approvedOnly = true } = {},
) {
  if (!fs.existsSync(draftPath)) return new Set();
  const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
  const ids = new Set();
  for (const row of draft.players ?? []) {
    if (!row.sourceId) continue;
    if (approvedOnly && row.reviewStatus !== 'approved') continue;
    ids.add(String(row.sourceId));
  }
  return ids;
}

/**
 * Optional "required imports" list: force specific TM sourceIds into the dataset
 * without marking them quiz-ready / editorial-approved.
 *
 * File shape:
 *   { "sourceIds": ["123", "456"] }
 */
export function loadRequiredImportSourceIds(requiredImportsPath) {
  if (!fs.existsSync(requiredImportsPath)) return new Set();
  const raw = JSON.parse(fs.readFileSync(requiredImportsPath, 'utf8'));
  const ids = new Set();
  for (const value of raw.sourceIds ?? []) {
    if (value == null) continue;
    const key = String(value).trim();
    if (!key) continue;
    ids.add(key);
  }
  return ids;
}

/**
 * Re-insert TM preview rows required by the generated draft overlay when curation excluded them.
 */
export function injectRequiredTmPlayers(
  curatedTm,
  { requiredSourceIds, tmBySourceId, reservedSourceIds },
) {
  const curatedSourceIds = new Set(curatedTm.map((p) => String(p.sourceId)));
  const out = [...curatedTm];
  for (const sourceId of requiredSourceIds) {
    const key = String(sourceId);
    if (curatedSourceIds.has(key)) continue;
    if (reservedSourceIds.has(key)) continue;
    const tm = tmBySourceId.get(key);
    if (!tm) continue;
    out.unshift(tm);
    curatedSourceIds.add(key);
  }
  return out;
}

/**
 * Trim curated TM rows: keep all draft-required sourceIds, then fill remaining slots with browse rows.
 */
export function trimCuratedTmToCap(curatedTm, { maxSquadRows, requiredSourceIds }) {
  if (curatedTm.length <= maxSquadRows) {
    return { curatedTm, trimmedBrowse: 0 };
  }
  const required = [];
  const rest = [];
  for (const row of curatedTm) {
    if (requiredSourceIds.has(String(row.sourceId))) required.push(row);
    else rest.push(row);
  }
  const slotsForBrowse = Math.max(0, maxSquadRows - required.length);
  const trimmedBrowse = rest.length - slotsForBrowse;
  return {
    curatedTm: [...required, ...rest.slice(0, slotsForBrowse)],
    trimmedBrowse: Math.max(0, trimmedBrowse),
  };
}

function isPriorityGeneratedPlayer(player) {
  return (
    player.dataStatus === 'generated-editorial-approved' ||
    player.quizEligible === true
  );
}

/**
 * Trim merged generated base players: never drop editorial-approved / quiz-eligible before browse rows.
 */
export function trimGeneratedBaseToCap(generatedBase, maxGenerated) {
  if (generatedBase.length <= maxGenerated) {
    return {
      players: generatedBase,
      priorityCount: generatedBase.filter(isPriorityGeneratedPlayer).length,
      browseCount: generatedBase.filter((p) => !isPriorityGeneratedPlayer(p)).length,
      trimmedBrowse: 0,
    };
  }

  const priority = [];
  const browse = [];
  for (const player of generatedBase) {
    if (isPriorityGeneratedPlayer(player)) priority.push(player);
    else browse.push(player);
  }

  const slotsForBrowse = Math.max(0, maxGenerated - priority.length);
  const trimmedBrowse = Math.max(0, browse.length - slotsForBrowse);

  return {
    players: [...priority, ...browse.slice(0, slotsForBrowse)],
    priorityCount: priority.length,
    browseCount: Math.min(browse.length, slotsForBrowse),
    trimmedBrowse,
  };
}
