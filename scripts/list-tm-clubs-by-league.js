#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const code = process.argv[2] ?? 'NL1';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRAPER_DIR = path.join(
  ROOT,
  'raw-data/transfermarkt-datasets/data/raw/transfermarkt-scraper',
);

const years = fs
  .readdirSync(SCRAPER_DIR)
  .filter((n) => /^\d{4}$/.test(n))
  .map(Number)
  .sort((a, b) => b - a);
const season = String(years[0]);
const clubsPath = path.join(SCRAPER_DIR, season, 'clubs.json.gz');
async function main() {
  const rows = [];

  await new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: zlib.createGunzip(fs.createReadStream(clubsPath)),
    });
    rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        const c = JSON.parse(line);
        if (c.parent?.country_code === code) rows.push({ code: c.code, name: c.name });
      } catch {
        /* skip */
      }
    });
    rl.on('close', resolve);
    rl.on('error', reject);
  });

  rows.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`${code} (${season}): ${rows.length} clubs`);
  for (const r of rows) console.log(`${r.code}\t${r.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
