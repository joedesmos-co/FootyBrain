#!/usr/bin/env node
/**
 * Flags deprecated or inconsistent user-facing copy in src/.
 * Run: npm run audit:entity-consistency
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'src');

/** @type {Array<{ id: string, pattern: RegExp, hint: string, allow?: RegExp }>} */
const RULES = [
  {
    id: 'discovery-hubs',
    pattern: /Discovery hubs/g,
    hint: 'Use LINK_EXPLORE_FOOTBALL / "Explore football" from entityCopy.js',
  },
  {
    id: 'breadcrumb-teams',
    pattern: /label:\s*['"]Teams['"]/g,
    hint: 'Use CRUMB_CLUBS ("Clubs") — /teams route unchanged',
  },
  {
    id: 'quiz-ready-badge',
    pattern: /·\s*Quiz ready/g,
    hint: 'Use BADGE_QUIZ_READY from entityCopy.js',
  },
  {
    id: 'international-quiz-short',
    pattern: /['"]International quiz['"]/g,
    hint: 'Use LINK_INTERNATIONAL_PLAYER_QUIZ ("International player quiz")',
    allow: /entityCopy\.js/,
  },
  {
    id: 'jsonld-teams-crumb',
    pattern: /name:\s*['"]Teams['"]/g,
    hint: 'Use CRUMB_CLUBS in JSON-LD breadcrumbs',
    allow: /universalSearch|Navbar/,
  },
];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

function main() {
  const findings = [];

  for (const file of walk(SRC_DIR)) {
    const rel = path.relative(ROOT, file);
    const text = fs.readFileSync(file, 'utf8');

    for (const rule of RULES) {
      if (rule.allow?.test(rel)) continue;
      let match;
      const re = new RegExp(rule.pattern.source, rule.pattern.flags);
      while ((match = re.exec(text)) !== null) {
        findings.push({
          rule: rule.id,
          file: rel,
          line: lineNumber(text, match.index),
          snippet: text.slice(match.index, match.index + 60).replace(/\s+/g, ' ').trim(),
          hint: rule.hint,
        });
      }
    }
  }

  const outDir = path.join(ROOT, 'generated-data');
  fs.mkdirSync(outDir, { recursive: true });
  const reportPath = path.join(outDir, 'entity-consistency-audit.json');
  const summaryPath = path.join(outDir, 'entity-consistency-audit.md');

  const report = {
    generatedAt: new Date().toISOString(),
    findingCount: findings.length,
    findings,
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  const byRule = new Map();
  for (const f of findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule).push(f);
  }

  let md = `# Entity consistency audit\n\nGenerated: ${report.generatedAt}\n\n`;
  if (findings.length === 0) {
    md += 'No banned copy patterns found in `src/`.\n';
  } else {
    md += `**${findings.length}** issue(s) found.\n\n`;
    for (const [rule, items] of byRule) {
      md += `## ${rule}\n\n`;
      for (const item of items) {
        md += `- \`${item.file}:${item.line}\` — \`${item.snippet}\`\n`;
        md += `  - ${item.hint}\n`;
      }
      md += '\n';
    }
  }
  fs.writeFileSync(summaryPath, md);

  console.log(`Entity consistency: ${findings.length} finding(s)`);
  console.log(`  ${reportPath}`);
  console.log(`  ${summaryPath}`);

  if (findings.length > 0) {
    for (const f of findings.slice(0, 20)) {
      console.log(`  [${f.rule}] ${f.file}:${f.line}`);
    }
    if (findings.length > 20) console.log(`  … and ${findings.length - 20} more`);
    process.exit(1);
  }
}

main();
