import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getManifestLeague } from '../data/contentManifest';
import { loadPlayerById } from '../data/playerStore';
import { peekTeamName } from '../data/teamStore';
import { useFavorites } from '../hooks/useFavorites';
import { useSearchIndex } from '../hooks/useSearchIndex';
import { getDisplayQuickFact, isBrowseOnlyPlayer } from '../utils/playerEditorial';
import { buildCareerSummary, getRoleSummary } from '../utils/playerImportance';
import { isQuizEligiblePlayer } from '../utils/quizPlayerRules';
import { useRecordRecentView } from '../hooks/useRecordRecentView';
import {
  getRelatedPlayers,
  getSimilarRolePlayers,
  getYouMayAlsoLikePlayers,
} from '../utils/relatedPlayers';
import {
  formatPosition,
  getFootballAccentStyle,
  getLeagueDisplayName,
} from '../utils/footballDisplay';
import CountryFlag from './CountryFlag';
import DataTrustNotice from './DataTrustNotice';
import FavoriteButton from './FavoriteButton';
import PlayerVisual from './PlayerVisual';
import PositionLabel from './PositionLabel';
import RelatedPlayersSection from './RelatedPlayersSection';

function parseDateOfBirth(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateOfBirth(value) {
  const date = parseDateOfBirth(value);
  if (!date) return '';

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function calculateAgeFromDate(value) {
  const birthDate = parseDateOfBirth(value);
  if (!birthDate) return '';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (beforeBirthday) age -= 1;
  return age;
}

function formatValue(value, fallback = 'Not available') {
  if (value === 0) return '0';
  const text = String(value ?? '').trim();
  return text || fallback;
}

/** Citizenship / NT label when there is no live `/national-team` page. */
function getNationalTeamPlainLabel(player) {
  return String(player?.nationalTeam || player?.nationality || '').trim();
}

function nationalityMatchesLiveTeam(citizenship, liveNationalTeam) {
  const c = citizenship.trim().toLowerCase();
  const display = liveNationalTeam.displayName.trim().toLowerCase();
  if (c === display) return true;
  if (liveNationalTeam.id === 'united-states') {
    return ['usa', 'us', 'u.s.', 'u.s.a.', 'united states'].includes(c);
  }
  return false;
}

function shouldShowNationalityRow(player, liveNationalTeam) {
  const citizenship = String(player?.nationality ?? '').trim();
  if (!citizenship) return false;
  if (!liveNationalTeam) return true;
  return !nationalityMatchesLiveTeam(citizenship, liveNationalTeam);
}

export default function PlayerProfile() {
  const { playerId } = useParams();
  const [playerState, setPlayerState] = useState(() => ({
    playerId: null,
    status: 'loading',
    player: null,
  }));

  useEffect(() => {
    let cancelled = false;
    loadPlayerById(playerId)
      .then((p) => {
        if (cancelled) return;
        setPlayerState({ playerId, status: p ? 'ready' : 'not-found', player: p ?? null });
      })
      .catch(() => {
        if (cancelled) return;
        setPlayerState({ playerId, status: 'error', player: null });
      });
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const player = playerState.playerId === playerId ? playerState.player : null;
  const playerStatus = playerState.playerId === playerId ? playerState.status : 'loading';

  const accentStyle = player ? getFootballAccentStyle(player) : undefined;
  const { isPlayerSaved, togglePlayer } = useFavorites();
  useRecordRecentView('player', player?.id);
  const [ntModuleState, setNtModuleState] = useState(() => ({
    playerId: null,
    mod: null,
  }));

  // Only load nationalTeamData when the player has a relevant label.
  // This keeps the nationalTeamData chunk off routes that never need it.
  useEffect(() => {
    if (!player) return undefined;
    const label = getNationalTeamPlainLabel(player);
    if (!label) return undefined;

    let cancelled = false;
    import('../data/nationalTeamData.js')
      .then((mod) => {
        if (cancelled) return;
        setNtModuleState({ playerId: player.id, mod });
      })
      .catch(() => {
        // fall back to plain label only
      });

    return () => {
      cancelled = true;
    };
  }, [player]);

  const { index: searchIndex, status: searchIndexStatus } = useSearchIndex();
  const relatedPool = useMemo(
    () => (searchIndexStatus === 'ready' ? (searchIndex?.players ?? []) : []),
    [searchIndexStatus, searchIndex],
  );
  const relatedLoading = Boolean(player && searchIndexStatus === 'loading');

  const relatedPlayers = useMemo(
    () => (player ? getRelatedPlayers(player, { pool: relatedPool }) : []),
    [player, relatedPool],
  );
  const similarRolePlayers = useMemo(
    () => (player ? getSimilarRolePlayers(player, { pool: relatedPool }) : []),
    [player, relatedPool],
  );
  const alsoLikePlayers = useMemo(
    () => (player ? getYouMayAlsoLikePlayers(player, { pool: relatedPool }) : []),
    [player, relatedPool],
  );

  if (playerStatus === 'loading') {
    return (
      <div className="page">
        <p className="empty-state">Loading player…</p>
      </div>
    );
  }

  if (!player || playerStatus === 'not-found') {
    return (
      <div className="page">
        <p className="empty-state">Player not found.</p>
        <Link to="/browse" className="btn btn--secondary">
          Back to database
        </Link>
      </div>
    );
  }

  const saved = isPlayerSaved(player.id);
  const teamName = player?._teamName ?? peekTeamName(player.teamId);
  const leagueName = getLeagueDisplayName({
    id: player.leagueId,
    name: getManifestLeague(player.leagueId)?.name ?? 'Unknown',
  });
  const nationalTeamPlainLabel = getNationalTeamPlainLabel(player);
  const liveNationalTeam =
    ntModuleState.mod && ntModuleState.playerId === player.id
      ? ntModuleState.mod.getLiveNationalTeamForPlayer(player)
      : null;
  const roleSummary = getRoleSummary(player);
  const careerSummary = buildCareerSummary(player);
  const browseOnly = isBrowseOnlyPlayer(player);
  const quizReady = isQuizEligiblePlayer(player);
  const displayFact = getDisplayQuickFact(player);
  const quizHints = Array.isArray(player.quizHints) ? player.quizHints.filter(Boolean) : [];
  const careerHistory = Array.isArray(player.careerHistory) ? player.careerHistory : [];
  const hasQuizClues = quizReady && quizHints.length > 0;
  const hasCareerStops = careerHistory.length > 0;
  const dateOfBirth = formatDateOfBirth(player.dateOfBirth);
  const resolvedAge = player.age ?? calculateAgeFromDate(player.dateOfBirth);
  const ageDisplay =
    resolvedAge !== '' && resolvedAge != null ? String(resolvedAge) : null;

  const playerInfoItems = [
    {
      label: 'Club',
      value: (
        <Link to={`/team/${player.teamId}`} className="player-profile__info-link">
          {teamName}
        </Link>
      ),
    },
    {
      label: 'League',
      value: (
        <Link to={`/league/${player.leagueId}`} className="player-profile__info-link">
          {leagueName}
        </Link>
      ),
    },
    (liveNationalTeam || nationalTeamPlainLabel) && {
      label: 'National team',
      value: liveNationalTeam ? (
        <Link to={`/national-team/${liveNationalTeam.id}`} className="player-profile__info-link football-meta-line">
          <CountryFlag label={liveNationalTeam.displayName} />
          {liveNationalTeam.displayName}
        </Link>
      ) : (
        <span className="football-meta-line">
          <CountryFlag label={nationalTeamPlainLabel} />
          {nationalTeamPlainLabel}
        </span>
      ),
    },
    shouldShowNationalityRow(player, liveNationalTeam) && {
      label: 'Nationality',
      value: (
        <span className="football-meta-line">
          <CountryFlag label={player.nationality} />
          {player.nationality || '—'}
        </span>
      ),
    },
    { label: 'Position', value: formatPosition(player.position) },
    ageDisplay && { label: 'Age', value: ageDisplay },
    dateOfBirth && { label: 'Date of birth', value: dateOfBirth },
    { label: 'Importance Score', value: formatValue(player.importanceScore) },
  ].filter(Boolean);

  return (
    <div className="page profile player-profile">
      <Link to="/browse" className="back-link">
        ← Back to database
      </Link>

      <header
        className="profile__hero profile__hero--player player-profile__hero football-accent-surface"
        style={accentStyle}
      >
        <div className="player-profile__hero-main">
          <PlayerVisual player={player} size="profile" priority />
          <div className="player-profile__hero-copy">
            <h1>{player.name}</h1>
            <PositionLabel position={player.position} className="player-profile__position" />
            <p className="player-profile__meta-line">
              <Link to={`/team/${player.teamId}`} className="player-profile__fact-link">
                {teamName}
              </Link>
              <span aria-hidden="true"> · </span>
              <Link to={`/league/${player.leagueId}`} className="player-profile__fact-link">
                {leagueName}
              </Link>
              {liveNationalTeam ? (
                <>
                  <span aria-hidden="true"> · </span>
                  <Link
                    to={`/national-team/${liveNationalTeam.id}`}
                    className="player-profile__fact-link"
                  >
                    {liveNationalTeam.displayName}
                  </Link>
                </>
              ) : (
                nationalTeamPlainLabel && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span>{nationalTeamPlainLabel}</span>
                  </>
                )
              )}
            </p>
          </div>
        </div>
        <div className="profile__side-actions player-profile__hero-aside">
          <div className="profile__score-block">
            <span className="profile__score-label">Importance Score</span>
            <span className="profile__score-value">{player.importanceScore}</span>
          </div>
          <FavoriteButton
            itemName={player.name}
            saved={saved}
            onToggle={() => togglePlayer(player.id)}
          />
        </div>
      </header>

      <DataTrustNotice compact />

      {browseOnly && (
        <p className="player-study__note" role="status">
          Browse-only profile — factual squad data shown below. Editorial quiz hints are pending;
          Quiz and Daily still use approved featured players only.
        </p>
      )}

      <nav className="player-profile__quick-links" aria-label="Quick actions">
        <Link to={`/team/${player.teamId}`}>Club</Link>
        <Link to={`/league/${player.leagueId}`}>League</Link>
        {liveNationalTeam && (
          <Link to={`/national-team/${liveNationalTeam.id}`}>National team</Link>
        )}
        {quizReady && <Link to={`/quiz?team=${player.teamId}`}>Quiz</Link>}
      </nav>

      <section className="info-card player-info-card" aria-labelledby="player-info-title">
        <h2 id="player-info-title">Club &amp; country</h2>
        <dl className="player-info-grid">
          {playerInfoItems.map((item) => (
            <div key={item.label} className="player-info-grid__item">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {relatedLoading ? (
        <p className="page-loading" role="status" aria-live="polite">
          Loading related players…
        </p>
      ) : null}
      <RelatedPlayersSection suggestions={relatedPlayers} />
      <RelatedPlayersSection
        title="Similar role"
        headingId="player-similar-role-title"
        suggestions={similarRolePlayers}
      />
      <RelatedPlayersSection
        title="You may also like"
        headingId="player-also-like-title"
        suggestions={alsoLikePlayers}
      />

      <section className="player-profile__body" aria-label={`${player.name} profile`}>
        <article className="info-card player-snapshot">
          <h2>Snapshot</h2>
          <ul className="player-snapshot__list">
            <li>
              <span className="player-snapshot__label">Style</span>
              <span>{player.playingStyle?.trim() || '—'}</span>
            </li>
            <li>
              <span className="player-snapshot__label">Fact</span>
              <span>{displayFact}</span>
            </li>
            <li>
              <span className="player-snapshot__label">Importance</span>
              <span>{roleSummary}</span>
            </li>
          </ul>
        </article>

        <article className="info-card">
          <h2>Career</h2>
          {hasCareerStops ? (
            <ol className="career-timeline career-timeline--compact">
              {careerHistory.map((entry) => (
                <li key={`${entry.club}-${entry.years}`} className="career-timeline__item">
                  <span className="career-timeline__club">{entry.club}</span>
                  <span className="career-timeline__years">{entry.years}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="player-study__note">
              Career stops are not in the sample yet — club and league above reflect the current
              roster listing.
            </p>
          )}
          {hasCareerStops && (
            <details className="player-profile__details">
              <summary>Career summary</summary>
              <p>{careerSummary}</p>
            </details>
          )}
        </article>

        {hasQuizClues && (
          <article className="info-card player-study">
            <h2>Quiz clues</h2>
            <p className="player-study__note">Short hints for recall — not full answers.</p>
            <ul className="player-study__hints">
              {quizHints.map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
          </article>
        )}
      </section>
    </div>
  );
}
