import { useMemo, useState } from 'react';
import { useProgression } from '../hooks/useProgression';
import { buildCompareProgressToast } from '../utils/compareProgressToast';
import { Link } from 'react-router-dom';
import {
  getLeagueName,
  getTeamById,
  players,
  teams,
} from '../data/sampleData';
import { formatClubIdentityTags } from '../utils/clubIdentity';
import {
  buildClubCompareInsights,
  getTeamCompareSnapshot,
  SQUAD_POSITION_GROUPS,
  squadGroupCountLabel,
} from '../utils/teamCompare';
import TeamAutocomplete from './TeamAutocomplete';
import TeamBadge from './TeamBadge';

function CompareClubColumn({ team, snapshot }) {
  const leagueName = getLeagueName(team.leagueId);
  const { rosterStats, avgScore, quizReady, strengthSummary } = snapshot;
  const styleTags = formatClubIdentityTags(team.identityTags);

  return (
    <article className="compare-column" aria-labelledby={`compare-club-${team.id}`}>
      <TeamBadge team={team} size="profile" />
      <h3 id={`compare-club-${team.id}`} className="compare-column__name">
        <Link to={`/team/${team.id}`}>{team.name}</Link>
      </h3>

      <section className="compare-ref-card" aria-label={`${team.name} reference`}>
        <h4 className="compare-ref-card__title">Club reference</h4>
        <dl className="compare-ref-card__grid">
          <div>
            <dt>League</dt>
            <dd>
              <Link to={`/league/${team.leagueId}`}>{leagueName}</Link>
            </dd>
          </div>
          <div>
            <dt>Country</dt>
            <dd>{team.country}</dd>
          </div>
          <div>
            <dt>Stadium</dt>
            <dd>{team.stadium}</dd>
          </div>
          <div>
            <dt>Founded</dt>
            <dd>{team.founded}</dd>
          </div>
          <div>
            <dt>Head coach</dt>
            <dd>{team.manager?.trim() || '—'}</dd>
          </div>
          <div>
            <dt>Squad size</dt>
            <dd>{rosterStats.total}</dd>
          </div>
        </dl>
      </section>

      {styleTags.length > 0 && (
        <div className="compare-column__block">
          <h4>Style tags</h4>
          <ul className="tag-list compare-column__tags compare-column__tags--identity">
            {styleTags.map(({ key, label }) => (
              <li key={key}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="compare-column__block compare-column__block--highlight">
        <h4>Squad strength</h4>
        <p className="compare-column__strength-line">{strengthSummary}</p>
        <dl className="compare-column__strength-stats">
          <div>
            <dt>Avg score</dt>
            <dd>{avgScore > 0 ? avgScore : '—'}</dd>
          </div>
          <div>
            <dt>Quizzes</dt>
            <dd>{quizReady}</dd>
          </div>
          <div>
            <dt>Top player</dt>
            <dd>
              {rosterStats.topPlayer ? (
                <>
                  <Link to={`/player/${rosterStats.topPlayer.id}`}>
                    {rosterStats.topPlayer.name}
                  </Link>
                  <span className="compare-column__score-inline">
                    {' '}
                    ({rosterStats.topPlayer.importanceScore})
                  </span>
                </>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="compare-column__block">
        <h4>Squad by position</h4>
        <ul className="compare-column__counts">
          {SQUAD_POSITION_GROUPS.map((group) =>
            rosterStats.counts[group.id] > 0 ? (
              <li key={group.id}>
                <span>{squadGroupCountLabel(group.id)}</span>
                <span>{rosterStats.counts[group.id]}</span>
              </li>
            ) : null,
          )}
        </ul>
      </div>

      {team.currentKeyPlayers.length > 0 && (
        <div className="compare-column__block">
          <h4>Key players</h4>
          <ul className="compare-column__bullets">
            {team.currentKeyPlayers.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {team.rivals.length > 0 && (
        <div className="compare-column__block">
          <h4>Rivals</h4>
          <p className="compare-column__inline-tags">{team.rivals.join(' · ')}</p>
        </div>
      )}
    </article>
  );
}

export default function ClubCompare({ embedded = false, leagueFilter = '' }) {
  const { recordCompare } = useProgression();
  const teamsForCompare = useMemo(
    () => (leagueFilter ? teams.filter((t) => t.leagueId === leagueFilter) : teams),
    [leagueFilter],
  );
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [leftQuery, setLeftQuery] = useState('');
  const [rightQuery, setRightQuery] = useState('');
  const [compareToast, setCompareToast] = useState('');

  const logComparison = (idA, idB) => {
    if (!idA || !idB) return;
    const { xp, newAchievementIds } = recordCompare(idA, idB);
    setCompareToast(buildCompareProgressToast(xp, newAchievementIds));
  };

  const leftTeam = leftId ? getTeamById(leftId) : null;
  const rightTeam = rightId ? getTeamById(rightId) : null;

  const leftSnapshot = useMemo(
    () => (leftTeam ? getTeamCompareSnapshot(leftTeam.id, players) : null),
    [leftTeam],
  );
  const rightSnapshot = useMemo(
    () => (rightTeam ? getTeamCompareSnapshot(rightTeam.id, players) : null),
    [rightTeam],
  );

  const insights = useMemo(() => {
    if (!leftTeam || !rightTeam) return [];
    return buildClubCompareInsights(leftTeam, rightTeam, players);
  }, [leftTeam, rightTeam]);

  const handleLeftQueryChange = (value) => {
    setLeftQuery(value);
    if (leftTeam && value.trim() !== leftTeam.name) setLeftId('');
  };

  const handleRightQueryChange = (value) => {
    setRightQuery(value);
    if (rightTeam && value.trim() !== rightTeam.name) setRightId('');
  };

  const showComparison = leftTeam && rightTeam && leftSnapshot && rightSnapshot;

  const body = (
    <>
      {compareToast && (
        <p className="compare-xp-toast" role="status">
          {compareToast}
        </p>
      )}

      <section className="compare-pickers" aria-label="Select clubs to compare">
        <TeamAutocomplete
          teams={teamsForCompare}
          value={leftQuery}
          onChange={handleLeftQueryChange}
          onSelect={(team) => {
            setLeftId(team.id);
            setLeftQuery(team.name);
            if (rightId) logComparison(team.id, rightId);
          }}
          label="Club A"
          placeholder="Search club A…"
          excludeIds={rightId ? [rightId] : []}
          maxResults={8}
        />
        <TeamAutocomplete
          teams={teamsForCompare}
          value={rightQuery}
          onChange={handleRightQueryChange}
          onSelect={(team) => {
            setRightId(team.id);
            setRightQuery(team.name);
            if (leftId) logComparison(leftId, team.id);
          }}
          label="Club B"
          placeholder="Search club B…"
          excludeIds={leftId ? [leftId] : []}
          maxResults={8}
        />
      </section>

      {!showComparison && (
        <p className="compare-page__empty">Choose two clubs to compare.</p>
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

          <section className="compare-grid" aria-label="Club comparison">
            <CompareClubColumn team={leftTeam} snapshot={leftSnapshot} />
            <CompareClubColumn team={rightTeam} snapshot={rightSnapshot} />
          </section>
        </>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <div className="page compare-page">
      <header className="page-header">
        <h1>Compare Clubs</h1>
        <p>Football-reference style snapshots — identity, squad depth, and league context.</p>
      </header>
      {body}
    </div>
  );
}
