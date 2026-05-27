/**
 * Common football aliases for search only.
 * Keep this list conservative: short aliases should map to one clear entity.
 */

import { compactForSearch } from './textSearch.js';

const TEAM_ALIASES = {
  'paris-saint-germain': ['psg', 'paris sg'],
  marseille: ['om', 'olympique marseille', 'olympique de marseille'],
  barcelona: ['barca', 'barça', 'fcb'],
  'manchester-city': ['man city', 'mancity'],
  'manchester-united': ['man united', 'man utd', 'man u'],
  arsenal: ['gunners', 'afc'],
  liverpool: ['reds', 'lfc'],
  chelsea: ['blues', 'cfc'],
  tottenham: ['spurs', 'tottenham hotspur'],
  'bayern-munich': ['bayern'],
  'inter-milan': ['inter'],
  'ac-milan': ['milan'],
  juventus: ['juve'],
  'borussia-dortmund': ['bvb', 'dortmund'],
  'bayer-leverkusen': ['leverkusen'],
  psv: ['psv'],
  ajax: ['ajax'],
  wolves: ['wolves', 'wolverhampton'],
  'athletic-bilbao': ['bilbao', 'athletic bilbao', 'athletic club'],
  'borussia-monchengladbach': ['gladbach', 'mgladbach', 'monchengladbach', 'mönchengladbach'],
  rennes: ['rennes', 'stade rennais'],
  'inter-miami': ['inter miami', 'inter miami cf', 'miami', 'herons'],
  lafc: ['la fc', 'los angeles fc', 'lafc', 'la football club'],
  'la-galaxy': ['la galaxy', 'los angeles galaxy', 'galaxy'],
  'new-york-city-fc': ['nycfc', 'nyc fc', 'new york city fc', 'new york city'],
  'atlanta-united': ['atlanta united', 'atlanta united fc', 'atlanta'],
  'seattle-sounders': ['seattle sounders', 'seattle sounders fc', 'sounders', 'rave green'],
  'austin-fc': ['austin fc', 'verde', 'austin'],
  'cf-montreal': ['cf montreal', 'cf montréal', 'montreal', 'montréal', 'impact'],
  'charlotte-fc': ['charlotte fc', 'charlotte football club', 'crown'],
  'chicago-fire': ['chicago fire', 'chicago fire fc', 'fire'],
  'fc-cincinnati': ['fc cincinnati', 'fcc', 'cincinnati'],
  'colorado-rapids': ['colorado rapids', 'rapids'],
  'columbus-crew': ['columbus crew', 'crew'],
  'dc-united': ['dc united', 'd.c. united', 'united'],
  'fc-dallas': ['fc dallas', 'dallas'],
  'houston-dynamo': ['houston dynamo', 'dynamo'],
  'minnesota-united': ['minnesota united', 'minnesota united fc', 'loons'],
  'nashville-sc': ['nashville sc', 'nashville'],
  'new-england-revolution': ['new england revolution', 'revolution', 'revs'],
  'new-york-red-bulls': ['red bulls', 'ny red bulls', 'new york red bulls'],
  'orlando-city': ['orlando city', 'orlando city sc', 'lions'],
  'philadelphia-union': ['philadelphia union', 'union', 'philly union'],
  'portland-timbers': ['portland timbers', 'timbers'],
  'real-salt-lake': ['real salt lake', 'rsl'],
  'san-diego-fc': ['san diego fc', 'san diego'],
  'san-jose-earthquakes': ['san jose earthquakes', 'quakes', 'earthquakes'],
  'sporting-kansas-city': ['sporting kc', 'sporting kansas city', 'skc'],
  'st-louis-city': ['st louis city', 'st. louis city sc', 'st louis city sc'],
  'toronto-fc': ['toronto fc', 'tfc'],
  'vancouver-whitecaps': ['vancouver whitecaps', 'whitecaps', 'caps'],
  flamengo: ['fla', 'mengao', 'mengão', 'flamengo rio'],
  palmeiras: ['verdao', 'verdão', 'palmeiras sp', 'se palmeiras'],
  corinthians: ['timao', 'timão', 'corinthians sp', 'corinthians paulista'],
  'sao-paulo': ['sao paulo', 'são paulo', 'spfc', 'tricolor paulista'],
  santos: ['peixe', 'santos fc', 'fc santos', 'santos sp'],
  'vasco-da-gama': ['vasco', 'vasco da gama', 'vascao', 'vascão'],
  botafogo: ['bota', 'fogao', 'fogão', 'botafogo rio'],
  gremio: ['gremio porto alegre', 'grêmio', 'tricolor gaucho', 'tricolor gaúcho'],
  internacional: ['inter porto alegre', 'sport club internacional', 'colorado'],
  'atletico-mineiro': ['atletico mineiro', 'atlético mineiro', 'galo', 'cam'],
  'athletico-paranaense': ['athletico', 'athletico pr', 'furacao', 'furacão', 'cap'],
  chapecoense: ['chapeco', 'chape', 'vila nova'],
  cruzeiro: ['cruzeiro mg', 'raposa', 'cabuloso'],
  bahia: ['esporte clube bahia', 'tricolor baiano'],
  vitoria: ['vitoria ec', 'vitória', 'leao da barra', 'leão da barra'],
  fluminense: ['flu', 'tricolor carioca', 'fluminense fc'],
  mirassol: ['mirassol fc', 'leao da serra', 'leão da serra'],
  bragantino: ['red bull bragantino', 'massa bruta', 'rb bragantino'],
  remo: ['clube do remo', 'remo pa', 'azulino'],
  coritiba: ['coxa', 'coritiba fc'],
};

