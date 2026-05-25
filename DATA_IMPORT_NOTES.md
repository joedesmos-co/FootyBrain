# FootyBrain — Raw Data Import Notes

Audit date: 2026-05-24  
Scope: `raw-data/` only (no app import yet). Aligns with [PROJECT_BRIEF.md](./PROJECT_BRIEF.md).

---

## Prioritized issue list (audit findings)

### P1 — Blockers before any import pipeline

| # | Issue | Impact |
|---|--------|--------|
| 1 | **Transfermarkt curated CSVs are not present locally** | `data/raw/*.dvc` points to ~508 MB remote storage; `competitions.csv`, `players.csv`, etc. are described in `data/prep/dataset-metadata.json` but not on disk until `dvc pull` or [dataset zip](https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/transfermarkt-datasets.zip) download. |
| 2 | **Two sources use different ID and naming models** | Transfermarkt uses numeric `player_id` / `club_id` and names like `Manchester City`; football.json uses string team names like `Manchester City FC` with no player entities. Joining them requires a mapping layer. |
| 3 | **Transfermarkt `image_url` and market values** | Published `players.csv` includes `image_url` and `market_value_in_eur`. PROJECT_BRIEF forbids EA FC ratings and the app avoids logos/photos — do not surface TM market value as “FootyBrain Rating” or load TM headshots without a separate licensing decision. |

### P2 — Data quality / product fit

| # | Issue | Impact |
|---|--------|--------|
| 4 | **football.json has no player or squad data** | Match JSON only (`name`, `matches[]` with `team1`, `team2`, `score`, optional `date`/`round`). Cannot drive Browse, profiles, quiz hints, or career history. |
| 5 | **football.json team name variants** | e.g. `Liverpool FC` vs app `Liverpool`; legal suffixes differ by season/file. Normalization table required for fixtures-only features. |
| 6 | **Transfermarkt scope vs FootyBrain MVP** | TM covers 400+ clubs and 37k+ players; MVP targets 4 leagues / 8 teams / ~36 players. Import must filter (e.g. `GB1`, `ES1`, `DE1`, `IT1` competition codes) early. |
| 7 | **`data/competitions.json` is scraper NDJSON, not curated CSV** | Line-delimited JSON from acquisition pipeline — useful for metadata, not the same schema as `competitions.csv`. |

### P3 — Operational / legal

| # | Issue | Impact |
|---|--------|--------|
| 8 | **Transfermarkt scraping ToS** | Data is scraped from transfermarkt.co.uk. CC0 applies to the *dataset packaging* (see TM dataset LICENSE); FootyBrain should document attribution and avoid hotlinking TM assets in production. |
| 9 | **Repo size and git** | `raw-data/` is gitignored (correct). football.json clone is ~30 MB / 281 JSON files — keep out of git and out of the Vite bundle. |
| 10 | **Weekly refresh drift** | TM dataset updates weekly; football.json is regenerated from Football.TXT sources. Imported `sampleData` will go stale without a repeatable build script. |

### P4 — No action needed (verified OK)

- football.json and transfermarkt-datasets are separate clones under `raw-data/` (not broken partial copies).
- No duplicate `id` risk inside a single source (TM uses numeric IDs; football.json files are per league-season).
- football.json license: **CC0** (`football.json/LICENSE.md`).
- transfermarkt-datasets published data license: **CC0** (`transfermarkt-datasets/LICENSE`, `dataset-metadata.json`).

---

## Folder / file structure summary

