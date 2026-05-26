/**
 * Club hub metadata merged onto teams at export time.
 * Managers are editorial learning references (not live API data).
 */

const DEFAULT_META = {
  manager: null,
  identityTags: ['fan-culture'],
};

/** @type {Record<string, { manager: string | null, identityTags: string[] }>} */
export const TEAM_CLUB_META = {
  'manchester-city': {
    manager: 'Pep Guardiola',
    identityTags: ['possession', 'title-challenger', 'historic-giant', 'pressing'],
  },
  arsenal: {
    manager: 'Mikel Arteta',
    identityTags: ['pressing', 'youth-focused', 'possession', 'title-challenger'],
  },
  liverpool: {
    manager: 'Arne Slot',
    identityTags: ['pressing', 'counter-attacking', 'historic-giant', 'fan-culture'],
  },
  chelsea: {
    manager: 'Enzo Maresca',
    identityTags: ['possession', 'youth-focused', 'title-challenger'],
  },
  'manchester-united': {
    manager: 'Ruben Amorim',
    identityTags: ['historic-giant', 'counter-attacking', 'fan-culture'],
  },
  tottenham: {
    manager: 'Thomas Frank',
    identityTags: ['pressing', 'counter-attacking', 'fan-culture'],
  },
  newcastle: {
    manager: 'Eddie Howe',
    identityTags: ['pressing', 'physical', 'fan-culture'],
  },
  'aston-villa': {
    manager: 'Unai Emery',
    identityTags: ['possession', 'set-pieces', 'counter-attacking'],
  },
  'real-madrid': {
    manager: 'Xabi Alonso',
    identityTags: ['counter-attacking', 'european-heavyweight', 'historic-giant'],
  },
  barcelona: {
    manager: 'Hansi Flick',
    identityTags: ['possession', 'academy', 'technical', 'historic-giant'],
  },
  'atletico-madrid': {
    manager: 'Diego Simeone',
    identityTags: ['defensive-block', 'counter-attacking', 'physical', 'fan-culture'],
  },
  sevilla: {
    manager: 'Matías Almeyda',
    identityTags: ['possession', 'european-heavyweight', 'fan-culture'],
  },
  'bayern-munich': {
    manager: 'Vincent Kompany',
    identityTags: ['possession', 'title-challenger', 'historic-giant', 'pressing'],
  },
  'borussia-dortmund': {
    manager: 'Nuri Şahin',
    identityTags: ['pressing', 'youth-focused', 'counter-attacking', 'fan-culture'],
  },
  'bayer-leverkusen': {
    manager: 'Erik ten Hag',
    identityTags: ['pressing', 'counter-attacking', 'title-challenger'],
  },
  'rb-leipzig': {
    manager: 'Marco Rose',
    identityTags: ['pressing', 'counter-attacking', 'youth-focused'],
  },
  'eintracht-frankfurt': {
    manager: 'Dino Toppmöller',
    identityTags: ['pressing', 'counter-attacking', 'european-heavyweight'],
  },
  'ac-milan': {
    manager: 'Sérgio Conceição',
    identityTags: ['pressing', 'counter-attacking', 'historic-giant'],
  },
  'inter-milan': {
    manager: 'Cristian Chivu',
    identityTags: ['defensive-block', 'counter-attacking', 'title-challenger'],
  },
  juventus: {
    manager: 'Thiago Motta',
    identityTags: ['defensive-block', 'historic-giant', 'title-challenger'],
  },
  napoli: {
    manager: 'Antonio Conte',
    identityTags: ['defensive-block', 'counter-attacking', 'fan-culture'],
  },
  roma: {
    manager: 'Gian Piero Gasperini',
    identityTags: ['pressing', 'high-line', 'fan-culture'],
  },
  lazio: {
    manager: 'Marco Baroni',
    identityTags: ['counter-attacking', 'defensive-block', 'fan-culture'],
  },
  'paris-saint-germain': {
    manager: 'Luis Enrique',
    identityTags: ['possession', 'title-challenger', 'historic-giant'],
  },
  marseille: {
    manager: 'Roberto De Zerbi',
    identityTags: ['possession', 'pressing', 'fan-culture'],
  },
  lyon: {
    manager: 'Paulo Fonseca',
    identityTags: ['possession', 'academy', 'youth-focused'],
  },
  monaco: {
    manager: 'Adi Hütter',
    identityTags: ['counter-attacking', 'youth-focused', 'technical'],
  },
  lille: {
    manager: 'Bruno Génésio',
    identityTags: ['pressing', 'counter-attacking', 'underdog-spirit'],
  },
  ajax: {
    manager: "John van 't Schip",
    identityTags: ['possession', 'academy', 'youth-focused', 'technical'],
  },
  psv: {
    manager: 'Peter Bosz',
    identityTags: ['pressing', 'counter-attacking', 'title-challenger'],
  },
  feyenoord: {
    manager: 'Robin van Persie',
    identityTags: ['pressing', 'physical', 'fan-culture'],
  },
  'az-alkmaar': {
    manager: 'Maarten Martens',
    identityTags: ['youth-focused', 'pressing', 'underdog-spirit'],
  },
  'fc-twente': {
    manager: 'Joseph Oosting',
    identityTags: ['pressing', 'counter-attacking', 'fan-culture'],
  },
  'west-ham': {
    manager: 'Graham Potter',
    identityTags: ['direct-play', 'set-pieces', 'physical'],
  },
  brighton: {
    manager: 'Fabian Hürzeler',
    identityTags: ['possession', 'pressing', 'youth-focused'],
  },
  wolves: {
    manager: 'Vítor Pereira',
    identityTags: ['counter-attacking', 'defensive-block', 'physical'],
  },
  'crystal-palace': {
    manager: 'Oliver Glasner',
    identityTags: ['pressing', 'counter-attacking', 'set-pieces'],
  },
  brentford: {
    manager: 'Keith Andrews',
    identityTags: ['set-pieces', 'pressing', 'underdog-spirit'],
  },
  everton: {
    manager: 'David Moyes',
    identityTags: ['direct-play', 'physical', 'fan-culture'],
  },
  fulham: {
    manager: 'Marco Silva',
    identityTags: ['possession', 'technical', 'counter-attacking'],
  },
  'athletic-bilbao': {
    manager: 'Ernesto Valverde',
    identityTags: ['pressing', 'physical', 'academy', 'fan-culture'],
  },
  'real-sociedad': {
    manager: 'Imanol Alguacil',
    identityTags: ['possession', 'pressing', 'youth-focused'],
  },
  'real-betis': {
    manager: 'Manuel Pellegrini',
    identityTags: ['possession', 'technical', 'fan-culture'],
  },
  villarreal: {
    manager: 'Marcelino',
    identityTags: ['counter-attacking', 'defensive-block', 'technical'],
  },
  'celta-vigo': {
    manager: 'Gerard López',
    identityTags: ['possession', 'technical', 'underdog-spirit'],
  },
  valencia: {
    manager: 'Rubén Baraja',
    identityTags: ['counter-attacking', 'fan-culture', 'underdog-spirit'],
  },
  'vfb-stuttgart': {
    manager: 'Sebastian Hoeness',
    identityTags: ['pressing', 'youth-focused', 'counter-attacking'],
  },
  'borussia-monchengladbach': {
    manager: 'Stefan Leitl',
    identityTags: ['counter-attacking', 'pressing', 'fan-culture'],
  },
  wolfsburg: {
    manager: 'Ralph Hasenhüttl',
    identityTags: ['pressing', 'counter-attacking', 'physical'],
  },
  'werder-bremen': {
    manager: 'Horst Steffen',
    identityTags: ['pressing', 'fan-culture', 'underdog-spirit'],
  },
  freiburg: {
    manager: 'Julian Schuster',
    identityTags: ['pressing', 'defensive-block', 'underdog-spirit'],
  },
  lens: {
    manager: 'Will Still',
    identityTags: ['pressing', 'high-line', 'underdog-spirit'],
  },
  nice: {
    manager: 'Franck Haise',
    identityTags: ['possession', 'pressing', 'counter-attacking'],
  },
  rennes: {
    manager: 'Julien Stéphan',
    identityTags: ['youth-focused', 'pressing', 'counter-attacking'],
  },
  strasbourg: {
    manager: 'Liam Rosenior',
    identityTags: ['pressing', 'youth-focused', 'underdog-spirit'],
  },
};

export function getTeamClubMeta(teamId) {
  return TEAM_CLUB_META[teamId] ?? DEFAULT_META;
}
