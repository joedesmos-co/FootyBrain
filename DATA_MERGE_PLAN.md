# FootyBrain — Data Merge Plan

Staging and editorial overlay strategy for turning Transfermarkt preview data into app-ready players.

Aligns with [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) and [DATA_IMPORT_NOTES.md](./DATA_IMPORT_NOTES.md).  
**Documentation only** — no app code, no `sampleData.js` edits, no React import, no APIs/Firebase.

---

## Why raw preview data must not replace `sampleData.js`

`generated-data/footybrain-preview-data.json` is a **machine extract** for inspection. It is not a drop-in replacement for the handcrafted app database.

| Gap | Preview reality | App need |
|-----|-----------------|----------|
| **Identity** | TM numeric `sourceId` only | Stable slugs (`haaland`, `salah`) for routes `/player/:playerId` |
| **Names** | TM `full_name` (bilingual, legal, 79 non-Latin variants) | Short, quiz-safe display names |
| **Positions** | `Attack - Right Winger`, etc. | FootyBrain labels (`Striker`, `Attacking Midfielder`, …) |
| **National team** | `nationalTeam` null on 176/206 rows | Quiz + profile need a consistent country answer |
| **Pedagogy** | No `quickFact`, `quizHints`, `playingStyle` | Beginner learning is editorial, not scraped |
| **Ratings** | No FootyBrain fields | `importanceScore` is app-owned — never TM market value |
| **Scope** | 206 senior-squad rows | MVP is 36 curated “key” players |
| **Quiz design** | Duplicate surnames per club, youth prospects | Curated pools and hint difficulty |

Replacing `sampleData.js` in one step would break URLs, quiz fairness, tone, and PROJECT_BRIEF rules (no EA FC ratings, no TM photos). The merge path is **build-time composition**: factual core + human overlay + validation → reviewed output.

---

## Source-of-truth strategy

Use **separate layers** with one write path into the app bundle.

```
┌─────────────────────────────────────────────────────────────────┐
│  L0  Raw (gitignored)                                           │
│      raw-data/transfermarkt-datasets/…                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ npm run build:data-preview
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  L1  Staging preview (generated, inspect only)                  │
│      generated-data/footybrain-preview-data.json                │
└────────────────────────────┬────────────────────────────────────┘
                             │ npm run build:merge-core (future)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  L2  Normalized factual core (generated)                        │
│      generated-data/footybrain-core.json                        │
│      + generated-data/import-maps.json                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ merge with
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  L3  Editorial overlay (human-maintained)                       │
│      editorial-overlays/players/*.json                          │
│      editorial-overlays/teams/*.json (optional later)           │
└────────────────────────────┬────────────────────────────────────┘
                             │ npm run build:sample-data (future)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  L4  App bundle (reviewed, committed when ready)                │
│      src/data/sampleData.js  OR  src/data/sampleData.generated.js│
└─────────────────────────────────────────────────────────────────┘
```

**Canonical rules:**

| Concern | Source of truth |
|---------|-----------------|
| Player exists on a club roster (TM snapshot) | L1 preview → L2 core |
| TM `sourceId`, DOB, citizenship, TM position string | L2 core (immutable per import run) |
| FootyBrain `id` slug | `import-maps.json` + slug policy (stable across refreshes) |
| Display `name`, normalized `position`, `age` | L2 transforms (rules below) |
| `quickFact`, `quizHints`, `playingStyle`, `careerHistory`, fan copy | L3 editorial overlay |
| `importanceScore` / FootyBrain Rating | L3 only (or derived rules documented in overlay meta) |
| Leagues / teams structure & fan guides | Existing `sampleData.js` until team overlay exists |
| “As of” roster date | L2 `meta.importedAt` + TM season folder |

TM data is **refreshed**; editorial is **versioned**. Never edit TM facts inside overlay files—only map and annotate.

---

## Generated factual fields vs app-owned editorial fields

### From Transfermarkt (L1 → L2, safe after transforms)

