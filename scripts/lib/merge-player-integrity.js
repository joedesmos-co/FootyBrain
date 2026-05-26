/**
 * Pre-write checks for merge-phase1-sample-data.js output.
 */

/**
 * @param {object[]} players
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function checkMergePlayerIntegrity(players) {
  const errors = [];
  const warnings = [];
  const idCounts = new Map();
  const nameTeamCounts = new Map();
  const sourceIdCounts = new Map();

  for (const player of players) {
    const id = player.id;
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);

    const nameKey = `${(player.name ?? '').trim().toLowerCase()}|${player.teamId ?? ''}`;
    nameTeamCounts.set(nameKey, (nameTeamCounts.get(nameKey) ?? 0) + 1);

    const sid = player.sourceId ?? player.tmPlayerId;
    if (sid != null && String(sid).trim()) {
      const key = String(sid);
      sourceIdCounts.set(key, (sourceIdCounts.get(key) ?? 0) + 1);
    }
  }

  for (const [id, count] of idCounts) {
    if (count > 1) errors.push(`Duplicate player id in merge output: ${id} (${count} rows)`);
  }

  for (const [key, count] of nameTeamCounts) {
    if (count > 1) {
      const [name, teamId] = key.split('|');
      warnings.push(
        `Duplicate display name on same club: "${name}" @ ${teamId} (${count} rows) — quiz/search risk`,
      );
    }
  }

  for (const [sid, count] of sourceIdCounts) {
    if (count > 1) {
      errors.push(`Duplicate TM sourceId in merge output: ${sid} (${count} rows)`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
