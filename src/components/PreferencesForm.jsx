import { useState } from 'react';
import { KNOWLEDGE_LEVELS, LEARNING_GOALS } from '../data/preferencesOptions';
import { getManifestLeagues } from '../data/contentManifest';
import { useSearchIndex } from '../hooks/useSearchIndex';
import { getRecentViews } from '../utils/recentlyViewed';
import LeagueBadge from './LeagueBadge';
import TeamBadge from './TeamBadge';

const leagues = getManifestLeagues();
const BIG_FIVE_LEAGUE_IDS = ['premier-league', 'la-liga', 'bundesliga', 'serie-a', 'ligue-1'];

function ChipGroup({ label, hint, children }) {
  return (
    <fieldset className="prefs-field">
      <legend className="prefs-field__legend">{label}</legend>
      {hint && <p className="prefs-field__hint">{hint}</p>}
      <div className="prefs-chips">{children}</div>
    </fieldset>
  );
}

function ToggleChip({ id, label, pressed, onToggle }) {
  return (
    <button
      type="button"
      className={`prefs-chip${pressed ? ' prefs-chip--on' : ''}`}
      aria-pressed={pressed}
      onClick={() => onToggle(id)}
    >
      {label}
    </button>
  );
}

function ToggleTile({ id, label, pressed, onToggle, icon }) {
  return (
    <button
      type="button"
      className={`prefs-tile${pressed ? ' prefs-tile--on' : ''}`}
      aria-pressed={pressed}
      onClick={() => onToggle(id)}
    >
      {icon ? <span className="prefs-tile__icon" aria-hidden="true">{icon}</span> : null}
      <span className="prefs-tile__label">{label}</span>
    </button>
  );
}

function groupTeamsByLeague(teams) {
  const map = new Map();
  for (const team of teams) {
    if (!team?.leagueId) continue;
    const list = map.get(team.leagueId) ?? [];
    list.push(team);
    map.set(team.leagueId, list);
  }
  for (const [leagueId, list] of map.entries()) {
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    map.set(leagueId, list);
  }
  return map;
}

function getRecentTeamIds() {
  try {
    return getRecentViews()
      .filter((row) => row?.type === 'team' && row?.id)
      .map((row) => row.id);
  } catch {
    return [];
  }
}

