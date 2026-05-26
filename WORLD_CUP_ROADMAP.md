# World Cup learning roadmap

> **Planning only.** No World Cup data, routes, quiz mode UI, or Firebase yet.  
> **Canonical long-term plan:** [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) (2026 cycle: group guides, country pages, rollout phases, risks).  
> Depends on [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) (single player registry + `nationalMemberships`).

This file is a **short index**; detailed architecture, group-stage guides, tournament history, and pre–World Cup priorities live in **WORLD_CUP_MODE_PLAN.md**.

**Status (2026-05-26):** **Wave 2 national teams are live** (25 major nations) as **join-only** memberships. **Wave 3 adds 24 nations in preview only** (49 total staged) — see [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) §13. **World Cup Mode UI is not built** — no tournament routes beyond the prep hub, no `competitions` / `competitionSquads` in app data. Next gate: promote Wave 3 nations individually after `report:national-teams-wave3`, then editorial `competitionSquads` (playerId-only).

---

## Raw data available for World Cup planning

| Layer | TM / raw source | FootyBrain use |
|-------|-----------------|----------------|
| Nation metadata | `2025/national_teams.json.gz` (119 teams) | `nationalTeams[]` — 12 priority nations all present |
| Player ↔ nation | `citizenship`, sparse `national_team`, `international_caps` / `international_goals` on player scrape | `nationalMemberships` + profile caps (verified) |
| Tournament shell | Editorial only (no TM “World Cup 2026” squad file in repo) | `competitions[]`, `competitionGroups[]` |
| WC squads | **Not in raw data yet** | `competitionSquads[]` = manual/editorial list of existing `playerId`s |
| Fixtures | `football.json` | Out of scope for v1 WC mode |

**Curated `national_teams.csv` / `countries.csv`:** documented in Transfermarkt dbt; not downloaded locally — use scraper `national_teams.json.gz` for v1 build scripts.

See [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) §0 for field-level audit.

---

## Preview audit summary (2026-05-26, Wave 3)

**Canonical audit:** [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) §13. Source: `generated-data/national-teams-preview.json` — `npm run validate:national-teams-preview` **PASSED**. Rollout gates: `npm run report:national-teams-wave3`.

| Area | Finding | World Cup impact |
|------|---------|------------------|
| **Teams** | **49** nations in preview (5 + 20 + 24); 48-team WC list separate (`world-cup-2026-qualified-teams.json`) | Hub can reference 48; **25 live** in app (Wave 1+2 only) |
| **Linked players** | **287** `playerLinks` → existing `playerId` only (registry = `sampleData.js`) | Safe join model; squads incomplete vs TM |
| **Unmatched** | **528** TM NT-parent rows, `previewOnly` | **Do not import** into `sampleData.js` |
| **TM entity gaps** | `cameroon`, `cote-divoire` missing from TM `national_teams.json.gz` | Registry nationality backfill only until TM adds entities |
| **Duplicates** | Brazil (`pedro`), Argentina (`martinez`) surname collisions in quiz pools | Block “safe to live” promotion until disambiguation |
| **Wave 3 live candidates** | **8** nations pass promote gates (Norway, Ghana, Algeria, Poland, Austria, Ukraine, Scotland, Paraguay) | Promote **one-by-one**; not bulk |
| **Quiz (live 25)** | Several Wave 2 nations still &lt;3 quiz-ready (Serbia, Mexico, Chile, Turkey, Korea) | Quiz UI should keep gating; see [NATIONAL_TEAM_QUIZ_AUDIT.md](./NATIONAL_TEAM_QUIZ_AUDIT.md) |
| **World Cup mode** | **Not enabled** | No tournament quiz until `competitionSquads` + stronger per-nation pools |

**WC readiness verdict:** App is approaching **major international breadth in preview** (49 nations staged), but **not** WC-mode ready. Live layer remains 25 nations; Wave 3 is staged, not shipped.

