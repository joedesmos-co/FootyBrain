/**
 * Shared accent-insensitive text matching for search features.
 */

export function normalizeForSearch(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function textMatchesQuery(text, query) {
  const value = normalizeForSearch(text);
  const q = normalizeForSearch(query);
  if (!q) return false;
  if (value.includes(q)) return true;

  const parts = value.split(' ');
  if (parts.some((part) => part.startsWith(q))) return true;

  const lastToken = parts[parts.length - 1];
  if (lastToken && lastToken.startsWith(q)) return true;

  return false;
}

/** Weak substring matches (score 60) — blocked for very short queries in universal search. */
export function isWeakSearchScore(score) {
  return score > 0 && score < 75;
}

function levenshteinWithin(a, b, maxDist = 1) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;

  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, curr[j]);
    }
    if (rowMin > maxDist) return maxDist + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export function typoToleranceScore(value, q) {
  if (q.length < 4) return 0;

  const parts = value.split(' ').filter(Boolean);
  for (const part of parts) {
    if (part.length < 4) continue;
    if (levenshteinWithin(part, q, 1) <= 1) return 55;
  }

  if (value.length >= 4 && levenshteinWithin(value, q, 1) <= 1) return 52;
  return 0;
}

export function matchScoreForText(text, query) {
  const value = normalizeForSearch(text);
  const q = normalizeForSearch(query);
  if (!q) return 0;
  if (value === q) return 100;
  if (value.startsWith(q)) return 90;
  const parts = value.split(' ');
  if (parts.some((part) => part === q)) return 85;
  if (parts.some((part) => part.startsWith(q))) return 75;
  const lastToken = parts[parts.length - 1];
  if (lastToken === q) return 80;
  if (lastToken?.startsWith(q)) return 70;
  if (q.length >= 3 && value.includes(q)) return 60;
  return typoToleranceScore(value, q);
}

/** Best score across multiple searchable strings */
export function matchScoreForFields(fields, query) {
  return fields.reduce((best, field) => {
    const score = matchScoreForText(field, query);
    return score > best ? score : best;
  }, 0);
}
