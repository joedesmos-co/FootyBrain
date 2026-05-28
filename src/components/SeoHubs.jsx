import { useEffect, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { leagues, players, teams } from '../data/sampleData';
import { canonicalUrlForPath, pageTitle, SITE_NAME, SITE_URL } from '../utils/brand';
import { DATASET_META } from '../data/datasetMeta';
import { formatCountryLabel, getLeagueDisplayName, isExternalLeagueId } from '../utils/footballDisplay';
import { upsertJsonLdScript } from '../utils/jsonLd';
import { setSeoMeta } from '../utils/seoMeta';
import PlayerCard from './PlayerCard';
import TeamCard from './TeamCard';
import { getManifestLeague } from '../data/contentManifest';
import LeagueBadge from './LeagueBadge';
import BreadcrumbNav from './BreadcrumbNav';

function buildFaqJsonLd({ canonical, faqs }) {
  const mainEntity = (faqs ?? []).slice(0, 10).map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  }));

  if (!mainEntity.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: canonical,
    mainEntity,
  };
}

function buildLandingJsonLd({ title, description, canonical, links }) {
  const itemList = (links ?? []).slice(0, 24).map((link, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: link.label,
    url: link.url,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: canonical,
    description,
    mainEntity: itemList.length
      ? {
          '@type': 'ItemList',
          itemListElement: itemList,
        }
      : undefined,
  };
}

function useLandingSeo({ title, description, canonical, links, faqs }) {
  const image = `${SITE_URL}/og.svg`;
  useEffect(() => {
    setSeoMeta({
      title,
      description,
      canonicalUrl: canonical,
      robots: 'index,follow',
      og: {
        title,
        description,
        url: canonical,
        type: 'website',
        site_name: SITE_NAME,
        image,
        imageWidth: 1200,
        imageHeight: 630,
      },
      twitter: { title, description, card: 'summary_large_image', image },
    });

    upsertJsonLdScript(
      'jsonld-landing',
      buildLandingJsonLd({ title, description, canonical, links }),
    );
    upsertJsonLdScript('jsonld-faq', buildFaqJsonLd({ canonical, faqs }));

    return () => {
      upsertJsonLdScript('jsonld-landing', null);
      upsertJsonLdScript('jsonld-faq', null);
    };
  }, [title, description, canonical, links, faqs, image]);
}

function sortByImportanceDesc(a, b) {
  return (Number(b.importanceScore) || 0) - (Number(a.importanceScore) || 0);
}

function parseIsoDate(value) {
  if (typeof value !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function yearsBetween(earlier, later) {
  const years = later.getUTCFullYear() - earlier.getUTCFullYear();
  const laterMonth = later.getUTCMonth();
  const laterDay = later.getUTCDate();
  const earlierMonth = earlier.getUTCMonth();
  const earlierDay = earlier.getUTCDate();
  const hadBirthday =
    laterMonth > earlierMonth || (laterMonth === earlierMonth && laterDay >= earlierDay);
  return hadBirthday ? years : years - 1;
}

function HubSection({ title, children, linkTo, linkLabel }) {
  return (
    <section className="collections-page__section" aria-label={title}>
      <div className="collections-page__section-head">
        <h2 className="collections-section-title">{title}</h2>
        {linkTo ? (
          <Link to={linkTo} className="collections-page__section-link">
            {linkLabel ?? 'View all'}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function SeoHubsIndex() {
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);
  const title = pageTitle('Football hubs');
  const description =
    'Indexable football discovery hubs: quizzes, players by nationality, best young footballers, and World Cup prep.';
  const links = [
    { label: 'Quizzes hub', url: canonicalUrlForPath('/hubs/quizzes') },
    { label: 'Players by nationality', url: canonicalUrlForPath('/hubs/players/by-nationality') },
    { label: 'Best young footballers', url: canonicalUrlForPath('/hubs/players/best-young-footballers') },
    { label: 'World Cup player quiz', url: canonicalUrlForPath('/hubs/world-cup/player-quiz') },
    { label: 'Learn football players', url: canonicalUrlForPath('/hubs/learn/football-players') },
  ];
  useLandingSeo({
    title,
    description,
    canonical,
    links,
    faqs: [
      {
        question: 'What are FootyCompass hubs?',
        answer:
          'Hubs are indexable landing pages designed for search and browsing. They link into player, club, league, and quiz pages to help you discover content quickly.',
      },
      {
        question: 'Are hubs updated live?',
        answer: `No—FootyCompass ships with a static dataset snapshot (currently ${DATASET_META.dataAsOf}).`,
      },
    ],
  });

  return (
    <div className="page collections-page">
      <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'Hubs' }]} />
      <header className="page-header">
        <p className="page-header__eyebrow">Search hubs</p>
        <h1>Football discovery hubs</h1>
        <p>
          Built for search and browsing: focused pages that link into player, club, league, and quiz
          content.
        </p>
        <p className="page-header__meta">
          Last updated: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      <ul className="card-grid" aria-label="Hubs">
        <li className="player-card">
          <h3>Quizzes</h3>
          <p>Find player quizzes by league and club.</p>
          <Link to="/hubs/quizzes" className="btn btn--primary btn--small">
            Open quizzes hub
          </Link>
        </li>
        <li className="player-card">
          <h3>Players by nationality</h3>
          <p>Browse football players grouped by nationality.</p>
          <Link to="/hubs/players/by-nationality" className="btn btn--primary btn--small">
            Browse nationalities
          </Link>
        </li>
        <li className="player-card">
          <h3>Best young footballers</h3>
          <p>High-importance young players in the current dataset.</p>
          <Link to="/hubs/players/best-young-footballers" className="btn btn--primary btn--small">
            View young players
          </Link>
        </li>
        <li className="player-card">
          <h3>World Cup prep</h3>
          <p>International and World Cup discovery paths and quizzes.</p>
          <Link to="/hubs/world-cup/player-quiz" className="btn btn--primary btn--small">
            World Cup hub
          </Link>
        </li>
      </ul>
    </div>
  );
}

export function SeoQuizzesHub() {
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);
  const title = pageTitle('Football player quizzes');
  const description =
    'Guess football players from hints. Explore quiz landing pages by league and club, then play on the main quiz page.';

  const leagueLinks = (leagues ?? [])
    .filter((l) => l?.id && !isExternalLeagueId(l.id))
    .map((l) => ({
      label: `${getLeagueDisplayName(l)} player quiz`,
      url: canonicalUrlForPath(`/hubs/quizzes/league/${l.id}`),
    }));

  useLandingSeo({
    title,
    description,
    canonical,
    links: leagueLinks.slice(0, 12),
    faqs: [
      {
        question: 'How do the football player quizzes work?',
        answer:
          'Open a league or club hub to explore players, then play on the Quizzes page to guess players from hints.',
      },
      {
        question: 'Do I need an account?',
        answer: 'No. You can play without signing in. Progress can be stored locally on your device.',
      },
    ],
  });

  return (
    <div className="page collections-page">
      <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'Hubs', to: '/hubs' }, { label: 'Quizzes' }]} />
      <header className="page-header">
        <p className="page-header__eyebrow">Quizzes</p>
        <h1>Football quizzes</h1>
        <p>
          Player quizzes (guess from hints) and{' '}
          <Link to="/hubs/quizzes/clubs">club quizzes</Link> (stadiums, leagues, rivalries). Pick a
          hub below or jump straight to{' '}
          <Link to="/quiz">player quiz</Link> / <Link to="/club-quiz">club quiz</Link>.
        </p>
        <p className="page-header__meta">
          Last updated: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      <div className="empty-state__actions">
        <Link to="/hubs/quizzes/themes" className="btn btn--primary">
          Themed quiz pools
        </Link>
        <Link to="/hubs/quizzes/clubs" className="btn btn--primary">
          Club quizzes
        </Link>
        <Link to="/quiz" className="btn btn--secondary">
          Player quiz
        </Link>
        <Link to="/club-quiz" className="btn btn--secondary">
          Play club quiz
        </Link>
      </div>

      <HubSection title="Player quizzes by league">
        <ul className="card-grid" aria-label="League quiz hubs">
          {leagues
            .filter((league) => league?.id && !isExternalLeagueId(league.id))
            .map((league) => (
              <li key={league.id} className="player-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <LeagueBadge league={league} />
                  <div>
                    <h3 style={{ margin: 0 }}>{getLeagueDisplayName(league)}</h3>
                    <p style={{ margin: '0.25rem 0 0' }}>
                      Guess players from {getLeagueDisplayName(league)} clubs.
                    </p>
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <Link
                    to={`/hubs/quizzes/league/${league.id}`}
                    className="btn btn--primary btn--small"
                  >
                    Open league quiz page
                  </Link>
                  <Link to="/quiz" className="btn btn--secondary btn--small" style={{ marginLeft: '0.5rem' }}>
                    Play quizzes
                  </Link>
                </div>
              </li>
            ))}
        </ul>
      </HubSection>
    </div>
  );
}

