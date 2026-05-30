/**
 * Fact-locked player overlay copy — dataset fields only.
 */

export function clean(v) {
  return String(v ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

export function isBrowseOnlyPlayer(player) {
  if (!player) return false;
  if (player.quizEligible === false) return true;
  if (player.dataStatus === 'generated-needs-editorial') return true;
  return !(player.quizHints?.length > 0);
}

const PLACEHOLDER_FACT_RE =
  /editorial profile coming soon|editorial quiz profile pending|footybrain|footycompass sample|listed as .*footybrain/i;

export function isPlaceholderQuickFact(player) {
  const fact = clean(player?.quickFact);
  if (!fact) return true;
  return PLACEHOLDER_FACT_RE.test(fact);
}

function positionCategory(position) {
  const p = clean(position).toLowerCase();
  if (/goalkeeper/.test(p)) return 'goalkeeper';
  if (/defender|centre-back|center-back|back/.test(p)) return 'defender';
  if (/midfield/.test(p)) return 'midfielder';
  if (/striker|winger|forward/.test(p)) return 'forward';
  return 'outfield';
}

export function buildRoleSummary(player) {
  const position = clean(player?.position);
  if (!position) return null;

  switch (positionCategory(position)) {
    case 'goalkeeper':
      return 'Shot-stopping and command of the box define this role.';
    case 'defender':
      return 'Defensive work, duels, and build-up from the back.';
    case 'midfielder':
      return 'Links defence and attack — tempo, passing, and ball-winning.';
    case 'forward':
      return 'Goal threat, movement, and finishing in the final third.';
    default:
      return null;
  }
}

export function buildStrengthsFromPlayingStyle(playingStyle) {
  const raw = clean(playingStyle).toLowerCase();
  if (!raw) return [];

  const strengths = [];
  const add = (s) => {
    const t = clean(s);
    if (!t || strengths.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    strengths.push(t);
  };

  const rules = [
    [/finisher|finishing|clinical|ruthless/, 'Finishing'],
    [/box|penalty area/, 'Penalty-box movement'],
    [/aerial|header|heading/, 'Aerial threat'],
    [/press|pressing/, 'Pressing'],
    [/counter|transition/, 'Transition threat'],
    [/pace|fast|explosive|rapid/, 'Pace'],
    [/dribble|1v1|take-ons?/, '1v1 dribbling'],
    [/creative|chance|playmaker|final ball|through ball/, 'Chance creation'],
    [/cross|wide delivery/, 'Crossing'],
    [/ball carry|carries the ball/, 'Ball carrying'],
    [/progress|line-breaking/, 'Progressive passing'],
    [/passing range|switches play/, 'Passing range'],
    [/duel|physical|strength/, 'Duels'],
    [/tackle|ball-winning|intercept/, 'Ball winning'],
    [/position|positioning|reads the game/, 'Positioning'],
    [/composure|calm/, 'Composure'],
    [/shot-stopp|reflex|saves?/, 'Shot-stopping'],
    [/distribution|sweeper/, 'Distribution'],
  ];

  for (const [re, label] of rules) {
    if (re.test(raw)) add(label);
  }

  if (strengths.length === 0) {
    for (const t of raw.split(/[·•,;|/]/g).slice(0, 4)) {
      const w = t.trim();
      if (w) add(w.charAt(0).toUpperCase() + w.slice(1));
    }
  }

  return strengths.slice(0, 6);
}

export function buildCareerContext(player) {
  const career = Array.isArray(player?.careerHistory) ? player.careerHistory : [];
  if (career.length === 0) return null;

  const clubs = career.map((c) => clean(c.club)).filter(Boolean);
  if (clubs.length >= 3) {
    return `Career path: ${clubs.slice(-3).join(' → ')}.`;
  }
  if (clubs.length === 2) {
    const years = career.map((c) => clean(c.years)).filter(Boolean);
    return years.length
      ? `Previously at ${clubs[0]} (${years[0]}), now ${clubs[1]}.`
      : `Previously at ${clubs[0]}, now ${clubs[1]}.`;
  }
  if (clubs.length === 1) {
    const years = clean(career[0]?.years);
    return years ? `Listed with ${clubs[0]} (${years}).` : `Listed with ${clubs[0]}.`;
  }
  return null;
}

export function buildBrowseQuickFact(player, ctx, variant = 0) {
  const nat = clean(player.nationalTeam || player.nationality);
  const position = clean(player.position);
  const club = clean(ctx.teamName);
  const league = clean(ctx.leagueName);
  const age =
    player.age != null && player.age !== '' ? `${player.age}-year-old ` : '';

  const style = clean(player.playingStyle);
  const styleBit = style ? ` — ${style.split(/[·•,;|/]/)[0].trim().toLowerCase()}` : '';

  const openers = [
    () =>
      `${player.name} is a ${age}${position.toLowerCase()} at ${club} (${league})${nat ? ` · ${nat}` : ''}${styleBit}.`,
    () =>
      `${nat ? `${nat} ` : ''}${position.toLowerCase()} ${player.name} plays for ${club} in ${league}.`,
    () =>
      `${club}'s ${position.toLowerCase()} ${player.name}${nat ? ` (${nat})` : ''} — ${league}${styleBit}.`,
  ];
  return clean(openers[variant % openers.length]());
}

export function buildPlayStyleSummary(player, strengths) {
  const style = clean(player.playingStyle);
  if (!style) {
    if (strengths.length >= 2) {
      return clean(`Known for ${strengths.slice(0, 3).join(', ')}.`);
    }
    const role = buildRoleSummary(player);
    return role;
  }

  const s = style.endsWith('.') ? style : `${style}.`;
  if (s.length <= 150) return s;
  if (strengths.length) return clean(`${strengths.slice(0, 3).join(' · ')}.`);
  return clean(`${s.slice(0, 147).trimEnd()}…`);
}

export function buildBrowseKnownFor(player, strengths, ctx) {
  const items = [];
  const seen = new Set();
  const add = (text) => {
    const t = clean(text);
    if (!t || seen.has(t.toLowerCase())) return;
    seen.add(t.toLowerCase());
    items.push(t);
  };

  for (const s of strengths) add(s);

  const tags = clean(player.playingStyle)
    .split(/[·•,;|/]/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);
  for (const t of tags) add(t);

  const pos = clean(player.position);
  if (pos && ctx.teamName) add(`${pos} · ${ctx.teamName}`);

  const nat = clean(player.nationalTeam || player.nationality);
  if (nat && ctx.leagueName) add(`${nat} · ${ctx.leagueName}`);

  const career = buildCareerContext(player);
  if (career && items.length < 4) add(career.replace(/\.$/, ''));

  return items.slice(0, 5);
}

export function buildPlayerOverlay(player, ctx, variant = 0) {
  const strengths = buildStrengthsFromPlayingStyle(player.playingStyle);
  const quickFact = isPlaceholderQuickFact(player)
    ? buildBrowseQuickFact(player, ctx, variant)
    : clean(player.quickFact);
  const playStyleSummary = buildPlayStyleSummary(player, strengths);
  const knownFor = buildBrowseKnownFor(player, strengths, ctx);
  const roleSummary = buildRoleSummary(player);
  const careerContext = buildCareerContext(player);

  return {
    quickFact,
    playStyleSummary: playStyleSummary || null,
    strengths: strengths.length ? strengths : null,
    knownFor: knownFor.length ? knownFor : null,
    roleSummary,
    careerContext,
  };
}
