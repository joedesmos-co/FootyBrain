import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getManifestLeague } from '../data/contentManifest';
import { loadPlayerById } from '../data/playerStore';
import { peekTeamName } from '../data/teamStore';
import { useFavorites } from '../hooks/useFavorites';
import { useSearchIndex } from '../hooks/useSearchIndex';
import { getDisplayQuickFact, isBrowseOnlyPlayer } from '../utils/playerEditorial';
import { IMPORTANCE_SCORE_LABEL } from '../utils/consumerCopy';
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
  isExternalClubStubTeam,
} from '../utils/footballDisplay';
import CountryFlag from './CountryFlag';
import DataTrustNotice from './DataTrustNotice';
import FavoriteButton from './FavoriteButton';
import PlayerVisual from './PlayerVisual';
import PositionLabel from './PositionLabel';
import RelatedPlayersSection from './RelatedPlayersSection';
import { getCanonicalUrl, upsertJsonLdScript } from '../utils/jsonLd';
import { setSeoMeta } from '../utils/seoMeta';
import BreadcrumbNav from './BreadcrumbNav';

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

function normalizeLabel(value) {
  const text = String(value ?? '').trim();
  return text;
}

function pickFirstPresent(...values) {
  for (const v of values) {
    const t = normalizeLabel(v);
    if (t) return t;
  }
  return '';
}

function toTagList(value, max = 8) {
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  const parts = raw
    .split(/[·•,;|/]/g)
    .map((p) => p.trim())
    .filter(Boolean);
  const uniq = [];
  const seen = new Set();
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(p);
    if (uniq.length >= max) break;
  }
  return uniq;
}

function toStringList(value, max = 12) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean).slice(0, max);
  }
  return toTagList(value, max);
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

const STAT_EMPHASIS_CLASS = {
  Club: 'player-stat--club',
  League: 'player-stat--league',
  'National team': 'player-stat--national',
  Nationality: 'player-stat--nationality',
  Position: 'player-stat--position',
};