export function SeoLeagueQuizHub() {
  const { leagueId } = useParams();
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);
  const league = (leagues ?? []).find((l) => l?.id === leagueId) ?? { id: leagueId, name: leagueId };
  const leagueName = getLeagueDisplayName(league);

  const title = pageTitle(`Guess the ${leagueName} player`);
  const description = `A ${leagueName} player quiz landing page. Browse key clubs and players, then play the quiz on FootyCompass.`;

  const leagueTeams = useMemo(
    () => (teams ?? []).filter((t) => t?.leagueId === leagueId && t.leagueId !== 'external'),
    [leagueId],
  );
  const topTeams = useMemo(() => leagueTeams.slice(0, 18), [leagueTeams]);
  const leaguePlayers = useMemo(
    () => (players ?? []).filter((p) => p?.leagueId === leagueId).slice().sort(sortByImportanceDesc),
    [leagueId],
  );
  const topPlayers = useMemo(() => leaguePlayers.slice(0, 12), [leaguePlayers]);

  const links = [
    ...topTeams.map((t) => ({ label: t.name, url: canonicalUrlForPath(`/team/${t.id}`) })),
    ...topPlayers.map((p) => ({ label: p.name, url: canonicalUrlForPath(`/player/${p.id}`) })),
  ];
  useLandingSeo({
    title,
    description,
    canonical,
    links,
    faqs: [
      {
        question: `What is the “Guess the ${leagueName} player” hub?`,
        answer:
          'It’s a landing page to browse clubs and players in the league, with direct links into profiles and the Quizzes page.',
      },
      {
        question: 'Is this an official league quiz?',
        answer: 'No. FootyCompass is an independent learning project and not an official league property.',
      },
    ],
  });

  return (
    <div className="page collections-page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Hubs', to: '/hubs' },
          { label: 'Quizzes', to: '/hubs/quizzes' },
          { label: leagueName },
        ]}
      />
      <header className="page-header">
        <p className="page-header__eyebrow">League quiz</p>
        <h1>Guess the {leagueName} player</h1>
        <p>
          A fast way to explore the league: open a few club profiles, then head to{' '}
          <Link to="/quiz">Quizzes</Link> to play.
        </p>
        <p className="page-header__meta">
          Last updated: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      <HubSection title={`${leagueName} clubs`}>
        <ul className="card-grid" aria-label={`${leagueName} clubs`}>
          {topTeams.map((team) => (
            <li key={team.id}>
              <TeamCard team={team} />
            </li>
          ))}
        </ul>
      </HubSection>

      <HubSection title={`${leagueName} players (start here)`} linkTo={`/league/${leagueId}`} linkLabel="League page">
        <ul className="card-grid" aria-label={`${leagueName} players`}>
          {topPlayers.map((player) => (
            <li key={player.id}>
              <PlayerCard player={player} />
            </li>
          ))}
        </ul>
        <div className="empty-state__actions">
          <Link to="/quiz" className="btn btn--primary">
            Play quizzes
          </Link>
          <Link to={`/browse?league=${leagueId}`} className="btn btn--secondary">
            Browse {leagueName} players
          </Link>
        </div>
      </HubSection>
    </div>
  );
}

