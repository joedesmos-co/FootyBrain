import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatPosition } from '../utils/footballDisplay';
import { recordPlayerSearchQuery } from '../utils/playerSearchHistory.js';
import { searchPlayers } from '../utils/playerSearch';
import { buildAutocompleteSuggestionChips, SEARCH_NO_RESULTS_HINT } from '../utils/searchSuggestions.js';
import { buildAmbiguousLastNames, normalizeAnswer } from '../utils/quizSession';
import PlayerVisual from './PlayerVisual';

export default function PlayerAutocomplete({
  players,
  searchPool,
  value,
  onChange,
  onSelect,
  placeholder = 'Search by player name…',
  label = 'Search',
  disabled = false,
  showNationalTeam = false,
  showClubWhenAmbiguous = false,
  excludeIds = [],
  maxResults = 8,
  navigateOnSelect = false,
  intentContext = null,
  poolStatus = 'ready',
  showSuggestionChips = true,
  getTeamName = () => 'Unknown',
  getLeagueName = () => 'Unknown',
}) {
  const lookupPool = searchPool ?? players;
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedValue = useDebouncedValue(value, 120);
  const trimmedValue = value.trim();
  const isSuggestPending = trimmedValue !== debouncedValue.trim() && trimmedValue.length > 0;
  const poolLoading = poolStatus === 'loading';

  const suggestionChips = useMemo(
    () => (showSuggestionChips ? buildAutocompleteSuggestionChips(lookupPool) : []),
    [lookupPool, showSuggestionChips],
  );

  const suggestions = useMemo(
    () =>
      searchPlayers(lookupPool, debouncedValue, {
        limit: maxResults,
        excludeIds,
        getTeamName,
        getLeagueName,
        intentContext,
      }),
    [lookupPool, debouncedValue, maxResults, excludeIds, intentContext, getTeamName, getLeagueName],
  );

  const ambiguousSuggestionNames = useMemo(() => {
    const counts = new Map();
    for (const player of suggestions) {
      counts.set(player.name, (counts.get(player.name) ?? 0) + 1);
    }
    return new Set(
      [...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name),
    );
  }, [suggestions]);

  const ambiguousLastNames = useMemo(
    () => (showClubWhenAmbiguous ? buildAmbiguousLastNames(lookupPool) : new Set()),
    [lookupPool, showClubWhenAmbiguous],
  );

  const showIdleChips =
    open && !disabled && !poolLoading && trimmedValue.length === 0 && suggestionChips.length > 0;

  const showResults =
    open &&
    !disabled &&
    trimmedValue.length > 0 &&
    (suggestions.length > 0 || isSuggestPending || (!isSuggestPending && !poolLoading));

  const showNoResults =
    showResults && !isSuggestPending && suggestions.length === 0 && trimmedValue.length > 0;

  const showDropdown = showIdleChips || showResults;

  const scrollActiveOptionIntoView = useCallback((index) => {
    if (index < 0 || !listRef.current) return;
    const option = listRef.current.querySelector(`#${listId}-option-${index}`);
    option?.scrollIntoView({ block: 'nearest' });
  }, [listId]);

  useEffect(() => {
    scrollActiveOptionIntoView(activeIndex);
  }, [activeIndex, scrollActiveOptionIntoView]);

  useEffect(() => {
    if (!showDropdown) return undefined;

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showDropdown]);

  const selectPlayer = (player) => {
    recordPlayerSearchQuery(player.name);
    if (navigateOnSelect) {
      navigate(`/player/${player.id}`);
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    onSelect?.(player);
    onChange(player.name);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const applyChipQuery = (query) => {
    onChange(query);
    setOpen(true);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === 'ArrowDown') {
      if (!showResults || suggestions.length === 0) {
        if (trimmedValue) setOpen(true);
        return;
      }
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return;
    }

    if (!showResults || suggestions.length === 0) return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(suggestions.length - 1);
      return;
    }

    if (event.key === 'Enter' && suggestions.length > 0) {
      event.preventDefault();
      const index = activeIndex >= 0 ? activeIndex : 0;
      selectPlayer(suggestions[index]);
    }
  };

  return (
    <div className="player-autocomplete filter-field filter-field--grow" ref={rootRef}>
      <label className="player-autocomplete__label">
        <span>{label}</span>
        <input
          ref={inputRef}
          id={`${listId}-input`}
          name="footybrainPlayerLookup"
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listId : undefined}
          aria-autocomplete="list"
          aria-busy={isSuggestPending || poolLoading || undefined}
          aria-activedescendant={
            showResults && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          placeholder={placeholder}
          value={value}
          disabled={disabled || poolLoading}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="search"
          enterKeyHint="search"
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </label>

      {poolLoading && (
        <p className="player-autocomplete__status" role="status">
          Loading players…
        </p>
      )}

      {showIdleChips && (
        <div className="player-autocomplete__panel" id={listId}>
          <p className="player-autocomplete__panel-title">Popular &amp; recent</p>
          <div className="player-autocomplete__chips" role="list">
            {suggestionChips.map((chip) => (
              <button
                key={`${chip.kind}-${chip.query}`}
                type="button"
                className="player-autocomplete__chip"
                role="listitem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyChipQuery(chip.query)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && (
        <ul
          className="player-autocomplete__list"
          id={showIdleChips ? undefined : listId}
          ref={listRef}
          role="listbox"
        >
          {isSuggestPending && (
            <li className="player-autocomplete__status" role="presentation">
              Searching…
            </li>
          )}

          {showNoResults && (
            <li className="player-autocomplete__empty" role="presentation">
              <p>No players match &ldquo;{trimmedValue}&rdquo;</p>
              <p className="player-autocomplete__empty-hint">{SEARCH_NO_RESULTS_HINT}</p>
              {suggestionChips.length > 0 && (
                <div className="player-autocomplete__chips player-autocomplete__chips--inline">
                  {suggestionChips.slice(0, 6).map((chip) => (
                    <button
                      key={`empty-${chip.query}`}
                      type="button"
                      className="player-autocomplete__chip"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyChipQuery(chip.query)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          )}

          {!isSuggestPending &&
            suggestions.map((player, index) => {
              const lastName = normalizeAnswer(player.name).split(' ').pop();
              const showAmbiguousLastName =
                showClubWhenAmbiguous && ambiguousLastNames.has(lastName);
              return (
                <li key={player.id} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`player-autocomplete__option${
                      index === activeIndex ? ' player-autocomplete__option--active' : ''
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectPlayer(player)}
                  >
                    <PlayerVisual player={player} size="thumb" />
                    <span className="player-autocomplete__meta">
                      <strong>{player.name}</strong>
                      <span>
                        {formatPosition(player.position)} · {getTeamName(player.teamId)}
                        {ambiguousSuggestionNames.has(player.name)
                          ? ` · ${getLeagueName(player.leagueId)}`
                          : ''}
                        {(showNationalTeam || showAmbiguousLastName) && player.nationalTeam
                          ? ` · ${player.nationalTeam}`
                          : ''}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
