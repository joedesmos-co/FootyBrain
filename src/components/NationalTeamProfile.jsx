import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRecordRecentView } from '../hooks/useRecordRecentView';
import { loadPlayerById } from '../data/playerStore';
import { peekTeamName } from '../data/teamStore';
import {
  countLinkedPlayers,
  getNationalTeamById,
  getMembershipRowsForNationalTeam,
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
import { getCanonicalUrl } from '../utils/jsonLd';
import { setSeoMeta } from '../utils/seoMeta';
import BreadcrumbNav from './BreadcrumbNav';

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

  useEffect(() => {
    if (!nationalTeam) return undefined;
    const canonical = getCanonicalUrl();
    if (!canonical) return undefined;
    const title = `${nationalTeam.displayName} · National team · FootyCompass`;
    const description =
      `${nationalTeam.displayName} national team—player pool linked from club squads (not an official tournament roster).`;
    setSeoMeta({
      title,
      description,
      canonicalUrl: canonical,
      og: { title, description, url: canonical, type: 'website' },
      twitter: { title, description },
    });
    return undefined;
  }, [nationalTeam]);

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

  const squadStateMatches = squadState.nationalTeamId === nationalTeam.id;
  const squad = squadStateMatches ? squadState.players : [];
  const squadLoading =
    squadStateMatches && squadState.status === 'loading' && squadState.total > 0;

  const quizReady = getQuizEligiblePlayers(squad);
  const canLaunchNationalQuiz = quizReady.length >= QUIZ_NATIONAL_TEAM_MIN_POOL;
  const wcRosterStatus = isWorldCup2026QualifiedTeam(nationalTeam.id)
    ? getWorldCup2026RosterStatus(nationalTeam.id)
    : null;
  const showBrowseOnlyPoolBanner =
    squad.length >= 8 && quizReady.length < QUIZ_NATIONAL_TEAM_MIN_POOL;

  const clubFlows = (() => {
    const counts = new Map();
    for (const player of squad) {
      counts.set(player.teamId, (counts.get(player.teamId) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([teamId, count]) => ({ teamId, count, teamName: peekTeamName(teamId) }))
      .filter((row) => row.teamName && row.teamName !== 'Unknown')
      .sort((a, b) => b.count - a.count || a.teamName.localeCompare(b.teamName))
      .slice(0, 6);
  })();

  const relatedLinks = [
    { to: '/quiz', label: 'Play quizzes' },
    { to: '/hubs', label: 'Explore hubs' },
    {
      to: `/hubs/players/nationality/${encodeURIComponent(nationalTeam.displayName)}`,
      label: 'Players by nationality hub',
    },
  ];

  return (
    <div className="page national-team-profile">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'National teams', to: '/national-teams' },
          { label: nationalTeam.displayName },
        ]}
      />

      <header className="profile__hero profile__hero--national">
        <div className="profile__identity">
          <NationalTeamBadge nationalTeam={nationalTeam} size="profile" />
          <div>
            <p className="profile__league">{nationalTeam.confederation}</p>
            <h1>{nationalTeam.displayName}</h1>
            <p className="profile__sub">
              {countLinkedPlayers(nationalTeam.id)} players in squad
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
          {FEATURED_NATIONAL_TEAM_IDS.includes(nationalTeam.id) ? (
            <Link to="/world-cup" className="btn btn--secondary">
              World Cup hub
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

      <section className="profile__section" aria-labelledby="related-discovery-title">
        <h2 id="related-discovery-title">Keep exploring</h2>
        <p className="collections-page__section-desc">
          Continue learning with discovery hubs, quizzes, and related pages.
        </p>
        <div className="empty-state__actions">
          {relatedLinks.map((link) => (
            <Link key={link.to} to={link.to} className="btn btn--secondary">
              {link.label}
            </Link>
          ))}
        </div>
      </section>

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

      {nationalTeam.fanGuide && (
        <details className="profile__section national-team-profile__fan-guide">
          <summary>Fan guide</summary>
          <p>{nationalTeam.fanGuide}</p>
        </details>
      )}

      {nationalTeam.rivalIds?.length > 0 && (
        <section className="profile__section">
          <h2>Rivals</h2>
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
        <section className="profile__section" aria-label="Nation to club learning flow">
          <h2>Nation → club flow</h2>
          <p className="collections-page__section-desc">
            Start with the national squad, then jump into the clubs that supply the most linked
            players in FootyCompass.
          </p>
          <ul className="national-team-profile__club-flows">
            {clubFlows.map((row) => (
              <li key={row.teamId}>
                <Link to={`/team/${row.teamId}`}>{row.teamName}</Link>
                <span className="national-team-profile__club-flow-count">
                  {row.count} player{row.count !== 1 ? 's' : ''} in this squad
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
