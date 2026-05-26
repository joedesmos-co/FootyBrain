#!/usr/bin/env node
/**
 * MLS editorial wave 1 — 20 approved players (priority clubs only).
 * Upserts into players.generated-draft.json; removes prior wave-1 IDs not in this set.
 */

import { DATA_PATHS } from './lib/data-pipeline-paths.js';
import { upsertDraftPlayers } from './lib/upsert-draft-players.js';

const DRAFT_PATH = DATA_PATHS.draftOverlay;

/** Prior wave-1 IDs replaced by this revision (demoted from approved overlay). */
const RETIRED_WAVE1_IDS = [
  'tm-385918',
  'tm-317454',
  'tm-146155',
  'tm-314853',
  'tm-323874',
  'tm-221624',
  'tm-111783',
  'tm-245337',
  'tm-260807',
];

const MLS_BATCH = [
  {
    id: 'tm-28003',
    sourceId: '28003',
    displayName: 'Lionel Messi',
    quickFact:
      'Argentina’s 2022 World Cup-winning number 10 who moved to Inter Miami in 2023 and reshaped MLS attention overnight.',
    quizHints: [
      'Won the World Cup with Argentina in Qatar while wearing number 10.',
      'Left European giants for pink-and-black Inter Miami after Paris Saint-Germain.',
      'Left-footed Argentina creator famous for dribbling, free kicks, and playmaking.',
    ],
    playingStyle:
      'Left-footed creator who drifts inside, threads through-balls, and finishes with placement rather than power.',
    importanceScore: 96,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-44352',
    sourceId: '44352',
    displayName: 'Luis Suárez',
    quickFact:
      'Uruguay’s all-time leading scorer and longtime Barcelona partner of Messi who reunited with him at Inter Miami.',
    quizHints: [
      'Uruguay number 9 known for elite movement and finishing in the box.',
      'Shared a famous attacking partnership with Messi at Barcelona.',
      'Veteran centre-forward in Inter Miami pink and black.',
    ],
    playingStyle:
      'Streetwise centre-forward who finds half-yards, links play, and finishes first-time in the box.',
    importanceScore: 90,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-255901',
    sourceId: '255901',
    displayName: 'Rodrigo De Paul',
    quickFact:
      'Argentina’s tireless World Cup-winning midfielder who drives Inter Miami’s press and progression from central midfield.',
    quizHints: [
      'Argentina midfielder who starred in Qatar 2022 beside Messi.',
      'Known for relentless running and vertical passing from midfield.',
      'Inter Miami engine in pink and black, not a winger.',
    ],
    playingStyle:
      'Box-to-box midfielder who carries the ball forward, presses aggressively, and plays line-breaking passes.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-282429',
    sourceId: '282429',
    displayName: 'Sergio Reguilón',
    quickFact:
      'Spain left-back with Real Madrid and Premier League pedigree who overlaps for Inter Miami down the left flank.',
    quizHints: [
      'Spain full-back developed at Real Madrid before Tottenham and Manchester United spells.',
      'Attacking left-back who delivers crosses for Inter Miami.',
      'European-trained defender in pink and black, not a centre-forward.',
    ],
    playingStyle:
      'Overlapping full-back who supports wide attacks, recovers with pace, and delivers driven crosses.',
    importanceScore: 82,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-236045',
    sourceId: '236045',
    displayName: 'Denis Bouanga',
    quickFact:
      'Gabon international whose pace and direct runs made him one of MLS’s most dangerous wide forwards with LAFC.',
    quizHints: [
      'Gabon winger who attacks from the left for black-and-gold LAFC.',
      'MLS forward known for speed, dribbling, and cutting inside to shoot.',
      'Not a centre-back — plays wide for Los Angeles FC.',
    ],
    playingStyle:
      'Direct wide forward who drives at defenders, cuts inside, and finishes with power or placement.',
    importanceScore: 86,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-271072',
    sourceId: '271072',
    displayName: 'Aaron Long',
    quickFact:
      'United States centre-back and former MLS Defender of the Year who anchors LAFC’s back line after the New York Red Bulls.',
    quizHints: [
      'USMNT centre-back who won MLS Defender of the Year with the Red Bulls.',
      'Physical American defender in black and gold for LAFC.',
      'Organises the back line — not LA Galaxy white and gold.',
    ],
    playingStyle:
      'Aggressive centre-back who wins aerial duels, steps into passes, and leads the defensive line vocally.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-203330',
    sourceId: '203330',
    displayName: 'Tyler Boyd',
    quickFact:
      'United States winger with Japan roots who provides width and pressing energy on the left for LAFC.',
    quizHints: [
      'USMNT winger who can play on either flank for Los Angeles FC.',
      'American wide player in black and gold after spells in Europe and Portugal.',
      'Works the left channel for LAFC, not Seattle Rave Green.',
    ],
    playingStyle:
      'Hard-working winger who stretches play, combines in wide areas, and presses with sustained energy.',
    importanceScore: 80,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-446093',
    sourceId: '446093',
    displayName: 'Ryan Porteous',
    quickFact:
      'Scotland centre-back and 2024 European Championship squad member who brought Premier League physicality to LAFC.',
    quizHints: [
      'Scotland defender who played for Watford and Hibernian before MLS.',
      'Tall centre-back in black and gold for Los Angeles FC.',
      'British international — not the USMNT centre-back Aaron Long.',
    ],
    playingStyle:
      'Dominant centre-back who wins headers, blocks shots, and steps out to intercept through balls.',
    importanceScore: 83,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-35207',
    sourceId: '35207',
    displayName: 'Marco Reus',
    quickFact:
      'Germany forward and one-club Borussia Dortmund legend who brought late-career creativity to LA Galaxy in white and gold.',
    quizHints: [
      'Long-time Dortmund captain and Germany international before MLS.',
      'Left-footed attacker for LA Galaxy in white and gold.',
      'German playmaker — not Spain’s Riqui Puig on the same team.',
    ],
    playingStyle:
      'Intelligent forward who arrives late in the box, combines quickly, and shoots with his left foot.',
    importanceScore: 88,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-331511',
    sourceId: '331511',
    displayName: 'Riqui Puig',
    quickFact:
      'Spain midfielder from Barcelona’s La Masia who became LA Galaxy’s tempo-setter after leaving Camp Nou.',
    quizHints: [
      'La Masia graduate who left Barcelona for MLS with LA Galaxy.',
      'Small Spain midfielder known for tight control and passing rhythm.',
      'Central playmaker in white and gold — not Germany’s Marco Reus.',
    ],
    playingStyle:
      'Technical midfielder who keeps the ball, plays between lines, and dictates tempo in possession.',
    importanceScore: 85,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-498862',
    sourceId: '498862',
    displayName: 'João Klauss',
    quickFact:
      'Brazilian centre-forward whose hold-up play and box movement give LA Galaxy a physical focal point up front.',
    quizHints: [
      'Brazilian striker who leads the line in LA Galaxy white and gold.',
      'Tall centre-forward known for hold-up play and aerial duels.',
      'Plays up front for Galaxy — not Spain midfielder Riqui Puig.',
    ],
    playingStyle:
      'Target-style forward who links play with his back to goal and finishes close-range chances.',
    importanceScore: 82,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-81789',
    sourceId: '81789',
    displayName: 'Maya Yoshida',
    quickFact:
      'Japan’s longtime captain and World Cup centre-back who brought Serie A and Premier League experience to LA Galaxy.',
    quizHints: [
      'Former Japan captain who played for Southampton and Sampdoria.',
      'Experienced centre-back in LA Galaxy white and gold.',
      'Japanese international defender — not Marco Reus in attack.',
    ],
    playingStyle:
      'Composed centre-back who reads the game, wins headers, and builds play calmly from the back.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-255450',
    sourceId: '255450',
    displayName: 'Aleksey Miranchuk',
    quickFact:
      'Russia attacking midfielder with Champions League experience who became a creative outlet for Atlanta United.',
    quizHints: [
      'Russia international playmaker who joined MLS from European football.',
      'Attacking midfielder for Atlanta United, not Seattle Sounders.',
      'Left-footed creator in red and black for Atlanta.',
    ],
    playingStyle:
      'Technical number 10 who drifts between lines, combines in tight spaces, and shoots from distance.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-251029',
    sourceId: '251029',
    displayName: 'Saba Lobjanidze',
    quickFact:
      'Georgia winger whose direct dribbling and end product made him one of Atlanta United’s most exciting wide threats.',
    quizHints: [
      'Georgia international who attacks from wide areas for Atlanta United.',
      'Left-footed winger in red and black known for dribbling and crosses.',
      'Plays for Atlanta — not Seattle or LAFC.',
    ],
    playingStyle:
      'Direct winger who takes on full-backs, cuts inside, and delivers dangerous balls into the box.',
    importanceScore: 83,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-793361',
    sourceId: '793361',
    displayName: 'Ajani Fortune',
    quickFact:
      'Trinidad and Tobago midfielder and Atlanta United homegrown talent who covers ground in central midfield.',
    quizHints: [
      'Trinidad and Tobago international in Atlanta United red and black.',
      'Central midfielder who presses and links defence to attack.',
      'Atlanta homegrown — not Jamaica or USMNT by default in hints.',
    ],
    playingStyle:
      'Energetic central midfielder who presses, carries the ball, and supports both phases with late runs.',
    importanceScore: 81,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-661269',
    sourceId: '661269',
    displayName: 'Matías Galarza',
    quickFact:
      'Paraguay midfielder who shields Atlanta United’s back line and distributes with composure from deep.',
    quizHints: [
      'Paraguay international who plays central midfield for Atlanta United.',
      'Defensive-minded midfielder in red and black, not a winger.',
      'South American anchor for Atlanta — not Aleksey Miranchuk the creator.',
    ],
    playingStyle:
      'Disciplined midfielder who breaks up play, shields defenders, and recycles possession with short passes.',
    importanceScore: 80,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-337807',
    sourceId: '337807',
    displayName: 'Jordan Morris',
    quickFact:
      'United States forward and Seattle Sounders homegrown star known for pace, MLS Cup goals, and USMNT impact.',
    quizHints: [
      'Seattle homegrown USMNT forward in Rave Green.',
      'Fast American attacker who excels in transition and pressing.',
      'Sounders forward — not the Salvadoran full-back Roldán on the same team.',
    ],
    playingStyle:
      'Pacey forward who attacks space in transition, presses aggressively, and finishes with composure.',
    importanceScore: 86,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-354792',
    sourceId: '354792',
    displayName: 'Cristian Roldán',
    quickFact:
      'United States midfielder and Seattle Sounders cornerstone who has won multiple MLS Cups as a box-to-box engine.',
    quizHints: [
      'USMNT central midfielder in green for Seattle Sounders.',
      'Box-to-box Sounders star — not his Salvadoran full-back brother Álex.',
      'Seattle academy product who plays in midfield, not at right-back.',
    ],
    playingStyle:
      'Energetic midfielder who covers ground, presses, and links defence to attack with simple, quick passing.',
    importanceScore: 84,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-43228',
    sourceId: '43228',
    displayName: 'Albert Rusnák',
    quickFact:
      'Slovakia attacking midfielder with Premier League experience who crafts chances as a number 10 for Seattle.',
    quizHints: [
      'Slovakia international playmaker for Seattle Sounders in Rave Green.',
      'Former Leeds and Real Salt Lake attacker before Seattle.',
      'Creative number 10 — not USMNT winger Paul Arriola.',
    ],
    playingStyle:
      'Skillful attacking midfielder who receives between lines, combines in the final third, and shoots from range.',
    importanceScore: 85,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
  {
    id: 'tm-189876',
    sourceId: '189876',
    displayName: 'Paul Arriola',
    quickFact:
      'United States winger with Mexico club roots who brings experience and crossing from the right for Seattle.',
    quizHints: [
      'USMNT winger who played for Tijuana before MLS and European spells.',
      'Right-sided American attacker for Seattle Sounders.',
      'Wide player in green — not Slovakia’s Albert Rusnák in the middle.',
    ],
    playingStyle:
      'Direct winger who takes on defenders, delivers crosses, and tracks back to help the full-back.',
    importanceScore: 81,
    quizEligible: true,
    rosterTier: 'featured',
    reviewStatus: 'approved',
  },
];

function main() {
  const { before, after, upserted } = upsertDraftPlayers({
    draftPath: DRAFT_PATH,
    batch: MLS_BATCH,
    retiredIds: RETIRED_WAVE1_IDS,
    description:
      'Approved editorial overlay for generated players (Europe phases 1–3 + MLS wave 1 — 20 priority-club stars).',
  });
  console.log(`MLS wave 1: upserted ${upserted} players (${after} total, was ${before}).`);
}

main();
