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

const EXPLORE_SHORTCUTS = [
  { to: '/learning-paths', label: 'Learning paths', hint: 'Curated study routes' },
  { to: '/collections', label: 'Collections', hint: 'Themed player lists' },
  { to: '/world-cup', label: 'World Cup 2026', hint: 'Nations & prep quiz' },
  { to: '/compare', label: 'Compare', hint: 'Players or clubs side by side' },
];

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
      <section className="home-explore-strip" aria-label="Quick explore">
        <ul className="home-explore-strip__grid">
          {EXPLORE_SHORTCUTS.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="home-explore-card">
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-league-strip" aria-labelledby="home-league-hubs-title">
        <h2 id="home-league-hubs-title" className="home-league-strip__title">
          League hubs
        </h2>
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
        <section className="home-personalize-cta" aria-label="Personalize FootyCompass">
          <div className="home-personalize-cta__body">
            <h2>Sharpen your picks</h2>
            <p>Favorite leagues and clubs — optional, no account needed.</p>
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

      <section className="home-tools" aria-labelledby="home-tools-title">
        <h2 id="home-tools-title" className="home-tools__title">
          More to explore
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
