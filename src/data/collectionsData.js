// Curated learning playlists — references only IDs from sampleData.js.

export const collections = [
  {
    id: 'learn-premier-league',
    title: 'Learn the Premier League',
    description:
      'League context, three flagship clubs, and headline quiz-ready players to anchor names.',
    difficulty: 'Beginner',
    tags: ['League', 'England', 'Path'],
    quizLaunch: { leagueId: 'premier-league' },
    items: [
      {
        type: 'league',
        id: 'premier-league',
        note: '20 clubs, three points per win — England’s fastest-paced top division.',
      },
      {
        type: 'team',
        id: 'arsenal',
        note: 'North London club known for youth, pressing, and Bukayo Saka.',
      },
      {
        type: 'team',
        id: 'manchester-city',
        note: 'Possession-heavy champions; link Erling Haaland to this side.',
      },
      {
        type: 'team',
        id: 'liverpool',
        note: 'Anfield atmosphere and Mohamed Salah on the right.',
      },
      {
        type: 'player',
        id: 'saka',
        note: 'Arsenal RW — England star and Hale End graduate.',
      },
      {
        type: 'player',
        id: 'salah',
        note: 'Liverpool’s inverted winger; prolific Premier League scorer.',
      },
      {
        type: 'player',
        id: 'haaland',
        note: 'City’s main striker — tall, direct, and clinical in the box.',
      },
    ],
  },
  {
    id: 'wonderkids',
    title: 'Wonderkids',
    description:
      'Eight young quiz-ready stars (age 23 or under) — learn who they play for before they become household names.',
    difficulty: 'Beginner',
    tags: ['Youth', 'Future', 'Players'],
    quizLaunch: null,
    items: [
      {
        type: 'player',
        id: 'bellingham',
        note: 'Real Madrid — box-to-box goals and leadership at 22.',
      },
      {
        type: 'player',
        id: 'pedri',
        note: 'Barcelona technician — Spain’s midfield compass.',
      },
      {
        type: 'player',
        id: 'gavi',
        note: 'La Masia firebrand — pressing and bite beside Pedri.',
      },
      {
        type: 'player',
        id: 'musiala',
        note: 'Bayern playmaker — dribbles between lines in the Bundesliga.',
      },
      {
        type: 'player',
        id: 'foden',
        note: 'Man City №47 — one-club academy graduate in sky blue.',
      },
      {
        type: 'player',
        id: 'saka',
        note: 'Arsenal №7 — right wing and England regular.',
      },
      {
        type: 'player',
        id: 'tm-420243',
        note: 'Jurriën Timber — Arsenal defender poached from Ajax.',
      },
      {
        type: 'player',
        id: 'tm-636688',
        note: 'Alejandro Balde — Barcelona left-back from La Masia.',
      },
    ],
  },
  {
    id: 'ballon-dor-winners',
    title: "Ballon d'Or Winners",
    description:
      'Quiz-ready men who have won the Ballon d’Or in the FootyCompass database — trophies, clubs, and playing roles.',
    difficulty: 'Advanced',
    tags: ['Awards', 'History', 'Players'],
    quizLaunch: null,
    items: [
      {
        type: 'player',
        id: 'modric',
        note: '2018 winner — Madrid and Croatia’s midfield metronome.',
      },
      {
        type: 'player',
        id: 'rodri',
        note: '2024 winner — Manchester City pivot and Spain anchor.',
      },
      {
        type: 'player',
        id: 'lewandowski',
        note: '2020 Ballon d’Or — Bayern legend now at Barcelona.',
      },
    ],
  },
  {
    id: 'ucl-legends',
    title: 'UCL Legends',
    description:
      'Eight Champions League-era players in the quiz pool — tie names to clubs before knockout trivia.',
    difficulty: 'Advanced',
    tags: ['Europe', 'Champions League', 'Players'],
    quizLaunch: { teamId: 'real-madrid' },
    items: [
      {
        type: 'player',
        id: 'modric',
        note: 'Five Champions League titles with Real Madrid — calm on the ball.',
      },
      {
        type: 'player',
        id: 'vinicius',
        note: 'Madrid left wing — pace and big-game goals in Europe.',
      },
      {
        type: 'player',
        id: 'courtois',
        note: 'Belgium keeper — Man of the Match in Paris 2022.',
      },
      {
        type: 'player',
        id: 'valverde',
        note: 'Madrid engine — covers every blade of grass in midfield.',
      },
      {
        type: 'player',
        id: 'rodri',
        note: 'City 2023 winner — controlled the final against Inter.',
      },
      {
        type: 'player',
        id: 'van-dijk',
        note: 'Liverpool 2019 winner — organises the defensive line.',
      },
      {
        type: 'player',
        id: 'lautaro',
        note: 'Inter №9 — 2023 finalist and Serie A goal machine.',
      },
      {
        type: 'player',
        id: 'tm-86202',
        note: 'Antonio Rüdiger — Madrid centre-back after Chelsea and Germany.',
      },
    ],
  },
  {
    id: 'premier-league-icons',
    title: 'Premier League Icons',
    description:
      'Ten quiz-ready Premier League headliners — the names fans argue about every weekend.',
    difficulty: 'Intermediate',
    tags: ['Premier League', 'England', 'Players'],
    quizLaunch: { leagueId: 'premier-league' },
    items: [
      {
        type: 'player',
        id: 'haaland',
        note: 'City striker — volume finisher and Premier League record pace.',
      },
      {
        type: 'player',
        id: 'salah',
        note: 'Liverpool RW — left-foot curlers from the right channel.',
      },
      {
        type: 'player',
        id: 'saka',
        note: 'Arsenal №7 — academy graduate and England star.',
      },
      {
        type: 'player',
        id: 'odegaard',
        note: 'Arsenal captain — playmaker between the lines.',
      },
      {
        type: 'player',
        id: 'rice',
        note: 'Arsenal DM — screens defence and drives transitions.',
      },
      {
        type: 'player',
        id: 'van-dijk',
        note: 'Liverpool CB — aerial dominance and leadership.',
      },
      {
        type: 'player',
        id: 'foden',
        note: 'City №47 — local academy star in sky blue.',
      },
      {
        type: 'player',
        id: 'rodri',
        note: 'City pivot — tempo control and late-box arrivals.',
      },
      {
        type: 'player',
        id: 'tm-349066',
        note: 'Alexander Isak — Liverpool striker after Newcastle.',
      },
      {
        type: 'player',
        id: 'tm-451276',
        note: 'Dominik Szoboszlai — Liverpool creator from Hungary.',
      },
    ],
  },
  {
    id: 'one-club-players',
    title: 'One-Club Players',
    description:
      'Loyalty stories — quiz-ready players whose FootyCompass career arc stays at one senior club.',
    difficulty: 'Intermediate',
    tags: ['Loyalty', 'Culture', 'Players'],
    quizLaunch: null,
    items: [
      {
        type: 'player',
        id: 'foden',
        note: 'Manchester City — Stockport kid in sky blue since the academy.',
      },
      {
        type: 'player',
        id: 'saka',
        note: 'Arsenal — Hale End graduate and north London symbol.',
      },
      {
        type: 'player',
        id: 'trent',
        note: 'Liverpool — Scouse academy full-back and set-piece master.',
      },
      {
        type: 'player',
        id: 'gavi',
        note: 'Barcelona — La Masia midfielder in blaugrana stripes.',
      },
      {
        type: 'player',
        id: 'tm-255508',
        note: 'Iñaki Williams — Athletic Bilbao winger and Basque identity.',
      },
      {
        type: 'player',
        id: 'tm-125781',
        note: 'Antoine Griezmann — Atlético Madrid’s modern symbol up front.',
      },
    ],
  },
  {
    id: 'free-kick-specialists',
    title: 'Free-Kick Specialists',
    description:
      'Dead-ball artists in the quiz pool — learn their clubs and nationalities before set-piece quizzes.',
    difficulty: 'Intermediate',
    tags: ['Set pieces', 'Skills', 'Players'],
    quizLaunch: null,
    items: [
      {
        type: 'player',
        id: 'trent',
        note: 'Liverpool — whipped corners and free-kicks from the right.',
      },
      {
        type: 'player',
        id: 'tm-193082',
        note: 'Alejandro Grimaldo — Leverkusen left-back and set-piece scorer.',
      },
      {
        type: 'player',
        id: 'tm-126414',
        note: 'Hakan Çalhanoğlu — Inter playmaker and Turkey free-kick taker.',
      },
      {
        type: 'player',
        id: 'tm-451276',
        note: 'Dominik Szoboszlai — Liverpool — long-range shooting and curlers.',
      },
      {
        type: 'player',
        id: 'tm-240306',
        note: 'Bruno Fernandes — Man United — penalties and dipping free-kicks.',
      },
      {
        type: 'player',
        id: 'tm-294057',
        note: 'James Maddison — Spurs — left-foot strikes from range.',
      },
      {
        type: 'player',
        id: 'tm-320748',
        note: 'Sebastian Szymanski — Rennes — Poland set-piece specialist.',
      },
    ],
  },
  {
    id: 'arsenal-core-players',
    title: 'Arsenal Core Players',
    description:
      'Club profile first, then five quiz-ready Gunners who define the current squad.',
    difficulty: 'Intermediate',
    tags: ['Club', 'Premier League', 'Path'],
    quizLaunch: { teamId: 'arsenal' },
    items: [
      {
        type: 'team',
        id: 'arsenal',
        note: 'North London identity, pressing style, and rivalry with Spurs.',
      },
      {
        type: 'player',
        id: 'saka',
        note: 'Right winger — dribbling, crossing, and England caps.',
      },
      {
        type: 'player',
        id: 'odegaard',
        note: 'Captain and №10 — links play between midfield and attack.',
      },
      {
        type: 'player',
        id: 'saliba',
        note: 'Centre-back — calm on the ball, strong in duels.',
      },
      {
        type: 'player',
        id: 'rice',
        note: 'Defensive midfielder — screens the back line and recycles possession.',
      },
      {
        type: 'player',
        id: 'jesus',
        note: 'Striker — presses from the front and drops to link play.',
      },
    ],
  },
  {
    id: 'tactical-midfielders',
    title: 'Tactical Midfielders',
    description:
      'Six pivot and playmaker profiles — learn roles, clubs, and hints before a club-scoped quiz.',
    difficulty: 'Intermediate',
    tags: ['Midfield', 'Tactics', 'Path'],
    quizLaunch: { teamId: 'manchester-city' },
    items: [
      {
        type: 'player',
        id: 'rodri',
        note: 'Man City №16 — screens, recycles, and controls tempo.',
      },
      {
        type: 'player',
        id: 'modric',
        note: 'Real Madrid — press-resistant metronome and UCL pedigree.',
      },
      {
        type: 'player',
        id: 'pedri',
        note: 'Barcelona — La Masia technician, Spain’s midfield compass.',
      },
      {
        type: 'player',
        id: 'kimmich',
        note: 'Bayern — right-back or midfield, switches play quickly.',
      },
      {
        type: 'player',
        id: 'rice',
        note: 'Arsenal — defensive midfield anchor after West Ham.',
      },
      {
        type: 'player',
        id: 'odegaard',
        note: 'Arsenal №8 — between-the-lines creator and set-piece taker.',
      },
    ],
  },
  {
    id: 'ucl-clubs',
    title: 'UCL Club Identity',
    description:
      'Six European giants in FootyCompass — open each club page before knockout-era player quizzes.',
    difficulty: 'Intermediate',
    tags: ['Champions League', 'Clubs', 'Path'],
    quizLaunch: { teamId: 'real-madrid' },
    items: [
      {
        type: 'team',
        id: 'real-madrid',
        note: 'Record European Cup haul — galáctico eras and Bernabéu nights.',
      },
      {
        type: 'team',
        id: 'barcelona',
        note: 'La Masia, tiki-taka identity, and El Clásico rivalry.',
      },
      {
        type: 'team',
        id: 'bayern-munich',
        note: 'Bundesliga dominance and Munich’s European standard.',
      },
      {
        type: 'team',
        id: 'liverpool',
        note: 'Anfield European nights — 2019 and 2022 finals in living memory.',
      },
      {
        type: 'team',
        id: 'manchester-city',
        note: 'Pep-era possession and 2023 Champions League breakthrough.',
      },
      {
        type: 'team',
        id: 'inter-milan',
        note: 'Serie A structure — 2023 finalist and Italian defensive tradition.',
      },
    ],
  },
  {
    id: 'world-cup-watchlist',
    title: 'World Cup Watchlist',
    description:
      'All five live FootyCompass national teams for 2026 prep — open each country page before knockout quizzes.',
    difficulty: 'Beginner',
    tags: ['World Cup', 'National teams', '2026'],
    quizLaunch: { nationalTeamId: 'brazil' },
    items: [
      { type: 'national-team', id: 'brazil', note: 'Seleção — five World Cups, yellow shirts.' },
      { type: 'national-team', id: 'argentina', note: 'Albiceleste — 2022 winners in Qatar.' },
      { type: 'national-team', id: 'france', note: 'Les Bleus — 2018 winners, 2022 finalists.' },
      { type: 'national-team', id: 'england', note: 'Three Lions — Euro 2024 finalists.' },
      { type: 'national-team', id: 'spain', note: 'La Roja — Euro 2024 champions.' },
    ],
  },
  {
    id: 'world-cup-2026-contenders',
    title: 'World Cup 2026 Contenders',
    description:
      'One headline quiz-ready player per live contender — club form tied to national-team pages in the database.',
    difficulty: 'Intermediate',
    tags: ['World Cup', '2026', 'National teams'],
    quizLaunch: { nationalTeamId: 'france' },
    items: [
      { type: 'national-team', id: 'brazil', note: 'CONMEBOL heavyweight — start with the squad list.' },
      { type: 'player', id: 'tm-412363', note: 'Rodrygo — Brazil winger at Real Madrid.' },
      { type: 'national-team', id: 'argentina', note: 'Defending World Cup champions.' },
      { type: 'player', id: 'lautaro', note: 'Lautaro Martínez — Argentina’s Inter striker.' },
      { type: 'national-team', id: 'france', note: '2018 winners building toward 2026.' },
      { type: 'player', id: 'tm-640428', note: 'Eduardo Camavinga — France midfielder at Madrid.' },
      { type: 'national-team', id: 'england', note: 'Three Lions with a deep linked pool.' },
      { type: 'player', id: 'tm-479999', note: 'Eberechi Eze — England creator at Arsenal.' },
      { type: 'national-team', id: 'spain', note: 'Euro 2024 champions in red.' },
      { type: 'player', id: 'tm-338424', note: 'Mikel Merino — Spain box-to-box star.' },
    ],
  },
  {
    id: 'world-cup-recent-winners',
    title: 'World Cup Recent Winners',
    description:
      'Argentina, France, and Spain — last three men’s world or continental champions with linked quiz-ready names.',
    difficulty: 'Advanced',
    tags: ['World Cup', 'History', 'National teams'],
    quizLaunch: { nationalTeamId: 'argentina' },
    items: [
      { type: 'national-team', id: 'argentina', note: '2022 World Cup — Messi era trophy in Qatar.' },
      { type: 'player', id: 'tm-348795', note: 'Giovani Lo Celso — 2022 squad playmaker.' },
      { type: 'national-team', id: 'france', note: '2018 World Cup winners in Russia.' },
      { type: 'player', id: 'tm-344381', note: 'Christopher Nkunku — 2018 France squad.' },
      { type: 'national-team', id: 'spain', note: '2010 World Cup plus Euro 2024.' },
      { type: 'player', id: 'tm-85288', note: 'Isco — South Africa 2010 winner.' },
      { type: 'player', id: 'tm-351809', note: 'Robin Le Normand — Euro 2024 Spain starter.' },
    ],
  },
  {
    id: 'european-national-team-stars',
    title: 'European National Team Stars',
    description:
      'England, France, and Germany national pages plus quiz-ready players with live national-team links.',
    difficulty: 'Intermediate',
    tags: ['Europe', 'UEFA', 'National teams'],
    quizLaunch: { nationalTeamId: 'england' },
    items: [
      { type: 'national-team', id: 'england', note: 'Three Lions — open the full squad list.' },
      { type: 'national-team', id: 'france', note: 'Les Bleus — rivals Germany in FootyCompass.' },
      { type: 'national-team', id: 'germany', note: 'Die Mannschaft — pressing and pedigree.' },
      { type: 'player', id: 'bellingham', note: 'England — Real Madrid, leadership in midfield.' },
      { type: 'player', id: 'kane', note: 'England — target striker, link play.' },
      { type: 'player', id: 'saka', note: 'England — Arsenal right wing.' },
      { type: 'player', id: 'musiala', note: 'Germany — Bayern, dribbles between lines.' },
      { type: 'player', id: 'kimmich', note: 'Germany — tempo and switches of play.' },
      { type: 'player', id: 'saliba', note: 'France — Arsenal defensive anchor.' },
      { type: 'player', id: 'maignan', note: 'France — Milan goalkeeper.' },
    ],
  },
  {
    id: 'south-american-stars',
    title: 'South American Stars',
    description:
      'Brazil and Argentina national pages plus quiz-ready players with live Seleção / Albiceleste links.',
    difficulty: 'Intermediate',
    tags: ['CONMEBOL', 'Brazil', 'National teams'],
    quizLaunch: { nationalTeamId: 'brazil' },
    items: [
      { type: 'national-team', id: 'brazil', note: 'Seleção — five World Cups, yellow shirts.' },
      { type: 'national-team', id: 'argentina', note: 'Albiceleste — 2022 World Cup winners.' },
      { type: 'player', id: 'vinicius', note: 'Madrid LW — pace and big-game goals.' },
      { type: 'player', id: 'lautaro', note: 'Inter №9 — Argentina’s main striker in the quiz pool.' },
      { type: 'player', id: 'tm-412363', note: 'Rodrygo — Real Madrid winger, Qatar 2022.' },
      { type: 'player', id: 'tm-348795', note: 'Giovani Lo Celso — Betis playmaker, 2022 winner.' },
    ],
  },
  {
    id: 'brazil-stars',
    title: 'Brazil Stars',
    description:
      'Live Seleção page and linked quiz-ready Brazilians — Madrid forwards, Premier League no. 9s, and midfield engines.',
    difficulty: 'Intermediate',
    tags: ['Brazil', 'CONMEBOL', 'National teams'],
    quizLaunch: { nationalTeamId: 'brazil' },
    items: [
      { type: 'national-team', id: 'brazil', note: 'Open the full linked squad — yellow shirts, five World Cups.' },
      { type: 'player', id: 'tm-412363', note: 'Rodrygo — Real Madrid winger, 2022 World Cup.' },
      { type: 'player', id: 'tm-401530', note: 'Éder Militão — Madrid centre-back, Copa América 2019.' },
      { type: 'player', id: 'tm-378710', note: 'Richarlison — Spurs striker, famous Qatar goals.' },
      { type: 'player', id: 'tm-626724', note: 'João Pedro — Chelsea centre-forward in the Seleção pool.' },
      { type: 'player', id: 'tm-203394', note: 'Andreas Pereira — Fulham creator, Brazil midfield link.' },
    ],
  },
  {
    id: 'argentina-icons',
    title: 'Argentina Icons',
    description:
      'Albiceleste squad page and headline linked quiz-ready Argentina players — strikers, creators, and defenders.',
    difficulty: 'Intermediate',
    tags: ['Argentina', 'CONMEBOL', 'National teams'],
    quizLaunch: { nationalTeamId: 'argentina' },
    items: [
      { type: 'national-team', id: 'argentina', note: 'La Albiceleste — 2022 World Cup winners in blue and white.' },
      { type: 'player', id: 'lautaro', note: 'Inter striker — Argentina’s primary goal threat.' },
      { type: 'player', id: 'tm-348795', note: 'Giovani Lo Celso — creative midfielder, Qatar 2022.' },
      { type: 'player', id: 'tm-321247', note: 'Emiliano Buendía — Villa playmaker, full name in hints.' },
      { type: 'player', id: 'tm-480763', note: 'Juan Foyth — versatile defender after Villarreal.' },
      { type: 'player', id: 'tm-474800', note: 'Facundo Medina — Marseille centre-back, 2022 squad.' },
    ],
  },
  {
    id: 'england-core',
    title: 'England Core',
    description:
      'Three Lions page plus headline linked quiz-ready England players — academy grads, full-backs, and Euro 2024 names.',
    difficulty: 'Intermediate',
    tags: ['England', 'UEFA', 'National teams'],
    quizLaunch: { nationalTeamId: 'england' },
    items: [
      { type: 'national-team', id: 'england', note: 'Three Lions — Wembley, white shirts, 1966 pedigree.' },
      { type: 'player', id: 'foden', note: 'Man City №47 — one-club star and England creator.' },
      { type: 'player', id: 'trent', note: 'Real Madrid full-back — set pieces and Scouse roots.' },
      { type: 'player', id: 'tm-479999', note: 'Eberechi Eze — Arsenal playmaker, Euro 2024 squad.' },
      { type: 'player', id: 'tm-324358', note: 'Ollie Watkins — Aston Villa striker, penalty-box runs.' },
      { type: 'player', id: 'tm-472423', note: 'Reece James — Chelsea-born right-back when fit.' },
    ],
  },
  {
    id: 'france-world-cup-talent',
    title: 'France World Cup Talent',
    description:
      'Les Bleus page and linked quiz-ready France stars with World Cup or major-tournament pedigree.',
    difficulty: 'Intermediate',
    tags: ['France', 'UEFA', 'World Cup', 'National teams'],
    quizLaunch: { nationalTeamId: 'france' },
    items: [
      { type: 'national-team', id: 'france', note: 'Les Bleus — 2018 World Cup winners, 2022 finalists.' },
      { type: 'player', id: 'tm-640428', note: 'Eduardo Camavinga — Real Madrid, Qatar 2022 final.' },
      { type: 'player', id: 'tm-344381', note: 'Christopher Nkunku — 2018 winner, Leipzig to Milan arc.' },
      { type: 'player', id: 'tm-487969', note: 'Randal Kolo Muani — 2022 final substitute, full surname.' },
      { type: 'player', id: 'tm-709726', note: 'Hugo Ekitiké — France striker now at Liverpool.' },
      { type: 'player', id: 'tm-353366', note: 'Benjamin Pavard — versatile defender, 2018 World Cup.' },
    ],
  },
  {
    id: 'spain-midfield-masters',
    title: 'Spain Midfield Masters',
    description:
      'La Roja page and linked quiz-ready Spanish midfielders — Euro 2024 core and creative veterans.',
    difficulty: 'Intermediate',
    tags: ['Spain', 'UEFA', 'Midfield', 'National teams'],
    quizLaunch: { nationalTeamId: 'spain' },
    items: [
      { type: 'national-team', id: 'spain', note: 'La Roja — Euro 2024 champions, red shirts.' },
      { type: 'player', id: 'tm-338424', note: 'Mikel Merino — Euro 2024 hero, Arsenal box-to-box.' },
      { type: 'player', id: 'tm-350219', note: 'Fabián Ruiz — PSG metronome, 2024 European champion.' },
      { type: 'player', id: 'gavi', note: 'Barcelona — La Masia presser beside Pedri.' },
      { type: 'player', id: 'tm-85288', note: 'Isco — 2010 World Cup winner, Betis flair.' },
    ],
  },
  {
    id: 'press-resistant-midfielders',
    title: 'Press-resistant midfielders',
    description:
      'Eight quiz-ready pivots and controllers — learn who shields, recycles, and survives the press before a club-scoped quiz.',
    difficulty: 'Advanced',
    tags: ['Tactics', 'Midfield', 'Players'],
    quizLaunch: { teamId: 'manchester-city' },
    items: [
      {
        type: 'player',
        id: 'rodri',
        note: 'Man City №16 — tempo setter and 2023 Champions League final anchor.',
      },
      {
        type: 'player',
        id: 'modric',
        note: 'Real Madrid — body feints, outside-foot passes, UCL metronome.',
      },
      {
        type: 'player',
        id: 'pedri',
        note: 'Barcelona — La Masia technician; Spain’s press-resistant link.',
      },
      {
        type: 'player',
        id: 'rice',
        note: 'Arsenal DM — screens, carries, and wins second balls.',
      },
      {
        type: 'player',
        id: 'kimmich',
        note: 'Bayern — switches play from midfield or right-back.',
      },
      {
        type: 'player',
        id: 'valverde',
        note: 'Madrid engine — covers ground, drives transitions.',
      },
      {
        type: 'player',
        id: 'tm-640428',
        note: 'Eduardo Camavinga — France & Madrid — multi-positional ball carrier.',
      },
      {
        type: 'player',
        id: 'tm-326330',
        note: 'Frenkie de Jong — Barcelona pivot — line-breaking passes.',
      },
    ],
  },
  {
    id: 'elite-playmakers',
    title: 'Elite playmakers',
    description:
      'Eight №10s and creators in the quiz pool — tie names to clubs before hint-based guessing.',
    difficulty: 'Advanced',
    tags: ['Tactics', 'Creators', 'Players'],
    quizLaunch: { leagueId: 'premier-league' },
    items: [
      {
        type: 'player',
        id: 'de-bruyne',
        note: 'Man City — through balls, set pieces, and outside-foot crosses.',
      },
      {
        type: 'player',
        id: 'odegaard',
        note: 'Arsenal captain — between-the-lines passes and final-third vision.',
      },
      {
        type: 'player',
        id: 'musiala',
        note: 'Bayern — dribbles between lines in the half-spaces.',
      },
      {
        type: 'player',
        id: 'bellingham',
        note: 'Real Madrid — late runs and leadership from midfield.',
      },
      {
        type: 'player',
        id: 'foden',
        note: 'Man City №47 — tight-space technician and England creator.',
      },
      {
        type: 'player',
        id: 'tm-479999',
        note: 'Eberechi Eze — Arsenal playmaker — left-footed final passes.',
      },
      {
        type: 'player',
        id: 'tm-348795',
        note: 'Giovani Lo Celso — Betis — Argentina creator, 2022 World Cup.',
      },
      {
        type: 'player',
        id: 'tm-240306',
        note: 'Bruno Fernandes — Man United — penalties and through balls.',
      },
    ],
  },
  {
    id: 'modern-full-backs',
    title: 'Modern full-backs',
    description:
      'Seven overlapping full-backs in the quiz pool — width, inversion, and set-piece threat.',
    difficulty: 'Advanced',
    tags: ['Tactics', 'Defenders', 'Players'],
    quizLaunch: { teamId: 'real-madrid' },
    items: [
      {
        type: 'player',
        id: 'trent',
        note: 'Real Madrid RB — whipped deliveries after Liverpool.',
      },
      {
        type: 'player',
        id: 'tm-420243',
        note: 'Jurriën Timber — Arsenal right-back — Ajax pedigree.',
      },
      {
        type: 'player',
        id: 'tm-398073',
        note: 'Achraf Hakimi — PSG — pace on the right flank.',
      },
      {
        type: 'player',
        id: 'tm-193082',
        note: 'Alejandro Grimaldo — Leverkusen LB — goals and set pieces.',
      },
      {
        type: 'player',
        id: 'tm-424204',
        note: 'Alphonso Davies — Bayern — Canada star, recovery speed.',
      },
      {
        type: 'player',
        id: 'tm-636688',
        note: 'Alejandro Balde — Barcelona — La Masia left-back.',
      },
      {
        type: 'player',
        id: 'tm-138927',
        note: 'Daniel Carvajal — Madrid — five Champions League titles.',
      },
    ],
  },
  {
    id: 'ball-playing-center-backs',
    title: 'Ball-playing center backs',
    description:
      'Seven calm defenders who step into midfield — learn clubs and nationalities before positional quizzes.',
    difficulty: 'Advanced',
    tags: ['Tactics', 'Defenders', 'Players'],
    quizLaunch: { teamId: 'arsenal' },
    items: [
      {
        type: 'player',
        id: 'saliba',
        note: 'Arsenal — aerial presence and composure in build-up.',
      },
      {
        type: 'player',
        id: 'van-dijk',
        note: 'Liverpool — organises the line; 2019 Champions League winner.',
      },
      {
        type: 'player',
        id: 'bastoni',
        note: 'Inter — left-sided centre-back who carries forward.',
      },
      {
        type: 'player',
        id: 'tm-475959',
        note: 'Josko Gvardiol — Man City — left-footed progressive defender.',
      },
      {
        type: 'player',
        id: 'tm-962110',
        note: 'Pau Cubarsí — Barcelona — teenage La Masia centre-back.',
      },
      {
        type: 'player',
        id: 'tm-401530',
        note: 'Éder Militão — Real Madrid — Brazil centre-back, Copa América 2019.',
      },
      {
        type: 'player',
        id: 'tm-86202',
        note: 'Antonio Rüdiger — Madrid — aggressive duels after Chelsea.',
      },
    ],
  },
  {
    id: 'world-cup-stars',
    title: 'World Cup stars',
    description:
      'Eight headline men’s World Cup names in the quiz pool — tournament pedigree, clubs, and national teams.',
    difficulty: 'Advanced',
    tags: ['World Cup', 'History', 'Players'],
    quizLaunch: { nationalTeamId: 'argentina' },
    items: [
      {
        type: 'player',
        id: 'tm-28003',
        note: 'Lionel Messi — Argentina — 2022 World Cup winner in Qatar.',
      },
      {
        type: 'player',
        id: 'lautaro',
        note: 'Lautaro Martínez — Inter striker — Argentina’s main goal threat.',
      },
      {
        type: 'player',
        id: 'tm-111873',
        note: 'Emiliano Martínez — Aston Villa keeper — 2022 Golden Glove.',
      },
      {
        type: 'player',
        id: 'kane',
        note: 'Harry Kane — England №9 — set pieces and link play.',
      },
      {
        type: 'player',
        id: 'van-dijk',
        note: 'Virgil van Dijk — Netherlands — 2019 UCL, 2022 World Cup knockouts.',
      },
      {
        type: 'player',
        id: 'vinicius',
        note: 'Vinícius Júnior — Brazil winger — Madrid and Seleção flair.',
      },
      {
        type: 'player',
        id: 'tm-353366',
        note: 'Benjamin Pavard — France — 2018 World Cup winner, versatile defender.',
      },
      {
        type: 'player',
        id: 'tm-412363',
        note: 'Rodrygo — Brazil & Madrid — 2022 World Cup squad winger.',
      },
    ],
  },
  {
    id: 'champions-league-veterans',
    title: 'Champions League veterans',
    description:
      'Eight European-night headliners with deep UCL pedigree — complementary to UCL Legends, focused on multi-club stars.',
    difficulty: 'Advanced',
    tags: ['Champions League', 'Europe', 'Players'],
    quizLaunch: { teamId: 'real-madrid' },
    items: [
      {
        type: 'player',
        id: 'modric',
        note: 'Luka Modrić — five Champions League titles with Real Madrid.',
      },
      {
        type: 'player',
        id: 'haaland',
        note: 'Erling Haaland — City — knockout-phase goal machine.',
      },
      {
        type: 'player',
        id: 'kane',
        note: 'Harry Kane — Bayern — prolific Champions League scorer.',
      },
      {
        type: 'player',
        id: 'lewandowski',
        note: 'Robert Lewandowski — Barcelona — former Bayern UCL talisman.',
      },
      {
        type: 'player',
        id: 'de-bruyne',
        note: 'Kevin De Bruyne — City — assists in Pep’s European campaigns.',
      },
      {
        type: 'player',
        id: 'bellingham',
        note: 'Jude Bellingham — Madrid — big-game goals in 2024 run.',
      },
      {
        type: 'player',
        id: 'neuer',
        note: 'Manuel Neuer — Bayern — sweeper-keeper and 2013 winner.',
      },
      {
        type: 'player',
        id: 'alisson',
        note: 'Alisson Becker — Liverpool — 2019 Champions League winner.',
      },
    ],
  },
  {
    id: 'world-cup-legends',
    title: 'World Cup Legends',
    description:
      'Seven quiz-ready men who defined recent World Cups — winners, Golden Boot, and Golden Glove stories across eras.',
    difficulty: 'Advanced',
    tags: ['World Cup', 'National teams', 'History'],
    quizLaunch: { nationalTeamId: 'argentina' },
    items: [
      {
        type: 'player',
        id: 'tm-28003',
        note: 'Lionel Messi — Argentina — 2022 World Cup winner and captain in Qatar.',
      },
      {
        type: 'player',
        id: 'modric',
        note: 'Luka Modrić — Croatia — 2018 Ballon d’Or after a historic Russia run.',
      },
      {
        type: 'player',
        id: 'kane',
        note: 'Harry Kane — England — 2018 Golden Boot; Three Lions captain.',
      },
      {
        type: 'player',
        id: 'neuer',
        note: 'Manuel Neuer — Germany — sweeper-keeper who lifted the 2014 trophy in Brazil.',
      },
      {
        type: 'player',
        id: 'tm-85288',
        note: 'Isco — Spain — 2010 World Cup winner; flair playmaker in La Roja’s golden era.',
      },
      {
        type: 'player',
        id: 'tm-111873',
        note: 'Emiliano Martínez — Argentina — 2022 Golden Glove; penalty-shootout hero.',
      },
      {
        type: 'player',
        id: 'van-dijk',
        note: 'Virgil van Dijk — Netherlands — defensive leader through 2022 knockouts.',
      },
    ],
  },
  {
    id: 'golden-generations',
    title: 'Golden Generations',
    description:
      'Four live national pages and headline players from Spain 2010, France 2018, Argentina 2022, and Germany 2014 eras.',
    difficulty: 'Intermediate',
    tags: ['World Cup', 'National teams', 'History'],
    quizLaunch: { nationalTeamId: 'france' },
    items: [
      { type: 'national-team', id: 'spain', note: 'La Roja — 2010 World Cup plus Euro 2024 champions.' },
      { type: 'player', id: 'tm-85288', note: 'Isco — 2010 winner; creative link in Spain’s golden midfield.' },
      { type: 'player', id: 'tm-338424', note: 'Mikel Merino — Euro 2024 hero in the modern La Roja core.' },
      { type: 'national-team', id: 'france', note: 'Les Bleus — 2018 World Cup winners in Russia.' },
      { type: 'player', id: 'tm-353366', note: 'Benjamin Pavard — 2018 winner; versatile defender.' },
      { type: 'player', id: 'tm-640428', note: 'Eduardo Camavinga — 2022 finalist; Madrid ball carrier.' },
      { type: 'national-team', id: 'argentina', note: 'Albiceleste — 2022 World Cup champions.' },
      { type: 'player', id: 'lautaro', note: 'Lautaro Martínez — Argentina’s main striker in the quiz pool.' },
      { type: 'player', id: 'tm-348795', note: 'Giovani Lo Celso — 2022 squad playmaker at Betis.' },
      { type: 'national-team', id: 'germany', note: 'Die Mannschaft — 2014 World Cup winners in Brazil.' },
      { type: 'player', id: 'neuer', note: 'Manuel Neuer — captain and sweeper-keeper of 2014.' },
      { type: 'player', id: 'musiala', note: 'Jamal Musiala — Germany’s dribbling star in the new cycle.' },
    ],
  },
  {
    id: 'elite-national-team-captains',
    title: 'Elite National-Team Captains',
    description:
      'Seven quiz-ready armband leaders — tie captains to country and club before a national-team quiz.',
    difficulty: 'Advanced',
    tags: ['National teams', 'Leadership', 'Players'],
    quizLaunch: { nationalTeamId: 'england' },
    items: [
      {
        type: 'player',
        id: 'kane',
        note: 'Harry Kane — England captain and Bayern striker.',
      },
      {
        type: 'player',
        id: 'modric',
        note: 'Luka Modrić — Croatia captain; Madrid metronome.',
      },
      {
        type: 'player',
        id: 'neuer',
        note: 'Manuel Neuer — Germany captain; Bayern sweeper-keeper.',
      },
      {
        type: 'player',
        id: 'van-dijk',
        note: 'Virgil van Dijk — Netherlands captain; Liverpool organiser.',
      },
      {
        type: 'player',
        id: 'tm-28003',
        note: 'Lionel Messi — Argentina captain through the 2022 triumph.',
      },
      {
        type: 'player',
        id: 'alisson',
        note: 'Alisson Becker — Brazil №1; calm distribution and shot-stopping.',
      },
      {
        type: 'player',
        id: 'odegaard',
        note: 'Martin Ødegaard — Norway captain; Arsenal playmaker.',
      },
    ],
  },
  {
    id: 'modern-international-midfielders',
    title: 'Modern International Midfielders',
    description:
      'Eight quiz-ready national-team midfielders — pivots, carriers, and creators across Europe’s top leagues.',
    difficulty: 'Intermediate',
    tags: ['National teams', 'Midfield', 'Players'],
    quizLaunch: { nationalTeamId: 'spain' },
    items: [
      {
        type: 'player',
        id: 'rodri',
        note: 'Rodri — Spain pivot at Manchester City; tempo and screening.',
      },
      {
        type: 'player',
        id: 'bellingham',
        note: 'Jude Bellingham — England — Madrid goals and leadership.',
      },
      {
        type: 'player',
        id: 'pedri',
        note: 'Pedri — Spain — Barcelona technician; press-resistant link.',
      },
      {
        type: 'player',
        id: 'gavi',
        note: 'Gavi — Spain — La Masia presser beside Pedri.',
      },
      {
        type: 'player',
        id: 'rice',
        note: 'Declan Rice — England — Arsenal DM after West Ham.',
      },
      {
        type: 'player',
        id: 'tm-640428',
        note: 'Eduardo Camavinga — France — multi-positional Madrid carrier.',
      },
      {
        type: 'player',
        id: 'tm-338424',
        note: 'Mikel Merino — Spain — box-to-box Euro 2024 star.',
      },
      {
        type: 'player',
        id: 'kimmich',
        note: 'Joshua Kimmich — Germany — Bayern switches from midfield or right-back.',
      },
    ],
  },
  {
    id: 'tournament-stars',
    title: 'Tournament Stars',
    description:
      'Eight men who lit up World Cups or Euros in FootyCompass — final heroes, Golden Boot, and breakout nights.',
    difficulty: 'Advanced',
    tags: ['World Cup', 'National teams', 'Tournaments'],
    quizLaunch: { nationalTeamId: 'argentina' },
    items: [
      {
        type: 'player',
        id: 'tm-28003',
        note: 'Lionel Messi — 2022 World Cup — Argentina’s defining tournament.',
      },
      {
        type: 'player',
        id: 'lautaro',
        note: 'Lautaro Martínez — 2022 co-top scorer; Inter captain.',
      },
      {
        type: 'player',
        id: 'tm-111873',
        note: 'Emiliano Martínez — 2022 Golden Glove; shootout saves.',
      },
      {
        type: 'player',
        id: 'tm-338424',
        note: 'Mikel Merino — Euro 2024 — extra-time hero for Spain.',
      },
      {
        type: 'player',
        id: 'kane',
        note: 'Harry Kane — 2018 World Cup Golden Boot in Russia.',
      },
      {
        type: 'player',
        id: 'vinicius',
        note: 'Vinícius Júnior — Brazil winger — Seleção flair at Madrid.',
      },
      {
        type: 'player',
        id: 'tm-487969',
        note: 'Randal Kolo Muani — 2022 World Cup final substitute for France.',
      },
      {
        type: 'player',
        id: 'tm-353366',
        note: 'Benjamin Pavard — 2018 World Cup — France’s right-sided defender.',
      },
    ],
  },
  {
    id: 'usmnt-concacaf-watchlist',
    title: 'USMNT / CONCACAF Watchlist',
    description:
      'United States and Mexico national pages plus quiz-ready CONCACAF players in the club database.',
    difficulty: 'Beginner',
    tags: ['CONCACAF', 'USA', 'World Cup 2026'],
    quizLaunch: { nationalTeamId: 'united-states' },
    items: [
      { type: 'national-team', id: 'united-states', note: 'USMNT — 2026 co-host; rivals Mexico.' },
      { type: 'player', id: 'tm-337807', note: 'Jordan Morris — forward.' },
      { type: 'player', id: 'tm-332697', note: 'Weston McKennie — central midfield.' },
      { type: 'player', id: 'tm-504215', note: 'Giovanni Reyna — attacking midfield.' },
      { type: 'player', id: 'tm-245337', note: 'Walker Zimmerman — centre-back.' },
      { type: 'player', id: 'tm-221624', note: 'Zack Steffen — goalkeeper.' },
    ],
  },
];

