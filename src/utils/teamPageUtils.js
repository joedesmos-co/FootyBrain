export function normalizeClubName(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Map rival name strings to teams in the same league when names match. */
export function resolveRivalEntries(rivalNames, teamsInLeague) {
  if (!Array.isArray(rivalNames) || rivalNames.length === 0) return [];
  const pool = Array.isArray(teamsInLeague) ? teamsInLeague : [];

  return rivalNames.map((label) => {
    const norm = normalizeClubName(label);
    const team =
      pool.find((t) => normalizeClubName(t.name) === norm) ??
      pool.find((t) => {
        const tn = normalizeClubName(t.name);
        return tn.includes(norm) || norm.includes(tn);
      }) ??
      null;
    return { label, team };
  });
}

/** Editorial lines like "Bukayo Saka — right wing". */
export function parseKeyPlayerLine(line) {
  const text = String(line ?? '').trim();
  if (!text) return { name: '', note: '' };
  const emDash = text.indexOf(' — ');
  if (emDash >= 0) {
    return { name: text.slice(0, emDash).trim(), note: text.slice(emDash + 3).trim() };
  }
  const hyphen = text.indexOf(' - ');
  if (hyphen >= 0) {
    return { name: text.slice(0, hyphen).trim(), note: text.slice(hyphen + 3).trim() };
  }
  return { name: text, note: '' };
}

function playerMatchesName(player, name) {
  const norm = normalizeClubName(name);
  if (!norm) return false;
  const pn = normalizeClubName(player.name);
  return pn === norm || pn.startsWith(norm) || norm.startsWith(pn);
}

/** Key player cards: editorial notes first, then top importance from roster. */
export function buildTeamKeyPlayerCards(team, roster, { limit = 6 } = {}) {
  const cards = [];
  const usedIds = new Set();
  const editorial = Array.isArray(team.currentKeyPlayers) ? team.currentKeyPlayers : [];

  for (const line of editorial) {
    const { name, note } = parseKeyPlayerLine(line);
    if (!name) continue;
    const player = roster.find((p) => playerMatchesName(p, name));
    if (player && !usedIds.has(player.id)) {
      usedIds.add(player.id);
      cards.push({ player, note: note || '' });
    } else if (!player) {
      cards.push({ player: null, label: name, note });
    }
  }

  const byImportance = [...roster].sort(
    (a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0),
  );
  for (const player of byImportance) {
    if (cards.length >= limit) break;
    if (usedIds.has(player.id)) continue;
    usedIds.add(player.id);
    cards.push({ player, note: '' });
  }

  return cards.slice(0, limit);
}

export function getTeamHonorsList(team, max = 12) {
  const raw = team?.honors ?? team?.honours ?? team?.trophies;
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean).slice(0, max);
  }
  return String(raw)
    .split(/[,;|]/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, max);
}