```
raw-data/
├── football.json/                    # openfootball — league fixtures & results (JSON)
│   ├── README.md, LICENSE.md, package.json
│   ├── 2010-11/ … 2025-26/           # season folders (split-year naming)
│   │   ├── en.1.json                 # England tier 1 (Premier League)
│   │   ├── en.2.json, en.3.json, en.4.json
│   │   ├── es.1.json, es.2.json      # Spain
│   │   ├── de.1.json, de.2.json, de.3.json, de.cup.json
│   │   ├── it.1.json, it.2.json      # Italy
│   │   ├── fr.1.json, fr.2.json, …   # other countries / cups / UEFA
│   │   └── …
│   └── 2019/, 2020/, 2025/           # some calendar-year buckets (MLS, BR, etc.)
│
└── transfermarkt-datasets/           # dcaribou — ETL repo + DVC pointers (not full CSVs locally)
    ├── README.md, LICENSE, pyproject.toml
    ├── data/
    │   ├── README.md                   # explains dvc pull
    │   ├── competitions.json           # NDJSON scraper output (metadata)
    │   ├── countries.json
    │   ├── tournament_editions.json
    │   ├── prep/dataset-metadata.json  # Frictionless schema for published CSV tables
    │   └── raw/
    │       ├── transfermarkt-scraper.dvc # ~508 MB, 74 files (not pulled)
    │       └── transfermarkt-api.dvc
    ├── dbt/models/curated/*.sql        # SQL transforms → logical CSV tables
    ├── transfermarkt_datasets/assets/  # Python asset definitions (cur_*.py)
    ├── scripts/acquiring/              # scrapers
    └── streamlit/, infra/, tests/       # exploration & ops (not import input)
```

**Local footprint (this workspace):**

| Path | Approx. size | JSON/CSV files on disk |
|------|----------------|-------------------------|
| `raw-data/football.json/` | ~30 MB | **281** `.json` league/cup files |
| `raw-data/transfermarkt-datasets/` | ~6.5 MB | **Repo + metadata only**; curated `.csv` / `.csv.gz` **not** present without `dvc pull` |

---

## Important files

### football.json (fixtures & results)

| File pattern | Contains |
|--------------|----------|
| `{season}/en.1.json` | Premier League schedule/results for that season |
| `{season}/es.1.json` | La Liga (Primera División) |
| `{season}/de.1.json` | Bundesliga |
| `{season}/it.1.json` | Serie A |
| `{season}/uefa.cl.json` | UEFA Champions League (where present) |
| `README.md` | Generation from Football.TXT; CC0; API usage notes |

**Typical match object:** `team1`, `team2`, `score` (`ft` / `ht` arrays or legacy array), sometimes `date`, `round`.  
**No:** `player_id`, lineups, transfers, market value, national team.

**FootyBrain mapping (MVP leagues):**

| FootyBrain `leagueId` | football.json file (latest season folder) |
|------------------------|---------------------------------------------|
| `premier-league` | `2025-26/en.1.json` (or `2024-25/en.1.json`) |
| `la-liga` | `2025-26/es.1.json` |
| `bundesliga` | `2025-26/de.1.json` |
| `serie-a` | `2025-26/it.1.json` |

### transfermarkt-datasets (entities & history)

**Published tables** (documented in `data/prep/dataset-metadata.json`; files expected after pull/export):

| File | Use for FootyBrain |
|------|---------------------|
| `competitions.csv` | League/competition IDs, codes (`GB1`, `ES1`, `DE1`, `IT1`), country, type |
| `clubs.csv` | Club names, `domestic_competition_id`, stadium, squad size |
| `players.csv` | Names, DOB, position, `current_club_id`, citizenship, height — **core player roster** |
| `transfers.csv` | **Career / club history** (`from_club_*`, `to_club_*`, dates, fees) |
| `national_teams.csv` + `countries.csv` | National team labels and confederation |
| `player_valuations.csv` | Historical market value (**do not** map to FootyBrain Importance Score) |
| `appearances.csv`, `games.csv`, `game_events.csv`, `game_lineups.csv`, `club_games.csv` | Match-level analytics; optional later (heavy rows) |

**Auxiliary (present locally):**

| File | Contains |
|------|----------|
| `data/competitions.json` | NDJSON: competition names, types, Transfermarkt hrefs, aggregate market values |
| `data/countries.json` | Country reference from scraper |
| `data/tournament_editions.json` | Tournament edition metadata |

**Pipeline code (not consumed by React):** `dbt/models/curated/`, `transfermarkt_datasets/assets/cur_*.py`, `scripts/acquiring/*.py`.

---

## Recommended canonical source of truth

