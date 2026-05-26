# FootyBrain — Performance & Data Scaling Plan

> **Authority:** [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) · [PRODUCTION_LAUNCH_PLAN.md](./PRODUCTION_LAUNCH_PLAN.md)  
> **Last updated:** 2026-05-26 (Phase 8B)  
> **Scope:** Front-end scaling + manifest groundwork — **no full data architecture rewrite.**

---

## 1. Audit summary (2026-05-26)

### Phase 7 bundle audit (post-split)

| Chunk | Raw | Gzip | Loaded when |
|-------|----:|-----:|-------------|
| `vendor` | 230 KB | **74 KB** | Every visit |
| `index` (app shell) | 53 KB | **14 KB** | Every visit |
| `content-manifest` | 4 KB | **~2 KB** | Home below-fold, Compare filter |
| `sample-data` | 1,546 KB | **199 KB** | First route needing `sampleData.js` |
| `nationalTeamData` | 226 KB | **24 KB** | NT routes, Browse, Quiz, profile NT link, search |
| `BrowseDatabase` | 12 KB | **3.5 KB** | `/browse` |
| `QuizMode` + `quizSession` | 26 KB | **~8 KB** | `/quiz` (no `worldCupQuizConfig` on club path) |
| `worldCupQuizPools` | 25 KB | **6.4 KB** | `/world-cup`, Quiz international focus only |
| `PlayerProfile` | 13 KB | **4 KB** | `/player/:id` |
| `ComparePage` | 20 KB | **5.7 KB** | `/compare` |

**Do not** assign `nationalTeamData` + `sampleData` to the same `manualChunks` name — Rolldown merges the dependency graph (~1.77 MB single file). Keep `sample-data` as the only manual chunk for `sampleData.js`.

---

### 1.1 Startup bundle

| Asset (gzip) | Size | When loaded |
|--------------|-----:|-------------|
| `vendor` | ~74 KB | Every visit |
| `index` (app shell) | ~13 KB | Every visit |
| `content-manifest` | **~1 KB** | Home below-fold, Compare league filter |
| `sample-data` | **~194 KB** | First route that imports `sampleData.js` |
| `nationalTeamData` (in route chunks) | **~5 KB** gzip | NT pages, search, profile NT link, daily intl picks |
| Feature routes (Browse, Quiz, …) | 1–5 KB each | On navigation (lazy) |

**Phase 6 win:** `/` hero-only path no longer pulls `sample-data` when user stays on hero; `HomeBelowFold` uses `leagueManifest` only (~3 KB chunk vs ~194 KB data).

### 1.2 Parsing cost

| Event | Cost driver | Notes |
|-------|-------------|-------|
| First `import('./sampleData.js')` | Parse + evaluate **~2,331** player objects + indexes | Single synchronous JSON-like module; dominant on mobile |
| `quizEligibility` index build | O(n) scan of `players[]` | **Deferred** until first quiz/daily/registry pool use |
| `nationalTeamLive.json` | **~280** membership rows + 7 team entities | Separate chunk; still pulls `sampleData` for `getPlayerById` |
| Search / Browse | O(n) scan, capped (100 / 60) | Acceptable at current n |

**Estimate (mid-tier mobile, 4G):** 194 KB gzip → parse often **200–600 ms** after download; treat as blocking main thread until sharded.

### 1.3 Memory

| Structure | Approx. footprint after load |
|-----------|----------------------------|
| `players[]` | ~2,331 objects + strings (largest) |
| `playersByTeamId` / `playersByLeagueId` Maps | References only — efficient |
| Quiz eligible cache | ~368 players + 2 Maps (lazy) |
| NT memberships | ~280 links |
| **Total** | Full dataset resident for session once loaded — **no eviction** |

At **5k+ players**, expect **30–50 MB** heap growth in mobile WebViews without sharding.

### 1.4 Mobile impact

