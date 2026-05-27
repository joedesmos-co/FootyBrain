/**
 * World Cup 2026 rosters (tournament roster vs national pool).
 * Static JSON overlay only — no external APIs.
 */

import rosterOverlay from '../../editorial-overlays/world-cup-2026-rosters.json';
import { getPlayerById } from './sampleData';

const DEFAULT = {
  rosterPlayerIds: [],
  projectedRosterPlayerIds: [],
  alternatePlayerIds: [],
};

function uniqCompact(ids) {
  const out = [];
  const seen = new Set();
  for (const id of ids ?? []) {
    if (!id) continue;
    const key = String(id).trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function resolvePlayers(ids) {
  const list = [];
  for (const id of ids) {
    const player = getPlayerById(id);
    if (player) list.push(player);
  }
  return list;
}

export function getWorldCup2026RosterMeta() {
  return {
    competitionId: rosterOverlay.competitionId ?? 'world-cup-2026',
    editionYear: rosterOverlay.editionYear ?? 2026,
    asOf: rosterOverlay.asOf ?? null,
  };
}

export function getWorldCup2026RosterIds(nationalTeamId) {
  const row = rosterOverlay.teams?.[nationalTeamId] ?? DEFAULT;
  return {
    rosterPlayerIds: uniqCompact(row.rosterPlayerIds),
    projectedRosterPlayerIds: uniqCompact(row.projectedRosterPlayerIds),
    alternatePlayerIds: uniqCompact(row.alternatePlayerIds),
  };
}

export function getWorldCup2026RosterPlayers(nationalTeamId) {
  const ids = getWorldCup2026RosterIds(nationalTeamId);
  return resolvePlayers(ids.rosterPlayerIds);
}

export function getWorldCup2026ProjectedRosterPlayers(nationalTeamId) {
  const ids = getWorldCup2026RosterIds(nationalTeamId);
  return resolvePlayers(ids.projectedRosterPlayerIds);
}

export function getWorldCup2026AlternatePlayers(nationalTeamId) {
  const ids = getWorldCup2026RosterIds(nationalTeamId);
  return resolvePlayers(ids.alternatePlayerIds);
}

export function getWorldCup2026RosterStatus(nationalTeamId) {
  const { rosterPlayerIds, projectedRosterPlayerIds } = getWorldCup2026RosterIds(nationalTeamId);
  if (rosterPlayerIds.length) return { kind: 'roster', label: 'World Cup roster' };
  if (projectedRosterPlayerIds.length) return { kind: 'projected', label: 'Projected roster' };
  return { kind: 'tbd', label: 'World Cup roster: TBD' };
}

