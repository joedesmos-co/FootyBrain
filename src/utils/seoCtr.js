/**
 * CTR-focused titles, meta descriptions, and consistent social / JSON-LD helpers.
 */

import { useLayoutEffect } from 'react';
import { getClubQuizCategoryById } from '../data/clubQuizCategories.js';
import { getQuizThemeById } from '../data/quizThemes.js';
import { getNationalTeamName } from '../data/nationalTeamData.js';
import { peekTeamName } from '../data/teamStore.js';
import { pageTitle, SITE_NAME, SITE_URL } from './brand.js';
import { formatPosition, getLeagueDisplayName } from './footballDisplay.js';
import { upsertJsonLdScript } from './jsonLd.js';
import { buildPlayerProfileDescription } from './playerProfileEditorial.js';
import { setSeoMeta } from './seoMeta.js';
import { isQuizEligiblePlayer } from './quizPlayerRules.js';
import { buildClubProfileDescription } from './clubProfileEditorial.js';
import { buildRichNationalTeamMetaDescription } from './nationalProfileEditorial.js';
import { FEATURED_NATIONAL_TEAM_IDS } from '../data/worldCupHubData.js';
import {
  buildTopLeagueMetaDescription,
  buildTopTeamMetaDescription,
  isHighTrafficTeam,
} from './topImportanceProfile.js';