| Scenario | Impact |
|----------|--------|
| Cold load `/` (hero only) | **Improved** — no `sample-data` until scroll/feature grid or navigation |
| Cold load `/` (full scroll) | Still loads feature routes; below-fold **without** sample-data |
| Deep link `/player/:id` | Pays `sample-data` + profile chunk + often `national-team-data` |
| Deep link `/browse` | Pays `sample-data` + Browse + daily featured (intl may pull NT data) |
| Universal Search first open | Pays `sample-data` + search chunk |
| Repeat navigation | Cached chunks — parse once per session |

**Mitigations in place:** route lazy loading, search lazy modal, daily nav hook without full challenge gen, browse caps, `content-visibility` on grids.

---

## 2. What was improved

### Phase 5 (2026-05-25)

| Change | Effect |
|--------|--------|
| Route-level `React.lazy` | Feature JS on demand |
| `datasetMeta.js` | Hero stats without `players[]` |
| Deferred `HomeBelowFold` | Separate chunk |
| Lazy Universal Search | Data when modal opens |
| `manualChunks` → `sample-data` | Isolated data parse |

### Phase 6 (2026-05-26) — partial league/NT scaling

| Change | File(s) | Effect |
|--------|---------|--------|
| **`contentManifest.js` + `leagueManifest.js`** | `src/data/` | League shell (counts, badges) without player rows |
| **`public/data/content-manifest.json`** | static mirror | Future fetch / CDN manifest |
| **`loadLeagueShard()` stub** | `contentManifest.js` | Falls back to `sampleData` until shards exist |
| **Home league hubs → manifest** | `HomeBelowFold.jsx` | **Removes `sample-data` from home below-fold chunk** |
| **Compare league filter → manifest** | `ComparePage.jsx` | Dropdown without eager `leagues[]` in page shell |
| **Lazy quiz index** | `quizEligibility.js` | No O(n) scan at import; `getQuizEligibleRegistry()` |
| **`quizPlayerRules.js`** | utils | `isQuizEligiblePlayer` without `sampleData` import |
| **Vite chunks** | `vite.config.js` | `content-manifest` + `sample-data` (isolated; NT stays in route chunks) |
| **`write:content-manifest`** | `scripts/write-content-manifest.js` | Refresh counts after merge |

**Not done:** league JSON shards, async data hooks, NT dynamic import on profile, search index artifact.

### Phase 7 (2026-05-26) — route split + quiz pool decoupling

| Change | File(s) | Effect |
|--------|---------|--------|
| **Lazy all data-heavy routes** | `App.jsx` | `index` gzip **45.7 → 14.3 KB** (−69%); `sample-data` not parsed on `/` hero-only |
| **`nationalQuizPools.js`** | `src/utils/` | Country/international session pools without `worldCupHubData` |
| **`worldCupQuizConstants.js`** | `src/data/` | Caps/flags; `quizSession` no longer imports `worldCupQuizConfig` |
| **Quiz international metas deferred** | `QuizMode.jsx` | `worldCupQuizPools` dynamic import when `poolFocus === 'international'` |
| **`playerEditorial` NT decouple** | `utils/playerEditorial.js` | Browse-only card facts use citizenship string — no `nationalTeamData` import |
| **`worldCupQuizConstants` in manifest chunk** | `vite.config.js` | Tiny shared constants with `datasetMeta` / `contentManifest` |

**Cold `/` (gzip JS, approximate):** vendor 74 + index 14 ≈ **88 KB** (was ~88 KB index-only shell but index previously hid **+31 KB** of eager route code).

### Phase 8 (2026-05-26) — Premier League shard pilot

| Change | File(s) | Effect |
|--------|---------|--------|
| **`public/data/leagues/premier-league.json`** | generated | ~302 KB raw / **~39 KB gzip** (15 teams, 341 players) |
| **`leagueShard.js` + `useLeagueShard`** | `src/data/`, `src/hooks/` | `fetch` + in-memory cache; `import('./sampleData')` fallback |
| **`/league/premier-league`** | `LeagueProfile.jsx` | Shard fetch on success — **avoids `sample-data` parse** |
| **Browse + PL filter** | `BrowseDatabase.jsx` | Lists from shard; defers `sampleData` while PL-only |
| **`write:premier-league-shard`** | `package.json` script | Regenerate after merge |

**Cold path (gzip, approximate):**

