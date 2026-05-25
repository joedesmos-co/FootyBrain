import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ACHIEVEMENTS, getLevelTitle } from '../data/achievements';
import { teams as allTeams, leagues as allLeagues } from '../data/sampleData';
import { useProgression } from '../hooks/useProgression';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function XpBar({ xpIntoLevel, xpForNextLevel }) {
  const progress = pct(xpIntoLevel, xpForNextLevel);
  // aria-hidden: the sibling text "N / M XP to level X" already conveys this
  // information to screen readers. A div without a role ignores aria-label anyway.
  return (
    <div className="progress-xp-bar" aria-hidden="true">
      <div className="progress-xp-bar__fill" style={{ width: `${progress}%` }} />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="progress-stat">
      <span className="progress-stat__value">{value}</span>
      <span className="progress-stat__label">{label}</span>
    </div>
  );
}

function AchievementItem({ achievement, earned }) {
  return (
    <li className={`achievement-item${earned ? ' achievement-item--earned' : ' achievement-item--locked'}`}>
      <span className="achievement-item__icon" aria-hidden="true">
        {earned ? achievement.icon : '🔒'}
      </span>
      <div className="achievement-item__body">
        <strong className="achievement-item__label">{achievement.label}</strong>
        <p className="achievement-item__desc">{achievement.description}</p>
      </div>
      {earned && <span className="achievement-item__earned-badge">Earned</span>}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ProgressPage() {
  const progression = useProgression();
  const [showReset, setShowReset] = useState(false);

  const {
    xp,
    level,
    xpIntoLevel,
    xpForNextLevel,
    totalAnswered,
    totalCorrect,
    bestStreak,
    completedTeamQuizzes,
    completedLeagueQuizzes,
    earnedAchievements,
    reset,
  } = progression;

  const accuracy = pct(totalCorrect, totalAnswered);
  const levelTitle = getLevelTitle(level);

  const completedTeamData = allTeams.filter((t) =>
    completedTeamQuizzes.includes(t.id),
  );
  const completedLeagueData = allLeagues.filter((l) =>
    completedLeagueQuizzes.includes(l.id),
  );

  const handleReset = () => {
    reset();
    setShowReset(false);
  };

  return (
    <div className="page progress-page">
      <Link to="/" className="back-link">← Back to home</Link>

      {/* ── Hero: level + XP bar ─────────────────────────────────────────── */}
      <header className="progress-hero">
        <div className="progress-hero__identity">
          {/* aria-hidden: h1 (level title) + XP text below already describe the level */}
          <div className="progress-level-badge" aria-hidden="true">
            <span className="progress-level-badge__number">{level}</span>
            <span className="progress-level-badge__label">LVL</span>
          </div>
          <div className="progress-hero__info">
            <p className="progress-hero__eyebrow">Your profile</p>
            <h1 className="progress-hero__title">{levelTitle}</h1>
            <p className="progress-hero__xp-text">
              {xpIntoLevel} <span>/ {xpForNextLevel} XP to level {level + 1}</span>
            </p>
            <XpBar xpIntoLevel={xpIntoLevel} xpForNextLevel={xpForNextLevel} />
          </div>
        </div>
        <Link to="/quiz" className="btn btn--primary">
          Go to Quiz
        </Link>
      </header>

      {/* ── Stats grid ───────────────────────────────────────────────────── */}
      <section aria-label="Your statistics">
        <h2 className="section-label">Stats</h2>
        <div className="progress-stats">
          <StatCard label="Total XP" value={xp} />
          <StatCard label="Questions" value={totalAnswered} />
          <StatCard label="Correct" value={totalCorrect} />
          <StatCard label="Accuracy" value={totalAnswered > 0 ? `${accuracy}%` : '—'} />
          <StatCard label="Best streak" value={bestStreak} />
          <StatCard label="Teams done" value={completedTeamQuizzes.length} />
          <StatCard label="Leagues done" value={completedLeagueQuizzes.length} />
        </div>
      </section>

      {/* ── Achievements ─────────────────────────────────────────────────── */}
      <section aria-label="Achievements" className="progress-achievements">
        <h2 className="section-label">
          Achievements
          <span className="section-label__count">
            {earnedAchievements.length} / {ACHIEVEMENTS.length}
          </span>
        </h2>
        <ul className="achievement-list">
          {ACHIEVEMENTS.map((achievement) => (
            <AchievementItem
              key={achievement.id}
              achievement={achievement}
              earned={earnedAchievements.includes(achievement.id)}
            />
          ))}
        </ul>
      </section>

      {/* ── Completed quizzes ─────────────────────────────────────────────── */}
      {(completedTeamData.length > 0 || completedLeagueData.length > 0) && (
        <section aria-label="Completed quiz sessions" className="progress-completed">
          <h2 className="section-label">Completed sessions</h2>

          {completedTeamData.length > 0 && (
            <div className="progress-completed__group">
              <h3 className="progress-completed__subtitle">Teams</h3>
              <ul className="progress-completed__list">
                {completedTeamData.map((team) => (
                  <li key={team.id}>
                    <Link to={`/team/${team.id}`} className="progress-completed__link">
                      {team.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {completedLeagueData.length > 0 && (
            <div className="progress-completed__group">
              <h3 className="progress-completed__subtitle">Leagues</h3>
              <ul className="progress-completed__list">
                {completedLeagueData.map((league) => (
                  <li key={league.id}>
                    <Link to={`/league/${league.id}`} className="progress-completed__link">
                      {league.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── Reset (dev) ──────────────────────────────────────────────────── */}
      <section className="progress-reset" aria-label="Reset progress">
        {!showReset ? (
          <button
            type="button"
            className="btn btn--secondary progress-reset__trigger"
            onClick={() => setShowReset(true)}
          >
            Reset all progress
          </button>
        ) : (
          <div className="progress-reset__confirm">
            <p>This will erase all XP, levels, achievements, and quiz history. Are you sure?</p>
            <div className="progress-reset__actions">
              <button type="button" className="btn btn--secondary" onClick={() => setShowReset(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn--danger" onClick={handleReset}>
                Yes, reset everything
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
