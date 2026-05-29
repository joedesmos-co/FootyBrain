import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  countLinkedPlayers,
  getLiveNationalTeamsByConfederation,
  getNationalTeamQuizReadyCount,
  isLiveNationalTeamQuizViable,
  LIVE_NATIONAL_TEAM_MIN_QUIZ,
} from '../data/nationalTeamData';
import NationalTeamBadge from './NationalTeamBadge';
import BreadcrumbNav from './BreadcrumbNav';
import { pageTitle } from '../utils/brand.js';
import { applyPageSeo, truncateMetaDescription } from '../utils/seoCtr.js';
import {
  CRUMB_HOME,
  CRUMB_NATIONAL_TEAMS,
  LINK_INTERNATIONAL_PLAYER_QUIZ,
  LINK_PLAYERS_BY_NATIONALITY,
} from '../utils/entityCopy.js';

export default function NationalTeamsPage() {
  const confederationGroups = getLiveNationalTeamsByConfederation();
  const totalLinked = confederationGroups.reduce(
    (sum, group) => sum + group.teams.reduce((s, team) => s + countLinkedPlayers(team.id), 0),
    0,
  );
  const nationCount = confederationGroups.reduce((sum, group) => sum + group.teams.length, 0);

  useEffect(() => {
    applyPageSeo({
      title: pageTitle('National teams — World Cup squads & international quizzes'),
      description: truncateMetaDescription(
        `${nationCount} men's national sides with ${totalLinked.toLocaleString()} linked club players. Browse squad identity, rivalries, and World Cup 2026 prep—or play nation quizzes on FootyCompass.`,
      ),
      breadcrumbs: [
        { name: CRUMB_HOME, item: '/' },
        { name: CRUMB_NATIONAL_TEAMS, item: '/national-teams' },
      ],
    });
  }, [nationCount, totalLinked]);

  return (
    <div className="page national-teams-page">
      <BreadcrumbNav
        items={[
          { label: CRUMB_HOME, to: '/' },
          { label: CRUMB_NATIONAL_TEAMS },
        ]}
      />
      <header className="page-header">
        <h1>National teams</h1>
        <p>
          Men&apos;s national sides in FootyCompass—squads drawn from club profiles, not official
          tournament rosters. Nation quizzes need at least {LIVE_NATIONAL_TEAM_MIN_QUIZ} players
          with clues.
        </p>
      </header>

      <p className="national-teams-page__meta">
        {nationCount} nations · {totalLinked.toLocaleString()} players in squads
      </p>

      <aside className="learning-hub-cta" aria-label="World Cup learning">
        <div className="learning-hub-cta__copy">
          <p className="learning-hub-cta__title">World Cup 2026 prep</p>
          <p>
            Featured nations, the group draw, tournament collections, and international quizzes.
          </p>
        </div>
        <div className="learning-hub-cta__actions">
          <Link to="/world-cup" className="btn btn--primary btn--small">
            World Cup 2026 prep
          </Link>
          <Link to="/hubs/players/by-nationality" className="btn btn--secondary btn--small">
            {LINK_PLAYERS_BY_NATIONALITY}
          </Link>
          <Link to="/quiz?poolFocus=international&worldCup=prep" className="btn btn--secondary btn--small">
            {LINK_INTERNATIONAL_PLAYER_QUIZ}
          </Link>
        </div>
      </aside>

      {confederationGroups.map((group) => (
        <section
          key={group.confederation}
          className="national-teams-page__section"
          aria-labelledby={`nt-confed-${group.confederation.replace(/\s+/g, '-')}`}
        >
          <h2
            id={`nt-confed-${group.confederation.replace(/\s+/g, '-')}`}
            className="national-teams-page__section-title"
          >
            {group.confederation}
          </h2>
          <ul className="national-teams-page__grid">
            {group.teams.map((team) => {
              const linked = countLinkedPlayers(team.id);
              const quizReady = getNationalTeamQuizReadyCount(team.id);
              return (
                <li key={team.id}>
                  <Link to={`/national-team/${team.id}`} className="national-teams-page__card">
                    <NationalTeamBadge nationalTeam={team} size="card" />
                    <div className="national-teams-page__card-copy">
                      <h3>{team.displayName}</h3>
                      <p>
                        {team.fifaRanking != null ? `FIFA rank ${team.fifaRanking}` : group.confederation}
                      </p>
                      <p className="national-teams-page__count">
                        {linked} players
                        {quizReady > 0 ? ` · ${quizReady} in quizzes` : ''}
                        {linked > 0 && !isLiveNationalTeamQuizViable(team.id) ? (
                          <span className="national-teams-page__quiz-pending">
                            {' '}
                            · pool available · quiz unlocks at {LIVE_NATIONAL_TEAM_MIN_QUIZ}+
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