| Path | Phase 7 | Phase 8 pilot |
|------|---------|---------------|
| `/league/premier-league` | LeagueProfile + **sample-data 199 KB** | LeagueProfile + **shard ~39 KB** |
| `/browse` → PL filter only | Browse + **sample-data 199 KB** | Browse + **shard ~39 KB** (picks hidden until leaving PL) |
| `/browse` (no filter) | Browse + sample-data | Unchanged (picks still need bundled data) |

### Phase 8B (2026-05-26) — MLS shard (second pilot)

| Change | File(s) | Effect |
|--------|---------|--------|
| **`public/data/leagues/mls.json`** | `write-league-shard.js mls` | ~539 KB raw / **~44 KB gzip** (30 teams, 660 players) |
| **Generic shard writer** | `scripts/write-league-shard.js` | `npm run write:mls-shard`, `write:league-shards` |
| **Manifest `mls`** | `contentManifest.js`, `SHARD_OVERRIDES` | `shardStatus: 'deferred'`, `shardPath: '/data/leagues/mls.json'` |
| **Browse external shard** | `BrowseDatabase.jsx` | Any manifest league with `shardPath` — not PL-only |
| **`/league/mls`** | `LeagueProfile.jsx` (unchanged hook) | Shard fetch on success — **avoids `sample-data` parse** |

**Cold path (gzip, approximate):**

| Path | Phase 8 (PL only) | Phase 8B (PL + MLS) |
|------|-------------------|---------------------|
| `/league/mls` | sample-data 199 KB | LeagueProfile + **shard ~44 KB** |
| `/browse` → MLS filter only | sample-data 199 KB | Browse + **shard ~44 KB** (picks hidden) |
| `/browse` → PL filter only | shard ~39 KB | Unchanged |
| Quiz / Search / Daily / Compare / NT | sample-data | **Unchanged** |

**Pilot readiness:** Two leagues prove the manifest-driven contract (`shardPath` + `hasExternalLeagueShard`). Next rollout: add `SHARD_OVERRIDES` + run `write-league-shard.js` per league (La Liga, Serie A, Bundesliga, Ligue 1) without Browse/LeagueProfile code changes.

---

### Phase 8C (2026-05-26) — Major league shard rollout (manifest-driven)

Target leagues shipped as shards: La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Brasileirão.

| League | Raw | Gzip |
|-------:|----:|-----:|
| Premier League | ~302 KB | **~39 KB** |
| MLS | ~539 KB | **~44 KB** |
| La Liga | ~198 KB | **~27 KB** |
| Bundesliga | ~196 KB | **~25 KB** |
| Serie A | ~120 KB | **~18 KB** |
| Ligue 1 | ~169 KB | **~22 KB** |
| Eredivisie | ~96 KB | **~13 KB** |
| Brasileirão | ~349 KB | **~28 KB** |

**Impact:** `/league/:leagueId` and `/browse` with a single-league filter now avoid `sample-data` for **8 leagues** (picks hidden while sharded-league-only to keep the monolith unloaded). Search / quiz / compare / player profiles still require `sample-data`.

---

### Phase 9 (2026-05-26) — Build-time Universal Search index

| Change | File(s) | Effect |
|--------|---------|--------|
| **`public/data/search-index.json`** | `scripts/write-search-index.js` | ~788 KB raw / **~68 KB gzip** (2331 players, 105 teams, 8 leagues, 33 NTs) |
| **`src/hooks/useSearchIndex.js`** | new | `fetch` + module-level cache; falls back to `null` on failure |
| **`UniversalSearch.jsx`** | rewritten | Fetches index; no static `sampleData`/`nationalTeamData` import |
| **`universalSearch.js`** | `getMembershipForPlayer` removed from static import | Injectable via `ctx.getMembership` |
| **`PlayerVisual.jsx`** | `teamName` prop override | Search results pass pre-baked `_teamName` — no sampleData lookup |
| **`npm run write:search-index`** | `package.json` | Regenerate after merge |

**Cold path for Universal Search:**

