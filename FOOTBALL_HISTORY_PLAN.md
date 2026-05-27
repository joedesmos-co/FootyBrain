# Football history content plan

> **Planning only.** No new history routes, UI modes, quiz filters, or large historical datasets in this phase.  
> Aligns with [PROJECT_BRIEF.md](./PROJECT_BRIEF.md): men’s soccer only; frontend-only; local sample data; no Firebase until pre-Firebase gates are met.  
> **Related:** [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) (tournament + winners in WC context), [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) (country pages), [WORLD_CUP_ROADMAP.md](./WORLD_CUP_ROADMAP.md) (short WC index).

**Status (2026-05-24):** History is **editorial and collection-driven** today (`ballon-dor-winners`, `ucl-legends`, `world-cup-watchlist`, team `legends[]` strings). This document defines how to grow **structured** history later without rewriting the app.

---

## 1. Purpose

FootyBrain already teaches **who plays now** (clubs, leagues, national teams, quizzes). A **football-history pillar** adds **when, where, and why it mattered**—awards, tournaments, iconic clubs, and legendary names—while keeping the same learner loop: browse → profile → quiz → collections.

**Principles**

| Principle | Rule |
|-----------|------|
| Single player registry | Historical figures appear only as existing `players[]` rows (or future imports)—never duplicate “Pelé 1970” vs “Pelé profile” rows. |
| Editorial first | Winners, years, and trophy lists are **curated JSON**, not scraped award databases in v1. |
| Reuse surfaces | Prefer collections, quiz pools, league/team/NT pages before new hub UI. |
| No rating wars | No EA FC stats; history copy uses FootyBrain Importance Score only where a player is in the live registry. |
| Men’s scope | Ballon d’Or (men’s award as commonly taught), men’s World Cup, men’s UCL—unless product scope changes in `PROJECT_BRIEF.md`. |

---

## 2. Future capability map (requirements → plan)

| Topic | Learner goal | Planned delivery (later) | MVP without big datasets |
|-------|--------------|---------------------------|---------------------------|
| **Ballon d'Or history** | Know winners by year, club at win, playing role | `awards[]` + `awardWinners[]` (year, `playerId`, clubAtWin, note) | Expand [collections](./src/data/collectionsData.js) `ballon-dor-winners`; quiz when ≥3 eligible IDs |
| **World Cup winners** | Connect nation → trophy count → era | `competitions[]` editions + `historyEditions[]` on WC; link `nationalTeamId` | Collection “WC winners” + live NT pages (`brazil`, `france`, …); [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) § tournament history |
| **UCL history** | Finals eras, repeat champions, club identity | `competitions[]` type `uefa-champions-league` + `editionWinners[]` (teamId, year) | `ucl-legends` collection; `/team/:id` fan guides + `legends[]`; league hub for UCL clubs in sample |
| **Legendary players** | Retired or pre-modern stars still worth knowing | `playerTags: ['legend','hall-of-fame']` + richer `careerHistory` / `quickFact` | Player profiles + collection items; search aliases (`pele`, `cruyff`, …) when IDs exist |
| **Iconic teams** | Club mythology (Ajax, Milan, Madrid, …) | `teams.historicalNotes`, `iconicEra[]` editorial | `TeamProfile` fan path + `team.legends[]`; collection of `type: 'team'` |

**Product name (future):** “FootyBrain History” or “Archive” as a **hub section**—not a separate app. Ship only after WC mode and NT wave 2 reduce confusion between “2026 squad” and “1970 winner.”

---

## 3. What reuses existing infrastructure

### 3.1 Collections (highest leverage — **no new routes**)

| Mechanism | Location | History use |
|-----------|----------|-------------|
| Curated playlists | `src/data/collectionsData.js` | Themed paths: Ballon d’Or decades, WC winner nations, UCL final clubs, “one-club legends” |
| Item types | `player`, `team`, `league`, `national-team` | Mix NT pages for Brazil/France with star `playerId`s |
| `quizLaunch` | `collections.js` → `/quiz?team=`, `?league=`, `?nationalTeam=` | Scoped practice after reading a history collection |
| Detail page | `CollectionDetailPage.jsx` | Already renders badges, notes, quiz CTA |

**Already shipped examples:** `ballon-dor-winners`, `ucl-legends`, `world-cup-watchlist`, European/South American NT collections.

**Gap:** No `type: 'history-event'` yet—defer until `historyEvents.json` exists (§4).

### 3.2 Quizzes

| Mechanism | Location | History use |
|-----------|----------|-------------|
| `isQuizEligiblePlayer` | `quizEligibility.js` | Only players with hints + quickFact enter history quizzes |
| Team / league / NT filters | `QuizMode.jsx`, `quizSession.js` | “Real Madrid UCL era” = `?team=real-madrid`; “France NT” = `?nationalTeam=france` |
| Hint templates | `quizVariants.js`, player `quizHints` | Add award/year hints only on reviewed players |
| Daily challenge | `dailyChallengePlan.js` | Optional **history day** later—needs stable tagged pool |

