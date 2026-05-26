import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeagueName } from '../data/sampleData';
import { searchTeams } from '../utils/teamSearch';
import TeamBadge from './TeamBadge';

export default function TeamAutocomplete({
  teams,
  value,
  onChange,
  onSelect,
  placeholder = 'Search by club name…',
  label = 'Search',
  disabled = false,
  excludeIds = [],
  maxResults = 8,
  navigateOnSelect = false,
}) {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(
    () =>
      searchTeams(teams, value, {
        limit: maxResults,
        excludeIds,
        getLeagueName,
      }),
    [teams, value, maxResults, excludeIds],
  );

  const showList = open && !disabled && value.trim().length > 0 && suggestions.length > 0;

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

  const selectTeam = (team) => {
    if (navigateOnSelect) {
      navigate(`/team/${team.id}`);
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    onSelect?.(team);
    onChange(team.name);
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
      selectTeam(suggestions[index]);
    }
  };

  return (
    <div className="team-autocomplete filter-field filter-field--grow" ref={rootRef}>
      <label className="team-autocomplete__label">
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
        <ul className="team-autocomplete__list" id={listId} role="listbox">
          {suggestions.map((team, index) => (
            <li key={team.id} role="presentation">
              <button
                type="button"
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`team-autocomplete__option${
                  index === activeIndex ? ' team-autocomplete__option--active' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectTeam(team)}
              >
                <TeamBadge team={team} size="thumb" />
                <span className="team-autocomplete__meta">
                  <strong>{team.name}</strong>
                  <span>
                    {getLeagueName(team.leagueId)} · {team.country}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
