import { memo } from 'react';
import { Link } from 'react-router-dom';
import CountryFlag from './CountryFlag';
import PositionLabel from './PositionLabel';

/**
 * Lightweight player tile for World Cup hub strips — avoids PlayerCard / favorites churn.
 */
function WorldCupPlayerSpotlight({ player, note }) {
  const clubLabel = player.teamName ?? '—';

  return (
    <article className="world-cup-player-spotlight">
      <div className="world-cup-player-spotlight__head">
        <PositionLabel position={player.position} className="world-cup-player-spotlight__role" />
        <span className="world-cup-player-spotlight__score" title="FootyCompass importance score">
          {player.importanceScore}
        </span>
      </div>
      <h3 className="world-cup-player-spotlight__name">{player.name}</h3>
      <p className="world-cup-player-spotlight__meta">
        {clubLabel}
        {' · '}
        <CountryFlag label={player.nationalTeam} />
        {player.nationalTeam || '—'}
      </p>
      {note ? <p className="world-cup-player-spotlight__note">{note}</p> : null}
      <Link to={`/player/${player.id}`} className="world-cup-player-spotlight__link">
        View profile
      </Link>
    </article>
  );
}

export default memo(WorldCupPlayerSpotlight);
