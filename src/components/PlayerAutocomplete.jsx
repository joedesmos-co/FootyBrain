import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getLeagueName, getTeamName } from '../data/sampleData';
import { formatPosition } from '../utils/footballDisplay';
import { searchPlayers } from '../utils/playerSearch';
import { buildAmbiguousLastNames, normalizeAnswer } from '../utils/quizSession';
import PlayerVisual from './PlayerVisual';

export default function PlayerAutocomplete({
  players,
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
}) {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedValue = useDebouncedValue(value, 150);
  const isSuggestPending = value.trim() !== debouncedValue.trim() && value.trim().length > 0;

  const suggestions = useMemo(
    () =>
      searchPlayers(players, debouncedValue, {
        limit: maxResults,
        excludeIds,
        getTeamName,
        getLeagueName,
        intentContext,
      }),
    [players, debouncedValue, maxResults, excludeIds, intentContext],
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
    () => (showClubWhenAmbiguous ? buildAmbiguousLastNames(players) : new Set()),
    [players, showClubWhenAmbiguous],
  );

  const showList =
    open &&
    !disabled &&
    value.trim().length > 0 &&
    (suggestions.length > 0 || isSuggestPending);

  useEffect(() => {
    if (!showList) return undefined;

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showList]);

  const selectPlayer = (player) => {
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

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!showList) {
      if (event.key === 'ArrowDown' && value.trim()) setOpen(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
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
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (value.trim()) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
      </label>

      {showList && (
        <ul className="player-autocomplete__list" id={listId} role="listbox">
          {suggestions.map((player, index) => {
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
