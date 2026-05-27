#!/usr/bin/env node
/**
 * Build live national-team entities + registry memberships.
 * Wave 1: england, france, spain, brazil, argentina
 * Wave 2: major national teams expansion (global layer; join-only)
 *
 * Memberships: preview playerLinks first, then registry nationality backfill (cap per nation).
 * Does not add players to sampleData.js — one membership per existing playerId.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { players } from '../src/data/sampleData.js';
import { isQuizEligiblePlayer } from '../src/utils/quizEligibility.js';
import { REGISTRY_NATIONALITY_LABELS as EXPANSION_REGISTRY_LABELS } from './lib/national-team-expansion-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PREVIEW_PATH = path.join(ROOT, 'generated-data/national-teams-preview.json');
const OUTPUT_PATH = path.join(ROOT, 'src/data/nationalTeamLive.json');

const LIVE_NATIONAL_TEAM_IDS = [
  // Wave 1
  'england',
  'france',
  'spain',
  'brazil',
  'argentina',
  // Wave 2 (major nations layer)
  'germany',
  'portugal',
  'italy',
  'netherlands',
  'belgium',
  'croatia',
  'switzerland',
  'denmark',
  'serbia',
  'turkey',
  'united-states',
  'mexico',
  'uruguay',
  'colombia',
  'chile',
  'morocco',
  'senegal',
  'nigeria',
  'japan',
  'korea-republic',
  // Wave 3 batch 1 (preview-gated)
  'norway',
  'ghana',
  'algeria',
  'poland',
  // Wave 3 batch 2 (preview-gated)
  'austria',
  'ukraine',
  'scotland',
  'paraguay',
  // Wave 3 batch 3 (World Cup 2026 — preview-gated)
  'czechia',
  'sweden',
  'cote-divoire',
  // Wave 3 batch 4 (World Cup 2026 — preview-gated)
  'canada',
  'australia',
];

const MAX_MEMBERSHIPS_PER_NATION = 40;

/** Nationality / nationalTeam string labels → nationalTeamId */
const REGISTRY_NATIONALITY_LABELS = {
  england: ['england', 'english'],
  france: ['france', 'french'],
  spain: ['spain', 'spanish'],
  brazil: ['brazil', 'brazilian'],
  argentina: ['argentina', 'argentine'],
  germany: ['germany', 'german'],
  netherlands: ['netherlands', 'dutch'],
  portugal: ['portugal', 'portuguese'],
  italy: ['italy', 'italian'],
  belgium: ['belgium', 'belgian'],
  croatia: ['croatia', 'croatian'],
  switzerland: ['switzerland', 'swiss'],
  denmark: ['denmark', 'danish'],
  serbia: ['serbia', 'serbian'],
  turkey: ['turkey', 'turkish', 'turkiye', 'türkiye'],
  'united-states': ['united states', 'usa', 'american'],
  mexico: ['mexico', 'mexican'],
  uruguay: ['uruguay', 'uruguayan'],
  colombia: ['colombia', 'colombian'],
  chile: ['chile', 'chilean'],
  morocco: ['morocco', 'moroccan'],
  senegal: ['senegal', 'senegalese'],
  nigeria: ['nigeria', 'nigerian'],
  japan: ['japan', 'japanese'],
  'korea-republic': ['south korea', 'korea republic', 'korea', 'korean'],
  norway: ['norway', 'norwegian'],
  ghana: ['ghana', 'ghanaian'],
  algeria: ['algeria', 'algerian'],
  poland: ['poland', 'polish'],
  austria: ['austria', 'austrian'],
  ukraine: ['ukraine', 'ukrainian'],
  scotland: ['scotland', 'scottish'],
  paraguay: ['paraguay', 'paraguayan'],
  czechia: ['czechia', 'czech republic', 'czech'],
  sweden: ['sweden', 'swedish'],
  'cote-divoire': ["cote d'ivoire", 'cote divoire', 'ivory coast', 'ivorian'],
  canada: ['canada', 'canadian'],
  australia: ['australia', 'australian'],
  ...Object.fromEntries(
    Object.entries(EXPANSION_REGISTRY_LABELS).filter(([id]) => !LIVE_NATIONAL_TEAM_IDS.includes(id)),
  ),
};

