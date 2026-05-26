#!/usr/bin/env node
/**
 * One-off targeted fixes for generated-editorial-approved profiles.
 * Run: node scripts/fix-approved-editorial-quality.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_PATH = path.join(__dirname, '../src/data/sampleData.js');

/** Exact hint string replacements (meta leakage). */
const HINT_REPLACEMENTS = [
  [
    'Central midfielder listed with Ajax in FootyBrain.',
    'Dutch central midfielder who dictates tempo and arrives late in the box at Ajax.',
  ],
  [
    'Listed with Ajax in this FootyBrain dataset.',
    'Veteran Dutch attacker who can play wide or through the middle for Ajax.',
  ],
  [
    'Centre-forward listed with Ajax in FootyBrain.',
    'Tall Netherlands striker who holds up play and links the line at Ajax.',
  ],
  [
    'Netherlands midfielder listed with AZ Alkmaar in FootyBrain.',
    'Netherlands youth midfielder developing in the AZ Alkmaar first team.',
  ],
  [
    'American midfielder listed with Borussia Mönchengladbach in FootyBrain.',
    'United States international playmaker who links midfield and attack for Gladbach.',
  ],
  [
    'German playmaker now listed with Eintracht Frankfurt in FootyBrain.',
    'Germany playmaker who won the World Cup and now pulls strings for Eintracht Frankfurt.',
  ],
  [
    'Listed with the Rotterdam club in FootyBrain.',
    'Austrian centre-back and defensive leader for Feyenoord in the Eredivisie.',
  ],
  [
    'Creative player listed with SC Freiburg in FootyBrain.',
    'Japan attacker who combines pressing with creative link play for Freiburg.',
  ],
  [
    'Veteran French striker listed with Lille in FootyBrain.',
    'France World Cup winner and aerial striker who leads the line for Lille.',
  ],
  [
    'Short, intense full-back listed with Lyon in FootyBrain.',
    'Argentina left-back known for intensity, overlapping runs, and defensive bite.',
  ],
  [
    'Fast centre-forward listed with Marseille in this FootyBrain dataset.',
    'Gabon striker and former Arsenal captain known for pace and sharp finishing.',
  ],
  [
    'Combative midfielder listed with Marseille in FootyBrain.',
    'Denmark midfielder known for competitive tackling and vertical passing in Marseille.',
  ],
  [
    'Tall French midfielder listed with Monaco in this FootyBrain dataset.',
    'France World Cup winner with powerful dribbling and long-range threat from midfield.',
  ],
  [
    'Listed with Monaco in this FootyBrain dataset.',
    'Japan attacker who presses and combines between the lines for Monaco.',
  ],
  [
    'Centre-forward listed with Napoli in this FootyBrain dataset.',
    'Belgium striker known for strength, hold-up play, and goals in top leagues.',
  ],
  [
    'France winger listed with Paris Saint-Germain in FootyBrain.',
    'France winger who thrives on dribbling, pace, and unpredictability in wide areas.',
  ],
  [
    'Veteran left winger listed with PSV Eindhoven in FootyBrain.',
    'Croatia wide player and World Cup finalist known for crossing with either foot.',
  ],
  [
    'French forward listed with Stade Rennais in FootyBrain.',
    'French centre-forward who moves across the front line and finishes inside the box for Rennes.',
  ],
  [
    'Tall Germany goalkeeper listed with VfB Stuttgart in FootyBrain.',
    'Germany goalkeeper known for reflex saves and commanding presence in the penalty area.',
  ],
];

const FIELD_REPLACEMENTS = [
  [
    'Explosive left-back who attacks space in transition, overlaps constantly, and recovers with world-class pace.',
    'Explosive left-back who attacks space in transition, overlaps constantly, and recovers with elite pace.',
  ],
  [
    'Spain left-back who rebuilt his Premier League reputation at Brighton with calm defending and left-footed build-up play.',
    'Brazil left-sided defender who rebuilt his Premier League reputation at Brighton with calm defending and left-footed build-up play.',
  ],
  [
    'England left-back who won trophies with Brighton and Newcastle before becoming a Juventus defensive option in Serie A.',
    'England left-sided defender who won trophies with Brighton and Newcastle before becoming a Juventus defensive option in Serie A.',
  ],
  [
    'Spain left-back who won the Champions League with Chelsea and later brought experience to Celta Vigo with goals and crossing.',
    'Spain defender who won the Champions League with Chelsea and later brought experience to Celta Vigo with goals and set-piece threat.',
  ],
  [
    'Spain left-back whose set pieces and crossing powered Bayer Leverkusen’s unbeaten Bundesliga title season.',
    'Spain left-back whose set pieces and crossing were central to Bayer Leverkusen’s recent Bundesliga title success.',
  ],
  [
    'Attacking right-back who pushes high, whips in crosses, and recovers quickly to defend one-on-ones.',
    'Attacking right-back who pushes high, whips in crosses, and recovers quickly to defend one-on-ones.',
  ],
];

