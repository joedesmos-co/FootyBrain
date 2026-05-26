import { getMembershipForPlayer } from '../data/nationalTeamData';
import { players } from '../data/sampleData';

const MAX_RELATED = 5;
const POOL_CAP = 12;

/** @type {{ byTeam: Map<string, object[]>, byPosition: Map<string, object[]>, byTacticalRole: Map<string, object[]>, byNationalTeam: Map<string, object[]> } | null} */
let indexes = null;

function positionKey(position) {
  const p = String(position ?? '').toLowerCase();
  if (/goalkeeper/i.test(p)) return 'goalkeeper';
  if (/defender|centre-back|center-back|full-back|back$/i.test(p)) return 'defender';
  if (/midfield/i.test(p)) return 'midfielder';
  if (/striker|winger|forward|attack/i.test(p)) return 'forward';
  return p.trim() || 'other';
}

function tacticalRoleKey(position) {
  const p = String(position ?? '').toLowerCase();
  if (!p) return 'other';
  if (/goalkeeper/.test(p)) return 'goalkeeper';
  if (/wing[-\s]*back/.test(p)) return 'wing-back';
  if (/full[-\s]*back|left[-\s]*back|right[-\s]*back/.test(p)) return 'fullback';
  if (/centre[-\s]*back|center[-\s]*back/.test(p)) return 'centre-back';
  if (/defensive midfield|holding|dm\b/.test(p)) return 'defensive-mid';
  if (/attacking midfield|am\b|no\.\s*10|number\s*10/.test(p)) return 'attacking-mid';
  if (/central midfield|box-to-box|cm\b/.test(p)) return 'central-mid';
  if (/wide midfield/.test(p)) return 'wide-mid';
  if (/second striker/.test(p)) return 'second-striker';
  if (/striker|centre-forward|center-forward/.test(p)) return 'striker';
  if (/winger|wide forward|left wing|right wing/.test(p)) return 'winger';
  return positionKey(position);
}

function buildIndexes() {
  const byTeam = new Map();
  const byPosition = new Map();
  const byTacticalRole = new Map();
  const byNationalTeam = new Map();

  for (const player of players) {
    if (!byTeam.has(player.teamId)) byTeam.set(player.teamId, []);
    byTeam.get(player.teamId).push(player);

    const pk = positionKey(player.position);
    if (!byPosition.has(pk)) byPosition.set(pk, []);
    byPosition.get(pk).push(player);

    const tk = tacticalRoleKey(player.position);
    if (!byTacticalRole.has(tk)) byTacticalRole.set(tk, []);
    byTacticalRole.get(tk).push(player);

    const membership = getMembershipForPlayer(player.id);
    if (membership?.nationalTeamId) {
      const ntId = membership.nationalTeamId;
      if (!byNationalTeam.has(ntId)) byNationalTeam.set(ntId, []);
      byNationalTeam.get(ntId).push(player);
    }
  }

  return { byTeam, byPosition, byTacticalRole, byNationalTeam };
}

function getIndexes() {
  if (!indexes) indexes = buildIndexes();
  return indexes;
}

function topByImportance(list, excludeId, cap = POOL_CAP) {
  return list
    .filter((p) => p.id !== excludeId)
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
    .slice(0, cap);
}

function reasonLabel(reasons) {
  if (reasons.has('club') && reasons.has('national-team')) return 'Same club & nation';
  if (reasons.has('club')) return 'Same club';
  if (reasons.has('national-team')) return 'Same national team';
  if (reasons.has('similar-role')) return 'Similar role';
  if (reasons.has('position')) return 'Same position';
  return '';
}

/**
 * @param {import('../data/sampleData').players[number]} player
 * @param {{ limit?: number }} [options]
 * @returns {Array<{ player: object, reasonLabel: string }>}
 */
