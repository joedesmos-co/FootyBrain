import { useState } from 'react';
import { KNOWLEDGE_LEVELS, LEARNING_GOALS } from '../data/preferencesOptions';
import { leagues, teams } from '../data/sampleData';

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

export default function PreferencesForm({
  initial,
  onSave,
  onSkip,
  submitLabel = 'Save preferences',
  showSkip = true,
}) {
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

  return (
    <form className="prefs-form" onSubmit={handleSubmit}>
      <ChipGroup label="Favorite leagues" hint="Optional — pick leagues for sharper homepage suggestions.">
        {leagues.map((league) => (
          <ToggleChip
            key={league.id}
            id={league.id}
            label={league.name}
            pressed={favoriteLeagueIds.includes(league.id)}
            onToggle={(id) => toggleId(favoriteLeagueIds, setFavoriteLeagueIds, id)}
          />
        ))}
      </ChipGroup>

      <ChipGroup label="Favorite clubs" hint="Optional — clubs you want to learn first.">
        {teams.map((team) => (
          <ToggleChip
            key={team.id}
            id={team.id}
            label={team.name}
            pressed={favoriteClubIds.includes(team.id)}
            onToggle={(id) => toggleId(favoriteClubIds, setFavoriteClubIds, id)}
          />
        ))}
      </ChipGroup>

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

      <ChipGroup label="Learning goals" hint="Optional — what should FootyBrain emphasize?">
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
