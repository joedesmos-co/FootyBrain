/**
 * Fetch and cache the quiz registry from public/data/quiz-registry.json.
 * Used by Quiz and Daily Challenge to avoid loading the full sampleData monolith.
 */

import { useEffect, useMemo, useState } from 'react';

let cachedRegistry = null;
let fetchPromise = null;

async function fetchQuizRegistry() {
  if (cachedRegistry) return cachedRegistry;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/data/quiz-registry.json')
    .then((res) => {
      if (!res.ok) throw new Error(`quiz-registry fetch failed: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cachedRegistry = data;
      fetchPromise = null;
      return data;
    })
    .catch((err) => {
      fetchPromise = null;
      console.warn('[useQuizRegistry] Failed to load quiz registry — falling back to sampleData', err);
      return null;
    });

  return fetchPromise;
}

function indexById(rows) {
  return new Map((rows ?? []).map((row) => [row.id, row]));
}

export function useQuizRegistry() {
  const [state, setState] = useState({ status: 'loading', registry: null });

  useEffect(() => {
    let cancelled = false;
    fetchQuizRegistry()
      .then((registry) => {
        if (!cancelled) setState({ status: registry ? 'ready' : 'error', registry });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', registry: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const indexes = useMemo(() => {
    const registry = state.registry;
    if (!registry) return { teamById: null, leagueById: null };
    return {
      teamById: indexById(registry.teams),
      leagueById: indexById(registry.leagues),
    };
  }, [state.registry]);

  return { ...state, ...indexes };
}

export function peekQuizRegistry() {
  return cachedRegistry;
}