**Live (wave 1+2):** `england`, `france`, `spain`, `brazil`, `argentina`, `germany`, `portugal`, `italy`, `netherlands`, `belgium`, `croatia`, `switzerland`, `denmark`, `serbia`, `turkey`, `united-states`, `mexico`, `uruguay`, `colombia`, `chile`, `morocco`, `senegal`, `nigeria`, `japan`, `korea-republic`.

**Coverage note:** Some nations have thin quiz-ready pools because the club database is still incomplete for their player base (e.g. `mexico`). That is expected and safe — quiz gating prevents bad sessions.

---

## First live rollout vs World Cup (2026)

| Milestone | Depends on | WC note |
|-----------|------------|---------|
| Wave 1 NT pages live | Registry membership backfill (§0d) + §0c validation | Hub lists **five** nations; **not** full 48-team WC grid; **no new live NTs** until wave 2 passes audit |
| `competitions.world-cup-2026` | NT entities + editorial shell | Hosts: USA, Mexico, Canada — **USA in wave 1** |
| `competitionSquads` | Wave 1–2 nations + quiz-eligible stars | Editorial `playerId` list per nation; no new players |
| WC quiz | `?competition=world-cup-2026` | After squads + NT quiz filters tested |

---

## Priority nations (World Cup 2026 learning set)

First **national-team import** (before any WC UI) should cover the same 12 men’s sides FootyBrain already has deep **club** overlap for:

Italy, Switzerland, Germany, France, England, Spain, Portugal, Netherlands, Brazil, Argentina, USA (`united-states`), Mexico.

**World Cup data wave (after NT phases 1–2):**

1. `competitions` row `world-cup-2026` (hosts USA/Mexico/Canada — editorial).
2. `competitionGroups` when draw is fixed (12 × 4) — optional at planning stage.
3. `competitionSquads` — **only** `playerId`s already in `players[]` (typically from MLS, Brasileirão, top-5 Europe clubs in dataset).
4. Quiz-eligible subset per nation (8–15 stars) with NT/WC hint templates — no duplicate player rows.

---

## Purpose

Add a **World Cup–focused learning pillar** after major men’s national teams exist in FootyBrain: tournament context, qualified nations, memorable players, and quizzes that do not duplicate club player records.

Men’s only; women’s World Cup out of scope until product scope changes in `PROJECT_BRIEF.md`.

---

## Product outcomes (when shipped)

1. Learner can open a **World Cup hub** (edition-specific, e.g. 2026).
2. Learner can browse **qualified national teams** and squads for that tournament.
3. Learner can practice **World Cup quiz** (by nation, by confederation, or full tournament pool).
4. Learner can follow **collections** (“Learn World Cup 2026”, “South American rivals”).
5. Player profiles link **club** and **country** without two records per athlete.

---

## Architecture (inherits national team model)

```
competitions[]          ← world-cup-2026
competitionSquads[]     ← playerId + nationalTeamId + shirtNumber (optional)
nationalTeams[]         ← Brazil, England, …
nationalMemberships[]   ← long-term NT affiliation
players[]               ← single registry (club + quiz fields)
teams[] / leagues[]     ← unchanged club world
```

**Quiz pool for WC mode:**

```
eligible = players where
  isQuizEligiblePlayer(player)
  AND exists competitionSquad(competitionId, player.id)
```

Optional: include legendary historical players via `status: legend` on membership + editorial `competitionSquads` for “all-time WC heroes” collection — separate from live 2026 squad.

---

## World Cup Mode UI plan (national-team structure)

World Cup Mode is a **tournament overlay** on the existing national-team layer — not a second player database or club route namespace. Country learning stays on **`/national-team/:nationalTeamId`**; World Cup routes organize **edition context**, **qualified nations**, **quiz entry**, and **history**.

### Route structure (agreed — not implemented)

