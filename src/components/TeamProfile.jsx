import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { hasExternalLeagueShard, useLeagueShard } from '../hooks/useLeagueShard';
import { useFavorites } from '../hooks/useFavorites';
import { useRecordRecentView } from '../hooks/useRecordRecentView';
import { getPlayableQuizPlayers } from '../utils/quizEligibility';
import { QUIZ_MIN_SESSION_POOL } from '../utils/quizSession';
import { formatClubIdentityTags, truncateClubText } from '../utils/clubIdentity';
import { IMPORTANCE_SCORE_LABEL, QUIZ_COMING_SOON } from '../utils/consumerCopy';
import { useQuizRegistry } from '../hooks/useQuizRegistry';
import { buildTeamKeyPlayerCards } from '../utils/teamPageUtils';
import {
  formatCountryLabel,
  formatPosition,
  getFootballAccentStyle,
  getLeagueDisplayName,
  isExternalClubStubTeam,
} from '../utils/footballDisplay';
import ClubQuizDiscoveryStrip from './ClubQuizDiscoveryStrip';
import TeamClubProfileHub from './TeamClubProfileHub';
import DataTrustNotice from './DataTrustNotice';
import ExternalStubNotice from './ExternalStubNotice';
import FavoriteButton from './FavoriteButton';
import PageFallback from './PageFallback';
import PlayerVisual from './PlayerVisual';
import TeamBadge from './TeamBadge';
import TeamSquadView from './TeamSquadView';
import { getTeamProfileEditorial } from '../utils/teamProfileDisplay';
import { getCanonicalUrl, upsertJsonLdScript } from '../utils/jsonLd';
import {
  applyEntityNotFoundSeo,
  applyPageSeo,
  buildTeamSeoDescription,
  buildTeamSeoTitle,
} from '../utils/seoCtr.js';
import { canonicalUrlForPath } from '../utils/brand.js';
import BreadcrumbNav from './BreadcrumbNav';
import EntityRelatedNav from './EntityRelatedNav';
import ProfileKeepExploring from './ProfileKeepExploring';
import { dedupeInternalLinks } from '../utils/internalLinking.js';
import {
  buildKeepExploringLinks,
  isHighTrafficTeam,
  isTopTierClub,
} from '../utils/topImportanceProfile';
import { isThinTeam } from '../utils/entityDepthAudit';
import { getProfileExploreLead } from '../data/profileExploreEnhancements';
import { getQuizEligiblePlayers } from '../utils/quizEligibility';
import { getClubQuizPlayHref } from '../data/clubQuizCategories';
import { getQuizThemeIdForLeague, getQuizThemePlayHref } from '../data/quizThemes';
import {
  BADGE_QUIZ_READY,
  CRUMB_CLUBS,
  CRUMB_HOME,
  CTA_BACK_TO_CLUBS,
} from '../utils/entityCopy.js';

