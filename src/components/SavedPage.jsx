import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useLearningRecommendations } from '../hooks/useLearningRecommendations';
import { useSearchIndex } from '../hooks/useSearchIndex';
import PlayerCard from './PlayerCard';
import RecommendationsPanel from './RecommendationsPanel';
import TeamCard from './TeamCard';
import EmptyState from './ui/EmptyState';

export default function SavedPage() {
  const { favorites } = useFavorites();
  const recommendations = useLearningRecommendations();
  const { index, status: indexStatus } = useSearchIndex();

  const savedPlayers =
    indexStatus === 'ready'
      ? index.players.filter((player) => favorites.players.includes(player.id)).map((p) => ({
          // Adapt lightweight index entry to PlayerCard's expected fields.
          id: p.id,
          name: p.name,
          teamId: p.teamId,
          leagueId: p.leagueId,
          position: p.position,
          nationalTeam: p.nationalTeam,
          nationality: p.nationality,
          importanceScore: p.importanceScore ?? 0,
          visualTheme: p.visualTheme,
          _teamName: p.teamName,
        }))
      : [];

  const savedTeams =
    indexStatus === 'ready'
      ? index.teams.filter((team) => favorites.teams.includes(team.id))
      : [];
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
        <EmptyState
          title="Nothing saved yet. Use Save on any player or club profile."
          actions={
            <>
              <Link to="/browse" className="btn btn--primary">
                Browse players
              </Link>
              <Link to="/teams" className="btn btn--secondary">
                Explore clubs
              </Link>
            </>
          }
        />
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
