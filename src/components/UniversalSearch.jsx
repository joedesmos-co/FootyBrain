import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearchIndex } from '../hooks/useSearchIndex';
import { getLeagueDisplayName } from '../utils/footballDisplay';
import {
  POPULAR_SEARCHES,
  SEARCH_EMPTY_EXAMPLES,
  SEARCH_EMPTY_HINT,
} from '../utils/popularSearches';
import { RESULT_TYPE_LABELS, searchUniversalGrouped } from '../utils/universalSearch';
import LeagueBadge from './LeagueBadge';
import NationalTeamBadge from './NationalTeamBadge';
import PlayerVisual from './PlayerVisual';
import RecentlyViewedPanel from './RecentlyViewedPanel';
import TeamBadge from './TeamBadge';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  '[href]',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled'),
  );
}

/**
 * Build getTeamName / getLeagueName helpers from the search index.
 * These are used by universalSearch scoring — both for players and teams.
 */
function buildHelpersFromIndex(index) {
  const teamMap = new Map(index.teams.map((t) => [t.id, t.name]));
  const leagueMap = new Map(index.leagues.map((l) => [l.id, l]));
  return {
    getTeamName: (id) => teamMap.get(id) ?? id ?? 'Unknown',
    getLeagueName: (id) => {
      const league = leagueMap.get(id);
      if (league) return getLeagueDisplayName(league);
      return id ?? 'Unknown';
    },
  };
}

/**
 * Adapt index entries to the shape universalSearch.js expects for players/teams/leagues/NT.
 * We only add the minimal fields the scoring + rendering code accesses directly.
 */
function buildSearchContextFromIndex(index) {
  const { getTeamName, getLeagueName } = buildHelpersFromIndex(index);

  // Players: index entries are already shaped for scoring; universalSearch accesses
  // player.importanceScore, player.nationalTeam, player.nationality, player.position,
  // player.teamId, player.leagueId — all present. Also player.name, player.id.
  // We copy teamName + leagueName onto each player so PlayerVisual can get it without sampleData.
  const players = index.players.map((p) => ({
    ...p,
    // These are the fields universalSearch and getMembershipForPlayer need:
    teamId: p.teamId,
    leagueId: p.leagueId,
    nationalTeam: p.nationalTeam,
    nationality: p.nationality,
    position: p.position,
    importanceScore: p.importanceScore ?? 0,
    // Baked-in so PlayerVisual thumb can render without sampleData getTeamName:
    _teamName: p.teamName,
  }));

  // Teams: scoring uses team.name, team.country, team.leagueId, team.id.
  // We add leagueName for subtitle.
  const teams = index.teams.map((t) => ({
    ...t,
    leagueName: t.leagueName ?? getLeagueName(t.leagueId),
  }));

  // Leagues: scoring uses league.name, league.country, league.id (display name mapped for UI).
  const leagues = index.leagues.map((league) => ({
    ...league,
    name: getLeagueDisplayName(league),
  }));

  // National teams: scoring uses nt.displayName, nt.country, nt.confederation, nt.id, nt.searchAliases.
  // Index entries have aliases merged into nt.aliases — expose as searchAliases for scoring compat.
  const nationalTeams = index.nationalTeams.map((nt) => ({
    ...nt,
    searchAliases: nt.aliases ?? [],
  }));

  return { players, teams, leagues, nationalTeams, getTeamName, getLeagueName };
}

/**
 * Lazy sampleData fallback — only imported if the index fetch fails.
 * This keeps sampleData out of the initial UniversalSearch chunk.
 */
let bundledContext = null;
async function loadBundledContext() {
  if (bundledContext) return bundledContext;
  const [sd, ntMod] = await Promise.all([
    import('../data/sampleData.js'),
    import('../data/nationalTeamData.js'),
  ]);
  bundledContext = {
    players: sd.players,
    teams: sd.teams,
    leagues: sd.leagues.map((league) => ({
      ...league,
      name: getLeagueDisplayName(league),
    })),
    nationalTeams: ntMod.getLiveNationalTeams(),
    getTeamName: sd.getTeamName,
    getLeagueName: (id) =>
      getLeagueDisplayName({ id, name: sd.getLeagueName(id) }),
    getMembership: ntMod.getMembershipForPlayer,
  };
  return bundledContext;
}