const NATIONAL_TEAM_ALIASES = {
  brazil: ['brasil', 'selecao', 'seleção', 'bra', 'canarinho'],
  france: ['les bleus', 'fra', 'french national team', 'france national team'],
  england: ['three lions', 'eng', 'england national team', 'england nt'],
  spain: ['la roja', 'esp', 'spanish national team', 'spain nt', 'seleccion española'],
  argentina: ['albiceleste', 'arg', 'argentina national team', 'la albiceleste'],
  germany: ['die mannschaft', 'ger', 'german national team', 'deutschland', 'germany nt'],
  netherlands: ['holland', 'ned', 'oranje', 'dutch national team', 'netherlands nt', 'knvb'],
  portugal: ['por', 'portugal national team', 'portugal nt', 'seleção portuguesa', 'selecao portuguesa'],
  italy: ['ita', 'azzurri', 'gli azzurri', 'italy national team', 'italy nt'],
  belgium: ['bel', 'red devils', 'belgium national team', 'belgium nt'],
  croatia: ['hrvatska', 'cro', 'vatreni', 'croatia national team', 'croatia nt'],
  switzerland: ['sui', 'schweiz', 'swiss national team', 'switzerland nt'],
  denmark: ['den', 'dansk', 'danish national team', 'denmark nt'],
  serbia: ['srb', 'serbia national team', 'serbia nt'],
  turkey: ['tur', 'turkiye', 'türkiye', 'turkey national team', 'turkey nt'],
  'united-states': [
    'usa',
    'usmnt',
    'us soccer',
    'united states',
    'american national team',
    'us national team',
  ],
  mexico: ['mex', 'el tri', 'mexico national team', 'mexico nt'],
  uruguay: ['uru', 'celeste', 'la celeste', 'uruguay national team', 'uruguay nt'],
  colombia: ['col', 'cafeteros', 'colombia national team', 'colombia nt'],
  chile: ['chi', 'la roja chile', 'chile national team', 'chile nt'],
  morocco: ['mar', 'atlas lions', 'morocco national team', 'morocco nt'],
  senegal: ['sen', 'lions of teranga', 'senegal national team', 'senegal nt'],
  nigeria: ['nga', 'super eagles', 'nigeria national team', 'nigeria nt'],
  japan: ['jpn', 'samurai blue', 'japan national team', 'japan nt'],
  'korea-republic': ['kor', 'korea republic', 'south korea', 'south korea national team', 'korea nt', 'taegeuk warriors'],
  norway: ['nor', 'norway national team', 'norway nt'],
  sweden: ['swe', 'sweden national team', 'sweden nt', 'blågult'],
  poland: ['pol', 'poland national team', 'poland nt', 'bialo-czerwoni'],
  austria: ['aut', 'austria national team', 'austria nt'],
  czechia: ['cze', 'czech republic', 'czechia national team', 'czech nt'],
  ukraine: ['ukr', 'ukraine national team', 'ukraine nt'],
  wales: ['wal', 'wales national team', 'wales nt', 'cymru'],
  scotland: ['sco', 'scotland national team', 'scotland nt', 'tartan army'],
  'republic-of-ireland': ['roi', 'ireland', 'republic of ireland', 'irish national team', 'ireland nt'],
  ghana: ['gha', 'black stars', 'ghana national team', 'ghana nt'],
  cameroon: ['cmr', 'indomitable lions', 'cameroon national team', 'cameroon nt'],
  egypt: ['egy', 'pharaohs', 'egypt national team', 'egypt nt'],
  algeria: ['alg', 'les fennecs', 'algeria national team', 'algeria nt'],
  tunisia: ['tun', 'eagles of carthage', 'tunisia national team', 'tunisia nt'],
  'cote-divoire': [
    'civ',
    'ivory coast',
    "côte d'ivoire",
    'cote divoire',
    'ivory coast national team',
    'elephants',
  ],
  australia: ['aus', 'socceroos', 'australia national team', 'australia nt'],
  iran: ['irn', 'team melli', 'iran national team', 'iran nt', 'ir iran'],
  'saudi-arabia': ['ksa', 'saudi arabia', 'saudi national team', 'green falcons'],
  qatar: ['qat', 'qatar national team', 'qatar nt', 'maroon'],
  'costa-rica': ['crc', 'los ticos', 'costa rica national team', 'costa rica nt'],
  canada: ['can', 'canada national team', 'canada nt', 'canmnt'],
  paraguay: ['par', 'la albirroja', 'paraguay national team', 'paraguay nt'],
  ecuador: ['ecu', 'la tri', 'ecuador national team', 'ecuador nt'],
  peru: ['per', 'la blanquirroja', 'peru national team', 'peru nt'],
};

