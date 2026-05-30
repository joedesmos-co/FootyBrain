import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getLiveNationalTeamForPlayer } from '../data/nationalTeamData';
import { peekTeamById } from '../data/teamStore';
import { isQuizEligiblePlayer } from '../utils/quizPlayerRules';
import { formatPosition, getCountryFlag } from '../utils/footballDisplay';
import {
  getSquadSummary,
  groupPlayersByPositionCategory,
  SQUAD_POSITION_GROUPS,
  squadGroupCountLabel,
} from '../utils/squadGrouping';
import DataTrustNotice from './DataTrustNotice';
import NationalTeamBadge from './NationalTeamBadge';
import PlayerVisual from './PlayerVisual';
import TeamBadge from './TeamBadge';

const NATIONALITY_ABBREV = {
  'United States': 'USA',
  Brazil: 'BRA',
  France: 'FRA',
  Germany: 'GER',
  England: 'ENG',
  Argentina: 'ARG',
  Spain: 'ESP',
  Italy: 'ITA',
  Portugal: 'POR',
  Netherlands: 'NED',
  Belgium: 'BEL',
  Croatia: 'CRO',
  Uruguay: 'URU',
  Colombia: 'COL',
  Mexico: 'MEX',
  Japan: 'JPN',
  'South Korea': 'KOR',
};

