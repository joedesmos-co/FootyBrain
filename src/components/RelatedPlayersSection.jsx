import { Link } from 'react-router-dom';
import { getTeamName } from '../data/sampleData';
import PlayerVisual from './PlayerVisual';

export default function RelatedPlayersSection({
  suggestions,
  title = 'Related players',
  headingId = 'player-related-title',
}) {
  if (!suggestions?.length) return null;

  return (
    <section className="info-card player-related" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <ul className="player-related__list">
        {suggestions.map(({ player, reasonLabel }) => (
          <li key={player.id}>
            <Link to={`/player/${player.id}`} className="player-related__item">
              <PlayerVisual player={player} size="thumb" />
              <span className="player-related__copy">
                <strong>{player.name}</strong>
                <span>{getTeamName(player.teamId)}</span>
                {reasonLabel && (
                  <span className="player-related__tag">{reasonLabel}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