function PlayerSectionHead({ icon, title, id }) {
  return (
    <div className="player-section__head">
      <span className="player-section__icon" aria-hidden="true">
        {icon}
      </span>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function PlayerEmptyState({ children }) {
  return (
    <p className="player-empty" role="status">
      {children}
    </p>
  );
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

  useEffect(() => {
    if (!player) return undefined;
    const canonical = getCanonicalUrl();
    if (!canonical) return undefined;

    const homeUrl = canonical.replace(/\/player\/[^/]+$/, '/');
    const browseUrl = `${homeUrl.replace(/\/$/, '')}/browse`;
    const teamUrl = `${homeUrl.replace(/\/$/, '')}/team/${player.teamId}`;
    const resolvedTeamName = player?._teamName ?? peekTeamName(player.teamId) ?? 'Unknown';

    upsertJsonLdScript('jsonld-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: 'Browse', item: browseUrl },
        { '@type': 'ListItem', position: 3, name: player.name, item: canonical },
      ],
    });

    const title = `${player.name} · FootyCompass`;
    const descriptionParts = [
      player.position ? formatPosition(player.position) : null,
      resolvedTeamName,
      player.nationality ? player.nationality : null,
    ].filter(Boolean);
    const description = `${player.name} — ${descriptionParts.join(' · ')}. Player profile with club/league context, career notes, and quiz eligibility.`;
    setSeoMeta({
      title,
      description,
      canonicalUrl: canonical,
      og: { title, description, url: canonical, type: 'profile' },
      twitter: { title, description },
    });

    const birthDate =
      typeof player.dateOfBirth === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(player.dateOfBirth)
        ? player.dateOfBirth
        : undefined;

    upsertJsonLdScript('jsonld-person', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: player.name,
      url: canonical,
      nationality: player.nationality || undefined,
      birthDate,
      memberOf: {
        '@type': 'SportsTeam',
        name: resolvedTeamName,
        url: teamUrl,
      },
    });

    return () => {
      upsertJsonLdScript('jsonld-breadcrumb', null);
      upsertJsonLdScript('jsonld-person', null);
    };
  }, [player]);

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
          Back to browse
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

  const preferredFoot = pickFirstPresent(player.preferredFoot, player.foot, player.strongFoot);
  const height = pickFirstPresent(player.height, player.heightCm, player.heightCM);

  const playStyleTags = toTagList(player.playingStyle, 7);
  const playStyleSummary = pickFirstPresent(player.playStyleSummary, player.styleSummary);

  const strengths = toStringList(
    player.strengths ?? player.keyStrengths ?? player.signatureStrengths,
    10,
  );

  const honors = toStringList(player.honors ?? player.honours ?? player.trophies, 12);
  const showHonors = honors.length > 0;

  const funFact = normalizeLabel(player.quickFact || displayFact);
  const showFunFact = Boolean(funFact);

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
    preferredFoot && { label: 'Preferred foot', value: preferredFoot },
    height && { label: 'Height', value: String(height) },
  ].filter(Boolean);

  return (
    <div className="page profile player-profile">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Browse', to: '/browse' },
          teamName && teamName !== 'Unknown'
            ? { label: teamName, to: `/team/${player.teamId}` }
            : null,
          { label: player.name },
        ]}
      />

      <header
        className="profile__hero profile__hero--player player-profile__hero football-accent-surface"
        style={accentStyle}
      >
        <div className="player-profile__hero-main">
          <PlayerVisual player={player} size="profile" priority />
          <div className="player-profile__hero-copy">
            <h1>{player.name}</h1>
            <PositionLabel
              position={player.position}
              className="player-profile__position player-profile__position--hero"
            />
            <div className="player-profile__identity" aria-label="Club and country">
              <Link
                to={`/team/${player.teamId}`}
                className="player-identity-chip player-identity-chip--club"
              >
                {teamName}
              </Link>
              <Link
                to={`/league/${player.leagueId}`}
                className="player-identity-chip player-identity-chip--league"
              >
                {leagueName}
              </Link>
              {liveNationalTeam ? (
                <Link
                  to={`/national-team/${liveNationalTeam.id}`}
                  className="player-identity-chip player-identity-chip--national"
                >
                  {liveNationalTeam.displayName}
                </Link>
              ) : (
                nationalTeamPlainLabel && (
                  <span className="player-identity-chip player-identity-chip--national player-identity-chip--plain">
                    {nationalTeamPlainLabel}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
        <div className="profile__side-actions player-profile__hero-aside">
          <div className="profile__score-block">
            <span className="profile__score-label">{IMPORTANCE_SCORE_LABEL}</span>
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
          Profile preview—facts and career stops below are ready to study. Full quiz clues for this
          player are on the way.
        </p>
      )}

      {isExternalClubStubTeam({ id: player.teamId, leagueId: player.leagueId }) ? (
        <p className="player-study__note" role="note">
          This club is listed for national-team pools. A full club page is coming later.
        </p>
      ) : null}

      <nav className="player-profile__quick-links" aria-label="Quick actions">
        <Link to={`/team/${player.teamId}`}>Club</Link>
        <Link to={`/league/${player.leagueId}`}>League</Link>
        {liveNationalTeam && (
          <Link to={`/national-team/${liveNationalTeam.id}`}>National team</Link>
        )}
        {!liveNationalTeam && nationalTeamPlainLabel ? (
          <span className="player-profile__quick-link--disabled">National team page coming</span>
        ) : null}
        {quizReady && <Link to={`/quiz?team=${player.teamId}`}>Quiz</Link>}
      </nav>

      <section
        className="info-card player-info-card player-section player-section--snapshot"
        aria-labelledby="player-info-title"
      >
        <PlayerSectionHead icon="◎" title="Snapshot" id="player-info-title" />
        <dl className="player-info-grid">
          {playerInfoItems.map((item) => (
            <div
              key={item.label}
              className={`player-info-grid__item player-stat${STAT_EMPHASIS_CLASS[item.label] ? ` ${STAT_EMPHASIS_CLASS[item.label]}` : ''}`}
            >
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="player-profile__divider" aria-hidden="true" />

      <section className="player-profile__body" aria-label={`${player.name} profile`}>
        {(playStyleTags.length > 0 || playStyleSummary) && (
          <article className="info-card player-section player-section--playstyle">
            <PlayerSectionHead icon="⚡" title="Play style" />
            {playStyleTags.length > 0 && (
              <ul className="tag-list player-tag-list" aria-label="Play style tags">
                {playStyleTags.map((tag) => (
                  <li key={tag} className="tag tag--playstyle">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
            {playStyleSummary ? (
              <p className="card-note">{playStyleSummary}</p>
            ) : null}
          </article>
        )}

        {strengths.length > 0 && (
          <article className="info-card player-section player-section--strengths">
            <PlayerSectionHead icon="✦" title="Strengths" />
            <ul className="tag-list tag-list--tight player-tag-list" aria-label="Strengths">
              {strengths.map((s) => (
                <li key={s} className="tag tag--solid">
                  {s}
                </li>
              ))}
            </ul>
          </article>
        )}

        <article className="info-card player-section player-section--career">
          <PlayerSectionHead icon="↗" title="Career highlights" />
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
            <PlayerEmptyState>Career milestones are on the way for this player.</PlayerEmptyState>
          )}
          {hasCareerStops && (
            <details className="player-profile__details">
              <summary>Career notes</summary>
              <p>{careerSummary}</p>
            </details>
          )}
        </article>

        <article
          className={`info-card player-section player-section--honors${showHonors ? '' : ' player-section--muted'}`}
        >
          <PlayerSectionHead icon="🏆" title="Honors" />
          {showHonors ? (
            <ul className="bullet-list player-honors-list" aria-label="Honors and trophies">
              {honors.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          ) : (
            <PlayerEmptyState>More player details are on the way.</PlayerEmptyState>
          )}
        </article>

        {showFunFact ? (
          <article className="info-card player-section player-section--facts">
            <PlayerSectionHead icon="✨" title="Fun facts" />
            <ul className="bullet-list" aria-label="Fun facts">
              <li>{funFact}</li>
            </ul>
          </article>
        ) : null}

        {hasQuizClues && (
          <article className="info-card player-study player-section player-section--quiz">
            <PlayerSectionHead icon="?" title="Quiz clues" />
            <p className="player-study__note">Short hints for recall — not full answers.</p>
            <ul className="tag-list tag-list--stack player-tag-list" aria-label="Quiz clues">
              {quizHints.map((hint, index) => (
                <li key={index} className="tag tag--hint">
                  {hint}
                </li>
              ))}
            </ul>
          </article>
        )}

        <article className="info-card player-section player-section--summary">
          <PlayerSectionHead icon="◆" title="At a glance" />
          <ul className="player-snapshot__list">
            <li>
              <span className="player-snapshot__label">Importance</span>
              <span>{roleSummary}</span>
            </li>
            {displayFact ? (
              <li>
                <span className="player-snapshot__label">Note</span>
                <span>{displayFact}</span>
              </li>
            ) : null}
          </ul>
        </article>
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
    </div>
  );
}
