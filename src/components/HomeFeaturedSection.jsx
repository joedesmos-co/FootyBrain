import { Link } from 'react-router-dom';
import { getLeagueName, getTeamName } from '../data/sampleData';
import { getDisplayQuickFact } from '../utils/playerEditorial';
import { truncateNote } from '../utils/dailyFeatured';
import NationalTeamBadge from './NationalTeamBadge';
import PlayerVisual from './PlayerVisual';
import PositionLabel from './PositionLabel';
import TeamBadge from './TeamBadge';

function FeaturedPlayerCard({ player, priority = false }) {
  const clubName = getTeamName(player.teamId);

  const note = truncateNote(getDisplayQuickFact(player), 58);

  return (
    <li>
      <Link
        to={`/player/${player.id}`}
        className="today-picks-card today-picks-card--player"
        aria-label={`${player.name}, ${player.position}, ${clubName}`}
      >
        <span className="today-picks-card__visual" aria-hidden="true">
          <PlayerVisual player={player} size="card" priority={priority} />
        </span>
        <div className="today-picks-card__body">
          <PositionLabel position={player.position} className="today-picks-card__pill" />
          <span className="today-picks-card__title">{player.name}</span>
          <span className="today-picks-card__meta">{clubName}</span>
          {note && <p className="today-picks-card__note">{note}</p>}
        </div>
      </Link>
    </li>
  );
}

function FeaturedTeamCard({ team }) {
  const leagueName = getLeagueName(team.leagueId);
  const note = truncateNote(team.fanGuide || team.shortHistory, 58);

  return (
    <li>
      <Link
        to={`/team/${team.id}`}
        className="today-picks-card today-picks-card--team"
        aria-label={`${team.name}, ${leagueName}, ${team.country}`}
      >
        <span className="today-picks-card__visual" aria-hidden="true">
          <TeamBadge team={team} />
        </span>
        <div className="today-picks-card__body">
          <span className="today-picks-card__title">{team.name}</span>
          <span className="today-picks-card__meta">
            {leagueName} · {team.country}
          </span>
          {note && <p className="today-picks-card__note">{note}</p>}
        </div>
      </Link>
    </li>
  );
}

function FeaturedNationalTeamCard({ nationalTeam }) {
  const note = truncateNote(nationalTeam.fanGuide || nationalTeam.shortHistory, 58);

  return (
    <li>
      <Link
        to={`/national-team/${nationalTeam.id}`}
        className="today-picks-card today-picks-card--national-team"
        aria-label={`${nationalTeam.displayName}, ${nationalTeam.confederation}`}
      >
        <span className="today-picks-card__visual" aria-hidden="true">
          <NationalTeamBadge nationalTeam={nationalTeam} size="card" />
        </span>
        <div className="today-picks-card__body">
          <span className="today-picks-card__pill">National team</span>
          <span className="today-picks-card__title">{nationalTeam.displayName}</span>
          <span className="today-picks-card__meta">
            {nationalTeam.confederation ?? nationalTeam.country}
          </span>
          {note && <p className="today-picks-card__note">{note}</p>}
        </div>
      </Link>
    </li>
  );
}

export default function TodaysPicksSection({
  featuredPlayers,
  featuredTeams = [],
  featuredNationalTeams = [],
  picksMode = 'club',
}) {
  const isInternational = picksMode === 'international';

  return (
    <section
      className={`today-picks${isInternational ? ' today-picks--international' : ''}`}
      aria-labelledby="today-picks-title"
      aria-describedby="today-picks-desc"
    >
      <div className="today-picks__header">
        <div>
          <h2 id="today-picks-title">Today&apos;s Picks</h2>
          <p className="today-picks__intro" id="today-picks-desc">
            {isInternational
              ? 'World Cup prep spotlight — linked national-team players and country pages in the database.'
              : 'Featured editorial players and clubs to explore before you filter the database.'}
          </p>
        </div>
        <span className="today-picks__stamp">
          {isInternational ? 'International day' : 'Daily refresh'}
        </span>
      </div>

      <div className="today-picks__group">
        <h3 className="today-picks__label">
          {isInternational ? 'International players' : 'Players'}
        </h3>
        <ul className="today-picks__grid">
          {featuredPlayers.map((player, index) => (
            <FeaturedPlayerCard
              key={player.id}
              player={player}
              priority={index === 0}
            />
          ))}
        </ul>
      </div>

      {isInternational ? (
        <div className="today-picks__group">
          <h3 className="today-picks__label">National teams</h3>
          <ul className="today-picks__grid today-picks__grid--duo">
            {featuredNationalTeams.map((nationalTeam) => (
              <FeaturedNationalTeamCard key={nationalTeam.id} nationalTeam={nationalTeam} />
            ))}
          </ul>
          <p className="today-picks__footer-link">
            <Link to="/world-cup">World Cup hub</Link>
            {' · '}
            <Link to="/collections/world-cup-watchlist">Watchlist</Link>
            {' · '}
            <Link to="/learning-paths">Country learning paths</Link>
          </p>
        </div>
      ) : (
        <div className="today-picks__group">
          <h3 className="today-picks__label">Clubs</h3>
          <ul className="today-picks__grid">
            {featuredTeams.map((team) => (
              <FeaturedTeamCard key={team.id} team={team} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
