# National team expansion plan

> Aligns with `PROJECT_BRIEF.md`: men’s soccer only; Firebase after MLS, Brasileirão, national teams, and World Cup mode.  
> **Wave 1 (2026-05-25):** Five nations went live (`england`, `france`, `spain`, `brazil`, `argentina`).  
> **Wave 2 (2026-05-26):** Major national-teams layer added as **join-only** memberships (no new `players[]` rows). **25 nations live.**  
> **Wave 3 (2026-05-26):** **24 additional nations** staged in preview only — **not** added to `LIVE_NATIONAL_TEAM_IDS` until per-nation rollout gates pass (`npm run report:national-teams-wave3`).  
> **Gate:** Keep expansion **data-safe**: reuse registry players, never import NT-parent-only players, keep quiz gating unchanged, and treat unmatched TM rows as preview-only.

---

## 0. Raw dataset inspection (2026-05-25)

Inspection: `npm run inspect:tm` / `scripts/inspect-transfermarkt-csvs.js` against local `raw-data/transfermarkt-datasets/` (DVC scraper populated; **curated CSV zip not on disk**).

### What exists today

| Source | Path | Rows / notes |
|--------|------|----------------|
| **National team entities** | `data/raw/transfermarkt-scraper/2025/national_teams.json.gz` | **119** men’s NT rows |
| **Player pool (mixed)** | `data/raw/transfermarkt-scraper/2025/players.json.gz` | **18,242** lines: **15,784** club-parent, **2,458** `parent.type === "national_team"` |
| **Richer player NT fields** | `appearances.json.gz` (parent player object) | Same fields as profile scrape: `international_caps`, `international_goals`, `national_team`, `additional_citizenships` |
| **Domestic “countries”** | `data/countries.json` | **League-country** metadata (`country_code` = `GB1`, `ES1`, …) — **not** FIFA NT codes |
| **Confederations** | `data/competitions.json` parent `type: confederation` | UEFA, CONMEBOL, etc. — competition catalog, not NT squads |
| **Curated export (future)** | `national_teams.csv`, `countries.csv`, `players.csv` (dbt) | Documented in TM repo; **missing locally** until zip/`dvc pull` curated tables |
| **football.json** | `raw-data/football.json/**` | Fixtures only — **no** players, NT, or caps |

### Fields mapped to FootyBrain

| Need | Raw field(s) | Reliability |
|------|----------------|-------------|
| **National team list** | `national_teams.json.gz`: `name`, `code`, `confederation`, `fifa_ranking`, `squad_size`, `href` → TM `national_team_id` | High for entity metadata |
| **Country codes** | TM `code` slug (`brazil`, `england`, `united-states`) + `parent.country_id` on NT rows; curated `countries.csv` when available | Use FootyBrain `nationalTeamId` = normalized TM `code` |
| **Player citizenship** | `players.*.citizenship` (string; may be dual comma-separated) | High coverage on club-parent rows |
| **Senior NT represented** | `players.*.national_team` object `{ country, href }` | **Sparse** (~2,865 / 18k in full scrape); prefer citizenship + editorial `isPrimary` |
| **Caps / goals** | `international_caps`, `international_goals` on player / appearance parent | Present on **~13.5k** rows when scraped; treat as **TM snapshot**, verify for quiz copy |
| **Dual nationality** | `additional_citizenships` | ~4.5k rows — use for profile text, not auto-quiz without `isPrimary` |
| **NT squad membership (TM)** | Players with `parent.type === "national_team"` and `parent.code` | **Do not import as new `players[]` rows** — join to existing `tm-*` club players by `sourceId` |

### Priority nations — all present in `national_teams.json.gz`

| FootyBrain `nationalTeamId` | TM `name` | TM `code` | Confederation | TM squad_size | FIFA rank (TM) | Players in live `sampleData` with matching `nationality` |
|-----------------------------|-----------|-----------|---------------|---------------|----------------|----------------------------------------------------------|
| `france` | France | `france` | UEFA | 25 | 1 | ~130 |
| `spain` | Spain | `spain` | UEFA | 27 | 2 | ~165 |
| `argentina` | Argentina | `argentina` | CONMEBOL | 29 | 3 | ~97 |
| `england` | England | `england` | UEFA | 35 | 4 | ~124 |
| `portugal` | Portugal | `portugal` | UEFA | 26 | 5 | ~45 |
| `brazil` | Brazil | `brazil` | CONMEBOL | 24 | 6 | ~404 |
| `netherlands` | Netherlands | `netherlands` | UEFA | 25 | 7 | ~90 |
| `germany` | Germany | `germany` | UEFA | 25 | 10 | ~129 |
| `italy` | Italy | `italy` | UEFA | 28 | 12 | ~60 |
| `mexico` | Mexico | `mexico` | CONCACAF | 12 | 15 | ~11 |
| `united-states` | United States | `united-states` | CONCACAF | 27 | 16 | ~258 |
| `switzerland` | Switzerland | `switzerland` | UEFA | 26 | 19 | ~23 |

**Naming:** FootyBrain slug `united-states` (display “United States”); search aliases `usa`, `usmnt`. Never reuse domestic `country_code` from `countries.json` (`GB1`, `FR1`) as NT ids.

### Recommended first national-team import set (data only)

**Wave A — entities (no new players):**

