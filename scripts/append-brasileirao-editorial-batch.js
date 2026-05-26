#!/usr/bin/env node
/**
 * Brasileirão editorial wave 1 — 20 approved players (Flamengo, Palmeiras, Corinthians, São Paulo, Santos).
 * Upserts into players.generated-draft.json; retires prior wave-1 IDs outside this set.
 */

import { DATA_PATHS } from './lib/data-pipeline-paths.js';
import { upsertDraftPlayers } from './lib/upsert-draft-players.js';

const DRAFT_PATH = DATA_PATHS.draftOverlay;

/** Prior wave-1 stars at non-priority clubs or swapped out of wave 1. */
const RETIRED_WAVE1_IDS = [
  'tm-135057',
  'tm-80562',
  'tm-330085',
  'tm-69400',
  'tm-52769',
  'tm-255755',
  'tm-808509',
];

const BRA_BATCH = [
  {
    id: 'tm-248410',
    sourceId: '248410',
    displayName: 'Giorgian de Arrascaeta',
    quickFact:
      'Uruguay playmaker and Flamengo fan favourite — creativity, set pieces, and Libertadores nights at the Maracanã.',
    quizHints: [
      'Uruguay international in red and black for Flamengo.',
      'Creative number 10 with left-footed passes and Copa Libertadores pedigree.',
      'Giorgian de Arrascaeta — not the Colombian striker with a similar first name.',
    ],
    playingStyle:
      'Technical number 10 who drifts between lines, delivers through-balls, and shoots with curl from distance.',
    importanceScore: 90,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-444523',
    sourceId: '444523',
    displayName: 'Lucas Paquetá',
    quickFact:
      'Brazil midfielder and 2022 World Cup squad member who returned to Flamengo after Lyon and West Ham.',
    quizHints: [
      'Brazil international midfielder in Flamengo red and black.',
      'Box-to-box flair player known for skill, physical duels, and cards.',
      'Lucas Paquetá at Flamengo — surname Paquetá in hints.',
    ],
    playingStyle:
      'Box-to-box midfielder who carries the ball, links play, and mixes skill with aggressive pressing.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-432895',
    sourceId: '432895',
    displayName: 'Pedro',
    quickFact:
      'Brazil striker with Chelsea and Roma medals who leads the line for Flamengo with movement and composure.',
    quizHints: [
      'Former Chelsea and Roma centre-forward at Flamengo.',
      'Brazil no. 9 type who links play and finishes in the box.',
      'Flamengo striker Pedro — not Pedri of Barcelona or Pedro Neto.',
    ],
    playingStyle:
      'Intelligent centre-forward who drops to combine, attacks space behind defenders, and finishes calmly.',
    importanceScore: 86,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-353108',
    sourceId: '353108',
    displayName: 'Bruno Henrique',
    quickFact:
      'Brazil winger who starred in Flamengo’s 2019 Libertadores run with pace, goals, and big-match mentality.',
    quizHints: [
      'Brazil international winger famous for Flamengo’s 2019 Copa Libertadores triumph.',
      'Right-sided attacker in red and black known for speed and finishing.',
      'Bruno Henrique at Flamengo — full name disambiguates from other Brunos in Brazil.',
    ],
    playingStyle:
      'Direct winger who attacks full-backs, cuts inside to shoot, and thrives in transition.',
    importanceScore: 87,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-215390',
    sourceId: '215390',
    displayName: 'Gustavo Gómez',
    quickFact:
      'Paraguay centre-back and Palmeiras captain who anchors title and Libertadores defences in green and white.',
    quizHints: [
      'Paraguay international who captains Palmeiras.',
      'Tall centre-back known for headers, leadership, and aerial duels.',
      'Gustavo Gómez at Palmeiras — not Facundo Medina of Marseille.',
    ],
    playingStyle:
      'Commanding centre-back who wins aerial duels, steps out to intercept, and organises the line.',
    importanceScore: 85,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-943837',
    sourceId: '943837',
    displayName: 'Vitor Roque',
    quickFact:
      'Brazil forward who broke through at Palmeiras before a high-profile move toward European football.',
    quizHints: [
      'Young Brazil striker who developed at Palmeiras.',
      'Centre-forward linked with Barcelona in the early 2020s.',
      'Vitor Roque — first name Vitor, surname Roque, at Palmeiras.',
    ],
    playingStyle:
      'Pacey forward who attacks channels, presses defenders, and finishes quickly in the box.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-203394',
    sourceId: '203394',
    displayName: 'Andreas Pereira',
    quickFact:
      'Brazil midfielder with Manchester United academy roots who became a creative outlet for Palmeiras in Série A.',
    quizHints: [
      'Brazil playmaker who came through Manchester United before Palmeiras.',
      'Left-footed midfielder known for shots and set-piece delivery.',
      'Andreas Pereira at Palmeiras — not Andreas from other Brazilian clubs.',
    ],
    playingStyle:
      'Creative midfielder who shoots from distance, switches play, and combines in the final third.',
    importanceScore: 83,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-159372',
    sourceId: '159372',
    displayName: 'Felipe Anderson',
    quickFact:
      'Brazil winger who starred for Lazio in Serie A before returning to Palmeiras with dribbling and engine on the right.',
    quizHints: [
      'Brazil international winger who played for Lazio over many seasons.',
      'Experienced wide player in Palmeiras green and white.',
      'Felipe Anderson — full name avoids generic “Anderson” quiz clashes.',
    ],
    playingStyle:
      'Direct winger who dribbles, crosses, and tracks back to help the full-back.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-167850',
    sourceId: '167850',
    displayName: 'Memphis Depay',
    quickFact:
      'Netherlands forward whose skill and star power made him a marquee Corinthians signing in Série A.',
    quizHints: [
      'Netherlands international forward who played for Lyon and Barcelona.',
      'Corinthians star in black and white with flair and a strong left foot.',
      'Memphis Depay — first name Memphis, not Dutch keeper names.',
    ],
    playingStyle:
      'Direct forward who dribbles from wide areas, shoots with power, and links with physical presence.',
    importanceScore: 87,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-489893',
    sourceId: '489893',
    displayName: 'Yuri Alberto',
    quickFact:
      'Brazil striker and reliable Corinthians goal threat after developing at Internacional and other Série A sides.',
    quizHints: [
      'Brazil centre-forward in Corinthians black and white.',
      'Mobile striker known for runs in behind and box movement.',
      'Yuri Alberto — full name, not Yuri of other clubs.',
    ],
    playingStyle:
      'Centre-forward who attacks space, holds up when needed, and finishes with either foot.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-208681',
    sourceId: '208681',
    displayName: 'Gustavo Henrique',
    quickFact:
      'Brazil centre-back who captained Corinthians with aerial strength and leadership in the heart of defence.',
    quizHints: [
      'Brazil centre-back in Corinthians black and white.',
      'Tall defender known for headers and organising the back line.',
      'Gustavo Henrique — not Gustavo Gómez of Palmeiras.',
    ],
    playingStyle:
      'Physical centre-back who defends the box, wins duels, and plays simple passes out from the back.',
    importanceScore: 82,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-594226',
    sourceId: '594226',
    displayName: 'Matheuzinho',
    quickFact:
      'Brazil right-back known for overlapping runs and delivery from wide areas at Corinthians.',
    quizHints: [
      'Brazil full-back who attacks down the right for Corinthians.',
      'Overlapping defender known for pace and crosses.',
      'Matheuzinho at Corinthians — one-word Brazilian full-back name.',
    ],
    playingStyle:
      'Attacking full-back who overlaps, delivers driven crosses, and recovers with pace.',
    importanceScore: 80,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-284727',
    sourceId: '284727',
    displayName: 'Jonathan Calleri',
    quickFact:
      'Argentina striker famous for a Boca Libertadores explosion who became São Paulo’s penalty-box finisher.',
    quizHints: [
      'Argentina centre-forward who scored heavily for Boca Juniors.',
      'São Paulo striker in white, red, and black known for poaching.',
      'Jonathan Calleri — full hyphenated surname at São Paulo.',
    ],
    playingStyle:
      'Classic number 9 who attacks crosses, finishes inside the six-yard box, and holds up play.',
    importanceScore: 85,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-223560',
    sourceId: '223560',
    displayName: 'Luciano',
    quickFact:
      'Brazil forward who scored consistently for São Paulo with movement, finishing, and versatility up front.',
    quizHints: [
      'Brazil attacker who starred for São Paulo in the Tricolor.',
      'Forward who can play wide or through the middle.',
      'São Paulo striker Luciano — not Luciano Acosta of MLS.',
    ],
    playingStyle:
      'Mobile forward who drifts wide, combines quickly, and finishes with sharp movement in the box.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-468301',
    sourceId: '468301',
    displayName: 'Marcos Antônio',
    quickFact:
      'Brazil midfielder who brings energy, passing, and Liga MX experience to São Paulo’s midfield.',
    quizHints: [
      'Brazil central midfielder in São Paulo white, red, and black.',
      'Box-to-box player known for carrying and combining in midfield.',
      'Marcos Antônio — full name with accent, not Marcos of other teams.',
    ],
    playingStyle:
      'Energetic midfielder who presses, carries past lines, and plays vertical passes.',
    importanceScore: 81,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-68097',
    sourceId: '68097',
    displayName: 'Rafael',
    quickFact:
      'Experienced Brazil goalkeeper who won titles with Atlético Mineiro and became a São Paulo senior stopper.',
    quizHints: [
      'Brazil goalkeeper in São Paulo kit — not Rafael of Spain at club level here.',
      'Veteran keeper known for reflex saves and big-club experience.',
      'São Paulo goalkeeper Rafael — one name, club context in hints.',
    ],
    playingStyle:
      'Composed goalkeeper who saves one-on-ones, commands the area, and distributes with both feet.',
    importanceScore: 82,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-68290',
    sourceId: '68290',
    displayName: 'Neymar',
    quickFact:
      'Brazil icon who developed at Santos before global stardom and a homecoming to the club in this dataset.',
    quizHints: [
      'Brazil’s generational no. 10 who won Olympic gold in 2016.',
      'Santos academy graduate famous for skill, flair, and samba style.',
      'Neymar at Santos in FootyBrain — not Neymar’s PSG era club in hints.',
    ],
    playingStyle:
      'Skillful forward who dribbles from deep, draws fouls, and creates with flair and vision.',
    importanceScore: 95,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-244275',
    sourceId: '244275',
    displayName: 'Gabriel Barbosa',
    quickFact:
      'Brazil forward nicknamed Gabigol who won Libertadores titles with Flamengo after rising through Santos.',
    quizHints: [
      'Brazil striker nicknamed Gabigol with Santos and Flamengo success.',
      'Santos product known for poaching and big-game goals.',
      'Gabriel Barbosa at Santos — nickname Gabigol in hints, not Gabriel from Arsenal.',
    ],
    playingStyle:
      'Poacher who finds space in the box, finishes first-time, and thrives on through-balls.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-225432',
    sourceId: '225432',
    displayName: 'Zé Rafael',
    quickFact:
      'Brazil midfielder who became a Santos engine with tackling, carrying, and Série A experience.',
    quizHints: [
      'Brazil international midfielder in Santos white.',
      'Box-to-box player known for energy and ball-winning.',
      'Zé Rafael at Santos — not Rafael the São Paulo goalkeeper.',
    ],
    playingStyle:
      'Hard-working midfielder who presses, recovers possession, and progresses with simple passing.',
    importanceScore: 82,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-371009',
    sourceId: '371009',
    displayName: 'Rony',
    quickFact:
      'Brazil winger who won trophies with Palmeiras and became a direct, pacey outlet for Santos.',
    quizHints: [
      'Brazil winger known for speed and dribbling at Santos.',
      'Former Palmeiras attacker with a powerful left foot.',
      'Rony at Santos — one-name winger, not Rony of other leagues without club context.',
    ],
    playingStyle:
      'Direct winger who drives at defenders, cuts inside to shoot, and presses aggressively.',
    importanceScore: 83,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
];

function main() {
  const { before, after } = upsertDraftPlayers({
    draftPath: DRAFT_PATH,
    batch: BRA_BATCH,
    retiredIds: RETIRED_WAVE1_IDS,
    description:
      'Approved editorial overlay (Europe 1–3, MLS wave 1, Brasileirão wave 1 — 20 Série A stars at five major clubs).',
  });

  const byClub = {
    flamengo: 4,
    palmeiras: 4,
    corinthians: 4,
    'sao-paulo': 4,
    santos: 4,
  };
  console.log(
    `Brasileirão wave 1: upserted ${BRA_BATCH.length} players (${after} total, was ${before}).`,
  );
  console.log('Per club:', JSON.stringify(byClub));
}

main();
