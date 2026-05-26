import { useCallback, useEffect, useState } from 'react';
import { KNOWLEDGE_LEVELS, LEARNING_GOALS } from '../data/preferencesOptions';

const STORAGE_KEY = 'footybrain:preferences';
const CHANGE_EVENT = 'footybrain:preferences-changed';

const VALID_LEVELS = new Set(KNOWLEDGE_LEVELS.map((l) => l.id));
const VALID_GOALS = new Set(LEARNING_GOALS.map((g) => g.id));

export const EMPTY_PREFERENCES = {
  favoriteLeagueIds: [],
  favoriteClubIds: [],
  knowledgeLevel: null,
  learningGoals: [],
  completed: false,
};

function sanitize(raw) {
  return {
    favoriteLeagueIds: Array.isArray(raw?.favoriteLeagueIds)
      ? raw.favoriteLeagueIds.filter((id) => typeof id === 'string')
      : [],
    favoriteClubIds: Array.isArray(raw?.favoriteClubIds)
      ? raw.favoriteClubIds.filter((id) => typeof id === 'string')
      : [],
    knowledgeLevel:
      typeof raw?.knowledgeLevel === 'string' && VALID_LEVELS.has(raw.knowledgeLevel)
        ? raw.knowledgeLevel
        : null,
    learningGoals: Array.isArray(raw?.learningGoals)
      ? raw.learningGoals.filter((id) => VALID_GOALS.has(id))
      : [],
    completed: raw?.completed === true,
  };
}

function readStorage() {
  if (typeof window === 'undefined') return { ...EMPTY_PREFERENCES };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...EMPTY_PREFERENCES };
  } catch {
    return { ...EMPTY_PREFERENCES };
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

export function hasPreferences(prefs) {
  return prefs?.completed === true;
}

export function usePreferences() {
  const [preferences, setPreferences] = useState(readStorage);

  useEffect(() => {
    const onSync = (event) => {
      setPreferences(
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

  const savePreferences = useCallback((next) => {
    const clean = sanitize({ ...next, completed: true });
    setPreferences(clean);
    persist(clean);
    return clean;
  }, []);

  const clearPreferences = useCallback(() => {
    const fresh = { ...EMPTY_PREFERENCES };
    setPreferences(fresh);
    persist(fresh);
  }, []);

  return {
    preferences,
    hasPreferences: hasPreferences(preferences),
    savePreferences,
    clearPreferences,
  };
}