**Constraint:** Historical quiz copy must not invent stats; hints reference editorial facts already on the player row.

### 3.3 League pages

| Mechanism | Location | History use |
|-----------|----------|-------------|
| League hub | `LeagueProfile.jsx`, `LeagueHubStrip` | “Top league” context for Serie A / Premier League / La Liga legends |
| Featured clubs | `leagueFeatured.js` | Highlight clubs with most European pedigree in copy |
| Club chips | `LeagueClubChip.jsx` | Entry to iconic team profiles |

**Limit:** Leagues teach **current structure**; UCL **finals history** is not a league row—attach to competition entity later (§4).

### 3.4 National-team pages

| Mechanism | Location | History use |
|-----------|----------|-------------|
| NT profile | `NationalTeamProfile.jsx` | Fan guide, rivals, squad—add **trophy roll** in editorial overlay when WC plan ships |
| Membership | `nationalTeamLive.json` | Present-day links only; WC winners list does not require full historical squads |
| Search | `universalSearch.js` | Nation entities rank above club-name collisions (“Brazil”) |

**Synergy:** [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) `historyNotes` on `competitions[]` is the long-term home for winner timelines; NT pages link outward.

### 3.5 Other reuse (lighter touch)

| Surface | History use |
|---------|-------------|
| `PlayerProfile` + `careerHistory[]` | Timeline of clubs; primary vessel for retired legends in registry |
| `TeamProfile` + `legends[]` | String list today → link to `playerId` when IDs exist |
| `UniversalSearch` + `searchAliases.js` | Discover “Maradona”, “Zidane” when aliases point at real rows |
| `TeamSquadView` | Not for retired eras—current squad only |
| `RelatedPlayers` | Contemporary connections only |

---

## 4. Proposed data model (additive — **do not import yet**)

Keep history data **small, editorial, and referential**—IDs only, no parallel player tables.

```
historyTopics[]           // ballon-dor | world-cup | ucl | legends | iconic-clubs
historyEvents[]           // one row per teachable moment
  id, topicId, title, year, summary (2–4 sentences)
  links: { playerIds[], teamIds[], nationalTeamIds[], competitionId? }
awards[]                  // ballon-dor (men's editorial scope)
  id, name, firstYear, topicId
awardWinners[]            // year, awardId, playerId?, winnerName (if no player row), clubAtWin, note
competitionEditions[]     // extends WORLD_CUP_MODE_PLAN competitions[]
  competitionId, year, winnerNationalTeamId?, runnerUp?, hostNationIds[], historyNotes
```

**Join rules**

- If `playerId` is null, show **text-only** card in collection—not a broken profile link.
- Retired legends without TM import: **collection note + search alias** until a single registry row is approved.
- Never store copyrighted trophy photos as requirements; badges/initials pattern matches NT/club UI.

**File placement (future):** `src/data/historyLive.json` or `editorial-overlays/history.json` merged at build—same pattern as `nationalTeamLive.json`.

---

## 5. Roadmap phases

| Phase | Name | Deliverable | UI |
|-------|------|-------------|-----|
| **H0** | Editorial collections (now) | More `collectionsData` rows; expand quiz-ready winners in registry | Existing `/collections` only |
| **H1** | Tagged players + team copy | `historyTags` on players; `teams.historicalNotes`; link `legends[]` → `playerId` where possible | Profile + team pages only |
| **H2** | Award + edition JSON | `awardWinners[]`, `competitionEditions[]` for WC + UCL (top N years) | Optional `/history` index (light list, not card wall) |
| **H3** | History hub + quizzes | `/history`, `/history/ballon-dor`, filters `?topic=` | Small hub; reuse `CollectionDetailPage` patterns |
| **H4** | WC + History merge | WC mode “Past winners” tab reads `competitionEditions` | [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) |

**Gate:** Do not start **H2 JSON** until wave 2 national teams and quiz filters are stable—avoid three competing “Brazil” stories (club search, NT squad, 1970 winner).

---

## 6. Recommended MVP historical content (first additions)

Priority order: **maximum learning value per editorial hour**, zero new routes.

### 6.1 Tier A — ship via collections only (immediate)

| Collection idea | Items | Quiz launch |
|-----------------|-------|-------------|
| **World Cup winners (modern era)** | NT: `brazil`, `france`, `germany`, `argentina` (when live) + 2–3 stars each | `?nationalTeam=` per nation |
| **Ballon d'Or — expand winners** | Add quiz-ready IDs to existing `ballon-dor-winners` (target 8–12 names) | Custom pool later; until then manual play from collection |
| **UCL clubs you must know** | Teams: Madrid, Barcelona, Liverpool, Milan, Bayern + one player each | `?team=real-madrid` etc. |
| **One-club legends** | Players with single-club `careerHistory` in DB | `?team=` matching club |