export function getCollectionById(id) {
  return collections.find((c) => c.id === id) ?? null;
}

/** Collections tagged for lightweight World Cup prep (not full World Cup Mode). */
export function getWorldCupCollections() {
  return collections.filter((c) => c.tags?.includes('World Cup'));
}

/** World Cup collections wired for national-team quiz launch (curated list). */
export function getWorldCupQuizCollections() {
  return getWorldCupCollections().filter((c) => c.quizLaunch?.nationalTeamId);
}

const ADVANCED_FOOTBALL_COLLECTION_IDS = new Set([
  'press-resistant-midfielders',
  'elite-playmakers',
  'modern-full-backs',
  'ball-playing-center-backs',
  'world-cup-stars',
  'champions-league-veterans',
]);

/** Role-based tactical study lists (quiz-ready players only). */
export function getAdvancedFootballCollections() {
  return collections.filter((c) => ADVANCED_FOOTBALL_COLLECTION_IDS.has(c.id));
}

export function isAdvancedFootballCollection(id) {
  return ADVANCED_FOOTBALL_COLLECTION_IDS.has(id);
}

const NATIONAL_TEAM_LEARNING_COLLECTION_IDS = new Set([
  'world-cup-legends',
  'golden-generations',
  'elite-national-team-captains',
  'modern-international-midfielders',
  'tournament-stars',
]);

/** Curated national-team study lists (quiz-ready players; compare on player-only lists). */
export function getNationalTeamLearningCollections() {
  return collections.filter((c) => NATIONAL_TEAM_LEARNING_COLLECTION_IDS.has(c.id));
}

export function isNationalTeamLearningCollection(id) {
  return NATIONAL_TEAM_LEARNING_COLLECTION_IDS.has(id);
}
