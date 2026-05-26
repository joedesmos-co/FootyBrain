import { useMemo, useState } from 'react';
import { useProgression } from '../hooks/useProgression';
import { buildCompareProgressToast } from '../utils/compareProgressToast';
import { Link } from 'react-router-dom';
import { getLiveNationalTeams } from '../data/nationalTeamData';
import {
  getLeagueName,
  getPlayerById,
  getPlayersForLeague,
  getTeamName,
  players,
  teams,
} from '../data/sampleData';
import { getDisplayQuickFact, isBrowseOnlyPlayer } from '../utils/playerEditorial';
import {
  buildCompareInsights,
  getPlayerRoleSummary,
  getPlayerStrengths,
} from '../utils/playerCompare';
import PlayerAutocomplete from './PlayerAutocomplete';
import PlayerVisual from './PlayerVisual';

function ComparePlayerColumn({ player, side }) {
  const teamName = getTeamName(player.teamId);
  const leagueName = getLeagueName(player.leagueId);
  const browseOnly = isBrowseOnlyPlayer(player);
  const roleSummary = getPlayerRoleSummary(player);
  const strengths = getPlayerStrengths(player);
  const careerHistory = Array.isArray(player.careerHistory) ? player.careerHistory : [];
  const hasCareerHistory = careerHistory.length > 0;

  return (
    <article className="compare-column" aria-labelledby={`compare-${side}-title`}>
      <PlayerVisual player={player} size="profile" />
      <h3 id={`compare-${side}-title`} className="compare-column__name">
        <Link to={`/player/${player.id}`}>{player.name}</Link>
      </h3>
      <p className="compare-column__role">{roleSummary}</p>

      <section className="compare-ref-card" aria-label={`${player.name} reference`}>
        <h4 className="compare-ref-card__title">Player reference</h4>
        <dl className="compare-ref-card__grid">
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
            <dt>National team</dt>
            <dd>{player.nationalTeam}</dd>
          </div>
          <div>
            <dt>Club</dt>
            <dd>
              <Link to={`/team/${player.teamId}`}>{teamName}</Link>
            </dd>
          </div>
          <div>
            <dt>League</dt>
            <dd>
              <Link to={`/league/${player.leagueId}`}>{leagueName}</Link>
            </dd>
          </div>
          <div className="compare-ref-card__wide">
            <dt>Importance Score</dt>
            <dd className="compare-column__score">{player.importanceScore}</dd>
          </div>
        </dl>
      </section>

      <div className="compare-column__block">
        <h4>Strengths</h4>
        <ul className="compare-column__bullets compare-column__bullets--strengths">
          {strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {browseOnly && (
        <p className="player-study__note">
          Browse-only profile — compare facts are available, but quiz/editorial notes are pending.
        </p>
      )}

      <div className="compare-column__block">
        <h4>Quick fact</h4>
        <p>{getDisplayQuickFact(player)}</p>
      </div>

      {hasCareerHistory && (
        <div className="compare-column__block">
          <h4>Career</h4>
          <ul className="compare-column__career">
            {careerHistory.map((entry) => (
              <li key={`${entry.club}-${entry.years}`}>
                <span>{entry.club}</span>
                <span>{entry.years}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function seedPlayerPicker(playerId) {
  if (!playerId) return { id: '', query: '' };
  const player = getPlayerById(playerId);
  return player ? { id: player.id, query: player.name } : { id: '', query: '' };
}

export default function PlayerCompare({
  embedded = false,
  leagueFilter = '',
  initialLeftId = '',
  initialRightId = '',
}) {
  const { recordCompare } = useProgression();
  const playersForCompare = useMemo(
    () => (leagueFilter ? getPlayersForLeague(leagueFilter) : players),
    [leagueFilter],
  );
  const searchIntentContext = useMemo(
    () => ({
      teams,
      nationalTeams: getLiveNationalTeams(),
      getLeagueName,
    }),
    [],
  );
  const leftSeed = seedPlayerPicker(initialLeftId);
  const rightSeed = seedPlayerPicker(initialRightId);
  const [leftId, setLeftId] = useState(leftSeed.id);
  const [rightId, setRightId] = useState(rightSeed.id);
  const [leftQuery, setLeftQuery] = useState(leftSeed.query);
  const [rightQuery, setRightQuery] = useState(rightSeed.query);
  const [compareToast, setCompareToast] = useState('');

  const logComparison = (idA, idB) => {
    if (!idA || !idB) return;
    const { xp, newAchievementIds } = recordCompare(idA, idB);
    setCompareToast(buildCompareProgressToast(xp, newAchievementIds));
  };

  const leftPlayer = leftId ? getPlayerById(leftId) : null;
  const rightPlayer = rightId ? getPlayerById(rightId) : null;

  const insights = useMemo(() => {
    if (!leftPlayer || !rightPlayer) return [];
    return buildCompareInsights(leftPlayer, rightPlayer);
  }, [leftPlayer, rightPlayer]);

  const handleLeftQueryChange = (value) => {
    setLeftQuery(value);
    if (leftPlayer && value.trim() !== leftPlayer.name) setLeftId('');
  };

  const handleRightQueryChange = (value) => {
    setRightQuery(value);
    if (rightPlayer && value.trim() !== rightPlayer.name) setRightId('');
  };

  const showComparison = leftPlayer && rightPlayer;

  const body = (
    <>
      {compareToast && (
        <p className="compare-xp-toast" role="status">
          {compareToast}
        </p>
      )}

      <section className="compare-pickers" aria-label="Select players to compare">
        <PlayerAutocomplete
          players={playersForCompare}
          value={leftQuery}
          onChange={handleLeftQueryChange}
          onSelect={(player) => {
            setLeftId(player.id);
            setLeftQuery(player.name);
            if (rightId) logComparison(player.id, rightId);
          }}
          label="Player A"
          placeholder="Search player A…"
          excludeIds={rightId ? [rightId] : []}
          maxResults={8}
          intentContext={searchIntentContext}
        />
        <PlayerAutocomplete
          players={playersForCompare}
          value={rightQuery}
          onChange={handleRightQueryChange}
          onSelect={(player) => {
            setRightId(player.id);
            setRightQuery(player.name);
            if (leftId) logComparison(leftId, player.id);
          }}
          label="Player B"
          placeholder="Search player B…"
          excludeIds={leftId ? [leftId] : []}
          maxResults={8}
          intentContext={searchIntentContext}
        />
      </section>

      {!showComparison && (
        <p className="compare-page__empty">Choose two players to compare.</p>
      )}

      {showComparison && (
        <>
          <section className="compare-insights" aria-label="Similarities and differences">
            <h2>Similarities &amp; differences</h2>
            <ul className="compare-insights__list">
              {insights.map((item) => (
                <li
                  key={item.text}
                  className={`compare-insights__item compare-insights__item--${item.kind}`}
                >
                  {item.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="compare-grid" aria-label="Player comparison">
            <ComparePlayerColumn player={leftPlayer} side="a" />
            <ComparePlayerColumn player={rightPlayer} side="b" />
          </section>
        </>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <div className="page compare-page">
      <header className="page-header">
        <h1>Compare Players</h1>
        <p>Football-reference style snapshots — role, strengths, club context, and career.</p>
      </header>
      {body}
    </div>
  );
}