export function SeoTeamQuizHub() {
  const { teamId } = useParams();
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);

  const team = (teams ?? []).find((t) => t?.id === teamId);
  const teamName = team?.name ?? 'Club';
  const leagueName = team ? getManifestLeague(team.leagueId)?.name ?? 'League' : 'League';
  const title = team ? pageTitle(`${teamName} player quiz`) : pageTitle('Club player quiz');
  const description = team
    ? `${teamName} player quiz landing page. Explore the club profile and key players, then play the quiz on FootyCompass.`
    : 'Club quiz landing page. Browse club profiles and play quizzes on FootyCompass.';

  const clubPlayers = useMemo(
    () =>
      (players ?? [])
        .filter((p) => p?.teamId === teamId)
        .slice()
        .sort(sortByImportanceDesc),
    [teamId],
  );
  const topPlayers = useMemo(() => clubPlayers.slice(0, 18), [clubPlayers]);
  const links = topPlayers.map((p) => ({ label: p.name, url: canonicalUrlForPath(`/player/${p.id}`) }));
  useLandingSeo({
    title,
    description,
    canonical,
    links,
    faqs: team
      ? [
          {
            question: `How do I use the ${teamName} player quiz hub?`,
            answer:
              'Start by opening the club profile to learn the squad, then go to Quizzes to play and reinforce recognition.',
          },
          {
            question: 'Is the squad list live?',
            answer: `No—this hub is based on a static dataset snapshot (currently ${DATASET_META.dataAsOf}).`,
          },
        ]
      : [
          {
            question: 'How do club quiz hubs work?',
            answer:
              'Club hubs link to key player profiles and the main Quizzes page. Use them to learn a squad quickly before playing.',
          },
        ],
  });

  if (!team) {
    return (
      <div className="page">
        <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'Hubs', to: '/hubs' }, { label: 'Quizzes', to: '/hubs/quizzes' }, { label: 'Club' }]} />
        <header className="page-header">
          <h1>Club player quiz</h1>
          <p>Club not found. Try the main quiz page or browse clubs.</p>
        </header>
        <div className="empty-state__actions">
          <Link to="/quiz" className="btn btn--primary">
            Play quizzes
          </Link>
          <Link to="/teams" className="btn btn--secondary">
            Explore clubs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page collections-page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Hubs', to: '/hubs' },
          { label: 'Quizzes', to: '/hubs/quizzes' },
          { label: teamName },
        ]}
      />
      <header className="page-header">
        <p className="page-header__eyebrow">Club quiz</p>
        <h1>{teamName} player quiz</h1>
        <p>
          Learn the squad first on the <Link to={`/team/${team.id}`}>club profile</Link>, then play on{' '}
          <Link to="/quiz">Quizzes</Link>.
        </p>
        <p>
          {formatCountryLabel(team.country)} · {leagueName}
        </p>
        <p className="page-header__meta">
          Last updated: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      <HubSection title="Key players (from the current dataset)" linkTo={`/team/${team.id}`} linkLabel="Club profile">
        <ul className="card-grid" aria-label={`${teamName} players`}>
          {topPlayers.map((player) => (
            <li key={player.id}>
              <PlayerCard player={player} />
            </li>
          ))}
        </ul>
        <div className="empty-state__actions">
          <Link to="/quiz" className="btn btn--primary">
            Play quizzes
          </Link>
          <Link to={`/browse?tab=clubs`} className="btn btn--secondary">
            Browse clubs
          </Link>
        </div>
      </HubSection>
    </div>
  );
}

