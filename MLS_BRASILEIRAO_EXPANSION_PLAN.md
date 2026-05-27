# MLS + Brasileirão expansion plan (long-term)

> **Planning only.** No MLS/Brasileirão rows in `sampleData.js`, no new routes, no UI changes, no imports, and no Firebase until this plan is executed in phases after current European club depth is stable.  
> Aligns with [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) pre-Firebase gates **#2 (MLS)** and **#3 (Brasileirão)**, before national teams (#4) and World Cup mode (#5).  
> **Pipeline execution:** [PHASE4_MLS_BRAZIL_PLAN.md](./PHASE4_MLS_BRAZIL_PLAN.md) (phase4 config, caps, validation, aliases).

## 1. Purpose

Prepare FootyBrain for **broader global men’s club coverage** while staying frontend-only, local-data, and editorial-first. This document defines **what to add later**, **how much**, and **in what order**—without shipping data or changing the current app experience.

### Current baseline (reference)

| Dimension | Approx. today | Notes |
|-----------|---------------|--------|
| Domestic leagues | 6 (PL, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie) | Club football only in `leagues[]` |
| Clubs | 55 | Full squads per club in merge pipeline |
| Players | ~1,231 | 36 manual MVP + generated squad listings |
| `quizEligible: true` (flag) | ~100+ | Strict pool uses hints + `quickFact` via `quizEligibility.js` |
| Search | Full scan + alias map + importance tie-break | See recent search-quality pass |
| Merge caps | `playersMax` 1,320 · `maxPerClub` 22 | `scripts/phase1-curation.js` |

Americas expansion should **extend** this model, not fork a second app or duplicate players per league.

---

## 2. Proposed expansion strategy

### 2.1 Two new league entities (club football only)

| League | Proposed `leagueId` | Clubs (target) | Player rows (browse) | Quiz-ready (editorial target) |
|--------|---------------------|----------------|----------------------|-------------------------------|
| **MLS** | `mls` | 29 (full league) | ~450–550 | 40–60 stars + 5–8 per big market club |
| **Brasileirão** (Série A) | `brasileirao` | 20 | ~320–400 | 35–50 icons + 4–6 per grande |
| **Combined Americas pass** | — | **49** | **~770–950** | **75–110** strict quiz pool |

**Global ceiling after Americas (planning):** ~2,000–2,100 total player rows and ~2,400 hard merge cap before bundle/search refactors (see §6). Stay under merge `playersMax` until pipeline splits by region.

### 2.2 Integration principles

1. **Same schemas** — `leagues[]`, `teams[]`, `players[]`; same routes `/league/:id`, `/team/:id`, `/player/:id`.
2. **Same merge pipeline** — TM preview → app-ready → overlay → `merge:phase1-sample` (or successor `merge:americas-sample`); never raw preview → `sampleData.js`.
3. **Same quiz gates** — `quizEligible` + ≥2 `quizHints` + substantive `quickFact`; generated browse rows default `false`.
4. **One player, one `id`** — MLS/Brasileirão do not create duplicate rows for dual nationals; NT overlap handled later per [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md).
5. **League identity is editorial** — Each league gets `description`, `styleOfPlay`, `famousClubs`, `famousPlayers`, `rivalries` (same shape as European hubs), not just roster dumps.

### 2.3 MLS integration (plan)

**Product role:** Gateway league for North American learners; complements European coverage without replacing it.

| Workstream | Plan |
|------------|------|
| **League hub** | `/league/mls` — calendar quirks (playoffs, no relegation), CONCACAF context, Designated Player era, rivalry map (MLS Cup, regional derbies). |
| **Clubs** | All 29 franchises; stable slugs (`la-galaxy`, `inter-miami`, `atlanta-united`, …). TM club codes in `import-maps` before merge. |
| **Roster policy** | **Browse:** up to 18–22 senior names per club (merge cap). **Quiz:** 5–8 approved per “marquee” club, 3–5 elsewhere. |
| **Aliases** | Conservative `searchAliases.js` entries: `lafc`, `inter miami`, `man city` must *not* collide with MLS “Inter” — use `inter-miami` slug + alias `inter miami cf` not bare `inter`. |
| **Identity tags** | Club `identityTags` via `teamClubMeta` pattern: e.g. `#MLSCup`, `#SupportersShield`, `#HudsonRiverDerby`. |
| **Collections** | Phase 2 editorial: “MLS Icons”, “South American stars in MLS” (player items only; no new collection type). |