| Route | Role | Reuses from national teams |
|-------|------|----------------------------|
| **`/world-cup`** | Mode hub: active edition (`world-cup-2026`), hosts/format (text), quick links to Teams / Quiz / History, optional featured group | `NationalTeamBadge`, `getLiveNationalTeams()` for counts; same `page` / `page-header` patterns as `NationalTeamsPage` |
| **`/world-cup/teams`** | Tournament nation browser: qualified nations for active edition, group-stage cards, links to country guides | Nation cards → `/national-team/:id`; group blocks from `competitionGroups[]`; squad preview counts from `competitionSquads` ∩ memberships |
| **`/world-cup/quiz`** | Quiz launcher hub (no quiz engine here): nation pills, group CTAs, “full tournament” CTA → existing `QuizMode` | Same eligibility helpers as NT pages; launches `/quiz?nationalTeam=` / `?competition=` / `?group=` |
| **`/world-cup/history`** | Tournament history cards (past editions, winners, memorable moments) | Editorial `competitions` / `tournamentHistory`; winner links → `/national-team/:winnerId` when live |

**Secondary routes (post-MVP, same mode):**

| Route | Purpose |
|-------|---------|
| `/national-teams` | Global NT hub (all live nations, not WC-scoped) — **already live** |
| `/national-team/:nationalTeamId` | **Country guide** — fan guide, rivals, linked squad (`TeamSquadView` `variant="national"`) — **already live** |
| `/world-cup/groups/:groupId` | Deep group-stage guide (4 nations + storyline + “Quiz this group”) — optional split from `/world-cup/teams` tabs |
| `/quiz?nationalTeam=brazil` | National squad quiz (membership or `competitionSquads` ∩ quiz-eligible) |
| `/quiz?competition=world-cup-2026` | Tournament-scoped quiz |
| `/quiz?group=world-cup-2026-group-a` | Group pool quiz |
| `/collections/:id` | WC collections (`quizLaunch.competitionId`) |

**Do not** overload `/team/:teamId` for nations. **Do not** duplicate country guides under `/world-cup/teams/:id` — always link out to `/national-team/:id`.

### Page wireframes (component mapping)

```
/world-cup
  ├─ WorldCupHubPage          (new)
  ├─ edition strip            competitions[active].hosts, format, datesText
  └─ nav cards → /teams, /quiz, /history

/world-cup/teams
  ├─ WorldCupTeamsPage        (new)
  ├─ [tab] Nations            grid like NationalTeamsPage, filtered by competition.qualifiedTeamIds
  ├─ [tab] Groups             12 × competitionGroups cards → /national-team or /world-cup/groups/:id
  └─ “Club → country” strip   editorial picks: player cards → PlayerProfile (club + NT links exist)

/world-cup/quiz
  ├─ WorldCupQuizHubPage      (new) — launcher only
  ├─ nation chips             live qualified nations with quiz-ready count
  ├─ group buttons            when competitionGroups exist
  └─ Link → /quiz?competition=world-cup-2026

/world-cup/history
  ├─ WorldCupHistoryPage      (new)
  └─ edition cards            year, host, winner badge, 2–3 memorable playerIds → /player/:id

/national-team/:id            (existing — country guide)
```

### Feature plan (requirements → surfaces)

| Feature | Primary surface | Data source |
|---------|-----------------|-------------|
| **Country guides** | `/national-team/:id` | `nationalTeams[]` editorial (`shortHistory`, `fanGuide`, `rivalIds`) — **exists for wave 1** |
| **Group-stage learning** | `/world-cup/teams` (Groups tab) or `/world-cup/groups/:groupId` | **New** `competitionGroups[]` + original prose per group |
| **National squad quizzes** | `/world-cup/quiz` → `/quiz?nationalTeam=` | **Existing** `nationalMemberships` + `getQuizEligiblePlayers`; **new** optional filter via `competitionSquads` |
| **Club → country discovery** | Player profile + NT squad rows + WC “spotlight” strip | **Existing** `getLiveNationalTeamForPlayer`, `TeamSquadView` club meta; **new** curated `spotlightPlayerIds` on competition or group |
| **Tournament history cards** | `/world-cup/history` | **New** `competitions` rows (`type: world-cup`, `editionYear`, `winnerNationalTeamId`, `historyNotes`, `memorablePlayerIds`) |

