# World Cup 2026 — men’s national team expansion (staging plan)

> **Planning + preview only.** No live routes, no `nationalTeamLive.json` merge, no World Cup quiz mode, no Firebase.  
> Aligns with [PROJECT_BRIEF.md](./PROJECT_BRIEF.md), [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md), [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md).

**Last updated:** 2026-05-26  
**Preview artifact:** `generated-data/world-cup-national-teams-preview.json`  
**Qualified manifest:** `editorial-overlays/world-cup-2026-qualified-teams.json`  
**Build:** `npm run build:world-cup-national-teams-preview`

---

## 1. Qualified teams source

| Item | Status |
|------|--------|
| Official 48-team list in repo | **Yes** — `editorial-overlays/world-cup-2026-qualified-teams.json` |
| FIFA source | [Qualified teams article](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/world-cup-2026-who-has-qualified), [Teams hub](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/teams) |
| Group draw (12×4) | Stored in manifest `groups` (April 2026 draw) |
| Live import gate | **`needs_verification_before_live_import`** — human must re-check FIFA list + slugs before merging into `nationalTeamLive.json` or marketing “all 48 nations live” |

Hosts (automatic): **Canada**, **Mexico**, **United States** (`canada`, `mexico`, `united-states`).

---

## 2. Preview build summary (2026-05-26)

| Metric | Value |
|--------|------:|
| Teams in preview | **48** |
| Linked existing club players (`playerLinks`) | **240** |
| Quiz-eligible linked players | **64** |
| Unmatched TM squad rows (`previewOnly`, no `players[]` import) | **530** |
| Data quality warnings | **47** |
| Countries flagged thin coverage | **37** |
| TM entity missing in raw scrape | **5** |
| Already live (wave 1) | **5** — england, france, spain, brazil, argentina |

**Inspection:** `inspectionPassed: false` — five nations lack Transfermarkt `national_teams.json` rows in the local 2025 scrape; NT-parent squad scrape remains sparse globally.

---

## 3. Teams included (48)

All `qualifiedNationalTeamIds` in preview `competition` block:

**CONCACAF (hosts +):** mexico, canada, united-states, curacao, haiti, panama  
**UEFA:** austria, belgium, bosnia-herzegovina, croatia, czechia, england, france, germany, netherlands, norway, portugal, scotland, spain, sweden, switzerland, turkey  
**CONMEBOL:** argentina, brazil, colombia, ecuador, paraguay, uruguay  
**CAF:** algeria, cape-verde, congo-dr, cote-divoire, egypt, ghana, morocco, senegal, south-africa, tunisia  
**AFC:** australia, iraq, iran, japan, jordan, korea-republic, qatar, saudi-arabia, uzbekistan  
**OFC:** new-zealand

---

## 4. Linked vs unmatched

### 4.1 Linking rules (enforced)

- **No duplicate `players[]` rows** — every `playerLinks[].playerId` must exist in club registry (`footybrain-app-ready-preview.json` / `sampleData.js`).
- **Unmatched** TM NT-squad rows are stored only in `unmatchedNationalTeamPlayers[]` with `previewOnly: true` and **no** `playerId` — safe for staging, not for merge.
- **Dual nationals:** preview may link one `playerId` to multiple nations via TM field; review before `nationalMemberships` merge.

### 4.2 Wave 1 (already live)

| Nation | TM links | Quiz-eligible links | Live memberships (approx.) |
|--------|---------:|--------------------:|---------------------------:|
| brazil | 28 | 8 | 28 |
| france | 23 | 8 | 23 |
| spain | 19 | 8 | 19 |
| england | 15 | 10 | 15 |
| argentina | 8 | 8 | 8 |

Wave 1 nations are the **only** safe live pages today. WC preview adds **43** staged nations.

### 4.3 Strongest TM link coverage (top 10)

| Nation | Links | Quiz-eligible links |
|--------|------:|--------------------:|
| brazil | 28 | 8 |
| france | 23 | 8 |
| germany | 21 | 3 |
| spain | 19 | 8 |
| netherlands | 18 | 7 |
| england | 15 | 10 |
| morocco | 14 | 2 |
| united-states | 13 | 0 |
| canada | 10 | 0 |
| argentina | 8 | 8 |

### 4.4 Zero TM links (18 nations) — highest risk

