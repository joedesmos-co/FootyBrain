/**
 * Player image quality scoring for Wikimedia ingest.
 * Prefer portrait / head-and-shoulders football photos; reject team shots and tiny crops.
 */

import qualityConfig from '../../src/data/playerImageQuality.json' with { type: 'json' };

export const MIN_APPROVAL_SCORE = qualityConfig.minApprovalScore ?? 58;
export const MIN_AUTO_APPROVE_SCORE = qualityConfig.minAutoApproveScore ?? 65;

const HARD_REJECT_PATTERNS = [
  /red carpet/i,
  /dressing room/i,
  /laureus world sports awards/i,
];

const GROUP_FILE_PATTERNS = [
  /\band\b/i,
  /\bvs\.?\b/i,
  /\s+v\s+/i,
  /line[- ]?up/i,
  /lineup/i,
  /gruppenfoto/i,
  /team photo/i,
  /dressing room/i,
  /starting line/i,
  /combined/i,
  /,\s*[A-Z][a-z]+ [A-Z][a-z]+/, // "Smith, John Doe" style multi-name lists
];

const EVENT_STADIUM_PATTERNS = [
  /red carpet/i,
  /laureus/i,
  /award/i,
  /stadium/i,
  /monumental/i,
  /press conference/i,
  /aut vs/i,
  /\b\d{8}\s+[A-Z]{3}\s+[A-Z]{3}\b/i,
  /^\d{8}\s/i,
  /fußball,\s*männer.*1dx/i,
  /uefa champions league.*by stepro/i,
];