const LIVE_NATION_EDITORIAL = {
  brazil: {
    displayName: 'Brazil',
    country: 'Brazil',
    confederationId: 'conmebol',
    confederation: 'CONMEBOL',
    rivalIds: ['argentina'],
    searchAliases: ['brasil', 'selecao', 'seleção', 'bra', 'canarinho'],
    badgeTheme: { from: '#16a34a', to: '#14532d', accent: '#bbf7d0' },
    fanGuide:
      'The Seleção are five-time World Cup winners and the reference point for flair in men’s football. Learning Brazil means knowing samba style, yellow shirts, and the rivalry with Argentina.',
    shortHistory:
      'Men’s senior team of Brazil (CBF). FootyBrain squads link existing club players matched to Transfermarkt senior listings.',
  },
  france: {
    displayName: 'France',
    country: 'France',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['england', 'spain', 'germany'],
    searchAliases: ['les bleus', 'fra', 'french national team', 'france nt'],
    badgeTheme: { from: '#2563eb', to: '#1e3a8a', accent: '#dbeafe' },
    fanGuide:
      'Les Bleus blend academy depth with star power. France won the 2018 World Cup and remain a benchmark for modern athletic, tactical football.',
    shortHistory:
      'Men’s senior team of France (FFF). Squad lists link FootyBrain club players on TM senior France listings.',
  },
  england: {
    displayName: 'England',
    country: 'England',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['france', 'germany'],
    searchAliases: ['three lions', 'eng', 'england national team', 'england nt'],
    badgeTheme: { from: '#1d4ed8', to: '#172554', accent: '#e0e7ff' },
    fanGuide:
      'The Three Lions carry the weight of 1966 and a nation that lives through the Premier League. England means Wembley, white shirts, and endless “football’s coming home” debate.',
    shortHistory:
      'Men’s senior team of England (FA). Linked players are already in the FootyBrain club database.',
  },
  spain: {
    displayName: 'Spain',
    country: 'Spain',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['france', 'netherlands'],
    searchAliases: ['la roja', 'esp', 'spanish national team', 'spain nt', 'seleccion española'],
    badgeTheme: { from: '#dc2626', to: '#991b1b', accent: '#fecaca' },
    fanGuide:
      'La Roja won Euro 2008, 2012, and the 2010 World Cup with tiki-taka possession. Spain means red shirts, technical midfielders, and Iberian pride.',
    shortHistory:
      'Men’s senior team of Spain (RFEF). Squads link club players in FootyBrain who appear on TM Spain senior listings.',
  },
  argentina: {
    displayName: 'Argentina',
    country: 'Argentina',
    confederationId: 'conmebol',
    confederation: 'CONMEBOL',
    rivalIds: ['brazil'],
    searchAliases: ['albiceleste', 'arg', 'argentina national team', 'la albiceleste'],
    badgeTheme: { from: '#38bdf8', to: '#1e3a8a', accent: '#e0f2fe' },
    fanGuide:
      'La Albiceleste are 2022 World Cup winners built around generational talent and Buenos Aires passion. Argentina means blue and white stripes and the Clásico with Brazil.',
    shortHistory:
      'Men’s senior team of Argentina (AFA). Squad links use TM listings matched to existing FootyBrain players.',
  },
  germany: {
    displayName: 'Germany',
    country: 'Germany',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['france', 'netherlands', 'england'],
    searchAliases: ['die mannschaft', 'ger', 'deutschland', 'german national team', 'germany nt'],
    badgeTheme: { from: '#1f2937', to: '#030712', accent: '#fbbf24' },
    fanGuide:
      'Die Mannschaft are four-time World Cup winners known for pressing, organization, and tournament pedigree. Germany means efficiency, big-match experience, and Bundesliga-fed talent.',
    shortHistory:
      'Men’s senior team of Germany (DFB). Squads combine Transfermarkt senior links with club players whose nationality matches in the FootyBrain registry.',
  },
  netherlands: {
    displayName: 'Netherlands',
    country: 'Netherlands',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['germany', 'spain'],
    searchAliases: ['holland', 'ned', 'oranje', 'dutch national team', 'netherlands nt', 'knvb'],
    badgeTheme: { from: '#f97316', to: '#c2410c', accent: '#ffedd5' },
    fanGuide:
      'Oranje invented Total Football and remain a benchmark for technical, attacking football. The Netherlands mean orange shirts, Ajax DNA, and World Cup near-misses turned into learning stories.',
    shortHistory:
      'Men’s senior team of the Netherlands (KNVB). Linked players are existing FootyBrain club players with Dutch nationality or TM senior listings.',
  },
  portugal: {
    displayName: 'Portugal',
    country: 'Portugal',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['spain', 'france'],
    searchAliases: ['por', 'portugal national team', 'portugal nt', 'seleção portuguesa', 'selecao'],
    badgeTheme: { from: '#dc2626', to: '#14532d', accent: '#fecaca' },
    fanGuide:
      'Portugal blend technical midfielders with elite forwards. Modern Portugal means Cristiano Ronaldo’s era, Euro 2016 pride, and a deep pipeline from Lisbon and Porto.',
    shortHistory:
      'Men’s senior team of Portugal (FPF). Squad links join existing FootyBrain club players to national-team memberships.',
  },
  italy: {
    displayName: 'Italy',
    country: 'Italy',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['france', 'germany'],
    searchAliases: ['ita', 'azzurri', 'gli azzurri', 'italy national team', 'italy nt'],
    badgeTheme: { from: '#2563eb', to: '#1e3a8a', accent: '#dbeafe' },
    fanGuide:
      'The Azzurri are defined by tactical identity and tournament moments: defensive mastery, ruthless set pieces, and famous European Championship runs.',
    shortHistory:
      'Men’s senior team of Italy (FIGC). FootyBrain squads link players already in the club database.',
  },
  belgium: {
    displayName: 'Belgium',
    country: 'Belgium',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['netherlands', 'france'],
    searchAliases: ['bel', 'red devils', 'belgium national team', 'belgium nt'],
    badgeTheme: { from: '#b91c1c', to: '#111827', accent: '#fef08a' },
    fanGuide:
      'Belgium’s “Golden Generation” made them a modern power. Learn Belgium through creative midfielders, elite keepers, and a small-country talent funnel.',
    shortHistory:
      'Men’s senior team of Belgium (RBFA). Memberships join existing FootyBrain club players; no new registry players are created.',
  },
  croatia: {
    displayName: 'Croatia',
    country: 'Croatia',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['serbia'],
    searchAliases: ['hrvatska', 'cro', 'croatia national team', 'croatia nt', 'vatreni'],
    badgeTheme: { from: '#dc2626', to: '#1d4ed8', accent: '#dbeafe' },
    fanGuide:
      'Croatia overachieve through midfield craft and tournament grit. The story runs from 1998 to 2018’s final and the continuous production of elite playmakers.',
    shortHistory:
      'Men’s senior team of Croatia (HNS). FootyBrain squads link existing club players matched to Croatia memberships.',
  },
  switzerland: {
    displayName: 'Switzerland',
    country: 'Switzerland',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['italy', 'france'],
    searchAliases: ['sui', 'swiss national team', 'switzerland nt', 'schweiz'],
    badgeTheme: { from: '#dc2626', to: '#7f1d1d', accent: '#fecaca' },
    fanGuide:
      'Switzerland are a disciplined tournament side with a strong diaspora talent base. Learn the spine: goalkeeper stability, organized defenders, and creative dual-nation midfielders.',
    shortHistory:
      'Men’s senior team of Switzerland (SFV/ASF). Squads link to club players already present in FootyBrain.',
  },
  denmark: {
    displayName: 'Denmark',
    country: 'Denmark',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['sweden'],
    searchAliases: ['den', 'danish national team', 'denmark nt', 'dansk'],
    badgeTheme: { from: '#dc2626', to: '#111827', accent: '#fee2e2' },
    fanGuide:
      'Denmark punch above their size with collective pressing and smart rotations. The modern story mixes Euro 1992 legend, Eriksen’s era, and strong club exports.',
    shortHistory:
      'Men’s senior team of Denmark (DBU). Memberships are join-only to existing FootyBrain players.',
  },
  serbia: {
    displayName: 'Serbia',
    country: 'Serbia',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['croatia'],
    searchAliases: ['srb', 'serbia national team', 'serbia nt', 'orlovima'],
    badgeTheme: { from: '#dc2626', to: '#1e3a8a', accent: '#dbeafe' },
    fanGuide:
      'Serbia’s identity is physical presence and technical flashes from a rich Balkan football culture. Learn key exports and the tactical swings between generations.',
    shortHistory:
      'Men’s senior team of Serbia (FSS). Squads link existing FootyBrain club players to Serbia memberships.',
  },
  turkey: {
    displayName: 'Turkey',
    country: 'Turkey',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['greece'],
    searchAliases: ['tur', 'turkiye', 'türkiye', 'turkey national team', 'turkey nt'],
    badgeTheme: { from: '#dc2626', to: '#7f1d1d', accent: '#fee2e2' },
    fanGuide:
      'Turkey combine passionate football culture with emerging European-based talent. Learn the national identity through big tournament highs and the Istanbul club ecosystem.',
    shortHistory:
      'Men’s senior team of Turkey (TFF). Memberships join existing FootyBrain club players; no new players are imported.',
  },
  'united-states': {
    displayName: 'United States',
    country: 'United States',
    confederationId: 'concacaf',
    confederation: 'CONCACAF',
    rivalIds: ['mexico'],
    searchAliases: ['usa', 'usmnt', 'us soccer', 'united states', 'us national team'],
    badgeTheme: { from: '#1d4ed8', to: '#991b1b', accent: '#dbeafe' },
    fanGuide:
      'The USMNT are a rising CONCACAF power built on athleticism and a growing European player pipeline. Learn the core roles ahead of the 2026 host spotlight.',
    shortHistory:
      'Men’s senior team of the United States (US Soccer). Squads link FootyBrain club players to USA memberships.',
  },
  mexico: {
    displayName: 'Mexico',
    country: 'Mexico',
    confederationId: 'concacaf',
    confederation: 'CONCACAF',
    rivalIds: ['united-states'],
    searchAliases: ['mex', 'el tri', 'mexico national team', 'mexico nt'],
    badgeTheme: { from: '#16a34a', to: '#7f1d1d', accent: '#bbf7d0' },
    fanGuide:
      'El Tri are defined by regional rivalry, technical attackers, and tournament regularity. Mexico is central to CONCACAF storylines and 2026 host context.',
    shortHistory:
      'Men’s senior team of Mexico (FMF). Memberships link existing club players only; coverage depends on club imports.',
  },
  uruguay: {
    displayName: 'Uruguay',
    country: 'Uruguay',
    confederationId: 'conmebol',
    confederation: 'CONMEBOL',
    rivalIds: ['argentina', 'brazil'],
    searchAliases: ['uru', 'celeste', 'la celeste', 'uruguay national team', 'uruguay nt'],
    badgeTheme: { from: '#38bdf8', to: '#1e3a8a', accent: '#e0f2fe' },
    fanGuide:
      'Uruguay are small-country giants: historic World Cups, relentless mentality, and famous striker pipelines. Learn their modern pressing plus classic grit.',
    shortHistory:
      'Men’s senior team of Uruguay (AUF). Squads link to existing FootyBrain club players matched to Uruguay memberships.',
  },
  colombia: {
    displayName: 'Colombia',
    country: 'Colombia',
    confederationId: 'conmebol',
    confederation: 'CONMEBOL',
    rivalIds: ['uruguay'],
    searchAliases: ['col', 'colombia national team', 'colombia nt', 'cafeteros'],
    badgeTheme: { from: '#f59e0b', to: '#1d4ed8', accent: '#fef08a' },
    fanGuide:
      'Colombia’s modern identity mixes midfield rhythm with explosive wide attackers. Learn the Cafeteros through iconic No.10 traditions and CONMEBOL qualifying battles.',
    shortHistory:
      'Men’s senior team of Colombia (FCF). Memberships are join-only to existing FootyBrain players.',
  },
  chile: {
    displayName: 'Chile',
    country: 'Chile',
    confederationId: 'conmebol',
    confederation: 'CONMEBOL',
    rivalIds: ['argentina'],
    searchAliases: ['chi', 'la roja chile', 'chile national team', 'chile nt'],
    badgeTheme: { from: '#dc2626', to: '#1e3a8a', accent: '#dbeafe' },
    fanGuide:
      'Chile’s peak era came from relentless pressing and midfield grit. Learn their identity through high-intensity transitions and memorable Copa América moments.',
    shortHistory:
      'Men’s senior team of Chile (FFCh). Squads link existing FootyBrain club players to Chile memberships.',
  },
  morocco: {
    displayName: 'Morocco',
    country: 'Morocco',
    confederationId: 'caf',
    confederation: 'CAF',
    rivalIds: ['senegal'],
    searchAliases: ['mar', 'atlas lions', 'morocco national team', 'morocco nt', 'atlas lions'],
    badgeTheme: { from: '#dc2626', to: '#14532d', accent: '#fee2e2' },
    fanGuide:
      'Morocco’s modern rise is built on a strong diaspora, organized defending, and brave tournament play. Learn them through club exports across Europe.',
    shortHistory:
      'Men’s senior team of Morocco (FRMF). Memberships join existing FootyBrain club players; coverage grows with club imports.',
  },
  senegal: {
    displayName: 'Senegal',
    country: 'Senegal',
    confederationId: 'caf',
    confederation: 'CAF',
    rivalIds: ['nigeria'],
    searchAliases: ['sen', 'lions of teranga', 'senegal national team', 'senegal nt'],
    badgeTheme: { from: '#16a34a', to: '#1d4ed8', accent: '#bbf7d0' },
    fanGuide:
      'Senegal are one of Africa’s strongest sides: athletic pressing, elite forwards, and deep European club representation. Learn their core through AFCON and World Cup stories.',
    shortHistory:
      'Men’s senior team of Senegal (FSF). FootyBrain squads link existing club players to Senegal memberships.',
  },
  nigeria: {
    displayName: 'Nigeria',
    country: 'Nigeria',
    confederationId: 'caf',
    confederation: 'CAF',
    rivalIds: ['ghana'],
    searchAliases: ['nga', 'super eagles', 'nigeria national team', 'nigeria nt'],
    badgeTheme: { from: '#16a34a', to: '#14532d', accent: '#bbf7d0' },
    fanGuide:
      'Nigeria’s Super Eagles are defined by pace, power, and a huge talent pipeline. Learn Nigeria through their exports and the variety of attacking profiles.',
    shortHistory:
      'Men’s senior team of Nigeria (NFF). Memberships join existing FootyBrain club players; no new registry players are imported.',
  },
  japan: {
    displayName: 'Japan',
    country: 'Japan',
    confederationId: 'afc',
    confederation: 'AFC',
    rivalIds: ['korea-republic'],
    searchAliases: ['jpn', 'samurai blue', 'japan national team', 'japan nt'],
    badgeTheme: { from: '#1d4ed8', to: '#7f1d1d', accent: '#dbeafe' },
    fanGuide:
      'Japan are a modern technical side with disciplined structure and a growing European presence. Learn their style through positional play and coordinated pressing.',
    shortHistory:
      'Men’s senior team of Japan (JFA). Squads link existing FootyBrain club players to Japan memberships.',
  },
  'korea-republic': {
    displayName: 'South Korea',
    country: 'South Korea',
    confederationId: 'afc',
    confederation: 'AFC',
    rivalIds: ['japan'],
    searchAliases: ['kor', 'korea republic', 'south korea', 'south korea national team', 'korea nt', 'taegeuk warriors'],
    badgeTheme: { from: '#dc2626', to: '#1f2937', accent: '#fee2e2' },
    fanGuide:
      'South Korea combine relentless work rate with elite attackers and fast transitions. Learn the Taegeuk Warriors through their World Cup history and rivalry with Japan.',
    shortHistory:
      'Men’s senior team of South Korea (KFA). Memberships join existing FootyBrain club players; coverage depends on club imports.',
  },
  norway: {
    displayName: 'Norway',
    country: 'Norway',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['sweden', 'denmark'],
    searchAliases: ['nor', 'norway national team', 'norway nt', 'løvene'],
    badgeTheme: { from: '#dc2626', to: '#1e3a8a', accent: '#dbeafe' },
    fanGuide:
      'Norway’s modern story blends Nordic rivalry with a growing European export pipeline. Learn them through Haaland’s generation, organized defending, and Scandinavian derby context.',
    shortHistory:
      'Men’s senior team of Norway (NFF). FootyBrain squads link existing club players matched to Norway memberships.',
  },
  ghana: {
    displayName: 'Ghana',
    country: 'Ghana',
    confederationId: 'caf',
    confederation: 'CAF',
    rivalIds: ['nigeria'],
    searchAliases: ['gha', 'black stars', 'ghana national team', 'ghana nt'],
    badgeTheme: { from: '#f59e0b', to: '#14532d', accent: '#fef08a' },
    fanGuide:
      'The Black Stars are one of Africa’s most recognizable sides: pace, power, and deep talent across Europe’s leagues. Learn Ghana through AFCON history and the rivalry with Nigeria.',
    shortHistory:
      'Men’s senior team of Ghana (GFA). Memberships join existing FootyBrain club players; no new registry players are imported.',
  },
  algeria: {
    displayName: 'Algeria',
    country: 'Algeria',
    confederationId: 'caf',
    confederation: 'CAF',
    rivalIds: ['morocco'],
    searchAliases: ['alg', 'les fennecs', 'algeria national team', 'algeria nt'],
    badgeTheme: { from: '#16a34a', to: '#ffffff', accent: '#dc2626' },
    fanGuide:
      'Algeria’s Fennecs mix North African flair with European-based stars. Learn them through AFCON triumphs, desert football identity, and Maghreb rivalries.',
    shortHistory:
      'Men’s senior team of Algeria (FAF). Squads link existing FootyBrain club players to Algeria memberships.',
  },
  poland: {
    displayName: 'Poland',
    country: 'Poland',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['germany', 'czechia'],
    searchAliases: ['pol', 'poland national team', 'poland nt', 'bialo-czerwoni'],
    badgeTheme: { from: '#dc2626', to: '#f8fafc', accent: '#fee2e2' },
    fanGuide:
      'Poland combine physical presence with technical midfielders and famous striker traditions. Learn the Biało-czerwoni through World Cup history and Central European rivalries.',
    shortHistory:
      'Men’s senior team of Poland (PZPN). Memberships are join-only to existing FootyBrain players.',
  },
  austria: {
    displayName: 'Austria',
    country: 'Austria',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['germany', 'switzerland'],
    searchAliases: ['aut', 'austria national team', 'austria nt', 'das team'],
    badgeTheme: { from: '#dc2626', to: '#f8fafc', accent: '#fee2e2' },
    fanGuide:
      'Austria blend Central European grit with a strong Bundesliga talent pipeline. Learn Das Team through organized pressing, set-piece threat, and rivalry with Germany.',
    shortHistory:
      'Men’s senior team of Austria (ÖFB). FootyBrain squads link existing club players to Austria memberships.',
  },
  ukraine: {
    displayName: 'Ukraine',
    country: 'Ukraine',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['poland'],
    searchAliases: ['ukr', 'ukraine national team', 'ukraine nt', 'zbruki'],
    badgeTheme: { from: '#f59e0b', to: '#1d4ed8', accent: '#fef08a' },
    fanGuide:
      'Ukraine’s identity is built on technical midfielders, fast wide players, and a deep European diaspora. Learn the national team through modern exports and resilient tournament football.',
    shortHistory:
      'Men’s senior team of Ukraine (UAF). Memberships join existing FootyBrain club players; no new registry players are imported.',
  },
  scotland: {
    displayName: 'Scotland',
    country: 'Scotland',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['england'],
    searchAliases: ['sco', 'scotland national team', 'scotland nt', 'tartan army'],
    badgeTheme: { from: '#1d4ed8', to: '#7f1d1d', accent: '#dbeafe' },
    fanGuide:
      'Scotland carry passionate support and a proud British Isles rivalry with England. Learn the Tartan Army through physical duels, set pieces, and the Premier League Scottish export pipeline.',
    shortHistory:
      'Men’s senior team of Scotland (SFA). Squads link existing FootyBrain club players matched to Scotland memberships.',
  },
  paraguay: {
    displayName: 'Paraguay',
    country: 'Paraguay',
    confederationId: 'conmebol',
    confederation: 'CONMEBOL',
    rivalIds: ['uruguay', 'argentina'],
    searchAliases: ['par', 'la albirroja', 'paraguay national team', 'paraguay nt'],
    badgeTheme: { from: '#dc2626', to: '#1e3a8a', accent: '#dbeafe' },
    fanGuide:
      'Paraguay are CONMEBOL warriors: organized defending, set-piece discipline, and famous Albirroja spirit. Learn them through qualifying battles and physical South American football.',
    shortHistory:
      'Men’s senior team of Paraguay (APF). Memberships are join-only to existing FootyBrain players.',
  },
  czechia: {
    displayName: 'Czechia',
    country: 'Czechia',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['germany', 'poland', 'slovakia'],
    searchAliases: ['cze', 'czech republic', 'czechia national team', 'czechia nt', 'czech nt'],
    badgeTheme: { from: '#dc2626', to: '#1e3a8a', accent: '#dbeafe' },
    fanGuide:
      'Czechia carry Central European football heritage from the Czechoslovak era through modern UEFA competition. Learn them through technical midfielders, organized defending, and rivalry with Germany and Poland.',
    shortHistory:
      'Men’s senior team of Czechia (FAČR). FootyBrain squads link existing club players matched to Czechia memberships.',
  },
  sweden: {
    displayName: 'Sweden',
    country: 'Sweden',
    confederationId: 'uefa',
    confederation: 'UEFA',
    rivalIds: ['norway', 'denmark'],
    searchAliases: ['swe', 'sweden national team', 'sweden nt', 'blågult', 'blagult'],
    badgeTheme: { from: '#fbbf24', to: '#1e3a8a', accent: '#fef08a' },
    fanGuide:
      'Sweden’s Blågult blend Scandinavian organization with Premier League and Bundesliga exports. Learn them through Ibrahimović’s legacy, Nordic rivalries, and modern stars like Isak.',
    shortHistory:
      'Men’s senior team of Sweden (SvFF). FootyBrain squads link existing club players matched to Sweden memberships.',
  },
  'cote-divoire': {
    displayName: "Côte d'Ivoire",
    country: "Côte d'Ivoire",
    confederationId: 'caf',
    confederation: 'CAF',
    rivalIds: ['ghana', 'senegal'],
    searchAliases: ['civ', 'ivory coast', 'cote divoire', "côte d'ivoire", 'cote-divoire nt'],
    badgeTheme: { from: '#f97316', to: '#16a34a', accent: '#fef08a' },
    fanGuide:
      'Les Éléphants are West African giants with AFCON triumphs and a long line of European-based stars. Learn Ivory Coast through orange kits, physical flair, and rivalry with Ghana.',
    shortHistory:
      'Men’s senior team of Côte d\'Ivoire (FIF). Squads link existing FootyBrain club players via nationality registry and preview TM field matches.',
  },
  canada: {
    displayName: 'Canada',
    country: 'Canada',
    confederationId: 'concacaf',
    confederation: 'CONCACAF',
    rivalIds: ['united-states', 'mexico'],
    searchAliases: ['can', 'canada national team', 'canada nt', 'canmnt', 'les rouges'],
    badgeTheme: { from: '#dc2626', to: '#f8fafc', accent: '#fecaca' },
    fanGuide:
      'Canada’s Les Rouges are 2026 co-hosts building on MLS depth and European exports like Davies and David. Learn them through CONCACAF rivalries and a growing World Cup generation.',
    shortHistory:
      'Men’s senior team of Canada (Canada Soccer). FootyBrain squads link existing club players matched to Canada memberships.',
  },
  australia: {
    displayName: 'Australia',
    country: 'Australia',
    confederationId: 'afc',
    confederation: 'AFC',
    rivalIds: ['japan', 'korea-republic'],
    searchAliases: ['aus', 'socceroos', 'australia national team', 'australia nt'],
    badgeTheme: { from: '#fbbf24', to: '#16a34a', accent: '#fef08a' },
    fanGuide:
      'The Socceroos carry Asia-Pacific pride with a physical, direct style and a strong European diaspora pipeline. Learn Australia through World Cup runs and AFC rivalry with Japan.',
    shortHistory:
      'Men’s senior team of Australia (Football Australia). Squads link existing FootyBrain club players matched to Australia memberships.',
  },
};

