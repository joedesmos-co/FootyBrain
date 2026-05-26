/**
 * Fetch and cache the build-time search index from public/data/search-index.json.
 * Provides lightweight player/team/league/national-team data for Universal Search
 * without loading the full sampleData module.
 *
 * Falls back to null on failure so callers can fall back to bundled data.
 */

import { useEffect, useState } from 'react';

/** Module-level in-memory cache — survives component remounts within a session. */
let cachedIndex = null;
let fetchPromise = null;

async function fetchSearchIndex() {
  if (cachedIndex) return cachedIndex;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/data/search-index.json')
    .then((res) => {
      if (!res.ok) throw new Error(`search-index fetch failed: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cachedIndex = data;
      fetchPromise = null;
      return data;
    })
    .catch((err) => {
      fetchPromise = null;
      console.warn('[useSearchIndex] Failed to load search index — falling back to sampleData', err);
      return null;
    });

  return fetchPromise;
}

/**
 * @returns {{ index: object|null, status: 'loading'|'ready'|'error' }}
 */
export function useSearchIndex() {
  // Initialise directly from module-level cache so first render is already 'ready'
  // if a prior component already loaded the index this session.
  const [state, setState] = useState(() => ({
    index: cachedIndex,
    status: cachedIndex ? 'ready' : 'loading',
  }));

  useEffect(() => {
    // Already resolved from cache — nothing to do.
    if (cachedIndex) return;

    let cancelled = false;
    fetchSearchIndex().then((data) => {
      if (cancelled) return;
      setState({
        index: data,
        status: data ? 'ready' : 'error',
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
