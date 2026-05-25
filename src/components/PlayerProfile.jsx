import { Link, useParams } from 'react-router-dom';
import { getLeagueName, getPlayerById, getTeamName } from '../data/sampleData';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteButton from './FavoriteButton';

export default function PlayerProfile() {
  const { playerId } = useParams();
  const player = getPlayerById(playerId);
  const { isPlayerSaved, togglePlayer } = useFavorites();

  if (!player) {
    return (
      <div className="page">
        <p className="empty-state">Player not found.</p>
        <Link to="/browse" className="btn btn--secondary">
          Back to browse
        </Link>
      </div>
    );
  }

  // Future: useEffect + fetchPlayer(playerId) for live API/Firebase data
  const saved = isPlayerSaved(player.id);

  return (
    <div className="page profile">
      <Link to="/browse" className="back-link">
        ← Back to database
      </Link>

      <header className="profile__hero">
        <div>
          <p className="profile__league">{getLeagueName(player.leagueId)}</p>
          <h1>{player.name}</h1>
          <p className="profile__sub">
            {player.position} · {getTeamName(player.teamId)}
          </p>
        </div>
        <div className="profile__side-actions">
          <div className="profile__score-block">
            <span className="profile__score-label">FootyBrain Rating</span>
            <span className="profile__score-value">{player.importanceScore}</span>
          </div>
          <FavoriteButton
            itemName={player.name}
            saved={saved}
            onToggle={() => togglePlayer(player.id)}
          />
        </div>
      </header>

      <section className="profile__grid">
        <article className="info-card">
          <h2>Overview</h2>
          <dl className="info-list">
            <div>
              <dt>Age</dt>
              <dd>{player.age}</dd>
            </div>
            <div>
              <dt>Nationality</dt>
              <dd>{player.nationality}</dd>
            </div>
            <div>
              <dt>Position</dt>
              <dd>{player.position}</dd>
            </div>
            <div>
              <dt>Current club</dt>
              <dd>{getTeamName(player.teamId)}</dd>
            </div>
            <div>
              <dt>National team</dt>
              <dd>{player.nationalTeam}</dd>
            </div>
          </dl>
        </article>

        <article className="info-card">
          <h2>Playing style</h2>
          <p>{player.playingStyle}</p>
        </article>

        <article className="info-card info-card--wide">
          <h2>Quick fact</h2>
          <p className="highlight-fact">{player.quickFact}</p>
        </article>

        <article className="info-card info-card--wide">
          <h2>Career history</h2>
          <ul className="career-list">
            {player.careerHistory.map((entry) => (
              <li key={`${entry.club}-${entry.years}`}>
                <span className="career-list__club">{entry.club}</span>
                <span className="career-list__years">{entry.years}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="info-card info-card--wide">
          <h2>Quiz hints</h2>
          <p className="info-card__note">Use these when practicing in Quiz Mode:</p>
          <ul className="hint-list">
            {player.quizHints.map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
          <Link to="/quiz" className="btn btn--primary">
            Practice in Quiz Mode
          </Link>
        </article>
      </section>
    </div>
  );
}
