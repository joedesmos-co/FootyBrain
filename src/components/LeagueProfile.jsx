import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLeagueShard } from '../hooks/useLeagueShard';
import { useRecordRecentView } from '../hooks/useRecordRecentView';
import { getQuizEligiblePlayers } from '../utils/quizEligibility';
import {
  getLeagueFeaturedTeams,
  getLeagueSpotlightPlayers,
  getLeagueTeamQuizCounts,
} from '../utils/leagueFeatured';
import {
  formatCountryLabel,
  formatPosition,
  getFootballAccentStyle,
  getLeagueDisplayName,
  isExternalLeagueId,
} from '../utils/footballDisplay';
import ExternalStubNotice from './ExternalStubNotice';
import {
  formatLeagueIdentityTags,
  truncateLeagueText,
} from '../utils/leagueIdentity';
import {
  IMPORTANCE_SCORE_LABEL,
  QUIZ_COMING_SOON,
  leagueMetaLine,
} from '../utils/consumerCopy';
import DataTrustNotice from './DataTrustNotice';
import LeagueBadge from './LeagueBadge';
import LeagueClubChip from './LeagueClubChip';
import LeagueHubStrip from './LeagueHubStrip';
import PageFallback from './PageFallback';
import PlayerVisual from './PlayerVisual';
import { peekTeamName } from '../data/teamStore';
import { getCanonicalUrl, upsertJsonLdScript } from '../utils/jsonLd';
import { setSeoMeta } from '../utils/seoMeta';
import BreadcrumbNav from './BreadcrumbNav';

const LEARNING_STEPS = [
  { label: 'Basics', title: 'League snapshot', field: 'description' },
  { label: 'Style', title: 'How they play', field: 'styleOfPlay' },
  { label: 'Clubs', title: 'Famous clubs', field: 'famousClubs' },
  { label: 'Rivalries', title: 'Derbies & feuds', field: 'rivalries' },
  { label: 'Quiz', title: 'Test yourself', field: null },
];

function stepText(league, step) {
  if (step.field === 'famousClubs') {
    return `Start with ${league.famousClubs.slice(0, 3).map((c) => c.split(' — ')[0]).join(', ')}.`;
  }
  if (step.field === 'rivalries') {
    return league.rivalries.length
      ? league.rivalries.slice(0, 2).join(' · ')
      : 'Follow title races and regional derbies.';
  }
  if (step.field === null) {
    return 'Practice names, clubs, and hints from this league.';
  }
  return truncateLeagueText(league[step.field], 140);
}

