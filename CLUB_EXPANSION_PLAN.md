# Club Expansion Plan — European League Completion Wave

> **Authority:** [PROJECT_BRIEF.md](./PROJECT_BRIEF.md)  
> **Scope:** Fill missing clubs in **already-supported** European leagues before adding new leagues.  
> **Constraints:** Frontend-only, local data only, **no Firebase/APIs**, no pipeline rewrite, do not make everything quiz-ready.

---

## 1. Current live club coverage (by league)

FootyBrain currently ships **124 clubs** across 8 leagues. European league coverage today:

- **Premier League**: 20 clubs live (target full league: 20) — **complete** (Phase 5 merged)
- **La Liga**: 10 clubs live (target full league: 20)
- **Bundesliga**: 10 clubs live (target full league: 18)
- **Serie A**: 20 clubs live (target full league: 20) — **complete** (Phase 6 merged)
- **Ligue 1**: 9 clubs live (target full league: 18)
- **Eredivisie**: 5 clubs live (target full league: 18)

**Note:** “Target full league” is the typical club count. The raw source below is a **season snapshot** and may differ (promotion/relegation).

---

## 2. Raw available club data (clean source-of-truth)

Raw club availability for planning is taken from:

- `raw-data/transfermarkt-datasets/data/raw/transfermarkt-scraper/2025/clubs.json.gz`
  - NDJSON club rows
  - Includes a `parent.country_code` that functions as competition code (e.g. `GB1`, `ES1`, `IT1`, `FR1`, `NL1`)

Availability (2025 snapshot):

- **GB1**: 20 clubs available (Premier League)
- **ES1**: 20 clubs available (La Liga)
- **IT1**: 20 clubs available (Serie A)
- **FR1**: 18 clubs available (Ligue 1)
- **NL1**: 18 clubs available (Eredivisie)
- **DE1**: **0 clubs available in this dataset snapshot** (Bundesliga) → **defer** until raw coverage is present or alternate source is approved.

---

## 3. Missing club gaps (safe candidates vs defer)

### 3.1 Premier League (GB1) — complete

- **Live:** 20 / 20 (Phase 5 merged 2026-05-26)
- **Status:** No remaining GB1 gaps in the 2025 snapshot.

**Duplicate-name risk:** Low (distinct English club identities).

### 3.2 La Liga (ES1)

- **Live:** 10 / 20
- **Likely missing clubs (ES1 2025 snapshot, excluding current live big clubs):**
  - Elche (`fc-elche`)
  - Getafe (`fc-getafe`)
  - Osasuna (`ca-osasuna`)
  - Rayo Vallecano (`rayo-vallecano`)
  - Girona (`fc-girona`)
  - Alavés (`deportivo-alaves`)
  - Levante (`ud-levante`)
  - Real Oviedo (`real-oviedo`)
  - Mallorca (`rcd-mallorca`)

**Risk / caveat:** The 2025 snapshot may omit some stable La Liga clubs (e.g. Espanyol) depending on the season represented. Plan for a final “canonical 20” check before merging.

### 3.3 Serie A (IT1) — complete

- **Live:** 20 / 20 (Phase 6 merged 2026-05-26)
- **Previously missing clubs (now merged):**
  - Atalanta (`atalanta-bergamo`)
  - Bologna (`fc-bologna`)
  - Fiorentina (`ac-florenz`)
  - Genoa (`genua-cfc`)
  - Udinese (`udinese-calcio`)
  - Torino (`fc-turin`)
  - Cagliari (`cagliari-calcio`)
  - Lecce (`us-lecce`)
  - Sassuolo (`us-sassuolo`)
  - Hellas Verona (`hellas-verona`)
  - Parma (`parma-calcio-1913`)
  - Como (`como-1907`)
  - Cremonese (`us-cremonese`)
  - Pisa (`ac-pisa-1909`)

**Duplicate-name risk:** Medium (Italy has multiple “AC/SS/US” prefixed names; prefer stable `teamId` slugs + Transfermarkt code mapping).

### 3.4 Ligue 1 (FR1)

