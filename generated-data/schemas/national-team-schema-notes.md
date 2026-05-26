# National team schema notes (planning)

> **Status:** Draft architecture only. Not consumed by the app or merge scripts yet.  
> **Scope:** Men’s international football only (aligned with `PROJECT_BRIEF.md`).

## Design principle

**One player, many affiliations.** A person appears exactly once in `players[]`. Club context stays on the player row (`teamId`, `leagueId`). International context is modeled with separate entities and join records — never a second player row for the same human.

---

## Entity overview

```
confederations[]     (optional grouping: UEFA, CONMEBOL, …)
nationalTeams[]      (men’s senior NT identity: Brazil, England, …)
nationalMemberships[] (playerId ↔ nationalTeamId + metadata)
competitions[]       (optional: world-cup-2026, copa-america-2024, …)
competitionSquads[]  (optional: competitionId + playerId + shirtNumber, …)

players[]            (unchanged single registry)
teams[]              (clubs — unchanged)
leagues[]            (club competitions — unchanged)
```

---

## `nationalTeams` (proposed)

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `id` | string | yes | Stable slug: `brazil`, `england`, `usa` (not FIFA code alone; code as alias) |
| `name` | string | yes | Display: `Brazil`, `England` |
| `country` | string | yes | Sovereign state label for browse (may match `name`) |
| `confederationId` | string | yes | `uefa`, `conmebol`, `concacaf`, `afc`, `caf`, `ofc` |
| `fifaCode` | string | no | `BRA`, `ENG` — search alias only |
| `nicknames` | string[] | no | e.g. `Seleção`, `Three Lions` |
| `crestPolicy` | enum | yes | `text-only` until licensed assets |
| `fanGuide` | string | no | Editorial learning copy |
| `historySummary` | string | no | Editorial |
| `rivalIds` | string[] | no | Other `nationalTeamId` (Argentina–Brazil, etc.) |
| `meta` | object | no | `dataAsOf`, source notes |

**Not** a `leagueId`. National teams do not live inside `leagues[]` to avoid polluting club league browse.

---

## `confederations` (proposed)

| Field | Type | Required |
|-------|------|----------|
| `id` | string | yes |
| `name` | string | yes |
| `region` | string | yes |
| `memberNationalTeamIds` | string[] | no (can derive from NT rows) |

Used for browse grouping and World Cup qualifying context — not for quiz pools directly unless filtered.

---

## `nationalMemberships` (proposed join)

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `playerId` | string | yes | FK → `players.id` |
| `nationalTeamId` | string | yes | FK → `nationalTeams.id` |
| `role` | enum | yes | `senior`, `youth` (MVP: senior only) |
| `status` | enum | yes | `active`, `historical`, `legend` |
| `caps` | number | no | If known; editorial verified |
| `isPrimary` | boolean | no | One primary NT per player for quiz default |
| `competitionIds` | string[] | no | e.g. tagged for `world-cup-2026` squad |
| `shirtNumber` | number | no | Tournament-specific; prefer on `competitionSquads` |

**Uniqueness:** `(playerId, nationalTeamId, role)` unique.

**Squad listing:** National team page queries `nationalMemberships` where `nationalTeamId = X` and `status = active`, then hydrates `players[]`.

---

## `players` (existing — additive fields only)

Keep current club fields. Clarify semantics:

| Field | Semantics (target) |
|-------|-------------------|
| `nationality` | Citizenship / passport footballing identity (may be dual; one primary string) |
| `nationalTeam` | **Primary men’s senior NT** the learner should associate in quiz (display string or derived from `nationalMemberships.isPrimary`) |
| `teamId` | Current **club** only |
| `leagueId` | Current **club league** only |

Do **not** add `nationalTeamId` on the player row as a second FK unless needed for performance; prefer join table + cached `nationalTeam` string for UI/quiz hints. Optional future: `primaryNationalTeamId` for indexed filters.

---

## `competitions` + `competitionSquads` (World Cup layer)

| `competitions` | Purpose |
|----------------|---------|
| `id` | `world-cup-2026` |
| `name` | `FIFA World Cup 2026` |
| `type` | `world-cup` |
| `hostCountries` | string[] |
| `nationalTeamIds` | qualified teams |

| `competitionSquads` | Purpose |
|---------------------|---------|
| `competitionId` | FK |
| `playerId` | FK |
| `nationalTeamId` | FK (redundant guard) |
| `shirtNumber`, `position`, `status` | tournament row |

World Cup quiz pool = players in `competitionSquads` for that competition ∩ `isQuizEligiblePlayer`.

### `competitionGroups` (World Cup 2026 — 12 × 4)

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | `world-cup-2026-group-a` |
| `competitionId` | string | FK → `world-cup-2026` |
| `label` | string | `Group A` |
| `nationalTeamIds` | string[] | Four qualified nations |
| `summary` | string | Group-stage learning guide (editorial) |
| `quizLaunch` | object | `{ competitionId, groupId }` for UI |

Group quiz pool = union of squad-eligible players for nations in the group (or membership-filtered fallback). See [WORLD_CUP_MODE_PLAN.md](../../../WORLD_CUP_MODE_PLAN.md).

### Tournament history (on `competitions` or sibling rows)

- `editionYear`, `winnerNationalTeamId`, `runnerUpNationalTeamId`, `memorablePlayerIds[]`, `historySummary` — editorial archive for past editions; 2026 row is active.

---

## Collections extension (future)

```json
{ "type": "national-team", "id": "brazil" }
{ "type": "competition", "id": "world-cup-2026" }
```

`resolveCollectionItem` gains branches; club `teams[]` unchanged.

---

## Merge / import rules

1. TM `citizenship` (scraper) / curated `country_of_citizenship` → `players.nationality` (with `country-aliases.json`).
2. TM `national_team` object (`country`, `href`) — **sparse**; use as hint for `nationalTeamId`, not sole source.
3. TM `international_caps` / `international_goals` on player scrape → optional `nationalMemberships.caps` / `goals` after editorial verify.
4. TM `national_teams.json.gz` → `nationalTeams[]` (`code` → `id`, `confederation`, `fifa_ranking`).
5. TM rows with `parent.type === "national_team"` → **membership matching only**; never new `players[]` rows.
6. Editorial overlay may set `nationalTeam` string and/or create `nationalMemberships` row.
7. Cap/squad for WC: manual or licensed source in `competitionSquads`, not TM roster alone.

**Raw paths (2025 scraper):** `data/raw/transfermarkt-scraper/2025/national_teams.json.gz`, `players.json.gz`, `appearances.json.gz`. Curated `national_teams.csv` when zip is pulled.

---

## Index helpers (future code, not built yet)

- `getNationalTeamById(id)`
- `getPlayersForNationalTeam(nationalTeamId, { status: 'active' })`
- `getQuizEligiblePlayersForNationalTeam(nationalTeamId)`
- `getPlayersByNationality(countryString)` — filter on `nationality` / normalized alias
- Club filters unchanged: `teamId`, `leagueId`
