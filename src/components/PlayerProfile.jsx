import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getManifestLeague } from '../data/contentManifest';
import { loadPlayerById } from '../data/playerStore';
import { peekTeamName } from '../data/teamStore';
import { useFavorites } from '../hooks/useFavorites';
import { useSearchIndex } from '../hooks/useSearchIndex';
import { getDisplayQuickFact, isBrowseOnlyPlayer } from '../utils/playerEditorial';
import {
  buildPlayerProfileEditorial,
  PLAYER_PLACEHOLDER_FACT_RE,
} from '../utils/playerProfileEditorial';
import { IMPORTANCE_SCORE_LABEL, IMPORTANCE_SCORE_TITLE } from '../utils/consumerCopy';
import { getRoleSummary } from '../utils/playerImportance';
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
import ExternalStubNotice from './ExternalStubNotice';
import FavoriteButton from './FavoriteButton';
import PageFallback, { PageLoadingInline } from './PageFallback';
import PlayerVisual from './PlayerVisual';
import PositionLabel from './PositionLabel';
import RelatedPlayersSection from './RelatedPlayersSection';
import ShareButton from './ShareButton';
import EntityRelatedNav from './EntityRelatedNav';
import ProfileKeepExploring from './ProfileKeepExploring';
import { buildPlayerInternalLinks } from '../utils/internalLinking.js';
import { getCanonicalUrl, upsertJsonLdScript } from '../utils/jsonLd';
import {
  applyEntityNotFoundSeo,
  applyPageSeo,
  buildPlayerSeoDescription,
  buildPlayerSeoTitle,
} from '../utils/seoCtr.js';
import { canonicalUrlForPath } from '../utils/brand.js';
import BreadcrumbNav from './BreadcrumbNav';
import CollectionStudyReturnBar from './CollectionStudyReturnBar';
import {
  CRUMB_BROWSE,
  CRUMB_HOME,
  CTA_BACK_TO_BROWSE,
  FIELD_CLUB,
  FIELD_LEAGUE,
  FIELD_NATIONALITY,
  FIELD_NATIONAL_TEAM,
  FIELD_POSITION,
  LINK_CLUB_QUIZ_GUIDE,
  NAME_CLUB_QUIZ,
  linkNationalityPlayers,
} from '../utils/entityCopy.js';

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
  [FIELD_CLUB]: 'player-stat--club',
  [FIELD_LEAGUE]: 'player-stat--league',
  [FIELD_NATIONAL_TEAM]: 'player-stat--national',
  [FIELD_NATIONALITY]: 'player-stat--nationality',
  [FIELD_POSITION]: 'player-stat--position',
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
  const [teamBundle, setTeamBundle] = useState(() => ({
    teamId: null,
    team: null,
    pool: [],
    leagueTeams: [],
  }));

  useEffect(() => {
    if (!player?.teamId) return undefined;

    let cancelled = false;
    const teamId = player.teamId;
    import('../data/sampleData.js').then((mod) => {
      if (cancelled) return;
      const team = mod.getTeamById(teamId) ?? null;
      setTeamBundle({
        teamId,
        team,
        pool: mod.getPlayersForTeam(teamId) ?? [],
        leagueTeams: team?.leagueId
          ? mod.teams.filter((t) => t.leagueId === team.leagueId)
          : [],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [player?.teamId]);

  const teamContext = teamBundle.teamId === player?.teamId ? teamBundle.team : null;
  const teamMatePool = teamBundle.teamId === player?.teamId ? teamBundle.pool : [];
  const leagueTeamsForExplore =
    teamBundle.teamId === player?.teamId ? teamBundle.leagueTeams : [];

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
  const relatedPool = useMemo(() => {
    if (searchIndexStatus === 'ready' && searchIndex?.players?.length) {
      return searchIndex.players;
    }
    return teamMatePool;
  }, [searchIndexStatus, searchIndex, teamMatePool]);
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

  useLayoutEffect(() => {
    if (!player) return undefined;
    const canonical = getCanonicalUrl();
    if (!canonical) return undefined;

    const homeUrl = canonical.replace(/\/player\/[^/]+$/, '/');
    const browseUrl = `${homeUrl.replace(/\/$/, '')}/browse`;
    const teamUrl = `${homeUrl.replace(/\/$/, '')}/team/${player.teamId}`;
    const resolvedTeamName = player?._teamName ?? peekTeamName(player.teamId) ?? 'Unknown';

    const leagueNameForSeo = getLeagueDisplayName({
      id: player.leagueId,
      name: getManifestLeague(player.leagueId)?.name ?? 'Unknown',
    });
    const seoCtx = {
      teamName: resolvedTeamName,
      leagueName: leagueNameForSeo,
      team: teamContext,
      quizReady: !isBrowseOnlyPlayer(player),
    };
    const title = buildPlayerSeoTitle(player, { teamName: resolvedTeamName });
    const description = buildPlayerSeoDescription(player, seoCtx);
    const browseOnly = isBrowseOnlyPlayer(player);

    applyPageSeo({
      title,
      description,
      canonicalUrl: canonical,
      ogType: 'profile',
      // Prevent indexing large volumes of generated placeholder pages while we enrich quiz/editorial.
      // Keep follow so Google can still discover deeper pages via links.
      robots: browseOnly ? 'noindex,follow' : 'index,follow',
      breadcrumbs: [
        { name: 'Home', item: homeUrl },
        { name: 'Browse', item: browseUrl },
        resolvedTeamName && resolvedTeamName !== 'Unknown'
          ? { name: resolvedTeamName, item: teamUrl }
          : null,
        { name: player.name, item: canonical },
      ].filter(Boolean),
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
  }, [player, teamContext]);

  useLayoutEffect(() => {
    if (playerStatus !== 'not-found' && playerStatus !== 'error') return undefined;
    applyEntityNotFoundSeo({
      label: 'Player',
      canonicalUrl: canonicalUrlForPath(`/player/${playerId}`),
    });
    return undefined;
  }, [playerStatus, playerId]);

  if (playerStatus === 'loading') {
    return <PageFallback label="Loading player…" />;
  }

  if (!player || playerStatus === 'not-found' || playerStatus === 'error') {
    return (
      <div className="page player-profile">
        <BreadcrumbNav
          items={[
            { label: 'Home', to: '/' },
            { label: 'Browse', to: '/browse' },
            { label: 'Player not found' },
          ]}
        />
        <header className="page-header">
          <h1>Player not found</h1>
          <p className="empty-state">
            We could not find that player in FootyCompass. Try browse or search for another name.
          </p>
        </header>
        <Link to="/browse" className="btn btn--secondary">
          {CTA_BACK_TO_BROWSE}
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
  const profileEditorial = buildPlayerProfileEditorial(player, {
    teamName,
    leagueName,
    team: teamContext,
  });
  const roleSummary = getRoleSummary(player);
  const careerSummary = profileEditorial.careerSummary;
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
  const hasPlayStyleSection = playStyleTags.length > 0 || Boolean(playStyleSummary);
  const hasStrengthsSection = strengths.length > 0;
  const showKnownForSection =
    profileEditorial.showKnownFor &&
    (profileEditorial.isThin || (!hasPlayStyleSection && !hasStrengthsSection));

  const funFact = normalizeLabel(player.quickFact || '');
  const showFunFact =
    Boolean(funFact) &&
    !PLAYER_PLACEHOLDER_FACT_RE.test(funFact) &&
    funFact !== profileEditorial.about;

  const playerInfoItems = [
    {
      label: FIELD_CLUB,
      value: (
        <Link to={`/team/${player.teamId}`} className="player-profile__info-link">
          {teamName}
        </Link>
      ),
    },
    {
      label: FIELD_LEAGUE,
      value: (
        <Link to={`/league/${player.leagueId}`} className="player-profile__info-link">
          {leagueName}
        </Link>
      ),
    },
    (liveNationalTeam || nationalTeamPlainLabel) && {
      label: FIELD_NATIONAL_TEAM,
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
      label: FIELD_NATIONALITY,
      value: (
        <span className="football-meta-line">
          <CountryFlag label={player.nationality} />
          {player.nationality || '—'}
        </span>
      ),
    },
    { label: FIELD_POSITION, value: formatPosition(player.position) },
    ageDisplay && { label: 'Age', value: ageDisplay },
    dateOfBirth && { label: 'Date of birth', value: dateOfBirth },
    preferredFoot && { label: 'Preferred foot', value: preferredFoot },
    height && { label: 'Height', value: String(height) },
  ].filter(Boolean);

  return (
    <div
      className={`page profile player-profile${profileEditorial.topTier ? ' profile--premium' : ''}${profileEditorial.enrichThin || (Array.isArray(player.knownFor) && player.knownFor.length) ? ' player-profile--enriched' : ''}`}
    >
      <BreadcrumbNav
        items={[
          { label: CRUMB_HOME, to: '/' },
          { label: CRUMB_BROWSE, to: '/browse' },
          teamName && teamName !== 'Unknown'
            ? { label: teamName, to: `/team/${player.teamId}` }
            : null,
          { label: player.name },
        ]}
      />
      <CollectionStudyReturnBar />

      <header
        className="profile__hero profile__hero--player player-profile__hero football-accent-surface"
        style={accentStyle}
      >
        <div className="player-profile__hero-main">
          <div className="player-profile__hero-visual">
            <PlayerVisual player={player} size="profile" priority showCredit />
          </div>
          <div className="player-profile__hero-copy">
            <h1>{player.name}</h1>
            {profileEditorial.heroLede ? (
              <p className="player-profile__hero-lede">{profileEditorial.heroLede}</p>
            ) : null}
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
          <div className="profile__score-block" title={IMPORTANCE_SCORE_TITLE}>
            <span className="profile__score-label">{IMPORTANCE_SCORE_LABEL}</span>
            <span className="profile__score-value">{player.importanceScore}</span>
          </div>
          <FavoriteButton
            itemName={player.name}
            saved={saved}
            onToggle={() => togglePlayer(player.id)}
          />
          <ShareButton
            title={`${player.name} · FootyCompass`}
            text={`Check out ${player.name} on FootyCompass.`}
            url={typeof window !== 'undefined' ? window.location.href : undefined}
            copiedLabel="Copied player link"
            sharedLabel="Shared"
          >
            Share
          </ShareButton>
        </div>
      </header>

      <DataTrustNotice compact />

      {browseOnly && (
        <p className="player-study__note" role="status">
          Study profile ready to read — quiz hints for this player are still being added.
        </p>
      )}

      {isExternalClubStubTeam({ id: player.teamId, leagueId: player.leagueId }) ? (
        <ExternalStubNotice compact />
      ) : null}

      <nav
        className={`player-profile__quick-links${profileEditorial.topTier ? ' player-profile__quick-links--curated' : ''}`}
        aria-label="Quick actions"
      >
        {quizReady && <Link to={`/quiz?team=${player.teamId}`}>{NAME_CLUB_QUIZ}</Link>}
        <Link to={`/hubs/quizzes/team/${player.teamId}`}>{LINK_CLUB_QUIZ_GUIDE}</Link>
        {!profileEditorial.topTier && player.nationality ? (
          <Link
            to={`/hubs/players/nationality/${encodeURIComponent(String(player.nationality).trim())}`}
          >
            {linkNationalityPlayers(player.nationality)}
          </Link>
        ) : null}
        {!profileEditorial.topTier && quizReady && typeof player.age === 'number' && player.age <= 23 ? (
          <Link to="/quiz?theme=wonderkids">Wonderkids quiz</Link>
        ) : null}
        {!profileEditorial.topTier && quizReady && (player.importanceScore ?? 0) >= 88 ? (
          <Link to="/quiz?theme=legends">Legends quiz</Link>
        ) : null}
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

      {profileEditorial.showAbout ? (
        <section
          className="info-card player-section player-section--about"
          aria-labelledby="player-about-title"
        >
          <PlayerSectionHead icon="📋" title="About the player" id="player-about-title" />
          <p className="player-profile__about">{profileEditorial.about}</p>
        </section>
      ) : null}

      {showKnownForSection ? (
        <section
          className="info-card player-section player-section--known-for"
          aria-labelledby="player-known-for-title"
        >
          <PlayerSectionHead icon="★" title="Known for" id="player-known-for-title" />
          <ul className="tag-list tag-list--tight player-tag-list" aria-label="Known for">
            {profileEditorial.knownFor.map((item) => (
              <li key={item} className="tag tag--solid">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profileEditorial.showPlayStyleBlurb ? (
        <section
          className="info-card player-section player-section--playstyle-blurb"
          aria-labelledby="player-playstyle-blurb-title"
        >
          <PlayerSectionHead icon="⚡" title="How they play" id="player-playstyle-blurb-title" />
          <p className="player-profile__about">{profileEditorial.playStyleBlurb}</p>
        </section>
      ) : null}

      <div className="player-profile__divider" aria-hidden="true" />

      <section className="player-profile__body" aria-label={`${player.name} profile`}>
        {(playStyleTags.length > 0 || playStyleSummary) &&
        !(profileEditorial.topTier && profileEditorial.showPlayStyleBlurb) ? (
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
        ) : null}

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
            <PlayerEmptyState>Major honors haven&apos;t been added for this player yet.</PlayerEmptyState>
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
              <span className="player-snapshot__label">Role</span>
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

      {profileEditorial.topTier ||
      profileEditorial.isThin ||
      isBrowseOnlyPlayer(player) ? (
        <ProfileKeepExploring
          variant="player"
          premium={profileEditorial.topTier}
          entityId={player.id}
          player={player}
          teamId={player.teamId}
          leagueId={player.leagueId}
          teamName={teamName}
          leagueName={leagueName}
          quizReady={quizReady}
          team={teamContext}
          leagueTeams={leagueTeamsForExplore}
          nationalTeamId={liveNationalTeam?.id}
        />
      ) : (
        <EntityRelatedNav
          links={buildPlayerInternalLinks({
            player,
            teamId: player.teamId,
            leagueId: player.leagueId,
            teamName,
            leagueName,
            quizReady,
            nationalTeamId: liveNationalTeam?.id,
            nationality: player.nationality,
          })}
        />
      )}

      {relatedLoading ? <PageLoadingInline label="Loading related players…" /> : null}
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