1. `editorial-overlays/confederations.json` — `uefa`, `conmebol`, `concacaf` (+ `afc`, `caf`, `ofc` stubs).
2. `editorial-overlays/national-teams.json` — **12 priority nations** above + `fifaCode`, `confederationId`, `meta.dataAsOf`, text-only `crestPolicy`.

**Wave B — memberships (join only):**

3. `editorial-overlays/national-memberships.generated.json` built by script:
   - Input: existing `players[]` with `sourceId` / `tm-*` ids.
   - Match TM NT squad: same `spieler` id in club export **or** NT-parent row with same href id.
   - Output: `{ playerId, nationalTeamId, role: "senior", status: "active", caps?, isPrimary }`.
   - **Cap membership count per nation** for v1 (e.g. 30–40 per priority NT, quiz-eligible first).

4. Merge script pass: set `players.nationalTeam` from **primary** membership; keep `players.nationality` = citizenship string.

**Wave C — editorial (parallel):**

5. Approve **8–15 quiz-ready players per priority NT** already in club dataset (reuse `players.generated-draft.json` pattern; NT-specific hints).

**Defer:** Importing all 119 TM nations, youth NTs, women’s NTs, or ~2.4k NT-parent-only player rows.

### Avoiding duplicate player records

| Rule | Implementation |
|------|----------------|
| Single registry | Every human = one `players.id` (`tm-{sourceId}` or MVP slug). |
| No NT-parent import | Rows in `players.json.gz` where `parent.type === "national_team"` are **squad context**, not new app players. |
| Membership join | `nationalMemberships.playerId` → existing club player only; validator fails on unknown `playerId`. |
| World Cup later | `competitionSquads` reference same `playerId`; see [WORLD_CUP_ROADMAP.md](./WORLD_CUP_ROADMAP.md). |
| Slug stability | `nationalTeamId` = TM `code`; `import-maps.json` maps TM `national_team_id` (href segment) if needed. |

### Preview audit (`national-teams-preview.json`, 2026-05-25) — superseded by §0d

Historical baseline: 171 links, 11 unmatched, 12 teams. See **§0d** for current audit vs live app.

### §0d Major national-teams preview audit (2026-05-26)

**Artifacts:** `generated-data/national-teams-preview.json` (12 priority nations), `npm run validate:national-teams-preview` (**PASSED**), live data `src/data/nationalTeamLive.json` (5 nations).

**Build command:** `npm run build:national-teams-preview` · **Validator:** `npm run validate:national-teams-preview`

#### Summary counts

| Metric | Value |
|--------|------:|
| Teams in preview | **12** |
| Linked existing players (`playerLinks`) | **171** |
| Unmatched TM rows (`previewOnly`, no `players[]` import) | **11** |
| Quiz-eligible in preview links (all 12 NTs) | **35** |
| Cross-NT duplicate `playerId` in preview | **0** |
| Unmatched rows wrongly in club registry | **0** |
| `inspection.entityDataClean` | **true** |
| `inspection.ntSquadParentDataClean` | **false** (11 NT-parent rows; linker = TM `national_team.country` only) |

#### Integrity checks

| Check | Result | Verdict |
|-------|--------|---------|
| **Teams included** | 12/12 priority nations in TM raw + preview | **OK** — list matches §0 priority table |
| **Linked players** | 171 links; 100% `playerId` in club registry | **OK** for join integrity |
| **Unmatched players** | 11 (USA 6, Portugal 2, Switzerland 2, Mexico 1) | **Safe as preview-only** — `not_in_club_registry`; includes Diogo Jota, Ochoa, Klinsmann; **do not import** |
| **Duplicate player risks** | 0 duplicate link per NT; 0 preview `playerId` on multiple NTs | **Low risk** |
| **Missing DOB / nationality / position** | 0 on link `missingFields`; 0 linked registry rows missing DOB/nat/pos | **OK** on linked set |
| **Country code consistency** | `id` = TM `code` (`united-states`, not `usa`); confederations normalized | **OK** |
| **List freshness / verification** | TM 2025 scrape; NT-parent squads **stale vs** TM `squad_size` for all 12 (0–6 scraped vs 12–35 reported) | **Unverified as current squads** — TM field linker is a snapshot, not FIFA 2026 rosters |
| **National-team-only players** | Unmatched array only; no `playerId`; validator blocks registry false positives | **Handled safely** |
| **Search aliases** | Preview entities: aliases only on `united-states` (`usa`, `usmnt`). Live five have aliases in `nationalTeamLive.json`; search type **shipped** | Add aliases for wave 2+ at merge time (`germany`, `netherlands`, …) |

**Surname collisions in preview (quiz risk if pool = raw links):** Spain — García ×2, Marín ×2; Brazil — Henrique ×2.

#### Per-nation table (preview + registry + live status)