function nationalityAbbrev(player) {
  const label = player.nationality || player.nationalTeam;
  if (!label) return '—';
  if (NATIONALITY_ABBREV[label]) return NATIONALITY_ABBREV[label];
  if (label.length <= 3) return label.toUpperCase();
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .map((part) => part[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();
  }
  return label.slice(0, 3).toUpperCase();
}

function squadRowMeta(player, variant, getTeamName) {
  const position = formatPosition(player.position);
  if (variant === 'national' && getTeamName) {
    const club = getTeamName(player.teamId);
    return club && club !== 'Unknown' ? `${position} · ${club}` : position;
  }
  return position;
}

function SquadIdentityIndicator({ player, variant }) {
  if (variant === 'national') {
    const team = peekTeamById(player.teamId);
    if (team) {
      return (
        <span className="team-squad__indicator" aria-hidden="true">
          <TeamBadge team={team} size="thumb" />
        </span>
      );
    }
    return null;
  }

  const liveNationalTeam = getLiveNationalTeamForPlayer(player);
  if (liveNationalTeam) {
    return (
      <span className="team-squad__indicator" aria-hidden="true">
        <NationalTeamBadge nationalTeam={liveNationalTeam} size="thumb" />
      </span>
    );
  }

  const full = player.nationality || player.nationalTeam || 'Nationality unknown';
  const flag = getCountryFlag(full);
  const abbrev = nationalityAbbrev(player);
  return (
    <span className="team-squad__indicator team-squad__indicator--nat" title={full}>
      {flag ? (
        <span className="team-squad__nat-flag" aria-hidden="true">
          {flag}
        </span>
      ) : null}
      <span className="team-squad__nat-code">{abbrev}</span>
    </span>
  );
}

function formatAverageAge(ageStats) {
  if (ageStats.avg == null) return '—';
  const suffix =
    ageStats.known < ageStats.total ? ` (${ageStats.known} w/ age)` : '';
  return `${ageStats.avg}${suffix}`;
}

export default function TeamSquadView({
  players,
  teamName,
  variant = 'club',
  getTeamName,
  eyebrow = 'Squad',
  title = 'Club Squad View',
  intro,
  hideQuizSummary = false,
}) {
  const groups = useMemo(() => groupPlayersByPositionCategory(players), [players]);
  const summary = useMemo(() => getSquadSummary(players), [players]);

  if (players.length === 0) {
    return (
      <section id="team-squad" className="team-squad" aria-labelledby="team-squad-title">
        <header className="team-squad__header">
          <div>
            <p className="team-squad__eyebrow">{eyebrow}</p>
            <h2 id="team-squad-title">{title}</h2>
          </div>
        </header>
        <p className="empty-state">No players listed for {teamName} yet.</p>
      </section>
    );
  }

  const strongestLine =
    summary.strongestPositions.length > 0
      ? summary.strongestPositions
          .map((row) => `${row.code} (${row.avg})`)
          .join(' · ')
      : '—';

  return (
    <section id="team-squad" className="team-squad" aria-labelledby="team-squad-title">
      <header className="team-squad__header">
        <div>
          <p className="team-squad__eyebrow">{eyebrow}</p>
          <h2 id="team-squad-title">{title}</h2>
          <p className="team-squad__intro">
            {intro ??
              `Players for ${teamName}, grouped by position and sorted by profile rank.`}
          </p>
          <DataTrustNotice compact />
        </div>
      </header>

      <dl className="team-squad__summary" aria-label="Squad summary">
        <div className="team-squad__stat">
          <dt>Squad size</dt>
          <dd>{summary.total}</dd>
        </div>
        <div className="team-squad__stat">
          <dt>Avg age</dt>
          <dd>{formatAverageAge(summary.ageStats)}</dd>
        </div>
        {!hideQuizSummary ? (
          <div className="team-squad__stat">
            <dt>Quizzes</dt>
            <dd>
              {summary.quizReady}
              <span className="team-squad__stat-note">players</span>
            </dd>
          </div>
        ) : null}
        <div className="team-squad__stat">
          <dt>Strongest</dt>
          <dd className="team-squad__stat-strongest">{strongestLine}</dd>
        </div>
        <div className="team-squad__stat">
          <dt>Top rated</dt>
          <dd>
            <Link to={`/player/${summary.topPlayer.id}`} className="team-squad__stat-link">
              {summary.topPlayer.name}
            </Link>
            <span className="team-squad__stat-score">{summary.topPlayer.importanceScore}</span>
          </dd>
        </div>
        <div className="team-squad__stat team-squad__stat--groups">
          <dt>By position</dt>
          <dd>
            <ul className="team-squad__group-counts">
              {SQUAD_POSITION_GROUPS.map((group) =>
                summary.counts[group.id] > 0 ? (
                  <li key={group.id}>
                    <span className="team-squad__group-code">{squadGroupCountLabel(group.id)}</span>
                    <span>{summary.counts[group.id]}</span>
                  </li>
                ) : null,
              )}
            </ul>
          </dd>
        </div>
      </dl>

      <div className="team-squad__groups">
        {groups.map((group) => (
          <section
            key={group.id}
            className={`team-squad__group team-squad__group--${group.id}`}
            aria-labelledby={`team-squad-${group.id}`}
          >
            <h3 id={`team-squad-${group.id}`} className="team-squad__group-title">
              <span className="team-squad__group-label">{group.label}</span>
              <span className="team-squad__group-count">{group.players.length}</span>
              {group.avgScore != null ? (
                <span className="team-squad__group-avg">avg {group.avgScore}</span>
              ) : null}
            </h3>
            <ul className="team-squad__list">
              {group.players.map((player) => (
                <li key={player.id}>
                  <Link to={`/player/${player.id}`} className="team-squad__row">
                    <PlayerVisual player={player} size="thumb" />
                    <SquadIdentityIndicator player={player} variant={variant} />
                    <span className="team-squad__row-main">
                      <span className="team-squad__row-name-line">
                        <strong className="team-squad__row-name">{player.name}</strong>
                        {isQuizEligiblePlayer(player) ? (
                          <span className="team-squad__row-quiz" title="Playable in quizzes">
                            Q
                          </span>
                        ) : null}
                      </span>
                      <span className="team-squad__row-meta">
                        {squadRowMeta(player, variant, getTeamName)}
                      </span>
                    </span>
                    <span className="team-squad__row-score" title="Importance score">
                      <span className="team-squad__row-score-label">Score</span>
                      <span className="team-squad__row-score-value">{player.importanceScore}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