export function SeoPlayersByNationalityHub() {
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);
  const title = pageTitle('Football players by nationality');
  const description =
    'Browse football players by nationality. Open a nationality page to discover key players and clubs.';

  const nations = useMemo(() => {
    const counts = new Map();
    for (const p of players ?? []) {
      const nation = String(p?.nationality ?? '').trim();
      if (!nation) continue;
      counts.set(nation, (counts.get(nation) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([nation, count]) => ({ nation, count }))
      .sort((a, b) => b.count - a.count || a.nation.localeCompare(b.nation));
  }, []);

  const links = nations.slice(0, 24).map((row) => ({
    label: `${row.nation} football players`,
    url: canonicalUrlForPath(`/hubs/players/nationality/${encodeURIComponent(row.nation)}`),
  }));
  useLandingSeo({
    title,
    description,
    canonical,
    links,
    faqs: [
      {
        question: 'How are players grouped by nationality?',
        answer:
          'Nationality pages are generated from the current dataset snapshot and are meant for learning and discovery, not as official rosters.',
      },
      {
        question: 'Can I use this to study for quizzes?',
        answer:
          'Yes—open a few profiles from a nationality page for context, then jump to Quizzes to reinforce recognition.',
      },
    ],
  });

  return (
    <div className="page collections-page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Hubs', to: '/hubs' },
          { label: 'Players by nationality' },
        ]}
      />
      <header className="page-header">
        <p className="page-header__eyebrow">Players</p>
        <h1>Football players by nationality</h1>
        <p>
          Pick a nationality to see a curated list of players and direct links to their profiles.
        </p>
        <p className="page-header__meta">
          Last updated: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      <HubSection title="Top nationalities in the dataset">
        <ul className="card-grid" aria-label="Nationalities">
          {nations.slice(0, 48).map((row) => (
            <li key={row.nation} className="player-card">
              <h3 style={{ marginTop: 0 }}>{formatCountryLabel(row.nation)}</h3>
              <p style={{ margin: '0.35rem 0 0' }}>{row.count} players</p>
              <div style={{ marginTop: '0.75rem' }}>
                <Link
                  to={`/hubs/players/nationality/${encodeURIComponent(row.nation)}`}
                  className="btn btn--primary btn--small"
                >
                  Open nationality page
                </Link>
                <Link to="/browse" className="btn btn--secondary btn--small" style={{ marginLeft: '0.5rem' }}>
                  Browse
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </HubSection>
    </div>
  );
}

export function SeoNationalityPlayersHub() {
  const { nation } = useParams();
  const nationLabel = decodeURIComponent(String(nation ?? ''));
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);

  const title = pageTitle(`${nationLabel} football players`);
  const description = `Explore football players from ${nationLabel}. Open profiles to learn clubs, leagues, and quiz eligibility.`;

  const nationPlayers = useMemo(
    () =>
      (players ?? [])
        .filter((p) => String(p?.nationality ?? '').trim() === nationLabel)
        .slice()
        .sort(sortByImportanceDesc),
    [nationLabel],
  );
  const topPlayers = useMemo(() => nationPlayers.slice(0, 24), [nationPlayers]);
  const links = topPlayers.map((p) => ({ label: p.name, url: canonicalUrlForPath(`/player/${p.id}`) }));
  useLandingSeo({
    title,
    description,
    canonical,
    links,
    faqs: [
      {
        question: `What will I find on the ${formatCountryLabel(nationLabel)} players page?`,
        answer:
          'A curated set of player profiles from the current dataset, with quick links to keep exploring and to jump into quizzes.',
      },
      {
        question: 'Is this an official roster?',
        answer:
          'No. It’s a learning list built from a dataset snapshot and is not an official federation roster.',
      },
    ],
  });

  return (
    <div className="page collections-page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Hubs', to: '/hubs' },
          { label: 'Players by nationality', to: '/hubs/players/by-nationality' },
          { label: formatCountryLabel(nationLabel) },
        ]}
      />
      <header className="page-header">
        <p className="page-header__eyebrow">Nationality</p>
        <h1>{formatCountryLabel(nationLabel)} football players</h1>
        <p>
          Open a few profiles, then jump to <Link to="/quiz">Quizzes</Link> to test yourself.
        </p>
        <p className="page-header__meta">
          Last updated: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      <HubSection title="Players (start here)">
        <ul className="card-grid" aria-label={`${nationLabel} players`}>
          {topPlayers.map((player) => (
            <li key={player.id}>
              <PlayerCard player={player} />
            </li>
          ))}
        </ul>
        <div className="empty-state__actions">
          <Link to="/quiz" className="btn btn--primary">
            Play quizzes
          </Link>
          <Link to="/hubs/players/by-nationality" className="btn btn--secondary">
            All nationalities
          </Link>
        </div>
      </HubSection>
    </div>
  );
}

