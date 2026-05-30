#!/usr/bin/env node
/**
 * Player image coverage audit.
 * Run: npm run audit:player-images
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { players } from '../src/data/sampleData.js';
import { resolvePlayerImageSource } from '../src/utils/playerImageManifest.js';
import { isApprovedAssetUrl } from '../src/utils/playerImageUrlPolicy.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const OUT_JSON = join(root, 'generated-data/player-image-audit.json');
const OUT_MD = join(root, 'generated-data/player-image-audit.md');
const CACHE_PATH = join(root, 'generated-data/player-image-wikimedia-cache.json');
const APPROVED_PATH = join(root, 'src/data/playerImageApproved.json');
const META_PATH = join(root, 'src/data/playerImageOverlays.meta.json');

function readJson(path, fallback = {}) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

async function checkUrl(url) {
  if (!url) return { ok: null };
  if (url.startsWith('/images/')) {
    const local = join(root, 'public', url.replace(/^\//, ''));
    return { ok: existsSync(local), local: true };
  }
  // Wikimedia often rejects HEAD; treat as unchecked unless GET fails.
  if (url.includes('upload.wikimedia.org')) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0', 'User-Agent': 'FootyCompass/1.0 audit' },
        signal: AbortSignal.timeout(8000),
      });
      return { ok: res.ok || res.status === 206, status: res.status, checked: 'range-get' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  const approved = readJson(APPROVED_PATH);
  const cache = readJson(CACHE_PATH);
  const meta = readJson(META_PATH);

  let withPhoto = 0;
  let withFallback = 0;
  const broken = [];
  const missingAttribution = [];
  const verified = [];

  for (const player of players) {
    const source = resolvePlayerImageSource(player);
    if (source.url && source.tier !== 'gradientInitials') {
      withPhoto += 1;
      const entry = approved.entries?.[player.id];
      if (!entry?.imageCredit || !entry?.imageLicense) {
        missingAttribution.push({ id: player.id, name: player.name });
      }
      verified.push({ id: player.id, name: player.name, tier: source.tier, url: source.url });

      // Only verify local files at audit time; Wikimedia URLs were validated during ingest.
      if (source.url.startsWith('/images/')) {
        const check = await checkUrl(source.url);
        if (check.ok === false) broken.push({ id: player.id, name: player.name, url: source.url, ...check });
      }
    } else {
      withFallback += 1;
    }
  }

  const skippedCache = Object.entries(cache.skipped ?? {}).map(([id, v]) => ({
    id,
    name: players.find((p) => p.id === id)?.name,
    reason: v.reason,
    at: v.at,
  }));

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      players: players.length,
      withVerifiedPhoto: withPhoto,
      withFallbackAvatar: withFallback,
      priorityListSize: (meta.priorityPlayerIds ?? []).length,
      approvedEntries: Object.keys(approved.entries ?? {}).filter((id) => approved.entries[id]?.imageUrl).length,
      cacheResolved: Object.keys(cache.resolved ?? {}).length,
      cacheSkipped: Object.keys(cache.skipped ?? {}).length,
    },
    brokenUrls: broken,
    missingAttribution,
    skippedDueToLicensing: skippedCache,
    verifiedSample: verified.slice(0, 30),
  };

  writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const md = `# Player image audit

Generated: ${report.generatedAt}

| Metric | Count |
|--------|------:|
| Total players | ${report.totals.players} |
| Verified photos | ${report.totals.withVerifiedPhoto} |
| Fallback avatars | ${report.totals.withFallbackAvatar} |
| Approved overlay entries | ${report.totals.approvedEntries} |
| Cache resolved | ${report.totals.cacheResolved} |
| Cache skipped (licensing) | ${report.totals.cacheSkipped} |
| Broken URLs | ${broken.length} |
| Missing attribution | ${missingAttribution.length} |

## Broken URLs

${broken.length ? broken.map((b) => `- ${b.name} (\`${b.id}\`): ${b.url}`).join('\n') : '_None._'}

## Skipped (cache)

${skippedCache.length ? skippedCache.slice(0, 40).map((s) => `- ${s.name ?? s.id}: ${s.reason}`).join('\n') : '_None._'}

## Next batch

\`\`\`bash
npm run fetch:wikimedia-player-images
\`\`\`
`;

  writeFileSync(OUT_MD, md, 'utf8');

  console.log(`Verified photos: ${withPhoto}`);
  console.log(`Fallback avatars: ${withFallback}`);
  console.log(`Broken URLs: ${broken.length}`);
  console.log(`Wrote ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