export function getRelatedPlayers(player, options = {}) {
  const limit = Math.min(options.limit ?? MAX_RELATED, MAX_RELATED);
  if (!player?.id) return [];

  const { byTeam, byPosition, byTacticalRole, byNationalTeam } = getIndexes();
  const scored = new Map();

  const addPool = (list, points, reason) => {
    for (const candidate of list) {
      const entry = scored.get(candidate.id) ?? {
        player: candidate,
        score: 0,
        reasons: new Set(),
      };
      entry.score += points;
      entry.reasons.add(reason);
      scored.set(candidate.id, entry);
    }
  };

  addPool(topByImportance(byTeam.get(player.teamId) ?? [], player.id), 40, 'club');

  const membership = getMembershipForPlayer(player.id);
  if (membership?.nationalTeamId) {
    addPool(
      topByImportance(byNationalTeam.get(membership.nationalTeamId) ?? [], player.id),
      35,
      'national-team',
    );
  }

  addPool(
    topByImportance(byPosition.get(positionKey(player.position)) ?? [], player.id),
    20,
    'position',
  );

  addPool(
    topByImportance(byTacticalRole.get(tacticalRoleKey(player.position)) ?? [], player.id),
    18,
    'similar-role',
  );

  return [...scored.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.player.importanceScore ?? 0) - (a.player.importanceScore ?? 0),
    )
    .slice(0, limit)
    .map(({ player: p, reasons }) => ({
      player: p,
      reasonLabel: reasonLabel(reasons),
    }));
}

/**
 * Same position bucket, different club — for “similar role” discovery (no same-team duplicates).
 * @param {import('../data/sampleData').players[number]} player
 * @param {{ limit?: number }} [options]
 */
export function getSimilarRolePlayers(player, options = {}) {
  const limit = Math.min(options.limit ?? 4, 4);
  if (!player?.id) return [];

  const { byTacticalRole } = getIndexes();
  const tk = tacticalRoleKey(player.position);
  const pool = byTacticalRole.get(tk) ?? [];

  return pool
    .filter((candidate) => candidate.id !== player.id && candidate.teamId !== player.teamId)
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
    .slice(0, limit)
    .map((p) => ({
      player: p,
      reasonLabel: 'Similar role',
    }));
}

/**
 * Diversified “you may also like” suggestions: club + nation + tactical role + same league.
 * @param {import('../data/sampleData').players[number]} player
 * @param {{ limit?: number }} [options]
 * @returns {Array<{ player: object, reasonLabel: string }>}
 */
export function getYouMayAlsoLikePlayers(player, options = {}) {
  const limit = Math.min(options.limit ?? 6, 6);
  if (!player?.id) return [];

  const { byTeam, byTacticalRole, byNationalTeam } = getIndexes();
  const scored = new Map();

  const addPool = (list, points, reason) => {
    for (const candidate of list) {
      if (candidate.id === player.id) continue;
      const entry = scored.get(candidate.id) ?? {
        player: candidate,
        score: 0,
        reasons: new Set(),
      };
      entry.score += points;
      entry.reasons.add(reason);
      scored.set(candidate.id, entry);
    }
  };

  addPool(topByImportance(byTeam.get(player.teamId) ?? [], player.id), 38, 'club');

  const membership = getMembershipForPlayer(player.id);
  if (membership?.nationalTeamId) {
    addPool(
      topByImportance(byNationalTeam.get(membership.nationalTeamId) ?? [], player.id),
      32,
      'national-team',
    );
  }

  addPool(
    topByImportance(byTacticalRole.get(tacticalRoleKey(player.position)) ?? [], player.id),
    24,
    'similar-role',
  );

  const sameLeague = topByImportance(
    players.filter((p) => p.leagueId === player.leagueId),
    player.id,
    10,
  );
  addPool(sameLeague, 10, 'league');

  return [...scored.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.player.importanceScore ?? 0) - (a.player.importanceScore ?? 0),
    )
    .slice(0, limit)
    .map(({ player: p, reasons }) => ({
      player: p,
      reasonLabel: reasonLabel(reasons),
    }));
}