| `nationalTeamId` | Live? | Preview links | Preview quiz links | Registry players† | Registry quiz† | Live memberships | Live squad quiz‡ |
|------------------|:-----:|--------------:|-------------------:|------------------:|-----------------:|-----------------:|-----------------:|
| `brazil` | yes | 28 | 5 | 404 | 35 | 28 | 8 |
| `france` | yes | 23 | 4 | 130 | 28 | 23 | 8 |
| `england` | yes | 15 | 7 | 124 | 35 | 15 | 11 |
| `spain` | yes | 19 | 4 | 165 | 40 | 19 | 8 |
| `argentina` | yes | 8 | 2 | 97 | 19 | 8 | 8 |
| `germany` | no | 21 | 3 | 129 | 32 | — | — |
| `netherlands` | no | 18 | 7 | 90 | 22 | — | — |
| `italy` | no | 10 | 1 | 60 | 9 | — | — |
| `portugal` | no | 8 | 0 | 45 | 10 | — | — |
| `united-states` | no | 13 | 1 | 290 | 14 | — | — |
| `mexico` | no | 7 | 1 | 11 | 1 | — | — |
| `switzerland` | no | 1 | 0 | 23 | 5 | — | — |

† Registry = nationality / `nationalTeam` string match in `sampleData.js` (approximate).  
‡ Live squad quiz = quiz-eligible players in `nationalMemberships` (min pool = 3).

**Live nations — registry quiz not in memberships (backfill gap):** england 24, france 20, spain 32, brazil 27, argentina 11 quiz-eligible registry players missing from live membership rows.

#### Audit verdict: safe to make live?

| Action | Verdict |
|--------|---------|
| **Merge preview `playerLinks` into `sampleData` / new `players[]`** | **No** |
| **Import unmatched TM rows as players** | **No** |
| **Add live nations 6–12 from preview alone** | **No** — preview coverage too thin vs registry; NT-parent scrape outdated |
| **Keep current live five** (`england`, `france`, `spain`, `brazil`, `argentina`) | **Yes — maintain** — validator passes; national quiz meets min pool on membership subset; squads are **incomplete** vs registry (disclose in UI) |
| **Next live batch (after backfill script)** | **2 nations:** `germany`, `netherlands` — see §0d.1 |

#### §0d.1 Recommendations (2026-05-26)

| Question | Recommendation |
|----------|----------------|
| **Safe to make live *now* (new nations)?** | **None** of the seven preview-only nations. |
| **Safe to remain live (current five)?** | **Yes**, with membership backfill + Spain surname check before promoting NT quiz in marketing. |
| **Preview-only (stay staged)** | `italy`, `portugal`, `switzerland`, `mexico`, `united-states` — thin TM links and/or thin registry (Mexico **11** players). |
| **Ready for live after registry memberships (not preview)** | `germany` (21 TM links, 32 registry quiz), `netherlands` (18 links, 22 registry quiz). |
| **Need more club imports first** | `mexico` (host but ~11 Mexican players in DB); `united-states` (large registry but TM linker starved — expand MLS/editorial, then membership pass). |
| **First live batch size (expansion)** | **2** — Germany + Netherlands, only after `build-national-memberships.js` + `validate-national-live.js`. |
| **Defer** | `italy`, `portugal`, `switzerland` until registry quiz depth + TM entity review. |

**Unmatched detail (do not import):**

| NT | Player | `sourceId` |
|----|--------|------------|
| mexico | Francisco Guillermo Ochoa Magaña | 29559 |
| portugal | Diogo Jota | 340950 |
| portugal | João Gonçalo Carapinha Carvalho | 929868 |
| switzerland | Stefan Gartenmann, Cedric Jan Itten | 243770, 243856 |
| united-states | Tolkin, Campbell, Morris, Agyemang, Wright, Klinsmann | 683812, 585769, 513968, 1089574, 315291, 334992 |

### Dev preview gate (2026-05-25)

`/dev/national-teams` reviewed: entity rows clean, join model has **zero cross-NT duplicate `playerId`s**, warnings understood (sparse TM squad scrape). **Approved to plan live routes** — wave 1 five shipped; **not approved** to expand live set from preview without §0d backfill.

### §0c Validation rules (required before live NT merge / expansion)

1. Every `playerLinks[].playerId` exists in `sampleData` / app-ready registry.
2. No `playerId` appears on more than one priority NT unless `nationalMemberships` explicitly allows dual (`isPrimary` set).
3. No new `players[]` row from TM unmatched NT-squad scrape.
4. `nationalTeamId` slugs match `nationalTeams[].id` and TM `code` map (`united-states` ↔ display “United States”).
5. Per-NT surname collision report (same as club `validate-app-ready-preview` style) before enabling NT quiz — **mandatory for Spain** before widening pool.
6. **Registry backfill rule:** every `quizEligible` player with `nationality` / `nationalTeam` matching a live NT should have a `nationalMembership` row — **fails today** for live five (11–32 gaps per nation per §0d).
7. WC `competitionSquads[]` only reference existing `playerId`s; editorial sign-off per nation.
8. `inspection.ntSquadParentDataClean === true` OR documented fallback (`registry_nationality` membership source) in merge meta — **use registry fallback** (NT-parent scrape not clean).
9. **`validate-national-live.js` (planned):** per live nation — `memberships ≥ 15` OR `quizEligibleMemberships ≥ 8` before marketing “full squad”; wave 2 nations must pass before `nationalTeamLive` merge.
10. **Expansion gate:** no new `liveNationalTeamIds` until rules 5–6 pass for that nation.

**Next build script (planned):** `build-national-memberships.js` — registry pass: link players where `players.nationalTeam` / `nationality` matches live `nationalTeamId` (required before public squad lists).

