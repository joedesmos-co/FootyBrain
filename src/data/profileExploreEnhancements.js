/**
 * Optional one-line “keep exploring” leads for high-traffic profiles that lack rivals/legends depth.
 * Keys are teamId or playerId — copy only, no generated filler.
 */

/** @type {Record<string, string>} */
export const PROFILE_EXPLORE_LEADS = {
  hoffenheim:
    'Bundesliga side with a defined pressing identity — compare with Bayern and Dortmund via league and stadium quizzes.',
  botafogo:
    'Rio club in the Brasileirão pool — learn the squad here, then test recognition with league-wide player quizzes.',
  fluminense:
    'Tricolor club from Rio — browse the squad, then jump into Brasileirão quiz hubs for spaced repetition.',
  'atletico-mineiro':
    'Belo Horizonte heavyweight in the Brazilian dataset — squad first, then league quiz routes on FootyCompass.',
  'fc-dallas':
    'MLS Western Conference club — use the squad list, then the MLS player quiz hub to lock in names.',
  chapecoense:
    'Santa Catarina club in Brasileirão — a good squad-browse stop before wider Brazilian league quizzes.',
  bragantino:
    'São Paulo state club in the top Brazilian tier — pair this page with Brasileirão discovery hubs.',
  remo:
    'Belém club with a full squad listing — reinforce names through league quizzes after scanning roles here.',
  vitoria:
    'Bahia-based Brasileirão club — study positions in the squad, then quiz yourself on Brazilian players.',
  mirassol:
    'Paulista club in the dataset — useful for squad geography before Brasileirão-themed quiz sessions.',
  'orlando-pirates':
    'South African side in the dataset — scan the squad, then use discovery hubs for wider league context.',
  'mamelodi-sundowns':
    'Sundowns carry one of the deeper African squad lists here — pair browsing with national-team and quiz hubs.',
  'inter-miami':
    'MLS roster hub — learn Miami’s squad, then try MLS player quizzes and club stadium rounds.',
  'la-galaxy':
    'Historic MLS name — browse the squad list, then reinforce with league quiz routes.',
  'nashville-sc':
    'MLS club page for squad study — follow with league-wide quizzes when you want repetition.',
};

export function getProfileExploreLead(entityId, { teamId } = {}) {
  const id = String(entityId ?? '').trim();
  const team = String(teamId ?? '').trim();
  if (id && PROFILE_EXPLORE_LEADS[id]) return PROFILE_EXPLORE_LEADS[id];
  if (team && PROFILE_EXPLORE_LEADS[team]) return PROFILE_EXPLORE_LEADS[team];
  return '';
}
