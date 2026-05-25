import { Link, useParams } from 'react-router-dom';
import {
  getLeagueById,
  players,
  teams,
} from '../data/sampleData';
import LeagueBadge from './LeagueBadge';
import PlayerCard from './PlayerCard';
import TeamCard from './TeamCard';

export default function LeagueProfile() {
  const { leagueId } = useParams();
  const league = getLeagueById(leagueId);

  if (!league) {
    return (
      <div className="page">
        <p className="empty-state">League not found.</p>
        <Link to="/browse" className="btn btn--secondary">
          Back to Browse Database
        </Link>
      </div>
    );
  }

  const leagueTeams = teams.filter((team) => team.leagueId === league.id);
  const leaguePlayers = players.filter((player) => player.leagueId === league.id);
  const keyPlayers = [...leaguePlayers]
    .sort((a, b) => b.importanceScore - a.importanceScore)
    .slice(0, 6);
  const learningSteps = [
    {
      label: 'Basics',
      title: 'Understand the league',
      text: league.description,
    },
    {
      label: 'Clubs',
      title: 'Know the top clubs',
      text: `Start with ${league.famousClubs.slice(0, 4).join(', ')}.`,
    },
    {
      label: 'Rivalries',
      title: 'Learn the rivalries',
      text: league.rivalries.length
        ? `Recognize fixtures like ${league.rivalries.slice(0, 3).join(', ')}.`
        : 'Watch how regional and title-race matchups shape the season.',
    },
    {
      label: 'Stars',
      title: 'Know the star players',
      text: `Build recall around ${league.famousPlayers.slice(0, 4).join(', ')}.`,
    },
    {
      label: 'Quiz',
      title: 'Take a league quiz',
      text: 'Practice names, positions, clubs, and hints from this league.',
    },
  ];

  return (
    <div className="page league-profile">
      <Link to="/browse" className="back-link">
        ← Back to Browse Database
      </Link>

      <header className="profile__hero profile__hero--league">
        <div className="profile__identity">
          <LeagueBadge league={league} size="profile" />
          <div>
            <p className="profile__league">{league.country}</p>
            <h1>{league.name}</h1>
            <p className="profile__sub">
              {leagueTeams.length} teams · {leaguePlayers.length} players in FootyBrain
            </p>
          </div>
        </div>
        <div className="team-profile__actions">
          <Link to={`/quiz?league=${league.id}`} className="btn btn--primary">
            Start League Quiz
          </Link>
          <a href="#league-teams" className="btn btn--secondary">
            Browse Teams
          </a>
        </div>
      </header>

      <section className="profile__grid" aria-label={`${league.name} league details`}>
        <article className="info-card info-card--wide league-learning-path">
          <div className="fan-path__header">
            <div>
              <p className="fan-path__eyebrow">Learn This League</p>
              <h2>Learning Path</h2>
            </div>
            <Link to={`/quiz?league=${league.id}`} className="btn btn--primary">
              Start League Quiz
            </Link>
          </div>

          <ol className="fan-path__steps">
            {learningSteps.map((step, index) => (
              <li key={step.title} className="fan-path__step">
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

        <article className="info-card info-card--wide">
          <h2>League overview</h2>
          <p>{league.description}</p>
        </article>

        <article className="info-card info-card--wide">
          <h2>Style of play</h2>
          <p>{league.styleOfPlay}</p>
        </article>

        <article className="info-card">
          <h2>Famous clubs</h2>
          <ul className="tag-list tag-list--accent">
            {league.famousClubs.map((club) => (
              <li key={club}>{club}</li>
            ))}
          </ul>
        </article>

        <article className="info-card">
          <h2>Famous players</h2>
          <ul className="tag-list">
            {league.famousPlayers.map((player) => (
              <li key={player}>{player}</li>
            ))}
          </ul>
        </article>

        <article className="info-card info-card--wide">
          <h2>History summary</h2>
          <p>{league.historySummary}</p>
        </article>

        <article className="info-card">
          <h2>Rivalries to know</h2>
          {league.rivalries.length > 0 ? (
            <ul className="tag-list tag-list--accent">
              {league.rivalries.map((rivalry) => (
                <li key={rivalry}>{rivalry}</li>
              ))}
            </ul>
          ) : (
            <p>No major rivalry notes yet.</p>
          )}
        </article>

        <article className="info-card">
          <h2>Beginner fan guide</h2>
          <p>{league.fanGuide}</p>
        </article>

        <article id="league-teams" className="info-card info-card--wide">
          <h2>Teams in this league</h2>
          <p className="info-card__note">
            Open a club to learn its facts, fan culture, legends, and roster.
          </p>
          <div className="team-grid league-profile__teams">
            {leagueTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </article>

        <article className="info-card info-card--wide">
          <h2>Key players from this league</h2>
          <p className="info-card__note">
            Highest FootyBrain Importance Score players currently listed in {league.name}.
          </p>
          <div className="card-grid league-profile__players">
            {keyPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