---

## 1. Live rollout status

Aligns with `PROJECT_BRIEF.md` gate **#4** (major men’s national teams).

### 1.1 Wave 1 — shipped (2026-05-25)

**Live today:** `england`, `france`, `spain`, `brazil`, `argentina` — `nationalTeamLive.json`, `/national-teams`, `/national-team/:teamId`, search `national-team` type, profile links. National quiz enabled when squad has ≥3 quiz-ready players (all five meet this on **membership** subset).

| `nationalTeamId` | Memberships | Quiz-ready in squad | Audit note |
|------------------|------------:|--------------------:|------------|
| `brazil` | 28 | 8 | Preview TM links = membership set; registry has 27 more quiz-eligible not linked |
| `france` | 23 | 8 | Same backfill gap |
| `england` | 15 | 11 | Strongest NT quiz pool |
| `spain` | 19 | 8 | Surname collision risk in preview if pool widened without validator |
| `argentina` | 8 | 8 | Small membership list; all 8 quiz-ready |

**Original plan had USA + Germany in wave 1; shipped set swapped in Spain + Argentina.** Do **not** add Germany/USA from preview until §0d.1 backfill.

### 1.2 Wave 2 — shipped (2026-05-26)

**Live now (wave 2):** `germany`, `portugal`, `italy`, `netherlands`, `belgium`, `croatia`, `switzerland`, `denmark`, `serbia`, `turkey`, `united-states`, `mexico`, `uruguay`, `colombia`, `chile`, `morocco`, `senegal`, `nigeria`, `japan`, `korea-republic`.

**How wave 2 is safe:**

- Memberships are built from **existing registry players only** (`playerId` must exist in `sampleData.js`).
- TM squad rows that do not match the club registry are kept as **preview-only** (`unmatchedTmSquadRows`) and never imported as players.
- Quiz still uses **membership ∩ quiz-eligible**; minimum pool remains **3**.

### 1.3 Scoring snapshot (12 candidates)

| Nation | WC relevance (1–5) | Registry players | Registry quiz† | Preview link dup risk | Wave |
|--------|-------------------:|-------------------:|---------------:|----------------------|------|
| Brazil | 5 | 404 | 35 | Low | **1 live** |
| France | 5 | 130 | 28 | Low | **1 live** |
| England | 5 | 124 | 35 | Low | **1 live** |
| Spain | 5 | 165 | 40 | **Medium** (surnames) | **1 live** |
| Argentina | 5 | 97 | 19 | Low | **1 live** |
| Germany | 5 | 129 | 32 | Low | **2 next** |
| Netherlands | 4 | 90 | 22 | Low | **2 next** |
| United States | 5 (host) | 290 | 14 | Low | 2+ (after backfill) |
| Italy | 4 | 60 | 9 | Low | preview |
| Portugal | 4 | 45 | 10 | Low | preview |
| Mexico | 5 (host) | ~11 | 1 | Low | imports first |
| Switzerland | 2 | 23 | 5 | Low | defer |

† Registry quiz ≈ `quizEligible` players with matching nationality string (see §0d).

### 1.4 Live route structure (shipped)

| Route | Purpose | Nav |
|-------|---------|-----|
| `/national-teams` | Hub: list **live** nations only (wave 1 five cards + confederation grouping optional); link to each country page | **Not** in main `Navbar` for wave 1 — discover via search, profile links, future collections |
| `/national-team/:teamId` | Country page: identity, fan guide (editorial), rivals, **squad** = `nationalMemberships` → existing `PlayerCard` → `/player/:playerId` | Same |

**Param name:** use `teamId` in the route to match existing router patterns (`/team/:teamId`), but value is **`nationalTeamId`** (`brazil`, not `flamengo`). Document in code comments to avoid club/national route confusion.

**Out of scope wave 1:** `/confederation/:id`, `/world-cup/*` (see [WORLD_CUP_ROADMAP.md](./WORLD_CUP_ROADMAP.md)).

**Data files (planned merge, not live yet):**

- `src/data/nationalTeams.js` (or JSON under `src/data/`) — five entity rows from preview + editorial `fanGuide` / `rivalIds`
- `src/data/nationalMemberships.js` — join rows; **source = registry backfill**, preview `playerLinks` as hint only
- Helpers: `getNationalTeamById`, `getPlayersForNationalTeam`, `getLiveNationalTeamIds()`

### 1.5 Search integration (wave 1)

| Piece | Plan |
|-------|------|
| **New result type** | `national-team` in `universalSearch.js` (parallel to `team`, `league`, `player`) |
| **Country aliases** | Add `NATIONAL_TEAM_ALIASES` in `searchAliases.js` for live five only |

```js
// Illustrative — implement at ship time
const NATIONAL_TEAM_ALIASES = {
  brazil: ['brasil', 'selecao', 'seleção', 'bra'],
  france: ['les bleus', 'fra'],
  england: ['three lions', 'eng'],
  germany: ['die mannschaft', 'ger', 'deutschland'],
  'united-states': ['usa', 'us', 'usmnt', 'united states', 'america'], // not bare "america" alone
};
```