export function SeoBestYoungFootballersHub() {
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);
  const title = pageTitle('Best young footballers');
  const description =
    'Best young footballers in the current dataset (based on importance score and available birth dates). Explore profiles and then play quizzes.';

  const youngPlayers = useMemo(() => {
    const now = new Date();
    const rows = [];
    for (const p of players ?? []) {
      const dob = parseIsoDate(p?.dateOfBirth);
      if (!dob) continue;
      const age = yearsBetween(dob, now);
      if (age < 0 || age > 23) continue;
      rows.push({ player: p, age });
    }
    rows.sort((a, b) => sortByImportanceDesc(a.player, b.player) || a.age - b.age);
    return rows;
  }, []);

  const links = youngPlayers.slice(0, 24).map((row) => ({
    label: row.player.name,
    url: canonicalUrlForPath(`/player/${row.player.id}`),
  }));
  useLandingSeo({
    title,
    description,
    canonical,
    links,
    faqs: [
      {
        question: 'How are “best young footballers” selected?',
        answer:
          'This hub uses players with birth dates in the dataset and ranks them by importance score to create a practical shortlist.',
      },
      {
        question: 'Is the list definitive?',
        answer:
          'No—think of it as a learning starting point. Open profiles for context and use quizzes to reinforce recognition.',
      },
    ],
  });

  return (
    <div className="page collections-page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Hubs', to: '/hubs' },
          { label: 'Best young footballers' },
        ]}
      />
      <header className="page-header">
        <p className="page-header__eyebrow">Players</p>
        <h1>Best young footballers</h1>
        <p>
          A starter list of young players based on importance score in the current FootyCompass
          dataset. Open profiles to learn clubs, leagues, and roles.
        </p>
        <p className="page-header__meta">
          Last updated: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      <HubSection title="Young players (≤ 23)">
        <ul className="card-grid" aria-label="Young players">
          {youngPlayers.slice(0, 30).map((row) => (
            <li key={row.player.id}>
              <PlayerCard player={row.player} />
            </li>
          ))}
        </ul>
        <div className="empty-state__actions">
          <Link to="/quiz" className="btn btn--primary">
            Play quizzes
          </Link>
          <Link to="/browse" className="btn btn--secondary">
            Browse players
          </Link>
        </div>
      </HubSection>
    </div>
  );
}

