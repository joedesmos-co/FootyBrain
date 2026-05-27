# World Cup Mode — long-term product plan (2026 cycle)

> **Planning only.** No World Cup data, routes, UI mode, quiz filters, or tournament JSON in the app yet.  
> Aligns with [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) pre-Firebase gate **#5** and depends on [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) (single player registry, no duplicate rows).  
> Club football, MLS, and Brasileirão work proceed on parallel tracks per [MLS_BRASILEIRAO_EXPANSION_PLAN.md](./MLS_BRASILEIRAO_EXPANSION_PLAN.md).

## 1. Purpose

Prepare FootyBrain for the **2026 FIFA World Cup cycle** as a dedicated learning pillar—without shipping features until national-team foundations and content gates are met.

**World Cup Mode** (product name) is not a separate app. It is a **tournament overlay** on the existing men’s player registry: same `players[]`, same quiz/progression/save keys, plus international entities, group guides, and scoped quiz/collection launches.

### Learner outcomes (when shipped)

| Outcome | Surface |
|---------|---------|
| Understand the 2026 tournament | World Cup hub + edition page |
| Learn qualified nations | Country pages (`nationalTeams`) |
| Study groups before/during the tournament | Group-stage guides |
| Connect club stars to countries | Player profile club ↔ country links |
| Practice by nation, group, or full tournament | Quiz + daily + collections |
| Place 2026 in context | Tournament history (past editions, winners) |

Men’s soccer only; women’s World Cup out of scope until `PROJECT_BRIEF.md` scope changes.

---

## 2. Future capability map (requirements → plan)

| Requirement | Planned delivery | Primary entity / route |
|-------------|------------------|---------------------------|
| **National team learning** | Nation identity, fan guide, rivals, legends, active squad | `nationalTeams[]` → `/national-team/:id` |
| **Group-stage guides** | One guide per group (teams, storylines, quiz entry) | `competitionGroups[]` on `world-cup-2026` |
| **Country pages** | Same as national team pages; “country” = sovereign footballing nation | `/national-team/:nationalTeamId` (not `/team/`) |
| **Country quiz filters** | Filter quiz pool by nation, confederation, or competition | `/quiz?nationalTeam=brazil`, `?confederation=uefa`, `?competition=world-cup-2026` |
| **Club + country player links** | Profile: club → `/team/:id`; NT → `/national-team/:id`; cards show both | Existing `players.teamId` + `nationalMemberships` |
| **Tournament history** | Past editions, winners, iconic moments (editorial) | `competitions[]` with `type: world-cup`, `editionYear`, `historyNotes` |

**Terminology:** Use **country page** in product copy; implement as **`nationalTeam`** slug in data (never `teams[]` rows for Brazil/France).

---

## 3. Proposed architecture

### 3.1 Entity model (additive; clubs unchanged)

```
confederations[]          UEFA, CONMEBOL, CONCACAF, AFC, CAF, OFC
nationalTeams[]           Country / NT identity (Brazil, USA, …)
nationalMemberships[]     playerId ↔ nationalTeamId (long-term affiliation)

competitions[]            world-cup-2026, world-cup-2022, … (editions)
competitionGroups[]       group-a … group-l (2026: 12 groups × 4 teams)
competitionSquads[]       playerId on a specific edition squad
tournamentHistory[]       Optional editorial blocks per edition (winners, MVPs)

players[]                 SINGLE registry — club fields unchanged
teams[] / leagues[]       Club football ONLY — no change to schema role
```

### 3.2 Core invariant (anti-duplication)

```
ONE human  →  ONE players.id
           →  ONE current club (teamId, leagueId)
           →  ZERO OR MORE nationalMemberships
           →  ZERO OR ONE competitionSquad row per (playerId, competitionId)
```

Never fork `mbappe-france` vs `mbappe-psg`. World Cup squads **reference** existing `playerId`s; if a player is missing from the club dataset, **import club row first**, then add membership + squad.

### 3.3 Data flow (quiz pool)

```
World Cup quiz pool =
  getQuizEligiblePlayers(players)
  ∩ playerIds in competitionSquads(competitionId)
  [optional] ∩ nationalTeamId filter
  [optional] ∩ confederation member NT ids
```

Country-only quiz (no tournament):

```
getQuizEligiblePlayers(players)
∩ playerIdsForNationalTeam(nationalTeamId)
```

Group-stage quiz:

```
competitionGroups[groupId].nationalTeamIds
→ union of squads OR membership-filtered eligible players per nation
```

### 3.4 Routing map (future; not implemented)