// Differentiate duplicate RB playingStyle (same string, three players) — only replace 2nd and 3rd occurrence.
const RB_STYLE_ALT = [
  'Energetic right-back who overlaps aggressively, delivers cut-backs, and tracks back with discipline.',
  'Modern right-back who combines pace on the flank with recovery runs and consistent crossing.',
];

const ANDRE_BLOCK_OLD = `    id: "tm-800176",
    name: "André",
    dateOfBirth: "2001-07-16",
    age: 24,
    position: "Midfield - Defensive Midfield",
    teamId: "wolves",
    leagueId: "premier-league",
    nationalTeam: "Brazil",
    nationality: "Brazil",
    importanceScore: 84,
    quickFact: "Brazil goalkeeper who won the Copa América and became a Wolves starter with calm shot-stopping after a Fluminense rise.",
    playingStyle: "Composed goalkeeper who stays upright in one-on-ones, commands the area, and distributes cleanly to build play.",
    careerHistory: [
      {
        club: "Wolverhampton Wanderers",
        years: "Current squad",
      },
    ],
    quizHints: [
      "Brazil international goalkeeper who won the Copa América.",
      "Brazilian shot-stopper known for composure and reflex saves at Wolves.",
      "Goalkeeper from Brazil who goes by the single name André.",
    ],`;

const ANDRE_BLOCK_NEW = `    id: "tm-800176",
    name: "André",
    dateOfBirth: "2001-07-16",
    age: 24,
    position: "Midfield - Defensive Midfield",
    teamId: "wolves",
    leagueId: "premier-league",
    nationalTeam: "Brazil",
    nationality: "Brazil",
    importanceScore: 84,
    quickFact: "Brazil defensive midfielder who shields the back line and keeps Wolves ticking with tidy passing after rising at Fluminense.",
    playingStyle: "Disciplined holding midfielder who breaks up play, recycles possession, and covers ground to protect the defence.",
    careerHistory: [
      {
        club: "Wolverhampton Wanderers",
        years: "Current squad",
      },
    ],
    quizHints: [
      "Brazil international midfielder who plays in the Premier League for Wolves.",
      "Defensive midfielder known for screening, interceptions, and calm distribution.",
      "Brazilian midfielder who goes by the single name André.",
    ],`;

let content = fs.readFileSync(SAMPLE_PATH, 'utf8');
let changes = 0;

for (const [from, to] of HINT_REPLACEMENTS) {
  const needle = `"${from}"`;
  const repl = `"${to}"`;
  if (content.includes(needle)) {
    content = content.replace(needle, repl);
    changes += 1;
  }
}

for (const [from, to] of FIELD_REPLACEMENTS) {
  if (from === to) continue;
  if (content.includes(from)) {
    content = content.replace(from, to);
    changes += 1;
  }
}

let rbStyleCount = 0;
const RB_STYLE =
  'Attacking right-back who pushes high, whips in crosses, and recovers quickly to defend one-on-ones.';
content = content.replaceAll(RB_STYLE, (match) => {
  rbStyleCount += 1;
  if (rbStyleCount === 1) return match;
  return RB_STYLE_ALT[rbStyleCount - 2] ?? RB_STYLE_ALT[1];
});
if (rbStyleCount > 1) changes += rbStyleCount - 1;

if (content.includes(ANDRE_BLOCK_OLD)) {
  content = content.replace(ANDRE_BLOCK_OLD, ANDRE_BLOCK_NEW);
  changes += 1;
}

fs.writeFileSync(SAMPLE_PATH, content);
console.log(`Applied ${changes} editorial quality fix groups to sampleData.js`);
