import { memo } from 'react';
import { Link } from 'react-router-dom';
import { getTeamName } from '../data/sampleData';
import { getCardQuickFact } from '../utils/playerEditorial';
import { useFavorites } from '../hooks/useFavorites';
import CountryFlag from './CountryFlag';
import FavoriteButton from './FavoriteButton';
import PlayerVisual from './PlayerVisual';
import PositionLabel from './PositionLabel';

function PlayerCard({ player }) {
  const { isPlayerSaved, togglePlayer } = useFavorites();
  const saved = isPlayerSaved(player.id);

  return (
    <article className="player-card">
      <PlayerVisual player={player} />
      <div className="player-card__header">
        <div>
          <PositionLabel position={player.position} className="player-card__position-pill" />
          <h3 className="player-card__name">{player.name}</h3>
        </div>
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
          <dt>Club</dt>
          <dd>{getTeamName(player.teamId)}</dd>
        </div>
        <div>
          <dt>National team</dt>
          <dd className="football-meta-line">
            <CountryFlag label={player.nationalTeam} />
            {player.nationalTeam || '—'}
          </dd>
        </div>
        <div>
          <dt>Nationality</dt>
          <dd className="football-meta-line">
            <CountryFlag label={player.nationality} />
            {player.nationality || '—'}
          </dd>
        </div>
        <div>
          <dt>Age</dt>
          <dd>{player.age}</dd>
        </div>
      </dl>
      <p className="player-card__fact">{getCardQuickFact(player)}</p>
      <Link to={`/player/${player.id}`} className="player-card__link">
        View profile
      </Link>
    </article>
  );
}

export default memo(PlayerCard);
