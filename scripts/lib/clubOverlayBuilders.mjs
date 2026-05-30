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
  parts.push(`${team.name} compete in ${leagueName}${country ? ` (${country})` : ''}.`);
  if (team.founded) parts.push(`Founded ${team.founded}.`);
  if (team.stadium) parts.push(`Home: ${team.stadium}.`);

  const phrases = tagPhrases(team, 2);
  if (phrases.length) {
    parts.push(`Playing identity: ${list(phrases, 2)}.`);
  }

  const manager = clean(team.manager);
  if (manager) parts.push(`Head coach: ${manager}.`);

  const style = clean(league?.styleOfPlay);
  if (style) parts.push(truncate(style, 100));

  return truncate(parts.join(' '), 280);
}

export function buildThinClubFanGuide(team, leagueName, league) {
  if (!isPlaceholderClubCopy(team)) return null;

  const parts = [];
  if (team.stadium) {
    parts.push(`${team.stadium} is home — start with the squad list to learn current names.`);
  }

  const rivals = (team.rivals ?? []).map(clean).filter(Boolean);
  if (rivals.length) {
    parts.push(`Derbies against ${list(rivals, 2)} matter most to supporters.`);
  }

  const phrases = tagPhrases(team, 2);
  if (phrases.length) {
    parts.push(`Supporters associate the club with ${list(phrases, 2)}.`);
  } else {
    parts.push(`Follow league form and squad changes to build recognition in ${leagueName}.`);
  }

  return truncate(parts.join(' '), 240);
}

export function buildMetaDescription(team, leagueName) {
  const story = clean(team.shortHistory);
  const stadium = clean(team.stadium);
  const rivals = (team.rivals ?? []).map(clean).filter(Boolean);
  const variant = hashId(team.id) % 4;

  if (!isPlaceholderClubCopy(team) && story && variant === 0) {
    return truncate(`${team.name} (${leagueName}): ${story}`, 158);
  }
  if (variant === 1 || isPlaceholderClubCopy(team)) {
    const bits = [`${team.name} (${leagueName})`];
    if (stadium) bits.push(stadium);
    if (rivals.length) bits.push(`rivals include ${list(rivals, 2)}`);
    const hook = !isPlaceholderClubCopy(team) && story
      ? truncate(story, 72)
      : team.stadium
        ? `Squad and home ground at ${team.stadium}.`
        : 'Club profile with squad and quizzes.';
    return truncate(`${bits.join(' · ')}. ${hook}`, 158);
  }
  const guide = clean(team.fanGuide);
  if (guide && !isPlaceholderClubCopy(team)) {
    return truncate(`${team.name}: ${truncate(guide, 100)}`, 158);
  }
  return truncate(
    `${team.name} — ${leagueName} club profile, squad, and football quizzes.`,
    158,
  );
}

export function buildTacticalIdentity(team) {
  const phrases = tagPhrases(team, 3);
  const manager = clean(team.manager);
  const parts = [];
  if (phrases.length) {
    parts.push(`${team.name} play with ${list(phrases, 3)}.`);
  }
  if (manager) parts.push(`Head coach: ${manager}.`);
  return truncate(parts.join(' '), 240) || null;
}

export function buildStadiumContext(team) {
  const bits = [];
  if (team.stadium) bits.push(`${team.name} play home matches at ${team.stadium}.`);
  if (team.founded) bits.push(`Founded in ${team.founded}.`);
  const manager = clean(team.manager);
  if (manager) bits.push(`Head coach: ${manager}.`);
  return truncate(bits.join(' '), 220) || null;
}

export function buildLeagueContextBlurb(team, leagueName, league) {
  const parts = [`${team.name} compete in ${leagueName}.`];
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
  if (rivals.length === 1) {
    return truncate(`Fixtures against ${rivals[0]} carry extra edge for supporters.`, 220);
  }
  return truncate(
    `Supporters mark games against ${list(rivals, 3)} as the fixtures that matter most.`,
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
    return truncate(`Club legends include ${list(names, 4)} — notably ${names[0]} (${note}).`, 240);
  }
  return truncate(`Club legends include ${list(names, 4)}.`, 220);
}

export function buildPlayersToKnowIntro(team, players) {
  const fromRoster = topRosterLines(players, team.id, 4);
  const fromListed = (team.currentKeyPlayers ?? [])
    .map((line) => clean(String(line).split(' — ')[0]))
    .filter(Boolean)
    .slice(0, 4);
  const names = fromListed.length >= 2 ? fromListed : fromRoster.map((l) => l.split(' — ')[0]);
  if (names.length < 2) return null;
  return `Look out for ${list(names, 4)} in the squad below.`;
}

export function buildQuizDiscoveryLead(team, leagueName) {
  const rival = clean(team.rivals?.[0]);
  if (rival) {
    return truncate(
      `Learn the squad here, then try the ${team.name} player quiz — derby names like ${rival} often come up.`,
      200,
    );
  }
  return truncate(
    `Learn the squad on this page, then test yourself with the ${team.name} player quiz.`,
    200,
  );
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