### Existing data vs new data

| Need | Use existing | Needs new data / code |
|------|--------------|------------------------|
| Nation identity & badge | `nationalTeamLive.json` → `nationalTeamData.js` | Expand live set beyond wave 1 (wave 2: `spain`, `argentina`, …) |
| Linked squad (database) | `nationalMemberships` + `getPlayersForNationalTeam` | Registry backfill for stars; not TM preview links alone |
| Country page UI | `NationalTeamProfile`, `NationalTeamsPage`, `NationalTeamBadge` | WC-specific copy blocks optional on hub only |
| Player club + NT links | `PlayerProfile`, `universalSearch` | `quizContext` hints for WC mode (later) |
| Quiz engine | `QuizMode`, `quizEligibility`, progression | **Extend** query params: `competition`, `nationalTeam`, `group`; pool builders |
| Collections / daily | `collectionsData`, `DailyChallenge` | WC collection items + `quizLaunch.competitionId` (post-MVP) |
| Active edition shell | — | `competitions[]` (`world-cup-2026`) |
| Qualified nations list | Filter live `nationalTeams` | `competitions.qualifiedNationalTeamIds` (48 when draw known; MVP subset) |
| Tournament squads | — | `competitionSquads[]` (editorial `playerId` only) |
| Groups | — | `competitionGroups[]` (12 × 4 `nationalTeamIds`) |
| History | — | Past `competitions` or `tournamentHistory[]` editorial |
| Confederations browse | TM confederation on NT rows | Optional `confederations.json` + `/confederation/:id` (post-MVP) |
| Search “World Cup” | `national-team` type live | **New** `competition` result type → `/world-cup` |

**Build artifacts (planned):** `src/data/worldCupLive.json` (or merge into `nationalTeamLive.json` meta) generated by `scripts/build-world-cup-live-data.js` — mirrors `build-national-team-live-data.js`; validates squad ⊆ `players[]`.

### Risks (World Cup Mode UI)

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Tournament squad changes** | Wrong names on WC pages/quiz | `competitionSquads.meta.dataAsOf`; editorial lock; show “as of” on `/world-cup/teams`; prefer `competitionSquads` over loose nationality for WC quiz |
| **Data freshness** | Club stale mid-tournament | Squad row shows club from registry; hints use durable NT facts; see [ROSTER_FRESHNESS_PLAN.md](./ROSTER_FRESHNESS_PLAN.md) |
| **Duplicate players** | Broken saves/search | One `players.id`; squads reference only; validator before JSON merge (same as NT §0c) |
| **Performance** | Slow hub with 48 nations × large memberships | Lazy-load `worldCupLive.json`; nation grid uses counts not full rosters; `content-visibility` on squad lists (already on `TeamSquadView`); default quiz = one nation or one group, not 48-team pool |
| **Citizenship ≠ WC squad** | Learner distrust | Label “World Cup squad (curated)” vs “all players in database with nationality”; don’t imply TM 26-man list |
| **Sparse quiz pool** | Empty quiz CTAs | Hide nation chip if `quizReady < N`; show “more players coming” on hub |
| **Route confusion** | Users think `/world-cup/teams` is club teams | Copy: “National teams at World Cup 2026”; link to `/national-teams` for global list |
| **Bundle size** | WC JSON + 48 groups in main chunk | Code-split `WorldCup*Page` routes; single edition file in `public/` or dynamic import at MVP+ |

### Search & quiz (inherits wave 1)

- `national-team` results + aliases — **live** for wave 1 five.
- Player hits: nation-first subtitle — **live**.
- Profile: `/national-team/:id` when membership — **live**.
- WC: add `competition` search result; `/world-cup/quiz` does not replace `/quiz` implementation.

| Stage | URL / behavior |
|-------|----------------|
| NT quiz | `/quiz?nationalTeam=england` — membership ∩ quiz-eligible |
| WC quiz | `/quiz?competition=world-cup-2026` — `competitionSquads` ∩ quiz-eligible |
| Group quiz | `/quiz?group=world-cup-2026-group-a` — union of 4 nations’ squad/eligible pools |
| Daily | WC variant post-MVP (`edition` metadata on session) |