**Editorial priorities (MLS):** Inter Miami / Messi-era awareness, LA Galaxy history, Seattle Sounders, Atlanta United, NYC derby pair, classic MLS Cup winners, USMNT-linked stars at MLS clubs (without building NT pages yet—use `nationalTeam` string on player row).

### 2.4 Brasileirão integration (plan)

**Product role:** Largest Americas football culture; high duplicate-name and diacritic density; strong learner interest for flair, Libertadores context, and national-team feeder narrative.

| Workstream | Plan |
|------------|------|
| **League hub** | `/league/brasileirao` — state championships, relegation drama, Série A vs Europe sales pipeline, Clássico framing. |
| **Clubs** | 20 Série A teams; slugs without accents (`flamengo`, `palmeiras`, `corinthians`, `sao-paulo`, `atletico-mineiro`, …). |
| **Roster policy** | **Browse:** 16–22 per club (slightly tighter than MLS if bundle grows). **Quiz:** prioritize “grandes” + Libertadores finalists. |
| **Names** | Normalize display names for search (`normalizeForSearch` already strips accents); keep display accents in UI. Log global duplicate names in merge report (expect **González**, **Silva**, **Santos** collisions). |
| **Aliases** | `fla`, `verdao` (careful: disambiguate Palmeiras vs others), `timao`, `galo` — one entity per alias. |
| **Language** | `quickFact` / hints in English; optional Portuguese proper nouns in hints when quiz-safe. |

**Editorial priorities (Brasileirão):** Flamengo, Palmeiras, Corinthians, São Paulo, Atlético Mineiro, Grêmio, Internacional, Botafogo; young exports (Endrick-era templates); evitar thin “generated-editorial-approved” stubs in quiz pool.

### 2.5 Future national-team overlap (no NT data yet)

Americas club expansion **feeds** national-team work; it does not replace it.

| Topic | How MLS/Brasileirão interact with [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) |
|-------|-------------------------------------------------------------------------------------|
| **Player registry** | Same `player.id`; `nationality` / `nationalTeam` strings on club rows remain until `nationalTeams[]` + memberships ship. |
| **Dual nationals** | MLS rosters (Argentina, Colombia, …) and Brasileirão exports playing in Europe—one row, club `teamId` updated on transfers; NT quiz uses `nationalTeam` field first. |
| **USA / Mexico / Canada** | MLS adds many CONCACAF players; plan NT pages **after** club data exists so squads hydrate from membership joins, not duplicate MLS rows. |
| **Brazil / Argentina** | Brasileirão is primary source for Brazil-heavy quiz hints; Argentina stars in MLS link to future `national-team/argentina` without second player ids. |
| **World Cup mode** | Americas club pass de-risks 2026 learner interest; WC collections filter by `nationalTeam` string until `competitionSquads` exist. |
| **Search (later)** | Add `nationality` + canonical `nationalTeamId` to `getPlayerSearchFields` when NT entities exist; until then, club+league subtitles stay primary disambiguators. |

**Rule:** Import MLS + Brasileirão **club football first**. Do not add `nationalTeams[]` or `/national-team/*` routes in the same merge PR as the first Americas club dump.

---

## 3. Cross-cutting considerations

### 3.1 Roster size

| Layer | Recommendation |
|-------|----------------|
| Per club (browse) | 18–22 seniors; minors/u23 only if editorially notable |
| Per league (browse total) | MLS ~522 max (29×18); Brasileirão ~360 max (20×18) |
| Global merge | Raise `playersMax` in **steps** (1,320 → 1,650 → 2,000), not one jump |
| Team pages | Keep “full squad” when `teamFilter` set; league-wide browse keeps **60-card cap** (existing UX) |

### 3.2 Search scaling

| Risk at ~2k players | Mitigation (planning; code later if needed) |
|---------------------|---------------------------------------------|
| Full-array scan in universal search | Keep 2-char minimum for player scan; consider league-scoped search index when >2,500 |
| Club-name query floods | Already ranked by `importanceScore`; add MLS/Brasileirão team aliases explicitly |
| Duplicate surnames | Autocomplete shows league when duplicate names in list; merge report flags global collisions |
| Short tokens (`silva`, `santos`) | Editorial: prefer first-name aliases for quiz icons; do not expand bare `santos` alias to one club |