| Domain | Canonical source | Notes |
|--------|------------------|--------|
| **Players** (identity, position, age, nationality, current club) | `transfermarkt-datasets` → **`players.csv`** + **`clubs.csv`** | Filter by `current_club_domestic_competition_id` / club’s `domestic_competition_id` for MVP leagues. |
| **Clubs** | **`clubs.csv`** | Join on `club_id`; map to FootyBrain `teamId` slugs in import script. |
| **Leagues / competitions** | **`competitions.csv`** | Use `competition_code` / `competition_id`; align with FootyBrain `leagueId`. |
| **Transfers & career history** | **`transfers.csv`** | Aggregate by `player_id` into `{ club, years }` for profiles; verify ordering and season labels. |
| **National teams** | **`players.csv`** (`country_of_citizenship`) + **`national_teams.csv`** | Map citizenship → `nationalTeam` string for quiz; caps/goals if present in downloaded CSV build. |
| **Fixtures & results** (future) | **football.json** per season/league file | Supplement only; not for core learning DB today. |
| **FootyBrain Rating** | **App-owned** | Derive from appearances/goals or editorial rules — **never** copy `market_value_in_eur`. |
| **quickFact / quizHints / fanGuide** | **App-owned** (human or generated from facts) | Do not scrape TM prose; keep beginner-safe editorial layer per PROJECT_BRIEF. |

---

## Risks & limitations

1. **Incomplete local TM data** — Without `dvc pull`, imports cannot be tested against real CSV rows in this repo.
2. **Name normalization** — Club and player display names differ between TM, football.json, and current `sampleData.js` (`Alisson` vs `Alisson Becker`, `Liverpool` vs `Liverpool FC`).
3. **Slug stability** — FootyBrain uses string slugs (`manchester-city`); TM uses integers. Maintain `src/data/import/maps/*.json` (or similar) in a future import PR — not in React.
4. **Copyright / branding** — Avoid TM logos, player photos (`image_url`), and presenting market value as official “ratings.”
5. **Quiz & daily mode** — Depend on consistent `player.name`, unique last names in filtered pool, and `teamId`/`leagueId` integrity. Import must preserve or generate stable `id` slugs matching routes (`/player/:playerId`).
6. **Stale squads** — TM weekly refresh may disagree with football.json mid-season; show “as of import date” if needed later.
7. **Scope creep** — `appearances.csv` is ~1.8M rows; do not bundle raw CSV into the frontend.

---

## Next recommended import plan

1. **Acquire TM curated files** (one-time, outside React):
   - From repo root: `cd raw-data/transfermarkt-datasets && dvc pull`  
   - Or download `transfermarkt-datasets.zip` from the dataset README link and place CSVs where `dataset-metadata.json` expects them.
2. **Add a Node (or Python) build script** e.g. `scripts/build-sample-data.mjs`:
   - Input: filtered `players.csv`, `clubs.csv`, `competitions.csv`, `transfers.csv` for `GB1`, `ES1`, `DE1`, `IT1` and FootyBrain’s 8 clubs.
   - Output: `src/data/sampleData.generated.js` or overwrite `sampleData.js` after review.
   - Include `importMaps`: `tm_player_id` → `footybrain_id`, `tm_club_id` → `teamId`.
3. **Map core fields first** (schema unchanged):
   - `name`, `age` (from `date_of_birth`), `position`, `teamId`, `leagueId`, `nationality` / `nationalTeam`, `careerHistory[]` from transfers.
4. **Keep editorial fields manual** in a small overlay file (`playerEditorial.json`) for `quickFact`, `quizHints`, `playingStyle` until a safe generation pass exists.
5. **Optional phase 2** — football.json for a future “Results” or “Matchday” feature; normalize team names via map.
6. **Validate** — Script checks: unique ids, valid `teamId`/`leagueId`, roster ⊆ players, no TM `image_url` in output.
7. **Wire app** — Replace static import only after review; add `npm run build:data` script. Still no runtime fetch (per brief).

---

## Files that must NOT be loaded directly into React

Do **not** `import` or fetch these from the Vite app bundle:

