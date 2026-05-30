import { formatClubIdentityTags, truncateClubText } from './clubIdentity';
import { buildClubIdentitySection } from './entityEditorialSynthesis';
import { formatCountryLabel } from './footballDisplay';
import { getClubQuizPlayHref } from '../data/clubQuizCategories';
import { getQuizThemeIdForLeague, getQuizThemePlayHref } from '../data/quizThemes';
import { getTeamHonorsList, parseKeyPlayerLine, resolveRivalEntries } from './teamPageUtils';
import { getTeamProfileEditorial, inferTeamNicknames, parseTeamLegendLines } from './teamProfileDisplay';

/**
 * Stadium / home context — existing fields only.
 * @param {object} team
 */
export function buildStadiumContext(team) {
  const overlay = String(team?.stadiumContext ?? '').trim();
  if (overlay) return overlay;

  const parts = [];
  if (team?.stadium) parts.push(`${team.name} play home matches at ${team.stadium}.`);
  if (team?.founded) parts.push(`The club was founded in ${team.founded}.`);
  const manager = String(team?.manager ?? '').trim();
  if (manager) parts.push(`Head coach: ${manager}.`);
  return parts.join(' ');
}

/**
 * @param {object} team
 * @param {Array<{ label: string, team: object | null }>} rivalEntries
 */
export function buildRivalsContext(team) {
  const names = (team?.rivals ?? []).map((r) => String(r).trim()).filter(Boolean);
  if (!names.length) return '';

  const guide = String(team?.fanGuide ?? '').trim();
  if (guide) {
    const sentence = guide.split(/(?<=[.!?])\s+/).find((s) =>
      names.some((r) => s.toLowerCase().includes(r.toLowerCase().slice(0, 6))),
    );
    if (sentence) return sentence;
  }

  if (names.length === 1) {
    return `Fixtures against ${names[0]} carry extra meaning for supporters.`;
  }
  return `Games against ${names.slice(0, 3).join(', ')} are the ones fans circle first.`;
}

/**
 * @param {object} team
 */
export function buildLegendsContext(team) {
  const overlay = String(team?.legendsSummary ?? '').trim();
  if (overlay) return overlay;

  const lines = Array.isArray(team?.legends) ? team.legends : [];
  if (!lines.length) return '';

  const parsed = lines.slice(0, 4).map((line) => parseKeyPlayerLine(line));
  const names = parsed.map((p) => p.name).filter(Boolean);
  if (!names.length) return '';

  const notes = parsed
    .filter((p) => p.note)
    .slice(0, 2)
    .map((p) => `${p.name} (${p.note})`);
  if (notes.length) {
    return `Legends include ${names.join(', ')} — notably ${notes.join('; ')}.`;
  }
  return `Legends include ${names.join(', ')}.`;
}

/**
 * Fan identity from fanGuide, identity tags, nicknames — no invented culture.
 * @param {object} team
 */
export function buildFanIdentityContext(team) {
  const editorial = getTeamProfileEditorial(team);
  if (editorial.fanGuide) return editorial.fanGuide;

  const parts = [];
  const nicknames = inferTeamNicknames(team);
  if (nicknames.length) parts.push(`Supporters often use the nickname ${nicknames[0]}.`);

  const tags = formatClubIdentityTags(team?.identityTags ?? []);
  if (tags.length) {
    parts.push(
      `Known for ${tags
        .slice(0, 4)
        .map((t) => t.label.toLowerCase())
        .join(', ')}.`,
    );
  }

  return parts.join(' ');
}

/**
 * @param {object} team
 * @param {string} leagueName
 * @param {object} [league]
 */
export function buildClubLeagueContext(team, leagueName, league = null) {
  if (!leagueName) return '';

  const country = formatCountryLabel(team?.country ?? league?.country);
  const region =
    country && country !== '—' ? `${leagueName} (${country})` : leagueName;

  const parts = [`${team.name} play in ${region}.`];

  const style = String(league?.styleOfPlay ?? '').trim();
  if (style) {
    parts.push(truncateClubText(style, 200));
  } else {
    const desc = String(league?.description ?? '').trim();
    if (desc) parts.push(truncateClubText(desc, 180));
  }

  const famous = Array.isArray(league?.famousClubs) ? league.famousClubs : [];
  const teamInFamous = famous.some((line) =>
    String(line).toLowerCase().includes(String(team.name).toLowerCase().slice(0, 6)),
  );
  if (famous.length && !teamInFamous) {
    parts.push(
      `Other featured clubs in this league include ${famous
        .slice(0, 2)
        .map((c) => c.split(' — ')[0])
        .join(' and ')}.`,
    );
  }

  if (league?.rivalries?.length) {
    parts.push(`Big league fixtures include ${league.rivalries.slice(0, 2).join(' and ')}.`);
  }

  return parts.join(' ');
}

/**
 * Structured synthesis blocks for thin club pages (existing data only).
 * @param {{
 *   team: object,
 *   leagueName: string,
 *   league?: object | null,
 *   leagueTeams?: object[],
 *   rosterSize?: number,
 *   roster?: object[],
 * }} ctx
 */
