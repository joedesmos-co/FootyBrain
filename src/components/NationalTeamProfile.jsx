import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRecordRecentView } from '../hooks/useRecordRecentView';
import { loadPlayerById } from '../data/playerStore';
import { peekTeamName } from '../data/teamStore';
import {
  countLinkedPlayers,
  getNationalTeamById,
  getMembershipRowsForNationalTeam,
  getNationalTeamQuizReadyCount,
  isLiveNationalTeamId,
} from '../data/nationalTeamData';
import { getQuizEligiblePlayers } from '../utils/quizEligibility';
import { QUIZ_NATIONAL_TEAM_MIN_POOL } from '../utils/quizSession';
import NationalTeamBadge from './NationalTeamBadge';
import DataTrustNotice from './DataTrustNotice';
import { FEATURED_NATIONAL_TEAM_IDS } from '../data/worldCupHubData';
import { getWorldCup2026RosterStatus } from '../data/worldCup2026Rosters';
import { isWorldCup2026QualifiedTeam } from '../data/worldCup2026Prep';
import TeamSquadView from './TeamSquadView';
import PlayerVisual from './PlayerVisual';
import { formatPosition } from '../utils/footballDisplay';
import { getCanonicalUrl, upsertJsonLdScript } from '../utils/jsonLd';
import {
  applyPageSeo,
  buildNationalTeamSeoDescription,
  buildNationalTeamSeoTitle,
} from '../utils/seoCtr.js';
import BreadcrumbNav from './BreadcrumbNav';
import EntityRelatedNav from './EntityRelatedNav';
import NationalTeamProfileHub from './NationalTeamProfileHub';
import NationalTeamDiscoveryStrip from './NationalTeamDiscoveryStrip';
import {
  buildNationalKeyPlayerCards,
  buildStructuredNationalProfile,
} from '../utils/nationalProfileEditorial';
import {
  buildNationalTeamInternalLinks,
  getNationalityHubPath,
} from '../utils/internalLinking.js';
import { isThinNationalTeam } from '../utils/entityDepthAudit';

/** Display label for rival slugs when no live national-team page exists yet. */
const RIVAL_DISPLAY_NAMES = {
  argentina: 'Argentina',
  spain: 'Spain',
  mexico: 'Mexico',
  france: 'France',
  germany: 'Germany',
  netherlands: 'Netherlands',
  england: 'England',
  brazil: 'Brazil',
  'united-states': 'United States',
  italy: 'Italy',
  portugal: 'Portugal',
};

function getRivalDisplayName(rivalId) {
  return RIVAL_DISPLAY_NAMES[rivalId] ?? rivalId.replace(/-/g, ' ');
}