| Route | Role |
|-------|------|
| `/world-cup` | Mode hub: active edition, confederation shortcuts, collections |
| `/world-cup/world-cup-2026` | Edition: hosts, format, groups, qualified nations, history link |
| `/world-cup/world-cup-2026/group/:groupId` | Group-stage guide (4 nations + learning copy + “Quiz this group”) |
| `/national-team/:nationalTeamId` | Country page: identity, squad, rivals, quiz CTA |
| `/confederation/:confederationId` | Member nations browse + confederation quiz filter |
| `/quiz?competition=world-cup-2026` | Tournament squad quiz |
| `/quiz?nationalTeam=brazil` | Country quiz |
| `/quiz?group=world-cup-2026-group-a` | Group quiz (proposed param) |
| `/player/:playerId` | Club link + country link (unchanged id) |

**Do not** overload `/team/:teamId` for nations. **Do not** add `leagueId: international`.

### 3.5 UI integration (targeted later)

| Existing surface | World Cup Mode touch |
|------------------|----------------------|
| Navbar | Optional “World Cup” entry when edition is active (feature flag) |
| Home | Featured group / nation / daily WC variant |
| Browse | Filters: nationality, primary NT, confederation (club filters remain) |
| QuizMode | `competition`, `nationalTeam`, `group`, `confederation` query params |
| Compare | Unchanged; pickers may filter to NT pool |
| Collections | Items `national-team`, `competition`, `competition-group` |
| Search | Types: `national-team`, `competition`, `confederation` |
| Daily Challenge | `edition: world-cup-2026` featured pool from squads |
| Player profile | Link national team; subtitle “Club · Country” |

No rewrite of `BrowseDatabase`, `TeamProfile`, or merge pipeline—**extend** helpers and add routes.

### 3.6 Group-stage guides (2026-specific)

48-team format → **12 groups of 4**. Each group is an editorial learning unit:

| Field (proposed `competitionGroups`) | Purpose |
|--------------------------------------|---------|
| `id` | `world-cup-2026-group-a` |
| `competitionId` | `world-cup-2026` |
| `label` | `Group A` |
| `nationalTeamIds` | Four qualified nations |
| `summary` | Beginner-friendly group storyline (original prose) |
| `keyRivalry` | optional cross-link |
| `quizLaunch` | `{ competitionId, groupId }` |

Guides are **learning content**, not live standings or fixtures.

### 3.7 Tournament history

Attach to each `competitions` row (or sibling `tournamentHistory` entries):

- `editionYear`, `hostSummary`, `winnerNationalTeamId`, `runnerUpNationalTeamId`
- `memorablePlayers[]` → `playerId` references (legends may be `nationalMemberships.status: legend`)
- Short editorial “why it mattered” (1986, 2014, etc.)

2026 edition is **active**; prior editions are **archive** for context, not full squad simulation unless editorially curated.

### 3.8 Confederations

| Confederation | `id` | WC 2026 role |
|---------------|------|----------------|
| UEFA | `uefa` | Largest slot share; dense quiz surname collisions |
| CONMEBOL | `conmebol` | Brazil/Argentina rivalry content |
| CONCACAF | `concacaf` | Host nations USA/Mexico/Canada + qualifiers |
| AFC | `afc` | Japan, Korea, Australia, etc. |
| CAF | `caf` | African nations |
| OFC | `ofc` | Smallest slot; still include for completeness |

Use for browse grouping, hub navigation, and `/quiz?confederation=uefa`. Member list derived from `nationalTeams.confederationId`.

---

## 4. Cross-cutting considerations

### 4.1 Roster duplication risks

| Risk | Consequence | Mitigation |
|------|-------------|------------|
| Second `players` row per athlete | Broken saves, compare, search duplicates | Validator: squad `playerId` must exist in `players[]` |
| NT as `teams[]` row | Route collision with clubs | `nationalTeams` only |
| Duplicate membership | Two Brazil rows for same player | Unique `(playerId, nationalTeamId, role)` |
| WC-only generated bios | Editorial drift from club row | Squad = references; hints on player row or NT overlay |
| Transfer mid-tournament | Club stale, NT correct | `competitionSquads.meta.dataAsOf`; club from TM refresh |

### 4.2 Image reuse

| Asset | Policy |
|-------|--------|
| Player photos | Reuse existing `imageUrl` / `visualTheme` from club row—no NT-specific photo pipeline |
| Country visuals | Abstract flag-color `visualTheme`; no official crests/FIFA marks ([PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md)) |
| World Cup branding | Text title “World Cup 2026” until licensed |
| Host cities/stadiums | Text-only descriptions unless licensed |

**Rule:** One visual identity per `playerId`; tournament mode does not fork images.

### 4.3 Search scaling

