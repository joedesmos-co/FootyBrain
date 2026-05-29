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

export function buildBrowseQuickFact(player, ctx, variant = 0) {
  const nat = clean(player.nationalTeam || player.nationality);
  const position = clean(player.position);
  const club = clean(ctx.teamName);
  const league = clean(ctx.leagueName);
  const age =
    player.age != null && player.age !== '' ? `${player.age}-year-old ` : '';

  const openers = [
    () =>
      `${player.name} is a ${age}${position.toLowerCase()} for ${club} in ${league}${nat ? ` (${nat})` : ''}.`,
    () => `${club} ${position.toLowerCase()} ${player.name} — ${league}${nat ? ` · ${nat}` : ''}.`,
    () =>
      `${player.name} plays ${position.toLowerCase()} in ${league}; club listed as ${club}${nat ? ` (${nat})` : ''}.`,
  ];
  return clean(openers[variant % openers.length]());
}

export function buildPlayStyleSummary(player, strengths) {
  const style = clean(player.playingStyle);
  if (!style) return '';

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
  if (nat) add(`${nat} — browse squad context on FootyCompass`);

  return items.slice(0, 5);
}

export function buildPlayerOverlay(player, ctx, variant = 0) {
  const strengths = buildStrengthsFromPlayingStyle(player.playingStyle);
  const quickFact = isPlaceholderQuickFact(player)
    ? buildBrowseQuickFact(player, ctx, variant)
    : clean(player.quickFact);
  const playStyleSummary = buildPlayStyleSummary(player, strengths);
  const knownFor = buildBrowseKnownFor(player, strengths, ctx);

  const overlay = {
    quickFact,
    playStyleSummary: playStyleSummary || null,
    strengths: strengths.length ? strengths : null,
    knownFor: knownFor.length ? knownFor : null,
  };

  return overlay;
}