export const META_DESCRIPTION_MAX = 158;
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og.png`;

export function truncateMetaDescription(text, max = META_DESCRIPTION_MAX) {
  const cleaned = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  if (cleaned.length <= max) return cleaned;
  const slice = cleaned.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

export function buildBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((row, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: row.name,
      item: row.item,
    })),
  };
}

export function buildFaqPageJsonLd({ canonical, faqs }) {
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

export function buildWebPageJsonLd({ title, description, canonical, itemList }) {
  const itemListElement = (itemList ?? []).slice(0, 24).map((link, idx) => ({
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
    mainEntity: itemListElement.length
      ? { '@type': 'ItemList', itemListElement }
      : undefined,
  };
}

/**
 * Set document meta, Open Graph, Twitter, and optional JSON-LD in one call.
 */
export function applyPageSeo({
  title,
  description,
  canonicalUrl,
  robots = 'index,follow',
  ogType = 'website',
  breadcrumbs = null,
  faqs = null,
  itemList = null,
  webPageName = null,
} = {}) {
  const desc = truncateMetaDescription(description);

  setSeoMeta({
    title,
    description: desc,
    canonicalUrl,
    robots,
    og: {
      site_name: SITE_NAME,
      type: ogType,
      title,
      description: desc,
      url: canonicalUrl,
      image: DEFAULT_SOCIAL_IMAGE,
      imageWidth: 1200,
      imageHeight: 630,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      image: DEFAULT_SOCIAL_IMAGE,
    },
  });

  if (breadcrumbs?.length) {
    upsertJsonLdScript('jsonld-breadcrumb', buildBreadcrumbJsonLd(breadcrumbs));
  }

  if (faqs?.length && canonicalUrl) {
    upsertJsonLdScript('jsonld-faq', buildFaqPageJsonLd({ canonical: canonicalUrl, faqs }));
  } else {
    upsertJsonLdScript('jsonld-faq', null);
  }

  if ((itemList?.length || webPageName) && canonicalUrl) {
    upsertJsonLdScript(
      'jsonld-landing',
      buildWebPageJsonLd({
        title: webPageName ?? title,
        description: desc,
        canonical: canonicalUrl,
        itemList,
      }),
    );
  }
}

export function clearPageSeoExtras() {
  upsertJsonLdScript('jsonld-breadcrumb', null);
  upsertJsonLdScript('jsonld-faq', null);
  upsertJsonLdScript('jsonld-landing', null);
  upsertJsonLdScript('jsonld-person', null);
  upsertJsonLdScript('jsonld-sportsteam', null);
  upsertJsonLdScript('jsonld-sportsleague', null);
}

/**
 * Thin / missing entity pages — avoid indexing empty shells.
 */
export function applyEntityNotFoundSeo({ label, canonicalUrl }) {
  applyPageSeo({
    title: pageTitle(`${label} not found`),
    description: `This ${label.toLowerCase()} is not listed on FootyCompass. Browse players, clubs, and leagues or use search.`,
    canonicalUrl,
    robots: 'noindex,nofollow',
  });
  upsertJsonLdScript('jsonld-person', null);
  upsertJsonLdScript('jsonld-sportsteam', null);
  upsertJsonLdScript('jsonld-sportsleague', null);
  upsertJsonLdScript('jsonld-breadcrumb', null);
}

/**
 * @param {object} config
 * @param {unknown[]} deps
 */
export function usePageSeo(config, deps = []) {
  useLayoutEffect(() => {
    if (!config) return undefined;
    applyPageSeo(config);
    return () => clearPageSeoExtras();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies deps
  }, deps);
}

// ——— Entity titles & descriptions ———

export function buildPlayerSeoTitle(player, { teamName = 'club' } = {}) {
  const position = formatPosition(player.position);
  const club = teamName || 'club';
  if (position) {
    return pageTitle(`${player.name} — ${position}, ${club} | Profile & quiz`);
  }
  return pageTitle(`${player.name} — ${club} | Football profile & quiz`);
}

export function buildPlayerSeoDescription(player, ctx = {}) {
  const base = buildPlayerProfileDescription(player, ctx);
  const hook =
    ctx.quizReady !== false && isQuizEligiblePlayer(player)
      ? 'Open quiz clues, club links, and similar players.'
      : 'Browse club, league, and nationality links to learn the squad.';
  return truncateMetaDescription(`${base} ${hook}`);
}

export function buildTeamSeoTitle(team, { leagueName = '' } = {}) {
  const league = leagueName ? ` · ${leagueName}` : '';
  return pageTitle(`${team.name} squad & club quiz${league}`);
}

export function buildTeamSeoDescription(team, ctx = {}) {
  const { roster = [], leagueName = '', league = null, quizReady = 0 } = ctx;
  const base = isHighTrafficTeam(team, roster)
    ? buildTopTeamMetaDescription(team, {
        rosterSize: roster.length,
        quizReady,
        leagueName,
        league,
      })
    : buildClubProfileDescription(team, leagueName, roster.length);
  const rivalsBit =
    team.rivals?.length > 0 ? ` Rivals: ${team.rivals.slice(0, 2).join(', ')}.` : '';
  return truncateMetaDescription(
    `${base}${rivalsBit} ${quizReady > 0 ? 'Club quiz and' : ''} squad study on FootyCompass.`,
  );
}

export function buildLeagueSeoTitle(league) {
  const name = getLeagueDisplayName(league);
  return pageTitle(`${name} — clubs, players & football quizzes`);
}

export function buildLeagueSeoDescription(league, stats) {
  return truncateMetaDescription(buildTopLeagueMetaDescription(league, stats));
}

export function buildNationalTeamSeoTitle(nationalTeam) {
  const confed = nationalTeam.confederation ? ` · ${nationalTeam.confederation}` : '';
  const wc = FEATURED_NATIONAL_TEAM_IDS.includes(nationalTeam.id) ? ' · World Cup 2026' : '';
  return pageTitle(`${nationalTeam.displayName} national team squad & quiz${confed}${wc}`);
}

export function buildNationalTeamSeoDescription(nationalTeam, ctx = {}) {
  return truncateMetaDescription(
    buildRichNationalTeamMetaDescription(nationalTeam, {
      linkedCount: ctx.linkedCount ?? 0,
      quizReady: ctx.quizReady ?? 0,
      canQuiz: ctx.canQuiz ?? false,
      squad: ctx.squad ?? [],
    }),
  );
}

export function buildQuizSeoTitle(ctx = {}) {
  const {
    themeId,
    teamId,
    leagueId,
    nationalTeamId,
    poolFocus,
    worldCupPrep,
    themeName,
    teamName,
    leagueName,
  } = ctx;

  if (themeName || themeId) {
    const label = themeName ?? themeId;
    return pageTitle(`Guess the player — ${label} quiz`);
  }
  if (teamName || teamId) {
    return pageTitle(`Guess the player — ${teamName ?? 'club'} quiz`);
  }
  if (leagueName || leagueId) {
    return pageTitle(`Guess the player — ${leagueName ?? 'league'} quiz`);
  }
  if (nationalTeamId) {
    const nt = getNationalTeamName(nationalTeamId);
    return pageTitle(`Guess the player — ${nt} national team quiz`);
  }
  if (worldCupPrep || poolFocus === 'international') {
    return pageTitle('International & World Cup player quiz');
  }
  return pageTitle('Football player quiz — guess from hints');
}

export function buildQuizSeoDescription(ctx = {}) {
  const {
    themeName,
    teamName,
    leagueName,
    nationalTeamId,
    poolFocus,
    worldCupPrep,
    poolSize,
  } = ctx;

  if (themeName) {
    return truncateMetaDescription(
      `Themed football quiz: ${themeName}. Guess players from hints, build streaks, earn XP, and open profiles to learn more — free on FootyCompass.`,
    );
  }
  if (teamName) {
    return truncateMetaDescription(
      `Test yourself on ${teamName} players: progressive hints, typing or multiple choice, streaks and XP. Study the squad first, then quiz on FootyCompass.`,
    );
  }
  if (leagueName) {
    return truncateMetaDescription(
      `${leagueName} player quiz — recognize stars by club, position, and clues. Free, no account; open profiles between rounds on FootyCompass.`,
    );
  }
  if (nationalTeamId) {
    const nt = getNationalTeamName(nationalTeamId);
    return truncateMetaDescription(
      `${nt} national team quiz: guess linked players from hints. Prep for World Cup study or lock in recognition — FootyCompass.`,
    );
  }
  if (worldCupPrep || poolFocus === 'international') {
    return truncateMetaDescription(
      'International football quiz with World Cup prep pools. Guess players from hints, track streaks, and jump to national team profiles on FootyCompass.',
    );
  }
  const sizeBit = poolSize ? ` Pool of ${poolSize}+ quiz-ready players.` : '';
  return truncateMetaDescription(
    `Free football player quiz: guess the name from hints by league, club, or theme.${sizeBit} Streaks, XP, and profile deep-links on FootyCompass.`,
  );
}

export function buildClubQuizSeoTitle(ctx = {}) {
  const { categoryLabel, leagueName } = ctx;
  if (categoryLabel && leagueName) {
    return pageTitle(`${categoryLabel} quiz — ${leagueName}`);
  }
  if (categoryLabel) {
    return pageTitle(`${categoryLabel} — club football quiz`);
  }
  return pageTitle('Club football quiz — stadiums, rivalries & more');
}

export function buildClubQuizSeoDescription(ctx = {}) {
  const { categoryLabel, leagueName, poolSize } = ctx;
  const leagueBit = leagueName ? ` Focus: ${leagueName}.` : '';
  const poolBit = poolSize ? ` ${poolSize}+ questions in pool.` : '';
  return truncateMetaDescription(
    `${categoryLabel ?? 'Club'} football quiz on FootyCompass — multiple choice or typing, streaks and XP.${leagueBit}${poolBit} Study clubs, then test stadium, rivalry, and history knowledge.`,
  );
}

export function buildCompareSeoTitle(ctx = {}) {
  const { tab = 'players', leftName, rightName } = ctx;
  if (tab === 'clubs') {
    return pageTitle('Compare football clubs — squads & identity');
  }
  if (leftName && rightName) {
    return pageTitle(`${leftName} vs ${rightName} — player compare`);
  }
  return pageTitle('Compare football players — stats & roles');
}

export function buildCompareSeoDescription(ctx = {}) {
  const { tab = 'players', leftName, rightName } = ctx;
  if (tab === 'clubs') {
    return truncateMetaDescription(
      'Compare two football clubs side by side: culture, rivals, squad size, and key players. Pick teams, open profiles, then try club quizzes on FootyCompass.',
    );
  }
  if (leftName && rightName) {
    return truncateMetaDescription(
      `Compare ${leftName} and ${rightName}: position, club, league, importance score, and quiz clues. Settle debates with data on FootyCompass.`,
    );
  }
  return truncateMetaDescription(
    'Compare two football players side by side — roles, clubs, leagues, and importance. Pick players from search, open profiles, then quiz yourself on FootyCompass.',
  );
}

export function buildDailySeoTitle(ctx = {}) {
  const { dateLabel, scopeLabel } = ctx;
  if (scopeLabel) {
    return pageTitle(`Daily football quiz — ${scopeLabel}`);
  }
  if (dateLabel) {
    return pageTitle(`Daily football quiz — ${dateLabel}`);
  }
  return pageTitle('Daily football challenge — 5 quick questions');
}

export function buildDailySeoDescription(ctx = {}) {
  const { scopeLabel, questionCount = 5 } = ctx;
  const scope = scopeLabel ? ` Today's focus: ${scopeLabel}.` : '';
  return truncateMetaDescription(
    `Daily football challenge: ${questionCount} quick guess-the-player questions.${scope} Build a streak, earn XP, and come back tomorrow — free on FootyCompass.`,
  );
}