function normalizePlayerName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildPlayerIndexes(playerList) {
  const playerById = new Map(playerList.map((p) => [p.id, p]));
  const bySourceId = new Map();
  const byNormalizedName = new Map();

  for (const player of playerList) {
    if (player.sourceId) {
      bySourceId.set(String(player.sourceId), player);
    }
    if (String(player.id).startsWith('tm-')) {
      bySourceId.set(player.id.slice(3), player);
    }
    const norm = normalizePlayerName(player.name);
    if (norm && !byNormalizedName.has(norm)) {
      byNormalizedName.set(norm, player);
    }
  }

  return { playerById, bySourceId, byNormalizedName };
}

function resolvePlayerFromLink(link, indexes) {
  const { playerById, bySourceId, byNormalizedName } = indexes;

  if (link.playerId && playerById.has(link.playerId)) {
    return playerById.get(link.playerId);
  }

  if (link.sourceId) {
    const sid = String(link.sourceId);
    const viaTm = playerById.get(`tm-${sid}`);
    if (viaTm) return viaTm;
    const viaSource = bySourceId.get(sid);
    if (viaSource) return viaSource;
  }

  const label = link.displayName || link.tmDisplayName;
  const norm = normalizePlayerName(label);
  if (!norm) return null;

  const exact = byNormalizedName.get(norm);
  if (exact) return exact;

  const linkTokens = norm.split(' ').filter((t) => t.length > 1);
  if (linkTokens.length < 2) return null;

  let best = null;
  let bestOverlap = 0;
  for (const [nameKey, player] of byNormalizedName) {
    const tokens = nameKey.split(' ').filter((t) => t.length > 1);
    const overlap = linkTokens.filter((t) => tokens.includes(t)).length;
    if (overlap >= 2 && overlap > bestOverlap) {
      bestOverlap = overlap;
      best = player;
    }
  }
  return best;
}