### 6.2 Tier B — profile + team editorial (no new JSON schema)

- Enrich `careerHistory` / `quickFact` for 10–15 **legendary** registry players (retired or late-career still in sample).
- Replace plain-string `team.legends[]` entries with `playerId` links where the player exists.
- NT fan guides: one paragraph on **World Cup titles** for live five nations (copy only in `nationalTeamLive.json`).

### 6.3 Tier C — first structured dataset (smallest slice)

When H2 is approved, import **only**:

1. **Men’s World Cup winners** — 8 editions (e.g. 1998–2022) → `winnerNationalTeamId` + `year` + 1-line `historyNotes`.
2. **Ballon d'Or** — last 10 winners → `awardWinners[]` referencing existing `playerId`s; text fallback for missing rows.
3. **UCL** — last 5 finals → `winnerTeamId` + year (no match lineups).

Do **not** import full finalist brackets, Ballon d'Or voting ranks, or all-time UCL top scorers in v1.

---

## 7. Topic-specific notes

### Ballon d'Or

- **Risk:** Name/spelling (“Ballon d'Or” vs branding); keep men’s award scope explicit in copy.
- **Data:** France Football / editorial verification per year; no automated scrape in pre-Firebase phase.
- **Reuse:** `ballon-dor-winners` collection; player `quizHints` can include “Won Ballon d'Or in …” when reviewed.

### World Cup winners

- **Reuse:** NT pages + WC mode plan; collections group nations not “tournament objects.”
- **Quiz:** Nation filter on **current** quiz-ready players teaches “learn Brazil today”; separate **history quiz** needs `historyTags` or dedicated hint template (H3).

### UCL history

- **Reuse:** Club teams in `teams[]`, `ucl-legends`, league pages for UCL-heavy leagues.
- **Avoid:** Treating UCL as a `leagueId`—use future `competitionId: uefa-champions-league`.

### Legendary players

- **Constraint:** Registry skews active squads; legends need **import policy** (one row per human, caps in `careerHistory` not live NT).
- **Reuse:** `PlayerProfile` career block, compare mode, collections.

### Iconic teams

- **Reuse:** `TeamProfile` fan path, `TeamCard`, compare snapshots.
- **Copy:** `fanGuide` + `legends[]` + optional `historicalNotes` field later.

---

## 8. Scaling risks

| Risk | Why it hurts | Mitigation |
|------|----------------|------------|
| **Duplicate player rows for eras** | Breaks quiz, search, favorites | Single `players[]`; `careerHistory` + tags only |
| **History without quiz eligibility** | Collections feel hollow | Gate collections on resolved `playerId`; text cards for gaps |
| **Retired stars missing from registry** | Broken links from “legends” lists | `winnerName` text mode in `awardWinners`; alias → browse until import |
| **Copyright / likeness** | Image rights on vintage players | Placeholder visuals; editorial photos policy in [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) |
| **Scope creep vs WC 2026** | Two Brazil narratives | WC mode = current cycle; history = editions collection + NT trophy copy |
| **Large JSON bundles** | Slow mobile load | Split `historyLive.json`; lazy-fetch hub; never embed full winner tables in `sampleData.js` |
| **Quiz hint accuracy** | Wrong year/club at win | Per-winner editorial review; no TM auto-hints for awards |
| **Women’s / merged awards** | Product scope drift | Explicit men’s-only until brief changes |
| **Nav sprawl** | “Giant card walls” | Hub = compact lists; deep detail on existing profile/NT/team routes |

---

## 9. Explicitly out of scope (this plan)

- New app UI, routes, or navbar entries (until H3 approved).
- Full Ballon d'Or / World Cup / UCL databases or API connectors.
- Match-by-match archives, lineups, or xG.
- Separate “historical players” table or FIFA license-dependent assets.
- Firebase-backed leaderboards for history mode.

---

## 10. Success metrics (when history ships)

| Metric | Target |
|--------|--------|
| Collections tagged `History` | ≥6 playable paths, each ≥5 resolved items |
| Quiz-ready legends / winners | ≥40 players with award or WC hint reviewed |
| Broken collection links | 0 unresolved `playerId` in history collections |
| New-user path | Home or Browse → Collection → Profile → Quiz in ≤4 taps |

---

## 11. Cross-links

| Document | Relationship |
|----------|----------------|
| [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) | Tournament + `competitionEditions` for WC winners |
| [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) | Country pages for winner nations |
| [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) | Pre-Firebase gates; men’s scope |
| [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) | Images, legal, performance before public launch |

---

*Last updated: 2026-05-24 — planning doc only; no app changes.*
