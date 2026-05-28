import { useEffect, useMemo, useState } from 'react';
import { useSearchIndex } from './useSearchIndex';
import { getLeagueDisplayName } from '../utils/footballDisplay';
import { getPlayerSearchIndex } from '../utils/playerSearchIndex.js';

/**
 * Full player list for autocomplete / lookup (search index, with sampleData fallback).
 */
export function usePlayerSearchPool() {
  const { index, status: indexStatus } = useSearchIndex();
  const [fallback, setFallback] = useState(null);

  useEffect(() => {
    if (indexStatus !== 'error' || fallback) return undefined;

    let cancelled = false;
    import('../data/sampleData.js').then((mod) => {
      if (cancelled) return;
      setFallback({
        players: mod.players,
        getTeamName: mod.getTeamName,
        getLeagueName: mod.getLeagueName,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [indexStatus, fallback]);

  const readyPlayers = useMemo(() => {
    if (!index?.players?.length) return null;
    const teamMap = new Map(index.teams.map((team) => [team.id, team.name]));
    const leagueMap = new Map(index.leagues.map((league) => [league.id, league]));
    return index.players.map((player) => {
      const league = leagueMap.get(player.leagueId);
      return {
        ...player,
        _teamName: player.teamName ?? teamMap.get(player.teamId) ?? 'Unknown',
        leagueName: player.leagueName ?? (league ? getLeagueDisplayName(league) : ''),
      };
    });
  }, [index]);

  useEffect(() => {
    const pool = readyPlayers ?? fallback?.players;
    if (pool?.length) {
      getPlayerSearchIndex(pool);
    }
  }, [readyPlayers, fallback]);

  return useMemo(() => {
    if (readyPlayers?.length) {
      const teamMap = new Map(index.teams.map((team) => [team.id, team.name]));
      const leagueMap = new Map(index.leagues.map((league) => [league.id, league]));

      return {
        status: 'ready',
        players: readyPlayers,
        getTeamName: (id) => teamMap.get(id) ?? 'Unknown',
        getLeagueName: (id) => {
          const league = leagueMap.get(id);
          return league ? getLeagueDisplayName(league) : id ?? 'Unknown';
        },
      };
    }

    if (fallback) {
      return {
        status: 'ready',
        players: fallback.players,
        getTeamName: fallback.getTeamName,
        getLeagueName: fallback.getLeagueName,
      };
    }

    return {
      status: indexStatus,
      players: [],
      getTeamName: () => 'Unknown',
      getLeagueName: () => 'Unknown',
    };
  }, [index, readyPlayers, fallback, indexStatus]);
}
