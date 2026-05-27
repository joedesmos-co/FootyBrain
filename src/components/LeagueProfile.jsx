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
  getFootballAccentStyle,
  getLeagueDisplayName,
  isExternalLeagueId,
} from '../utils/footballDisplay';
import ExternalStubNotice from './ExternalStubNotice';
import { truncateLeagueText } from '../utils/leagueIdentity';
import DataTrustNotice from './DataTrustNotice';
import LeagueBadge from './LeagueBadge';
import LeagueClubChip from './LeagueClubChip';
import LeagueHubStrip from './LeagueHubStrip';
import PageFallback from './PageFallback';
import PlayerCard from './PlayerCard';
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
      description: `${getLeagueDisplayName(league)} (${formatCountryLabel(league.country)}). ${leagueTeams.length} clubs · ${leaguePlayers.length} players listed · ${getQuizEligiblePlayers(leaguePlayers).length} with quiz mode.`,
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
        className="profile__hero profile__hero--league football-accent-surface"
        style={getFootballAccentStyle(league)}
      >
        <div className="profile__identity">
          <LeagueBadge league={league} size="profile" />
          <div>
            <p className="profile__league">{formatCountryLabel(league.country)}</p>
            <h1>{getLeagueDisplayName(league)}</h1>
            <p className="profile__sub">
              {leagueTeams.length} clubs · {quizReadyPlayers.length} with quiz mode ·{' '}
              {leaguePlayers.length} players listed
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
              Quiz after editorial review
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

      <section className="league-learn-strip" aria-label="Learn this league">
        <div className="league-learn-strip__header">
          <h2>Learning path</h2>
          {hasLeagueQuiz && (
            <Link to={`/quiz?league=${league.id}`} className="btn btn--primary btn--small">
              League quiz
            </Link>
          )}
        </div>
        <ol className="league-learn-strip__steps">
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
      </section>

      {featuredClubs.length > 0 && (
        <section className="league-section" aria-labelledby="league-featured-title">
          <div className="league-section__header">
            <h2 id="league-featured-title">Best clubs to quiz</h2>
            <p className="league-section__meta">
              Best starting points for quizzes and squad learning in {league.name}.
            </p>
          </div>
          <div className="league-club-grid league-club-grid--featured">
            {featuredClubs.map(({ team, quizCount }) => (
              <LeagueClubChip key={team.id} team={team} quizCount={quizCount} featured />
            ))}
          </div>
        </section>
      )}

      <section className="league-quick-facts" aria-label="League quick facts">
        <article className="league-quick-facts__card">
          <h2>Rivalries</h2>
          {league.rivalries.length > 0 ? (
            <ul className="tag-list tag-list--accent">
              {league.rivalries.map((rivalry) => (
                <li key={rivalry}>{rivalry}</li>
              ))}
            </ul>
          ) : (
            <p className="league-quick-facts__empty">Rivalry notes coming soon.</p>
          )}
        </article>
        <article className="league-quick-facts__card">
          <h2>Star names</h2>
          <ul className="tag-list">
            {league.famousPlayers.map((player) => (
              <li key={player}>{player}</li>
            ))}
          </ul>
        </article>
        <article className="league-quick-facts__card league-quick-facts__card--wide">
          <h2>Fan tip</h2>
          <p>{truncateLeagueText(league.fanGuide, 220)}</p>
        </article>
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

      {keyPlayers.length > 0 && (
        <section className="league-section" aria-labelledby="league-players-title">
          <div className="league-section__header">
            <h2 id="league-players-title">Featured players</h2>
            <p className="league-section__meta">
              Highest Importance Score in {league.name} right now.
            </p>
          </div>
          <div className="card-grid league-profile__players">
            {keyPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </section>
      )}
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
        <p className="empty-state">League not found.</p>
        <Link to="/browse" className="btn btn--secondary">
          Back to Browse Database
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
        <p className="empty-state">Could not load this league. Try again from Browse.</p>
        <Link to="/browse" className="btn btn--secondary">
          Back to Browse Database
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