| Do not load | Reason |
|-------------|--------|
| Entire `raw-data/` directory | Size, wrong runtime environment, gitignored |
| Any `*.csv` / `*.csv.gz` from Transfermarkt (~millions of rows) | Build-time only; blows bundle size |
| `raw-data/transfermarkt-datasets/data/raw/**` (DVC scraper dump) | Raw, huge, not curated |
| `football.json/**/**.json` match files | Large; wrong shape; team names inconsistent |
| `data/competitions.json` (NDJSON) | Scraper format, not app schema |
| `player_valuations.csv`, `appearances.csv`, `game_lineups.csv`, etc. | Analytics-scale; use aggregated features at build time if ever needed |
| `image_url` from TM | Licensing / brief: no photos yet |
| `market_value_in_eur` as UI rating | Not FootyBrain Rating; TM-specific |
| `dbt/`, `streamlit/`, `scripts/`, `poetry.lock`, `.dvc/` | Tooling, not app data |
| Transfermarkt / openfootball **git histories** under `raw-data/**/.git` | Irrelevant to runtime |

**Safe pattern:** Build step produces a **small** `sampleData.js` (or JSON under `public/` if explicitly sized for MVP) that the app already consumes.

---

## `.gitignore` check

Root `.gitignore` includes:

```
raw-data/
```

Confirmed — raw datasets are excluded from git. Document any import maps or generated output paths separately when added (`src/data/import/` can be committed; `raw-data/` should not).

---

## Quiz mode & daily challenge assumptions (for future import)

- **Daily** (`useDailyChallenge.js`): picks 5 random entries from `players` array; needs ≥5 players, stable `id`, `name` for `answersMatch()`.
- **Quiz easy**: shows club via `getTeamName(teamId)` — import must keep `teamId` aligned with `teams[].id`.
- **Quiz medium/hard**: uses `nationalTeam`, `position`, `quizHints` — TM gives position/citizenship; hints stay editorial.
- **Last-name matching**: avoid duplicate surnames in the same quiz pool per league/team filter.

Any import script should run these validations before writing `sampleData.js`.

---

## Preview Data Audit

Audit date: 2026-05-24  
Artifact: `generated-data/footybrain-preview-data.json` (built via `npm run build:data-preview`)  
Source: Transfermarkt scraper season **2025** — `players.json.gz`, `clubs.json.gz`, `data/competitions.json`  
Scope: 4 leagues (GB1, ES1, L1, IT1), 8 FootyBrain clubs, **206 players**  
Compared to current app: `sampleData.js` has **36** curated players (same 4 leagues / 8 teams).

### Summary verdict

| Question | Answer |
|----------|--------|
| **Safe to inspect / plan import?** | **Yes** — no `image_url`, no market values, stable TM `sourceId`s, 100% league/team consistency in file. |
| **Safe to load into React as-is?** | **No** — names, positions, ids, and editorial layer do not match app schema or quiz needs. |
| **Bundle size OK at this scale?** | **Yes** — ~125 KB JSON (~14 KB gzip) for 206 rows; scaling to full TM squads or all leagues would not be. |

### What looks good

- **Club matching:** 8/8 target clubs matched via TM `code` (high confidence); `suspiciousMappings` empty after Espanyol/Barcelona fix in build script.
- **Referential integrity:** 0 league mismatches, 0 `sourceClubCode` mismatches vs team table, 0 duplicate `sourceId`s, 0 duplicate display names within the same team.
- **Core field completeness:** 206/206 have `sourceId`, `name`, `position`, `dateOfBirth` (ISO), `nationality`, `footybrainTeamId`, `footybrainLeagueId`.
- **Squad counts align with TM metadata** (`squad_size` on each club row):

| Team | Players in preview | TM `squad_size` |
|------|-------------------:|----------------:|
| Real Madrid | 29 | 29 |
| Liverpool | 28 | 28 |
| Manchester City | 27 | 27 |
| Arsenal | 25 | 25 |
| Barcelona | 25 | 25 |
| Bayern Munich | 25 | 25 |
| Inter Milan | 24 | 24 |
| AC Milan | 23 | 23 |

