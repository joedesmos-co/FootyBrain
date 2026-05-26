/**
 * Upsert approved editorial rows into players.generated-draft.json.
 * Used by append-*-editorial-batch.js scripts.
 */

import fs from 'fs';

/**
 * @param {object} options
 * @param {string} options.draftPath
 * @param {object[]} options.batch
 * @param {string[]} [options.retiredIds]
 * @param {string} [options.description]
 */
export function upsertDraftPlayers({ draftPath, batch, retiredIds = [], description }) {
  const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
  const before = draft.players?.length ?? 0;
  const waveIds = new Set(batch.map((p) => p.id));

  if (!Array.isArray(draft.players)) {
    throw new Error(`${draftPath}: root "players" must be an array`);
  }

  if (retiredIds.length > 0) {
    draft.players = draft.players.filter(
      (p) => !retiredIds.includes(p.id) || waveIds.has(p.id),
    );
  }

  const byId = new Map(draft.players.map((p) => [p.id, p]));
  for (const entry of batch) {
    if (!entry?.id) throw new Error('Batch entry missing id');
    byId.set(entry.id, entry);
  }
  draft.players = [...byId.values()];

  const seenIds = new Set();
  const seenSourceIds = new Set();
  for (const player of draft.players) {
    if (seenIds.has(player.id)) {
      throw new Error(`Duplicate draft player id after upsert: ${player.id}`);
    }
    seenIds.add(player.id);
    if (player.sourceId != null) {
      const sid = String(player.sourceId);
      if (seenSourceIds.has(sid)) {
        throw new Error(`Duplicate draft sourceId after upsert: ${sid} (${player.id})`);
      }
      seenSourceIds.add(sid);
    }
  }

  draft.updatedAt = new Date().toISOString().slice(0, 10);
  if (description) draft.description = description;

  fs.writeFileSync(draftPath, `${JSON.stringify(draft, null, 2)}\n`);

  return {
    before,
    after: draft.players.length,
    upserted: batch.length,
  };
}
