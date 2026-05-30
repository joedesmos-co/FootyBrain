/**
 * Wikimedia Commons helpers for player image ingest.
 * Timeouts, limited retries, no infinite loops.
 */

import {
  getPreferredOverride,
  isDeniedCommonsFile,
  isDeniedPlayer,
  pickBestQualityCandidate,
  scorePlayerImage,
} from './playerImageQuality.mjs';

export const USER_AGENT = 'FootyCompass/1.0 (player-image-ingest; https://footycompass.com)';

export const REQUEST_TIMEOUT_MS = 12_000;
export const MAX_RETRIES = 2;
export const API_DELAY_MS = 650;
export const SEARCH_CANDIDATE_LIMIT = 8;

export const ALLOWED_LICENSE_PATTERNS = [
  /^cc0/i,
  /^cc by 2\.0/i,
  /^cc by 3\.0/i,
  /^cc by 4\.0/i,
  /^cc by-sa 2\.0/i,
  /^cc by-sa 2\.5/i,
  /^cc by-sa 3\.0/i,
  /^cc by-sa 4\.0/i,
  /^public domain/i,
  /^pd-/i,
];

export const REJECT_LICENSE_PATTERNS = [
  /all rights reserved/i,
  /copyrighted free use/i,
  /fair use/i,
  /non-free/i,
  /permission only/i,
];

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s) {
  return String(s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function stripHtml(s) {
  return decodeHtml(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isAllowedLicense(licenseShort) {
  const text = String(licenseShort ?? '').trim();
  if (!text) return false;
  if (REJECT_LICENSE_PATTERNS.some((re) => re.test(text))) return false;
  return ALLOWED_LICENSE_PATTERNS.some((re) => re.test(text));
}

export function requiresAttribution(licenseShort) {
  const text = String(licenseShort ?? '').toLowerCase();
  if (text.includes('cc0') || text.includes('public domain')) return false;
  return text.includes('cc by');
}

const FOOTBALL_CONTEXT =
  /\b(football|footballer|soccer|fútbol|futbol|fifa|uefa|world cup|copa|euro|premier|bundesliga|serie a|ligue 1|la liga|national team|selección|striker|midfielder|goalkeeper|defender|\bfc\b|\bcf\b|\bafc\b|\bvs\.?\b| vs |match|training|cup|qualification|rennes|madrid|barcelona|manchester|liverpool|chelsea|arsenal|juventus|milan|inter|dortmund|bayern|benfica|porto|zenit|argentina|uruguay|brazil|spain|germany|france|england)\b/i;

export function hasFootballContext(meta) {
  const hay = `${meta.description} ${meta.commonsFile}`;
  return FOOTBALL_CONTEXT.test(hay);
}

export function verifyIdentity(meta, verifyName, playerName, excludeTerms = []) {
  if (!hasFootballContext(meta)) return false;
  const hay = `${meta.description} ${meta.commonsFile}`.toLowerCase();
  for (const term of excludeTerms) {
    if (term && hay.includes(String(term).toLowerCase())) return false;
  }

  const playerTokens = String(playerName ?? '')
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((t) => t.length > 2);
  const verifyTokens = String(verifyName ?? '')
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((t) => t.length > 2);
  const tokens = [...new Set([...playerTokens, ...verifyTokens])];
  if (!tokens.length) return false;

  const givenName = playerTokens[0];
  const surname = playerTokens[playerTokens.length - 1];

  // Reject when description/file clearly names a different person with the same surname.
  if (givenName && surname && hay.includes(surname) && !hay.includes(givenName)) {
    const otherGiven = hay.match(
      new RegExp(`([a-zà-ÿ]{3,})\\s+${surname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
    );
    if (otherGiven && otherGiven[1].toLowerCase() !== givenName) return false;
  }

  const needle = String(verifyName ?? '').toLowerCase().trim();
  if (needle && needle.includes(' ') && hay.includes(needle)) return true;

  if (needle && verifyTokens.length === 1 && playerTokens.length >= 2) {
    if (!hay.includes(givenName ?? '')) {
      // Surname-only verifyName must not match a different player's full name.
      if (hay.includes(needle)) return false;
    }
  } else if (needle && hay.includes(needle)) {
    return true;
  }

  if (surname && surname.length > 2 && !hay.includes(surname)) return false;

  const matched = tokens.filter((t) => hay.includes(t)).length;
  return matched >= Math.min(2, tokens.length);
}

function parseCommonsPage(page) {
  const info = page.imageinfo?.[0];
  if (!info?.url) return null;
  if (info.mime && !info.mime.startsWith('image/')) return null;

  const ext = info.extmetadata ?? {};
  const licenseShort = stripHtml(ext.LicenseShortName?.value ?? '');
  const artist = stripHtml(ext.Artist?.value ?? ext.Credit?.value ?? '');
  const description = stripHtml(ext.ImageDescription?.value ?? '');
  const title = page.title ?? '';

  return {
    commonsFile: title.replace(/^File:/, ''),
    pageTitle: title,
    pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    thumbUrl: info.thumburl ?? info.url,
    originalUrl: info.url,
    width: info.width ?? info.thumbwidth ?? 0,
    height: info.height ?? info.thumbheight ?? 0,
    mime: info.mime,
    licenseShort,
    artist: artist || 'Wikimedia Commons contributor',
    description,
  };
}

/**
 * Fetch with timeout + max 2 retries on 429/503/408 only.
 */
export async function wikiFetch(url) {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if ([429, 503, 408].includes(res.status) && attempt < MAX_RETRIES) {
        await sleep(1200 * (attempt + 1));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        await sleep(800 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error('Wikimedia fetch failed');
}

export async function fetchCommonsFile(commonsFile) {
  const title = commonsFile.startsWith('File:') ? commonsFile : `File:${commonsFile}`;
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '640',
    format: 'json',
    origin: '*',
  });

  const res = await wikiFetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!res.ok) return { error: `http_${res.status}` };

  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return null;

  return parseCommonsPage(page);
}

export async function searchCommonsFiles(searchTerm, limitResults = SEARCH_CANDIDATE_LIMIT) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: String(limitResults),
    gsrsearch: `${searchTerm} football`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '640',
    format: 'json',
    origin: '*',
  });

  const res = await wikiFetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!res.ok) return { error: `http_${res.status}`, results: [] };

  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const results = Object.values(pages).map(parseCommonsPage).filter(Boolean);
  return { results };
}

export async function downloadImage(url, destPath, writeFile) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFile(destPath, buf);
}

export function buildApprovedEntry(player, meta, imageUrl, quality = null) {
  const q = quality ?? scorePlayerImage(meta, player.name);
  return {
    imageUrl,
    imageAlt: `${player.name}, ${player.position ?? 'footballer'} — licensed photo`,
    imageCredit: meta.artist,
    imageLicense: meta.licenseShort,
    imageSource: 'Wikimedia Commons',
    imageSourceUrl: meta.pageUrl,
    imageAttributionRequired: requiresAttribution(meta.licenseShort),
    imageSrcSet: null,
    status: 'approved',
    commonsFile: meta.commonsFile,
    commonsDescription: meta.description,
    imageWidth: meta.width ?? null,
    imageHeight: meta.height ?? null,
    qualityScore: q.score,
    qualityGrade: q.grade,
  };
}

export async function resolvePlayerCommonsImage(spec, player, { onDelay = sleep } = {}) {
  if (isDeniedPlayer(player.id)) {
    return { skip: true, reason: 'player_denylisted' };
  }

  const override = getPreferredOverride(player.id);
  const mergedSpec = override
    ? { ...spec, commonsFile: override.commonsFile ?? spec.commonsFile, verifyName: override.verifyName ?? spec.verifyName }
    : spec;

  let meta = null;
  let quality = null;

  if (mergedSpec.commonsFile) {
    await onDelay(API_DELAY_MS);
    const direct = await fetchCommonsFile(mergedSpec.commonsFile);
    if (direct?.error) return { skip: true, reason: direct.error };
    if (direct && isDeniedCommonsFile(direct.commonsFile)) {
      return { skip: true, reason: 'commons_denylisted' };
    }
    if (direct) {
      quality = scorePlayerImage(direct, player.name, mergedSpec.verifyName);
      if (quality.pass) meta = direct;
      else if (!override) {
        // fall through to search for a better candidate
      } else {
        return { skip: true, reason: `quality_below_threshold:${quality.score}` };
      }
    }
  }

  if (!meta) {
    const searchTerm = mergedSpec.searchName ?? mergedSpec.verifyName ?? player.name;
    await onDelay(API_DELAY_MS);
    const search = await searchCommonsFiles(searchTerm);
    if (search.error) return { skip: true, reason: search.error };

    const safeCandidates = search.results.filter((candidate) => {
      if (!isAllowedLicense(candidate.licenseShort)) return false;
      if (!verifyIdentity(candidate, mergedSpec.verifyName, player.name, mergedSpec.excludeTerms)) return false;
      if (isDeniedCommonsFile(candidate.commonsFile)) return false;
      if ((candidate.width ?? 0) < 200 || (candidate.height ?? 0) < 200) return false;
      return true;
    });

    const best = pickBestQualityCandidate(
      safeCandidates,
      player.name,
      mergedSpec.verifyName,
      mergedSpec.excludeTerms,
    );

    if (best) {
      meta = best.meta;
      quality = best.quality;
    }
  }

  if (!meta) return { skip: true, reason: 'no_safe_match' };
  if (!isAllowedLicense(meta.licenseShort)) {
    return { skip: true, reason: `unclear_license:${meta.licenseShort || 'unknown'}` };
  }
  if (!verifyIdentity(meta, mergedSpec.verifyName, player.name, mergedSpec.excludeTerms)) {
    return { skip: true, reason: 'identity_mismatch' };
  }
  if ((meta.width ?? 0) < 180 || (meta.height ?? 0) < 180) {
    return { skip: true, reason: 'image_too_small' };
  }

  quality = quality ?? scorePlayerImage(meta, player.name, mergedSpec.verifyName);
  if (!quality.pass) {
    return { skip: true, reason: `quality_below_threshold:${quality.score}` };
  }

  return { meta, quality };
}
