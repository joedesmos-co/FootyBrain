import { useEffect, useState } from 'react';

const FAVORITES_STORAGE_KEY = 'footybrain:favorites';
const FAVORITES_CHANGED_EVENT = 'footybrain:favorites-changed';
const EMPTY_FAVORITES = {
  players: [],
  teams: [],
};

function cleanFavorites(value) {
  return {
    players: Array.isArray(value?.players) ? value.players : [],
    teams: Array.isArray(value?.teams) ? value.teams : [],
  };
}

function readFavorites() {
  if (typeof window === 'undefined') return EMPTY_FAVORITES;

  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? cleanFavorites(JSON.parse(stored)) : EMPTY_FAVORITES;
  } catch {
    return EMPTY_FAVORITES;
  }
}

function writeFavorites(favorites) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Keep the in-memory UI usable if localStorage is unavailable.
  }

  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT, {
    detail: favorites,
  }));
}

function toggleId(ids, id) {
  return ids.includes(id)
    ? ids.filter((savedId) => savedId !== id)
    : [...ids, id];
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    const syncFavorites = (event) => {
      setFavorites(event.detail ? cleanFavorites(event.detail) : readFavorites());
    };

    window.addEventListener('storage', syncFavorites);
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavorites);

    return () => {
      window.removeEventListener('storage', syncFavorites);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavorites);
    };
  }, []);

  const updateFavorites = (updater) => {
    const nextFavorites = cleanFavorites(updater(favorites));
    setFavorites(nextFavorites);
    writeFavorites(nextFavorites);
  };

  return {
    favorites,
    isPlayerSaved: (playerId) => favorites.players.includes(playerId),
    isTeamSaved: (teamId) => favorites.teams.includes(teamId),
    togglePlayer: (playerId) => updateFavorites((currentFavorites) => ({
      ...currentFavorites,
      players: toggleId(currentFavorites.players, playerId),
    })),
    toggleTeam: (teamId) => updateFavorites((currentFavorites) => ({
      ...currentFavorites,
      teams: toggleId(currentFavorites.teams, teamId),
    })),
  };
}