function playerMatchesNationalTeam(player, nationalTeamId) {
  const labels = REGISTRY_NATIONALITY_LABELS[nationalTeamId] ?? [];
  const fields = [player.nationality, player.nationalTeam, player.country].filter(Boolean);
  for (const field of fields) {
    const norm = String(field).trim().toLowerCase();
    for (const label of labels) {
      if (norm === label || norm.includes(label)) return true;
    }
  }
  return false;
}

function addMembership({
  memberships,
  playerToNt,
  player,
  nationalTeamId,
  source,
  tmSourceId = null,
  skippedDuplicate,
}) {
  if (playerToNt.has(player.id)) {
    if (playerToNt.get(player.id) !== nationalTeamId) {
      skippedDuplicate.push({
        playerId: player.id,
        existing: playerToNt.get(player.id),
        attempted: nationalTeamId,
        source,
      });
    }
    return false;
  }

  const countForNt = memberships.filter((m) => m.nationalTeamId === nationalTeamId).length;
  if (countForNt >= MAX_MEMBERSHIPS_PER_NATION) return false;

  playerToNt.set(player.id, nationalTeamId);
  memberships.push({
    playerId: player.id,
    nationalTeamId,
    role: 'senior',
    status: 'active',
    isPrimary: true,
    source,
    tmSourceId: tmSourceId ? String(tmSourceId) : null,
  });
  return true;
}