| **Ranking** | For query “brazil”, rank `national-team` result **above** club players; cap player results or group by type |
| **Player search fields** | Extend `getPlayerSearchFields`: include `nationality`, `nationalTeam`, live `primaryNationalTeamId` |
| **Player profile** | `nationalTeam` label → `Link` to `/national-team/:teamId` when nation is live; club links unchanged |
| **Subtitle** | Search result subtitle: `{nationalTeam} · {clubName}` for players |

### 1.6 Quiz integration (partially shipped)

National quiz is **live** for wave 1 five when squad quiz-ready ≥ 3. Do **not** promote WC tournament quiz until `competitionSquads` exist.

| Phase | Work |
|-------|------|
| **NT quiz v1** | `/quiz?nationalTeam=brazil` — pool = `getQuizEligiblePlayers` ∩ `nationalMemberships` (**shipped** for live five) |
| **Hint context** | Optional `quizContext: 'national'` on hints — durable NT facts, not club-only |
| **World Cup mode** | `/quiz?competition=world-cup-2026` — pool = `competitionSquads` ∩ quiz-eligible; see WORLD_CUP_ROADMAP |
| **Daily** | Optional WC/NT featured picks after collections ship |

### 1.7 Wave 1+2 ship checklist (updated)

- [x] Routes `/national-teams`, `/national-team/:teamId` + profile/search hooks
- [x] `nationalTeamLive.json` for five nations (memberships from preview links at ship time)
- [x] Search: `national-team` type + aliases (live five)
- [x] National quiz param `/quiz?nationalTeam=` (min pool 3; live five qualify)
- [ ] `build-national-memberships.js` — **registry backfill** for live five (close 11–32 quiz gaps per §0d)
- [ ] Editorial: 8–15 quiz-ready stars per live nation in membership set
- [ ] `validate-national-live.js` — §0c + per-NT surname report (**Spain** priority)
- [x] Wave 2: expand live nations via `build-national-team-live-data.js` (preview links + registry backfill; capped per nation)
- [ ] **No** main nav “National teams” until product review (unchanged)

### Club + country on player profiles (planned UX — no UI change yet)

Current UI (`PlayerProfile.jsx`): **Nationality** + **National team** text; **Current club** + **League** links; hero line shows club · league · national team string.

**Target when NT routes ship:**

| Label | Source | Link |
|-------|--------|------|
| Nationality | `players.nationality` | Text only (dual: “Brazil, Italy”) |
| Represents (national team) | Primary `nationalMembership` / `players.nationalTeam` | Link → `/national-team/:nationalTeamId` |
| Current club | `players.teamId` | Link → `/team/:teamId` (unchanged) |
| League | `players.leagueId` | Link → `/league/:leagueId` (unchanged) |
| Caps (optional) | `nationalMemberships.caps` | Text: “42 caps · 12 goals” if editorially verified |

Subtitle pattern: `{nationalTeam} · {club}` — e.g. “Brazil · Real Madrid”.

---

## 1. Current data model audit

### Players (`src/data/sampleData.js` → `players[]`)

| Aspect | Current state |
|--------|----------------|
| **Identity** | Single global array; ~1,231 rows (36 manual MVP + generated club squads). Stable `id` (`haaland`, `tm-*`). |
| **Club link** | `teamId` + `leagueId` (current club). Required for browse, quiz club filters, team profile rosters. |
| **Country fields** | `nationality` and `nationalTeam` strings on each row. Often identical; many generated rows use citizenship as both (see `DATA_MERGE_PLAN.md`). |
| **Editorial** | `quickFact`, `quizHints[]`, `playingStyle`, `importanceScore`, `quizEligible`, `dataStatus`, `rosterTier`. |
| **Images** | `imageUrl` usually null; `visualTheme` assigned in code. See `PLAYER_IMAGE_POLICY.md`. |
| **Career** | `careerHistory[]` club-centric text; not structured NT caps. |

**Gap:** There is no national-team **entity**, no squad membership table, and no confederation model. `nationalTeam` is a display string, not a join key.

### Clubs (`teams[]`)

| Aspect | Current state |
|--------|----------------|
| **Role** | Canonical “team” for routes `/team/:teamId`, fan content, rivals, legends, `currentKeyPlayers[]` (string names, not IDs). |
| **League** | Every club has `leagueId` → one of 6 domestic leagues. |
| **Scope** | Men’s club football only. |

**Keep intact:** All club architecture, merge caps (22/club), editorial backlog per club, and `TeamProfile` content model stay as-is.

### Leagues (`leagues[]`)

| Aspect | Current state |
|--------|----------------|
| **Role** | Domestic competitions: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie. |
| **Routes** | `/league/:leagueId`. |
| **Scope** | Club football only; no “international league” row today. |

**Plan:** Do **not** add national teams into `leagues[]`. International football uses `nationalTeams[]` + optional `competitions[]`.

### Quiz eligibility (`src/utils/quizEligibility.js`)

| Rule | Behavior |
|------|----------|
| Gate | `quizEligible !== false`, ≥2 `quizHints`, `quickFact` length ≥12. |
| Pool | `getQuizEligiblePlayers(allPlayers)` — no NT filter. |
| Quiz UI | Filters by `leagueId` and `teamId` on the **player’s club** (`QuizMode.jsx`). |
| Difficulty | Easy uses club/position/nationality; medium uses `nationalTeam` + hint. |
| Answers | Full name or unambiguous last name within **active pool** (`buildAmbiguousLastNames`). |

