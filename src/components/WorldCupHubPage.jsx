import { Link } from 'react-router-dom';
import {
  getNationalTeamLearningCollections,
  getWorldCupCollections,
} from '../data/collectionsData';
import {
  getLearningPathForNationalTeam,
  getWorldCupHubLearningPaths,
} from '../data/learningPathsData';
import {
  getFeaturedNationalTeams,
  getTournamentLegendsSpotlight,
  getTournamentStarsSpotlight,
  getTopQuizNations,
  getWorldCupHubStats,
  getWorldCupTopPlayers,
  WORLD_CUP_HUB_META,
} from '../data/worldCupHubData';
import {
  getWorldCup2026Groups,
  getWorldCupDrawNationBadgeLabel,
  WORLD_CUP_DRAW_POOL_COVERAGE_NOTE,
} from '../data/worldCup2026Prep';
import { getWorldCup2026RosterStatus } from '../data/worldCup2026Rosters';
import {
  countLinkedPlayers,
  getNationalTeamQuizReadyCount,
  isLiveNationalTeamQuizViable,
} from '../data/nationalTeamData';
import { useCollectionProgress } from '../hooks/useCollectionProgress';
import {
  getCountryQuizHref,
  getInternationalQuizHref,
  getWorldCupCollectionQuizHref,
} from '../utils/worldCupQuizPools';
import CollectionCard from './CollectionCard';
import LearningPathCard from './LearningPathCard';
import NationalTeamBadge from './NationalTeamBadge';
import WorldCupPlayerSpotlight from './WorldCupPlayerSpotlight';

function WorldCupNationActions({ team }) {
  const learnPath = getLearningPathForNationalTeam(team.id);
  const quizViable = isLiveNationalTeamQuizViable(team.id);

  return (
    <div className="world-cup-nation-card__actions">
      {learnPath ? (
        <Link
          to={`/learning-paths/${learnPath.id}`}
          className="btn btn--primary btn--small"
        >
          Learn {team.displayName}
        </Link>
      ) : (
        <Link to={`/national-team/${team.id}`} className="btn btn--primary btn--small">
          Open national pool
        </Link>
      )}
      <Link to={`/national-team/${team.id}`} className="btn btn--secondary btn--small">
        National page
      </Link>
      {quizViable ? (
        <Link to={getCountryQuizHref(team.id)} className="btn btn--secondary btn--small">
          Quiz
        </Link>
      ) : null}
    </div>
  );
}

function CollectionPlayerStrip({ players }) {
  if (!players.length) return null;
  return (
    <ul className="card-grid world-cup-hub__player-grid">
      {players.map(({ player, note }) => (
        <li key={player.id}>
          <WorldCupPlayerSpotlight player={player} note={note} />
        </li>
      ))}
    </ul>
  );
}