| Preview / TM field | App field (after merge) | Notes |
|--------------------|-------------------------|--------|
| `sourceId` | *(internal)* `tmPlayerId` in import map | Not exposed in UI |
| `dateOfBirth` | `age` | Compute at build; store `meta.dataAsOf` |
| `nationality` | `nationality` | Primary citizenship string |
| `nationality` (derived) | `nationalTeam` | See [Missing nationalTeam](#handling-missing-nationalteam) |
| TM `position` | `position` | After normalizer |
| `footybrainTeamId` | `teamId` | Already aligned |
| `footybrainLeagueId` | `leagueId` | Already aligned |
| — | `imageUrl` | Always `null` (brief: no photos yet) |

**Strip before app bundle:** `sourcePlayerHref`, `sourceClubCode`, `dateOfBirthRaw`, `currentClub` (legal TM name), `firstName`/`lastName` (unless kept for build debug in non-published artifact).

### App-owned editorial (L3 overlay only)

| Field | Owner | Required for MVP 36? |
|-------|--------|----------------------|
| `id` | Import map + slug policy | Yes |
| `name` | Transform unless overlay overrides | Yes |
| `quickFact` | Human | Yes |
| `quizHints` | Human (3 hints typical) | Yes |
| `playingStyle` | Human | Yes |
| `careerHistory[]` | Human or future TM `transfers.csv` build | Yes (MVP uses hand text) |
| `importanceScore` | Human / editorial rules | Yes |
| `visualTheme` | App generator in `sampleData.js` | Can stay code-side |

**Never import from TM:** `image_url`, `market_value_in_eur`, `player_valuations`, TM prose, headshots, or market value as `importanceScore`.

---

## Recommended player slug strategy

**Goals:** stable routes, readable URLs, unique per player, stable across TM refreshes.

### Tier A — MVP 36 (preserve existing slugs)

- Keep current ids: `haaland`, `salah`, `van-dijk`, etc.
- `import-maps.json` entry per player: `{ "footybrainId": "haaland", "tmSourceId": "418560", "status": "mvp" }`.
- On TM refresh, update factual fields only; **do not rename** slugs.

### Tier B — New players from TM (extended mode)

Default slug algorithm (build script):

1. If overlay specifies `id`, use it.
2. Else: `slugify(lastName)` lowercased, ASCII, hyphens.
3. On collision within global player set: append `-{firstInitial}` or `-{tmSourceId}` (prefer initial for readability).
4. Mononyms (Pedri, Rodri): use established mononym slug (`pedri`, `rodri`) via overlay or `slugify(name)` with manual map entry.

**Reserved:** no slug changes after publish without redirect map (future). Document breaking changes in merge changelog.

### Tier C — Internal-only

- `tm-{sourceId}` acceptable as temporary slug during staging; promote to Tier B before quiz inclusion.

---

## Display name cleanup rules

Apply at L2 build; overlay may override with `"displayName"` in editorial file.

1. **Primary:** `trim(firstName) + " " + trim(lastName)` when both non-empty.
2. **Comma rule:** If `name` contains `,`, use only the segment **before** the first comma (Latin legal name).
3. **Mononym:** If `firstName` empty, use overlay `displayName` or well-known mononym table (`Pedri`, `Rodri`, `Gavi`, `Alisson Becker` not `Alisson` alone if app standard is full name).
4. **Diacritics:** Keep UTF-8 (Guéhi, Müller) — do not strip for display; optional `searchName` ASCII fold for search index later.
5. **Never ship** raw TM `name` when it contains Arabic/Cyrillic duplicate or middle names users do not expect in quizzes.
6. **Validation:** `name` length ≤ 40 chars; no leading/trailing punctuation; reject empty.

Examples (from preview audit):

| TM `name` | Build output |
|-----------|--------------|
| `Mohamed Salah Hamed Ghaly, محمد صلاح` | `Mohamed Salah` (overlay may shorten to `Mohamed Salah` matching current app) |
| `Abdukodir Khikmatovich Khusanov, …` | `Abdukodir Khusanov` |
| `Alisson` (empty firstName) | `Alisson Becker` via overlay or mononym table |

---

## Handling missing nationalTeam

Preview: **176/206** have `nationalTeam: null` but `nationality` populated.

**Policy:**

1. **Default:** `nationalTeam = nationality` for app output (quiz “national team” = citizenship country name learners recognize).
2. **Normalize country strings:** Map TM quirks (`Korea, South` → `South Korea`) in a small `generated-data/country-aliases.json`.
3. **When TM `nationalTeam` is set** and differs from citizenship (rare): prefer TM only if it is a proper football nation name; else citizenship.
4. **Dual citizenship:** Use primary `nationality` only unless overlay sets `nationalTeam` explicitly.
5. **Overlay override:** `editorial-overlays/players/{id}.json` may set `nationalTeam` for pedagogy (e.g. Brazil-born player representing Spain — only when editorially verified).

Do not block merge on null `nationalTeam` in preview; block on null `nationality`.

---

## Handling duplicate surnames in quizzes

Preview found duplicate **last names within the same club** (e.g. two García at Barcelona, two Martínez at Inter).

**Build-time flags** (in core or overlay meta):

```json
{
  "quizPool": "mvp",
  "lastNameCollision": true,
  "lastNameGroup": "garcia"
}
```

**Runtime policy (when expanded mode ships):**

| Mode | Behavior |
|------|----------|
| **MVP / daily / default quiz** | Only players with `quizPool: "mvp"` and `lastNameCollision: false` |
| **Team quiz** | If pool has surname collision, medium/hard questions must use full name or hint disambiguation |
| **Browse** | Show full name always |

**Overlay mitigation:** For colliding players, add a disambiguating `quizHints[0]` (“Young goalkeeper at Barça, not the defender García”) or set `quizEligible: false` until hints exist.

---

## Handling young / reserve players

TM senior squad pages include teenagers without explicit youth labels in preview.

**Filters (L2, configurable per stage):**

| Stage | Rule |
|-------|------|
| MVP 36 | Manual list only — ignore automatic inclusion |
| 8-club expanded | `age >= 20` OR `overlay.includeDespiteAge: true` OR in `mvp-roster.json` allowlist |
| Full league | Stricter: `age >= 21` + optional minutes data later from `appearances.csv` |

**Flags on core record:**

- `rosterTier`: `"senior"` | `"prospect"` | `"unknown"`
- `quizEligible`: boolean (default `false` for prospects)

Prospects may appear in **browse extended** mode but not in **daily challenge** until editorial overlay exists.

---

## Avoiding Transfermarkt photos and market values

| Risk | Prevention |
|------|------------|
| Player photos | `imageUrl: null` in all merged output; build fails if `image_url` key present |
| Market value as rating | `importanceScore` only from overlay; validator rejects `market_value*` keys |
| Hotlinked assets | No `sourcePlayerHref` in bundle; no TM CDN URLs in CSS/HTML |
| Valuations CSV | Never read in merge script for MVP; optional separate analytics pipeline |

**CI / build checks (future):**

- JSON schema forbids `image_url`, `market_value`, `marketValue`.
- `importanceScore` range 1–99 only when `editorialSource: "footybrain"`.

---

## Proposed folder structure

```
FootyBrain/
├── generated-data/                    # Build outputs (preview + core + maps)
│   ├── footybrain-preview-data.json   # L1 — exists today (inspect only)
│   ├── footybrain-core.json           # L2 — normalized factual players (future)
│   ├── import-maps.json               # tmSourceId ↔ footybrainId (future)
│   ├── country-aliases.json           # nationality string normalizer (future)
│   └── merge-report.json              # validation warnings per run (future)
│
├── editorial-overlays/                # Human-owned, committed
│   ├── README.md                      # how to edit overlays
│   ├── players/
│   │   ├── haaland.json
│   │   ├── salah.json
│   │   └── …                          # one file per footybrainId (36 first)
│   ├── teams/                         # optional phase 2
│   │   └── arsenal.json
│   └── meta/
│       ├── mvp-player-ids.json        # canonical list of 36 ids
│       └── quiz-pool-rules.json       # surname, age, pool flags
│
├── scripts/
│   ├── build-footybrain-preview-data.js   # exists
│   ├── build-footybrain-core.js             # future: preview → core
│   ├── merge-sample-data.js                 # future: core + overlay → sampleData
│   └── validate-merge.js                    # future: schema + policy checks
│
├── src/data/
│   └── sampleData.js                  # unchanged until staged PR
│
├── DATA_IMPORT_NOTES.md
└── DATA_MERGE_PLAN.md                 # this file
```

**Git policy suggestion:** commit `editorial-overlays/`; keep `generated-data/` gitignored except optional checked-in `merge-report.json` samples.

---

## Staged merge plan

### Stage 1 — Preview only *(current)*

**Actions:**

- Run `npm run build:data-preview`.
- Audit via [DATA_IMPORT_NOTES.md § Preview Data Audit](./DATA_IMPORT_NOTES.md#preview-data-audit).
- No React import; no `sampleData.js` changes.

**Exit criteria:** 8/8 clubs, 4/4 leagues, validation report clean on referential integrity.

---

### Stage 2 — Editorial overlay for existing 36 players

**Actions:**

- Add `editorial-overlays/meta/mvp-player-ids.json` listing current 36 `id`s from `sampleData.js`.
- Split each player’s editorial fields into `editorial-overlays/players/{id}.json` (copy from current sample — **preserves tone**).
- Create `import-maps.json` mapping each `id` → TM `sourceId` (manual research / preview match).
- Future script `build-footybrain-core.js` produces core rows **only** for those 36.

**Exit criteria:** 36 map entries; overlay files validate; diff shows factual-only changes vs TM (age, team) without touching hints.

---

### Stage 3 — Generate app-ready data for 8 clubs

**Actions:**

- Implement `merge-sample-data.js`: join core + overlay → `generated-data/footybrain-merged.json` (or regenerate `sampleData.js` in a branch).
- Apply name, position, nationality rules; set `imageUrl: null`.
- **Default quiz pool:** still 36 only (`quizPool: "mvp"`).
- Optional: core rows for full 206 with `quizEligible: false` for browse prototype behind flag (app change later — not in this doc stage).

**Exit criteria:** Merged file passes validator; 36 players byte-compatible schema with current app; routes unchanged.

---

### Stage 4 — Test expanded database mode

**Actions:**

- App feature flag (future PR): `expandedRoster: true` loads extended player list.
- Browse/search includes ~206; quiz/daily still MVP 36.
- Test surname collisions, search by mononym, mobile card list length.
- Editorial backlog: top N prospects per club excluded from quiz.

**Exit criteria:** No quiz regression; performance OK; no TM assets in network tab.

---

### Stage 5 — Expand to all clubs in the 4 leagues

**Actions:**

- Widen preview builder filter from 8 clubs → all clubs in GB1, ES1, L1, IT1.
- Tier B slug generation for new players; editorial overlays sparse (facts-only defaults).
- Stronger age/filter rules; bundle size budget (target &lt; 500 KB gzip or split by league).
- Optional: `transfers.csv` for `careerHistory` generation with human review.

**Exit criteria:** Import pipeline repeatable; league coverage documented; legal/attribution note in app About.

---

## Risks and rollback plan

| Risk | Likelihood | Mitigation | Rollback |
|------|------------|------------|----------|
| Wrong club match (name fuzzy) | Low after code-match fix | Code-first matching; `suspiciousMappings` in preview | Revert `import-maps.json`; rebuild preview |
| Stale TM roster | Medium | `meta.season`, `meta.importedAt` in output | Pin season folder; re-run preview |
| Slug collision / broken URLs | Medium | Global slug registry in merge report | Keep previous `import-maps.json`; never auto-rename MVP slugs |
| Quiz too hard (206 players) | High if unfiltered | `quizEligible` + MVP pool | Flip flag to MVP-only data file |
| Surname false positives in quiz | Medium | Collision flags + full-name mode | Exclude colliding ids from `quizPool` |
| Market value / image leak | Low | Build validator | Fail CI; delete bad artifact |
| Editorial regression | Medium | One JSON per player; PR review | Overlays are source of truth — revert overlay commit |
| Bundle bloat | High at Stage 5 | League-split JSON, lazy load later | Ship MVP file only |

**Rollback procedure (any stage):**

1. App continues importing `src/data/sampleData.js` (unchanged in git on `main`).
2. Delete or ignore bad `generated-data/*` artifacts.
3. Restore `editorial-overlays/` from last good commit.
4. Re-run `npm run build:data-preview` only if TM mapping logic changed.

**No rollback needed for:** preview JSON existing in isolation — it is not wired to Vite.

---

## Related commands (today vs future)

| Script | Status |
|--------|--------|
| `npm run build:data-preview` | **Exists** — L1 preview |
| `npm run build:core` | Planned — L2 normalization |
| `npm run build:merge` | Planned — L3 + L4 merge |
| `npm run validate:merge` | Planned — policy checks |

---

## Document maintenance

Update this file when:

- Stage 2+ scripts land in `scripts/`.
- Slug or quiz-pool policy changes.
- App adds `expandedRoster` or new data entry path.

Cross-reference: [DATA_IMPORT_NOTES.md](./DATA_IMPORT_NOTES.md) for raw-data layout, TM licensing, and preview audit metrics.
