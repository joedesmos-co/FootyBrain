#!/usr/bin/env node
/**
 * National team thin-pool editorial — Wave 3 + sub-gate live nations.
 * Upserts quiz-ready approvals into players.generated-draft.json.
 * Run: node scripts/append-national-team-thin-quiz-batch.js
 * Then: npm run build:app-ready-preview && npm run merge:phase3-sample
 */

import { DATA_PATHS } from './lib/data-pipeline-paths.js';
import { upsertDraftPlayers } from './lib/upsert-draft-players.js';

const THIN_NATIONAL_QUIZ_BATCH = [
  // Poland (+2 → 5)
  {
    id: 'tm-181136',
    sourceId: '181136',
    displayName: 'Piotr Zielinski',
    quickFact:
      'Poland midfielder who won Serie A with Napoli before Inter Milan and remains a creative hub for the Biało-czerwoni.',
    quizHints: [
      'Poland playmaker in white and red who starred for Napoli in Serie A.',
      'Inter Milan midfielder — not Robert Lewandowski the striker.',
      'Left-footed no. 10 type known for late runs into the box.',
    ],
    playingStyle:
      'Box-to-box midfielder who arrives late, shoots from distance, and threads passes between lines.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-44058',
    sourceId: '44058',
    displayName: 'Wojciech Szczesny',
    quickFact:
      'Poland goalkeeper with long spells at Arsenal and Juventus who returned to Barcelona as senior national-team cover.',
    quizHints: [
      'Poland goalkeeper in white and red — not Kamil Grabara at Bournemouth.',
      'Former Juventus and Arsenal no. 1 before Barcelona.',
      'Tall shot-stopper named Wojciech with the diacritic on the c.',
    ],
    playingStyle:
      'Traditional goalkeeper who commands the box, spreads on one-v-ones, and distributes with either foot.',
    importanceScore: 86,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  // Austria (+2 → 5)
  {
    id: 'tm-59016',
    sourceId: '59016',
    displayName: 'David Alaba',
    quickFact:
      'Austria’s most capped star: a Bayern Munich and Real Madrid treble-winner who has played left-back and centre-back for Das Team.',
    quizHints: [
      'Austria captain in white kit who won the Champions League with Real Madrid.',
      'Bayern Munich academy graduate — versatile defender, not a striker.',
      'David who can play left-back or centre-back for Austria.',
    ],
    playingStyle:
      'Calm defender who steps into midfield, plays line-breaking passes, and organises the back line.',
    importanceScore: 92,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-106987',
    sourceId: '106987',
    displayName: 'Marcel Sabitzer',
    quickFact:
      'Austria midfielder who captained RB Leipzig pressing sides and moved through Bayern Munich and Borussia Dortmund in the Bundesliga.',
    quizHints: [
      'Austria midfielder in white and red with RB Leipzig pedigree.',
      'Borussia Dortmund central player — not David Alaba the defender.',
      'Marcel who shoots from the edge of the box for Austria.',
    ],
    playingStyle:
      'Energetic central midfielder who presses high, arrives in the box, and strikes from distance.',
    importanceScore: 87,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  // Ukraine (+2 → 5)
  {
    id: 'tm-203853',
    sourceId: '203853',
    displayName: 'Oleksandr Zinchenko',
    quickFact:
      'Ukraine left-back who won the Premier League with Manchester City before Ajax and remains a technical outlet for the national team.',
    quizHints: [
      'Ukraine left-back in yellow and blue who played for Manchester City.',
      'Ajax full-back — not Artem Dovbyk the striker.',
      'Oleksandr who tucks inside from left-back to help build play.',
    ],
    playingStyle:
      'Inverted left-back who combines in midfield, crosses early, and defends aggressively in duels.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-537860',
    sourceId: '537860',
    displayName: 'Mykhaylo Mudryk',
    quickFact:
      'Ukraine winger whose explosive dribbling at Shakhtar earned a Chelsea move and senior national-team starts on the left flank.',
    quizHints: [
      'Ukraine winger in yellow and blue who plays for Chelsea.',
      'Fast left-sided attacker — not Vitaliy Mykolenko the left-back.',
      'Mykhaylo known for direct runs and pace on the wing.',
    ],
    playingStyle:
      'Direct winger who attacks space, cuts inside to shoot, and presses triggers from the front.',
    importanceScore: 85,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  // Scotland (+2 → 5)
  {
    id: 'tm-234803',
    sourceId: '234803',
    displayName: 'Andrew Robertson',
    quickFact:
      'Scotland left-back and Liverpool captain who sets the tempo with overlapping runs and crosses for the Tartan Army.',
    quizHints: [
      'Scotland left-back in dark blue who captains Liverpool.',
      'Overlapping full-back — not Ryan Porteous the centre-back.',
      'Andrew from Glasgow who delivers driven crosses from the left.',
    ],
    playingStyle:
      'Relentless left-back who overlaps, whips in early crosses, and defends with aggressive duels.',
    importanceScore: 90,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-315969',
    sourceId: '315969',
    displayName: 'Scott McTominay',
    quickFact:
      'Scotland midfielder who became a goal threat at Napoli after Manchester United, adding aerial power to the national midfield.',
    quizHints: [
      'Scotland midfielder in dark blue who left Manchester United for Napoli.',
      'Tall box-to-box player — not Billy Gilmour the deeper no. 6.',
      'Scott with a Scottish surname who arrives late in the box.',
    ],
    playingStyle:
      'Physical midfielder who carries forward, wins aerial duels, and finishes from late runs.',
    importanceScore: 87,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  // Paraguay (+2 → 5)
  {
    id: 'tm-272999',
    sourceId: '272999',
    displayName: 'Miguel Almirón',
    quickFact:
      'Paraguay winger whose pace and direct running made him an Atlanta United star before Premier League spells with Newcastle.',
    quizHints: [
      'Paraguay winger in red, white, and blue with MLS and Premier League experience.',
      'Atlanta United legend — not Gustavo Gómez the centre-back captain.',
      'Miguel who attacks from the right with quick feet.',
    ],
    playingStyle:
      'Direct winger who drives inside, shoots from the right channel, and presses aggressively.',
    importanceScore: 86,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-323872',
    sourceId: '323872',
    displayName: 'Andrés Cubas',
    quickFact:
      'Paraguay defensive midfielder who anchors MLS sides Vancouver and previously Buenos Aires clubs with tough tackling for La Albirroja.',
    quizHints: [
      'Paraguay holding midfielder in red, white, and blue at Vancouver Whitecaps.',
      'Deep no. 6 — not Matías Galarza the younger midfielder.',
      'Andrés who shields the back line and wins second balls.',
    ],
    playingStyle:
      'Compact defensive midfielder who tackles hard, protects centre-backs, and plays simple forward passes.',
    importanceScore: 82,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  // Serbia (+5 → 5)
  {
    id: 'tm-357498',
    sourceId: '357498',
    displayName: 'Dušan Vlahović',
    quickFact:
      'Serbia centre-forward who broke through at Fiorentina before Juventus and leads the line for the Orlovi with powerful finishing.',
    quizHints: [
      'Serbia striker in red kit who plays for Juventus.',
      'Tall centre-forward — not Filip Kostić on the left wing.',
      'Dušan who finishes with power inside the penalty area.',
    ],
    playingStyle:
      'Target striker who holds up play, attacks crosses, and finishes with strength and placement.',
    importanceScore: 90,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-161011',
    sourceId: '161011',
    displayName: 'Filip Kostić',
    quickFact:
      'Serbia left winger whose crossing and work rate at Eintracht Frankfurt and Juventus made him a staple wide outlet for the Orlovi.',
    quizHints: [
      'Serbia left-sided player in red who crossed for Frankfurt in the Europa League.',
      'Juventus wide midfielder — not Dušan Vlahović the striker.',
      'Filip who delivers whipped crosses from the left.',
    ],
    playingStyle:
      'Direct winger who hugs the touchline, crosses early, and presses with high intensity.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-574671',
    sourceId: '574671',
    displayName: 'Strahinja Pavlović',
    quickFact:
      'Serbia centre-back who moved from Red Bull Salzburg to AC Milan and brings aerial dominance to the Orlovi back line.',
    quizHints: [
      'Serbia centre-back in red who plays for AC Milan.',
      'Tall defender from Salzburg — not Strahinja Tanasijević in MLS.',
      'Strahinja at Milan who wins headers and steps into midfield.',
    ],
    playingStyle:
      'Physical centre-back who defends the box, wins aerial duels, and carries the ball out calmly.',
    importanceScore: 85,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-257474',
    sourceId: '257474',
    displayName: 'Vanja Milinković-Savić',
    quickFact:
      'Serbia goalkeeper who starred at Torino before Napoli and backs up the national team with strong shot-stopping.',
    quizHints: [
      'Serbia goalkeeper in red kit who joined Napoli from Torino.',
      'Tall Serb keeper with a long double surname — not a centre-back.',
      'Vanja who spreads well and commands crosses in the box.',
    ],
    playingStyle:
      'Reactive goalkeeper with strong reflexes who organises the defence and plays out when safe.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-74294',
    sourceId: '74294',
    displayName: 'Nemanja Gudelj',
    quickFact:
      'Serbia defensive midfielder and Sevilla captain who provides experience and tackling in front of the Orlovi back line.',
    quizHints: [
      'Serbia holding midfielder in red who captains Sevilla in La Liga.',
      'Experienced no. 6 — not Saša Lukić at Fulham.',
      'Nemanja who breaks up play and recycles possession.',
    ],
    playingStyle:
      'Disciplined defensive midfielder who tackles cleanly, shields defenders, and plays safe passes.',
    importanceScore: 83,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  // Mexico (+4 → 5)
  {
    id: 'tm-552955',
    sourceId: '552955',
    displayName: 'Santiago Giménez',
    quickFact:
      'Mexico centre-forward who scored heavily for Feyenoord before AC Milan and leads El Tri’s line with movement in the box.',
    quizHints: [
      'Mexico striker in green who moved to AC Milan from the Netherlands.',
      'Feyenoord goal scorer — not Raúl Jiménez the veteran forward.',
      'Santiago who finishes with headers and sharp near-post runs.',
    ],
    playingStyle:
      'Mobile striker who attacks the penalty spot, presses defenders, and finishes with either foot.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-316889',
    sourceId: '316889',
    displayName: 'Hirving Lozano',
    quickFact:
      'Mexico winger whose pace at Pachuca and PSV earned a Napoli move; “Chucky” remains a direct outlet for El Tri on the left.',
    quizHints: [
      'Mexico winger in green known as Chucky with Napoli pedigree.',
      'Fast left-sided attacker — not Hirving at PSV only; now San Diego FC in FootyBrain.',
      'Hirving who cuts inside from the wing to shoot.',
    ],
    playingStyle:
      'Explosive winger who drives at full-backs, cuts inside, and combines quick feet with direct running.',
    importanceScore: 87,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-122043',
    sourceId: '122043',
    displayName: 'Héctor Herrera',
    quickFact:
      'Mexico midfielder who captained Porto and Atlético Madrid before MLS and brings calm possession to El Tri’s midfield.',
    quizHints: [
      'Mexico midfielder in green with Porto and Atlético Madrid experience.',
      'Veteran passer — not Jonathan González the younger MLS midfielder.',
      'Héctor who controls tempo from central midfield.',
    ],
    playingStyle:
      'Deep-lying midfielder who circulates possession, switches play, and tackles selectively.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-261503',
    sourceId: '261503',
    displayName: 'Álvaro Fidalgo',
    quickFact:
      'Mexico attacking midfielder who starred in Liga MX before Real Betis and offers creative link play for El Tri.',
    quizHints: [
      'Mexico playmaker in green who moved to Real Betis from Liga MX.',
      'Creative no. 10 type — not Héctor Herrera the deeper midfielder.',
      'Álvaro who slides passes between defensive lines.',
    ],
    playingStyle:
      'Technical attacking midfielder who receives between lines, turns under pressure, and plays final balls.',
    importanceScore: 83,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  // Chile (+4 → 5)
  {
    id: 'tm-385105',
    sourceId: '385105',
    displayName: 'Gabriel Suazo',
    quickFact:
      'Chile left-back who developed at Colo-Colo before Toulouse and Sevilla, supplying width for La Roja.',
    quizHints: [
      'Chile left-back in red kit who plays for Sevilla.',
      'Overlapping defender — not Alexis Sánchez the forward.',
      'Gabriel who motors up and down the left flank.',
    ],
    playingStyle:
      'Attacking full-back who overlaps, delivers cut-backs, and recovers with energetic sprints.',
    importanceScore: 85,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-215616',
    sourceId: '215616',
    displayName: 'Erick Pulgar',
    quickFact:
      'Chile defensive midfielder who captained Universidad de Chile before Fiorentina and Flamengo, anchoring La Roja in the middle.',
    quizHints: [
      'Chile holding midfielder in red who played for Fiorentina in Serie A.',
      'Flamengo anchor — not Felipe Mora the forward.',
      'Erick who sits deep and breaks up opposition attacks.',
    ],
    playingStyle:
      'Screening midfielder who tackles, intercepts, and distributes short to maintain shape.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-340840',
    sourceId: '340840',
    displayName: 'Benjamín Kuscevic',
    quickFact:
      'Chile centre-back with Colo-Colo roots who moved through Europe to Toronto FC and defends solidly for La Roja.',
    quizHints: [
      'Chile centre-back in red who plays for Toronto FC in MLS.',
      'Colo-Colo graduate — not Gabriel Suazo the left-back.',
      'Benjamín who wins headers and blocks shots centrally.',
    ],
    playingStyle:
      'No-nonsense centre-back who defends the box, clears danger, and plays simple passes out.',
    importanceScore: 82,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-176927',
    sourceId: '176927',
    displayName: 'Felipe Mora',
    quickFact:
      'Chile striker who scored in Liga MX and MLS with Portland Timbers before becoming a squad forward option for La Roja.',
    quizHints: [
      'Chile forward in red who played for Portland Timbers in MLS.',
      'Striker — not Erick Pulgar the defensive midfielder.',
      'Felipe who attacks the box with movement off the shoulder.',
    ],
    playingStyle:
      'Centre-forward who finds space in the box, links lay-offs, and finishes close-range chances.',
    importanceScore: 80,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  // Turkey (+3 → 5)
  {
    id: 'tm-861410',
    sourceId: '861410',
    displayName: 'Arda Güler',
    quickFact:
      'Turkey attacking midfielder whose talent at Fenerbahçe earned a Real Madrid move and senior Ay-Yıldızlı playmaking duties.',
    quizHints: [
      'Turkey playmaker in red and white who plays for Real Madrid.',
      'Young left-footed creator — not Hakan Çalhanoğlu the veteran.',
      'Arda who curls shots and slips through-balls.',
    ],
    playingStyle:
      'Technical no. 10 who drifts between lines, shoots from distance, and plays disguised passes.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-369316',
    sourceId: '369316',
    displayName: 'Ferdi Kadıoğlu',
    quickFact:
      'Turkey left-back who broke through at Fenerbahçe before Brighton and offers overlapping width for the national team.',
    quizHints: [
      'Turkey left-back in red and white who plays for Brighton.',
      'Fenerbahçe graduate — not Zeki Çelik on the right.',
      'Ferdi who attacks the left channel with pace.',
    ],
    playingStyle:
      'Modern full-back who overlaps, inverts when needed, and defends with quick recovery runs.',
    importanceScore: 85,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-251075',
    sourceId: '251075',
    displayName: 'Zeki Çelik',
    quickFact:
      'Turkey right-back who starred at Lille before Roma and provides defensive reliability and crossing for Ay Yıldız.',
    quizHints: [
      'Turkey right-back in red and white who plays for Roma.',
      'Lille and Roma full-back — not Ferdi Kadıoğlu on the left.',
      'Zeki who defends aggressively and delivers cut-backs.',
    ],
    playingStyle:
      'Defensive full-back who tackles firmly, supports attacks, and crosses from deep positions.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  // South Korea (+3 → 5)
  {
    id: 'tm-91845',
    sourceId: '91845',
    displayName: 'Heung-min Son',
    quickFact:
      'South Korea captain whose goals at Tottenham made him Asia’s most recognisable Premier League star before a move to MLS with Los Angeles FC.',
    quizHints: [
      'South Korea captain in red who plays for Los Angeles FC in MLS.',
      'Left-footed forward — not Kang-in Lee the creative midfielder.',
      'Heung-min Son known for cut-ins from the left to shoot.',
    ],
    playingStyle:
      'Inside forward who attacks space behind the defence, combines quickly, and finishes with both feet.',
    importanceScore: 92,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-503482',
    sourceId: '503482',
    displayName: 'Min-jae Kim',
    quickFact:
      'South Korea centre-back who won the Bundesliga with Bayern Munich after Napoli and anchors the Taegeuk Warriors defensively.',
    quizHints: [
      'South Korea centre-back in red who plays for Bayern Munich.',
      'Napoli and Bayern defender — not Kee-hee Kim in MLS.',
      'Min-jae who steps out and plays line-breaking passes.',
    ],
    playingStyle:
      'Dominant centre-back who wins duels, carries forward, and reads danger early.',
    importanceScore: 90,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-638571',
    sourceId: '638571',
    displayName: 'Sang-bin Jeong',
    quickFact:
      'South Korea forward who moved from Wolverhampton to MLS with St. Louis City and offers pace off the bench for the national team.',
    quizHints: [
      'South Korea attacker in red who plays for St. Louis City in MLS.',
      'Young forward — not Heung-min Son at Tottenham.',
      'Sang-bin who runs in behind with pace.',
    ],
    playingStyle:
      'Direct forward who attacks channels, presses defenders, and finishes on the break.',
    importanceScore: 78,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
];

const result = upsertDraftPlayers({
  draftPath: DATA_PATHS.draftOverlay,
  batch: THIN_NATIONAL_QUIZ_BATCH,
  description:
    'Thin live national-team quiz batch — Poland, Austria, Ukraine, Scotland, Paraguay, Serbia, Mexico, Chile, Turkey, South Korea (2026-05-26).',
});

console.log(
  `Upserted ${result.upserted} thin national-team quiz players (draft ${result.before} → ${result.after}).`,
);
