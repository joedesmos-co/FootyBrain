import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { hasExternalLeagueShard, useLeagueShard } from '../hooks/useLeagueShard';
import { useFavorites } from '../hooks/useFavorites';
import { useRecordRecentView } from '../hooks/useRecordRecentView';
import { getQuizEligiblePlayers } from '../utils/quizEligibility';
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
import TeamClubProfileHub from './TeamClubProfileHub';
import DataTrustNotice from './DataTrustNotice';
import ExternalStubNotice from './ExternalStubNotice';
import FavoriteButton from './FavoriteButton';
import PageFallback from './PageFallback';
import PlayerVisual from './PlayerVisual';
import TeamBadge from './TeamBadge';
import TeamSquadView from './TeamSquadView';
import { getCanonicalUrl, upsertJsonLdScript } from '../utils/jsonLd';
import { setSeoMeta } from '../utils/seoMeta';
import BreadcrumbNav from './BreadcrumbNav';

function buildTeamProfileSubline(team) {
  const parts = [];
  const country = formatCountryLabel(team.country);
  if (country && country !== '—') parts.push(country);
  if (team.founded) parts.push(`Est. ${team.founded}`);
  if (team.stadium) parts.push(team.stadium);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function TeamProfileContent({ team, leagueName, roster, squadLoading, leagueTeams }) {
  const isExternalStub = isExternalClubStubTeam(team);

  useEffect(() => {
    const canonical = getCanonicalUrl();
    if (!canonical) return undefined;

    const homeUrl = canonical.replace(/\/team\/[^/]+$/, '/');
    const teamsUrl = `${homeUrl.replace(/\/$/, '')}/teams`;

    const title = `${team.name} · FootyCompass`;
    const description = `${team.name} (${formatCountryLabel(team.country)}). Squad learning, rivals, legends, and quizzes when available.`;
    setSeoMeta({
      title,
      description,
      canonicalUrl: canonical,
      og: { title, description, url: canonical, type: 'website' },
      twitter: { title, description },
    });

    upsertJsonLdScript('jsonld-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: 'Teams', item: teamsUrl },
        { '@type': 'ListItem', position: 3, name: team.name, item: canonical },
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
  }, [team.id, team.name, team.leagueId, team.country, leagueName]);

  const { isTeamSaved, toggleTeam } = useFavorites();
  const hasTeamQuiz = getQuizEligiblePlayers(roster).length >= QUIZ_MIN_SESSION_POOL;
  const { status: quizRegistryStatus, registry: quizRegistry } = useQuizRegistry();
  const hasLeagueQuiz =
    quizRegistryStatus === 'ready' && quizRegistry?.players
      ? quizRegistry.players.some((player) => player.leagueId === team.leagueId)
      : false;
  const saved = isTeamSaved(team.id);
  const identityTags = formatClubIdentityTags(team.identityTags);
  const keyPlayerCards = buildTeamKeyPlayerCards(team, roster);
  const cultureLine =
    truncateClubText(team.fanGuide, 160) || truncateClubText(team.shortHistory, 160);
  const profileSubline = buildTeamProfileSubline(team);

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
    <div className="page team-profile">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Teams', to: '/teams' },
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
            <Link to={`/quiz?team=${team.id}`} className="btn btn--primary">
              Start Team Quiz
            </Link>
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
        rosterSize={roster.length}
        leagueTeams={leagueTeams}
        isExternalStub={isExternalStub}
      />

      <div className="team-page-rich">
        {keyPlayerCards.length > 0 && (
          <section className="team-key-players info-card" aria-labelledby="team-key-players-title">
            <div className="team-key-players__header">
              <h2 id="team-key-players-title">Current star players</h2>
              <p className="team-key-players__note">
                Faces to know before you dive into the full squad.
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

export default function TeamProfile() {
  const { teamId } = useParams();
  const [shell, setShell] = useState(null);

  const shellMatchesRoute = shell?.teamId === teamId;
  const team = shellMatchesRoute ? shell.team : null;
  const bundledRoster = shellMatchesRoute ? shell.bundledRoster : null;
  const bundledLeagueTeams = shellMatchesRoute ? shell.bundledLeagueTeams : null;

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
    return (
      <div className="page">
        <p className="empty-state">Team not found.</p>
        <Link to="/teams" className="btn btn--secondary">
          Back to clubs
        </Link>
      </div>
    );
  }

  if (usesShard && shardState.status === 'error') {
    return (
      <div className="page">
        <p className="empty-state">Could not load this squad. Check your connection and try again.</p>
        <Link to="/teams" className="btn btn--secondary">
          Back to clubs
        </Link>
      </div>
    );
  }

  return (
    <TeamProfileContent
      team={team}
      leagueName={leagueName}
      roster={roster}
      squadLoading={squadLoading}
      leagueTeams={leagueTeams}
    />
  );
}
