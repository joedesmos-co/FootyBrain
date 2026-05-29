/**
 * Fact-locked club overlay copy — dataset fields only.
 */

export const TAG_PHRASES = {
  possession: 'possession-oriented build-up',
  'counter-attacking': 'quick transitions',
  'youth-focused': 'youth in the first team',
  'historic-giant': 'long trophy pedigree',
  pressing: 'coordinated high press',
  'direct-play': 'direct vertical play',
  'set-pieces': 'set-piece threat',
  'defensive-block': 'compact defensive block',
  'high-line': 'high defensive line',
  academy: 'academy-led identity',
  'european-heavyweight': 'European pedigree',
  'title-challenger': 'title-chasing expectations',
  physical: 'physical duels',
  technical: 'technical ball retention',
  'fan-culture': 'vocal supporter culture',
  'underdog-spirit': 'underdog mentality',
};

export function clean(v) {
  return String(v ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

export function truncate(text, max = 158) {
  const t = clean(text);
  if (t.length <= max) return t;
  const slice = t.slice(0, max - 1);
  const cut = slice.lastIndexOf(' ') > max * 0.55 ? slice.slice(0, slice.lastIndexOf(' ')) : slice;
  return `${cut.trimEnd()}…`;
}

export function list(names, max = 4) {
  const xs = (Array.isArray(names) ? names : []).map(clean).filter(Boolean).slice(0, max);
  if (!xs.length) return '';
  if (xs.length === 1) return xs[0];
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`;
}

export function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function isPlaceholderClubCopy(team) {
  const h = String(team?.shortHistory ?? '');
  const f = String(team?.fanGuide ?? '');
  return (
    /FootyCompass controlled expansion/i.test(h) ||
    /editorial coverage expands/i.test(f) ||
    /Learn .+ colours and main rivalries as editorial/i.test(f)
  );
}

export function tagPhrases(team, max = 3) {
  const keys = (team.identityTags ?? []).map((t) => clean(typeof t === 'string' ? t : t?.key)).filter(Boolean);
  return keys
    .map((k) => TAG_PHRASES[k])
    .filter(Boolean)
    .slice(0, max);
}

export function topRosterLines(players, teamId, max = 4) {
  return players
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => (Number(b.importanceScore) || 0) - (Number(a.importanceScore) || 0))
    .slice(0, max)
    .map((p) => {
      const pos = clean(p.position);
      return pos ? `${p.name} — ${pos}` : p.name;
    })
    .filter(Boolean);
}

export function buildThinClubHistory(team, leagueName, league, rosterSize = 0) {
  if (!isPlaceholderClubCopy(team)) return null;

  const parts = [];
  const country = clean(team.country);
  parts.push(
    `${team.name} are listed in ${leagueName}${country ? ` (${country})` : ''} on FootyCompass.`,
  );
  if (team.founded) parts.push(`Founded in ${team.founded}.`);
  if (team.stadium) parts.push(`Home ground: ${team.stadium}.`);

  const phrases = tagPhrases(team, 3);
  if (phrases.length) {
    parts.push(`Playing identity tags: ${list(phrases, 3)}.`);
  }

  const style = clean(league?.styleOfPlay);
  if (style) parts.push(truncate(style, 140));

  if (rosterSize > 0) {
    parts.push(`${rosterSize} squad players on this profile for browse and quiz practice.`);
  }

  return truncate(parts.join(' '), 320);
}

export function buildThinClubFanGuide(team, leagueName, league) {
  if (!isPlaceholderClubCopy(team)) return null;

  const parts = [];
  if (team.stadium) {
    parts.push(`Matchday focus: ${team.stadium} — use the squad list to learn current names.`);
  }

  const phrases = tagPhrases(team, 2);
  if (phrases.length) {
    parts.push(`Supporters often associate the side with ${list(phrases, 2)}.`);
  }

  const famous = Array.isArray(league?.famousClubs) ? league.famousClubs : [];
  if (famous.length && leagueName) {
    const names = famous.slice(0, 2).map((c) => clean(String(c).split(' — ')[0]));
    parts.push(`Other ${leagueName} clubs profiled nearby include ${list(names, 2)}.`);
  }

  const rivalries = Array.isArray(league?.rivalries) ? league.rivalries : [];
  if (rivalries.length) {
    parts.push(`League-wide derbies noted in the dataset: ${rivalries.slice(0, 2).join('; ')}.`);
  }

  return truncate(parts.join(' '), 280);
}

export function buildMetaDescription(team, leagueName) {
  const story = clean(team.shortHistory);
  const stadium = clean(team.stadium);
  const rivals = (team.rivals ?? []).map(clean).filter(Boolean);
  const variant = hashId(team.id) % 4;

  if (!isPlaceholderClubCopy(team) && story && variant === 0) {
    return truncate(
      `${team.name} (${leagueName}): ${story} Squad, rivals, and club quizzes on FootyCompass.`,
      158,
    );
  }
  if (variant === 1 || isPlaceholderClubCopy(team)) {
    const bits = [`${team.name} (${leagueName})`];
    if (stadium) bits.push(stadium);
    if (rivals.length) bits.push(`rivals: ${list(rivals, 2)}`);
    const hook = !isPlaceholderClubCopy(team) && story
      ? truncate(story, 72)
      : team.stadium
        ? `Study the squad at ${team.stadium}.`
        : 'Squad and league context.';
    return truncate(`${bits.join(' · ')}. ${hook} FootyCompass club profile.`, 158);
  }
  const guide = clean(team.fanGuide);
  if (guide && !isPlaceholderClubCopy(team)) {
    return truncate(
      `${team.name}: ${truncate(guide, 90)} ${leagueName} quizzes on FootyCompass.`,
      158,
    );
  }
  return truncate(
    `${team.name} — ${leagueName} club squad, player profiles, and football quizzes on FootyCompass.`,
    158,
  );
}

export function buildTacticalIdentity(team) {
  const phrases = tagPhrases(team, 3);
  const manager = clean(team.manager);
  const parts = [];
  if (phrases.length) {
    parts.push(`Dataset tags describe ${team.name} as ${list(phrases, 3)}.`);
  }
  if (manager) parts.push(`Head coach listed: ${manager}.`);
  return truncate(parts.join(' '), 240) || null;
}

export function buildStadiumContext(team) {
  const bits = [];
  if (team.stadium) bits.push(`${team.name} list ${team.stadium} as their home ground.`);
  if (team.founded) bits.push(`Founded in ${team.founded}.`);
  const manager = clean(team.manager);
  if (manager) bits.push(`Head coach in the dataset: ${manager}.`);
  return truncate(bits.join(' '), 220) || null;
}

export function buildLeagueContextBlurb(team, leagueName, league) {
  const parts = [`${team.name} compete in ${leagueName} on FootyCompass.`];
  const style = clean(league?.styleOfPlay);
  if (style) parts.push(truncate(style, 160));
  const desc = clean(league?.description);
  if (desc && !style) parts.push(truncate(desc, 140));
  return truncate(parts.join(' '), 240) || null;
}

export function buildRivalsSummary(team) {
  const rivals = (team.rivals ?? []).map(clean).filter(Boolean);
  if (!rivals.length) return null;
  const guide = clean(team.fanGuide);
  if (!isPlaceholderClubCopy(team) && guide) {
    const sentence = guide.split(/(?<=[.!?])\s+/).find((s) =>
      rivals.some((r) => s.toLowerCase().includes(r.toLowerCase().slice(0, 6))),
    );
    if (sentence) return truncate(sentence, 220);
  }
  return truncate(
    `Rivalries noted for ${team.name}: ${list(rivals, 4)}. Compare squads on linked club profiles.`,
    220,
  );
}

export function buildLegendsSummary(team) {
  const legends = Array.isArray(team.legends) ? team.legends : [];
  if (!legends.length) return null;
  const names = legends
    .map((line) => clean(String(line).split(' — ')[0]))
    .filter(Boolean)
    .slice(0, 4);
  if (!names.length) return null;
  const firstLine = clean(legends[0] ?? '');
  const note = firstLine.includes(' — ') ? clean(firstLine.split(' — ').slice(1).join(' — ')) : '';
  if (note) {
    return truncate(
      `Legends in the dataset: ${list(names, 4)} — e.g. ${names[0]} (${note}).`,
      240,
    );
  }
  return truncate(`Legends in the dataset: ${list(names, 4)}.`, 220);
}

export function buildPlayersToKnowIntro(team, players) {
  const fromRoster = topRosterLines(players, team.id, 4);
  const fromListed = (team.currentKeyPlayers ?? [])
    .map((line) => clean(String(line).split(' — ')[0]))
    .filter(Boolean)
    .slice(0, 4);
  const names = fromListed.length >= 2 ? fromListed : fromRoster.map((l) => l.split(' — ')[0]);
  if (names.length < 2) return null;
  const variant = hashId(team.id) % 3;
  if (variant === 0) {
    return `Start with ${list(names, 4)} — highest-profile names in the current squad list.`;
  }
  if (variant === 1) {
    return `Players to know: ${list(names, 4)}. Open profiles for nationality, role, and quiz clues.`;
  }
  return `Before the full squad, learn ${list(names, 3)}${names.length > 3 ? ` and ${names[3]}` : ''}.`;
}

export function buildQuizDiscoveryLead(team, leagueName) {
  const stadium = clean(team.stadium);
  const rival = clean(team.rivals?.[0]);
  const parts = [`Practice ${team.name} with the club player quiz`];
  if (stadium) parts.push(`after scanning ${stadium}`);
  if (rival) parts.push(`then rivalry pools vs ${rival}`);
  if (leagueName) parts.push(`or the ${leagueName} league hub`);
  return truncate(`${parts.join(' — ')}.`, 200);
}

export function buildClubOverlay(team, leagueName, league, players, rosterSize) {
  const overlay = {
    metaDescription: buildMetaDescription(team, leagueName),
    tacticalIdentity: buildTacticalIdentity(team),
    stadiumContext: buildStadiumContext(team),
    leagueContext: buildLeagueContextBlurb(team, leagueName, league),
    rivalsSummary: buildRivalsSummary(team),
    legendsSummary: buildLegendsSummary(team),
    playersToKnowIntro: buildPlayersToKnowIntro(team, players),
    quizDiscoveryLead: buildQuizDiscoveryLead(team, leagueName),
  };

  const history = buildThinClubHistory(team, leagueName, league, rosterSize);
  const fanGuide = buildThinClubFanGuide(team, leagueName, league);
  if (history) overlay.shortHistory = history;
  if (fanGuide) overlay.fanGuide = fanGuide;

  return overlay;
}
