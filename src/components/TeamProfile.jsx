import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { hasExternalLeagueShard, useLeagueShard } from '../hooks/useLeagueShard';
import { useFavorites } from '../hooks/useFavorites';
import { useRecordRecentView } from '../hooks/useRecordRecentView';
import { getQuizEligiblePlayers } from '../utils/quizEligibility';
import { QUIZ_MIN_SESSION_POOL } from '../utils/quizSession';
import { truncateClubText } from '../utils/clubIdentity';
import { useQuizRegistry } from '../hooks/useQuizRegistry';
import {
  formatCountryLabel,
  getFootballAccentStyle,
  getLeagueDisplayName,
  isExternalClubStubTeam,
} from '../utils/footballDisplay';
import ClubHubStrip from './ClubHubStrip';
import DataTrustNotice from './DataTrustNotice';
import ExternalStubNotice from './ExternalStubNotice';
import FavoriteButton from './FavoriteButton';
import PageFallback from './PageFallback';
import TeamBadge from './TeamBadge';
import TeamSquadView from './TeamSquadView';
import { getCanonicalUrl, upsertJsonLdScript } from '../utils/jsonLd';
import { setSeoMeta } from '../utils/seoMeta';
import BreadcrumbNav from './BreadcrumbNav';

function TeamProfileContent({ team, leagueName, roster, squadLoading }) {
  useEffect(() => {
    const canonical = getCanonicalUrl();
    if (!canonical) return undefined;

    const homeUrl = canonical.replace(/\/team\/[^/]+$/, '/');
    const teamsUrl = `${homeUrl.replace(/\/$/, '')}/teams`;

    const title = `${team.name} · FootyBrain`;
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
  const quizReadyRoster = getQuizEligiblePlayers(roster);
  const hasTeamQuiz = quizReadyRoster.length >= QUIZ_MIN_SESSION_POOL;
  const { status: quizRegistryStatus, registry: quizRegistry } = useQuizRegistry();
  const leagueQuizReadyCount =
    quizRegistryStatus === 'ready' && quizRegistry?.players
      ? quizRegistry.players.filter((p) => p.leagueId === team.leagueId).length
      : 0;
  const hasLeagueQuiz = leagueQuizReadyCount > 0;
  const saved = isTeamSaved(team.id);
  const fanPathSteps = [
    {
      label: 'Beginner',
      title: 'Learn the club basics',
      text: `${team.name} play in ${leagueName}, call ${team.stadium} home, and were founded in ${team.founded}.`,
    },
    {
      label: 'Squad',
      title: 'Know the current squad',
      text: `Review ${roster.length} player${roster.length === 1 ? '' : 's'} in the squad database, grouped by position with Importance Scores.`,
    },
    {
      label: 'Squad',
      title: 'Know the key players',
      text: team.currentKeyPlayers?.length
        ? `Start with ${team.currentKeyPlayers.join(', ')}.`
        : 'Start with the highest Importance Scores in the squad list below.',
    },
    {
      label: 'History',
      title: 'Learn the rivals',
      text: team.rivals?.length
        ? `Understand why matches against ${team.rivals.join(' and ')} matter to supporters.`
        : 'Club rivalries and local clássicos are being added in a later editorial pass.',
    },
    {
      label: 'History',
      title: 'Learn the legends',
      text: `Recognize names like ${team.legends.slice(0, 3).join(', ')} when fans talk about club history.`,
    },
    {
      label: 'Culture',
      title: 'Understand the fan culture',
      text: team.fanGuide,
    },
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
        className="profile__hero profile__hero--team football-accent-surface"
        style={getFootballAccentStyle(team)}
      >
        <div className="profile__identity">
          <TeamBadge team={team} size="profile" />
          <div>
            <Link to={`/league/${team.leagueId}`} className="profile__league profile__league-link">
              {leagueName}
            </Link>
            <h1>{team.name}</h1>
            <p className="profile__sub">
              {formatCountryLabel(team.country)} · {team.stadium}
            </p>
            <span className="fan-level-badge">Fan Level: Starter</span>
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
                Quiz after editorial review
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

      {isExternalClubStubTeam(team) ? <ExternalStubNotice compact /> : null}

      <ClubHubStrip team={team} leagueName={leagueName} />

      {roster.length > 0 && (
        <section className="info-card info-card--wide" aria-label="Related players">
          <h2>Key players</h2>
          <p className="info-card__note">
            Quick links to start learning {team.name} without scrolling the full squad.
          </p>
          <ul className="tag-list tag-list--accent">
            {roster
              .slice()
              .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
              .slice(0, 6)
              .map((p) => (
                <li key={p.id}>
                  <Link to={`/player/${p.id}`}>{p.name}</Link>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section className="profile__grid" aria-label={`${team.name} details`}>
        <article className="info-card info-card--wide team-profile__squad-card">
          {squadLoading ? (
            <PageFallback label="Loading squad…" />
          ) : (
            <TeamSquadView players={roster} teamName={team.name} />
          )}
        </article>

        <article className="info-card info-card--wide fan-path">
          <div className="fan-path__header">
            <div>
              <p className="fan-path__eyebrow">Fan Mode</p>
              <h2>Learning Path</h2>
            </div>
            <div className="fan-path__actions">
              <a href="#team-squad" className="btn btn--secondary">
                View Squad
              </a>
              {hasTeamQuiz ? (
                <Link to={`/quiz?team=${team.id}`} className="btn btn--primary">
                  Start Team Quiz
                </Link>
              ) : (
                <button type="button" className="btn btn--secondary" disabled>
                  Quiz after editorial review
                </button>
              )}
            </div>
          </div>
          {!hasTeamQuiz && (
            <p className="player-study__note">
              {quizReadyRoster.length > 0
                ? `Team quiz unlocks at ${QUIZ_MIN_SESSION_POOL}+ players with clues (${quizReadyRoster.length} so far).`
                : 'This squad is browse-ready now; team quiz mode unlocks after featured player editorial is approved.'}
            </p>
          )}

          <ol className="fan-path__steps">
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
        </article>

        <article className="info-card info-card--wide club-snapshot-card">
          <h2>Culture snapshot</h2>
          <p className="club-snapshot-card__text">
            {truncateClubText(team.fanGuide, 220) || truncateClubText(team.shortHistory, 220)}
          </p>
          <p className="info-card__note">Deeper history and culture steps are in Fan Mode below.</p>
        </article>

        <article className="info-card">
          <h2>Rivals</h2>
          <ul className="tag-list">
            {team.rivals.map((rival) => (
              <li key={rival}>{rival}</li>
            ))}
          </ul>
        </article>

        <article className="info-card">
          <h2>Legends</h2>
          <ul className="tag-list">
            {team.legends.map((legend) => (
              <li key={legend}>{legend}</li>
            ))}
          </ul>
        </article>

        <article className="info-card">
          <h2>Current key players</h2>
          <ul className="tag-list tag-list--accent">
            {team.currentKeyPlayers.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

export default function TeamProfile() {
  const { teamId } = useParams();
  const [shell, setShell] = useState(null);

  const shellMatchesRoute = shell?.teamId === teamId;
  const team = shellMatchesRoute ? shell.team : null;
  const bundledRoster = shellMatchesRoute ? shell.bundledRoster : null;

  useRecordRecentView('team', team?.id);

  useEffect(() => {
    let cancelled = false;

    import('../data/sampleData.js').then((mod) => {
      if (cancelled) return;
      const resolvedTeam = mod.getTeamById(teamId);
      if (!resolvedTeam) {
        setShell({ teamId, team: null, getLeagueName: mod.getLeagueName, bundledRoster: null });
        return;
      }
      setShell({
        teamId,
        team: resolvedTeam,
        getLeagueName: mod.getLeagueName,
        bundledRoster: hasExternalLeagueShard(resolvedTeam.leagueId)
          ? null
          : mod.getPlayersForTeam(teamId),
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
          Back to Team Learning
        </Link>
      </div>
    );
  }

  if (usesShard && shardState.status === 'error') {
    return (
      <div className="page">
        <p className="empty-state">Could not load this squad. Try again from Browse.</p>
        <Link to="/teams" className="btn btn--secondary">
          Back to Team Learning
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
    />
  );
}