export default function WorldCupHubPage() {
  const { getProgress } = useCollectionProgress();
  const featuredNations = getFeaturedNationalTeams();
  const topQuizNations = getTopQuizNations(10);
  const groups = getWorldCup2026Groups();
  const nationalTeamLearningCollections = getNationalTeamLearningCollections();
  const worldCupCollections = getWorldCupCollections().filter(
    (c) =>
      c.id !== 'world-cup-stars' &&
      !nationalTeamLearningCollections.some((nt) => nt.id === c.id),
  );
  const hubPaths = getWorldCupHubLearningPaths();
  const legends = getTournamentLegendsSpotlight();
  const tournamentStars = getTournamentStarsSpotlight();
  const { collection: starsCollection, players: topPlayers } = getWorldCupTopPlayers();
  const stats = getWorldCupHubStats();

  return (
    <div className="page world-cup-hub">
      <header className="page-header world-cup-hub__header">
        <p className="page-header__eyebrow">{WORLD_CUP_HUB_META.eyebrow}</p>
        <h1>{WORLD_CUP_HUB_META.title}</h1>
        <p>{WORLD_CUP_HUB_META.lede}</p>
        <p className="world-cup-hub__format">{WORLD_CUP_HUB_META.formatNote}</p>
        <p className="world-cup-hub__hosts">
          Hosts: {WORLD_CUP_HUB_META.hosts.join(' · ')}
        </p>
      </header>

      <aside className="world-cup-hub__prep" aria-label="World Cup prep notice">
        <p className="world-cup-hub__prep-title">Prep mode</p>
        <p>{WORLD_CUP_HUB_META.prepNote}</p>
        <p className="world-cup-hub__stats" aria-label="Hub stats">
          {stats.groupCount} groups · {stats.teamCount} nations in the draw ·{' '}
          {stats.liveInDraw} live national pools · {stats.poolNotAddedInDraw} pool pages not added
          yet · {stats.quizViableCount} nations with quizzes ·{' '}
          {stats.quizReadyMemberships.toLocaleString()} quiz-ready players in featured pools
        </p>
        <div className="world-cup-hub__prep-actions">
          <Link to={getInternationalQuizHref()} className="btn btn--primary btn--small">
            International quiz
          </Link>
          <Link to="/national-teams" className="btn btn--secondary btn--small">
            All national teams
          </Link>
          <Link to="/learning-paths" className="btn btn--secondary btn--small">
            Learning paths
          </Link>
          <Link to="/collections" className="btn btn--secondary btn--small">
            Collections
          </Link>
        </div>
      </aside>

      <section className="world-cup-hub__section" aria-labelledby="wc-featured-nations">
        <div className="collections-page__section-head">
          <h2 id="wc-featured-nations" className="collections-section-title">
            Featured nations
          </h2>
          <Link to="/national-teams" className="collections-page__section-link">
            View all live nations
          </Link>
        </div>
        <p className="collections-page__section-desc">
          Hosts and title contenders with live national pages. World Cup rosters are separate from the
          broad national player pool.
        </p>
        <ul className="world-cup-nation-card-grid">
          {featuredNations.map((team) => {
            const linked = countLinkedPlayers(team.id);
            const quizReady = getNationalTeamQuizReadyCount(team.id);
            const learnPath = getLearningPathForNationalTeam(team.id);
            const rosterStatus = getWorldCup2026RosterStatus(team.id);
            return (
              <li key={team.id} className="world-cup-nation-card">
                <Link
                  to={`/national-team/${team.id}`}
                  className="world-cup-nation-card__main"
                >
                  <NationalTeamBadge nationalTeam={team} size="card" />
                  <div className="world-cup-nation-card__copy">
                    <h3>{team.displayName}</h3>
                    <p>
                      {team.confederation}
                      {team.fifaRanking != null ? ` · FIFA rank ${team.fifaRanking}` : ''}
                    </p>
                    <p className="world-cup-nation-card__meta">
                      {linked} linked
                      {quizReady > 0 ? ` · ${quizReady} in quizzes` : ''}
                      {' · '}
                      {rosterStatus.label}
                    </p>
                  </div>
                </Link>
                <WorldCupNationActions team={team} />
                {learnPath ? (
                  <p className="world-cup-nation-card__path-hint">
                    <Link to={`/learning-paths/${learnPath.id}`}>
                      {learnPath.title}
                    </Link>
                    {' · '}
                    {learnPath.steps.length} steps
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="world-cup-hub__section" aria-labelledby="wc-top-quiz">
        <h2 id="wc-top-quiz" className="collections-section-title">
          Top quiz nations
        </h2>
        <p className="collections-page__section-desc">
          Live nations with the deepest quiz pools (minimum three players with clues).
        </p>
        <ol className="world-cup-quiz-nations">
          {topQuizNations.map((meta, index) => {
            const learnPath = getLearningPathForNationalTeam(meta.nationalTeamId);
            return (
            <li key={meta.nationalTeamId} className="world-cup-quiz-nations__row">
              <span className="world-cup-quiz-nations__rank" aria-hidden="true">
                {index + 1}
              </span>
              <div className="world-cup-quiz-nations__body">
                <Link to={`/national-team/${meta.nationalTeamId}`}>
                  <strong>{meta.displayName}</strong>
                </Link>
                <p>
                  {meta.quizReadyCount} quiz-ready · up to {meta.sessionCap} per session
                </p>
              </div>
              <div className="world-cup-quiz-nations__actions">
                {learnPath ? (
                  <Link
                    to={`/learning-paths/${learnPath.id}`}
                    className="btn btn--secondary btn--small"
                  >
                    Learn country
                  </Link>
                ) : null}
                <Link
                  to={getCountryQuizHref(meta.nationalTeamId)}
                  className="btn btn--primary btn--small"
                >
                  Quiz
                </Link>
              </div>
            </li>
            );
          })}
        </ol>
      </section>

      <section className="world-cup-hub__section" aria-labelledby="wc-groups">
        <h2 id="wc-groups" className="collections-section-title">
          Groups prep
        </h2>
        <p className="collections-page__section-desc">
          2026 group draw for orientation — open live nation pages or use Learn country when a path
          exists. Each live page is a broad national player pool, not an official World Cup roster
          (tournament rosters stay TBD).
        </p>
        <p className="world-cup-hub__draw-coverage" role="note">
          {WORLD_CUP_DRAW_POOL_COVERAGE_NOTE}
        </p>
        <div className="world-cup-groups-grid">
          {groups.map((group) => (
            <article key={group.groupId} className="world-cup-group-card">
              <h3 className="world-cup-group-card__title">{group.label}</h3>
              <ul className="world-cup-group-card__teams">
                {group.nations.map((nation) => (
                  <li key={nation.id} className="world-cup-group-card__team">
                    {nation.profileHref ? (
                      <Link to={nation.profileHref}>{nation.displayName}</Link>
                    ) : (
                      <span>{nation.displayName}</span>
                    )}
                    <span
                      className={
                        nation.isLive
                          ? 'world-cup-group-card__badge world-cup-group-card__badge--live'
                          : 'world-cup-group-card__badge world-cup-group-card__badge--pending'
                      }
                    >
                      {getWorldCupDrawNationBadgeLabel(nation)}
                    </span>
                    {nation.learnPathId ? (
                      <Link
                        to={`/learning-paths/${nation.learnPathId}`}
                        className="world-cup-group-card__learn"
                      >
                        Learn
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="world-cup-hub__section" aria-labelledby="wc-legends">
        <div className="collections-page__section-head">
          <h2 id="wc-legends" className="collections-section-title">
            Tournament legends
          </h2>
          {legends.collection ? (
            <Link
              to={`/collections/${legends.collection.id}`}
              className="collections-page__section-link"
            >
              {legends.collection.title}
            </Link>
          ) : null}
        </div>
        <p className="collections-page__section-desc">
          Winners, Golden Boot, and Golden Glove stories — quiz names from 2010 through 2022.
        </p>
        {legends.collection ? (
          <div className="world-cup-hub__collection-cta">
            <CollectionCard
              collection={legends.collection}
              progress={getProgress(legends.collection.id, legends.collection.items.length)}
            />
            <div className="world-cup-hub__collection-cta-actions">
              <Link
                to={`/learning-paths/learn-world-cup-legends`}
                className="btn btn--secondary btn--small"
              >
                Learning path
              </Link>
              <Link
                to={getWorldCupCollectionQuizHref(legends.collection.id)}
                className="btn btn--primary btn--small"
              >
                Legends quiz
              </Link>
            </div>
          </div>
        ) : null}
        <CollectionPlayerStrip players={legends.players} />
      </section>

      <section className="world-cup-hub__section" aria-labelledby="wc-tournament-stars">
        <div className="collections-page__section-head">
          <h2 id="wc-tournament-stars" className="collections-section-title">
            Tournament stars
          </h2>
          {tournamentStars.collection ? (
            <Link
              to={`/collections/${tournamentStars.collection.id}`}
              className="collections-page__section-link"
            >
              {tournamentStars.collection.title}
            </Link>
          ) : null}
        </div>
        <p className="collections-page__section-desc">
          Final heroes and breakout nights — compare profiles, then quiz a national pool.
        </p>
        {tournamentStars.collection ? (
          <div className="world-cup-hub__collection-cta">
            <CollectionCard
              collection={tournamentStars.collection}
              progress={getProgress(
                tournamentStars.collection.id,
                tournamentStars.collection.items.length,
              )}
            />
            <div className="world-cup-hub__collection-cta-actions">
              <Link
                to="/learning-paths/learn-tournament-stars"
                className="btn btn--secondary btn--small"
              >
                Learning path
              </Link>
              <Link
                to={getWorldCupCollectionQuizHref(tournamentStars.collection.id)}
                className="btn btn--primary btn--small"
              >
                Stars quiz
              </Link>
            </div>
          </div>
        ) : null}
        <CollectionPlayerStrip players={tournamentStars.players} />
      </section>

      <section className="world-cup-hub__section" aria-labelledby="wc-collections-nt">
        <h2 id="wc-collections-nt" className="collections-section-title">
          World Cup collections
        </h2>
        <p className="collections-page__section-desc world-cup-hub__subsection-lead">
          National team learning — legends, generations, captains, and midfield study lists.
        </p>
        <ul className="collections-grid collections-grid--compact">
          {nationalTeamLearningCollections.map((collection) => (
            <li key={collection.id}>
              <CollectionCard
                collection={collection}
                progress={getProgress(collection.id, collection.items.length)}
              />
            </li>
          ))}
        </ul>
        <p className="collections-page__section-desc world-cup-hub__subsection-lead">
          Contenders, recent winners, and watchlists for 2026 prep.
        </p>
        <ul className="collections-grid collections-grid--compact">
          {worldCupCollections.map((collection) => (
            <li key={collection.id}>
              <CollectionCard
                collection={collection}
                progress={getProgress(collection.id, collection.items.length)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="world-cup-hub__section" aria-labelledby="wc-paths">
        <div className="collections-page__section-head">
          <h2 id="wc-paths" className="collections-section-title">
            WC-ready learning paths
          </h2>
          <Link to="/learning-paths" className="collections-page__section-link">
            All paths
          </Link>
        </div>
        <p className="collections-page__section-desc">
          Country routes and tournament arcs — collection, profiles, then a gated national quiz.
        </p>
        <ul className="learning-paths-grid learning-paths-grid--compact">
          {hubPaths.map((path) => (
            <li key={path.id}>
              <LearningPathCard path={path} />
            </li>
          ))}
        </ul>
      </section>

      <section className="world-cup-hub__section" aria-labelledby="wc-top-players">
        <div className="collections-page__section-head">
          <h2 id="wc-top-players" className="collections-section-title">
            World Cup stars
          </h2>
          {starsCollection ? (
            <Link
              to={`/collections/${starsCollection.id}`}
              className="collections-page__section-link"
            >
              {starsCollection.title}
            </Link>
          ) : null}
        </div>
        <p className="collections-page__section-desc">
          Headline names from the quiz pool — open profiles or study the full collection.
        </p>
        <CollectionPlayerStrip players={topPlayers} />
        <p className="world-cup-hub__footer-actions">
          <Link to="/compare" className="btn btn--secondary btn--small">
            Compare players
          </Link>
          {starsCollection ? (
            <Link
              to={getWorldCupCollectionQuizHref(starsCollection.id)}
              className="btn btn--secondary btn--small"
            >
              Stars quiz
            </Link>
          ) : null}
        </p>
      </section>
    </div>
  );
}