function buildTeamProfileSubline(team) {
  const parts = [];
  const country = formatCountryLabel(team.country);
  if (country && country !== '—') parts.push(country);
  if (team.founded) parts.push(`Est. ${team.founded}`);
  if (team.stadium) parts.push(team.stadium);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function TeamProfileContent({ team, leagueName, league, roster, squadLoading, leagueTeams }) {
  const isExternalStub = isExternalClubStubTeam(team);

  useLayoutEffect(() => {
    const canonical = getCanonicalUrl();
    if (!canonical) return undefined;

    const homeUrl = canonical.replace(/\/team\/[^/]+$/, '/');
    const teamsUrl = `${homeUrl.replace(/\/$/, '')}/teams`;

    const quizReady = getQuizEligiblePlayers(roster).length;
    const title = buildTeamSeoTitle(team, { leagueName });
    const description = buildTeamSeoDescription(team, {
      roster,
      leagueName,
      league,
      quizReady,
    });

    applyPageSeo({
      title,
      description,
      canonicalUrl: canonical,
      breadcrumbs: [
        { name: CRUMB_HOME, item: homeUrl },
        { name: CRUMB_CLUBS, item: teamsUrl },
        { name: leagueName, item: `${homeUrl.replace(/\/$/, '')}/league/${team.leagueId}` },
        { name: team.name, item: canonical },
      ],
    });

    upsertJsonLdScript('jsonld-sportsteam', {
      '@context': 'https://schema.org',
      '@type': 'SportsTeam',
      name: team.name,
      sport: 'Soccer',
      url: canonical,
      memberOf: {
        '@type': 'SportsOrganization',
        name: leagueName,
        url: `${homeUrl.replace(/\/$/, '')}/league/${team.leagueId}`,
      },
    });

    return () => {
      upsertJsonLdScript('jsonld-breadcrumb', null);
      upsertJsonLdScript('jsonld-sportsteam', null);
    };
  }, [team, leagueName, league, roster]);

  const { isTeamSaved, toggleTeam } = useFavorites();
  const { status: quizRegistryStatus, registry: quizRegistry } = useQuizRegistry();
  const registryRoster = useMemo(() => {
    if (quizRegistryStatus !== 'ready' || !quizRegistry?.players) return null;
    return quizRegistry.players.filter((player) => player.teamId === team.id);
  }, [quizRegistry, quizRegistryStatus, team.id]);
  const quizPool = registryRoster ?? roster;
  const hasTeamQuiz =
    quizPool.length >= QUIZ_MIN_SESSION_POOL ||
    getPlayableQuizPlayers(roster, 'medium').length >= QUIZ_MIN_SESSION_POOL;
  const hasLeagueQuiz =
    quizRegistryStatus === 'ready' && quizRegistry?.players
      ? quizRegistry.players.some((player) => player.leagueId === team.leagueId)
      : false;
  const leagueThemeId = getQuizThemeIdForLeague(team.leagueId);
  const leagueThemeQuizHref = leagueThemeId ? getQuizThemePlayHref(leagueThemeId) : null;
  const stadiumClubQuizHref = team.stadium
    ? getClubQuizPlayHref('stadium', { leagueId: team.leagueId })
    : null;
  const rivalryClubQuizHref =
    Array.isArray(team.rivals) && team.rivals.length > 0
      ? getClubQuizPlayHref('rivalry', { leagueId: team.leagueId })
      : null;
  const saved = isTeamSaved(team.id);
  const identityTags = formatClubIdentityTags(team.identityTags);
  const keyPlayerCards = buildTeamKeyPlayerCards(team, roster);
  const teamEditorial = getTeamProfileEditorial(team);
  const keyPlayersTitle = teamEditorial.hasStory ? 'Current star players' : 'Players to know';
  const cultureLine =
    truncateClubText(team.fanGuide, 160) || truncateClubText(team.shortHistory, 160);
  const profileSubline = buildTeamProfileSubline(team);
  const thinClub = isThinTeam(team, 4);
  const highTraffic = isHighTrafficTeam(team, roster);
  const topTier = isTopTierClub(team);
  const showKeepExploring =
    topTier ||
    Boolean(getProfileExploreLead(team.id)) ||
    thinClub ||
    highTraffic ||
    !teamEditorial.hasStory ||
    (!team.rivals?.length && !team.legends?.length);

  const fanPathSteps = [
    {
      label: 'Beginner',
      title: 'Learn the club basics',
      text:
        team.stadium && team.founded
          ? `${team.name} play in ${leagueName}, call ${team.stadium} home, and were founded in ${team.founded}.`
          : `${team.name} are listed in ${leagueName}. Club history and stadium details are being added.`,
    },
    {
      label: 'Squad',
      title: 'Know the current squad',
      text: `Review ${roster.length} player${roster.length === 1 ? '' : 's'} in the squad, grouped by position and ${IMPORTANCE_SCORE_LABEL.toLowerCase()}.`,
    },
    {
      label: 'Squad',
      title: 'Know the key players',
      text: team.currentKeyPlayers?.length
        ? `Start with ${team.currentKeyPlayers.join(', ')}.`
        : `Start with the highest ${IMPORTANCE_SCORE_LABEL.toLowerCase()} in the squad list below.`,
    },
    ...(team.rivals?.length
      ? [
          {
            label: 'History',
            title: 'Learn the rivals',
            text: `Understand why matches against ${team.rivals.join(' and ')} matter to supporters.`,
          },
        ]
      : []),
    ...(team.legends?.length
      ? [
          {
            label: 'History',
            title: 'Learn the legends',
            text: `Recognize names like ${team.legends.slice(0, 3).join(', ')} when fans talk about club history.`,
          },
        ]
      : []),
    ...(team.fanGuide
      ? [
          {
            label: 'Culture',
            title: 'Understand the fan culture',
            text: team.fanGuide,
          },
        ]
      : []),
    {
      label: 'Quiz',
      title: 'Take the team quiz',
      text: 'Test the names, positions, and clues you just learned.',
    },
  ];

  return (
    <div className={`page team-profile${topTier ? ' profile--premium' : ''}`}>
      <BreadcrumbNav
        items={[
          { label: CRUMB_HOME, to: '/' },
          { label: CRUMB_CLUBS, to: '/teams' },
          { label: leagueName, to: `/league/${team.leagueId}` },
          { label: team.name },
        ]}
      />

      <header
        className="profile__hero profile__hero--team club-hero football-accent-surface"
        style={getFootballAccentStyle(team)}
      >
        <div className="profile__identity club-hero__identity">
          <TeamBadge team={team} size="profile" />
          <div className="club-hero__copy">
            <Link to={`/league/${team.leagueId}`} className="profile__league profile__league-link">
              {leagueName}
            </Link>
            <h1>{team.name}</h1>
            {profileSubline ? (
              <p className="profile__sub club-hero__sub">{profileSubline}</p>
            ) : isExternalStub ? (
              <p className="profile__sub club-hero__sub">
                Imported club profile — browse the squad below.
              </p>
            ) : null}
            {identityTags.length > 0 && (
              <ul className="club-hero__tags" aria-label="Playing identity">
                {identityTags.map(({ key, label }) => (
                  <li key={key}>
                    <span className="player-identity-chip">{label}</span>
                  </li>
                ))}
              </ul>
            )}
            {cultureLine && !isExternalStub ? (
              <p className="club-hero__lede">{cultureLine}</p>
            ) : null}
          </div>
        </div>
        <div className="team-profile__actions">
          <FavoriteButton
            itemName={team.name}
            saved={saved}
            onToggle={() => toggleTeam(team.id)}
          />
          {hasTeamQuiz ? (
            <>
              <Link to={`/quiz?team=${team.id}`} className="btn btn--primary">
                Start Team Quiz
              </Link>
              <Link to={`/hubs/quizzes/team/${team.id}`} className="btn btn--secondary">
                Club quiz guide
              </Link>
              {leagueThemeQuizHref ? (
                <Link to={leagueThemeQuizHref} className="btn btn--secondary">
                  {leagueName} quiz pool
                </Link>
              ) : null}
              {stadiumClubQuizHref ? (
                <Link to={stadiumClubQuizHref} className="btn btn--secondary">
                  Stadium quiz
                </Link>
              ) : null}
              {rivalryClubQuizHref ? (
                <Link to={rivalryClubQuizHref} className="btn btn--secondary">
                  Rivalry quiz
                </Link>
              ) : null}
              <Link to="/hubs/quizzes/clubs" className="btn btn--secondary">
                Club quizzes
              </Link>
            </>
          ) : (
            <>
              <button type="button" className="btn btn--secondary" disabled>
                {QUIZ_COMING_SOON}
              </button>
              <a href="#team-squad" className="btn btn--secondary">
                Browse squad
              </a>
              {hasLeagueQuiz ? (
                <Link to={`/quiz?league=${team.leagueId}`} className="btn btn--secondary">
                  Try league quiz
                </Link>
              ) : null}
            </>
          )}
        </div>
      </header>

      <DataTrustNotice compact />

      {isExternalStub ? <ExternalStubNotice compact /> : null}

      <TeamClubProfileHub
        team={team}
        leagueName={leagueName}
        league={league}
        rosterSize={roster.length}
        leagueTeams={leagueTeams}
        isExternalStub={isExternalStub}
      />

      {!isExternalStub ? (
        <ClubQuizDiscoveryStrip
          team={team}
          leagueName={leagueName}
          hasTeamQuiz={hasTeamQuiz}
          hasLeagueQuiz={hasLeagueQuiz}
        />
      ) : null}

      <div className="team-page-rich">
        {keyPlayerCards.length > 0 && (
          <section className="team-key-players info-card" aria-labelledby="team-key-players-title">
            <div className="team-key-players__header">
              <h2 id="team-key-players-title">{keyPlayersTitle}</h2>
              <p className="team-key-players__note">
                {teamEditorial.hasStory
                  ? 'Faces to know before you dive into the full squad — quiz-ready names marked.'
                  : 'Top importance in the squad list — open profiles for hints, then try the club quiz.'}
              </p>
            </div>
            <ul className="team-key-players__grid">
              {keyPlayerCards.map((card) => {
                if (card.player) {
                  return (
                    <li key={card.player.id}>
                      <Link
                        to={`/player/${card.player.id}`}
                        className="team-key-players__card"
                      >
                        <PlayerVisual player={card.player} size="card" compact />
                        <span className="team-key-players__text">
                          <strong>{card.player.name}</strong>
                          <span>
                            {card.note || formatPosition(card.player.position) || 'Squad'}
                            {card.quizReady ? ` · ${BADGE_QUIZ_READY}` : ''}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={card.label}>
                    <div className="team-key-players__card team-key-players__card--text">
                      <span className="team-key-players__text">
                        <strong>{card.label}</strong>
                        {card.note ? <span>{card.note}</span> : null}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <article className="info-card info-card--wide team-profile__squad-card">
          {squadLoading ? (
            <PageFallback label="Loading squad…" />
          ) : (
            <TeamSquadView
              players={roster}
              teamName={team.name}
              hideQuizSummary
            />
          )}
        </article>

        {showKeepExploring ? (
          <ProfileKeepExploring
            variant="team"
            premium={topTier}
            entityId={team.id}
            teamId={team.id}
            leagueId={team.leagueId}
            teamName={team.name}
            leagueName={leagueName}
            quizReady={hasTeamQuiz}
            team={team}
            league={league}
            leagueTeams={leagueTeams}
          />
        ) : (
          <EntityRelatedNav
            links={dedupeInternalLinks(
              buildKeepExploringLinks({
                team,
                league,
                leagueId: team.leagueId,
                leagueName,
                leagueTeams,
                quizReady: hasTeamQuiz,
              }),
              8,
            )}
          />
        )}

        {!isExternalStub ? (
          <details className="fan-path-details info-card info-card--wide">
            <summary className="fan-path-details__summary">
              <span className="fan-path__eyebrow">Fan mode</span>
              <span className="fan-path-details__title">Learning path</span>
            </summary>
            <div className="fan-path-details__body">
              <div className="fan-path__actions fan-path-details__actions">
                <a href="#team-squad" className="btn btn--secondary">
                  View squad
                </a>
                {hasTeamQuiz ? (
                  <Link to={`/quiz?team=${team.id}`} className="btn btn--primary">
                    Start team quiz
                  </Link>
                ) : (
                  <button type="button" className="btn btn--secondary" disabled>
                    {QUIZ_COMING_SOON}
                  </button>
                )}
              </div>
              {!hasTeamQuiz ? (
                <p className="player-study__note">
                  Explore the full squad now — the club quiz unlocks once more players have quiz
                  clues.
                </p>
              ) : null}
              <ol className="fan-path__steps fan-path__steps--stacked">
                {fanPathSteps.map((step, index) => (
                  <li key={`${step.label}-${step.title}`} className="fan-path__step">
                    <span className="fan-path__number">{index + 1}</span>
                    <div>
                      <span className="fan-path__label">{step.label}</span>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function TeamNotFound({ teamId, message }) {
  useLayoutEffect(() => {
    applyEntityNotFoundSeo({
      label: 'Club',
      canonicalUrl: canonicalUrlForPath(`/team/${teamId}`),
    });
  }, [teamId]);

  return (
    <div className="page team-profile">
      <BreadcrumbNav
        items={[
          { label: CRUMB_HOME, to: '/' },
          { label: CRUMB_CLUBS, to: '/teams' },
          { label: 'Club not found' },
        ]}
      />
      <header className="page-header">
        <h1>Club not found</h1>
        <p className="empty-state">{message}</p>
      </header>
      <Link to="/teams" className="btn btn--secondary">
        {CTA_BACK_TO_CLUBS}
      </Link>
    </div>
  );
}

export default function TeamProfile() {
  const { teamId } = useParams();
  const [shell, setShell] = useState(null);

  const shellMatchesRoute = shell?.teamId === teamId;
  const team = shellMatchesRoute ? shell.team : null;
  const bundledRoster = shellMatchesRoute ? shell.bundledRoster : null;
  const bundledLeagueTeams = shellMatchesRoute ? shell.bundledLeagueTeams : null;
  const league = shellMatchesRoute ? shell.league : null;

  useRecordRecentView('team', team?.id);

  useEffect(() => {
    let cancelled = false;

    import('../data/sampleData.js').then((mod) => {
      if (cancelled) return;
      const resolvedTeam = mod.getTeamById(teamId);
      if (!resolvedTeam) {
        setShell({
          teamId,
          team: null,
          getLeagueName: mod.getLeagueName,
          bundledRoster: null,
          bundledLeagueTeams: null,
          league: null,
        });
        return;
      }
      const usesExternalShard = hasExternalLeagueShard(resolvedTeam.leagueId);
      setShell({
        teamId,
        team: resolvedTeam,
        getLeagueName: mod.getLeagueName,
        bundledRoster: usesExternalShard ? null : mod.getPlayersForTeam(teamId),
        bundledLeagueTeams: usesExternalShard
          ? null
          : mod.teams.filter((t) => t.leagueId === resolvedTeam.leagueId),
        league: mod.getLeagueById(resolvedTeam.leagueId) ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [teamId]);
  const usesShard = Boolean(team && hasExternalLeagueShard(team.leagueId));
  const shardState = useLeagueShard(usesShard ? team.leagueId : null);

  const roster = useMemo(() => {
    if (usesShard && shardState.status === 'ready' && shardState.shard) {
      return shardState.shard.players.filter((player) => player.teamId === teamId);
    }
    return bundledRoster ?? [];
  }, [usesShard, shardState.status, shardState.shard, teamId, bundledRoster]);

  const leagueTeams = useMemo(() => {
    if (usesShard && shardState.status === 'ready' && shardState.shard) {
      return shardState.shard.teams;
    }
    return bundledLeagueTeams ?? [];
  }, [usesShard, shardState.status, shardState.shard, bundledLeagueTeams]);

  const squadLoading = usesShard && shardState.status === 'loading';
  const leagueName =
    team && shellMatchesRoute
      ? getLeagueDisplayName({
          id: team.leagueId,
          name: shell.getLeagueName(team.leagueId),
        })
      : '';

  if (!shellMatchesRoute) {
    return <PageFallback label="Loading team…" />;
  }

  if (!team) {
    return <TeamNotFound teamId={teamId} message="Team not found." />;
  }

  if (usesShard && shardState.status === 'error') {
    return (
      <TeamNotFound
        teamId={teamId}
        message="Could not load this squad. Check your connection and try again."
      />
    );
  }

  return (
    <TeamProfileContent
      team={team}
      leagueName={leagueName}
      league={league}
      roster={roster}
      squadLoading={squadLoading}
      leagueTeams={leagueTeams}
    />
  );
}
