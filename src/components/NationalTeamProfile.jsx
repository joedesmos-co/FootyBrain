import { Link, useParams } from 'react-router-dom';
import { useRecordRecentView } from '../hooks/useRecordRecentView';
import { getTeamById, getTeamName } from '../data/sampleData';
import {
  countLinkedPlayers,
  getNationalTeamById,
  getPlayersForNationalTeam,
} from '../data/nationalTeamData';
import { getQuizEligiblePlayers } from '../utils/quizEligibility';
import { QUIZ_NATIONAL_TEAM_MIN_POOL } from '../utils/quizSession';
import NationalTeamBadge from './NationalTeamBadge';
import DataTrustNotice from './DataTrustNotice';
import { FEATURED_NATIONAL_TEAM_IDS } from '../data/worldCupHubData';
import TeamSquadView from './TeamSquadView';

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

  if (!nationalTeam) {
    return (
      <div className="page">
        <p className="empty-state">National team not found.</p>
        <Link to="/national-teams" className="btn btn--secondary">
          Back to national teams
        </Link>
      </div>
    );
  }

  const squad = getPlayersForNationalTeam(nationalTeam.id);
  const quizReady = getQuizEligiblePlayers(squad);
  const canLaunchNationalQuiz = quizReady.length >= QUIZ_NATIONAL_TEAM_MIN_POOL;

  const clubFlows = (() => {
    const counts = new Map();
    for (const player of squad) {
      counts.set(player.teamId, (counts.get(player.teamId) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([teamId, count]) => ({ teamId, count, team: getTeamById(teamId) }))
      .filter((row) => row.team)
      .sort((a, b) => b.count - a.count || a.team.name.localeCompare(b.team.name))
      .slice(0, 6);
  })();

  return (
    <div className="page national-team-profile">
      <Link to="/national-teams" className="back-link">
        ← National teams
      </Link>

      <header className="profile__hero profile__hero--national">
        <div className="profile__identity">
          <NationalTeamBadge nationalTeam={nationalTeam} size="profile" />
          <div>
            <p className="profile__league">{nationalTeam.confederation}</p>
            <h1>{nationalTeam.displayName}</h1>
            <p className="profile__sub">
              {countLinkedPlayers(nationalTeam.id)} players in database
              {quizReady.length > 0 ? ` · ${quizReady.length} quiz-ready` : ''}
              {nationalTeam.fifaRanking != null ? ` · FIFA rank ${nationalTeam.fifaRanking}` : ''}
            </p>
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
            <Link
              to={`/quiz?nationalTeam=${nationalTeam.id}&poolFocus=national&worldCup=prep`}
              className="btn btn--primary"
            >
              National team quiz
            </Link>
          ) : (
            <button type="button" className="btn btn--secondary" disabled>
              Quiz needs {QUIZ_NATIONAL_TEAM_MIN_POOL}+ quiz-ready (
              {quizReady.length} ready, {squad.length} linked)
            </button>
          )}
        </div>
      </header>

      <DataTrustNotice compact />

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
            players in FootyBrain.
          </p>
          <ul className="national-team-profile__club-flows">
            {clubFlows.map((row) => (
              <li key={row.teamId}>
                <Link to={`/team/${row.teamId}`}>{row.team.name}</Link>
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
        getTeamName={getTeamName}
        eyebrow="Squad database"
        title="Linked players"
        intro={`Broad ${nationalTeam.displayName} national player pool in FootyBrain (citizenship and Transfermarkt senior listings) — not an official World Cup roster. Sorted by Importance Score.`}
      />
    </div>
  );
}
