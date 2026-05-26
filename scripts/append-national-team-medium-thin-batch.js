#!/usr/bin/env node
/**
 * Medium-thin live national teams — editorial approvals to reach ~5 quiz-ready.
 * Norway, Ghana, Algeria, Uruguay, Morocco, Senegal, Colombia, Nigeria.
 */

import { DATA_PATHS } from './lib/data-pipeline-paths.js';
import { upsertDraftPlayers } from './lib/upsert-draft-players.js';

const MEDIUM_THIN_BATCH = [
  {
    id: 'tm-238407',
    sourceId: '238407',
    displayName: 'Alexander Sørloth',
    quickFact:
      'Norway striker who scored regularly for Real Sociedad and RB Leipzig before becoming a La Liga forward at Atlético Madrid.',
    quizHints: [
      'Norway centre-forward in red who plays for Atlético Madrid in La Liga.',
      'Tall striker — not Erling Haaland at Manchester City.',
      'Alexander Sørloth known for runs in behind and left-footed finishes.',
    ],
    playingStyle:
      'Mobile striker who attacks channels, holds up play, and finishes with power from inside the box.',
    importanceScore: 86,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-955070',
    sourceId: '955070',
    displayName: 'Ernest Nuamah',
    quickFact:
      'Ghana winger who broke through in Belgium before Lyon and offers direct pace on the right for the Black Stars.',
    quizHints: [
      'Ghana winger in white and red who plays for Lyon in Ligue 1.',
      'Young right-sided attacker — not Mohammed Kudus on the other flank.',
      'Ernest Nuamah known for dribbling and acceleration.',
    ],
    playingStyle:
      'Direct winger who takes on full-backs, cuts inside, and combines speed with aggressive pressing.',
    importanceScore: 82,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-284732',
    sourceId: '284732',
    displayName: 'Ramy Bensebaini',
    quickFact:
      'Algeria left-back who starred at Bordeaux and Borussia Mönchengladbach before Dortmund and remains a Fennecs defensive leader.',
    quizHints: [
      'Algeria defender in green and white who plays for Borussia Dortmund.',
      'Left-sided centre-back or full-back — not Aïssa Mandi at other clubs.',
      'Ramy Bensebaini known for strong tackling and aerial duels.',
    ],
    playingStyle:
      'Physical defender who defends aggressively, steps into midfield, and carries the ball forward when space opens.',
    importanceScore: 85,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-480267',
    sourceId: '480267',
    displayName: 'Ronald Araujo',
    quickFact:
      'Uruguay centre-back who became a Barcelona regular and La Celeste mainstay with pace, power, and recovery defending.',
    quizHints: [
      'Uruguay centre-back in sky blue who plays for FC Barcelona.',
      'Powerful defender — not José María Giménez at Atlético Madrid.',
      'Ronald Araujo known for recovery speed and duels in the channel.',
    ],
    playingStyle:
      'Athletic centre-back who steps out to defend space, wins duels, and plays simple passes from the back.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-361914',
    sourceId: '361914',
    displayName: 'Nayef Aguerd',
    quickFact:
      'Morocco centre-back who moved from the Bundesliga to West Ham and Marseille, anchoring the Atlas Lions with aerial strength.',
    quizHints: [
      'Morocco centre-back in red and green who plays for Marseille in Ligue 1.',
      'Tall defender — not Achraf Hakimi the right-back.',
      'Nayef Aguerd known for headers and long clearances.',
    ],
    playingStyle:
      'Dominant centre-back who wins aerial duels, blocks shots, and distributes calmly from deep.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-126665',
    sourceId: '126665',
    displayName: 'Idrissa Gueye',
    quickFact:
      'Senegal midfielder whose tackling and ball-winning at Everton and PSG made him a Lions of Teranga mainstay for a decade.',
    quizHints: [
      'Senegal holding midfielder in green who plays for Everton in the Premier League.',
      'Ball-winner — not Nicolas Jackson the striker.',
      'Idrissa Gueye known for interceptions and quick recycling passes.',
    ],
    playingStyle:
      'Compact defensive midfielder who presses, tackles, and plays short forward passes under pressure.',
    importanceScore: 86,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-88103',
    sourceId: '88103',
    displayName: 'James Rodríguez',
    quickFact:
      'Colombia playmaker who won the Golden Boot at the 2014 World Cup and later starred in Europe before an MLS chapter with Minnesota United.',
    quizHints: [
      'Colombia no. 10 in yellow who scored six goals at Brazil 2014.',
      'Left-footed playmaker — not Cucho Hernández the striker.',
      'James Rodríguez known for long-range shots and whipped crosses.',
    ],
    playingStyle:
      'Classic attacking midfielder who finds space between lines, shoots from distance, and delivers set-piece quality.',
    importanceScore: 90,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-323831',
    sourceId: '323831',
    displayName: 'Rafael Borré',
    quickFact:
      'Colombia striker who won the Europa League with Eintracht Frankfurt before Brazil’s Serie A and leads the line for Los Cafeteros.',
    quizHints: [
      'Colombia centre-forward in yellow who won Frankfurt’s Europa League.',
      'Stocky striker at Internacional — not James Rodríguez the playmaker.',
      'Rafael Borré known for hold-up play and penalty-box finishing.',
    ],
    playingStyle:
      'Target forward who links lay-offs, presses defenders, and finishes close-range chances with either foot.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-401922',
    sourceId: '401922',
    displayName: 'Samuel Chukwueze',
    quickFact:
      'Nigeria winger whose dribbling at Villarreal earned a move to AC Milan and Fulham, starring for the Super Eagles on the right.',
    quizHints: [
      'Nigeria right winger in green who played for Villarreal in La Liga.',
      'Fast dribbler — not Ademola Lookman on the left.',
      'Samuel Chukwueze known for pace and cutting inside from the wing.',
    ],
    playingStyle:
      'Direct winger who beats defenders one-on-one, attacks the byline, and combines speed with close control.',
    importanceScore: 87,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-607034',
    sourceId: '607034',
    displayName: 'Akor Adams',
    quickFact:
      'Nigeria striker who scored in the Turkish league before Sevilla and offers a mobile centre-forward option for the Super Eagles.',
    quizHints: [
      'Nigeria striker in green who plays for Sevilla in La Liga.',
      'Centre-forward — not Alex Iwobi the playmaker.',
      'Akor Adams known for physical runs and finishing in the box.',
    ],
    playingStyle:
      'Powerful striker who attacks space behind the line, holds off defenders, and finishes with strength.',
    importanceScore: 82,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
];

const result = upsertDraftPlayers({
  draftPath: DATA_PATHS.draftOverlay,
  batch: MEDIUM_THIN_BATCH,
  description:
    'Medium-thin live national-team quiz batch — Norway, Ghana, Algeria, Uruguay, Morocco, Senegal, Colombia, Nigeria (2026-05-26).',
});

console.log(
  `Upserted ${result.upserted} medium-thin national-team quiz players (draft ${result.before} → ${result.after}).`,
);