### National-team routes (live — reference)

| Route | Status |
|-------|--------|
| `/national-teams` | Live — global hub |
| `/national-team/:teamId` | Live — country guide (`teamId` = `nationalTeamId`) |
| `/dev/national-teams` | Dev preview only |

---

## Content layers

### Layer A — Tournament shell (editorial)

- Host countries, format (48-team), confederation slots (factual, source-reviewed).
- “Why this World Cup matters” fan copy (original prose).
- Links to qualified `nationalTeam` pages.

### Layer B — Qualified nations

- List `nationalTeamIds` on `competitions.world-cup-2026`.
- Cross-link rivalries (Argentina–Brazil, USA–Mexico).

### Layer C — Squads (factual + editorial)

- `competitionSquads` rows: which **existing** `playerId` is on the squad.
- Shirt numbers optional; positions from TM or manual.
- **No new player row** when a player already exists at a club.

### Layer D — Learning & quiz

- Hints emphasize nation, tournament, role (“Argentina midfielder who …”), not only current club.
- Medium/hard modes per `QuizMode` patterns; pool scoped to squad or nation.
- Daily challenge variant: “World Cup edition” featured picks from `competitionSquads`.

### Layer E — Collections

Examples (IDs illustrative):

| Collection | Items |
|------------|--------|
| `world-cup-2026-starters` | competition + 8–12 key players |
| `south-america-wc-2026` | ARG, BRA, URU, COL, ECU, … |
| `european-champions-at-wc` | nations + star players |

`quizLaunch: { competitionId: 'world-cup-2026' }` mirrors `quizLaunch.leagueId` today.

---

## Recommended MVP (World Cup Mode UI)

Ship the **smallest tournament shell** that reuses wave 1 national teams — no full 48-team simulation until data and editorial are ready.

### MVP scope (build when gates pass)

| Surface | MVP behavior | Out of MVP |
|---------|--------------|------------|
| **`/world-cup`** | Single active edition card (`world-cup-2026`): hosts USA/Mexico/Canada, 48-team format (text), links to Teams / Quiz / History | Edition picker, confederation hub, Home hero |
| **`/world-cup/teams`** | **Nations tab only:** grid of **wave 1 five** + “more nations coming”; each card → `/national-team/:id` with linked + quiz-ready counts | Full 48-team grid, Groups tab, group deep pages |
| **`/world-cup/quiz`** | Launcher: 5 nation chips (if quiz-ready ≥ 3) + disabled tournament button until `competitionSquads` exist | Group quiz, confederation quiz, daily WC |
| **`/world-cup/history`** | **3–5** past edition cards (editorial: year, host, winner name, 1-line story); winner → `/national-team/:id` if live | Full archive, memorable player grids per edition |
| **Country guides** | No new route — link from WC pages to existing `/national-team/:id` | Duplicate WC country pages |
| **Club → country** | Rely on profile + NT squad club meta; optional 6–8 “spotlight” players on hub | Full “players from your league at the WC” browse |
| **Quiz** | Enable `/quiz?nationalTeam=` for wave 1 nations with surname validation | `/quiz?competition=` until squads curated (8–15 stars × 5 nations) |

### MVP data minimum

1. `competitions[]` — one row: `world-cup-2026` (`qualifiedNationalTeamIds`: wave 1 five only for MVP).
2. `competitionSquads[]` — **optional for MVP launch** if nation quiz uses memberships first; **required** before tournament quiz button goes live.
3. `competitionGroups[]` — **defer** (empty or placeholder copy on hub).
4. `tournamentHistory[]` — 3–5 static editorial entries (no squad simulation for past editions).

### MVP implementation order

