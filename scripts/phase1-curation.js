/**
 * Controlled roster curation — shared by app-ready preview and sampleData merge.
 */

export const EXPANSION_LIMITS = {
  playersMin: 880,
  /** Soft planning threshold — warn in validate:dataset-scale when exceeded. */
  playersSoftMax: 3000,
  /**
   * Emergency merge trim ceiling (browse rows dropped first; draft/editorial preserved).
   * Raised to 4300 for phase 9 Bundesliga completion (8 L1 clubs; ~4248 projected players).
   */
  playersHardMax: 4300,
  /** @deprecated Use playersHardMax — alias for merge scripts. */
  playersMax: 4300,
  /**
   * Pipeline import throttle per club (senior TM rows). Not a product squad size cap.
   * Full senior squads (including bench) target ~30–35 when TM data allows.
   */
  importMaxPerClub: 35,
  /** @deprecated Use importMaxPerClub — pipeline import throttle only. */
  maxPerClub: 35,
  targetPerClub: 28,
  minSquadPerClub: 18,
  minQuizReadyPerClub: 5,
  minAge: 19,
};

// Backward-compatible alias for existing scripts while the expansion pipeline keeps its phase1 filenames.
export const PHASE1_LIMITS = EXPANSION_LIMITS;

const POSITION_RANK = {
  goalkeeper: 0,
  'goal keeper': 0,
  centreback: 1,
  centerback: 1,
  'centre-back': 1,
  'center-back': 1,
  defender: 1,
  fullback: 1,
  back: 1,
  midfielder: 2,
  wingback: 2,
  winger: 3,
  forward: 3,
  striker: 3,
  attack: 3,
};

function normalizeName(value) {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasSupportedDisplayName(value) {
  if (!value) return false;
  return /^[\p{Script=Latin}\p{Mark}\d\s.'’\-]+$/u.test(value);
}

function positionRank(position) {
  if (!position) return 5;
  const key = position.toLowerCase();
  for (const [token, rank] of Object.entries(POSITION_RANK)) {
    if (key.includes(token)) return rank;
  }
  return 4;
}

function playerAge(p, ageFromDob) {
  if (typeof p.age === 'number') return p.age;
  if (typeof ageFromDob === 'function' && p.dateOfBirth) return ageFromDob(p.dateOfBirth);
  return null;
}

function isSeniorSquadPlayer(p, ageFromDob) {
  const age = playerAge(p, ageFromDob);
  if (age != null && age < PHASE1_LIMITS.minAge) return false;
  const pos = (p.position || '').toLowerCase();
  if (pos.includes('youth') || pos.includes('u19') || pos.includes('u21')) return false;
  const name = (p.name || '').trim();
  if (!name || name.length < 3) return false;
  if (!hasSupportedDisplayName(name)) return false;
  return true;
}

/**
 * Curate TM preview rows before app-ready merge or sample merge.
 * No global playersMax slice here — emergency trim runs at merge via expansion-player-cap.
 *
 * @param {object[]} tmPlayers — preview.players shape
 * @param {Set<string>} reservedSourceIds — MVP linked sourceIds
 * @param {(dob: string) => number|null} [ageFromDob]
 */
export function curatePhase1PreviewPlayers(tmPlayers, reservedSourceIds, ageFromDob = () => null) {
  const byTeam = new Map();

  for (const tm of tmPlayers) {
    if (reservedSourceIds.has(String(tm.sourceId))) continue;
    if (!tm.footybrainTeamId || !tm.sourceId) continue;
    if (!isSeniorSquadPlayer({ name: displayName(tm), position: tm.position, dateOfBirth: tm.dateOfBirth }, ageFromDob)) {
      continue;
    }
    const list = byTeam.get(tm.footybrainTeamId) ?? [];
    list.push(tm);
    byTeam.set(tm.footybrainTeamId, list);
  }

  const selected = [];
  for (const [, squad] of byTeam) {
    const seenNames = new Set();
    const sorted = [...squad].sort((a, b) => {
      const ageA = playerAge({ dateOfBirth: a.dateOfBirth }, ageFromDob) ?? 0;
      const ageB = playerAge({ dateOfBirth: b.dateOfBirth }, ageFromDob) ?? 0;
      if (ageB !== ageA) return ageB - ageA;
      const pr = positionRank(a.position) - positionRank(b.position);
      if (pr !== 0) return pr;
      return String(a.sourceId).localeCompare(String(b.sourceId));
    });

    let taken = 0;
    for (const tm of sorted) {
      if (taken >= PHASE1_LIMITS.importMaxPerClub) break;
      const norm = normalizeName(displayName(tm));
      if (!norm || seenNames.has(norm)) continue;
      seenNames.add(norm);
      selected.push(tm);
      taken += 1;
    }
  }

  selected.sort((a, b) => {
    const teamCmp = (a.footybrainTeamId || '').localeCompare(b.footybrainTeamId || '');
    if (teamCmp !== 0) return teamCmp;
    return (displayName(a) || '').localeCompare(displayName(b) || '');
  });

  return selected;
}

export function displayNameFromTm(tm) {
  return displayName(tm);
}

function displayName(tm) {
  const first = (tm.firstName || '').trim();
  const last = (tm.lastName || '').trim();
  if (first && last) return `${first} ${last}`;
  if (last) return last;
  const raw = (tm.name || '').split(',')[0].trim();
  return raw || null;
}

/** Names that appear on more than one player (quiz ambiguity risk). */
export function findAmbiguousDisplayNames(players) {
  const counts = new Map();
  for (const p of players) {
    const key = normalizeName(p.name);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set(
    [...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name),
  );
}
