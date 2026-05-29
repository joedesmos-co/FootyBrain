import { useEffect, useLayoutEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLeagueShard } from '../hooks/useLeagueShard';
import { useRecordRecentView } from '../hooks/useRecordRecentView';
import { getClubQuizPlayHref } from '../data/clubQuizCategories';
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
import {
  applyEntityNotFoundSeo,
  applyPageSeo,
  buildLeagueSeoDescription,
  buildLeagueSeoTitle,
} from '../utils/seoCtr.js';
import { canonicalUrlForPath } from '../utils/brand.js';
import { buildLeagueIdentitySection } from '../utils/topImportanceProfile';
import { isThinLeague } from '../utils/entityDepthAudit';
import BreadcrumbNav from './BreadcrumbNav';
import { CRUMB_BROWSE, CRUMB_HOME, CTA_BACK_TO_BROWSE } from '../utils/entityCopy.js';
import EntityRelatedNav from './EntityRelatedNav';
import ProfileKeepExploring from './ProfileKeepExploring';
import { buildLeagueHeroLede } from '../utils/learnerProfileCopy';
import { isTopTierLeague } from '../utils/topTierPages';
import {
  buildLeagueInternalLinks,
  findNationalTeamIdForCountry,
  resolveFamousPlayerLinks,
  resolveLeagueRivalryLinks,
} from '../utils/internalLinking.js';

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
  const quizReadyPlayers = getQuizEligiblePlayers(leaguePlayers);

  useEffect(() => {
    const canonical = getCanonicalUrl();
    if (!canonical) return undefined;

    const homeUrl = canonical.replace(/\/league\/[^/]+$/, '/');
    const browseUrl = `${homeUrl.replace(/\/$/, '')}/browse`;

    const stats = {
      clubs: leagueTeams.length,
      players: leaguePlayers.length,
      quizReady: quizReadyPlayers.length,
    };
    const title = buildLeagueSeoTitle(league);
    const description = buildLeagueSeoDescription(league, stats);

    applyPageSeo({
      title,
      description,
      canonicalUrl: canonical,
      breadcrumbs: [
        { name: CRUMB_HOME, item: homeUrl },
        { name: CRUMB_BROWSE, item: browseUrl },
        { name: getLeagueDisplayName(league), item: canonical },
      ],
    });

    upsertJsonLdScript('jsonld-sportsleague', {
      '@context': 'https://schema.org',
      '@type': 'SportsOrganization',
      name: getLeagueDisplayName(league),
      sport: 'Soccer',
      url: canonical,
    });

    return () => {
      upsertJsonLdScript('jsonld-breadcrumb', null);
      upsertJsonLdScript('jsonld-sportsleague', null);
    };
  }, [league, leagueTeams, leaguePlayers, quizReadyPlayers.length]);

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
  const leagueIdentityBlurb = buildLeagueIdentitySection(league);
  const showLeagueIdentity =
    !topTier && (isThinLeague(league, 4) || !leagueDescription);
  const rivalryLinks = resolveLeagueRivalryLinks(league.rivalries, leagueTeams, 6);
  const famousPlayerLinks = resolveFamousPlayerLinks(league.famousPlayers, leaguePlayers, 6);
  const leagueNationalTeamId = league.country
    ? findNationalTeamIdForCountry(league.country)
    : null;
  const topTier = isTopTierLeague(league);
  const leagueHeroLede = buildLeagueHeroLede(league);
  const leagueStats = {
    clubs: leagueTeams.length,
    quizReady: quizReadyPlayers.length,
  };

  return (
    <div className={`page league-profile${topTier ? ' profile--premium' : ''}`}>
      <BreadcrumbNav
        items={[
          { label: CRUMB_HOME, to: '/' },
          { label: CRUMB_BROWSE, to: '/browse' },
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
            {leagueHeroLede ? (
              <p className="league-hero__lede">{leagueHeroLede}</p>
            ) : null}
            <p className="profile__sub league-hero__sub">
              {leagueMetaLine({
                clubs: leagueTeams.length,
                players: leaguePlayers.length,
              })}
            </p>
          </div>
        </div>
        <div
          className={`team-profile__actions${topTier ? ' league-hero__actions league-hero__actions--tier' : ''}`}
        >
          {hasLeagueQuiz ? (
            <Link to={`/quiz?league=${league.id}`} className="btn btn--primary">
              Start League Quiz
            </Link>
          ) : (
            <button type="button" className="btn btn--secondary" disabled>
              {QUIZ_COMING_SOON}
            </button>
          )}
          <Link
            to={`/hubs/quizzes/league/${league.id}`}
            className="btn btn--secondary"
          >
            League quiz guide
          </Link>
          {topTier ? (
            <details className="league-hero__more">
              <summary className="btn btn--secondary league-hero__more-summary">
                More quizzes & paths
              </summary>
              <div className="league-hero__more-panel">
                <Link
                  to={getClubQuizPlayHref('league', { leagueId: league.id })}
                  className="btn btn--secondary btn--small"
                >
                  Club league quiz
                </Link>
                <Link
                  to={getClubQuizPlayHref('stadium', { leagueId: league.id })}
                  className="btn btn--secondary btn--small"
                >
                  Stadium quiz
                </Link>
                <Link
                  to={getClubQuizPlayHref('rivalry', { leagueId: league.id })}
                  className="btn btn--secondary btn--small"
                >
                  Rivalry quiz
                </Link>
                <Link to="/hubs/quizzes/clubs" className="btn btn--secondary btn--small">
                  Club quiz guides
                </Link>
                {leagueNationalTeamId ? (
                  <Link
                    to={`/national-team/${leagueNationalTeamId}`}
                    className="btn btn--secondary btn--small"
                  >
                    {league.country} national team
                  </Link>
                ) : null}
                {league.country ? (
                  <Link
                    to={`/hubs/players/nationality/${encodeURIComponent(league.country)}`}
                    className="btn btn--secondary btn--small"
                  >
                    {league.country} players
                  </Link>
                ) : null}
                <a href="#league-clubs" className="btn btn--secondary btn--small">
                  Browse clubs
                </a>
              </div>
            </details>
          ) : (
            <>
              <Link
                to={getClubQuizPlayHref('league', { leagueId: league.id })}
                className="btn btn--secondary"
              >
                Club league quiz
              </Link>
              <Link
                to={getClubQuizPlayHref('stadium', { leagueId: league.id })}
                className="btn btn--secondary"
              >
                Stadium quiz
              </Link>
              <Link
                to={getClubQuizPlayHref('rivalry', { leagueId: league.id })}
                className="btn btn--secondary"
              >
                Rivalry quiz
              </Link>
              <Link to="/hubs/quizzes/clubs" className="btn btn--secondary">
                Club quiz guides
              </Link>
              {leagueNationalTeamId ? (
                <Link
                  to={`/national-team/${leagueNationalTeamId}`}
                  className="btn btn--secondary"
                >
                  {league.country} national team
                </Link>
              ) : null}
              {league.country ? (
                <Link
                  to={`/hubs/players/nationality/${encodeURIComponent(league.country)}`}
                  className="btn btn--secondary"
                >
                  {league.country} players
                </Link>
              ) : null}
              <a href="#league-clubs" className="btn btn--secondary">
                Browse clubs
              </a>
            </>
          )}
        </div>
      </header>

      <DataTrustNotice compact />

      {showLeagueIdentity && leagueIdentityBlurb ? (
        <section className="info-card league-section" aria-labelledby="league-identity-title">
          <h2 id="league-identity-title">About this league</h2>
          <p className="league-section__meta league-profile__about">{leagueIdentityBlurb}</p>
        </section>
      ) : null}

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
            {rivalryLinks.length > 0 ? (
              <ul className="league-discovery__list league-discovery__list--linked">
                {rivalryLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            ) : league.rivalries.length > 0 ? (
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
            {famousPlayerLinks.length > 0 ? (
              <ul className="league-discovery__list league-discovery__list--linked">
                {famousPlayerLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="league-discovery__list league-discovery__list--names">
                {league.famousPlayers.map((player) => (
                  <li key={player}>{player}</li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>

      {topTier ? (
        <ProfileKeepExploring
          variant="league"
          premium
          entityId={league.id}
          leagueId={league.id}
          leagueName={getLeagueDisplayName(league)}
          league={league}
          leagueTeams={leagueTeams}
          quizReady={hasLeagueQuiz}
          leagueStats={leagueStats}
        />
      ) : null}

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

      {topTier ? null : (
        <EntityRelatedNav
          links={buildLeagueInternalLinks({
            league,
            leagueTeams,
            leaguePlayers,
            quizReady: hasLeagueQuiz,
          })}
        />
      )}
    </div>
  );
}

function LeagueNotFound({ leagueId, message }) {
  useLayoutEffect(() => {
    applyEntityNotFoundSeo({
      label: 'League',
      canonicalUrl: canonicalUrlForPath(`/league/${leagueId}`),
    });
  }, [leagueId]);

  return (
    <div className="page league-profile">
      <BreadcrumbNav
        items={[
          { label: CRUMB_HOME, to: '/' },
          { label: CRUMB_BROWSE, to: '/browse' },
          { label: 'League not found' },
        ]}
      />
      <header className="page-header">
        <h1>League not found</h1>
        <p className="empty-state">{message}</p>
      </header>
      <Link to="/browse" className="btn btn--secondary">
        {CTA_BACK_TO_BROWSE}
      </Link>
    </div>
  );
}

export default function LeagueProfile() {
  const { leagueId } = useParams();
  const loadState = useLeagueShard(leagueId, { requireManifest: true });

  useRecordRecentView('league', loadState.manifestEntry ? leagueId : undefined);

  if (loadState.status === 'missing') {
    return (
      <LeagueNotFound leagueId={leagueId} message="We could not find that league." />
    );
  }

  if (loadState.status === 'loading') {
    return <PageFallback label="Loading league…" />;
  }

  if (loadState.status === 'error' || !loadState.shard?.league) {
    return (
      <LeagueNotFound
        leagueId={leagueId}
        message="This league did not load. Check your connection and try again."
      />
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