const LEAGUE_ALIASES = {
  'premier-league': ['epl', 'prem', 'english premier league'],
  'la-liga': ['laliga', 'spanish league'],
  bundesliga: ['german league'],
  'serie-a': ['serie a', 'italian league'],
  'ligue-1': ['ligue 1', 'ligue1', 'french league'],
  eredivisie: ['dutch league'],
  mls: ['major league soccer', 'mls soccer', 'american soccer league'],
  brasileirao: [
    'brasileirao',
    'brasileirão',
    'serie a brazil',
    'brazilian league',
    'campeonato brasileiro',
    'brazil league',
    'serie a brasil',
    'campeonato brasileiro serie a',
  ],
  external: [
    'international club stubs',
    'international clubs',
    'national team clubs',
    'external stubs',
    'external clubs',
  ],
};

const PLAYER_ALIASES = {
  vinicius: ['vini', 'vini jr', 'vini junior', 'vinicius jr', 'vinicius junior', 'vinícius'],
  'de-bruyne': ['kdb', 'kevin de bruyne', 'de bruyne'],
  trent: ['taa', 'trent alexander arnold'],
  'ter-stegen': ['ter stegen', 'marc andre ter stegen'],
  alisson: ['alisson becker'],
  lautaro: ['lautaro martinez'],
  leao: ['rafael leao'],
  lewandowski: ['lewy', 'lewa'],
  bellingham: ['jude bellingham', 'jude'],
  'tm-91845': ['son', 'heung min son', 'sonny'],
  'tm-315779': ['puli', 'pulisic', 'captain america'],
  haaland: ['erling haaland', 'erling'],
  saka: ['bukayo saka', 'bukayo'],
  kane: ['harry kane', 'harry'],
  rodri: ['rodri hernandez', 'rodri hernández'],
  salah: ['mo salah', 'mohamed salah'],
  'van-dijk': ['vvd', 'virgil van dijk', 'virgil'],
  rice: ['declan rice'],
  foden: ['phil foden'],
  musiala: ['jamal musiala'],
  kimmich: ['joshua kimmich'],
  saliba: ['william saliba'],
  maignan: ['mike maignan'],
  modric: ['luka modric', 'luka modrick', 'modrick'],
  pedri: ['pedri gonzalez', 'pedri gonzález'],
  gavi: ['pablo gavi', 'pablo martin gavi'],
  // MLS wave 1 — editorial quiz stars (sourceId keys = player.id in app data)
  'tm-28003': ['messi', 'leo messi', 'lionel messi'],
  'tm-44352': ['suarez', 'luis suarez', 'el pistolero'],
  'tm-255901': ['de paul', 'rodri de paul', 'rodrigo de paul'],
  'tm-236045': ['bouanga', 'denis bouanga'],
  'tm-35207': ['marco reus', 'reus'],
  'tm-331511': ['puig', 'riqui puig'],
  'tm-337807': ['jordan morris', 'morris'],
  'tm-354792': ['cristian roldan', 'roldan'],
  'tm-255450': ['miranchuk', 'aleksey miranchuk'],
  'tm-251029': ['lobjanidze', 'saba lobjanidze'],
  // Brasileirão wave 1 — quiz stars (tm-* ids)
  'tm-353108': ['bruno henrique', 'bruno'],
  'tm-248410': ['arrascaeta', 'de arrascaeta', 'giorgian arrascaeta'],
  'tm-444523': ['paqueta', 'paquetá', 'lucas paqueta'],
  'tm-432895': ['pedro', 'pedro flamengo'],
  'tm-203394': ['andreas pereira', 'pereira'],
  'tm-159372': ['felipe anderson'],
  'tm-215390': ['gustavo gomez', 'gomez', 'gustavo gómez'],
  'tm-943837': ['vitor roque', 'roque'],
  'tm-208681': ['gustavo henrique'],
  'tm-594226': ['matheuzinho'],
  'tm-167850': ['memphis', 'memphis depay'],
  'tm-489893': ['yuri alberto'],
  'tm-284727': ['calleri', 'jonathan calleri'],
  'tm-223560': ['luciano', 'luciano sao paulo'],
  'tm-468301': ['marcos antonio', 'marcos antônio'],
  'tm-68097': ['rafael', 'rafael sao paulo'],
  'tm-244275': ['gabigol', 'gabriel barbosa'],
  'tm-68290': ['neymar'],
  'tm-371009': ['rony'],
  'tm-225432': ['ze rafael', 'zé rafael'],
  // MLS wave 1 — remaining quiz stars
  'tm-793361': ['ajani fortune', 'fortune'],
  'tm-661269': ['galarza', 'matias galarza'],
  'tm-282429': ['reguilon', 'reguilón', 'sergio reguilon'],
  'tm-498862': ['joao klauss', 'klauss'],
  'tm-81789': ['maya yoshida', 'yoshida'],
  'tm-271072': ['aaron long'],
  'tm-446093': ['ryan porteous', 'porteous'],
  'tm-203330': ['tyler boyd'],
  'tm-43228': ['rusnak', 'albert rusnak'],
  'tm-189876': ['paul arriola', 'arriola'],
};

