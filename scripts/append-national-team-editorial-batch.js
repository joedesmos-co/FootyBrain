#!/usr/bin/env node
/**
 * National team editorial wave 1 — 20 approved players (5 live nations).
 * Upserts into players.generated-draft.json from national-team-editorial-backlog.json IDs.
 */

import { DATA_PATHS } from './lib/data-pipeline-paths.js';
import { upsertDraftPlayers } from './lib/upsert-draft-players.js';

const DRAFT_PATH = DATA_PATHS.draftOverlay;

const NATIONAL_TEAM_BATCH = [
  {
    id: 'tm-348795',
    sourceId: '348795',
    displayName: 'Giovani Lo Celso',
    quickFact:
      'Argentina’s creative midfielder and 2022 World Cup winner who returned to Real Betis after European spells with Spurs and Villarreal.',
    quizHints: [
      'Argentina playmaker in sky-blue who won Qatar 2022 with Messi.',
      'Left-footed no. 20 type at Real Betis — not Lautaro the striker.',
      'Former Tottenham and PSG loanee known for through-balls from midfield.',
    ],
    playingStyle:
      'Left-footed attacking midfielder who drops into space, plays disguised passes, and shoots from the edge of the box.',
    importanceScore: 90,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-321247',
    sourceId: '321247',
    displayName: 'Emiliano Buendía',
    quickFact:
      'Argentina attacking midfielder whose Norwich brilliance earned a Premier League move to Aston Villa and senior Albiceleste caps.',
    quizHints: [
      'Argentina no. 10-style creator at Aston Villa in claret and blue.',
      'Breakout with Norwich in the Championship before the Premier League.',
      'Emiliano with the accent — not Emi Martínez the goalkeeper.',
    ],
    playingStyle:
      'Technical attacking midfielder who drifts inside from the left, combines in tight spaces, and slips through-balls.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-474800',
    sourceId: '474800',
    displayName: 'Facundo Medina',
    quickFact:
      'Argentina centre-back who built his reputation at Lens before Marseille and the 2022 World Cup-winning squad.',
    quizHints: [
      'Argentina defender in blue and white who played at Qatar 2022.',
      'Marseille centre-back — not Leonardo Balerdi his club partner.',
      'Left-sided centre-back who steps into midfield with the ball.',
    ],
    playingStyle:
      'Modern centre-back who defends aggressively, carries forward, and plays line-breaking passes.',
    importanceScore: 85,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-575998',
    sourceId: '575998',
    displayName: 'Leonardo Balerdi',
    quickFact:
      'Argentina centre-back developed at Boca Juniors who became a Marseille regular and World Cup squad defender.',
    quizHints: [
      'Argentina centre-back at Marseille in Ligue 1.',
      'Boca Juniors graduate — not Facundo Medina at the same club.',
      'Right-footed defender who organises the back line in blue and white.',
    ],
    playingStyle:
      'Composed centre-back who reads danger early, tackles cleanly, and distributes short from the back.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-296802',
    sourceId: '296802',
    displayName: 'Walter Benítez',
    quickFact:
      'Argentina goalkeeper with Ligue 1 experience at Nice who joined Crystal Palace as senior Albiceleste cover.',
    quizHints: [
      'Argentina goalkeeper wearing blue and white — not Emi Martínez at Villa.',
      'Former Nice no. 1 before Crystal Palace in the Premier League.',
      'South American shot-stopper known for reflex saves and distribution.',
    ],
    playingStyle:
      'Reactive goalkeeper who stays on his line, spreads on one-v-ones, and plays out with both feet.',
    importanceScore: 80,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-1064871',
    sourceId: '1064871',
    displayName: 'Joaquín Panichelli',
    quickFact:
      'Young Argentina centre-forward in the Strasbourg system who appears in FootyBrain’s linked Albiceleste squad for 2026-cycle depth.',
    quizHints: [
      'Argentina striker prospect at RC Strasbourg in Alsace.',
      'Tall centre-forward in blue and white — not Lautaro at Inter.',
      'Youth-era forward linked to the senior Argentina pool in FootyBrain.',
    ],
    playingStyle:
      'Target-style centre-forward who holds up play, links lay-offs, and attacks crosses in the box.',
    importanceScore: 74,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-344381',
    sourceId: '344381',
    displayName: 'Christopher Nkunku',
    quickFact:
      'France forward who exploded at RB Leipzig before Chelsea and AC Milan, and was part of the 2018 World Cup-winning squad.',
    quizHints: [
      'France attacker who won the World Cup in Russia in 2018.',
      'RB Leipzig goal machine before Premier League and Serie A moves.',
      'Christopher with full name — versatile forward, not a left-back.',
    ],
    playingStyle:
      'Fluid forward who drops between lines, combines quickly, and finishes with both feet in the box.',
    importanceScore: 91,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-640428',
    sourceId: '640428',
    displayName: 'Eduardo Camavinga',
    quickFact:
      'France midfielder who broke through at Rennes as a teenager and became a Real Madrid Champions League regular after Qatar 2022.',
    quizHints: [
      'France midfielder who reached the 2022 World Cup final in Qatar.',
      'Rennes academy graduate in white at Real Madrid.',
      'Left-footed ball-winner who can play full-back or central midfield.',
    ],
    playingStyle:
      'Press-resistant midfielder who tackles aggressively, carries past presses, and recycles possession.',
    importanceScore: 92,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-709726',
    sourceId: '709726',
    displayName: 'Hugo Ekitiké',
    quickFact:
      'France centre-forward who starred for Eintracht Frankfurt and PSG before Liverpool, with Les Bleus senior recognition.',
    quizHints: [
      'France striker in blue kit who moved to Liverpool from Paris.',
      'Tall no. 9 who developed in Germany with Eintracht Frankfurt.',
      'Hugo Ekitiké with accent — not Kylian Mbappé but a fellow French forward.',
    ],
    playingStyle:
      'Powerful centre-forward who runs channels, holds off defenders, and finishes with strength inside the box.',
    importanceScore: 89,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-487969',
    sourceId: '487969',
    displayName: 'Randal Kolo Muani',
    quickFact:
      'France centre-forward whose late 2022 World Cup final appearance and Frankfurt form made him a household Les Bleus name.',
    quizHints: [
      'France striker who came off the bench in the 2022 World Cup final.',
      'Eintracht Frankfurt star before Tottenham in the Premier League.',
      'Use full hyphenated name — tall forward, not Olivier Giroud.',
    ],
    playingStyle:
      'Direct centre-forward who runs in behind, presses from the front, and finishes with pace.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-338424',
    sourceId: '338424',
    displayName: 'Mikel Merino',
    quickFact:
      'Spain midfielder who drove La Roja’s Euro 2024 triumph and joined Arsenal after years as a Real Sociedad mainstay.',
    quizHints: [
      'Spain midfielder who won Euro 2024 in Germany.',
      'Former Real Sociedad captain before Arsenal in red and white.',
      'Mikel Merino — not Mikel from other nations; box-to-box energy.',
    ],
    playingStyle:
      'Box-to-box midfielder who presses intensely, wins aerial duels, and arrives late in the penalty area.',
    importanceScore: 90,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-350219',
    sourceId: '350219',
    displayName: 'Fabián Ruiz',
    quickFact:
      'Spain central midfielder who won the 2024 European Championship with La Roja and stars for Paris Saint-Germain.',
    quizHints: [
      'Spain midfielder in red who won Euro 2024.',
      'PSG passer in Ligue 1 — former Napoli playmaker.',
      'Left-footed metronome — not Fabían the Brazil-born forward at Betis.',
    ],
    playingStyle:
      'Elegant central midfielder who dictates tempo, switches play, and finds half-space passes.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-351809',
    sourceId: '351809',
    displayName: 'Robin Le Normand',
    quickFact:
      'Spain centre-back born in France who became a La Roja Euro 2024 starter after establishing himself at Real Sociedad and Atlético Madrid.',
    quizHints: [
      'Spain centre-back in red who won Euro 2024.',
      'Former Real Sociedad pillar now at Atlético Madrid.',
      'Robin Le Normand — France-born but plays for La Roja.',
    ],
    playingStyle:
      'Physical centre-back who defends the box, wins duels, and plays simple passes to midfield.',
    importanceScore: 87,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-85288',
    sourceId: '85288',
    displayName: 'Isco',
    quickFact:
      'Spain’s silky playmaker and 2010 World Cup winner who lit up Real Madrid before a Betis renaissance in La Liga.',
    quizHints: [
      'Spain magician who won the 2010 World Cup in South Africa.',
      'Real Madrid academy star known for close control and left foot.',
      'Mononym Isco at Real Betis — not Iniesta but same golden generation era.',
    ],
    playingStyle:
      'Creative attacking midfielder who dribbles in tight spaces, plays one-twos, and shoots from range.',
    importanceScore: 86,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-412363',
    sourceId: '412363',
    displayName: 'Rodrygo',
    quickFact:
      'Brazil winger who scored in a Champions League final for Real Madrid and starred for the Seleção at the 2022 World Cup.',
    quizHints: [
      'Brazil right winger in yellow who played at Qatar 2022.',
      'Real Madrid in white — Santos academy graduate.',
      'Rodrygo the Brazilian — not Spanish Rodrigo Mendoza.',
    ],
    playingStyle:
      'Direct winger who attacks full-backs, cuts inside to shoot, and combines quickly in the final third.',
    importanceScore: 91,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-401530',
    sourceId: '401530',
    displayName: 'Éder Militão',
    quickFact:
      'Brazil centre-back who won the 2019 Copa América and became Real Madrid’s defensive leader after Porto.',
    quizHints: [
      'Brazil centre-back in yellow who won Copa América 2019.',
      'Real Madrid no. 3 in white after Porto in Portugal.',
      'Éder Militão — pacey defender, not Thiago Silva the veteran.',
    ],
    playingStyle:
      'Quick centre-back who defends space behind, steps up to intercept, and plays vertical passes.',
    importanceScore: 90,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-378710',
    sourceId: '378710',
    displayName: 'Richarlison',
    quickFact:
      'Brazil striker famous for his 2022 World Cup goals and acrobatic celebration while starring for Everton and Tottenham.',
    quizHints: [
      'Brazil no. 9 who scored at the 2022 World Cup in Qatar.',
      'Tottenham striker in navy — former Everton fan favourite.',
      'Known for header celebrations and physical centre-forward play.',
    ],
    playingStyle:
      'Mobile centre-forward who presses, runs channels, and finishes with headers and sharp shots.',
    importanceScore: 89,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-479999',
    sourceId: '479999',
    displayName: 'Eberechi Eze',
    quickFact:
      'England playmaker whose Crystal Palace brilliance earned a big Arsenal move and a place in the Euro 2024 squad.',
    quizHints: [
      'England attacking midfielder who went to Euro 2024.',
      'Arsenal in red after starring for Crystal Palace in south London.',
      'Eberechi Eze — left-footed creator, not Bukayo Saka the winger.',
    ],
    playingStyle:
      'Silky attacking midfielder who dribbles inside, shoots from distance, and unlocks defences with through-balls.',
    importanceScore: 89,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-488362',
    sourceId: '488362',
    displayName: 'Conor Gallagher',
    quickFact:
      'England box-to-box midfielder who captained Chelsea on loan spells before Tottenham and the 2022 World Cup squad.',
    quizHints: [
      'England midfielder in white who was in Qatar 2022.',
      'Chelsea academy graduate now at Tottenham in navy.',
      'High-energy no. 8 — not Declan Rice the deeper holder.',
    ],
    playingStyle:
      'Relentless central midfielder who presses, carries into the final third, and shoots from edge of the box.',
    importanceScore: 86,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-433188',
    sourceId: '433188',
    displayName: 'Curtis Jones',
    quickFact:
      'England midfielder and Liverpool academy graduate who broke through at Anfield and earned Three Lions caps.',
    quizHints: [
      'England midfielder from Liverpool’s academy in red.',
      'Scouse-born ball-carrier — not Trent Alexander-Arnold the right-back.',
      'Technical left-footer who links midfield and attack for club and country.',
    ],
    playingStyle:
      'Rhythmic central midfielder who carries past lines, combines in tight spaces, and shoots when the lane opens.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
];

const WAVE1_IDS = new Set(NATIONAL_TEAM_BATCH.map((p) => p.id));

function main() {
  const { before, after, upserted } = upsertDraftPlayers({
    draftPath: DRAFT_PATH,
    batch: NATIONAL_TEAM_BATCH,
    description:
      'Approved editorial overlay (Europe phases 1–3 + MLS wave 1 + national team wave 1 — 20 NT-focused stars).',
  });
  console.log(
    `National team wave 1: upserted ${upserted} players (${after} total, was ${before}). IDs: ${[...WAVE1_IDS].join(', ')}`,
  );
}

main();