function main() {
  if (!fs.existsSync(PREVIEW_PATH)) {
    console.error(`Missing ${PREVIEW_PATH} — run npm run build:national-teams-preview`);
    process.exit(1);
  }

  const preview = JSON.parse(fs.readFileSync(PREVIEW_PATH, 'utf8'));
  if (!preview.inspection?.passed) {
    console.error('national-teams-preview inspection did not pass — fix preview before going live.');
    process.exit(1);
  }

  const indexes = buildPlayerIndexes(players);
  const previewById = new Map((preview.nationalTeams ?? []).map((t) => [t.id, t]));

  const nationalTeams = LIVE_NATIONAL_TEAM_IDS.map((id) => {
    const editorial = LIVE_NATION_EDITORIAL[id];
    const tm = previewById.get(id);
    if (!editorial || !tm) {
      console.error(`Missing editorial or preview entity for ${id}`);
      process.exit(1);
    }
    return {
      id,
      ...editorial,
      fifaRanking: tm.fifaRanking ?? null,
      tmCode: tm.tmCode ?? id,
      crestPolicy: 'text-only',
    };
  });

  const memberships = [];
  const playerToNt = new Map();
  const skippedUnknown = [];
  const skippedDuplicate = [];
  const backfillCounts = Object.fromEntries(LIVE_NATIONAL_TEAM_IDS.map((id) => [id, 0]));

  for (const link of preview.playerLinks ?? []) {
    if (!LIVE_NATIONAL_TEAM_IDS.includes(link.nationalTeamId)) continue;

    const player = resolvePlayerFromLink(link, indexes);
    if (!player) {
      skippedUnknown.push(link);
      continue;
    }

    addMembership({
      memberships,
      playerToNt,
      player,
      nationalTeamId: link.nationalTeamId,
      source: 'national_teams_preview_player_link',
      tmSourceId: link.sourceId,
      skippedDuplicate,
    });
  }

  for (const nationalTeamId of LIVE_NATIONAL_TEAM_IDS) {
    const candidates = players
      .filter((p) => playerMatchesNationalTeam(p, nationalTeamId))
      .sort((a, b) => {
        const qa = isQuizEligiblePlayer(a) ? 1 : 0;
        const qb = isQuizEligiblePlayer(b) ? 1 : 0;
        if (qb !== qa) return qb - qa;
        return (b.importanceScore ?? 0) - (a.importanceScore ?? 0);
      });

    for (const player of candidates) {
      const added = addMembership({
        memberships,
        playerToNt,
        player,
        nationalTeamId,
        source: 'registry_nationality',
        skippedDuplicate,
      });
      if (added) backfillCounts[nationalTeamId] += 1;
    }
  }

  const countsByNt = Object.fromEntries(LIVE_NATIONAL_TEAM_IDS.map((id) => [id, 0]));
  const previewCountsByNt = Object.fromEntries(LIVE_NATIONAL_TEAM_IDS.map((id) => [id, 0]));
  const quizCountsByNt = Object.fromEntries(LIVE_NATIONAL_TEAM_IDS.map((id) => [id, 0]));

  for (const m of memberships) {
    countsByNt[m.nationalTeamId] = (countsByNt[m.nationalTeamId] ?? 0) + 1;
    if (m.source === 'national_teams_preview_player_link') {
      previewCountsByNt[m.nationalTeamId] = (previewCountsByNt[m.nationalTeamId] ?? 0) + 1;
    }
    const player = players.find((p) => p.id === m.playerId);
    if (player && isQuizEligiblePlayer(player)) {
      quizCountsByNt[m.nationalTeamId] = (quizCountsByNt[m.nationalTeamId] ?? 0) + 1;
    }
  }

  const unmatchedLive = (preview.unmatchedNationalTeamPlayers ?? []).filter((u) =>
    LIVE_NATIONAL_TEAM_IDS.includes(u.nationalTeamId),
  );

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      wave: '2+3-batch1+2',
      liveNationalTeamIds: LIVE_NATIONAL_TEAM_IDS,
      membershipSources: ['national_teams_preview_player_link', 'registry_nationality'],
      counts: {
        nationalTeams: nationalTeams.length,
        memberships: memberships.length,
        unmatchedTmSquadRows: unmatchedLive.length,
        skippedUnknownPlayerId: skippedUnknown.length,
        skippedDuplicateMembership: skippedDuplicate.length,
      },
      membershipsPerTeam: countsByNt,
      previewMembershipsPerTeam: previewCountsByNt,
      registryBackfillPerTeam: backfillCounts,
      quizEligibleMembershipsPerTeam: quizCountsByNt,
    },
    nationalTeams,
    nationalMemberships: memberships,
    unmatchedTmSquadRows: unmatchedLive,
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

  console.log('Wrote', path.relative(ROOT, OUTPUT_PATH));
  console.log('Live nations:', LIVE_NATIONAL_TEAM_IDS.join(', '));
  console.log('Total memberships:', memberships.length);
  for (const id of LIVE_NATIONAL_TEAM_IDS) {
    console.log(
      `  ${id}: ${countsByNt[id]} linked (${previewCountsByNt[id]} preview + ${backfillCounts[id]} registry) · ${quizCountsByNt[id]} quiz-ready`,
    );
  }
  console.log('Unmatched TM rows (not imported):', unmatchedLive.length);
  if (skippedUnknown.length) {
    console.warn('Skipped preview links — playerId not in sampleData:', skippedUnknown.length);
  }
  if (skippedDuplicate.length) {
    console.warn('Skipped duplicate NT assignments:', skippedDuplicate.length);
  }
}

main();