- **Live:** 9 / 18
- **Likely missing clubs (FR1 2025 snapshot):**
  - Auxerre (`aj-auxerre`)
  - Lorient (`fc-lorient`)
  - Metz (`fc-metz`)
  - Toulouse (`fc-toulouse`)
  - Nantes (`fc-nantes`)
  - Le Havre (`ac-le-havre`)
  - Angers (`sco-angers`)
  - Brest (`stade-brest-29`)
  - Paris FC (`paris-fc`)

**Risk / caveat:** “Paris FC” is distinct from PSG; keep aliases conservative to avoid search collisions.

### 3.5 Eredivisie (NL1)

- **Live:** 5 / 18
- **Likely missing clubs (NL1 2025 snapshot, excluding current live big clubs):**
  - FC Utrecht (`fc-utrecht`)
  - SC Heerenveen (`sc-heerenveen`)
  - Sparta Rotterdam (`sparta-rotterdam`)
  - NEC Nijmegen (`nec-nijmegen`)
  - Fortuna Sittard (`fortuna-sittard`)
  - FC Groningen (`fc-groningen`)
  - PEC Zwolle (`pec-zwolle`)
  - Go Ahead Eagles (`go-ahead-eagles-deventer`)
  - Heracles Almelo (`heracles-almelo`)
  - FC Volendam (`fc-volendam`)
  - Excelsior (`sbv-excelsior-rotterdam`)
  - NAC Breda (`nac-breda`)
  - Telstar (`sc-telstar`) *(risk: may not be Eredivisie in the season snapshot)*

**Risk / caveat:** The NL1 2025 snapshot includes at least one “season drift” club (e.g. Telstar). Treat NL as higher-risk unless the pipeline validates competition membership.

### 3.6 Bundesliga (DE1) — defer

- **Live:** 10 / 18
- **Raw availability:** DE1 clubs are **not present** in the current Transfermarkt scraper snapshot.
- **Plan:** Defer Bundesliga completion until DE1 club rows exist in raw data, or until a vetted alternate source can be used.

---

## 4. Expected player increase (planning estimate)

Current squads average roughly **~22 players per club** in live data.

Approximate added players if we complete the “typical full league” club counts:

- Premier League: +5 clubs → **~+114 players**
- La Liga: +10 clubs → **~+225 players**
- Serie A: +14 clubs → **~+318 players**
- Ligue 1: +9 clubs → **~+197 players**
- Eredivisie: +13 clubs → **~+286 players**
- Bundesliga: +8 clubs → **~+178 players** *(defer until raw available)*

Total (excluding Bundesliga): **~+1,140 players** (order-of-magnitude estimate).

---

## 5. Expected bundle / shard impact (Phase 8–9 compatible)

- League shard routes (`/league/:id`, Browse single-league sessions) remain protected by the shard system.
- The **`sample-data` monolith still grows** with each added club/player and remains the primary bottleneck for:
  - Quiz, Daily, Compare, Player profiles, unfiltered Browse

**Watch item:** After this wave, re-measure `sample-data` gzip size and parse cost; it may cross the Phase 7/8 thresholds in `PERFORMANCE_SCALING_PLAN.md`.

---

## 6. Recommended rollout order

1. **Premier League** (smallest gap, low risk)  
2. **Serie A** (largest “major league” gap; high learning value)  
3. **Ligue 1** (medium gap; straightforward club identities)  
4. **La Liga** (season drift risk but strong learning value)  
5. **Eredivisie** (higher drift risk; validate competition membership carefully)  
6. **Bundesliga** (defer until DE1 is present in raw snapshot)

---

## 7. Next actions (when implementing the wave)

- Add a new “wave” overlay file (or extend the current phase overlay system) with Transfermarkt codes + FootyBrain `teamId` slugs.
- Run the existing preview + validation pipeline (no rewrite) to confirm:
  - Club membership in the intended league
  - Duplicate-name / alias collisions are contained
  - Roster freshness (TM vs sampleData) warnings are manageable

---

## 8. Premier League completion preview (Phase 5) — Leeds, Bournemouth, Sunderland, Nottingham Forest, Burnley

**Preview build:** `npm run build:data-preview` (Transfermarkt scraper season 2025).  
**Policy:** Generated players remain **browse/search/compare only** (not quiz-ready) until editorial approval.