/** Resolve quiz page SEO from URL search params (pathname stays /quiz). */
export function buildQuizSeoFromSearchParams(searchParams, { poolSize } = {}) {
  const themeId = searchParams.get('theme') ?? '';
  const teamId = searchParams.get('team') ?? '';
  const leagueId = searchParams.get('league') ?? '';
  const nationalTeamId = searchParams.get('nationalTeam') ?? '';
  const poolFocus = searchParams.get('poolFocus') ?? '';
  const worldCup = searchParams.get('worldCup') ?? '';

  const theme = themeId ? getQuizThemeById(themeId) : null;
  const teamName = teamId ? peekTeamName(teamId) : '';
  const leagueName = leagueId
    ? getLeagueDisplayName({ id: leagueId, name: leagueId })
    : '';

  return {
    title: buildQuizSeoTitle({
      themeId,
      themeName: theme?.label,
      teamId,
      teamName: teamName !== 'Unknown' ? teamName : '',
      leagueId,
      leagueName: leagueName !== 'Unknown' ? leagueName : '',
      nationalTeamId,
      poolFocus,
      worldCupPrep: worldCup === 'prep',
    }),
    description: buildQuizSeoDescription({
      themeName: theme?.label,
      teamName: teamName !== 'Unknown' ? teamName : '',
      leagueName: leagueName !== 'Unknown' ? leagueName : '',
      nationalTeamId,
      poolFocus,
      worldCupPrep: worldCup === 'prep',
      poolSize,
    }),
  };
}

export function buildClubQuizSeoFromSearchParams(searchParams, { poolSize } = {}) {
  const categoryId = searchParams.get('category') ?? '';
  const leagueId = searchParams.get('league') ?? '';
  const category = categoryId ? getClubQuizCategoryById(categoryId) : null;
  const leagueName = leagueId
    ? getLeagueDisplayName({ id: leagueId, name: leagueId })
    : '';

  return {
    title: buildClubQuizSeoTitle({
      categoryLabel: category?.label,
      leagueName: leagueName !== 'Unknown' ? leagueName : '',
    }),
    description: buildClubQuizSeoDescription({
      categoryLabel: category?.label ?? 'Club knowledge',
      leagueName: leagueName !== 'Unknown' ? leagueName : '',
      poolSize,
    }),
  };
}

export { getStaticRouteSeo } from './seoRouteCopy.js';
