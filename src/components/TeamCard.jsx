import { Link } from 'react-router-dom';
import { getManifestLeague } from '../data/contentManifest';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteButton from './FavoriteButton';
import TeamBadge from './TeamBadge';

export default function TeamCard({ team }) {
  const { isTeamSaved, toggleTeam } = useFavorites();
  const saved = isTeamSaved(team.id);

  return (
    <article className="team-card">
      <header className="team-card__header">
        <div className="team-card__identity">
          <TeamBadge team={team} />
          <div>
            <Link to={`/league/${team.leagueId}`} className="team-card__league team-card__league-link">
              {getManifestLeague(team.leagueId)?.name ?? 'Unknown'}
            </Link>
            <h3>
              <Link to={`/team/${team.id}`} className="team-card__title-link">
                {team.name}
              </Link>
            </h3>
          </div>
        </div>
        <div className="team-card__header-actions">
          <FavoriteButton
            className="favorite-button--compact"
            itemName={team.name}
            saved={saved}
            onToggle={() => toggleTeam(team.id)}
          />
        </div>
      </header>

      <Link
        to={`/team/${team.id}`}
        className="team-card__body-link"
        aria-label={`View ${team.name} team profile`}
      >
        <dl className="team-card__facts">
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

        <div className="team-card__section">
          <h4>Rivals</h4>
          <p>{team.rivals.join(' · ')}</p>
        </div>

        <div className="team-card__section">
          <h4>History</h4>
          <p>{team.shortHistory}</p>
        </div>

        <div className="team-card__section">
          <h4>Fan guide</h4>
          <p>{team.fanGuide}</p>
        </div>

        <div className="team-card__section">
          <h4>Legends</h4>
          <ul className="tag-list">
            {team.legends.map((legend) => (
              <li key={legend}>{legend}</li>
            ))}
          </ul>
        </div>

        <div className="team-card__section">
          <h4>Current key players</h4>
          <ul className="tag-list tag-list--accent">
            {team.currentKeyPlayers.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>

        <span className="team-card__cta">Open team profile</span>
      </Link>
    </article>
  );
}