| FootyBrain teamId | Display name | Transfermarkt code | Transfermarkt clubId | Preview player rows |
|------------------:|--------------|--------------------|----------------------|--------------------:|
| `leeds` | Leeds United | `leeds-united` | `399` | 26 |
| `bournemouth` | Bournemouth | `afc-bournemouth` | `989` | 26 |
| `sunderland` | Sunderland | `afc-sunderland` | `289` | 28 |
| `nottingham-forest` | Nottingham Forest | `nottingham-forest` | `703` | 29 |
| `burnley` | Burnley | `fc-burnley` | `1132` | 29 |

**Duplicate-name risk:** Low (no suspicious mappings flagged for these clubs in the preview output).  
**Quiz/editorial gap:** All newly generated players should default to `quizEligible: false` / “needs editorial” status until approved.

**Live merge:** Completed — see commit `Add Premier League completion clubs`.

---

## 9. Serie A completion preview (Phase 6) — 14 missing IT1 clubs

**Preview build:** `npm run build:data-preview` with `editorial-overlays/phase6-serie-a-completion-clubs.json` (Transfermarkt scraper season 2025).  
**Policy:** Generated players remain **browse/search/compare only** (not quiz-ready) until editorial approval. **Do not merge** until preview sign-off.

| FootyBrain teamId | Display name | Transfermarkt code | TM clubId | Preview player rows |
|------------------:|--------------|--------------------|----------:|--------------------:|
| `atalanta` | Atalanta | `atalanta-bergamo` | `800` | 24 |
| `bologna` | Bologna | `fc-bologna` | `1025` | 27 |
| `fiorentina` | Fiorentina | `ac-florenz` | `430` | 28 |
| `genoa` | Genoa | `genua-cfc` | `252` | 26 |
| `udinese` | Udinese | `udinese-calcio` | `410` | 26 |
| `torino` | Torino | `fc-turin` | `416` | 30 |
| `cagliari` | Cagliari | `cagliari-calcio` | `1390` | 29 |
| `lecce` | Lecce | `us-lecce` | `1005` | 27 |
| `sassuolo` | Sassuolo | `us-sassuolo` | `6574` | 29 |
| `verona` | Hellas Verona | `hellas-verona` | `276` | 30 |
| `parma` | Parma | `parma-calcio-1913` | `130` | 25 |
| `como` | Como | `como-1907` | `1047` | 27 |
| `cremonese` | Cremonese | `us-cremonese` | `2239` | 27 |
| `pisa` | Pisa | `ac-pisa-1909` | `4172` | 29 |

**Preview totals:** 14 / 14 clubs matched, **384** player rows, **0** unmatched clubs.

**Duplicate-name risk:** Medium (Italy-wide). No duplicate full display names within a single new squad. Common first names repeat within squads (e.g. Federico×3 at Cremonese, Nicolò×2 at Bologna/Udinese). Four shared surnames across different new clubs (Sulemana, Rodríguez, Coulibaly, Moro) — search disambiguation should use club subtitle, not surname alone.

**Safe-to-merge (preview):** All 14 clubs — clean TM code matches, IT1 membership confirmed, no club-duplicate or unmatched-target warnings for this wave.

**Defer / watch (editorial, not blocking preview):**
- **Promotion/relegation drift:** Como, Cremonese, Pisa are recent top-flight returnees; re-validate IT1 membership before live merge if the scraper season folder changes.
- **Quiz/editorial:** ~384 new players need identity stubs, quick facts, and explicit quiz approval — none should enter quiz pools by default.

**Expected live impact (if merged):**
- Clubs: 110 → **124** (+14)
- Serie A: 6 → **20** clubs
- `sample-data` monolith: +~384 players
- `public/data/leagues/serie-a.json` shard: current ~120 KB raw / ~18 KB gzip (6 clubs) → est. **~450–500 KB raw / ~55–65 KB gzip** at full 20-club coverage

**Live merge (2026-05-26):** 14 clubs merged; Serie A shard 20 teams / 373 players; **237** new squad rows under Phase 6 team IDs (merge cap ~22/club). All Phase 6 players `quizEligible: false`. Regenerated shard, search index, national-team preview.

**Note:** Global player total is governed by the expansion cap (~2,350); this merge re-trimmed some older generated rows (−39 net app-wide) while adding Serie A squads.