export function SeoWorldCupPlayerQuizHub() {
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);
  const title = pageTitle('World Cup player quiz');
  const description =
    'World Cup player quiz hub: explore featured nations and players, then play international quizzes and prep sessions.';
  const links = [
    { label: 'World Cup hub', url: canonicalUrlForPath('/world-cup') },
    { label: 'National teams', url: canonicalUrlForPath('/national-teams') },
    { label: 'Quizzes', url: canonicalUrlForPath('/quiz') },
  ];
  useLandingSeo({
    title,
    description,
    canonical,
    links,
    faqs: [
      {
        question: 'Is this an official World Cup roster?',
        answer:
          'No. This hub is for learning and prep and is based on a dataset snapshot, not official tournament squads.',
      },
      {
        question: 'How should I use this for prep?',
        answer:
          'Start with the World Cup hub and national teams, open a few player profiles, then play quizzes to practice recognition.',
      },
    ],
  });

  return (
    <div className="page">
      <BreadcrumbNav
        items={[
          { label: 'Home', to: '/' },
          { label: 'Hubs', to: '/hubs' },
          { label: 'World Cup player quiz' },
        ]}
      />
      <header className="page-header">
        <p className="page-header__eyebrow">World Cup</p>
        <h1>World Cup player quiz</h1>
        <p>
          Start with the <Link to="/world-cup">World Cup hub</Link>, then use{' '}
          <Link to="/quiz">Quizzes</Link> to play international sessions.
        </p>
        <p className="page-header__meta">
          Last updated: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      <div className="empty-state__actions">
        <Link to="/world-cup" className="btn btn--primary">
          Open World Cup hub
        </Link>
        <Link to="/quiz" className="btn btn--secondary">
          Play quizzes
        </Link>
        <Link to="/national-teams" className="btn btn--secondary">
          Browse national teams
        </Link>
      </div>
    </div>
  );
}