| Stage | Players (approx.) | Search plan |
|-------|-------------------|-------------|
| Today | ~1,200 | Full scan + aliases + importance |
| Pre-WC | ~2,000+ (incl. MLS/Brasileirão) | Add `nationality`, `primaryNationalTeamId`, FIFA codes to index |
| WC launch | +48 NT entities, 12 groups, 1 competition | New result types; rank `national-team` above club player flood for “Brazil” |
| Post-WC scale | 2,500+ | Consider precomputed `playersByNationalTeamId` map at build time; optional lazy JSON chunk |

Do not index pseudo-players or duplicate names. Extend [searchAliases.js](./src/utils/searchAliases.js) with `NATIONAL_TEAM_ALIASES` (`usa` → `united states`, `korea` disambiguation).

### 4.4 Quiz balancing

| Topic | Plan |
|-------|------|
| Pool size | 48 × ~26 squad slots ≈ 1,248 max; **quiz uses strict eligible subset** (hints + quickFact) |
| Default session | Prefer **one nation** or **one group** (4 nations), not full 48-team pool |
| Difficulty | WC mode: emphasize NT + position; club as secondary hint |
| Ambiguous surnames | Recompute `buildAmbiguousLastNames` per nation and per group before enabling filters |
| Hint durability | Tournament/nation facts; avoid volatile “just transferred” ([ROSTER_FRESHNESS_PLAN.md](./ROSTER_FRESHNESS_PLAN.md)) |
| Daily / XP | Reuse `useProgression`; session metadata `competitionId` / `nationalTeamId` for future Firebase |
| Variants | Existing quiz variants (nationality, career, …) compatible with `?nationalTeam=` pool |

### 4.5 Club + country links (profile contract)

On **player profile** (future):

- Current club → `/team/:teamId` (exists)
- League → `/league/:leagueId` (exists)
- Represents → `/national-team/:nationalTeamId` from primary membership
- Nationality → text, or link when 1:1 with `nationalTeamId`

On **country page**:

- Squad cards → `/player/:playerId` with subtitle `Current club: {teamName}`

On **club team page**:

- No change; optional badge “X squad members at World Cup 2026” later (low priority).

---

## 5. Rollout phases

Aligned with `PROJECT_BRIEF.md` gates. **No user-facing World Cup Mode until Phase D.**

### Phase A — Foundation (no WC UI)

| Step | Deliverable | Data | Code |
|------|-------------|------|------|
| A1 | Schema finalized | `national-team-schema-notes.md` + WC group/squad extensions | Docs |
| A2 | `confederations.json` + `nationalTeams.json` (metadata) | Yes | Helpers only |
| A3 | `nationalMemberships` for major NTs (~32–40) | Yes | Validation script |
| A4 | Normalize `players.nationality` / `nationalTeam` vs memberships | Yes | Merge/build step |
| A5 | Search: `national-team` type + player NT fields in index | — | Yes |

**Gate:** [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) phases 1–6 substantially complete.

### Phase B — Country learning (pre-tournament)

| Step | Deliverable | Data | Code |
|------|-------------|------|------|
| B1 | Country pages `/national-team/:id` | Editorial per nation | Targeted route + page |
| B2 | Browse/quiz `?nationalTeam=` filter | — | QuizMode + Browse |
| B3 | Collections with `national-team` items | Yes | `collections.js` extend |
| B4 | Player profile country links | — | PlayerProfile |

**Gate:** Major men’s national teams feel learnable without World Cup shell.

### Phase C — Club breadth (parallel)

| Step | Deliverable |
|------|-------------|
| C1 | MLS + Brasileirão per [MLS_BRASILEIRAO_EXPANSION_PLAN.md](./MLS_BRASILEIRAO_EXPANSION_PLAN.md) |
| C2 | Americas players in registry before CONCACAF-heavy WC squads |
| C3 | Duplicate-name + alias audit (PT/ES/EN) |

**Gate:** Brief items #1–#3 progressing; reduces missing `playerId` for WC squads.

### Phase D — World Cup Mode (2026 cycle)

| Step | Deliverable | Target window (planning) |
|------|-------------|---------------------------|
| D1 | `competitions` row `world-cup-2026` + tournament history stubs | After qualification list stable |
| D2 | `competitionGroups` (12) + group-stage guides | ~2–3 months before kickoff |
| D3 | `competitionSquads` for qualified nations (editorial sign-off) | Squad announcement windows |
| D4 | `/world-cup` hub + edition + group routes | UI when data ready |
| D5 | Quiz `?competition=` + `?group=` + collections + daily WC variant | Same release train |
| D6 | Search ranking + home featured WC strip | Polish |
| D7 | Post-tournament: archive 2026, keep history, plan 2030 id | Maintenance |

### Phase E — Firebase (explicitly after Mode)

