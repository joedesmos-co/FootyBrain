import { useCallback, useEffect, useState } from 'react';
import {
  getCollectionProgress,
  itemProgressKey,
} from '../utils/collectionProgress';
import { useProgression } from './useProgression';

export { getCollectionProgress, itemProgressKey } from '../utils/collectionProgress';

const STORAGE_KEY = 'footybrain:collections-progress';
const CHANGE_EVENT = 'footybrain:collections-progress-changed';

const EMPTY = {
  viewed: [],
  learned: [],
  completedCollections: [],
};

function sanitize(raw) {
  const viewed = Array.isArray(raw?.viewed)
    ? raw.viewed.filter((k) => typeof k === 'string')
    : [];
  let learned = Array.isArray(raw?.learned)
    ? raw.learned.filter((k) => typeof k === 'string')
    : [];
  if (learned.length === 0 && viewed.length > 0) {
    learned = [...viewed];
  }
  return {
    viewed,
    learned,
    completedCollections: Array.isArray(raw?.completedCollections)
      ? raw.completedCollections.filter((id) => typeof id === 'string')
      : [],
  };
}

function readStorage() {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function persist(state) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: state }));
}

export function useCollectionProgress() {
  const [state, setState] = useState(readStorage);
  const { awardCollectionItemXp, awardCollectionCompleteXp } = useProgression();

  useEffect(() => {
    const onSync = (event) => {
      setState(
        event instanceof CustomEvent && event.detail
          ? sanitize(event.detail)
          : readStorage(),
      );
    };
    window.addEventListener('storage', onSync);
    window.addEventListener(CHANGE_EVENT, onSync);
    return () => {
      window.removeEventListener('storage', onSync);
      window.removeEventListener(CHANGE_EVENT, onSync);
    };
  }, []);

  const applyUpdate = useCallback((updater) => {
    setState((prev) => {
      const next = sanitize(updater(prev));
      persist(next);
      return next;
    });
  }, []);

  const isItemViewed = useCallback(
    (collectionId, index) =>
      state.viewed.includes(itemProgressKey(collectionId, index)),
    [state.viewed],
  );

  const isItemLearned = useCallback(
    (collectionId, index) =>
      state.learned.includes(itemProgressKey(collectionId, index)),
    [state.learned],
  );

  const markItemViewed = useCallback(
    (collectionId, index) => {
      const key = itemProgressKey(collectionId, index);
      applyUpdate((prev) => {
        if (prev.viewed.includes(key)) return prev;
        return { ...prev, viewed: [...prev.viewed, key] };
      });
    },
    [applyUpdate],
  );

  const markItemLearned = useCallback(
    (collectionId, index, itemCount) => {
      const key = itemProgressKey(collectionId, index);
      if (state.learned.includes(key)) return 0;

      let xpTotal = awardCollectionItemXp(collectionId, index);

      const prefix = `${collectionId}:`;
      const learnedAfter = state.learned.filter((k) => k.startsWith(prefix)).length + 1;
      const willAutoComplete =
        itemCount > 0 &&
        learnedAfter >= itemCount &&
        !state.completedCollections.includes(collectionId);

      if (willAutoComplete) {
        xpTotal += awardCollectionCompleteXp(collectionId);
      }

      applyUpdate((prev) => {
        if (prev.learned.includes(key)) return prev;
        const viewed = prev.viewed.includes(key)
          ? prev.viewed
          : [...prev.viewed, key];
        const learned = [...prev.learned, key];
        const completedCollections =
          willAutoComplete && !prev.completedCollections.includes(collectionId)
            ? [...prev.completedCollections, collectionId]
            : prev.completedCollections;
        return { ...prev, viewed, learned, completedCollections };
      });

      return xpTotal;
    },
    [
      applyUpdate,
      awardCollectionItemXp,
      awardCollectionCompleteXp,
      state.learned,
      state.completedCollections,
    ],
  );

  const markCollectionComplete = useCallback(
    (collectionId) => {
      if (state.completedCollections.includes(collectionId)) {
        return 0;
      }
      const xp = awardCollectionCompleteXp(collectionId);
      applyUpdate((prev) => {
        if (prev.completedCollections.includes(collectionId)) return prev;
        return {
          ...prev,
          completedCollections: [...prev.completedCollections, collectionId],
        };
      });
      return xp;
    },
    [applyUpdate, awardCollectionCompleteXp, state.completedCollections],
  );

  const resetCollection = useCallback(
    (collectionId) => {
      const prefix = `${collectionId}:`;
      applyUpdate((prev) => ({
        viewed: prev.viewed.filter((k) => !k.startsWith(prefix)),
        learned: prev.learned.filter((k) => !k.startsWith(prefix)),
        completedCollections: prev.completedCollections.filter((id) => id !== collectionId),
      }));
    },
    [applyUpdate],
  );

  const getProgress = useCallback(
    (collectionId, itemCount) => getCollectionProgress(collectionId, itemCount, state),
    [state],
  );

  return {
    viewed: state.viewed,
    learned: state.learned,
    completedCollectionIds: state.completedCollections,
    isItemViewed,
    isItemLearned,
    markItemViewed,
    markItemLearned,
    markCollectionComplete,
    resetCollection,
    getProgress,
  };
}
