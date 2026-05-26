import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ACHIEVEMENTS,
  getLevelTitle,
  groupAchievementsByCategory,
} from '../data/achievements';
import {
  COLLECTION_MASTERY_TARGET,
  LEAGUE_MASTERY_TARGET,
} from '../utils/progressionAchievements';
import { useProgression } from '../hooks/useProgression';

function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

function XpBar({ xpIntoLevel, xpForNextLevel }) {
  const progress = pct(xpIntoLevel, xpForNextLevel);
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
    <li
      className={`achievement-item${earned ? ' achievement-item--earned' : ' achievement-item--locked'}`}
    >
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
    quizSessionsCompleted,
    compareCount,
    collectionsCompleted,
    earnedAchievements,
    reset,
  } = progression;

  const accuracy = pct(totalCorrect, totalAnswered);
  const levelTitle = getLevelTitle(level);
  const earnedSet = new Set(earnedAchievements);
  const achievementGroups = groupAchievementsByCategory();

  const handleReset = () => {
    reset();
    setShowReset(false);
  };

  return (
    <div className="page progress-page">
      <Link to="/" className="back-link">
        ← Back to home
      </Link>

      <section
        aria-labelledby="profile-stats-title"
        className="progress-section progress-section--stats"
      >
        <div className="progress-profile-heading">
          <p className="progress-hero__eyebrow">Your profile</p>
          <h1 id="profile-stats-title" className="progress-hero__title">
            Learning progress
          </h1>
          <p className="progress-hero__xp-text">
            {levelTitle} · {xpIntoLevel}{' '}
            <span>
              / {xpForNextLevel} XP to level {level + 1}
            </span>
          </p>
          <XpBar xpIntoLevel={xpIntoLevel} xpForNextLevel={xpForNextLevel} />
        </div>
        <div className="progress-stats">
          <StatCard label="Level" value={level} />
          <StatCard label="Total XP" value={xp} />
          <StatCard label="Best streak" value={bestStreak} />
          <StatCard label="Accuracy" value={totalAnswered > 0 ? `${accuracy}%` : '—'} />
        </div>
      </section>

      <section className="progress-paths" aria-label="Learning paths">
        <h2 className="section-label">Learning paths</h2>
        <ul className="progress-paths__list">
          <li>
            <span className="progress-paths__label">Quiz sessions</span>
            <strong>{quizSessionsCompleted}</strong>
            <span className="progress-paths__meta">5+ question milestones</span>
          </li>
          <li>
            <span className="progress-paths__label">Club mastery</span>
            <strong>
              {completedTeamQuizzes.length}
            </strong>
            <span className="progress-paths__meta">clubs with quiz sessions</span>
          </li>
          <li>
            <span className="progress-paths__label">League mastery</span>
            <strong>
              {completedLeagueQuizzes.length}/{LEAGUE_MASTERY_TARGET}
            </strong>
            <span className="progress-paths__meta">leagues explored</span>
          </li>
          <li>
            <span className="progress-paths__label">Collections</span>
            <strong>
              {collectionsCompleted}/{COLLECTION_MASTERY_TARGET}
            </strong>
            <span className="progress-paths__meta">paths completed</span>
          </li>
          <li>
            <span className="progress-paths__label">Compare</span>
            <strong>{compareCount}</strong>
            <span className="progress-paths__meta">comparisons run</span>
          </li>
        </ul>
      </section>

      <section aria-label="Achievements" className="progress-achievements">
        <h2 className="section-label">
          Achievements
          <span className="section-label__count">
            {earnedAchievements.length} / {ACHIEVEMENTS.length}
          </span>
        </h2>
        {achievementGroups.map((group) => {
          const earnedInGroup = group.achievements.filter((a) => earnedSet.has(a.id)).length;
          return (
            <div key={group.id} className="progress-achievement-group">
              <h3 className="progress-achievement-group__title">
                {group.label}
                <span className="progress-achievement-group__count">
                  {earnedInGroup}/{group.achievements.length}
                </span>
              </h3>
              <ul className="achievement-list">
                {group.achievements.map((achievement) => (
                  <AchievementItem
                    key={achievement.id}
                    achievement={achievement}
                    earned={earnedSet.has(achievement.id)}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <details className="progress-reset">
        <summary>Reset progress</summary>
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
            <p>
              This will erase all XP, levels, achievements, and quiz history. Are you sure?
            </p>
            <div className="progress-reset__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setShowReset(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn btn--danger" onClick={handleReset}>
                Yes, reset everything
              </button>
            </div>
          </div>
        )}
      </details>
    </div>
  );
}
