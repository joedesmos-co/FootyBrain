/**
 * Lightweight prefix indexes for non-player entities (teams/leagues/national teams).
 * Keeps existing alias behavior by continuing to score with get*SearchFields().
 *
 * Goal: narrow candidate sets before scoring for future 5k+ player scale.
 */

import {
  getLeagueSearchFields,
  getNationalTeamSearchFields,
  getTeamSearchFields,
} from './searchAliases';
import { normalizeForSearch } from './textSearch';

const PREFIX_MIN = 2;
const PREFIX_MAX = 3;
const FULL_SCAN_FALLBACK = 2000;

function addToPrefixMap(prefixMap, prefix, entity) {
  if (prefix.length < PREFIX_MIN) return;
  let bucket = prefixMap.get(prefix);
  if (!bucket) {
    bucket = [];
    prefixMap.set(prefix, bucket);
  }
  if (bucket[bucket.length - 1]?.id !== entity.id) {
    bucket.push(entity);
  }
}

function tokenPrefixes(token) {
  const maxLen = Math.min(token.length, PREFIX_MAX);
  const out = [];
  for (let len = PREFIX_MIN; len <= maxLen; len += 1) out.push(token.slice(0, len));
  return out;
}

function indexEntity(prefixMap, entity, rawFields) {
  const tokens = new Set();
  for (const field of rawFields) {
    const norm = normalizeForSearch(field);
    if (!norm) continue;
    tokens.add(norm);
    for (const part of norm.split(' ')) {
      if (part) tokens.add(part);
    }
  }

  for (const token of tokens) {
    for (const prefix of tokenPrefixes(token)) {
      addToPrefixMap(prefixMap, prefix, entity);
    }
  }
}

/** @type {WeakMap<object, Map<string, any[]>>} */
const teamIndexByRef = new WeakMap();
/** @type {WeakMap<object, Map<string, any[]>>} */
const leagueIndexByRef = new WeakMap();
/** @type {WeakMap<object, Map<string, any[]>>} */
const nationalTeamIndexByRef = new WeakMap();

export function getTeamSearchCandidates(teams, normalizedQuery, getLeagueName) {
  if (!Array.isArray(teams) || teams.length === 0) return [];
  if (!normalizedQuery || normalizedQuery.length < PREFIX_MIN) return teams;

  let prefixMap = teamIndexByRef.get(teams);
  if (!prefixMap) {
    prefixMap = new Map();
    for (const team of teams) {
      indexEntity(prefixMap, team, getTeamSearchFields(team, getLeagueName));
    }
    teamIndexByRef.set(teams, prefixMap);
  }

  const key = normalizedQuery.slice(0, Math.min(PREFIX_MAX, normalizedQuery.length));
  const bucket = prefixMap.get(key);
  if (bucket && bucket.length > 0 && bucket.length <= FULL_SCAN_FALLBACK) return bucket;
  return teams;
}

export function getLeagueSearchCandidates(leagues, normalizedQuery) {
  if (!Array.isArray(leagues) || leagues.length === 0) return [];
  if (!normalizedQuery || normalizedQuery.length < PREFIX_MIN) return leagues;

  let prefixMap = leagueIndexByRef.get(leagues);
  if (!prefixMap) {
    prefixMap = new Map();
    for (const league of leagues) {
      indexEntity(prefixMap, league, getLeagueSearchFields(league));
    }
    leagueIndexByRef.set(leagues, prefixMap);
  }

  const key = normalizedQuery.slice(0, Math.min(PREFIX_MAX, normalizedQuery.length));
  const bucket = prefixMap.get(key);
  if (bucket && bucket.length > 0 && bucket.length <= FULL_SCAN_FALLBACK) return bucket;
  return leagues;
}

export function getNationalTeamSearchCandidates(nationalTeams, normalizedQuery) {
  if (!Array.isArray(nationalTeams) || nationalTeams.length === 0) return [];
  if (!normalizedQuery || normalizedQuery.length < PREFIX_MIN) return nationalTeams;

  let prefixMap = nationalTeamIndexByRef.get(nationalTeams);
  if (!prefixMap) {
    prefixMap = new Map();
    for (const team of nationalTeams) {
      indexEntity(prefixMap, team, getNationalTeamSearchFields(team));
    }
    nationalTeamIndexByRef.set(nationalTeams, prefixMap);
  }

  const key = normalizedQuery.slice(0, Math.min(PREFIX_MAX, normalizedQuery.length));
  const bucket = prefixMap.get(key);
  if (bucket && bucket.length > 0 && bucket.length <= FULL_SCAN_FALLBACK) return bucket;
  return nationalTeams;
}

