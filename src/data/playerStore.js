import { loadEntityIndex } from './entityIndex';
import { loadLeagueShard } from './contentManifest';

const playerCache = new Map();
const inflight = new Map();

async function loadBundledPlayer(playerId) {
  const mod = await import('./sampleData.js');
  return mod.getPlayerById(playerId);
}

export async function loadPlayerById(playerId) {
  if (!playerId) return null;
  const cached = playerCache.get(playerId);
  if (cached) return cached;

  const pending = inflight.get(playerId);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const idx = await loadEntityIndex();
      const row = idx.playerById.get(playerId);
      const leagueId = row?.leagueId;
      if (leagueId) {
        const shard = await loadLeagueShard(leagueId);
        const player = shard.players.find((p) => p.id === playerId) ?? null;
        if (player) {
          playerCache.set(playerId, player);
          return player;
        }
      }
    } catch {
      // fall through to bundled lookup
    }

    const fallback = await loadBundledPlayer(playerId);
    if (fallback) playerCache.set(playerId, fallback);
    return fallback ?? null;
  })();

  inflight.set(playerId, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(playerId);
  }
}