- **Position coverage (TM taxonomy):** Defender 72, Midfield 63, Attack 45, Goalkeeper 26 — all rows use `"{role} - {detail}"` except goalkeepers (plain `Goalkeeper`).
- **Ages (from DOB, audit “as of” 2026-05-24):** range 16–40; no impossible ages; youngest listed: Liverpool’s Rio Ngumoha (18).
- **Youth/reserve labels:** No rows with explicit U21/U19/reserve/loan markers in `position` or `currentClub` (TM still lists some teenagers on the senior squad page — see P2).
- **Encoding:** No mojibake or replacement-character issues detected; **79** names include non-Latin scripts (expected for TM `full_name`).

### Prioritized issues

#### P1 — Blockers before any in-app merge

| # | Issue | Evidence | Impact |
|---|--------|----------|--------|
| 1 | **No FootyBrain player slugs** | Preview uses TM `sourceId` only; app routes use `id` like `haaland`, `salah`. | Cannot swap `sampleData.js` without an `importMaps` layer and stable slug rules. |
| 2 | **Display names not quiz-ready** | 4 names are bilingual comma-separated (`Salah, محمد صلاح`); 79 use non-Latin `name` while `firstName`/`lastName` are Latin; 13 rows have empty `firstName` (mononyms: Pedri, Rodri, Alisson, etc.). | Browse/search/quiz would show wrong or inconsistent strings; daily `answersMatch()` assumes clean names. |
| 3 | **`nationalTeam` mostly empty** | Only **30 / 206** populated; **176** are `null` despite `nationality` being present. | Quiz medium/hard and “national team” UI cannot rely on this field from scraper raw. |
| 4 | **Editorial fields absent** | No `quickFact`, `quizHints`, `playingStyle`, `importanceScore`, `careerHistory`, FootyBrain Rating. | Required by PROJECT_BRIEF; must stay app-owned or in a separate overlay file. |

#### P2 — Data quality / product fit

| # | Issue | Evidence | Impact |
|---|--------|----------|--------|
| 5 | **Full senior squads vs curated MVP** | 206 players vs 36 handcrafted “key” players (~5.7×). | Expanding browse/quiz to full squads changes product scope; need an explicit filter (importance, minutes, or manual pick list). |
| 6 | **Duplicate surnames within a team** | 3 teams: Barcelona & Real Madrid (`García` ×2 each), Inter (`Martínez` ×2). | Last-name quiz matching (`answersMatch`) can accept the wrong player in the same club. |
| 7 | **TM position strings ≠ app positions** | e.g. `Attack - Right Winger`, `Defender - Centre-Back` vs app `Striker`, `Centre-Back`, `Midfielder`. | Needs a build-time normalizer to FootyBrain categories for quiz “position” questions. |
| 8 | **Young prospects on senior squad pages** | e.g. Liverpool: Ngumoha (18), Nyoni (19), Leoni (20) — valid TM listing, not labeled youth in export. | Fine for a database; noisy for beginner quiz unless filtered. |
| 9 | **Long legal `currentClub` names** | e.g. `Football Club Internazionale Milano S.p.A.` | OK as source metadata; map to short `teams[].name` in app. |
| 10 | **Snapshot staleness** | Season folder `2025`; weekly TM drift. | Rosters can disagree with real-world transfers; show “as of import date” if surfaced later. |

#### P3 — Nice-to-have cleanup

| # | Issue | Notes |
|---|--------|--------|
| 11 | **`dateOfBirthRaw` redundant** | All 206 use `dd/mm/yyyy`; app should consume ISO `dateOfBirth` only in output. |
| 12 | **`sourcePlayerHref` / `sourceClubCode`** | Useful for build/debug; strip from frontend bundle. |
| 13 | **`generated-data/` not gitignored** | Small today; add to `.gitignore` if previews stay local-only. |
| 14 | **Dual citizenship** | 1 row uses `Korea, South` string — fine; no multi-country list parsing yet. |

#### P4 — Verified OK (no action)

- No duplicate players per team by `name` or `sourceId`.
- No cross-team name collisions in this extract.
- No odd `currentClub` vs matched team (token check passed for all 8 clubs).
- No TM `image_url` or market value fields in export.
- File size appropriate for inspection and for a **filtered** future bundle.

### Fields: safe vs excluded