export function SeoLearnFootballPlayersHub() {
  const { pathname } = useLocation();
  const canonical = canonicalUrlForPath(pathname);
  const title = pageTitle('Learn football players');
  const description =
    'Learn football players with profiles, clubs, leagues, and quizzes. A structured route to build football knowledge fast.';
  const links = [
    { label: 'Browse players', url: canonicalUrlForPath('/browse') },
    { label: 'Clubs', url: canonicalUrlForPath('/teams') },
    { label: 'Collections', url: canonicalUrlForPath('/collections') },
    { label: 'Learning paths', url: canonicalUrlForPath('/learning-paths') },
    { label: 'Quizzes', url: canonicalUrlForPath('/quiz') },
  ];
  useLandingSeo({
    title,
    description,
    canonical,
    links,
    faqs: [
      {
        question: 'What is the fastest way to learn football players?',
        answer:
          'Browse a league or club, open 5–10 player profiles for context, then do a short quiz session. Repeat daily for retention.',
      },
      {
        question: 'Do I need an account?',
        answer: 'No. You can start immediately. Progress can be stored locally on your device.',
      },
    ],
  });

  return (
    <div className="page collections-page">
      <BreadcrumbNav items={[{ label: 'Home', to: '/' }, { label: 'Hubs', to: '/hubs' }, { label: 'Learn football players' }]} />
      <header className="page-header">
        <p className="page-header__eyebrow">Start here</p>
        <h1>Learn football players</h1>
        <p>
          A simple route: browse, open profiles, then quiz yourself. No accounts needed.
        </p>
        <p className="page-header__meta">
          Last updated: <strong>{DATASET_META.dataAsOf}</strong>
        </p>
      </header>

      <HubSection title="A fast route to learn players">
        <ul className="card-grid" aria-label="Learning steps">
          <li className="player-card">
            <h3>1) Browse players</h3>
            <p>Search by name and open profiles.</p>
            <Link to="/browse" className="btn btn--primary btn--small">
              Browse players
            </Link>
          </li>
          <li className="player-card">
            <h3>2) Learn clubs and leagues</h3>
            <p>Use club pages to anchor players in context.</p>
            <Link to="/teams" className="btn btn--primary btn--small">
              Explore clubs
            </Link>
          </li>
          <li className="player-card">
            <h3>3) Use collections and paths</h3>
            <p>Curated routes through key profiles.</p>
            <Link to="/learning-paths" className="btn btn--primary btn--small">
              Learning paths
            </Link>
          </li>
          <li className="player-card">
            <h3>4) Play quizzes</h3>
            <p>Guess players from hints and career paths.</p>
            <Link to="/quiz" className="btn btn--primary btn--small">
              Play quizzes
            </Link>
          </li>
        </ul>
      </HubSection>
    </div>
  );
}

