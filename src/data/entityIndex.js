/**
 * Runtime entity index loader.
 *
 * Purpose: allow team/player lookups without importing the full bundled `sampleData.js`.
 * This enables league-shard fetching by leagueId for 6k–8k player scale.
 */

let inflight = null;
let cached = null;

function normalize(raw) {
  const players = Array.isArray(raw?.players) ? raw.players : [];
  const teams = Array.isArray(raw?.teams) ? raw.teams : [];
  return {
    meta: raw?.meta ?? null,
    players,
    teams,
    playerById: new Map(players.map((p) => [p.id, p])),
    teamById: new Map(teams.map((t) => [t.id, t])),
  };
}

export async function loadEntityIndex() {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch('/data/entity-index.json');
    if (!res.ok) {
      throw new Error(`entity-index fetch failed (${res.status})`);
    }
    const raw = await res.json();
    cached = normalize(raw);
    return cached;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function peekEntityIndex() {
  return cached;
}