**No external search APIs** (per PROJECT_BRIEF). If perf regresses: precompute `searchIndex.json` at build time—still local static asset.

### 3.3 Quiz balancing

| Control | Policy |
|---------|--------|
| Pool size | Cap **quiz-active** Americas additions at ~75–110 reviewed players per phase |
| Daily / featured | Americas players enter rotation only after editorial pass; default generated `quizEligible: false` |
| Difficulty | Easy = club + position; medium = `nationalTeam`; hard = career hints—verify MLS/Brazil strings don’t duplicate European NT answers |
| Ambiguous last names | Run `buildAmbiguousLastNames` on **pool focus**; disable last-name-only answers for shared surnames (Silva, García, González) |
| League filter | `/quiz?league=mls` and `?league=brasileirao` work with existing `QuizMode`—no UX change until data exists |
| Balance vs Europe | Target **≤35%** of daily/quiz sessions drawn from Americas until learner feedback says otherwise |

### 3.4 Image sourcing

Per [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md):

- No TM/Google hotlinks; placeholders remain default for bulk generated rows.
- **MLS:** prioritize Wikimedia/CC for historic icons; club-hosted only with license.
- **Brasileirão:** same; higher legal variance for celebrity likeness—batch by editorial tier, not whole league.
- Plan **~15–25** licensed images per league phase (marquee quiz players), not 500.

### 3.5 Duplicate-name risks

| Source | Mitigation |
|--------|------------|
| Within club | Merge dedupe (normalized name per `teamId`) |
| Across leagues | Global merge `suspiciousMappings` log; quiz off until hints disambiguate |
| Known pattern | Two **Nico González** (Spain) already exist—expect more with Brasileirão |
| MLS “Inter” vs Inter Milan | Slug `inter-miami`; never alias `inter` alone for MLS |
| Display | Autocomplete: club + league in subtitle when duplicate full names in results |

### 3.6 League identity

Each new league row must ship with beginner-friendly copy (not TM scrape text):

- **MLS:** playoffs, salary cap/DP rules (plain language), Supporters’ Shield, geographic rivalries, expansion clubs.
- **Brasileirão:** promotion/relegation, state leagues (mention, don’t simulate), Libertadores slots, clássicos, jogo bonito learning angle.

Club pages: `shortHistory`, `fanGuide`, `rivals`, `legends`, `identityTags`—minimum stub for all clubs; deep editorial for 8–10 flagship clubs per league.

---

## 4. Recommended rollout order

Aligned with PROJECT_BRIEF **#1 → #2 → #3 → #4 → #5**:

```
Phase 0 (now)     Planning docs only — this file; no data/UX
Phase 1 (gate)    European club depth “learning-complete” per editorial backlog
Phase 2A          MLS league + 29 teams (browse-first, quizEligible false)
Phase 2B          MLS editorial wave 1 (40–60 quiz-ready) + search aliases
Phase 3A          Brasileirão league + 20 teams (browse-first)
Phase 3B          Brasileirão editorial wave 1 (35–50 quiz-ready)
Phase 4           National-team entities + overlap fields (see NATIONAL_TEAM_PLAN)
Phase 5           World Cup mode collections + competition filters
Phase 6           Firebase / accounts (only after above)
```

**Why MLS before Brasileirão?**