| Safe at build time (map → app) | Use with transform | Keep excluded from React |
|-------------------------------|--------------------|---------------------------|
| `sourceId` → internal `tmPlayerId` in import map | `firstName` + `lastName` → display `name` | `sourcePlayerHref` |
| `dateOfBirth` → `age` | `position` → FootyBrain category | `dateOfBirthRaw` |
| `nationality` → `nationality` / `nationalTeam` (prefer citizenship over sparse `nationalTeam`) | `footybrainTeamId`, `footybrainLeagueId` | `sourceClubCode` |
| `footybrainTeamId`, `footybrainLeagueId` | `currentClub` → verify then drop for UI | TM `image_url` (not in preview) |
| Team/league metadata from `teams[]` / `leagues[]` | | `market_value` / valuations |
| | | `quickFact`, `quizHints`, `fanGuide`, `importanceScore` (editorial overlay) |

### Recommended cleanup steps (build script, not React)

1. **Display name policy:** Prefer `firstName` + `lastName`; if missing, derive from `name` before first comma; strip script suffix after comma; never ship raw TM `full_name` to UI.
2. **Position normalizer:** Map TM sub-positions to app buckets (`Goalkeeper`, `Defender`, `Midfielder`, `Striker` / existing labels).
3. **National team:** Derive quiz national answer from `nationality` (and optional `national_teams.csv` later), not scraper `national_team` object alone.
4. **Roster filter:** Default merge = **existing 36 slugs** updated from TM + optional “extended squad” flag; do not dump all 206 into quiz pool without review.
5. **Quiz pool rules:** Flag or exclude duplicate surnames per `teamId`; cap U21 unless explicitly included.
6. **Validation gate:** Fail build on duplicate `sourceId`, orphan `footybrainTeamId`, missing DOB/position/nationality, or club/league mismatch.
7. **Re-run preview** after TM refresh: `npm run build:data-preview` → re-audit counts.

### Should this data be used in-app yet?

**No.** Keep `generated-data/footybrain-preview-data.json` as a **staging artifact** only.

Reasons:

- App still depends on handcrafted `sampleData.js` for pedagogy, quiz hints, and stable slugs.
- Full squads overwhelm MVP quiz/daily design (206 vs 36).
- Name and position shapes need normalization and editorial overlay before user-facing use.

**Yes** for: diffing TM rosters vs current sample, planning `importMaps`, and sizing a future build pipeline.

### Safe merge strategy (later)

Use a **three-layer** pipeline; do not import the preview JSON directly in Vite.

```
TM preview / CSV  →  importMaps + transforms  →  core.generated.json
                                              ↘
                        playerEditorial.json  →  merge  →  sampleData.js (reviewed)
```

1. **Layer A — TM core (machine):** `sourceId`, DOB→age, normalized position, `teamId`, `leagueId`, citizenship, optional short club label. Output e.g. `src/data/import/core.generated.json` (gitignored or committed after review).
2. **Layer B — Maps (stable):** `tmPlayerId` ↔ `footybrainPlayerId`, `tmClubCode` ↔ `teamId`; preserve existing slugs for the 36 MVP players where possible.
3. **Layer C — Editorial (human):** `quickFact`, `quizHints`, `playingStyle`, `importanceScore`, `careerHistory[]`, fan/team copy — unchanged ownership per PROJECT_BRIEF.
4. **Merge modes:**
   - **Conservative (recommended first):** Update only mapped MVP players from TM; leave teams/leagues editorial blocks as-is.
   - **Extended browse:** Add more players with generated slugs (`tm-{sourceId}`) but **exclude** from quiz/daily until editorial + surname checks pass.
5. **Wire app last:** Single reviewed PR switching `sampleData.js` (or generated import consumed at build time); still no runtime API/Firebase.

### Bundle size note

| Dataset | JSON | Gzip (approx.) |
|---------|-----:|-------------:|
| Current preview (206 players) | 125 KB | 14 KB |
| Hypothetical 8 clubs × ~25 (full squads) | ~125 KB | ~14 KB |
| All TM players in 4 leagues (tens of thousands) | **Do not bundle** | Build-time filter only |

Even 206 rows is technically bundle-safe; the real limit is **product scope and editorial cost**, not bytes.
