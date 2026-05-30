/**
 * Learner-facing profile copy — truncate, de-duplicate, and strip internal phrasing.
 * Fact-locked: rephrase only, never invent.
 */

import { formatCountryLabel, formatPosition } from './footballDisplay.js';

const INTERNAL_PHRASE_RE =
  /\b(in the dataset|listed in the dataset|dataset tags describe|dataset snapshot|footycompass sample|footybrain|editorial profile coming soon|browse and quiz practice|profiled here for browse|quiz-ready|quiz ready|controlled expansion club set|editorial coverage expands|on footycompass|tracked in|footycompass has profile|compare squads on linked|rivalry pools|lock in|rivalries noted for|playing identity tags|national pool|footycompass club database|in quizzes|linked club profiles|editorial schedule|transfermarkt|tm senior|tm listings|registry-linked|registry players)\b/gi;

export function polishGeneratedCopy(text) {
  return String(text ?? '')
    .replace(INTERNAL_PHRASE_RE, '')
    .replace(/Dataset tags describe ([^.]+) as ([^.]+)\./gi, '$1 play with $2.')
    .replace(/Club legends in the dataset include/gi, 'Club legends include')
    .replace(/Legends in the dataset:/gi, 'Legends include')
    .replace(/Head coach listed:/gi, 'Head coach:')
    .replace(/Current head coach in the dataset:/gi, 'Head coach:')
    .replace(/Rivalries noted for ([^:]+):/gi, 'Key rivalries for $1 include')
    .replace(/Lock in ([^—]+) names with the club player quiz/gi, 'Test yourself on $1 players after studying the squad')
    .replace(/list ([^.]+) as their home ground/gi, 'play home matches at $1')
    .replace(/(\d+) players in the squad list below\.?/gi, '')
    .replace(/Compare squads on linked club profiles[^.]*\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\. \./g, '.')
    .trim();
}

export function truncateLearnerCopy(text, max = 220) {
  const t = polishGeneratedCopy(text);
  if (!t || t.length <= max) return t;
  const slice = t.slice(0, max - 1);
  const cut = slice.lastIndexOf(' ');
  return `${(cut > max * 0.55 ? slice.slice(0, cut) : slice).trimEnd()}…`;
}

export function textsSimilar(a, b, threshold = 0.72) {
  const x = polishGeneratedCopy(a).toLowerCase();
  const y = polishGeneratedCopy(b).toLowerCase();
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const shorter = x.length < y.length ? x : y;
  const longer = x.length < y.length ? y : x;
  if (shorter.length < 24) return false;
  return longer.includes(shorter.slice(0, Math.floor(shorter.length * threshold)));
}

/**
 * One-line hero intro for premium player pages.
 */
export function buildPlayerHeroLede(player, ctx = {}) {
  const fact = polishGeneratedCopy(player?.quickFact);
  if (fact.length >= 20) return truncateLearnerCopy(fact, 160);

  const position = formatPosition(player?.position);
  const teamName = ctx.teamName ?? 'their club';
  const leagueName = ctx.leagueName ?? 'their league';
  const country = String(player?.nationalTeam || player?.nationality || '').trim();
  const natBit = country ? ` · ${country}` : '';

  return truncateLearnerCopy(
    `${player.name} — ${position.toLowerCase()} at ${teamName} (${leagueName})${natBit}.`,
    140,
  );
}

/**
 * Hero lede for league pages.
 */
export function buildLeagueHeroLede(league) {
  const desc = polishGeneratedCopy(league?.description);
  if (desc) return truncateLearnerCopy(desc.split(/(?<=[.!?])\s+/)[0] ?? desc, 180);

  const style = polishGeneratedCopy(league?.styleOfPlay);
  if (style) return truncateLearnerCopy(style, 180);

  const country = formatCountryLabel(league?.country);
  return truncateLearnerCopy(
    `${league.name}${country && country !== '—' ? ` (${country})` : ''} — clubs, squads, and league quizzes.`,
    160,
  );
}

/**
 * Short national-team hero line (not the full squad-identity wall).
 */
export function buildNationalHeroLede(nationalTeam, stats = {}) {
  const history = polishGeneratedCopy(nationalTeam?.shortHistory);
  if (history) return truncateLearnerCopy(history, 200);

  const country = formatCountryLabel(nationalTeam?.country ?? nationalTeam?.displayName);
  const conf = nationalTeam?.confederation ?? 'international football';
  const linked = stats.linkedCount ?? 0;
  const quiz = stats.quizReadyCount ?? 0;

  const bits = [`${nationalTeam.displayName} (${country}) — ${conf}.`];
  if (linked > 0) bits.push(`${linked} players from club football in this squad.`);
  if (quiz > 0) bits.push(`${quiz} names you can practice in quizzes.`);

  return truncateLearnerCopy(bits.join(' '), 220);
}

/**
 * Condensed squad context for hub cards (2 sentences max).
 */
export function buildNationalSquadLead(nationalTeam, stats = {}) {
  const { linkedCount = 0, quizReadyCount = 0, squad = [] } = stats;
  const parts = [];

  if (nationalTeam?.fifaRanking != null) {
    parts.push(`FIFA ranking: ${nationalTeam.fifaRanking}.`);
  }

  if (linkedCount > 0) {
    parts.push(
      `${linkedCount} players from club football${quizReadyCount > 0 ? `; ${quizReadyCount} you can practice in quizzes` : ''}.`,
    );
  }

  const leagueCounts = new Map();
  for (const player of squad) {
    if (!player?.leagueId) continue;
    leagueCounts.set(player.leagueId, (leagueCounts.get(player.leagueId) ?? 0) + 1);
  }
  const topLeagues = [...leagueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id.replace(/-/g, ' '));
  if (topLeagues.length) {
    parts.push(`Most play in ${topLeagues.join(' and ')}.`);
  }

  return truncateLearnerCopy(parts.join(' '), 200);
}
