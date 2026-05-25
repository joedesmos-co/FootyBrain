import { Link } from 'react-router-dom';
import { getTeamName } from '../data/sampleData';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteButton from './FavoriteButton';

export default function PlayerCard({ player }) {
  const { isPlayerSaved, togglePlayer } = useFavorites();
  const saved = isPlayerSaved(player.id);

  return (
    <article className="player-card">
      <div className="player-card__header">
        <h3 className="player-card__name">{player.name}</h3>
        <div className="player-card__actions">
          <span className="player-card__score" title="FootyBrain Importance Score">
            {player.importanceScore}
          </span>
          <FavoriteButton
            className="favorite-button--compact"
            itemName={player.name}
            saved={saved}
            onToggle={() => togglePlayer(player.id)}
          />
        </div>
      </div>
      <dl className="player-card__meta">
        <div>
          <dt>Position</dt>
          <dd>{player.position}</dd>
        </div>
        <div>
          <dt>Club</dt>
          <dd>{getTeamName(player.teamId)}</dd>
        </div>
        <div>
          <dt>National team</dt>
          <dd>{player.nationalTeam}</dd>
        </div>
        <div>
          <dt>Nationality</dt>
          <dd>{player.nationality}</dd>
        </div>
      </dl>
      <p className="player-card__fact">{player.quickFact}</p>
      <Link to={`/player/${player.id}`} className="player-card__link">
        View profile
      </Link>
    </article>
  );
}