**Gap:** No `?nationalTeam=` or `?competition=` filter. International quiz = filter players by `nationalTeam` string match (fragile) until membership model exists.

### Search (`src/utils/universalSearch.js`, `searchAliases.js`)

| Aspect | Current state |
|--------|----------------|
| **Types** | `player`, `team` (club), `league` only. |
| **Player fields** | `name`, aliases, club name, league name, **not** explicit `nationality` / `nationalTeam` in `getPlayerSearchFields` today. |
| **Subtitle** | Shows `nationalTeam \|\| nationality` for players. |

**Gap:** Cannot search “Brazil national team” as an entity. Country strings on players are underused in search index.

### Compare (`src/utils/playerCompare.js`, `ComparePage`)

| Aspect | Current state |
|--------|----------------|
| **Input** | Two `playerId`s from global registry. |
| **Insights** | Compares `leagueId`, position group, **`nationalTeam` string equality**, importance score, career stops. |
| **Club link** | Implicit via player’s `teamId`. |

**No duplicate players required.** Compare stays player-vs-player; optional future: “compare nations’ key players” via two player picks or nation landing pages.

### Collections (`src/data/collectionsData.js`, `src/utils/collections.js`)

| Aspect | Current state |
|--------|----------------|
| **Item types** | `player`, `team`, `league` only. |
| **Resolution** | `resolveCollectionItem` → `getPlayerById` / `getTeamById` / `getLeagueById`. |
| **Quiz launch** | `quizLaunch.teamId` or `quizLaunch.leagueId` → `/quiz?team=` / `?league=`. |
| **Paths** | `getEntityProfilePath`: `/player/`, `/team/`, `/league/`. |

**Gap:** No `national-team` or `competition` collection items yet.

---

## 2. Integration model (no duplicate players)

### Core rule

```
ONE player.id  →  ONE human
                →  ONE current club (teamId / leagueId)
                →  ZERO OR MORE nationalMemberships (national teams)
                →  OPTIONAL competitionSquads (World Cup, etc.)
```

Never create `id: "mbappe-france"` and `id: "mbappe-psg"`. Never fork TM rows per context.

### Why not duplicate?

| Risk if duplicated | Consequence |
|--------------------|-------------|
| Editorial drift | Hints/facts updated on club row only; NT quiz stale. |
| Saved / progress | `localStorage` keys by `playerId` break or double-count. |
| Search | Two results for one person. |
| Compare | Same athlete, two IDs — confusing. |
| Merge pipeline | TM refresh updates one row; other orphaned. |

### Recommended layering

| Layer | Entity | Analogy |
|-------|--------|---------|
| L1 | `players` | Person registry (unchanged) |
| L2 | `teams` + `leagues` | Club football (unchanged) |
| L3 | `nationalTeams` + `confederations` | New parallel to clubs, not inside leagues |
| L4 | `nationalMemberships` | Join: who plays for which NT |
| L5 | `competitions` + `competitionSquads` | Tournament overlays (World Cup) |

### Field semantics (target)

| Field | Meaning |
|-------|---------|
| `nationality` | Citizenship label(s) simplified to one primary string for UX. |
| `nationalTeam` | Primary **men’s senior** NT for quizzes and profile (string and/or derived from `isPrimary` membership). |
| `teamId` / `leagueId` | **Club only** — never “France” as a `teamId`. |

Dual-national players: one player row; `nationalMemberships` may list multiple NTs with one `isPrimary: true` for default quiz copy. Hints should use full name + role, not ambiguous “plays for two countries” without disambiguation.

---

## 3. Future surfaces (planned, not built)

See **§1.3** for confirmed live routes. Summary:

### National team pages

- **Hub:** `/national-teams` — browse live nations (wave 1: five teams).
- **Detail:** `/national-team/:teamId` (e.g. `/national-team/brazil`) — `teamId` param holds `nationalTeamId`.
- **Content:** Identity, confederation, fan guide, rivals, legends (editorial), **squad list** from `nationalMemberships` → hydrate player cards (same `PlayerCard` / `/player/:id`).
- **Links:** Each player card → existing player profile (club section still shows current club).

### Confederations

- **Route (proposed):** `/confederation/:confederationId` or section on browse.
- **Content:** Member nations list → links to national team pages.
- **Quiz:** Optional filter “UEFA nations only” via `nationalTeam.confederationId`.

### World Cup learning

See [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) — tournament entity, group-stage guides, squad overlay, dedicated quiz/collections mode.

### International quiz filters

| Filter | Mechanism |
|--------|-----------|
| By nation | `nationalMemberships` where `nationalTeamId = X` ∩ quiz-eligible players |
| By confederation | All NT ids in confederation → membership join |
| By competition | `competitionSquads` for `world-cup-2026` |
| Club + country (browse) | Existing `leagueId`/`teamId` **plus** `nationality` or `primaryNationalTeamId` filter on same `players[]` |

**Query params (proposed, future):** `/quiz?nationalTeam=brazil`, `/quiz?competition=world-cup-2026` — mirrors existing `?team=` / `?league=`.

### Club vs country profile links

On **player profile** (already partially there):

