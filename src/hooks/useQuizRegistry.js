/**
 * Fetch and cache the quiz registry from public/data/quiz-registry.json.
 * Falls back to bundled sampleData when the JSON fetch fails.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

let cachedRegistry = null;
let fetchPromise = null;

export function clearQuizRegistryCache() {
  cachedRegistry = null;
  fetchPromise = null;
}

async function loadBundledQuizRegistry() {
  const { buildQuizRegistryFromBundledData } = await import('../utils/quizRegistryFallback.js');
  return buildQuizRegistryFromBundledData();
}

async function resolveQuizRegistry() {
  if (cachedRegistry) return cachedRegistry;

  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch('/data/quiz-registry.json');
      if (!res.ok) throw new Error(`quiz-registry fetch failed: ${res.status}`);
      const data = await res.json();
      if (!data?.players?.length) {
        throw new Error('quiz-registry response was empty');
      }
      cachedRegistry = data;
      return data;
    } catch (networkErr) {
      console.warn(
        '[useQuizRegistry] Failed to load quiz registry — falling back to bundled data',
        networkErr,
      );
      try {
        const bundled = await loadBundledQuizRegistry();
        if (!bundled?.players?.length) {
          const emptyErr = new Error('bundled quiz registry was empty');
          emptyErr.cause = networkErr;
          throw emptyErr;
        }
        cachedRegistry = bundled;
        return bundled;
      } catch (bundledErr) {
        console.error('[useQuizRegistry] Bundled quiz fallback failed', bundledErr);
        const err = new Error('Failed to load quiz registry');
        err.cause = bundledErr;
        throw err;
      }
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

function indexById(rows) {
  return new Map((rows ?? []).map((row) => [row.id, row]));
}

export function useQuizRegistry() {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    status: 'loading',
    registry: null,
    error: null,
  });

  const retry = useCallback(() => {
    clearQuizRegistryCache();
    setState({ status: 'loading', registry: null, error: null });
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    resolveQuizRegistry()
      .then((registry) => {
        if (!cancelled) {
          setState({ status: 'ready', registry, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: 'error',
            registry: null,
            error: err?.message ?? 'Failed to load quiz data',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const indexes = useMemo(() => {
    const registry = state.registry;
    if (!registry) return { teamById: null, leagueById: null };
    return {
      teamById: indexById(registry.teams),
      leagueById: indexById(registry.leagues),
    };
  }, [state.registry]);

  return { ...state, retry, ...indexes };
}

export function peekQuizRegistry() {
  return cachedRegistry;
}