export default function NationalTeamProfile() {
  const { teamId } = useParams();
  const nationalTeam = getNationalTeamById(teamId);
  useRecordRecentView('national-team', nationalTeam?.id);
  const [squadState, setSquadState] = useState(() => ({
    nationalTeamId: null,
    status: 'loading',
    players: [],
    loaded: 0,
    total: 0,
  }));

  const squadStateMatches = squadState.nationalTeamId === nationalTeam?.id;
  const squad = squadStateMatches ? squadState.players : [];
  const squadLoading =
    squadStateMatches && squadState.status === 'loading' && squadState.total > 0;

  const linkedCount = nationalTeam ? countLinkedPlayers(nationalTeam.id) : 0;
  const quizReadyCount = nationalTeam ? getNationalTeamQuizReadyCount(nationalTeam.id) : 0;
  const quizReady = useMemo(() => getQuizEligiblePlayers(squad), [squad]);
  const canLaunchNationalQuiz = quizReady.length >= QUIZ_NATIONAL_TEAM_MIN_POOL;

  const keyPlayerCards = useMemo(
    () => (squad.length ? buildNationalKeyPlayerCards(squad) : []),
    [squad],
  );

  const profileStructured = useMemo(() => {
    if (!nationalTeam) return null;
    return buildStructuredNationalProfile({
      nationalTeam,
      squad,
      linkedCount,
      quizReadyCount,
    });
  }, [nationalTeam, squad, linkedCount, quizReadyCount]);

  useEffect(() => {
    if (!nationalTeam) return undefined;
    const canonical = getCanonicalUrl();
    if (!canonical) return undefined;
    const homeUrl = canonical.replace(/\/national-team\/[^/]+$/, '/');
    const nationalTeamsUrl = `${homeUrl.replace(/\/$/, '')}/national-teams`;
    const title = buildNationalTeamSeoTitle(nationalTeam);
    const description = buildNationalTeamSeoDescription(nationalTeam, {
      linkedCount,
      quizReady: quizReady.length,
      canQuiz: canLaunchNationalQuiz,
      squad,
    });

    const breadcrumbItems = [
      { name: 'Home', item: homeUrl },
      { name: 'National teams', item: nationalTeamsUrl },
    ];
    if (FEATURED_NATIONAL_TEAM_IDS.includes(nationalTeam.id)) {
      breadcrumbItems.push({
        name: 'World Cup 2026',
        item: `${homeUrl.replace(/\/$/, '')}/world-cup`,
      });
    }
    breadcrumbItems.push({ name: nationalTeam.displayName, item: canonical });

    applyPageSeo({
      title,
      description,
      canonicalUrl: canonical,
      breadcrumbs: breadcrumbItems,
    });

    upsertJsonLdScript('jsonld-sportsteam', {
      '@context': 'https://schema.org',
      '@type': 'SportsTeam',
      name: nationalTeam.displayName,
      sport: 'Soccer',
      url: canonical,
    });

    return () => {
      upsertJsonLdScript('jsonld-breadcrumb', null);
      upsertJsonLdScript('jsonld-sportsteam', null);
    };
  }, [nationalTeam, linkedCount, quizReady.length, canLaunchNationalQuiz, squad]);

  useEffect(() => {
    if (!nationalTeam?.id) return undefined;
    let cancelled = false;
    const rows = getMembershipRowsForNationalTeam(nationalTeam.id);
    const ids = rows.map((r) => r.playerId);

    (async () => {
      const out = [];
      const CHUNK = 25;
      try {
        setSquadState({
          nationalTeamId: nationalTeam.id,
          status: 'loading',
          players: [],
          loaded: 0,
          total: ids.length,
        });
        for (let i = 0; i < ids.length; i += CHUNK) {
          const slice = ids.slice(i, i + CHUNK);
          const players = await Promise.all(slice.map((id) => loadPlayerById(id)));
          if (cancelled) return;
          out.push(...players.filter(Boolean));
          out.sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0));
          setSquadState((prev) =>
            prev.nationalTeamId === nationalTeam.id
              ? {
                  ...prev,
                  status: i + CHUNK >= ids.length ? 'ready' : 'loading',
                  players: out,
                  loaded: Math.min(i + CHUNK, ids.length),
                  total: ids.length,
                }
              : prev,
          );
        }
      } catch {
        if (cancelled) return;
        setSquadState({
          nationalTeamId: nationalTeam.id,
          status: 'error',
          players: [],
          loaded: 0,
          total: ids.length,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nationalTeam?.id]);

  if (!nationalTeam) {
    const poolNotAddedYet =
      teamId && isWorldCup2026QualifiedTeam(teamId) && !isLiveNationalTeamId(teamId);
    return (
      <div className="page">
        <p className="empty-state">
          {poolNotAddedYet
            ? 'Pool not added yet.'
            : 'National team not found.'}
        </p>
        {poolNotAddedYet ? (
          <p className="collections-page__section-desc">
            This World Cup team is in the 2026 draw for orientation only — FootyCompass does not
            have a national player pool page yet. Browse live pools from the{' '}
            <Link to="/world-cup">World Cup hub</Link> or the{' '}
            <Link to="/national-teams">national teams</Link> list.
          </p>
        ) : null}
        <Link to="/national-teams" className="btn btn--secondary">
          Back to national teams
        </Link>
      </div>
    );
  }

  const wcRosterStatus = isWorldCup2026QualifiedTeam(nationalTeam.id)
    ? getWorldCup2026RosterStatus(nationalTeam.id)
    : null;
  const showBrowseOnlyPoolBanner =
    squad.length >= 8 && quizReady.length < QUIZ_NATIONAL_TEAM_MIN_POOL;
  const isFeatured = FEATURED_NATIONAL_TEAM_IDS.includes(nationalTeam.id);
  const nationalityHubPath = getNationalityHubPath(
    nationalTeam.country ?? nationalTeam.displayName,
  );

  const clubFlows = (() => {
    const counts = new Map();
    for (const player of squad) {
      counts.set(player.teamId, (counts.get(player.teamId) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([tid, count]) => ({ teamId: tid, count, teamName: peekTeamName(tid) }))
      .filter((row) => row.teamName && row.teamName !== 'Unknown')
      .sort((a, b) => b.count - a.count || a.teamName.localeCompare(b.teamName))
      .slice(0, 6);
  })();

  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: 'National teams', to: '/national-teams' },
  ];
  if (isFeatured) {
    breadcrumbItems.push({ label: 'World Cup 2026', to: '/world-cup' });
  }
  breadcrumbItems.push({ label: nationalTeam.displayName });

  const showKeepExploring =
    isThinNationalTeam(nationalTeam, 4) ||
    isFeatured ||
    linkedCount >= 20 ||
    !String(nationalTeam.shortHistory ?? '').trim();

  const keepExploringLead = profileStructured?.tournament
    ? profileStructured.tournament
    : profileStructured?.squadIdentity
      ? truncateLead(profileStructured.squadIdentity)
      : '';

  return (
    <div className="page national-team-profile">
      <BreadcrumbNav items={breadcrumbItems} />

      <header className="profile__hero profile__hero--national">
        <div className="profile__identity">
          <NationalTeamBadge nationalTeam={nationalTeam} size="profile" />
          <div>
            <p className="profile__league">{nationalTeam.confederation}</p>
            <h1>{nationalTeam.displayName}</h1>
            <p className="profile__sub">
              {linkedCount} players in squad
              {quizReady.length > 0 ? ` · ${quizReady.length} in quizzes` : ''}
              {nationalTeam.fifaRanking != null ? ` · FIFA rank ${nationalTeam.fifaRanking}` : ''}
            </p>
            {wcRosterStatus ? (
              <p className="national-team-profile__wc-roster-status">{wcRosterStatus.label}</p>
            ) : null}
            {nationalTeam.shortHistory && (
              <p className="national-team-profile__lede">{nationalTeam.shortHistory}</p>
            )}
          </div>
        </div>
        <div className="team-profile__actions">
          {isFeatured ? (
            <Link to="/world-cup" className="btn btn--secondary">
              World Cup hub
            </Link>
          ) : null}
          {nationalityHubPath ? (
            <Link to={nationalityHubPath} className="btn btn--secondary">
              {nationalTeam.country ?? nationalTeam.displayName} players hub
            </Link>
          ) : null}
          {canLaunchNationalQuiz ? (
            <>
              <Link
                to={`/quiz?nationalTeam=${nationalTeam.id}&poolFocus=national&worldCup=prep`}
                className="btn btn--primary"
              >
                National team quiz
              </Link>
              <Link to="/quiz?theme=world-cup" className="btn btn--secondary">
                World Cup quiz pool
              </Link>
            </>
          ) : (
            <button type="button" className="btn btn--secondary" disabled>
              Quiz unlocks at {QUIZ_NATIONAL_TEAM_MIN_POOL}+ players with clues (
              {quizReady.length} so far, {squad.length} linked)
            </button>
          )}
        </div>
      </header>

      <DataTrustNotice compact />

      <NationalTeamProfileHub
        nationalTeam={nationalTeam}
        squad={squad}
        linkedCount={linkedCount}
        quizReadyCount={quizReadyCount}
      />

      <NationalTeamDiscoveryStrip
        nationalTeam={nationalTeam}
        quizReady={canLaunchNationalQuiz}
        squad={squad}
      />

      {showKeepExploring ? (
        <section className="profile__section profile-keep-exploring" aria-labelledby="nt-keep-exploring">
          <h2 id="nt-keep-exploring">Keep exploring</h2>
          {keepExploringLead ? (
            <p className="profile-keep-exploring__lead">{keepExploringLead}</p>
          ) : null}
          <EntityRelatedNav
            title="Study paths"
            links={buildNationalTeamInternalLinks({
              nationalTeam,
              quizReady: canLaunchNationalQuiz,
              squad,
            })}
            className="profile-keep-exploring__nav"
          />
        </section>
      ) : (
        <EntityRelatedNav
          links={buildNationalTeamInternalLinks({
            nationalTeam,
            quizReady: canLaunchNationalQuiz,
            squad,
          })}
        />
      )}

      {squadLoading && squadState.total >= 80 ? (
        <p className="page-loading" role="status" aria-live="polite">
          Loading squad… ({squadState.loaded}/{squadState.total})
        </p>
      ) : null}

      {showBrowseOnlyPoolBanner ? (
        <p className="national-team-profile__pool-banner" role="status">
          Browse the full player pool now—the national team quiz unlocks as more players get quiz
          clues.
        </p>
      ) : null}

      {keyPlayerCards.length > 0 ? (
        <section className="team-key-players info-card profile__section" aria-labelledby="nt-key-players">
          <div className="team-key-players__header">
            <h2 id="nt-key-players">Players to know</h2>
            <p className="team-key-players__note">
              Highest importance in the linked pool—open profiles for quiz hints, then return to
              the nation quiz.
            </p>
          </div>
          <ul className="team-key-players__grid">
            {keyPlayerCards.map((card) => (
              <li key={card.player.id}>
                <Link to={`/player/${card.player.id}`} className="team-key-players__card">
                  <PlayerVisual player={card.player} size="card" compact />
                  <span className="team-key-players__text">
                    <strong>{card.player.name}</strong>
                    <span>
                      {card.note || formatPosition(card.player.position)}
                      {card.quizReady ? ' · Quiz ready' : ''}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {nationalTeam.rivalIds?.length > 0 && (
        <section className="profile__section info-card" aria-labelledby="nt-rivals-title">
          <h2 id="nt-rivals-title">Rival nations</h2>
          {profileStructured?.rivalry ? (
            <p className="national-team-hub__prose national-team-hub__prose--tight">
              {profileStructured.rivalry}
            </p>
          ) : null}
          <ul className="national-team-profile__rivals">
            {nationalTeam.rivalIds.map((rivalId) => {
              const rival = getNationalTeamById(rivalId);
              return (
                <li key={rivalId}>
                  {rival ? (
                    <Link to={`/national-team/${rivalId}`}>{rival.displayName}</Link>
                  ) : (
                    <span className="national-team-profile__rival-pending">
                      {getRivalDisplayName(rivalId)}
                      <span className="national-team-profile__rival-note"> (page coming)</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {clubFlows.length > 0 && (
        <section className="profile__section info-card" aria-label="Nation to club learning flow">
          <h2>Club supply chains</h2>
          <p className="collections-page__section-desc">
            Clubs that supply the most linked players in this national pool—jump to squads before
            quizzing.
          </p>
          <ul className="national-team-profile__club-flows">
            {clubFlows.map((row) => (
              <li key={row.teamId}>
                <Link to={`/team/${row.teamId}`}>{row.teamName}</Link>
                <span className="national-team-profile__club-flow-count">
                  {row.count} player{row.count !== 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <TeamSquadView
        players={squad}
        teamName={nationalTeam.displayName}
        variant="national"
        getTeamName={(teamIdArg) => peekTeamName(teamIdArg)}
        eyebrow="Player pool"
        title="Squad players"
        intro={`Players linked to ${nationalTeam.displayName} from club football—sorted by importance score. Not an official tournament roster.`}
      />
    </div>
  );
}

function truncateLead(text, max = 200) {
  const t = String(text ?? '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}
