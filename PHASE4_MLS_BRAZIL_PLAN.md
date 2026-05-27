# Phase 4 import plan — MLS + Brasileirão (Série A)

> **MLS + Brasileirão live** in `sampleData.js` (2026-05-25). Browse-only generated squads; MLS has 20 quiz-approved players.  
> Run: `npm run build:phase4-preview` · `npm run validate:phase4-preview`  
> Aligns with [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) pre-Firebase gates **#2 (MLS)** and **#3 (Brasileirão)**.  
> Product context: [MLS_BRASILEIRAO_EXPANSION_PLAN.md](./MLS_BRASILEIRAO_EXPANSION_PLAN.md). Pipeline baseline: European phases 1–3 + [DATA_MERGE_PLAN.md](./DATA_MERGE_PLAN.md).

### Audit verdict (2026-05-25 — staged preview, not live)

| Decision | Recommendation |
|----------|----------------|
| **Import order** | **MLS first**, then Brasileirão in a second merge tranche (brief gate #2 before #3; lower surname-collision risk; faster English editorial). |
| **Target browse cap** | Keep **`maxPerClub: 22`**. Raise **`playersMax`** to **~1,900** for MLS-only merge (1,231 existing + ~660 MLS); **~2,100** when both leagues land (~1,100 Phase 4 curated rows). |
| **Editorial P0** | MLS: Inter Miami, LAFC, LA Galaxy, Seattle Sounders. BRA: Flamengo, Palmeiras, Corinthians, São Paulo. |
| **Search aliases** | Add before or with first live merge: Inter Miami, LAFC, LA Galaxy, Corinthians, Flamengo, Palmeiras, São Paulo + league `mls` / `brasileirao`. Never bare `inter`, `real`, or `santos` without club context. |
| **Merge into `sampleData.js`** | **MLS + Brasileirão merged** (browse only for new BRA rows; MLS quiz wave 1 only). |

Full audit: **§12** · machine report: [generated-data/phase4-preview-audit-report.json](./generated-data/phase4-preview-audit-report.json)

---

## 1. How MLS and Brasileirão fit the current model

FootyBrain uses **one club football schema** — no parallel “Americas app.”

| Layer | Today (phases 1–3) | Phase 4 addition |
|-------|-------------------|------------------|
| `leagues[]` | 6 European domestic leagues | + `mls`, + `brasileirao` (men’s Série A only) |
| `teams[]` | 55 clubs | + up to **30 MLS** (2025 TM) + **20 Brasileirão** (if data quality gates pass) |
| `players[]` | ~1,231 rows, single registry | + browse squad rows via same TM → preview → app-ready → merge path |
| Routes | `/league/:id`, `/team/:id`, `/player/:id` | Unchanged — no new route types |
| Quiz | `quizEligible` + hints + `quickFact` | Generated Americas rows default **`quizEligible: false`** until `players.generated-draft.json` approval |
| National teams | `nationality` / `nationalTeam` strings on player row | Unchanged — NT entities come **after** Phase 4 per [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) |

### Integration rules (non-negotiable)

1. **Same merge pipeline** — `build:data-preview` → `build:app-ready-preview` → `validate:overlays` → merge → `validate:app-ready-preview` → `validate:squad-report`.
2. **Phase config file** — `editorial-overlays/phase4-clubs.json` (new) merged alongside phase1–3 in `build-footybrain-preview-data.js` and `merge-phase1-sample-data.js` (already supports arbitrary extra config files once added).
3. **TM competition codes** — confirmed in `data/competitions.json` and 2025 scraper: **`MLS1`** (MLS), **`BRA1`** (Série A). Declare in phase4 `leagues[]` as `tmCompetitionCode`.
4. **One player, one `id`** — `tm-{sourceId}` for generated rows; never duplicate a European row for the same athlete.
5. **No national-team tables** in this phase — club import only.

### Pipeline files touched (when executing — not now)

| Artifact | Action |
|----------|--------|
| `editorial-overlays/phase4-clubs.json` | Create — league rows + club manifest |
| `generated-data/import-maps.json` | Create or extend — stable slug ↔ `sourceId` for marquee players |
| `scripts/phase1-curation.js` | Raise `playersMax` in steps (see §4); **fix `displayName()` last-name-only fallback** before Brasileirão merge (see §11) |
| `generated-data/phase4-raw-probe-report.json` | Raw TM probe output (2025 season) |
| `scripts/build-footybrain-preview-data.js` | Optional: Americas-specific `CLUB_NAME_BLOCKLIST` entries |
| `src/utils/searchAliases.js` | Add team/league aliases (§6) — **after** data merge PR, separate small PR |
| `src/data/sampleData.js` | Written only by reviewed merge |

---

## 2. Target clubs (full league if data quality is clean)

**Gate:** Each league imports **all** listed clubs only if the **data quality probe** (§5.1) passes. Otherwise fall back to a **marquee subset** (documented in probe report) and replan.

### 2.1 MLS — 30 clubs (2025 TM season)

Transfermarkt **`MLS1`** lists **30** first-tier clubs in scraper season **2025** (includes **San Diego FC**). Target import: **all 30** if probe passes.

| `footybrainTeamId` | Label | TM `code` (2025 scraper) |
|--------------------|-------|--------------------------|
| `atlanta-united` | Atlanta United FC | `atlanta-united-fc` |
| `austin-fc` | Austin FC | `austin-fc` |
| `charlotte-fc` | Charlotte FC | `charlotte-fc` |
| `chicago-fire` | Chicago Fire FC | `chicago-fire-fc` |
| `fc-cincinnati` | FC Cincinnati | `fc-cincinnati` |
| `colorado-rapids` | Colorado Rapids | `colorado-rapids` |
| `columbus-crew` | Columbus Crew | `columbus-crew-sc` |
| `dc-united` | D.C. United | `d-c-united` |
| `fc-dallas` | FC Dallas | `fc-dallas` |
| `houston-dynamo` | Houston Dynamo FC | `houston-dynamo-fc` |
| `inter-miami` | Inter Miami CF | `inter-miami-cf` — **Never** slug `inter`; blocklist vs Inter Milan |
| `la-galaxy` | LA Galaxy | `los-angeles-galaxy` |
| `lafc` | Los Angeles FC | `los-angeles-fc` |
| `san-diego-fc` | San Diego FC | `san-diego-fc` (2025 expansion) |
| `minnesota-united` | Minnesota United FC | `minnesota-united-fc` |
| `cf-montreal` | CF Montréal | `club-de-foot-montreal` |
| `nashville-sc` | Nashville SC | `nashville-sc` |
| `new-england-revolution` | New England Revolution | `new-england-revolution` |
| `new-york-city-fc` | New York City FC | `new-york-city-fc` |
| `new-york-red-bulls` | New York Red Bulls | `new-york-red-bulls` (TM: Red Bull New York) |
| `orlando-city` | Orlando City SC | `orlando-city-sc` |
| `philadelphia-union` | Philadelphia Union | `philadelphia-union` |
| `portland-timbers` | Portland Timbers | `portland-timbers` |
| `real-salt-lake` | Real Salt Lake | `real-salt-lake-city` — **Not** alias `real` → Real Madrid |
| `san-jose-earthquakes` | San Jose Earthquakes | `san-jose-earthquakes` |
| `seattle-sounders` | Seattle Sounders FC | `seattle-sounders-fc` |
| `sporting-kansas-city` | Sporting Kansas City | `sporting-kansas-city` |
| `st-louis-city` | St. Louis City SC | `st-louis-city-sc` |
| `toronto-fc` | Toronto FC | `toronto-fc` |
| `vancouver-whitecaps` | Vancouver Whitecaps FC | `vancouver-whitecaps-fc` |

**Excluded from Phase 4:** NWSL, USL, MLS Next Pro (men’s brief scope; women’s out of scope).

### 2.2 Brasileirão Série A — 20 clubs (2025 TM season)

Transfermarkt **`BRA1`** has **20** first-tier clubs in scraper season **2025**. Manifest must match this exact set (promotion/relegation changes yearly):

| `footybrainTeamId` | Label | TM `code` (2025 scraper) |
|--------------------|-------|--------------------------|
| `chapecoense` | Chapecoense | `chapecoense` |
| `vasco-da-gama` | Vasco da Gama | `vasco-da-gama-rio-de-janeiro` |
| `atletico-mineiro` | Atlético Mineiro | `clube-atletico-mineiro` |
| `athletico-paranaense` | Athletico Paranaense | `club-athletico-paranaense` |
| `flamengo` | Flamengo | `flamengo-rio-de-janeiro` |
| `remo` | Clube do Remo | `clube-do-remo-pa-` |
| `coritiba` | Coritiba | `coritiba-fc` |
| `cruzeiro` | Cruzeiro | `ec-cruzeiro-belo-horizonte` |
| `bahia` | Bahia | `esporte-clube-bahia` |
| `vitoria` | Vitória | `esporte-clube-vitoria` |
| `fluminense` | Fluminense | `fluminense-rio-de-janeiro` |
| `gremio` | Grêmio | `gremio-porto-alegre` |
| `mirassol` | Mirassol | `mirassol-futebol-clube-sp-` |
| `bragantino` | Red Bull Bragantino | `red-bull-bragantino` |
| `botafogo` | Botafogo | `botafogo-rio-de-janeiro` |
| `santos` | Santos | `fc-santos` |
| `sao-paulo` | São Paulo | `fc-sao-paulo` |
| `palmeiras` | Palmeiras | `se-palmeiras-sao-paulo` |
| `corinthians` | Corinthians | `corinthians-sao-paulo` |
| `internacional` | Internacional | `sc-internacional-porto-alegre` |

> **Note:** This is the **2025** TM snapshot (includes Chapecoense, Coritiba, Remo, Mirassol). Re-probe each season before merge; do not assume a static “grande” list.

**Excluded:** Série B full league, state leagues as separate entities, women’s Brasileirão.

---

## 3. Player caps and quiz policy

### 3.1 Browse squad caps (TM-curated)

| Setting | Value | Where |
|---------|-------|--------|
| Per club (TM rows) | **18–22** seniors (`maxPerClub: 22`, target 20) | `scripts/phase1-curation.js` |
| Per club (user-facing range) | **18–25** including MVP/editorial extras on same `teamId` | Merge allows MVP + curated TM; squad report warns if total > 30 |
| Global merge cap | Step **1,320 → 1,650** (MLS only) → **2,000** (MLS + Brasileirão) | `EXPANSION_LIMITS.playersMax` |
| Min age | 19 | Existing curation |
| Non-Latin display names | Excluded from TM curation unless policy relaxed | `hasSupportedDisplayName()` — review Brasileirão probe |

**Expected row counts (planning):**

| Wave | Clubs | Browse players (approx.) |
|------|-------|---------------------------|
| MLS only | 30 | ~540–660 (30 × 18–22; TM raw **868** rows) |
| + Brasileirão | 20 | +360–440 (TM raw **663** rows; ~400 after cap) |
| **Cumulative with Europe** | 105 | ~1,700–2,050 total |

### 3.2 Quiz-ready (editorial-gated)

| Rule | Policy |
|------|--------|
| Default for merged TM rows | `quizEligible: false`, `dataStatus: generated-needs-editorial` |
| Quiz activation | Only via `players.generated-draft.json` with `reviewStatus: approved` → `generated-editorial-approved` in app-ready |
| Per-club quiz target | **3–5** quiz-ready per club minimum long-term; **5–8** for marquee MLS / grande Brasileirão |
| League quiz targets | MLS **40–60** strict pool; Brasileirão **35–50** |
| Hint quality | English hints; durable facts per [ROSTER_FRESHNESS_PLAN.md](./ROSTER_FRESHNESS_PLAN.md) |
| Strict pool | `isQuizEligiblePlayer()` — ≥2 hints + `quickFact` length ≥12 (unchanged) |

**Never** bulk-flip `quizEligible: true` on import.

---

## 4. Validation plan

Run existing validators plus Phase 4–specific checks. **No new app code required** for planning; some checks may need a small `validate:phase4-probe` script later (optional).

### 4.1 Pre-import data quality probe (gate)

**Completed 2026-05-25** against `raw-data/transfermarkt-scraper/2025` — full numbers in [generated-data/phase4-raw-probe-report.json](./generated-data/phase4-raw-probe-report.json).

Re-run before each merge:

```bash
npm run inspect:tm   # confirms scraper season + file presence
# Re-run probe script or refresh phase4-raw-probe-report.json after phase4-clubs.json exists
npm run build:data-preview
```

| Check | MLS1 (2025 probe) | BRA1 (2025 probe) | Pass? |
|-------|-------------------|-------------------|-------|
| Competition code in `competitions.json` | `MLS1` — 30 clubs, 852 players (meta) | `BRA1` — 20 clubs, 670 players (meta) | Yes |
| Clubs in scraper `clubs.json.gz` | **30** | **20** | Yes |
| Player rows linked to league clubs | **868** | **663** | Yes |
| `dateOfBirth` | **100%** | **100%** | Yes |
| `nationality` | **100%** | **100%** | Yes |
| `position` | **100%** | **100%** | Yes |
| Current club (`parent` on player row) | **100%** | **100%** | Yes |
| `sourceId` (spieler id in href) | **100%** | **100%** | Yes |
| Senior-usable squads (age ≥19, valid display) | **30/30** clubs ≥18 | **20/20** clubs ≥18 | Yes |
| Clubs with &lt;15 senior rows | **0** | **0** | Yes |
| **Current `phase1-curation` `displayName()`** | ~3.8% rows dropped | **~70% rows dropped** (mononym in `last_name` only) | MLS OK; **BRA blocked until script fix** |

If a future season fails thresholds → import marquee subset only and update the probe report.

### 4.2 Post-build validators (existing)

| Command | Phase 4 use |
|---------|-------------|
| `npm run validate:overlays` | Manual MVP + generated-draft `sourceId` integrity |
| `npm run validate:app-ready-preview` | Required fields, duplicate `sourceId`, team/league IDs (includes phase4 config once added to validator paths) |
| `npm run validate:squad-report` | Per-club totals; flag < 18 or > 25 (warn), > 30 (error) |

### 4.3 Validation matrix (explicit)

| Check | Tool / rule | Fail action |
|-------|-------------|-------------|
| **Squad size per club** | `validate:squad-report` + cap in curation | Trim curation; do not merge until fixed |
| **Duplicate display names (same team)** | `validate-app-ready-preview` warnings | Block quiz for affected rows until hints disambiguate |
| **Duplicate last names (same team)** | Same + `buildAmbiguousLastNames` in quiz | Full-name matching only for those clubs |
| **Global duplicate names** | Merge log / editorial report | Editorial `displayName` disambiguation in overlay |
| **Missing DOB** | `validate-app-ready-preview` errors (non–manual-only) | Exclude row from curation or fix TM mapping |
| **Missing nationality** | Validator error | Exclude row or manual overlay |
| **Missing position** | Validator error | Exclude row |
| **Duplicate `sourceId`** | Validator error | Resolve overlay vs TM collision |
| **`sourceId` mismatch** (overlay vs preview) | `validate:overlays` error | Fix draft before merge |
| **MVP name collision** | Merge `reservedPlayerNames` guard | Keep MVP row; skip generated duplicate |
| **Unknown `teamId` / `leagueId`** | Validator + phase4 in `EXPANSION_CONFIG_PATHS` | Add club to phase4 config |
| **Stale MVP club vs TM** | `validate:overlays` warnings | Update manual `sourceId` or sample club before Americas merge |

### 4.4 Post-merge smoke (manual)

- `npm run build` — bundle size vs 500 KB warning
- Browse: `?league=mls`, `?league=brasileirao`, club filter shows full squad
- Quiz: `?league=mls` only after editorial wave — pool must not include needs-editorial rows
- Search: flagship alias queries (§6) return correct club

---

## 5. Search aliases plan (code change deferred)

Add to `src/utils/searchAliases.js` in a **dedicated PR after merge**, per club review. **Conservative:** short tokens must map to one entity.

### 5.1 Required team aliases (Phase 4)

| `teamId` | Planned aliases | Never use |
|----------|-----------------|----------|
| `inter-miami` | `inter miami`, `inter miami cf`, `miami` (optional) | `inter` alone |
| `lafc` | `lafc`, `los angeles fc`, `la fc` | `la` alone (conflicts with LA Galaxy context) |
| `la-galaxy` | `la galaxy`, `galaxy`, `los angeles galaxy` | `la` alone |
| `corinthians` | `corinthians`, `timao`, `sc corinthians` | — |
| `flamengo` | `flamengo`, `fla`, `cr flamengo` | — |
| `palmeiras` | `palmeiras`, `verdao`, `se palmeiras` | `palmeiras` as player alias |
| `sao-paulo` | `sao paulo`, `spfc`, `são paulo` (normalized search strips accent) | — |

### 5.2 League aliases

| `leagueId` | Planned aliases |
|------------|-----------------|
| `mls` | `mls`, `major league soccer`, `american league` |
| `brasileirao` | `brasileirao`, `brazil serie a`, `serie a brazil`, `campeonato brasileiro` |

**Do not** alias `serie a` alone to Brasileirão — already mapped to Italian `serie-a`.

### 5.3 Collision rules

| Risk | Mitigation |
|------|------------|
| `inter` → Inter Milan | Only `inter-miami` gets Miami aliases |
| `real` → Real Madrid | Only full phrases for Real Salt Lake |
| `santos` → many players | No global `santos` team or player alias |
| `milan` / `ac-milan` | No MLS club uses bare `milan` |
| Duplicate player names in autocomplete | League + club in subtitle (existing UX) |

---

## 6. Rollout order

Aligned with PROJECT_BRIEF **MLS (#2) before Brasileirão (#3)**. Phase 4 executes **after** European phase 3 is stable in production.

```
4.0  Planning gate (this doc) — no data
4.1  Pipeline prep
     · Create phase4-clubs.json (MLS league row only)
     · Confirm TM MLS1 in raw + competitions.json
     · Bump playersMax → 1,650
     · Fix stale MVP sourceIds (trent, nunez, ederson, ter-stegen, sane)
4.2  MLS data quality probe → pass/fail report
4.3  MLS full merge (29 clubs if pass) — browse only, quizEligible false
     · npm run expand:phase4 (future script alias) or manual pipeline chain
4.4  MLS editorial wave 1 — 40–60 approved in generated-draft
     · validate:overlays → re-merge
4.5  MLS search aliases PR (§5.1 MLS rows)
4.6  Brasileirão prep — add 20 clubs to phase4-clubs.json, confirm BRA1
4.7  Brasileirão probe → pass/fail
4.8  Bump playersMax → 2,000; Brasileirão merge (browse only)
4.9  Brasileirão editorial wave 1 — 35–50 approved
4.10 Brasileirão search aliases PR (§5.1 Brazil rows)
4.11 Bundle/search perf check; document limits
────  National teams (Phase 5 product) — NOT in this file
```

**Within each league:** probe → league hub copy in config → all team stubs → merge → editorial → quiz flags → aliases → optional licensed images (marquee only).

### Suggested npm script (future, not added yet)

```json
"expand:phase4": "npm run build:data-preview && npm run build:app-ready-preview && npm run validate:overlays && npm run merge:phase1-sample && npm run validate:app-ready-preview && npm run validate:squad-report"
```

(Same merge entrypoint as today; loads phase4 when `phase4-clubs.json` exists.)

---

## 7. Biggest risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| TM raw missing MLS1/BRA1 competitions | **Blocker** | **Resolved in 2025 raw** — re-verify each season |
| **`displayName()` drops BRA mononyms** | **Blocker** | Use `last_name` when `name` empty in `phase1-curation.js` before Brasileirão merge |
| MLS 30 vs plan 29 franchises | Low | Use TM 2025 list (includes San Diego FC) |
| BRA promotion/relegation churn | Medium | Manifest from probe, not static doc table |
| `playersMax` exceeded → silent trim | High | Step caps; log trim in merge console |
| Bundle ~2k rows / 1 MB+ JSON | High | Monitor build; plan league chunk split if needed |
| Brasileirão duplicate surnames (Silva, Santos, García) | High | Per-team validator warnings; quiz full-name only |
| MLS `Inter` / `Real` alias collisions | Medium | Slugs + §5 collision rules |
| `hasSupportedDisplayName` drops valid squads | Medium | Probe counts; relax only with documented rule |
| Quiz pool dilution | High | Editorial gate only; no bulk quizEligible |
| Dual-national players in MLS + Europe | Medium | One `player.id`; TM refresh updates `teamId` |
| Promotion/relegation changes Série A 20 | Medium | Reconcile manifest each season |
| NT / World Cup scope creep | Medium | Club-only Phase 4; see [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) later |

---

## 8. Explicit non-goals (Phase 4)

- No data in `sampleData.js` until probe + review gates pass
- No Firebase, APIs, or live fixtures
- No national-team entities or `/national-team/*` routes
- No women’s MLS (NWSL) or Série A feminina
- No app UI redesign — existing browse/quiz/league pages absorb new ids
- No auto-generated quiz hints for bulk squads

---

## 9. Execution checklist (when import starts)

- [x] `editorial-overlays/phase4-clubs.json` — 50 clubs (30 MLS + 20 BRA)
- [x] Staged preview + `npm run validate:phase4-preview` (see §12)
- [x] `displayName()` last-name fallback in `phase1-curation.js`
- [ ] European editorial backlog “stable” per [EDITORIAL_BACKLOG.md](./EDITORIAL_BACKLOG.md)
- [x] `playersMax` bumped to 1,900 (MLS tranche)
- [x] **MLS merge tranche** → `sampleData.js` (browse only; quiz stays off)
- [x] Search aliases: Inter Miami, LAFC, LA Galaxy, NYCFC, Atlanta United, `mls`
- [ ] MLS P0 editorial (`players.generated-draft.json`)
- [ ] **Brasileirão merge tranche** (second wave)
- [ ] Search aliases: Corinthians, Flamengo, Palmeiras, São Paulo, `brasileirao`
- [ ] BRA P0 editorial + duplicate-name quiz review
- [ ] Update `HANDOFF.md` / bundle size note

---

## 11. Raw Transfermarkt probe summary (2025 season)

**Source:** `raw-data/transfermarkt-datasets/data/competitions.json` + `data/raw/transfermarkt-scraper/2025/{clubs,players}.json.gz`  
**Inspect:** `npm run inspect:tm` (curated CSVs absent; scraper NDJSON used — expected)

### Confirmed competition codes

| League | TM code | `competition_type` | TM meta (`competitions.json`) |
|--------|---------|--------------------|-------------------------------|
| MLS | **`MLS1`** | `first_tier` | 30 clubs, 852 players |
| Brasileirão Série A | **`BRA1`** | `first_tier` | 20 clubs, 670 players |

### Import safety (planning verdict)

| League | Verdict | Reason |
|--------|---------|--------|
| **MLS** | **Safe for import** after `phase4-clubs.json` maps 30 TM `codes` | 100% factual fields; 30/30 clubs have 18+ senior rows; ~600 browse rows after 22/club cap |
| **Brasileirão** | **Safe after pipeline fix** | Raw data excellent, but **current curation drops ~70%** of rows when TM stores only `last_name` (~224 mononyms). Fix `displayName()` in `phase1-curation.js` (not app UI), then re-probe |

### Estimated post-cap player counts (FootyBrain merge)

| League | TM raw rows | Est. after `maxPerClub: 22` curation |
|--------|-------------|--------------------------------------|
| MLS | 868 | ~600 |
| Brasileirão | 663 | ~400 |
| **Phase 4 add** | ~1,531 | **~1,000** (+ existing 1,231 → ~2,230; requires `playersMax` → 2,000+ staged) |

### Senior-squad usability

- **MLS:** 92.6% of rows senior-usable; squads 24–36 players per club in raw; curation trims to 18–22.
- **Brasileirão:** 96.1% senior-usable **when** display name uses `last_name` fallback; positions are TM strings (e.g. `Attack - Left Winger`) — normalized at preview build like Europe.
- **Non-Latin scripts:** Not a material issue for 2025 BRA/MLS sample; mononyms are Latin letters with accents (allowed by `hasSupportedDisplayName`).

### Required pipeline fix before Brasileirão merge

In `scripts/phase1-curation.js` `displayName()`:

```js
// After first+last check, add:
if (last) return last;
```

(`build-footybrain-preview-data.js` already joins `name` + `last_name` into preview `name`; curation must not discard last-only rows.)

**Status:** `displayName()` last-name fallback is **implemented** in `scripts/phase1-curation.js` — re-run `npm run build:phase4-preview` after any curation change.

---

## 12. Staged preview audit (MLS + Brasileirão — not live)

**Artifacts audited:** `generated-data/footybrain-phase4-preview-data.json` (1,531 raw TM rows), `generated-data/phase4-preview-inspection-summary.json`, curation simulation via `curatePhase1PreviewPlayers()` (same rules as merge).

**Commands (repeat anytime):**

```bash
npm run build:phase4-preview
npm run validate:phase4-preview
```

### 12.1 Club mappings

| Check | Result |
|-------|--------|
| Clubs in `editorial-overlays/phase4-clubs.json` | 50 (30 MLS + 20 Série A) |
| Matched to TM 2025 squads | **50 / 50** |
| Unmatched targets | **0** |
| Wrong league on player row | **0** |

**Verdict:** Club manifest and TM `codes` are correct for the 2025 snapshot. Re-probe after promotion/relegation or MLS expansion changes.

### 12.2 League IDs

| Field | Value |
|-------|-------|
| FootyBrain league ids | `mls`, `brasileirao` only |
| TM competition codes | `MLS1`, `BRA1` |
| Player rows with unexpected `footybrainLeagueId` | **0** |

**Verdict:** Pass — no cross-league contamination in staged export.

### 12.3 Squad sizes and senior filtering

| Metric | MLS | Brasileirão | Combined |
|--------|-----|-------------|----------|
| Raw preview rows | 868 | 663 | **1,531** |
| Raw rows per club (range) | 24–36 | 27–39 | — |
| After curation (`maxPerClub: 22`, age ≥ 19) | **660** (30×22) | **440** (20×22) | **1,100** |
| Clubs with &lt; 18 players after curation | 0 | 0 | 0 |
| Under-19 in **raw** preview (dropped by curation) | — | — | **89** |

The staged JSON is intentionally **uncapped** (full TM squads for inspection). **Merge uses curation** — senior squad filtering **works**; every club reaches 22 curated browse slots.

**Verdict:** Browse pool size is predictable post-merge. Raw preview is noisier than what users will see live.

### 12.4 Missing DOB, nationality, position

| Field | Missing in staged preview |
|-------|---------------------------|
| `dateOfBirth` | **0** |
| `nationality` | **0** |
| `position` | **0** |
| `sourceId` / `name` | **0** |

**Verdict:** Pass — factual completeness matches European phases.

### 12.5 Duplicate names

| Pattern | Count | Notes |
|---------|-------|-------|
| Identical display name, same team | **1** | Two “Dudu” at Athletico Paranaense (different TM `sourceId`s) |
| Same last name, same team | **13** | Expected in Brazilian squads (Silva, Santos, etc.) |
| Normalized full-name collision **across** Phase 4 | **25** | e.g. multiple “Dudu”, “Allan” on different clubs |

`validate:phase4-preview` **passes with warnings** on duplicate-name risk. Quiz must stay **full-name + team context**; Brasileirão needs stricter editorial than MLS.

**Verdict:** Acceptable for **browse**; **quiz** remains editorial-gated (`quizEligible: false` by default).

### 12.6 Player names and encoding

| Issue | Count | Mitigation |
|-------|-------|------------|
| TM mononyms / last-name-only (BRA) | ~241 raw | `displayName()` last-name fallback — **fixed** |
| Non-Latin script in TM `name` (Arabic, Cyrillic, CJK) | **59** raw | Prefer `firstName` + `lastName` at merge display; **50** rows fail curation `hasSupportedDisplayName` Latin rule |
| Accented Latin (é, ã, ç) | OK | Allowed |

**Verdict:** Encoding is not a blocker for MLS. For Brasileirão merge, confirm merged `name` uses Latin first+last, not TM full_name blobs with foreign scripts.

### 12.7 Pool noise

| Pool | Assessment |
|------|------------|
| Raw TM export (1,531) | High volume by design — includes youth and full benches |
| Post-curation browse (~1,100) | **Acceptable** for league/team pages |
| Quiz without editorial | **Too noisy** — duplicate surnames and global name collisions |

**Verdict:** MLS pool is **moderately** noisy; Brasileirão is **noisier** for quiz. Neither should auto-enable quiz.

### 12.8 Famous / marquee players (2025 TM snapshot)

**Present in staged preview:** Lionel Messi, Luis Suárez (Inter Miami); Hulk (Atlético Mineiro); Neymar (Santos); Memphis Depay (Corinthians); Giorgian de Arrascaeta (Flamengo); Luciano and other Série A staples.

**Absent — roster reality, not pipeline bug:** Sergio Busquets (left Inter Miami), Carlos Vela (left MLS), Endrick (left Palmeiras for Real Madrid). Do not treat as merge failures.

**Verdict:** Marquee coverage is adequate for a **2025** club-football snapshot.

### 12.9 Search aliases needed (before or with first live merge)

| Entity | Suggested aliases (non-exhaustive) |
|--------|-----------------------------------|
| `inter-miami` | inter miami, miami, messi club (avoid bare `inter`) |
| `lafc` | la fc, los angeles fc, l afc |
| `la-galaxy` | galaxy, la galaxy, los angeles galaxy |
| `corinthians` | timão, corinthians sp |
| `flamengo` | mengão, fla |
| `palmeiras` | verdão, palmeiras sp |
| `sao-paulo` | são paulo, spfc, tricolor paulista |
| `mls` | major league soccer, mls soccer |
| `brasileirao` | serie a, brasileirão, brazil league |

**Collision rules:** Never map bare `inter` → Inter Miami; bare `real` → Real Salt Lake; bare `santos` → Santos FC without disambiguation from European clubs.

### 12.10 Recommendations (import execution)

#### Import order: **MLS first**, then Brasileirão

1. **MLS tranche** — satisfies PROJECT_BRIEF gate #2; ~660 curated rows; English hints faster; fewer global duplicate-name collisions.
2. **Brasileirão tranche** — gate #3; ~440 rows; depends on last-name curation fix (done); plan extra editorial week for mononyms and surname duplicates.

Importing **both in one merge** is possible only if `playersMax` is raised once to **~2,100** and you accept global trim logging — still **not recommended** for first live push (harder to debug trim and quiz scope).

#### Target player cap

| Setting | Value | Rationale |
|---------|-------|-----------|
| `maxPerClub` | **22** (unchanged) | Matches phases 1–3 browse density |
| `playersMax` — MLS only | **~1,900** | 1,231 existing + ~660 MLS |
| `playersMax` — both leagues | **~2,100** | 1,231 + ~1,100 Phase 4 curated |
| Phase 4 browse rows (both) | **~1,100** curated | 1,531 raw → curation |

Current `playersMax: 1320` would **silently drop most Phase 4 rows** if merged today — **must bump before any merge**.

#### Initial editorial priorities

| Priority | MLS clubs | Brasileirão clubs |
|----------|-----------|-------------------|
| **P0** | Inter Miami, LAFC, LA Galaxy, Seattle Sounders | Flamengo, Palmeiras, Corinthians, São Paulo |
| **P1** | Atlanta United, NYCFC, Portland, Philadelphia | Santos, Grêmio, Atlético Mineiro, Botafogo |
| **P2** | Remaining MLS franchises | Remaining Série A (Chapecoense, Remo, Mirassol, etc.) |

Per club: approve **8–15** quiz candidates in `players.generated-draft.json` with `quickFact` + hints — not full 22-player squads.

#### Is it safe to merge into `sampleData.js`?

| Surface | Safe? | Conditions |
|---------|-------|------------|
| **Browse** (teams/leagues/players) | **Yes, conditional** | `playersMax` bumped; `phase4-clubs.json` wired in merge; run full validator suite; MLS tranche first recommended |
| **Quiz** | **No** until editorial | Default `quizEligible: false`; no bulk approval |
| **Search** | **Partial** | Add §12.9 aliases in `searchAliases.js` with merge PR or immediately after |
| **Bundle size** | **Monitor** | ~+1,100 rows ≈ significant JSON growth — watch build output |

**Do not merge** in this audit pass — preview stays staged until you explicitly request live import.

---

## 10. Related documents

| Doc | Role |
|-----|------|
| [generated-data/phase4-raw-probe-report.json](./generated-data/phase4-raw-probe-report.json) | Machine-readable 2025 probe |
| [generated-data/phase4-preview-audit-report.json](./generated-data/phase4-preview-audit-report.json) | Staged preview audit (§12) |
| [generated-data/footybrain-phase4-preview-data.json](./generated-data/footybrain-phase4-preview-data.json) | Staged export (not live) |
| [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) | Gates #2–#3 |
| [MLS_BRASILEIRAO_EXPANSION_PLAN.md](./MLS_BRASILEIRAO_EXPANSION_PLAN.md) | Product + scaling context |
| [DATA_MERGE_PLAN.md](./DATA_MERGE_PLAN.md) | Layered merge / overlay rules |
| [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) | After club Phase 4 |
| [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) | Images |
| [ROSTER_FRESHNESS_PLAN.md](./ROSTER_FRESHNESS_PLAN.md) | Hint durability |

---

*Phase 4: staged preview + audit complete; not merged to live app. No UI or Firebase changes.*
