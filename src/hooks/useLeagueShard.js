import { useEffect, useState } from 'react';
import { getManifestLeague } from '../data/contentManifest';
import { hasExternalLeagueShard, loadLeagueShard } from '../data/leagueShard';

/**
 * @param {string | undefined | null} leagueId
 * @param {{ requireManifest?: boolean }} [options]
 */
export function useLeagueShard(leagueId, options = {}) {
  const { requireManifest = false } = options;
  const manifestEntry = leagueId ? getManifestLeague(leagueId) : null;
  const [loaded, setLoaded] = useState({
    key: null,
    shard: null,
    error: null,
  });

  useEffect(() => {
    if (!leagueId || (requireManifest && !manifestEntry)) {
      return undefined;
    }

    let cancelled = false;
    const key = leagueId;

    loadLeagueShard(leagueId)
      .then((shard) => {
        if (!cancelled) {
          setLoaded({ key, shard, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoaded({
            key,
            shard: null,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [leagueId, manifestEntry, requireManifest]);

  if (!leagueId) {
    return { status: 'idle', shard: null, error: null, manifestEntry: null };
  }

  if (requireManifest && !manifestEntry) {
    return { status: 'missing', shard: null, error: null, manifestEntry: null };
  }

  if (loaded.key !== leagueId) {
    return { status: 'loading', shard: null, error: null, manifestEntry };
  }

  if (loaded.error) {
    return { status: 'error', shard: null, error: loaded.error, manifestEntry };
  }

  return { status: 'ready', shard: loaded.shard, error: null, manifestEntry };
}

export { hasExternalLeagueShard };
