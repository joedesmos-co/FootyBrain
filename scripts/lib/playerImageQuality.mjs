/**
 * Player image quality scoring for Wikimedia ingest.
 * Prefer portrait / head-and-shoulders football photos; reject team shots and tiny crops.
 */

import qualityConfig from '../../src/data/playerImageQuality.json' with { type: 'json' };

export const MIN_APPROVAL_SCORE = qualityConfig.minApprovalScore ?? 58;
export const MIN_AUTO_APPROVE_SCORE = qualityConfig.minAutoApproveScore ?? 65;
export const MIN_PORTRAIT_HEIGHT = qualityConfig.minPortraitHeight ?? 400;
export const MIN_PIXEL_AREA = qualityConfig.minPixelArea ?? 120_000;

const HARD_REJECT_PATTERNS = [
  /red carpet/i,
  /dressing room/i,
  /laureus world sports awards/i,
];

const SCREENSHOT_PATTERNS = [
  /screenshot/i,
  /screen grab/i,
  /screengrab/i,
  /frame grab/i,
  /video still/i,
  /youtube/i,
  /instagram story/i,
  /twitter\.com/i,
  /\.webm/i,
];

const MULTI_PLAYER_FILE_PATTERN = /\band\s+[A-ZÁÉÍÓÚÄÖÜ][a-záéíóúäöü'-]+/i;

const GROUP_FILE_PATTERNS = [
  /\band\s+[A-ZÁÉÍÓÚÄÖÜ]/i,
  /line[- ]?up/i,
  /lineup/i,
  /gruppenfoto/i,
  /team photo/i,
  /dressing room/i,
  /starting line/i,
  /combined/i,
  /,\s*[A-Z][a-z]+ [A-Z][a-z]+/, // "Smith, John Doe" style multi-name lists
];

const MATCH_FILENAME_PATTERNS = [
  /-vs-/i,
  /\s+vs\.?\s+/i,
  /\s+-\s+.+\s+-\s+\d{2}-\d{2}-\d{4}/i,
  /\s+\d+\s+x\s+\d+\s/i,
];

const COACH_NON_PLAYER_PATTERNS = [
  /\bentrenador\b/i,
  /\bcoach\b/i,
  /\bmanager\b/i,
];

const TEAM_PHOTO_FILE_PATTERNS = [
  /national football team\s+-\s+\d+/i,
  /national team\s+-\s+\d+/i,
  /^ol-zenit\s*\(\d+\)/i,
  /^zenit-benfica/i,
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
  /fifa friendly match/i,
  /training with goalkeepers/i,
  /friendly match/i,
  /pre-?season friendly/i,
  /friendly v\./i,
  /after the match between/i,
  /pictured with a fan/i,
  /with a fan after/i,
  /league game versus/i,
];

const PORTRAIT_HINT_PATTERNS = [
  /profil/i,
  /portrait/i,
  /headshot/i,
  /head shot/i,
  /\(cropped\)/i,
  /\(fullcropped/i,
  /\bcrop(?:ped)?\b/i,
  /warm up/i,
];

const NEGATIVE_CROP_PATTERNS = [
  /partial/i,
  /from behind/i,
  /back view/i,
  /silhouette/i,
];

const NON_PORTRAIT_FILE_PATTERNS = [
  /watching from/i,
  /against portland/i,
  /goalkeeper-training.*screen/i,
  /screen1\.png/i,
];

const FIXTURE_FILENAME_PATTERNS = [
  /^Lens - /i,
  /^RC Lens - /i,
  /^France - /i,
  /^Norwich \d/i,
  /^Chelsea \d/i,
  /^URUGUAY \d/i,
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
  const pixelArea = width > 0 && height > 0 ? width * height : 0;
  const ratio = width > 0 && height > 0 ? width / height : 0;

  if (isDeniedCommonsFile(file)) {
    return {
      score: 0,
      grade: 'reject',
      flags: ['denylist'],
      reasons: ['commons file is denylisted'],
      pass: false,
    };
  }

  if (MULTI_PLAYER_FILE_PATTERN.test(file)) {
    return {
      score: 0,
      grade: 'reject',
      flags: ['multi_player_file'],
      reasons: ['filename lists multiple players'],
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

  for (const pattern of SCREENSHOT_PATTERNS) {
    if (pattern.test(file) || pattern.test(hay)) {
      score -= 24;
      flags.push('screenshot_like');
      reasons.push('screenshot or frame-grab pattern');
      break;
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

  if (pixelArea > 0 && pixelArea < MIN_PIXEL_AREA) {
    score -= 18;
    flags.push('tiny_image');
    reasons.push('total pixel area too small');
  }

  if (width > 0 && height > 0) {
    if (height >= width && ratio <= 0.85) {
      score += 16;
      flags.push('portrait');
      reasons.push('portrait orientation');
      if (height >= MIN_PORTRAIT_HEIGHT) {
        score += 6;
        flags.push('tall_portrait');
        reasons.push('tall portrait frame');
      }
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

    // Face likely too small in wide action frames
    if (ratio >= 1.45 && height < 480) {
      score -= 14;
      flags.push('small_face_wide_frame');
      reasons.push('wide frame with limited height (face likely small)');
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

  // Head-and-shoulders candidate bonus
  if (
    flags.includes('portrait') &&
    height >= MIN_PORTRAIT_HEIGHT &&
    matchedNameTokens.length >= 1 &&
    !flags.includes('group_or_team')
  ) {
    score += 8;
    flags.push('head_shoulder_candidate');
    reasons.push('head-and-shoulders portrait candidate');
  }

  for (const pattern of NEGATIVE_CROP_PATTERNS) {
    if (pattern.test(hay)) {
      score -= 12;
      flags.push('bad_crop');
    }
  }

  for (const pattern of NON_PORTRAIT_FILE_PATTERNS) {
    if (pattern.test(file) || pattern.test(hay)) {
      score -= 32;
      flags.push('non_portrait_context');
      reasons.push('not a player portrait (context/stand shot)');
      break;
    }
  }

  for (const pattern of FIXTURE_FILENAME_PATTERNS) {
    if (pattern.test(file) && matchedNameTokens.length === 0) {
      score -= 28;
      flags.push('fixture_context');
      reasons.push('match/fixture filename without player name');
      break;
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

  for (const pattern of MATCH_FILENAME_PATTERNS) {
    if (pattern.test(file)) {
      score -= 26;
      flags.push('match_filename');
      reasons.push('match/fixture filename (vs/opponent)');
      break;
    }
  }

  for (const pattern of TEAM_PHOTO_FILE_PATTERNS) {
    if (pattern.test(file)) {
      score -= 30;
      flags.push('team_photo_file');
      reasons.push('numbered team/squad filename');
      break;
    }
  }

  for (const pattern of COACH_NON_PLAYER_PATTERNS) {
    if (pattern.test(file) || pattern.test(hay)) {
      score -= 40;
      flags.push('coach_not_player');
      reasons.push('coach/manager photo, not player portrait');
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

  const yearMatchForPass = file.match(/\b(20\d{2})\b/);
  const fileYear = yearMatchForPass ? Number(yearMatchForPass[1]) : null;
  const hasPortraitHint = flags.includes('portrait_hint') || /\(cropped\)/i.test(file);

  const pass =
    score >= MIN_APPROVAL_SCORE &&
    !flags.includes('denylist') &&
    !flags.includes('multi_player_file') &&
    !flags.includes('hard_reject') &&
    !(flags.includes('event_stadium') && !flags.includes('portrait') && !flags.includes('square')) &&
    !(flags.includes('name_not_in_filename') && flags.includes('wide_landscape')) &&
    !flags.includes('coach_not_player') &&
    !(flags.includes('match_filename') && !hasPortraitHint) &&
    !(flags.includes('team_photo_file') && !hasPortraitHint) &&
    !(flags.includes('event_stadium') && flags.includes('name_not_in_filename') && !hasPortraitHint) &&
    !(flags.includes('group_or_team') && flags.includes('event_stadium') && !hasPortraitHint) &&
    !(fileYear !== null && fileYear <= 2012 && flags.includes('event_stadium')) &&
    !(flags.includes('name_not_in_filename') && !hasPortraitHint && score < MIN_AUTO_APPROVE_SCORE) &&
    !flags.includes('non_portrait_context') &&
    !(flags.includes('fixture_context') && !hasPortraitHint) &&
    !(flags.includes('wide_landscape') && !hasPortraitHint && matchedNameTokens.length === 0) &&
    !(flags.includes('screenshot_like') && score < MIN_AUTO_APPROVE_SCORE);

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