| Path | Before Phase 9 | Phase 9 |
|------|---------------|---------|
| Open search modal | Needs `sample-data` (static import) | Fetches **search-index ~68 KB gzip** |
| Navigate to result | `sample-data` already loaded | Loads `sample-data` only when navigating to a profile |
| Fallback (index fetch fails) | N/A | Lazy-imports `sampleData` + `nationalTeamData` |

**Scoring parity:** All existing aliases, accent-insensitive matching, player/team/league/NT results, intent boost (country/club), and keyboard navigation preserved. `getMembershipForPlayer` intent boost is bypassed on index path (no live membership map available without `nationalTeamData`) — nationality/nationalTeam fields on index entries still provide most of the country-intent boost.

---

### Phase 9B (2026-05-26) — Defer national team data on low-need routes

| Change | File(s) | Effect |
|--------|---------|--------|
| **PlayerProfile** | `src/components/PlayerProfile.jsx` | Lazy-import `nationalTeamData` only when player has a national-team label (keeps link behavior). |
| **Onboarding / Home feature cards** | `src/data/onboardingGuide.js` | Use `CONTENT_MANIFEST.liveNationalTeamIds` instead of importing `nationalTeamData` (prevents loading NT chunk just to show “X live”). |

**Impact:** Home below-fold and onboarding no longer pull the `nationalTeamData` chunk (~24 KB gzip). National team routes and quiz flows remain unchanged.

---

## 3. Deferred scaling work

| Item | Trigger | Approach |
|------|---------|----------|
| **Additional league shards** (long tail) | When player count growth resumes | `write-league-shard.js` + `SHARD_OVERRIDES` only |
| **Core shell module** | With shards | `getPlayerById` async cache |
| **Web Worker search** | Index + slow devices | Offload scan |
| **Dynamic `nationalTeamData`** | NT chunk pulled on every profile | `import()` on profile/NT routes only |
| **Virtualized browse** | Grid > 60 cards common | react-window |
| **Prefetch route chunks** | Post-launch polish | hover `import()` |
| **Service worker** | Offline phase | Out of scope |

---

## 10. Club expansion wave impact (planning)

See [CLUB_EXPANSION_PLAN.md](./CLUB_EXPANSION_PLAN.md).

If we complete the missing clubs in existing European leagues (PL, La Liga, Serie A, Ligue 1, Eredivisie), expect on the order of **~+1,100 players**.

**Impact summary:**

- **League shard routes** remain efficient (per-league JSON still far smaller than `sample-data`).
- **`sample-data` monolith** (gzip + parse) is the primary scaling risk for Quiz/Daily/Compare/Player profiles and unfiltered Browse until those consumers switch to sharded or indexed data.

**Premier League completion (Phase 5):** merged — +5 clubs, +138 players; PL shard now at full 20-club coverage.

**Serie A completion (Phase 6):** merged — 14 clubs; Serie A shard **122 KB → 303 KB raw**, **~18 KB → ~33 KB gzip** (6 → 20 clubs, 136 → 373 league players). Search index **~70 KB → ~69 KB gzip** (2,337 → 2,298 total players after expansion-cap re-trim). Browse `/league/serie-a` remains shard-backed.

## 4. When league sharding should happen

**Trigger any two of:**

1. `sample-data` gzip **> 250 KB** or parse **> 500 ms** on mid-tier mobile.  
2. Player count **> 3,500** in single merge.  
3. TTI **> 3.5 s** on 4G for `/browse` direct entry.  
4. **3+ full leagues** added in one editorial wave.

**Target layout:**

```
public/data/content-manifest.json   ← counts + shardPath per league
public/data/leagues/premier-league.json
public/data/leagues/mls.json
src/data/sampleData.js              ← MVP editorial + shared helpers only (shrunk)
```

**Hook contract:** `loadLeagueShard(leagueId)` in `leagueShard.js` — live for major leagues; extend via manifest only.

---

## 5. Remaining bottlenecks

