import { Link } from 'react-router-dom';
import { players, teams } from '../data/sampleData';
import { useFavorites } from '../hooks/useFavorites';
import { useLearningRecommendations } from '../hooks/useLearningRecommendations';
import PlayerCard from './PlayerCard';
import RecommendationsPanel from './RecommendationsPanel';
import TeamCard from './TeamCard';

export default function SavedPage() {
  const { favorites } = useFavorites();
  const recommendations = useLearningRecommendations();
  const savedPlayers = players.filter((player) => favorites.players.includes(player.id));
  const savedTeams = teams.filter((team) => favorites.teams.includes(team.id));
  const hasSavedItems = savedPlayers.length > 0 || savedTeams.length > 0;

  return (
    <div className="page saved-page">
      <header className="page-header">
        <h1>Saved to Learn</h1>
        <p>Players and clubs you bookmarked on this device.</p>
      </header>

      {hasSavedItems && (
        <RecommendationsPanel
          recommendations={recommendations}
          title="What to learn next"
          compact
        />
      )}

      {!hasSavedItems && (
        <section className="empty-state" aria-label="Nothing saved yet">
          <p>Nothing saved yet. Use Save on any player or club profile.</p>
          <div className="empty-state__actions">
            <Link to="/browse" className="btn btn--primary">
              Browse players
            </Link>
            <Link to="/teams" className="btn btn--secondary">
              Explore teams
            </Link>
          </div>
        </section>
      )}

      {savedPlayers.length > 0 && (
        <section className="saved-section" aria-labelledby="saved-players-title">
          <div className="saved-section__header">
            <h2 id="saved-players-title">Saved players</h2>
            <span>{savedPlayers.length}</span>
          </div>
          <div className="card-grid">
            {savedPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </section>
      )}

      {savedTeams.length > 0 && (
        <section className="saved-section" aria-labelledby="saved-teams-title">
          <div className="saved-section__header">
            <h2 id="saved-teams-title">Saved teams</h2>
            <span>{savedTeams.length}</span>
          </div>
          <div className="team-grid">
            {savedTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