1. PROJECT_BRIEF order explicitly lists MLS (#2) before Brasileirão (#3).
2. English-primary editorial is faster to validate hints/quiz copy.
3. Brasileirão duplicate-name and diacritic risk benefits from merge/report tooling hardened on MLS scale first.
4. 2026 World Cup North American host narrative favors MLS familiarity before full Brazil depth.

**Within each league:** league hub → all team stubs → browse merge → marquee player editorial → quiz flags → collections → images (marquee only).

---

## 5. Editorial priorities (summary)

| Priority | MLS | Brasileirão |
|----------|-----|-------------|
| P0 | League hub copy + 29 team stubs | League hub + 20 team stubs |
| P1 | Inter Miami, LA Galaxy, Seattle, Atlanta, NYCFC/RBNY | Flamengo, Palmeiras, Corinthians, São Paulo |
| P2 | MLS Cup winners, USMNT stars in league | Atlético Mineiro, Grêmio, Internacional, Botafogo |
| P3 | Rivalry/double-game week context | Libertadores + clássico packs |
| P4 | Designated Player / playoff explainers | Relegation + Série B narrative links |
| Quiz last | Never flip `quizEligible` before 2 hints reviewed | Same |

---

## 6. Scaling limits (hard planning numbers)

| Limit | Current | After MLS only | After MLS + Brasileirão | Action if exceeded |
|-------|---------|----------------|-------------------------|-------------------|
| `playersMax` (merge) | 1,320 | 1,650 | 2,000 | Split `sampleData` by region or lazy-load league chunks |
| Total player rows | ~1,231 | ~1,700 | ~2,050 | Monitor `npm run build` bundle size |
| Quiz-eligible (strict) | ~100–150 | +40–60 | +75–110 | Keep daily pool editorial-curated subset |
| `searchAliases` entries | Small | +30–40 teams, +25 players | +25 teams, +30 players | Manual review; no auto-scrape aliases |
| Universal search results | 14 cap | unchanged | unchanged | OK until 2,500+ players |
| Images licensed | Few | +15 | +15 | Tier-1 quiz faces only |

**Do not raise** `maxPerClub` above 22 without testing mobile team squad scroll and compare picker latency.

---

## 7. Biggest risks

| Risk | Severity | Notes |
|------|----------|-------|
| Bundle size / parse time | High | ~2k JSON rows in one `sampleData.js`; may need code-split per league later |
| Quiz pool dilution | High | Too many low-quality generated rows → frustrating quizzes |
| Duplicate names (PT/ES) | High | Brasileirão; strict ambiguous-last-name handling required |
| Alias collisions (`inter`, `milan`) | Medium | MLS club names vs European giants |
| TM club ID drift | Medium | New leagues need `import-maps` maintenance |
| NT string inconsistency | Medium | “USA” vs “United States” until NT entity model |
| Image rights | Medium | Especially MLS celebrity and Brazil star likeness |
| Learner scope creep | Low | Stay men’s-only per brief; no NWSL/Série A feminina in this plan |

---

## 8. Explicit non-goals (this plan)

- No MLS/Brasileirão data in `sampleData.js` yet
- No new Navbar links, filters, or quiz UI until European gate + data merge approved
- No API/Firebase/external search
- No women’s MLS NWSL or women’s Brasileirão
- No Brasileirão Série B full league (mention only in copy until Série A is stable)

---

## 9. Implementation checklist (when execution starts)

Use as a gate before first Americas merge PR:

- [ ] `editorial-overlays/americas-mls-clubs.json` (club list + TM codes) — planning manifest
- [ ] `editorial-overlays/americas-brasileirao-clubs.json`
- [ ] `import-maps` entries for all 49 clubs
- [ ] `searchAliases.js` diff reviewed for collisions
- [ ] `validate:app-ready-preview` + global duplicate-name report
- [ ] League hub editorial signed off (English, beginner tone)
- [ ] `EXPANSION_LIMITS.playersMax` bumped in `phase1-curation.js` with bundle check
- [ ] Spot-check: Browse cap, universal search, quiz `?league=mls`, compare pickers
- [ ] Update `HANDOFF.md` / `CONTENT_EXPANSION_STRATEGY.md` phase table (docs only)

---

## 10. Related documents

| Doc | Role |
|-----|------|
| [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) | Pre-Firebase gate order |
| [ROADMAP.md](./ROADMAP.md) | Product phases |
| [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) | NT overlap after Americas clubs |
| [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) | World Cup Mode (2026) after NT foundation |
| [WORLD_CUP_ROADMAP.md](./WORLD_CUP_ROADMAP.md) | Short WC roadmap index |
| [CONTENT_EXPANSION_STRATEGY.md](./CONTENT_EXPANSION_STRATEGY.md) | Merge pipeline + quiz gates |
| [DATA_MERGE_PLAN.md](./DATA_MERGE_PLAN.md) | Overlay layers, no raw import |
| [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) | Image rules |
| [EDITORIAL_BACKLOG.md](./EDITORIAL_BACKLOG.md) | Ongoing European depth before Americas execution |
| [PHASE4_MLS_BRAZIL_PLAN.md](./PHASE4_MLS_BRAZIL_PLAN.md) | Phase 4 import manifest, validation, rollout |

---

*Last updated: planning pass for Americas expansion; no runtime or data changes.*