- **Current club** → `/team/:teamId` (keep).
- **League** → `/league/:leagueId` (keep).
- **National team** → `/national-team/:nationalTeamId` (new link when entity exists).
- **Nationality** → text only, or link if it maps 1:1 to a national team id (e.g. `Brazil` → `brazil`).

On **national team page:**

- Squad players → `/player/:playerId`.
- “Play at club X” → player’s current `teamId` on card subtitle.

---

## 4. Club database stays intact

| Do not change | Reason |
|---------------|--------|
| `teams[]` schema for clubs | Fan guides, rivals, legends, rosters tied to `teamId`. |
| `leagues[]` as domestic only | Browse and filters assume club leagues. |
| Merge script club caps | 22 players/club, phase-3 pipeline. |
| `/team/:teamId` routes | Bookmarks, collections, quiz `?team=`. |
| Editorial backlog per club | Independent from NT editorial pass. |

National content is **additive files** (e.g. `nationalTeams.json`, `nationalMemberships.json`) merged into helpers alongside `sampleData.js`, or a second export from the same build step — not a rewrite of club tables.

---

## 5. Avoid parallel duplicate systems

| Anti-pattern | Preferred approach |
|--------------|-------------------|
| `nationalTeamPlayers[]` duplicate array | `nationalMemberships` join |
| `teams` rows for Brazil/France | `nationalTeams` entity |
| `leagueId: "international"` | `competitions[]` or tags |
| Separate quiz player pool | Same `players[]`, filter via join |
| Second search index | Extend `searchUniversal` with type `national-team` |
| NT-specific player IDs | Same `player.id` everywhere |

---

## 6. Risks

| Risk | Mitigation |
|------|------------|
| **Dual nationality confusion** | Primary NT flag; quiz hints use full name; expand ambiguous surname rules per NT pool. |
| **`nationalTeam` string ≠ membership** | Build step validates `players.nationalTeam` against primary membership; editorial overlay is source of truth. |
| **Citizenship vs NT** | Document in UI: “Nationality” vs “Represents”; overlay for Brazil-born Spain internationals. |
| **Stale club vs NT** | Player row = current club from TM; NT caps/squads versioned by `meta.dataAsOf` on membership/competition. |
| **Women’s / youth NT pollution** | Schema `role: senior` only for MVP; women’s out of scope per brief. |
| **Legal: crests / flags** | Text-only or abstract color themes; no official FIFA crests without license (`PLAYER_IMAGE_POLICY.md`). |
| **Scope creep** | Ship major NTs first (~32 WC + friends), not all 200+ FIFA members at once. |
| **Firebase later** | Same IDs for saves/progress; NT progress can be `localStorage` keys by `nationalTeamId` before cloud. |

---

## 7. Scaling concerns

| Area | Concern | Notes |
|------|---------|--------|
| **Data volume** | ~1,200 club players → add ~500–800 membership rows if tagging all eligible; WC squad ~26×48 teams. | Join table is small; keep in memory like today. |
| **Bundle size** | Another JSON chunk in `sample-data` chunk. | Lazy-load `nationalTeams` + memberships when adding routes; or split dev bundle. |
| **Build** | Merge validation crosses club + NT. | New validator: orphan `playerId`, duplicate membership, NT without confederation. |
| **Editorial** | NT quiz hints for every membership. | Only quiz-eligible players need hints; browse can show factual rows. |
| **Performance** | Filtering NT squad = O(memberships). | Precompute `playersByNationalTeamId` map at build time. |

---

## 8. Search implications

1. Add result type `national-team` in `searchUniversal`.
2. Add `nationality`, `nationalTeam`, and FIFA codes to `getPlayerSearchFields`.
3. Add `NATIONAL_TEAM_ALIASES` in `searchAliases.js` (`brazil` → `brasil`, `usa` → `united states`).
4. Confederations searchable as type `confederation` (low priority).
5. Do not index duplicate pseudo-players.

---

## 9. Quiz implications

1. **Pool construction:** `getQuizEligiblePlayers` → intersect with `playerIdsForNationalTeam(id)` when filter set.
2. **Ambiguous surnames:** Recompute `buildAmbiguousLastNames` per NT pool (Martínez-heavy squads).
3. **Difficulty easy:** Can show NT + position; club optional for international mode.
4. **Hints:** Prefer durable NT facts (caps, role, famous tournament) — align with `ROSTER_FRESHNESS_PLAN.md` (no volatile club-only hints in international mode).
5. **Collections / daily:** `quizLaunch.nationalTeamId`, `quizLaunch.competitionId`.
6. **Compare:** Unchanged; optional filter “only players from NT X” on picker.

---

## 10. Image implications

- **Players:** Keep generated placeholders; no NT-specific photo pipeline required.
- **National teams:** No official crests; use flag-inspired `visualTheme` (abstract colors) same as club badges policy.
- **World Cup:** Tournament logo = licensed; use text title “World Cup 2026” only until cleared.

---

## 11. Duplicate-name implications

Existing risks (Inter Martínez, García at Barça/Real, Gomes/Bueno at Wolves) apply **within club squads**. International adds:

| Pattern | Example | Mitigation |
|---------|---------|------------|
| Same surname, same NT | Two “Silva” on Brazil | Full-name quiz matching; block ambiguous last names in NT pool. |
| Same player, club vs NT quiz | Same `id` | Good — single record prevents split-brain. |
| Similar display names | “João Pedro” ×2 | `displayName` disambiguation in overlay; hint mentions club or position. |