export function buildStructuredClubProfile(ctx) {
  const { team, leagueName, league = null, leagueTeams = [], rosterSize = 0, roster = [] } = ctx;
  const editorial = getTeamProfileEditorial(team);
  const rivalEntries = resolveRivalEntries(team.rivals, leagueTeams);
  const legendEntries = parseTeamLegendLines(team.legends);
  const honors = getTeamHonorsList(team);

  const story = editorial.shortHistory
    ? editorial.shortHistory
    : buildClubIdentitySection(team, leagueName);

  const leagueBlurb =
    editorial.leagueContext || buildClubLeagueContext(team, leagueName, league);

  const quizReadyCount = roster.filter((p) => p?.quizHints?.length >= 2).length;

  return {
    story,
    hasAuthoritativeStory: editorial.hasStory,
    stadium: editorial.stadiumContext || buildStadiumContext(team),
    tacticalIdentity: editorial.tacticalIdentity || '',
    league: leagueBlurb,
    fanIdentity: buildFanIdentityContext(team),
    rivals: editorial.rivalsSummary || buildRivalsContext(team),
    legends: editorial.legendsSummary || buildLegendsContext(team),
    honors,
    rivalEntries,
    legendEntries,
    nicknames: editorial.nicknames,
    quizReadyCount,
    rosterSize: rosterSize || roster.length,
    playersToKnowIntro: editorial.playersToKnowIntro,
    quizDiscoveryLead: editorial.quizDiscoveryLead,
  };
}

/**
 * Crawlable quiz / study links for club profiles.
 * @param {object} team
 * @param {{
 *   leagueName?: string,
 *   hasTeamQuiz?: boolean,
 *   hasLeagueQuiz?: boolean,
 * }} opts
 */
export function buildClubQuizDiscoveryLinks(team, opts = {}) {
  const { leagueName = '', hasTeamQuiz = false, hasLeagueQuiz = false } = opts;
  /** @type {{ label: string, to: string, hint?: string }[]} */
  const links = [];

  if (hasTeamQuiz) {
    links.push({
      label: `${team.name} player quiz`,
      to: `/quiz?team=${team.id}`,
      hint: 'Guess squad players from hints',
    });
  }
  links.push({
    label: 'Club quiz guide',
    to: `/hubs/quizzes/team/${team.id}`,
    hint: 'Study tips before you play',
  });

  if (team.leagueId) {
    links.push({ label: `${leagueName || 'League'} league`, to: `/league/${team.leagueId}` });
    links.push({
      label: 'League quiz guide',
      to: `/hubs/quizzes/league/${team.leagueId}`,
    });
    if (hasLeagueQuiz) {
      links.push({
        label: `${leagueName || 'League'} player quiz`,
        to: `/quiz?league=${team.leagueId}`,
      });
    }
  }

  const themeId = getQuizThemeIdForLeague(team.leagueId);
  if (themeId) {
    links.push({
      label: 'Themed league quiz',
      to: getQuizThemePlayHref(themeId),
    });
  }

  if (team.stadium) {
    links.push({
      label: 'Stadium quiz',
      to: getClubQuizPlayHref('stadium', { leagueId: team.leagueId }),
    });
  }
  if (team.rivals?.length) {
    links.push({
      label: 'Rivalry quiz',
      to: getClubQuizPlayHref('rivalry', { leagueId: team.leagueId }),
    });
  }

  links.push({ label: 'Club quiz categories', to: '/hubs/quizzes/clubs' });
  links.push({ label: 'Daily challenge', to: '/daily' });

  const seen = new Set();
  return links.filter((l) => {
    if (seen.has(l.to)) return false;
    seen.add(l.to);
    return true;
  });
}

/**
 * @param {object} team
 * @param {string} leagueName
 * @param {number} rosterSize
 */
export function buildSyntheticClubStory(team, leagueName) {
  return buildClubIdentitySection(team, leagueName);
}

/**
 * @param {object} team
 * @param {string} leagueName
 * @param {number} rosterSize
 */
export function buildClubProfileDescription(team, leagueName) {
  const editorial = getTeamProfileEditorial(team);
  if (editorial.shortHistory) {
    const snippet = truncateClubText(editorial.shortHistory, 140);
    return `${team.name} — ${snippet}`;
  }

  const story = truncateClubText(buildSyntheticClubStory(team, leagueName), 160);
  const extra = [];
  if (team.stadium) extra.push(`Home: ${team.stadium}`);
  if (team.rivals?.length) extra.push(`Rivals: ${team.rivals.slice(0, 2).join(', ')}`);
  const tail = extra.length ? ` ${extra.join('. ')}.` : '';
  return `${team.name} (${leagueName}) — ${story}${tail}`;
}

/**
 * Rich meta for high-traffic clubs — dataset fields only.
 * @param {object} team
 * @param {{ leagueName?: string, rosterSize?: number, quizReady?: number, league?: object }} stats
 */
export function buildRichTeamMetaDescription(team, stats = {}) {
  const custom = String(team.metaDescription ?? '').trim();
  if (custom) return custom;

  const profile = buildStructuredClubProfile({
    team,
    leagueName: stats.leagueName ?? '',
    league: stats.league ?? null,
    rosterSize: stats.rosterSize ?? 0,
  });

  const bits = [`${team.name}${stats.leagueName ? ` (${stats.leagueName})` : ''}`];
  if (stats.rosterSize) bits.push(`${stats.rosterSize} players`);
  if (team.stadium) bits.push(team.stadium);
  if (team.rivals?.length) bits.push(`vs ${team.rivals.slice(0, 2).join(', ')}`);
  if (stats.quizReady > 0) bits.push(`${stats.quizReady} in player quizzes`);

  const hook = truncateClubText(
    profile.hasAuthoritativeStory ? profile.story : profile.stadium || profile.league,
    90,
  );
  return `${bits.join(' · ')}. ${hook}`;
}

export { countClubEditorialDepth } from './entityDepthAudit';