| # | Task | Blocker |
|---|------|---------|
| 1 | `build-world-cup-live-data.js` + validator (squads ⊆ `players[]`) | Editorial squad lists for wave 1 |
| 2 | `worldCupData.js` helpers (`getActiveCompetition`, `getQualifiedTeams`, …) | Step 1 |
| 3 | Routes: four `WorldCup*Page` components + `App.jsx` (feature flag or hidden nav) | Step 2 |
| 4 | `QuizMode`: `nationalTeam` query param + pool filter | Per-NT surname report |
| 5 | `competitionSquads` + `QuizMode`: `competition` param | Step 1 + editorial |
| 6 | Groups tab + `competitionGroups` | Draw fixed + 8+ live nations |
| 7 | Navbar “World Cup” + search `competition` type | MVP stable |

**Gate:** Wave 1 NT routes **done**. MVP WC UI needs **editorial `world-cup-2026` shell** + **per-nation quiz-ready squad picks** (not nationality-only flood). Expand to wave 2 nations before marketing a “full” `/world-cup/teams` grid.

---

## Rollout order (World Cup–specific)

| Step | Work | Status |
|------|------|--------|
| 1 | Wave 1: `nationalTeams` + `nationalMemberships` + `/national-teams`, `/national-team/:teamId` | **Done** |
| 2 | Search: `national-team` type + aliases + profile links | **Done** |
| 3 | Registry membership backfill + editorial stars per live nation | **Blocked expansion** — audit §0d: 11–32 quiz-eligible/registry nation not in memberships per live NT |
| 3b | Wave 2 live: `germany`, `netherlands` (batch size **2**) after `validate-national-live.js` | Not started |
| 4 | Schema: `competitions`, `competitionSquads` in build artifacts | Planned |
| 5 | Editorial: tournament shell copy for `world-cup-2026` | Planned |
| 6 | Data: WC squad rows → existing `playerId`s (wave 1 nations first) | Planned |
| 7 | UI: `/world-cup`, `/world-cup/teams`, `/world-cup/quiz`, `/world-cup/history` | **Planned (this doc)** |
| 8 | Quiz: `?nationalTeam=` then `?competition=` | Planned |
| 9 | Groups tab + `competitionGroups` | Post-MVP |
| 10 | Collections + daily WC variants | Post-MVP |
| 11 | Polish: ambiguous surname report per NT squad | Planned |

**Gate:** `PROJECT_BRIEF.md` item 4 (major national teams) is **underway** (wave 1 live). Item 5 (World Cup mode) → **MVP above** after step 4–6 data exists.

---

## Quiz implications (World Cup)

| Topic | Plan |
|-------|------|
| Pool size | 26–30 players × 48 teams max ≈ 1,200 squad slots; quiz uses quiz-eligible subset only. |
| Hint style | Tournament + nation durable facts; avoid “currently at club X” as sole hint in WC-only mode. |
| Ambiguity | Run surname collision check per nation squad before enabling nation-specific WC quiz. |
| Filters | `competition` > `nationalTeam` > `confederation` priority for URL params. |
| Scoring / XP | Reuse `useProgression`; store `competitionId` in session metadata for future Firebase. |

---

## Search implications

- Query “World Cup” → hub result type `competition`.
- Query “Brazil” → `national-team` result before flood of Brazilian club players (ranking tweak).
- Player search unchanged; subtitle can show “Brazil NT · plays for Real Madrid”.

---

## Image implications

- No FIFA World Cup logo or trophy image without license.
- Host city photos: avoid unless licensed; use text/map description.
- Player images: unchanged placeholder policy.
- Nation visuals: abstract flag-color themes, not official crests.

---

## Scaling concerns

| Concern | Mitigation |
|---------|------------|
| Edition churn every 4 years | `competitionId` per year; old editions archived, not deleted. |
| Squad changes between TM refresh | `competitionSquads.meta.dataAsOf`; editorial lock before WC starts. |
| Bundle bloat | Lazy-load competition JSON; WC hub fetches one edition. |
| Quiz pool too large | Default quiz from one nation or “knockout teams” collection. |

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Duplicate players for WC | Breaks save/compare/merge | Enforce squad → existing `playerId` only in validator |
| Club-only hints in WC quiz | Wrong mode feel | Hint template per `quizContext: club \| national \| competition` (future field) |
| Unqualified / wrong nation | Trust loss | Manual editorial sign-off on `competitionSquads` |
| Political naming (Taiwan, etc.) | UX sensitivity | Use FIFA display names consistently in `nationalTeams.name` |
| Firebase before content ready | Sync empty NT progress | Brief: Firebase only after WC mode planned + content breadth |