Run `validate-app-ready-preview` style checks on **per–national-team** surname clusters before enabling NT quiz.

---

## 12. Recommended rollout order

Aligned with `PROJECT_BRIEF.md` pre-Firebase gates:

| Phase | Deliverable | App code? | Data? |
|-------|-------------|-----------|-------|
| **0** | Raw inspection + preview audit (§0, §0b) | No | Preview only |
| **0b** | `national-teams-preview.json` + audit | No | Preview only |
| **1** | `nationalTeams.json` + `confederations.json` (metadata only) | Helpers only | Yes (entities) |
| **2** | `nationalMemberships` for major NTs (top 32 + key nations) | Helpers + validation | Yes |
| **3** | Normalize `players.nationality` / `nationalTeam` via aliases + primary membership | Merge script | Yes |
| **4** | Hub `/national-teams` + pages `/national-team/:teamId` (wave 1 five) | Yes (targeted) | Yes |
| **5** | Search: `national-team` type + aliases + profile country links | Yes | Yes |
| **5b** | Browse + quiz filters: `nationalTeam`, `nationality` | Yes (later) | Yes |
| **6** | Search type `national-team` | Yes | Yes |
| **7** | `competitions` + World Cup squad + mode (see [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md)) | Yes | Yes |
| **8** | Collections + daily featuring NT/WC | Yes | Yes |
| **9** | Firebase (only after brief gates + above) | Later | — |

**Prerequisite done:** MLS + Brasileirão club merge (brief #2–3) is live — **2,331** club players, **348** quiz-eligible. NT work is additive only.

**Preview scripts (staging only):** `npm run build:national-teams-preview` → `generated-data/national-teams-preview.json` (+ `public/dev-data/` copy); `npm run validate:national-teams-preview`; `npm run report:national-teams-wave3` → `generated-data/national-teams-wave3-rollout-summary.json`. Club join registry = **`sampleData.js`** (2,331 players), not the thin app-ready preview export.

---

## 13. Wave 3 expansion (2026-05-26) — preview staging

**Scope:** 24 new `nationalTeamId`s (Nordic, Eastern Europe, British Isles, Africa, Asia, CONCACAF, CONMEBOL) on top of Wave 1 (5) + Wave 2 (20) = **49 nations in preview**.

**Config:** `scripts/lib/national-team-expansion-config.js` — TM codes, registry nationality labels, search alias hints.

**TM gaps (registry-only stubs):** `cameroon`, `cote-divoire` — no row in `national_teams.json.gz`; memberships can still backfill from `players.nationality` / `nationalTeam` when labels match.

### Preview build results (2026-05-26)

| Metric | Value |
|--------|------:|
| Nations in preview | 49 |
| TM `playerLinks` (join to existing `playerId`) | 287 |
| Unmatched TM squad rows (`previewOnly`) | 528 |
| Inspection | **PASSED** (`entityDataClean` for 47 TM-backed entities) |
| Wave 3 safe to promote (gates: ≥8 linked, ≥3 quiz-ready, no dup surname, TM entity) | **8** |

**Wave 3 — recommended next live promotions (preview gates only; not yet in app):**

1. `norway` — 23 linked, 4 quiz-ready  
2. `ghana` — 28 linked, 4 quiz-ready  
3. `algeria` — 14 linked, 4 quiz-ready (high unmatched TM rows — monitor)  
4. `poland` — 18 linked, 3 quiz-ready  
5. `austria` — 21 linked, 3 quiz-ready  
6. `ukraine` — 11 linked, 3 quiz-ready  
7. `scotland` — 11 linked, 3 quiz-ready  
8. `paraguay` — 17 linked, 3 quiz-ready  

**Wave 3 — stay preview-only (quiz or link gate failed):** `sweden`, `czechia`, `republic-of-ireland`, `cameroon`, `cote-divoire`, `wales`, `egypt`, `tunisia`, `canada`, `australia`, `iran`, `saudi-arabia`, `qatar`, `costa-rica`, `ecuador`, `peru`.

**Search aliases added (app):** USA/USMNT, Mexico/El Tri, Netherlands/Holland, Czechia/Czech Republic, Ivory Coast/Côte d'Ivoire — see `src/utils/searchAliases.js` + config `searchAliases` on entities when promoted.

**Do not:** bulk-promote all 49 nations; import unmatched TM rows into `sampleData.js`; enable World Cup mode UI.

---

## 14. Related docs

- `PROJECT_BRIEF.md` — product scope and pre-Firebase gates
- [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) — World Cup Mode (2026 cycle) full plan
- [WORLD_CUP_ROADMAP.md](./WORLD_CUP_ROADMAP.md) — short WC roadmap index
- `generated-data/schemas/national-team-schema-notes.md` — field-level schema
- `DATA_MERGE_PLAN.md` — `nationality` / `nationalTeam` merge policy
- `PLAYER_IMAGE_POLICY.md` — no unlicensed crests/photos
- `ROSTER_FRESHNESS_PLAN.md` — durable quiz hints
- `DATA_IMPORT_NOTES.md` — TM table inventory and P1 curated CSV gap
- `PHASE4_MLS_BRAZIL_PLAN.md` — club expansion completed before NT gate
