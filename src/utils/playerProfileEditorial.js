import { formatClubIdentityTags } from './clubIdentity';
import { formatPosition } from './footballDisplay';
import { getDisplayQuickFact, isBrowseOnlyPlayer } from './playerEditorial';
import { buildCareerSummary } from './playerImportance';
import { countPlayerEditorialDepth, isThinPlayer } from './entityDepthAudit';
import { buildHowTheyPlaySection } from './entityEditorialSynthesis';
import {
  buildPlayerHeroLede,
  polishGeneratedCopy,
  textsSimilar,
  truncateLearnerCopy,
} from './learnerProfileCopy';
import {
  buildTopPlayerMetaDescription,
  isHighImportancePlayer,
  isTopTierPlayer,
} from './topImportanceProfile';

export const PLAYER_PLACEHOLDER_FACT_RE =
  /editorial profile coming soon|editorial quiz profile pending|footybrain|footycompass sample/i;

function hasSubstantiveQuickFact(player) {
  const fact = String(player?.quickFact ?? '').trim();
  if (!fact || PLAYER_PLACEHOLDER_FACT_RE.test(fact)) return false;
  return true;
}

function positionCategory(position) {
  const p = String(position ?? '').toLowerCase();
  if (/goalkeeper/.test(p)) return 'goalkeeper';
  if (/defender|centre-back|center-back|back/.test(p)) return 'defender';
  if (/midfield/.test(p)) return 'midfielder';
  if (/striker|winger|forward/.test(p)) return 'forward';
  return 'outfield';
}

function roleContextLine(position) {
  switch (positionCategory(position)) {
    case 'goalkeeper':
      return 'Goalkeepers live on saves, command, and distribution under pressure.';
    case 'defender':
      return 'Centre-backs and full-backs are remembered for duels, positioning, and build-up.';
    case 'midfielder':
      return 'Midfielders tie the team together — where they receive the ball shapes how you recall them.';
    case 'forward':
      return 'Forwards stick through goals, movement, and how they attack space.';
    default:
      return 'Club, league, and role together are the fastest memory hooks.';
  }
}