australia, iraq, iran, jordan, qatar, saudi-arabia, uzbekistan, cape-verde, congo-dr, cote-divoire, egypt, south-africa, tunisia, curacao, haiti, new-zealand, bosnia-herzegovina, scotland

Several still have **registry nationality** counts (e.g. cote-divoire 17, scotland 11) — membership backfill from `players.nationality` is required before public squads.

---

## 5. Data quality warnings

| Warning class | Detail |
|---------------|--------|
| TM scrape gaps | **5** nations not in `national_teams.json.gz` (119 teams): `cape-verde`, `congo-dr`, `cote-divoire`, `curacao`, `haiti` |
| NT-parent squads | Incomplete vs TM `squad_size` for most nations; linker falls back to sparse `national_team.country` on club-parent rows |
| Thin coverage | **37** nations below healthy link threshold (<8 TM links and/or low registry match) |
| Quiz readiness | Many nations <3 quiz-eligible TM links — **not safe** for nation-scoped quiz without editorial picks |
| Unmatched volume | **530** preview-only rows — do **not** import as new players |
| USMNT quiz | united-states: 13 links, **0** quiz-eligible TM links — registry/editorial wave needed |

Full warning strings: `generated-data/world-cup-national-teams-preview.json` → `warnings[]` and `report.dataQualityWarnings`.

---

## 6. Countries with too few linked players

Threshold in build script: **<8** `playerLinks` (and often low registry nationality). Full list: preview `report.thinLinkedCountries` (**37** entries).

**Critical (0 TM links):** see §4.4.

**TM entity missing (cannot link via scrape until entity added):** cape-verde, congo-dr, cote-divoire, curacao, haiti.

---

## 7. Safe rollout phases (do not skip)

| Phase | Work | Live? |
|-------|------|-------|
| **A (done)** | WC qualified manifest + preview JSON + this plan | No |
| **B** | Human FIFA verification → set manifest `verification.status` to `verified_for_import` | No |
| **C** | `build-national-memberships.js` (registry nationality backfill) per nation | No |
| **D** | Editorial fan copy + rivals per nation; manual `competitionSquads` picks | No |
| **E** | Merge **wave 2** nations into `nationalTeamLive.json` (5–10 at a time) | `/national-team/:id` only |
| **F** | `competitions.world-cup-2026` in data + `/world-cup` hub (read-only) | Hub only |
| **G** | WC quiz filters | Only after §0c validation in NATIONAL_TEAM_PLAN |

**Explicitly not in this delivery:** World Cup quiz mode, Firebase, new `players[]` from unmatched scrape, main-nav “World Cup” until hub phase.

---

## 8. Is it safe to make all 48 teams live?

| Question | Verdict |
|----------|---------|
| Safe to merge preview JSON into `sampleData` as-is? | **No** — sparse links, 530 unmatched rows, 5 missing TM entities |
| Safe to open `/national-team/:id` for all 48? | **No** — only wave 1 five are editorially live; others would show empty or misleading squads |
| Safe to use preview `playerLinks` for quiz pools? | **No** — 64 quiz-eligible links across 48 teams; stars missing when TM field empty |
| Safe to keep as **staging preview** for planning/dev? | **Yes** — no app routes wired; artifact is read-only |
| Safe after wave 2+ with registry memberships + FIFA verify? | **Conditional** — nation-by-nation, same gates as [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) §0c |

**Recommendation:** Treat this expansion as **data pipeline + editorial project**, not a single merge. Ship **hosts + UEFA/CONMEBOL cores** in wave 2 (10–12 nations) only when each passes membership + quiz-ready checks.

---

## 9. Commands

```bash
npm run build:app-ready-preview          # if registry stale
npm run build:world-cup-national-teams-preview
# optional: inspect public copy
# public/dev-data/world-cup-national-teams-preview.json
```

---

## 10. Related files

| File | Role |
|------|------|
| `editorial-overlays/world-cup-2026-qualified-teams.json` | Source of truth for 48 IDs + groups |
| `generated-data/world-cup-national-teams-preview.json` | Staging output + `report` |
| `generated-data/national-teams-preview.json` | Original 12-nation TM preview |
| `src/data/nationalTeamLive.json` | Live wave 1 only (unchanged by this task) |
| `scripts/build-world-cup-national-teams-preview.js` | Generator |
