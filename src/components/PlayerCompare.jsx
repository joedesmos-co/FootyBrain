import { useEffect, useMemo, useState } from 'react';
import { useProgression } from '../hooks/useProgression';
import { buildCompareProgressToast } from '../utils/compareProgressToast';
import { Link } from 'react-router-dom';
import { getLiveNationalTeams } from '../data/nationalTeamData';
import { getManifestLeague } from '../data/contentManifest';
import { getDisplayQuickFact, isBrowseOnlyPlayer } from '../utils/playerEditorial';
import { IMPORTANCE_SCORE_LABEL } from '../utils/consumerCopy';
import {
  buildCompareInsights,
  getPlayerRoleSummary,
  getPlayerStrengths,
} from '../utils/playerCompare';
import { usePlayerSearchPool } from '../hooks/usePlayerSearchPool';
import { canonicalUrlForPath } from '../utils/brand';
import {
  applyPageSeo,
  buildCompareSeoDescription,
  buildCompareSeoTitle,
} from '../utils/seoCtr.js';
import PlayerAutocomplete from './PlayerAutocomplete';
import PlayerVisual from './PlayerVisual';

function ComparePlayerColumn({ player, side, getTeamName }) {
  const teamName = getTeamName ? getTeamName(player.teamId) : (player?._teamName ?? 'Unknown');
  const leagueName = getManifestLeague(player.leagueId)?.name ?? 'Unknown';
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
            <dt>{IMPORTANCE_SCORE_LABEL}</dt>
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
          Profile preview—compare facts are available; quiz clues for this player are coming soon.
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

export default function PlayerCompare({
  embedded = false,
  leagueFilter = '',
  initialLeftId = '',
  initialRightId = '',
}) {
  const { recordCompare } = useProgression();
  const playerSearchPool = usePlayerSearchPool();
  const [bundled, setBundled] = useState(null);

  useEffect(() => {
    let cancelled = false;
    import('../data/sampleData.js').then((mod) => {
      if (cancelled) return;
      setBundled(mod);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const playersForCompare = useMemo(() => {
    if (!bundled) return [];
    return leagueFilter ? bundled.getPlayersForLeague(leagueFilter) : bundled.players;
  }, [bundled, leagueFilter]);

  const searchIntentContext = useMemo(() => {
    if (!bundled) return null;
    return {
      teams: bundled.teams,
      nationalTeams: getLiveNationalTeams(),
      getLeagueName: bundled.getLeagueName,
    };
  }, [bundled]);

  const seedPlayerPicker = (playerId) => {
    if (!bundled || !playerId) return { id: '', query: '' };
    const player = bundled.getPlayerById(playerId);
    return player ? { id: player.id, query: player.name } : { id: '', query: '' };
  };

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

  const leftPlayer = bundled && leftId ? bundled.getPlayerById(leftId) : null;
  const rightPlayer = bundled && rightId ? bundled.getPlayerById(rightId) : null;

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

  useEffect(() => {
    if (!embedded) return undefined;
    applyPageSeo({
      title: buildCompareSeoTitle({
        tab: 'players',
        leftName: leftPlayer?.name,
        rightName: rightPlayer?.name,
      }),
      description: buildCompareSeoDescription({
        tab: 'players',
        leftName: leftPlayer?.name,
        rightName: rightPlayer?.name,
      }),
      canonicalUrl: canonicalUrlForPath('/compare'),
      robots: 'index,follow',
    });
    return undefined;
  }, [embedded, leftPlayer?.name, rightPlayer?.name]);

  const body = (
    <>
      {compareToast && (
        <p className="compare-xp-toast" role="status">
          {compareToast}
        </p>
      )}

      <section className="compare-pickers" aria-label="Select players to compare">
        <PlayerAutocomplete
          searchPool={playerSearchPool.players}
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
          poolStatus={playerSearchPool.status}
          intentContext={searchIntentContext}
          getTeamName={(id) => playerSearchPool.getTeamName(id) || bundled?.getTeamName(id)}
          getLeagueName={(id) => playerSearchPool.getLeagueName(id) || bundled?.getLeagueName(id)}
        />
        <PlayerAutocomplete
          searchPool={playerSearchPool.players}
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
          poolStatus={playerSearchPool.status}
          intentContext={searchIntentContext}
          getTeamName={(id) => playerSearchPool.getTeamName(id) || bundled?.getTeamName(id)}
          getLeagueName={(id) => playerSearchPool.getLeagueName(id) || bundled?.getLeagueName(id)}
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
            <ComparePlayerColumn player={leftPlayer} side="a" getTeamName={bundled?.getTeamName} />
            <ComparePlayerColumn player={rightPlayer} side="b" getTeamName={bundled?.getTeamName} />
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