| Bottleneck | Severity | Notes |
|------------|----------|-------|
| **`sample-data` monolith** | **Critical** | Still ~194 KB gzip; only deferred on home hubs |
| **Browse / Quiz / Daily** | **High** | Lazy routes — pay `sample-data` only when visiting those paths |
| **Eager `index` route graph** | **Fixed in Phase 7** | Was ~46 KB gzip on every page load |
| **Profile + NT** | Medium | `nationalTeamData` + `sampleData` together |
| **`worldCupHubData`** | Low | Imports `getPlayerById` for stars — loads data on `/world-cup` |
| **Compare player tab** | High | `PlayerCompare` scans registry |
| **Memory** | High at scale | No unload |

---

## 6. Build comparison

| Chunk | Phase 6 | Phase 7 (2026-05-26) |
|-------|---------|----------------------|
| `sample-data` | 1,546 KB / **199 KB** gzip | **Unchanged** |
| `index` | 168 KB / **46 KB** gzip (eager routes) | **53 KB / 14 KB** gzip |
| `content-manifest` | ~4 KB / **~2 KB** gzip | + `worldCupQuizConstants` |
| `nationalTeamData` | 227 KB / **24 KB** gzip | **Unchanged** |
| `worldCupQuizConfig` | 56 KB / **13 KB** gzip (via quiz) | **Deferred** — `worldCupQuizPools` 25 KB / **6.4 KB** on demand |
| `HomeBelowFold` | ~3 KB, no sample-data | **Unchanged** |

**Cold path `/` (gzip JS, approximate):**

| Path | Phase 6 | Phase 7 |
|------|---------|---------|
| Hero only | vendor 74 + index **46** ≈ **120 KB** | vendor 74 + index **14** ≈ **88 KB** |
| Hero + scroll hubs | + manifest ≈ **91 KB** | **~91 KB** (unchanged) |
| `/browse` direct | index 46 + Browse + sample-data ≈ **248 KB** | index 14 + Browse + sample-data ≈ **217 KB** |
| `/browse` PL-only | — | index 14 + Browse + shard **~39 KB** (no sample-data if user stays on PL) |
| `/browse` MLS-only | — | index 14 + Browse + shard **~44 KB** (no sample-data if user stays on MLS) |
| `/league/premier-league` | sample-data + LeagueProfile | shard **~39 KB** + LeagueProfile |
| `/league/mls` | sample-data + LeagueProfile | shard **~44 KB** + LeagueProfile |
| `/quiz` club only | + Quiz + sample-data + NT + config | index 14 + Quiz + quizSession + sample-data + NT ≈ **241 KB** (no 13 KB config) |
| `/national-teams` | NT + sample-data | **Unchanged** |

---

## 7. Measurement checklist

- [ ] Lighthouse mobile: `/` hero-only vs full scroll
- [ ] Network waterfall: confirm `sample-data` absent on home below-fold
- [ ] `performance.now()` around first `import('sampleData')` on Browse
- [ ] Memory snapshot after Browse + Quiz in one session
- [ ] Run `npm run write:content-manifest` after each merge

---

## 8. Related docs

- [PRODUCTION_LAUNCH_PLAN.md](./PRODUCTION_LAUNCH_PLAN.md)  
- [DATA_MERGE_PLAN.md](./DATA_MERGE_PLAN.md)  
- [WORLD_CUP_NATIONAL_TEAMS_PLAN.md](./WORLD_CUP_NATIONAL_TEAMS_PLAN.md)  
- [POST_BETA_ROADMAP.md](./POST_BETA_ROADMAP.md)  

---

*Phase 8B adds MLS as the second manifest-driven league shard. Phase 8C rolls out all major leagues. Phase 9 ships the build-time search index — Universal Search no longer pulls `sample-data` on open.*

---

## 9. Recommended next scaling step

1. **League shard rollout** — La Liga, Serie A, Bundesliga, Ligue 1 via `write-league-shard.js` + manifest `SHARD_OVERRIDES`.  
2. **Build-time search index** — prefix JSON for Universal Search (avoid full `players[]` scan).  
3. **Dynamic `nationalTeamData` on PlayerProfile** — optional `import()` after player resolves if live NT link needed (saves NT chunk on browse-only deep links).  
4. Do **not** combine `sample-data` and `national-team-data` in one `manualChunks` bucket.