function parsePlayStyleTags(player) {
  const raw = String(player?.playingStyle ?? '').trim();
  if (!raw) return [];
  return raw
    .split(/[·•,;|/]/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function parseStrengths(player) {
  const raw = player?.strengths ?? player?.keyStrengths ?? player?.signatureStrengths;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean).slice(0, 8);
  return String(raw)
    .split(/[·•,;|/]/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
}

/**
 * @param {object} player
 * @param {{ teamName?: string, leagueName?: string, team?: object | null }} ctx
 */
export function buildPlayerAboutParagraph(player, ctx = {}) {
  const teamName = ctx.teamName ?? 'their club';
  const leagueName = ctx.leagueName ?? 'their league';
  const position = formatPosition(player.position);
  const country = String(player.nationalTeam || player.nationality || '').trim();

  if (hasSubstantiveQuickFact(player)) {
    return String(player.quickFact).trim();
  }

  const styleSummary = String(player?.playStyleSummary ?? player?.styleSummary ?? '').trim();
  if (styleSummary && parsePlayStyleTags(player).length === 0) return styleSummary;

  const age =
    player.age != null && player.age !== ''
      ? `${player.age}-year-old `
      : '';
  const natBit = country ? ` ${country} international` : '';
  const opener = `${player.name} is a ${age}${position.toLowerCase()} for ${teamName} in ${leagueName}${natBit}.`;

  const career = player.careerHistory ?? [];
  let pathBit = '';
  if (career.length >= 2) {
    const recent = career.slice(-2).map((s) => s.club).join(' and ');
    pathBit = ` Previous stops include ${recent}.`;
  } else if (career.length === 1) {
    pathBit = ` Listed with ${career[0].club} (${career[0].years}).`;
  }

  return `${opener}${pathBit} ${roleContextLine(player.position)}`.replace(/\s+/g, ' ').trim();
}

function polishAboutParagraph(text, topTier) {
  const polished = polishGeneratedCopy(text);
  return topTier ? truncateLearnerCopy(polished, 240) : polished;
}

/**
 * @param {object} player
 * @param {{ team?: object | null }} ctx
 * @returns {string[]}
 */
export function buildPlayerKnownFor(player, ctx = {}) {
  /** @type {string[]} */
  const items = [];
  const seen = new Set();

  const add = (text) => {
    const t = String(text ?? '').trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push(t);
  };

  const overlayKnown = Array.isArray(player?.knownFor) ? player.knownFor : [];
  for (const s of overlayKnown) add(s);

  for (const s of parseStrengths(player)) add(s);
  for (const tag of parsePlayStyleTags(player)) add(tag);

  const team = ctx.team;
  if (team?.identityTags?.length) {
    const labels = formatClubIdentityTags(team.identityTags).map((x) => x.label);
    if (labels.length > 0) {
      add(`Plays in a ${labels.slice(0, 2).join(', ').toLowerCase()} side at ${team.name}`);
    }
  }

  if (team?.rivals?.length) {
    add(`Club rivalries include ${team.rivals.slice(0, 2).join(' and ')}`);
  }

  const country = String(player.nationalTeam || player.nationality || '').trim();
  if (country && !ctx.topTier) add(`${country} international`);

  const careerCtx = String(player?.careerContext ?? '').trim();
  if (careerCtx && items.length < 4) add(careerCtx.replace(/\.$/, ''));

  if (hasSubstantiveQuickFact(player) && items.length < 4) {
    const fact = String(player.quickFact).trim();
    if (fact.length <= 120) add(fact);
  }

  if (items.length === 0) {
    add(`${formatPosition(player.position)} · ${ctx.teamName ?? 'club squad'}`);
  }

  return items.slice(0, 5);
}

/**
 * @param {object} player
 * @param {{ teamName?: string, leagueName?: string, team?: object | null }} ctx
 */
export function buildPlayerProfileDescription(player, ctx = {}) {
  if (isHighImportancePlayer(player)) {
    return buildTopPlayerMetaDescription(player, {
      teamName: ctx.teamName,
      leagueName: ctx.leagueName,
      quizReady: !isBrowseOnlyPlayer(player),
    });
  }

  const about = buildPlayerAboutParagraph(player, ctx);
  const position = formatPosition(player.position);
  const teamName = ctx.teamName ?? 'club';
  const bits = [
    `${player.name} (${position}, ${teamName})`,
    about.length > 155 ? `${about.slice(0, 152).trimEnd()}…` : about,
  ];
  if (!isBrowseOnlyPlayer(player)) {
    bits.push('Quiz clues and career notes on FootyCompass.');
  } else {
    bits.push('Player profile for learning squads and recognition.');
  }
  return bits.join(' — ');
}

/**
 * @param {object} player
 */
export { countPlayerEditorialDepth } from './entityDepthAudit';

/**
 * @param {object} player
 * @param {{ teamName?: string, leagueName?: string, team?: object | null }} ctx
 */
export function buildPlayerProfileEditorial(player, ctx = {}) {
  const topTier = isTopTierPlayer(player);
  const aboutRaw = buildPlayerAboutParagraph(player, ctx);
  const about = polishAboutParagraph(aboutRaw, topTier);
  const knownFor = buildPlayerKnownFor(player, { ...ctx, topTier });
  const displayFact = getDisplayQuickFact(player);
  const careerSummary = buildCareerSummary(player);
  const playStyleBlurbRaw = polishGeneratedCopy(buildHowTheyPlaySection(player));
  const playStyleBlurb = topTier ? truncateLearnerCopy(playStyleBlurbRaw, 180) : playStyleBlurbRaw;
  const depth = countPlayerEditorialDepth(player);
  const isThin = isThinPlayer(player, 3);
  const enrichThin = isThin && (isHighImportancePlayer(player) || topTier);
  const heroLede = topTier ? buildPlayerHeroLede(player, ctx) : '';
  const aboutDistinctFromHero = !textsSimilar(about, heroLede);

  return {
    about,
    heroLede,
    knownFor,
    description: buildPlayerProfileDescription(player, ctx),
    displayFact,
    careerSummary,
    playStyleBlurb,
    depth,
    isThin,
    enrichThin,
    showAbout: Boolean(about) && aboutDistinctFromHero,
    showKnownFor: knownFor.length > 0,
    showPlayStyleBlurb:
      Boolean(playStyleBlurb) &&
      !textsSimilar(playStyleBlurb, about) &&
      !textsSimilar(playStyleBlurb, heroLede) &&
      (enrichThin || isHighImportancePlayer(player) || topTier),
    topTier,
  };
}