function aliasesFor(map, id) {
  return map[id] ?? [];
}

export function getTeamAliases(teamId) {
  return aliasesFor(TEAM_ALIASES, teamId);
}

export function getLeagueAliases(leagueId) {
  return aliasesFor(LEAGUE_ALIASES, leagueId);
}

export function getPlayerAliases(playerId) {
  return aliasesFor(PLAYER_ALIASES, playerId);
}

export function getNationalTeamAliases(nationalTeamId) {
  return aliasesFor(NATIONAL_TEAM_ALIASES, nationalTeamId);
}

export function getNationalTeamSearchFields(nationalTeam) {
  return [
    nationalTeam.displayName,
    nationalTeam.country,
    nationalTeam.confederation,
    ...getNationalTeamAliases(nationalTeam.id),
    ...(nationalTeam.searchAliases ?? []),
  ];
}

export function getTeamSearchFields(team, getLeagueName) {
  return [
    team.name,
    team.country,
    getLeagueName?.(team.leagueId),
    ...getTeamAliases(team.id),
    ...getLeagueAliases(team.leagueId),
  ];
}

export function getLeagueSearchFields(league) {
  return [league.name, league.country, ...getLeagueAliases(league.id)];
}

/** Compact nicknames → single player id (unambiguous editorial stars). */
const PLAYER_NICKNAME_IDS = {
  kdb: 'de-bruyne',
  vini: 'vinicius',
  lewa: 'lewandowski',
  lewy: 'lewandowski',
  son: 'tm-91845',
  puli: 'tm-315779',
  mo: 'salah',
  taa: 'trent',
  vvd: 'van-dijk',
};

export function getNicknamePlayerId(normalizedQuery) {
  const compact = compactForSearch(normalizedQuery);
  if (!compact || compact.length < 2) return null;
  return PLAYER_NICKNAME_IDS[compact] ?? null;
}

export function getCollectionSearchFields(collection) {
  return [
    collection.title,
    collection.description,
    ...(collection.tags ?? []),
    collection.difficulty,
  ].filter(Boolean);
}

export function getPlayerSearchFields(player, helpers = {}) {
  const teamName = helpers.getTeamName?.(player.teamId);
  const leagueName = helpers.getLeagueName?.(player.leagueId);

  return [
    player.name,
    ...getPlayerAliases(player.id),
    ...(player.aliases ?? []),
    teamName,
    leagueName,
    player.nationality,
    player.nationalTeam,
    ...getTeamAliases(player.teamId),
    ...getLeagueAliases(player.leagueId),
  ];
}