export default function UniversalSearch({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const pathnameRef = useRef(location.pathname);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebouncedValue(query, 200);

  const { index, status: indexStatus } = useSearchIndex();
  const [fallbackCtx, setFallbackCtx] = useState(null);

  // If index failed, load bundled sampleData as fallback.
  useEffect(() => {
    if (indexStatus === 'error' && !fallbackCtx) {
      loadBundledContext().then(setFallbackCtx);
    }
  }, [indexStatus, fallbackCtx]);

  const searchCtx = useMemo(() => {
    if (index) return buildSearchContextFromIndex(index);
    if (fallbackCtx) return fallbackCtx;
    return null;
  }, [index, fallbackCtx]);

  const { groups, flatResults } = useMemo(() => {
    if (!open || !debouncedQuery.trim() || !searchCtx) {
      return { groups: [], flatResults: [] };
    }
    return searchUniversalGrouped(debouncedQuery, searchCtx);
  }, [debouncedQuery, open, searchCtx]);

  const showResults = query.trim().length > 0;
  const isSearchPending = query.trim() !== debouncedQuery.trim();
  const hasResults = flatResults.length > 0;
  const isIndexLoading = indexStatus === 'loading' && !fallbackCtx;

  const closeSearch = useCallback(() => {
    setQuery('');
    setActiveIndex(-1);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      pathnameRef.current = location.pathname;
      return undefined;
    }

    if (pathnameRef.current !== location.pathname) {
      closeSearch();
      return undefined;
    }

    pathnameRef.current = location.pathname;
    return undefined;
  }, [open, location.pathname, closeSearch]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, closeSearch, showResults, flatResults.length]);

  const selectResult = (result) => {
    closeSearch();
    navigate(result.path);
  };

  const handleInputKeyDown = (event) => {
    if (!showResults || flatResults.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((idx) => (idx + 1) % flatResults.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((idx) => (idx <= 0 ? flatResults.length - 1 : idx - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const idx =
        activeIndex >= 0 && activeIndex < flatResults.length ? activeIndex : 0;
      selectResult(flatResults[idx]);
    }
  };

  if (!open) return null;

  return (
    <div className="universal-search" role="presentation">
      <button
        type="button"
        className="universal-search__backdrop"
        aria-label="Close search"
        tabIndex={-1}
        onClick={closeSearch}
      />
      <div
        ref={panelRef}
        className="universal-search__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${inputId}-label`}
      >
        <div className="universal-search__header">
          <label id={`${inputId}-label`} className="universal-search__label" htmlFor={inputId}>
            Search FootyBrain
          </label>
          <button type="button" className="universal-search__close" onClick={closeSearch}>
            Close
          </button>
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="search"
          className="universal-search__input"
          placeholder="Players, clubs, leagues, national teams…"
          value={query}
          role="combobox"
          aria-expanded={showResults && hasResults}
          aria-controls={showResults ? listId : undefined}
          aria-autocomplete="list"
          aria-busy={isSearchPending || isIndexLoading}
          aria-activedescendant={
            showResults && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
          }
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleInputKeyDown}
        />

        <p className="universal-search__hint">
          Nicknames work too — KDB, Vini, Son, Puli · fuzzy spelling OK
        </p>

        {!showResults && (
          <div className="universal-search__idle">
            <RecentlyViewedPanel
              onNavigate={closeSearch}
              className="universal-search__recent"
            />
            <div className="universal-search__popular" aria-label="Popular searches">
              <p className="universal-search__popular-label">Popular searches</p>
              <ul className="universal-search__popular-list">
                {POPULAR_SEARCHES.map((item) => (
                  <li key={item.query}>
                    <button
                      type="button"
                      className="universal-search__popular-chip"
                      onClick={() => {
                        setQuery(item.query);
                        setActiveIndex(-1);
                        inputRef.current?.focus();
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <p className="universal-search__empty universal-search__empty--idle">
              {SEARCH_EMPTY_HINT}
            </p>
            <p className="universal-search__examples">
              Try{' '}
              {SEARCH_EMPTY_EXAMPLES.map((example, index) => (
                <span key={example}>
                  {index > 0 ? (index === SEARCH_EMPTY_EXAMPLES.length - 1 ? ' or ' : ', ') : ''}
                  <button
                    type="button"
                    className="universal-search__example-link"
                    onClick={() => {
                      setQuery(example);
                      setActiveIndex(-1);
                      inputRef.current?.focus();
                    }}
                  >
                    {example}
                  </button>
                </span>
              ))}
            </p>
          </div>
        )}

        {showResults && (isSearchPending || isIndexLoading) && (
          <div className="universal-search__pending-block" aria-live="polite" aria-busy="true">
            <div className="universal-search__pending-skeleton" aria-hidden="true">
              <div className="skeleton skeleton--bar" />
              <div className="skeleton skeleton--bar skeleton--short" />
              <div className="skeleton skeleton--row" />
              <div className="skeleton skeleton--row" />
            </div>
            <p className="universal-search__pending">
              {isIndexLoading ? 'Loading search index…' : 'Searching…'}
            </p>
          </div>
        )}

        {showResults && !isSearchPending && !isIndexLoading && !hasResults && (
          <div className="universal-search__no-results">
            <p className="universal-search__empty">No matches for &ldquo;{query.trim()}&rdquo;</p>
            <p className="universal-search__examples">
              {SEARCH_EMPTY_HINT} Try{' '}
              {SEARCH_EMPTY_EXAMPLES.slice(0, 4).map((example, index) => (
                <span key={example}>
                  {index > 0 ? ', ' : ''}
                  <button
                    type="button"
                    className="universal-search__example-link"
                    onClick={() => {
                      setQuery(example);
                      setActiveIndex(-1);
                    }}
                  >
                    {example}
                  </button>
                </span>
              ))}
              .
            </p>
          </div>
        )}

        {showResults && !isSearchPending && !isIndexLoading && hasResults && (
          <ul className="universal-search__results" id={listId} role="listbox">
            {groups.map((group) => (
              <li key={group.type} className="universal-search__group" role="presentation">
                <p className="universal-search__group-label" id={`${listId}-group-${group.type}`}>
                  {group.label}
                </p>
                <ul className="universal-search__group-list" role="presentation">
                  {group.results.map((result) => {
                    const idx = result.flatIndex;
                    return (
                      <li key={`${result.type}-${result.id}`} role="presentation">
                        <button
                          type="button"
                          id={`${listId}-opt-${idx}`}
                          role="option"
                          aria-selected={idx === activeIndex}
                          className={`universal-search__option${
                            idx === activeIndex ? ' universal-search__option--active' : ''
                          }`}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectResult(result)}
                        >
                          <span
                            className={`universal-search__type universal-search__type--${result.type}`}
                          >
                            {RESULT_TYPE_LABELS[result.type]}
                          </span>
                          <span className="universal-search__visual">
                            {result.type === 'player' && (
                              <PlayerVisual
                                player={result.player}
                                size="thumb"
                                teamName={result.player._teamName}
                              />
                            )}
                            {result.type === 'team' && (
                              <TeamBadge team={result.team} size="thumb" />
                            )}
                            {result.type === 'league' && (
                              <LeagueBadge league={result.league} size="thumb" />
                            )}
                            {result.type === 'national-team' && (
                              <NationalTeamBadge nationalTeam={result.nationalTeam} size="thumb" />
                            )}
                            {result.type === 'collection' && (
                              <span className="universal-search__collection-icon" aria-hidden="true">
                                📚
                              </span>
                            )}
                            {result.type === 'page' && (
                              <span className="universal-search__page-icon" aria-hidden="true">
                                ↗
                              </span>
                            )}
                          </span>
                          <span className="universal-search__meta">
                            <strong>{result.name}</strong>
                            <span>{result.subtitle}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