Per brief #6: auth, cloud saves, cross-device progress—**only after** World Cup Mode is planned/shipped and content breadth proven.

---

## 6. Recommended pre–World Cup priorities

Order for engineering and editorial **before** Phase D ships:

1. **Finish European club depth + quiz-eligible editorial** — WC squads hydrate from existing stars; thin hints hurt WC mode most.
2. **Execute national team foundation (Phase A–B)** — country pages and `nationalMemberships` are prerequisites, not optional.
3. **MLS + Brasileirão club pass** — CONCACAF/South American learners and squad coverage for 2026 hosts/rivals.
4. **Search hardening at ~2k players** — NT result type, nationality in index, alias disambiguation (`Inter`, `USA`, Korea names).
5. **Validators** — orphan squad `playerId`, duplicate membership, per-NT surname collision report.
6. **Hint policy** — `quizContext` editorial tags (`club` | `national` | `competition`) in overlay workflow.
7. **Mobile UX baseline** — Mode will be phone-heavy during tournament; keep targeted CSS passes ([recent mobile pass](./src/index.css)).
8. **Legal/visual** — text-only nations; no FIFA logo until licensed.

**Defer until post-WC or Phase E:** live fixtures, brackets, scores API, Firebase accounts, women’s tournament.

---

## 7. Biggest technical risks

| Risk | Severity | Why it hurts | Mitigation |
|------|----------|--------------|------------|
| **Duplicate player rows** | Critical | Saves, compare, merge, search all break | Squad import = FK only; CI validator |
| **Missing club row for squad player** | High | Cannot link club ↔ country | Import club data before squad row |
| **`nationalTeam` string drift** | High | Filters/quiz wrong pool | `primaryNationalTeamId` + build-time sync |
| **Quiz pool too large / too thin** | High | Frustration or trivia noise | Default group/nation scope; strict eligibility |
| **Surname ambiguity in NT squads** | High | Wrong quiz accepts | Per-nation `buildAmbiguousLastNames` |
| **Bundle size (~2k+ JSON)** | High | Mobile parse/load | Lazy-load `competitions` + NT chunk; build-time indexes |
| **Qualification / squad churn** | Medium | Stale content | `dataAsOf`; editorial lock before kickoff |
| **Political naming (Taiwan, etc.)** | Medium | Trust | FIFA display names in `nationalTeams.name` |
| **Image/trademark** | Medium | Legal | [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) |
| **Scope creep (live data)** | Medium | Violates frontend-only brief | Fixtures explicitly out of scope |
| **Firebase before content** | Medium | Empty cloud state | Brief gate #6 |

---

## 8. Explicit non-goals (this plan)

- No World Cup data in `sampleData.js` or new routes **until phases above are executed**
- No live scores, brackets, or simulation
- No women’s World Cup
- No youth NT (`role: youth`) in MVP WC mode
- No official FIFA assets without license
- No Firebase / accounts
- No rewrite of club browse, team profiles, or quiz core—extend only

---

## 9. Success criteria (planning → ready to implement)

- [ ] Architecture sign-off: one `players.id`, no NT in `teams[]`
- [ ] Group-stage schema documented (§3.6 + schema notes)
- [ ] Route map agreed with [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md)
- [ ] Editorial workflow: squad = list of `playerId` + NT membership, not cloned bios
- [ ] Validator spec written before first `competitionSquads.json`
- [ ] Search + quiz balancing rules accepted for 48-team scale
- [ ] Pre-WC priority list scheduled in [ROADMAP.md](./ROADMAP.md)

---

## 10. Related documents

| Document | Role |
|----------|------|
| [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) | Pre-Firebase gate order (#5 World Cup mode) |
| [ROADMAP.md](./ROADMAP.md) | Product milestones |
| [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) | NT architecture, country pages, membership model |
| [WORLD_CUP_ROADMAP.md](./WORLD_CUP_ROADMAP.md) | Short WC roadmap index → this plan |
| [MLS_BRASILEIRAO_EXPANSION_PLAN.md](./MLS_BRASILEIRAO_EXPANSION_PLAN.md) | Americas club data before CONCACAF WC narrative |
| [generated-data/schemas/national-team-schema-notes.md](./generated-data/schemas/national-team-schema-notes.md) | Field-level schema |
| [DATA_MERGE_PLAN.md](./DATA_MERGE_PLAN.md) | nationality / nationalTeam merge |
| [ROSTER_FRESHNESS_PLAN.md](./ROSTER_FRESHNESS_PLAN.md) | Durable quiz hints |
| [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) | Crests, photos, tournament marks |

---

*Planning pass for 2026 World Cup cycle; no runtime, routes, or data changes.*
