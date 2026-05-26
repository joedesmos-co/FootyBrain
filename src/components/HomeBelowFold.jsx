import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getHomeFeatureCards } from '../data/onboardingGuide';
import { DATASET_META } from '../data/datasetMeta';
import { getHubLeagues } from '../data/leagueManifest';
import {
  formatCountryLabel,
  getFootballAccentStyle,
  getLeagueAccentStyle,
} from '../utils/footballDisplay';
import { usePreferences } from '../hooks/usePreferences';
import LeagueBadge from './LeagueBadge';

const PERSONALIZE_DISMISS_KEY = 'footybrain:personalize-cta-dismissed';

function readPersonalizeDismissed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(PERSONALIZE_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function persistPersonalizeDismissed() {
  try {
    window.localStorage.setItem(PERSONALIZE_DISMISS_KEY, '1');
  } catch {
    // ignore
  }
}

export default function HomeBelowFold() {
  const { hasPreferences } = usePreferences();
  const [personalizeDismissed, setPersonalizeDismissed] = useState(() =>
    readPersonalizeDismissed(),
  );

  const features = getHomeFeatureCards({
    players: DATASET_META.playerCount,
    teams: DATASET_META.teamCount,
    leagues: DATASET_META.leagueCount,
  });

  const showPersonalizeCta = !hasPreferences && !personalizeDismissed;

  const handleDismissPersonalize = () => {
    persistPersonalizeDismissed();
    setPersonalizeDismissed(true);
  };

  return (
    <>
      <section className="home-league-strip" aria-labelledby="home-league-hubs-title">
        <h2 id="home-league-hubs-title" className="home-league-strip__title">
          League hubs
        </h2>
        <p className="home-league-strip__intro">
          Full league pages with clubs, spotlights, and quizzes where editorial coverage exists.
        </p>
        <div className="league-link-grid home-league-strip__grid">
          {getHubLeagues().map((league) => {
            const accentStyle =
              getFootballAccentStyle(league) ?? getLeagueAccentStyle(league.id);
            return (
              <Link
                key={league.id}
                to={`/league/${league.id}`}
                className="league-link-card football-accent-chip"
                style={accentStyle}
              >
                <LeagueBadge league={league} size="thumb" />
                <span>
                  <strong>{league.name}</strong>
                  <small>{formatCountryLabel(league.hubSubline)}</small>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {showPersonalizeCta && (
        <section className="home-personalize-cta" aria-label="Personalize FootyBrain">
          <div className="home-personalize-cta__body">
            <h2>Optional: personalize picks</h2>
            <p>
              Choose favorite leagues and clubs for sharper recommendations. Skip anytime—FootyBrain
              works without it.
            </p>
            <div className="home-personalize-cta__actions">
              <Link to="/onboarding" className="btn btn--primary">
                Set preferences
              </Link>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleDismissPersonalize}
              >
                Not now
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="feature-grid" aria-label="Explore FootyBrain">
        {features.map((feature) => (
          <Link key={feature.to} to={feature.to} className="feature-card">
            <span className="feature-card__label">{feature.label}</span>
            <div className="feature-card__topline">
              <h2 className="feature-card__title">{feature.title}</h2>
              <span>{feature.stat}</span>
            </div>
            <p className="feature-card__text">{feature.description}</p>
            <span className="feature-card__cta">Open</span>
          </Link>
        ))}
      </section>
    </>
  );
}
