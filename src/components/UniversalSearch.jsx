import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLiveNationalTeams } from '../data/nationalTeamData';
import {
  getLeagueName,
  getTeamName,
  leagues,
  players,
  teams,
} from '../data/sampleData';
import { RESULT_TYPE_LABELS, searchUniversalGrouped } from '../utils/universalSearch';
import LeagueBadge from './LeagueBadge';
import NationalTeamBadge from './NationalTeamBadge';
import PlayerVisual from './PlayerVisual';
import RecentlyViewedPanel from './RecentlyViewedPanel';
import TeamBadge from './TeamBadge';

const liveNationalTeams = getLiveNationalTeams();

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

  const { groups, flatResults } = useMemo(() => {
    if (!open || !debouncedQuery.trim()) {
      return { groups: [], flatResults: [] };
    }
    return searchUniversalGrouped(debouncedQuery, {
      players,
      teams,
      leagues,
      nationalTeams: liveNationalTeams,
      getTeamName,
      getLeagueName,
    });
  }, [debouncedQuery, open]);

  const showResults = query.trim().length > 0;
  const isSearchPending = query.trim() !== debouncedQuery.trim();
  const hasResults = flatResults.length > 0;

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
      setActiveIndex((index) => (index + 1) % flatResults.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? flatResults.length - 1 : index - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const index =
        activeIndex >= 0 && activeIndex < flatResults.length ? activeIndex : 0;
      selectResult(flatResults[index]);
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
          aria-busy={isSearchPending}
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
          Partial names work · e.g. saka, brazil, premier league
        </p>

        {!showResults && (
          <>
            <RecentlyViewedPanel
              onNavigate={closeSearch}
              className="universal-search__recent"
            />
            <p className="universal-search__empty">
              Search players, clubs, leagues, or national teams.
            </p>
          </>
        )}

        {showResults && isSearchPending && (
          <p className="universal-search__pending" aria-live="polite">
            Searching…
          </p>
        )}

        {showResults && !isSearchPending && !hasResults && (
          <p className="universal-search__empty">No matches — try another spelling.</p>
        )}

        {showResults && !isSearchPending && hasResults && (
          <ul className="universal-search__results" id={listId} role="listbox">
            {groups.map((group) => (
              <li key={group.type} className="universal-search__group" role="presentation">
                <p className="universal-search__group-label" id={`${listId}-group-${group.type}`}>
                  {group.label}
                </p>
                <ul className="universal-search__group-list" role="presentation">
                  {group.results.map((result) => {
                    const index = result.flatIndex;
                    return (
                      <li key={`${result.type}-${result.id}`} role="presentation">
                        <button
                          type="button"
                          id={`${listId}-opt-${index}`}
                          role="option"
                          aria-selected={index === activeIndex}
                          className={`universal-search__option${
                            index === activeIndex ? ' universal-search__option--active' : ''
                          }`}
                          onMouseEnter={() => setActiveIndex(index)}
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
                              <PlayerVisual player={result.player} size="thumb" />
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