function LeagueProfileContent({ league, leagueTeams, leaguePlayers }) {
  useEffect(() => {
    const canonical = getCanonicalUrl();
    if (!canonical) return undefined;

    const homeUrl = canonical.replace(/\/league\/[^/]+$/, '/');
    const browseUrl = `${homeUrl.replace(/\/$/, '')}/browse`;

    setSeoMeta({
      title: `${getLeagueDisplayName(league)} · FootyBrain`,
      description: `${getLeagueDisplayName(league)} (${formatCountryLabel(league.country)}). ${leagueMetaLine({ clubs: leagueTeams.length, players: leaguePlayers.length, quizReady: getQuizEligiblePlayers(leaguePlayers).length })}.`,
      canonicalUrl: canonical,
      og: {
        title: `${getLeagueDisplayName(league)} · FootyBrain`,
        description: `${getLeagueDisplayName(league)} league profile: clubs, featured players, rivalry notes, and quizzes when available.`,
        url: canonical,
        type: 'website',
      },
      twitter: {
        title: `${getLeagueDisplayName(league)} · FootyBrain`,
        description: `${getLeagueDisplayName(league)} league profile: clubs, featured players, rivalry notes, and quizzes when available.`,
      },
    });

    upsertJsonLdScript('jsonld-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: 'Browse', item: browseUrl },
        { '@type': 'ListItem', position: 3, name: league.name, item: canonical },
      ],
    });

    return () => {
      upsertJsonLdScript('jsonld-breadcrumb', null);
    };
  }, [league, leagueTeams, leaguePlayers]);

  const quizReadyPlayers = getQuizEligiblePlayers(leaguePlayers);
  const hasLeagueQuiz = quizReadyPlayers.length > 0;
  const featuredClubs = getLeagueFeaturedTeams(league, leagueTeams, leaguePlayers, {
    limit: 6,
  });
  const allClubsWithQuiz = getLeagueTeamQuizCounts(leagueTeams, leaguePlayers).sort((a, b) =>
    a.team.name.localeCompare(b.team.name),
  );
  const keyPlayers = getLeagueSpotlightPlayers(league, leaguePlayers, { limit: 6 });
  const identityTags = formatLeagueIdentityTags(league.id);
  const leagueDescription = truncateLeagueText(league.description, 280);
  const playstyleLine = truncateLeagueText(league.styleOfPlay, 200);

  return (
    <div className="page league-profile">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Browse', to: '/browse' },
          { label: getLeagueDisplayName(league) },
        ]}
      />

      <header
        className="profile__hero profile__hero--league league-hero football-accent-surface"
        style={getFootballAccentStyle(league)}
      >
        <div className="profile__identity league-hero__identity">
          <LeagueBadge league={league} size="profile" />
          <div className="league-hero__copy">
            <p className="profile__league">{formatCountryLabel(league.country)}</p>
            <h1>{getLeagueDisplayName(league)}</h1>
            <p className="profile__sub league-hero__sub">
              {leagueMetaLine({
                clubs: leagueTeams.length,
                players: leaguePlayers.length,
                quizReady: quizReadyPlayers.length,
              })}
            </p>
          </div>
        </div>
        <div className="team-profile__actions">
          {hasLeagueQuiz ? (
            <Link to={`/quiz?league=${league.id}`} className="btn btn--primary">
              Start League Quiz
            </Link>
          ) : (
            <button type="button" className="btn btn--secondary" disabled>
              {QUIZ_COMING_SOON}
            </button>
          )}
          <a href="#league-clubs" className="btn btn--secondary">
            Browse clubs
          </a>
        </div>
      </header>

      <DataTrustNotice compact />

      {isExternalLeagueId(league.id) ? <ExternalStubNotice compact /> : null}

      <LeagueHubStrip
        league={league}
        clubCount={leagueTeams.length}
        quizReadyCount={quizReadyPlayers.length}
        playstyle={league.styleOfPlay}
        famousClubs={league.famousClubs}
      />

      <section
        className="league-identity-card football-accent-rail"
        style={getFootballAccentStyle(league)}
        aria-labelledby="league-identity-title"
      >
        <h2 id="league-identity-title">League identity</h2>
        {leagueDescription ? (
          <p className="league-identity-card__description">{leagueDescription}</p>
        ) : null}
        {playstyleLine && !leagueDescription ? (
          <p className="league-identity-card__description">{playstyleLine}</p>
        ) : playstyleLine && leagueDescription ? (
          <p className="league-identity-card__playstyle">
            <span className="league-identity-card__label">How they play</span>
            {playstyleLine}
          </p>
        ) : null}
        {identityTags.length > 0 && (
          <ul className="league-identity-card__tags" aria-label="League traits">
            {identityTags.map(({ key, label }) => (
              <li key={key}>
                <span className="player-identity-chip">{label}</span>
              </li>
            ))}
          </ul>
        )}
        {league.fanGuide ? (
          <p className="league-identity-card__fan-tip">
            <span className="league-identity-card__label">Fan tip</span>
            {truncateLeagueText(league.fanGuide, 180)}
          </p>
        ) : null}
      </section>

      {featuredClubs.length > 0 && (
        <section className="league-section" aria-labelledby="league-featured-title">
          <div className="league-section__header">
            <h2 id="league-featured-title">Featured clubs</h2>
            <p className="league-section__meta">
              Big names and strong quiz starting points in {league.name}.
            </p>
          </div>
          <div className="league-club-grid league-club-grid--featured">
            {featuredClubs.map(({ team, quizCount }) => (
              <LeagueClubChip key={team.id} team={team} quizCount={quizCount} featured />
            ))}
          </div>
        </section>
      )}

      {keyPlayers.length > 0 && (
        <section className="league-section" aria-labelledby="league-players-title">
          <div className="league-section__header">
            <h2 id="league-players-title">Featured players</h2>
            <p className="league-section__meta">
              Top {IMPORTANCE_SCORE_LABEL.toLowerCase()} in {league.name} right now.
            </p>
          </div>
          <ul className="league-spotlight-players">
            {keyPlayers.map((player) => (
              <li key={player.id}>
                <Link
                  to={`/player/${player.id}`}
                  className="league-spotlight-players__card"
                >
                  <PlayerVisual player={player} size="card" compact />
                  <span className="league-spotlight-players__text">
                    <strong>{player.name}</strong>
                    <span>
                      {peekTeamName(player.teamId) || 'Club'} ·{' '}
                      {formatPosition(player.position) || 'Player'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="league-discovery" aria-label="Rivalries and discovery">
        <div className="league-section__header">
          <h2>Derbies & discovery</h2>
          <p className="league-section__meta">
            Rivalries and names fans mention when this league comes up.
          </p>
        </div>
        <div className="league-discovery__grid">
          <article className="league-discovery__card">
            <h3>Rivalries</h3>
            {league.rivalries.length > 0 ? (
              <ul className="league-discovery__list">
                {league.rivalries.map((rivalry) => (
                  <li key={rivalry}>{rivalry}</li>
                ))}
              </ul>
            ) : (
              <p className="league-discovery__empty">
                Derby and rivalry notes for this league are on the way.
              </p>
            )}
          </article>
          <article className="league-discovery__card">
            <h3>Star names</h3>
            <ul className="league-discovery__list league-discovery__list--names">
              {league.famousPlayers.map((player) => (
                <li key={player}>{player}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section
        id="league-clubs"
        className="league-section"
        aria-labelledby="league-clubs-title"
      >
        <div className="league-section__header">
          <h2 id="league-clubs-title">All clubs</h2>
          <p className="league-section__meta">
            {leagueTeams.length} teams — open a club for fan context, legends, and the full
            squad.
          </p>
        </div>
        <div className="league-club-grid">
          {allClubsWithQuiz.map(({ team, quizCount }) => (
            <LeagueClubChip key={team.id} team={team} quizCount={quizCount} />
          ))}
        </div>
      </section>

      <details className="league-learn-strip league-learn-strip--foldable">
        <summary className="league-learn-strip__summary">
          <span className="league-learn-strip__summary-label">Learning path</span>
          {hasLeagueQuiz && (
            <Link
              to={`/quiz?league=${league.id}`}
              className="btn btn--primary btn--small league-learn-strip__summary-quiz"
              onClick={(event) => event.stopPropagation()}
            >
              League quiz
            </Link>
          )}
        </summary>
        <ol className="league-learn-strip__steps league-learn-strip__steps--stacked">
          {LEARNING_STEPS.map((step, index) => (
            <li key={step.title} className="league-learn-strip__step">
              <span className="league-learn-strip__number">{index + 1}</span>
              <div>
                <span className="league-learn-strip__label">{step.label}</span>
                <h3>{step.title}</h3>
                <p>{stepText(league, step)}</p>
              </div>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

export default function LeagueProfile() {
  const { leagueId } = useParams();
  const loadState = useLeagueShard(leagueId, { requireManifest: true });

  useRecordRecentView('league', loadState.manifestEntry ? leagueId : undefined);

  if (loadState.status === 'missing') {
    return (
      <div className="page">
        <p className="empty-state">We could not find that league.</p>
        <Link to="/browse" className="btn btn--secondary">
          Back to browse
        </Link>
      </div>
    );
  }

  if (loadState.status === 'loading') {
    return <PageFallback label="Loading league…" />;
  }

  if (loadState.status === 'error' || !loadState.shard?.league) {
    return (
      <div className="page">
        <p className="empty-state">This league did not load. Check your connection and try again.</p>
        <Link to="/browse" className="btn btn--secondary">
          Back to browse
        </Link>
      </div>
    );
  }

  return (
    <LeagueProfileContent
      league={loadState.shard.league}
      leagueTeams={loadState.shard.teams}
      leaguePlayers={loadState.shard.players}
    />
  );
}