export default function PreferencesForm({
  initial,
  onSave,
  onSkip,
  submitLabel = 'Save preferences',
  showSkip = true,
}) {
  const { index, status: indexStatus } = useSearchIndex();
  const [favoriteLeagueIds, setFavoriteLeagueIds] = useState(
    () => initial?.favoriteLeagueIds ?? [],
  );
  const [favoriteClubIds, setFavoriteClubIds] = useState(
    () => initial?.favoriteClubIds ?? [],
  );
  const [knowledgeLevel, setKnowledgeLevel] = useState(
    () => initial?.knowledgeLevel ?? null,
  );
  const [learningGoals, setLearningGoals] = useState(
    () => initial?.learningGoals ?? [],
  );
  const [clubSearch, setClubSearch] = useState('');
  const [allClubsSearch, setAllClubsSearch] = useState('');

  const toggleId = (list, setList, id) => {
    setList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      favoriteLeagueIds,
      favoriteClubIds,
      knowledgeLevel,
      learningGoals,
    });
  };

  const leagueById = useState(() => new Map(leagues.map((l) => [l.id, l])))[0];
  const bigFive = BIG_FIVE_LEAGUE_IDS.map((id) => leagueById.get(id)).filter(Boolean);
  const otherLeagues = leagues.filter((l) => !BIG_FIVE_LEAGUE_IDS.includes(l.id) && l.id !== 'external');
  const internationalLeague = leagueById.get('external') ?? null;

  const allTeams = indexStatus === 'ready' ? index.teams : [];
  const teamById = useState(() => new Map())[0];
  if (teamById.size === 0 && allTeams?.length) {
    for (const t of allTeams) teamById.set(t.id, t);
  }

  const recentTeamIds = getRecentTeamIds();
  const recentTeams = recentTeamIds.map((id) => teamById.get(id)).filter(Boolean).slice(0, 8);

  const suggestedLeagueIds =
    favoriteLeagueIds.length > 0 ? favoriteLeagueIds : BIG_FIVE_LEAGUE_IDS;

  const suggestedTeams = allTeams
    .filter((t) => suggestedLeagueIds.includes(t.leagueId))
    .filter((t) => t.name && t.country)
    .filter((t) => {
      if (!clubSearch.trim()) return true;
      return String(t.name).toLowerCase().includes(clubSearch.trim().toLowerCase());
    })
    .slice(0, 14);

  const browseAllTeamsFiltered = allTeams.filter((t) => {
    const q = allClubsSearch.trim().toLowerCase();
    if (!q) return true;
    return String(t.name).toLowerCase().includes(q);
  });
  const teamsByLeague = groupTeamsByLeague(browseAllTeamsFiltered);

  return (
    <form className="prefs-form" onSubmit={handleSubmit}>
      <p className="prefs-lead">
        Customize FootyCompass to get smarter quizzes, recommendations, and daily picks.
      </p>

      <details className="prefs-section" open>
        <summary className="prefs-section__summary">
          <span>
            <strong>Leagues</strong>
            <small>Personalize your recommendations and quizzes.</small>
          </span>
        </summary>

        <div className="prefs-tiles">
          {bigFive.map((league) => (
            <ToggleTile
              key={league.id}
              id={league.id}
              label={league.name}
              pressed={favoriteLeagueIds.includes(league.id)}
              onToggle={(id) => toggleId(favoriteLeagueIds, setFavoriteLeagueIds, id)}
              icon={<LeagueBadge league={league} size="thumb" />}
            />
          ))}
        </div>

        <details className="prefs-subsection">
          <summary className="prefs-subsection__summary">More leagues</summary>
          <div className="prefs-tiles prefs-tiles--compact">
            {otherLeagues.map((league) => (
              <ToggleTile
                key={league.id}
                id={league.id}
                label={league.name}
                pressed={favoriteLeagueIds.includes(league.id)}
                onToggle={(id) => toggleId(favoriteLeagueIds, setFavoriteLeagueIds, id)}
                icon={<LeagueBadge league={league} size="thumb" />}
              />
            ))}
          </div>
        </details>

        {internationalLeague ? (
          <details className="prefs-subsection">
            <summary className="prefs-subsection__summary">Other clubs</summary>
            <div className="prefs-tiles prefs-tiles--compact">
              <ToggleTile
                id={internationalLeague.id}
                label={internationalLeague.name}
                pressed={favoriteLeagueIds.includes(internationalLeague.id)}
                onToggle={(id) => toggleId(favoriteLeagueIds, setFavoriteLeagueIds, id)}
                icon={<LeagueBadge league={internationalLeague} size="thumb" />}
              />
            </div>
          </details>
        ) : null}
      </details>

      <details className="prefs-section" open>
        <summary className="prefs-section__summary">
          <span>
            <strong>Clubs</strong>
            <small>Personalize your recommendations and quizzes.</small>
          </span>
        </summary>

        <div className="prefs-search">
          <label className="prefs-search__label">
            <span>Search clubs</span>
            <input
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              placeholder="Search clubs…"
              inputMode="search"
              autoComplete="off"
            />
          </label>
        </div>

        {recentTeams.length > 0 ? (
          <section className="prefs-club-block" aria-label="Recently viewed clubs">
            <h3 className="prefs-block-title">Recently viewed</h3>
            <div className="prefs-club-grid">
              {recentTeams.map((team) => (
                <ToggleTile
                  key={team.id}
                  id={team.id}
                  label={team.name}
                  pressed={favoriteClubIds.includes(team.id)}
                  onToggle={(id) => toggleId(favoriteClubIds, setFavoriteClubIds, id)}
                  icon={<TeamBadge team={team} size="thumb" />}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="prefs-club-block" aria-label="Suggested clubs">
          <h3 className="prefs-block-title">Top clubs to start</h3>
          <div className="prefs-club-grid">
            {suggestedTeams.map((team) => (
              <ToggleTile
                key={team.id}
                id={team.id}
                label={team.name}
                pressed={favoriteClubIds.includes(team.id)}
                onToggle={(id) => toggleId(favoriteClubIds, setFavoriteClubIds, id)}
                icon={<TeamBadge team={team} size="thumb" />}
              />
            ))}
          </div>
        </section>

        <details className="prefs-subsection">
          <summary className="prefs-subsection__summary">Browse all clubs</summary>

          <div className="prefs-search prefs-search--tight">
            <label className="prefs-search__label">
              <span>Search all clubs</span>
              <input
                value={allClubsSearch}
                onChange={(e) => setAllClubsSearch(e.target.value)}
                placeholder="Search clubs…"
                inputMode="search"
                autoComplete="off"
              />
            </label>
          </div>

          <div className="prefs-league-groups">
            {leagues.map((league) => {
              const teams = teamsByLeague.get(league.id) ?? [];
              if (teams.length === 0) return null;
              return (
                <section key={league.id} className="prefs-league-group" aria-label={league.name}>
                  <div className="prefs-league-group__heading">
                    <LeagueBadge league={league} size="thumb" />
                    <div>
                      <strong>{league.name}</strong>
                      <span>{league.country}</span>
                    </div>
                  </div>
                  <div className="prefs-club-grid prefs-club-grid--compact">
                    {teams.map((team) => (
                      <ToggleChip
                        key={team.id}
                        id={team.id}
                        label={team.name}
                        pressed={favoriteClubIds.includes(team.id)}
                        onToggle={(id) => toggleId(favoriteClubIds, setFavoriteClubIds, id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </details>
      </details>

      <fieldset className="prefs-field">
        <legend className="prefs-field__legend">Knowledge level</legend>
        <div className="prefs-levels">
          {KNOWLEDGE_LEVELS.map((level) => (
            <label
              key={level.id}
              className={`prefs-level${knowledgeLevel === level.id ? ' prefs-level--on' : ''}`}
            >
              <input
                type="radio"
                name="knowledgeLevel"
                value={level.id}
                checked={knowledgeLevel === level.id}
                onChange={() => setKnowledgeLevel(level.id)}
              />
              <span className="prefs-level__title">{level.label}</span>
              <span className="prefs-level__hint">{level.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <ChipGroup label="Learning goals" hint="Optional — what should FootyCompass emphasize?">
        {LEARNING_GOALS.map((goal) => (
          <ToggleChip
            key={goal.id}
            id={goal.id}
            label={goal.label}
            pressed={learningGoals.includes(goal.id)}
            onToggle={(id) => toggleId(learningGoals, setLearningGoals, id)}
          />
        ))}
      </ChipGroup>

      <details className="prefs-section prefs-section--future">
        <summary className="prefs-section__summary">
          <span>
            <strong>Quiz settings</strong>
            <small className="ui-badge ui-badge--soon">Soon</small>
          </span>
        </summary>
        <p className="prefs-future-note">
          More options—difficulty presets, timers, and quiz styles—will land here later.
        </p>
      </details>

      <details className="prefs-section prefs-section--future">
        <summary className="prefs-section__summary">
          <span>
            <strong>Appearance</strong>
            <small className="ui-badge ui-badge--soon">Soon</small>
          </span>
        </summary>
        <p className="prefs-future-note">Future options like themes and display density will live here.</p>
      </details>

      <div className="prefs-form__actions">
        <button type="submit" className="btn btn--primary btn--large">
          {submitLabel}
        </button>
        {showSkip && onSkip && (
          <button type="button" className="btn btn--secondary" onClick={onSkip}>
            Skip for now
          </button>
        )}
      </div>
    </form>
  );
}