const PORTRAIT_HINT_PATTERNS = [
  /profil/i,
  /portrait/i,
  /headshot/i,
  /head shot/i,
  /\(cropped\)/i,
  /\(fullcropped/i,
  /warm up/i,
];

const NEGATIVE_CROP_PATTERNS = [
  /partial/i,
  /from behind/i,
  /back view/i,
  /silhouette/i,
];

function haystack(meta, playerName, verifyName) {
  const file = String(meta?.commonsFile ?? '');
  const desc = String(meta?.description ?? meta?.commonsDescription ?? '');
  return `${file} ${desc} ${playerName ?? ''} ${verifyName ?? ''}`.toLowerCase();
}

function surnameTokens(playerName, verifyName) {
  const tokens = `${playerName ?? ''} ${verifyName ?? ''}`
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((t) => t.length > 2);
  return [...new Set(tokens)];
}

export function isDeniedCommonsFile(commonsFile) {
  const file = String(commonsFile ?? '').trim();
  if (!file) return false;
  return (qualityConfig.denyCommonsFiles ?? []).some(
    (denied) => denied.toLowerCase() === file.toLowerCase(),
  );
}

export function isDeniedPlayer(playerId) {
  return Boolean(qualityConfig.denyPlayerIds?.[playerId]);
}

export function getPreferredOverride(playerId) {
  return qualityConfig.preferredOverrides?.[playerId] ?? null;
}

/**
 * @returns {{ score: number, grade: 'excellent'|'good'|'fair'|'poor'|'reject', flags: string[], reasons: string[], pass: boolean }}
 */
export function scorePlayerImage(meta, playerName, verifyName = null) {
  const flags = [];
  const reasons = [];
  let score = 50;

  const width = Number(meta?.width ?? meta?.imageWidth ?? 0);
  const height = Number(meta?.height ?? meta?.imageHeight ?? 0);
  const file = String(meta?.commonsFile ?? '');
  const hay = haystack(meta, playerName, verifyName);
  const tokens = surnameTokens(playerName, verifyName);

  if (isDeniedCommonsFile(file)) {
    return {
      score: 0,
      grade: 'reject',
      flags: ['denylist'],
      reasons: ['commons file is denylisted'],
      pass: false,
    };
  }

  for (const pattern of HARD_REJECT_PATTERNS) {
    if (pattern.test(file) || pattern.test(hay)) {
      return {
        score: 0,
        grade: 'reject',
        flags: ['hard_reject'],
        reasons: ['hard-reject event/team pattern'],
        pass: false,
      };
    }
  }

  // Resolution
  if (width >= 600 && height >= 600) {
    score += 18;
    reasons.push('high resolution');
  } else if (width >= 450 && height >= 450) {
    score += 12;
    reasons.push('adequate resolution');
  } else if (width >= 320 && height >= 320) {
    score += 6;
  } else if (width > 0 && height > 0) {
    score -= 28;
    flags.push('low_resolution');
    reasons.push('resolution too small');
  }

  if (width > 0 && height > 0) {
    const ratio = width / height;
    if (height >= width && ratio <= 0.85) {
      score += 16;
      flags.push('portrait');
      reasons.push('portrait orientation');
    } else if (ratio >= 0.85 && ratio <= 1.15) {
      score += 10;
      flags.push('square');
      reasons.push('square framing');
    } else if (ratio <= 1.35) {
      score += 4;
    } else if (ratio >= 2.4) {
      score -= 28;
      flags.push('ultra_wide');
      reasons.push('ultra-wide landscape');
    } else if (ratio >= 1.55) {
      score -= 16;
      flags.push('wide_landscape');
      reasons.push('wide match/action framing');
    }
  }

  // Filename-only identity (often action/team context shots)
  const fileLower = file.toLowerCase();
  const matchedNameTokens = tokens.filter((t) => fileLower.includes(t));
  if (matchedNameTokens.length === 0 && tokens.some((t) => hay.includes(t))) {
    score -= 14;
    flags.push('name_not_in_filename');
    reasons.push('player named in description only (likely context shot)');
  }

  // Identity in filename (strong portrait signal)
  if (matchedNameTokens.length >= 2) {
    score += 14;
    flags.push('name_in_filename');
    reasons.push('player name in filename');
  } else if (matchedNameTokens.length === 1) {
    score += 8;
    reasons.push('surname in filename');
  } else if (tokens.length && !hay.includes(tokens[tokens.length - 1] ?? '')) {
    score -= 12;
    flags.push('weak_identity');
  }

  for (const pattern of PORTRAIT_HINT_PATTERNS) {
    if (pattern.test(hay)) {
      score += 6;
      flags.push('portrait_hint');
      break;
    }
  }

  for (const pattern of NEGATIVE_CROP_PATTERNS) {
    if (pattern.test(hay)) {
      score -= 12;
      flags.push('bad_crop');
    }
  }

  for (const pattern of GROUP_FILE_PATTERNS) {
    if (pattern.test(file) || pattern.test(hay)) {
      score -= 22;
      flags.push('group_or_team');
      reasons.push('group/team photo pattern');
      break;
    }
  }

  for (const pattern of EVENT_STADIUM_PATTERNS) {
    if (pattern.test(file) || pattern.test(hay)) {
      score -= 18;
      flags.push('event_stadium');
      reasons.push('event/stadium/generic match id');
      break;
    }
  }

  // Generic numbered match filenames without player name
  if (/^\d{8}\s/.test(file) && matchedNameTokens.length === 0) {
    score -= 20;
    flags.push('generic_match_id');
  }

  // Prefer modern photos when year appears in filename
  const yearMatch = file.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    if (year >= 2018) score += 4;
    else if (year <= 2012) score -= 6;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade = 'reject';
  if (score >= 80) grade = 'excellent';
  else if (score >= 70) grade = 'good';
  else if (score >= MIN_APPROVAL_SCORE) grade = 'fair';
  else if (score >= 40) grade = 'poor';

  const pass = score >= MIN_APPROVAL_SCORE && !flags.includes('denylist');

  return { score, grade, flags: [...new Set(flags)], reasons, pass };
}

export function pickBestQualityCandidate(candidates, playerName, verifyName, excludeTerms = []) {
  const scored = candidates
    .map((meta) => ({
      meta,
      quality: scorePlayerImage(meta, playerName, verifyName),
    }))
    .filter(({ meta, quality }) => quality.pass && !isDeniedCommonsFile(meta.commonsFile))
    .sort((a, b) => b.quality.score - a.quality.score);

  return scored[0] ?? null;
}

export function getQualityConfig() {
  return qualityConfig;
}