---

## Success criteria (planning complete → ready to implement)

- [x] Raw TM national data inspected (`national_teams.json.gz`, player citizenship/caps fields) — 2026-05-25.
- [x] `national-teams-preview.json` audited — 2026-05-25; see audit summary above.
- [x] Priority 12 nations mapped to FootyBrain `nationalTeamId` slugs — see `NATIONAL_TEAM_PLAN.md` §0.
- [x] Wave 1 national routes live — `/national-teams`, `/national-team/:teamId`.
- [x] World Cup Mode UI route map agreed — `/world-cup`, `/world-cup/teams`, `/world-cup/quiz`, `/world-cup/history` (this doc).
- [ ] Schema notes approved (`national-team-schema-notes.md`).
- [ ] No second player table in any draft import script.
- [ ] Club `teams` / `leagues` untouched in migration design.
- [ ] Editorial workflow for squad = list of `playerId` references, not new bios from scratch per NT clone.
- [ ] Validator rules written down before first WC JSON lands.
- [ ] MVP data: `world-cup-2026` shell + wave 1 `competitionSquads` (or nation-quiz-only launch documented).

---

## Validation rules (World Cup + national merge gate)

Before `competitionSquads` or NT pages ship:

1. `competitionSquads[].playerId` ⊆ existing `players[]` (no WC-only clones).
2. Per-nation WC squad size cap (e.g. 26) with editorial approval flag.
3. Per-nation surname ambiguity check on squad ∩ quiz pool.
4. `nationalTeamId` on squad row must match player’s primary `nationalMembership` (or editorial exception documented).
5. Quiz hints for WC mode: durable nation/tournament facts; `quizContext: competition` when implemented.
6. Preview `playerLinks` **not** used as sole squad source — require registry membership pass (see NATIONAL_TEAM_PLAN §0c).

---

## Biggest risks (national → World Cup)

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| **Duplicate players** | TM `players.json.gz` includes 2,458 NT-parent rows | Import memberships only; never NT-parent as new `players[]` |
| **Citizenship ≠ NT** | Naturalized / dual players (e.g. Brazil-born Spain) | `isPrimary` on membership + editorial; quiz hints name nation explicitly |
| **USA / England naming** | `United States` vs `USA`; UK home nations | Fixed slugs + `searchAliases.js`; FIFA display names on `nationalTeams.name` |
| **Sparse `national_team` object** | Only ~16% of TM player rows | Derive primary NT from membership + citizenship map, not scrape alone |
| **Caps accuracy** | TM caps can lag or disagree with FIFA | Show caps only when verified; optional field on membership |
| **No WC squad in TM export** | 2026 squads are editorial/event-driven | `competitionSquads` as curated `playerId` list after club registry stable |
| **Quiz hint mismatch** | Club-only hints wrong in WC mode | Future `quizContext: national \| competition` template (see `WORLD_CUP_MODE_PLAN.md`) |
| **Curated CSV gap** | No local `players.csv` until zip pull | v1 scripts use scraper NDJSON + existing `sampleData` join |

---

## Out of scope (this roadmap)

- Live scores, fixtures, or bracket simulation.
- Women’s World Cup.
- Youth tournaments (U20/U17) unless later `role` expansion.
- Official video/highlights embedding.
- Firebase auth and cloud saves.
- Rewriting existing club browse or team profile UX.

---

## See also

- [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) — **full** World Cup Mode product plan (2026)
- [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) — full national team architecture audit
- [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) — pre-Firebase sequence (MLS → Brasileirão → NT → World Cup → Firebase)
- [ROADMAP.md](./ROADMAP.md) — product-level milestones
