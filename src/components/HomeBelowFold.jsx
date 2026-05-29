import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getHomeFeatureCards } from '../data/onboardingGuide';
import { DATASET_META } from '../data/datasetMeta';
import { usePreferences } from '../hooks/usePreferences';

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
      <section className="home-return-cta" aria-label="Return visits">
        <div className="home-return-cta__copy home-section-head">
          <h2 className="home-return-cta__title">Build a daily habit</h2>
          <p>
            Five fresh football questions each day — streak XP and study cards for misses. Come back
            tomorrow without an account.
          </p>
        </div>
        <div className="home-return-cta__actions">
          <Link to="/daily" className="btn btn--primary btn--large">
            Play today&apos;s daily
          </Link>
          <Link to="/quiz" className="btn btn--secondary">
            Free-play player quiz
          </Link>
        </div>
      </section>

      {showPersonalizeCta ? (
        <section className="home-personalize-cta" aria-label="Personalize FootyCompass">
          <div className="home-personalize-cta__body">
            <h2>Sharpen your home feed</h2>
            <p>Favorite leagues and clubs for faster browse — optional, stored on your device only.</p>
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
      ) : null}

      <section className="home-tools" aria-labelledby="home-tools-title">
        <h2 id="home-tools-title" className="home-section-head home-tools__title">
          More football tools
        </h2>
        <div className="feature-grid home-tools__grid">
          {features.map((feature) => (
            <Link key={feature.to} to={feature.to} className="feature-card feature-card--compact">
              <span className="feature-card__label">{feature.label}</span>
              <div className="feature-card__topline">
                <h3 className="feature-card__title">{feature.title}</h3>
                <span>{feature.stat}</span>
              </div>
              <span className="feature-card__cta">Open →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
