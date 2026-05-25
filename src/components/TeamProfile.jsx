import { Link, useParams } from 'react-router-dom';
import {
  getLeagueName,
  getTeamById,
  players,
} from '../data/sampleData';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteButton from './FavoriteButton';
import PlayerCard from './PlayerCard';
import TeamBadge from './TeamBadge';

export default function TeamProfile() {
  const { teamId } = useParams();
  const team = getTeamById(teamId);
  const { isTeamSaved, toggleTeam } = useFavorites();

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

  const roster = players.filter((player) => player.teamId === team.id);
  const leagueName = getLeagueName(team.leagueId);
  const saved = isTeamSaved(team.id);
  // TODO: Replace static Fan Mode steps with saved progress from Firebase or localStorage.
  const fanPathSteps = [
    {
      label: 'Beginner',
      title: 'Learn the club basics',
      text: `${team.name} play in ${leagueName}, call ${team.stadium} home, and were founded in ${team.founded}.`,
    },
    {
      label: 'Squad',
      title: 'Know the current squad',
      text: `Browse ${roster.length} FootyBrain player card${roster.length === 1 ? '' : 's'} currently listed for this club.`,
    },
    {
      label: 'Squad',
      title: 'Know the key players',
      text: `Start with ${team.currentKeyPlayers.join(', ')}.`,
    },
    {
      label: 'History',
      title: 'Learn the rivals',
      text: `Understand why matches against ${team.rivals.join(' and ')} matter to supporters.`,
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
      <Link to="/teams" className="back-link">
        ← Back to Team Learning
      </Link>

      <header className="profile__hero profile__hero--team">
        <div className="profile__identity">
          <TeamBadge team={team} size="profile" />
          <div>
            <p className="profile__league">{leagueName}</p>
            <h1>{team.name}</h1>
            <p className="profile__sub">
              {team.country} · {team.stadium}
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
          <Link to={`/quiz?team=${team.id}`} className="btn btn--primary">
            Start Team Quiz
          </Link>
        </div>
      </header>

      <section className="profile__grid" aria-label={`${team.name} details`}>
        <article className="info-card info-card--wide fan-path">
          <div className="fan-path__header">
            <div>
              <p className="fan-path__eyebrow">Fan Mode</p>
              <h2>Learning Path</h2>
            </div>
            <div className="fan-path__actions">
              <a href="#team-roster" className="btn btn--secondary">
                Browse Roster
              </a>
              <Link to={`/quiz?team=${team.id}`} className="btn btn--primary">
                Start Team Quiz
              </Link>
            </div>
          </div>

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

        <article className="info-card">
          <h2>Club facts</h2>
          <dl className="info-list">
            <div>
              <dt>League</dt>
              <dd>{leagueName}</dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{team.country}</dd>
            </div>
            <div>
              <dt>Stadium</dt>
              <dd>{team.stadium}</dd>
            </div>
            <div>
              <dt>Founded</dt>
              <dd>{team.founded}</dd>
            </div>
          </dl>
        </article>

        <article className="info-card">
          <h2>Rivals</h2>
          <ul className="tag-list">
            {team.rivals.map((rival) => (
              <li key={rival}>{rival}</li>
            ))}
          </ul>
        </article>

        <article className="info-card info-card--wide">
          <h2>Short history</h2>
          <p>{team.shortHistory}</p>
        </article>

        <article className="info-card info-card--wide">
          <h2>Fan guide</h2>
          <p>{team.fanGuide}</p>
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

        <article id="team-roster" className="info-card info-card--wide">
          <h2>Roster</h2>
          <p className="info-card__note">
            Current FootyBrain player cards for {team.name}.
          </p>
          <div className="card-grid team-profile__roster">
            {roster.length > 0 ? (
              roster.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))
            ) : (
              <p className="empty-state">No players listed for this team yet.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
