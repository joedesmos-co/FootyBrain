# Firebase readiness review (pre-Firebase architecture)

> **Planning only.** No Firebase SDK, Auth, Firestore, or app logic changes in this document.  
> **Authority:** [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) — Firebase is **gate #6** after men’s club breadth, MLS, Brasileirão, national teams, and World Cup mode.  
> **Companion:** [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) (public launch gates) · [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) · [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md)

**Review date:** 2026-05-24  
**App state:** Frontend-only React + Vite; ~2,331 players, 105 clubs, 8 leagues; wave-1 national teams in `nationalTeamLive.json`; user state in `localStorage` only.

---

## 1. Executive summary

| Dimension | Readiness | Notes |
|-----------|-----------|--------|
| **Content model** | **Good** | Stable IDs, single player registry, NT memberships separated from `teams[]` |
| **User state shape** | **Good** | Sanitized hooks, namespaced keys, swap-friendly I/O |
| **Account / cloud sync** | **Not started** | By design — pre-Firebase gates incomplete |
| **Content delivery at scale** | **Weak** | Monolithic `sampleData.js` (~1.9 MB source, ~190 KB gzip chunk) loaded entirely on visit |
| **Trust / anti-cheat** | **N/A locally** | XP and achievements are client-writable today |

**Overall readiness level:** **Architecture-ready for a later account layer, content-not-ready for Firebase-as-CMS at 5k+ players without a delivery split first.**

**Do not add Firebase until** PROJECT_BRIEF pre-Firebase phases 1–5 are met and this review’s migration phases are scheduled.

---

## 2. Audit by area

### 2.1 Data structure

| Layer | Location | Role | Scale notes |
|-------|----------|------|-------------|
| **Club registry** | `src/data/sampleData.js` | `leagues[]`, `teams[]`, `players[]` (single array) | O(1) lookups via `Map` (`playerById`, `teamById`, `playersByTeamId`) added for ~2k+ rows |
| **National teams** | `src/data/nationalTeamLive.json` + `nationalTeamData.js` | `nationalTeams[]`, `nationalMemberships[]` (join table) | Correct pattern: **no duplicate player rows** for NT; `membershipByPlayerId` enforces one live NT per player |
| **Collections** | `src/data/collectionsData.js` | Curated playlists referencing entity IDs | Version with app releases; not user-editable |
| **Learning paths** | `src/data/learningPathsData.js` | Ordered steps → collections / profiles / quiz URLs | Static editorial; no progress doc yet |
| **Achievements** | `src/data/achievements.js` | Static definitions; earned IDs in progression state | Rules computed client-side |
| **Quiz eligibility** | `quizEligibility.js` | Cached `quizEligiblePlayers` + indexes by `teamId` / `leagueId` | Editorial gate: `quizHints` + `quickFact` |

**Strengths**

- **One `players.id` per human** — validators and NT plan align; favorites, compare, quiz, and search share the same key space.
- **National team ≠ club team** — `/national-team/:id` vs `/team/:id`; `nationalTeamId` slugs match TM-style codes (`united-states`, not `GB1`).
- **Separation of concerns** — NT overlay JSON can ship/update independently of full club merge (pattern to repeat for WC `competitions` later).

**Risks at cloud scale**

- **Monolithic in-memory corpus** — Entire `players[]` parsed on load; no pagination, no per-league lazy fetch.
- **Editorial + generated rows mixed** — `quizEligible`, `dataStatus`, `rosterTier` must stay consistent across merges; Firestore without a strong schema will amplify bad joins.
- **ID renames** — Changing `player.id` breaks favorites, collection items, memberships, and local progress keys; migrations required.
- **Content updates** — Today redeploy static app to change data; Firebase CMS needs versioned releases and cache busting.

**Recommendation:** Keep **canonical football data read-only in cloud** (Firestore or CDN JSON). Keep **heavy merge/build in CI**, not in the client.

---

### 2.2 localStorage usage

| Key | Hook / area | Payload shape | PII | Cross-tab sync |
|-----|-------------|---------------|-----|----------------|
| `footybrain:progression` | `useProgression` | XP, totals, achievement IDs, quiz milestone arrays, XP award dedupe keys | None | `CustomEvent` + `storage` |
| `footybrain:collections-progress` | `useCollectionProgress` | `viewed[]`, `learned[]`, `completedCollections[]` (string keys `collectionId:index`) | None | Same pattern |
| `footybrain:favorites` | `useFavorites` | `{ players: id[], teams: id[] }` | None | Same pattern |
| `footybrain:preferences` | `usePreferences` | Leagues, clubs, knowledge level, goals, `completed` flag | None | Same pattern |
| `footybrain:daily` | `useDailyChallenge` | Date, completion, score, streak, `questionResults[]` | None | Persist only; weaker cross-hook sync |
| `footybrain:personalize-cta-dismissed` | `Home` | `'1'` flag | None | N/A |

**Strengths**

- Namespaced keys, JSON serialize, **sanitize on read** (progression, preferences, collections).
- Hooks already document **Firebase swap at I/O boundary** (`useProgression`, `useDailyChallenge`).
- In-memory fallback when `localStorage` throws — UI stays usable.

**Risks**

- **No `uid` partition** — All state is per-browser; clearing site data wipes progress (acceptable pre-account; document in privacy copy — see PUBLIC_READINESS_CHECKLIST).
- **Unbounded arrays** — `collectionItemXpAwarded`, `comparePairXpAwarded`, `viewed`/`learned` grow with usage; could approach **5 MB** `localStorage` limits on heavy users.
- **Trust** — Users can edit `footybrain:progression` in DevTools; achievements and XP are not server-verified.
- **Daily state** — `readStorage` merges with `{ ...EMPTY, ...JSON.parse(raw) }` (less strict sanitize than progression).
- **No multi-device merge** — Last write wins only after Firebase; conflict resolution undefined.

**Account-ready:** Yes — shapes map 1:1 to per-user documents (see §5).

---

### 2.3 Progression systems

**Location:** `useProgression.js`, `progressionLevel.js`, `progressionAchievements.js`, `achievements.js`

| Concern | Current behavior |
|---------|------------------|
| XP / level | Derived from `xp`; level curve in `calculateLevel` |
| Quiz answers | `recordAnswer` — aggregates `totalAnswered`, `totalCorrect`, `bestStreak`; optional session milestone at 5 questions |
| Compare | `recordCompare` — pair dedupe keys |
| Collections | XP hooks called from `useCollectionProgress` |
| Achievements | Recomputed on commit from static rules |

**Not persisted:** Per-question quiz log, session IDs, timestamps, or filter context (league/club/NT) beyond milestone counters (`completedTeamQuizzes`, `completedLeagueQuizzes`).

**Account-ready:** Aggregate stats and achievement ID lists sync cleanly.

**Cloud scale / integrity:** Leaderboards or “verified” achievements need **server-side event log** or Cloud Functions — out of scope for minimal v1 Firebase.

---

### 2.4 Collections

**Location:** `collectionsData.js`, `useCollectionProgress`, `CollectionDetailPage`, `collections.js` resolvers

| Concern | Current behavior |
|---------|------------------|
| Content | Static arrays of `{ type, id, note }` + optional `quizLaunch` |
| Progress | Per-item `collectionId:index` viewed/learned; collection complete flag |
| XP | Tied to progression dedupe keys |

**Account-ready:** Progress document mirrors `footybrain:collections-progress` exactly.

**Cloud scale:** Collection **definitions** should remain **global read-only** (or versioned manifest). User progress is **per-uid** only.

---

### 2.5 Quiz tracking

| Surface | What is tracked | Storage |
|---------|-----------------|--------|
| **Quiz Mode** | Running session in React state; aggregates via `recordAnswer` | Progression localStorage only |
| **Daily Challenge** | Today’s completion, score, streak, per-question booleans | `footybrain:daily` |
| **Quiz pool build** | `buildQuizPlayerPool` + cached eligible indexes | Ephemeral (recomputed) |

**TODO in code:** `QuizMode.jsx` — future `users/{uid}/quizSessions` for history (not implemented).

**Account-ready:** Milestone counters and daily blob; **not** full session replay.

**Cloud scale:** Storing every answer for all users → **subcollection** `quizSessions/{sessionId}` with TTL or aggregation jobs; do not mirror full history into a single Firestore doc.

---

### 2.6 National-team support

**Location:** `nationalTeamLive.json`, `nationalTeamData.js`, routes `/national-teams`, `/national-team/:id`

| Concern | Assessment |
|---------|------------|
| Data model | **Ready** — `nationalMemberships` join `playerId` ↔ `nationalTeamId`; maps at load |
| Quiz filter | `?nationalTeam=` + `isPlayerLinkedToLiveNationalTeam` |
| Search | `national-team` entity type in universal search |
| Duplicates | Membership enforces one NT link per player in wave 1 |

**Firebase:** NT entities fit `nationalTeams/{id}` public read; memberships `nationalMemberships/{playerId}` or composite index on `nationalTeamId`.

**Stay client-side:** Squad list rendering from joined local data is fine until roster sizes force pagination.

---

### 2.7 Search architecture

**Location:** `universalSearch.js`, `playerSearch.js`, `searchAliases.js`, `UniversalSearch.jsx`

| Aspect | Current |
|--------|---------|
| Player scan | Linear over full `players[]` (min 2 chars); debounced 200 ms; buffer cap 48 before top-6 |
| Indexes | `Map` lookups for names; quiz eligible by team/league; **no inverted text index** |
| Groups | Players, clubs, leagues, national teams — capped per type |

**Account-ready:** N/A (no user data in search).

**Cloud scale breaks:** 5k–10k+ players on main thread without **worker**, **prefix index**, or **server search** (Algolia / Firestore extension / Typesense).

**Stay client-side (for medium scale):** Prebuilt trigram/prefix index JSON shipped with each data release (~hundreds of KB) — still static hosting, not Firebase.

---

### 2.8 Route & bundle performance (related)

| Area | Finding |
|------|---------|
| Vite chunks | `sample-data` separate chunk (~1.53 MB raw bundle warning) |
| Routes | SPA; no data fetching per route — fast navigation, slow **first load** |
| Images | Placeholder-first; lazy `loading` on photos/crests |
| Squad lists | `content-visibility` on `TeamSquadView` rows |

**Firebase irrelevant until content is fetched from network;** first Firebase win is **smaller initial JS** + **cached content manifest**, not Auth.

---

## 3. What is already account-ready

These can migrate to `users/{uid}/…` with **minimal schema change**:

1. **Stable entity IDs** — `player`, `team`, `league`, `nationalTeam`, `collection` IDs are already strings suitable as Firestore references (not DocumentReferences required).
2. **Hook boundaries** — `readStorage` / `persist` / `sanitize` in progression, preferences, collections, favorites, daily.
3. **CustomEvent + `storage` listeners** — Pattern extends to Firestore `onSnapshot` per uid.
4. **Preferences** — `favoriteLeagueIds`, `favoriteClubIds`, `knowledgeLevel`, `learningGoals` — pure user profile.
5. **Favorites** — Simple ID arrays.
6. **Collection progress** — Opaque string keys; no index collision across users when partitioned by uid.
7. **Progression aggregates** — Counters and achievement ID arrays (with server recompute later).
8. **Daily challenge state** — Date-keyed completion and streak fields.
9. **National memberships** — Content join table, not user data; ready for public read collection.
10. **Learning paths & collections** — Editorial catalogs; same as achievements definitions.

---

## 4. What would break at cloud scale

| Bottleneck | Why it breaks | First symptom |
|------------|---------------|---------------|
| **Full `sampleData` download** | 3k–10k players × rich objects | Long TTI on mobile, memory pressure |
| **Client-only search** | O(n) scan per query | Jank on low-end phones |
| **Firestore as live CMS for all players** | Document count, query cost, rule complexity | Bill shock, slow browse |
| **Single doc per user progression** | Array fields grow without bound | 1 MiB doc limit, slow reads |
| **Writable client progression** | No server validation | Trivial XP/achievement fraud |
| **ID churn without migration** | localStorage keys use raw ids | Broken favorites/progress after data fix |
| **NT / WC duplication in content** | Second player registry | Split brains for quiz and saves |
| **Quiz session history in one doc** | Firestore document size | Write failures |

---

## 5. What should stay client-side (even after Firebase)

| Capability | Rationale |
|------------|-----------|
| **Quiz question picking** (random from eligible pool) | Deterministic/seeded pools can stay client; server only needed for anti-cheat leaderboards |
| **Hint rendering & difficulty rules** | Presentation of public editorial content |
| **Compare layout** | Two public profiles; no server state except optional “compare count” |
| **Search UI & grouping** | Can use client index built from downloaded manifest |
| **Image placeholders & themes** | `visualTheme`, badge fallbacks — no network required |
| **Route components** | SPA shell stays static |
| **Offline browse of cached manifest** | PWA / service worker over versioned JSON, whether from CDN or Firestore export |

**Move to cloud / CDN:** Player registry, teams, leagues, NT entities, memberships, collections manifest, achievements list, licensed image URLs (metadata only).

---

## 6. Recommendations

### 6.1 Minimal Firebase schema (Firestore)

Use **uid-scoped private writes** and **global read-only content**. Prefer **small documents** over one giant user blob.

```
# Public read (or CDN mirror — Firestore optional for editorial workflow)
contentMeta/{releaseId}          # dataAsOf, schemaVersion, playerCount
leagues/{leagueId}
teams/{teamId}
players/{playerId}                 # large collection — consider CDN JSON instead
nationalTeams/{nationalTeamId}
nationalMemberships/{membershipId} # playerId + nationalTeamId composite
collections/{collectionId}
learningPaths/{pathId}
achievements/{achievementId}       # static definitions only

# Private per user (Firebase Auth uid)
users/{uid}
  profile: {
    favoriteLeagueIds: string[]
    favoriteClubIds: string[]
    knowledgeLevel: string | null
    learningGoals: string[]
    onboardingCompleted: boolean
    updatedAt: timestamp
  }
  progression: {
    xp: number
    totalAnswered: number
    totalCorrect: number
    bestStreak: number
    quizSessionsCompleted: number
    compareCount: number
    collectionsCompleted: number
    completedTeamQuizzes: string[]
    completedLeagueQuizzes: string[]
    earnedAchievements: string[]
    # Dedupe arrays — cap or hash if growth is a concern
    collectionItemXpAwarded: string[]
    collectionCompleteXpAwarded: string[]
    comparePairXpAwarded: string[]
    updatedAt: timestamp
  }
  favorites: {
    players: string[]
    teams: string[]
    updatedAt: timestamp
  }
  collectionsProgress: {
    viewed: string[]
    learned: string[]
    completedCollections: string[]
    updatedAt: timestamp
  }
  daily: {
    lastCompletedDate: string      # YYYY-MM-DD
    dailyStreak: number
    # Optional: store only last N days inline, or subcollection:
  }

# Optional subcollections (when session history is needed)
users/{uid}/dailyDays/{dateKey}     # completed, score, questionResults[]
users/{uid}/quizSessions/{sessionId}  # filters, correct, total, startedAt
```

**Security rules (sketch):**

- `content/*`: `read: if true`; `write: if false` (admin SDK / CI only).
- `users/{uid}/**`: `read, write: if request.auth.uid == uid`.

**Alternative (recommended for player bulk):** Firestore for **user data only**; ship `players.json` + indexes via **Firebase Hosting / CDN** versioned by `contentMeta.schemaVersion` — avoids million-read browse patterns.

---

### 6.2 Future auth approach

| Phase | Approach |
|-------|----------|
| **v1** | **Firebase Authentication** — Email link or Google sign-in (low friction for learning app) |
| **Optional** | **Anonymous auth** → link to permanent account on upgrade (preserves pre-login experiment; merge carefully with localStorage) |
| **Defer** | Custom OAuth, phone SMS, Apple until needed |

**No auth in public v1** per PROJECT_BRIEF; auth is for **sync**, not gating browse.

**Profile fields:** Display name optional; **no** requirement for real name. Store only FootyBrain preferences and progress under uid.

---

### 6.3 Sync strategy

```
┌─────────────┐     first login      ┌──────────────────┐
│ localStorage│ ──────────────────► │ Firestore (uid)  │
│ (device)    │     merge + migrate  │ source of truth  │
└─────────────┘                      └────────┬─────────┘
       ▲                                    │
       │         onSnapshot / pull          │
       └────────────────────────────────────┘
```

1. **On login:** Read local keys → **merge** into Firestore (max XP, union achievement sets, union favorites, latest streak if date newer).
2. **After login:** Firestore **source of truth**; mirror to localStorage for offline read cache optional.
3. **Conflict policy:** `updatedAt` last-write-wins per document; subcollections use `dateKey` / `sessionId` idempotency.
4. **Migration version:** `footybrain:syncVersion` in localStorage to avoid double-merge.
5. **Content sync:** Independent pipeline — app checks `contentMeta.schemaVersion` on startup; fetch new JSON if stale (no uid).

**Hook change:** Replace `readStorage`/`persist` implementations with `getDoc`/`setDoc` + `onSnapshot`; keep `sanitize()` and public hook API.

---

### 6.4 Offline support

| Layer | Strategy |
|-------|----------|
| **Football data** | Versioned manifest in Cache API / service worker; ship with app or download on Wi‑Fi |
| **User progress** | Firestore **offline persistence** (enable before first query); queue writes when offline |
| **Quiz / Daily** | Allow play offline against **cached eligible pool**; queue progression writes (with conflict merge on reconnect) |
| **Search** | Offline = client index from cached manifest only |
| **Images** | Cache licensed assets in SW; placeholders offline |

**PWA** is optional; minimum viable offline = **localStorage + cached content chunk** (today) → later **Firestore offline + CDN manifest**.

---

## 7. Safest future migration path (phased)

Do **not** big-bang Firebase. Order:

| Phase | Goal | Risk |
|-------|------|------|
| **0** | Complete PROJECT_BRIEF gates 1–5 (content breadth, WC mode decision) | Low |
| **1** | **Content delivery split** — CDN/hosted JSON per league or release manifest; keep hook `getPlayerById` API | Medium — one merge pipeline |
| **2** | **Search index artifact** in build (prefix JSON) — reduce O(n) scans | Low |
| **3** | Firebase project + **Auth only**; anonymous optional; no user data move yet | Low |
| **4** | **Firestore user docs** — favorites + preferences first (smallest, highest user value) | Low |
| **5** | Progression + collections + daily migration + login merge utility | Medium — test merge |
| **6** | Security rules, privacy policy update, export/delete account | Required for public |
| **7** | Optional quiz session subcollection + server achievement validation | Higher scope |

**Parallel track:** National teams and WC `competitions` remain **overlay JSON** merged in CI until a CMS is justified.

---

## 8. Biggest blockers (before Firebase is worth it)

1. **Pre-Firebase content gates incomplete** (MLS/Brasileirão breadth, NT wave 2+, World Cup mode product decision) — Firebase does not fix thin learning value.
2. **Monolithic client data bundle** — Syncing users while shipping 2 MB JSON defeats mobile performance goals.
3. **No content versioning contract** — `schemaVersion`, `dataAsOf`, migration scripts for ID changes must exist before cloud CMS.
4. **Progression integrity undefined** — Product decision: casual local trust vs server-verified XP.
5. **Privacy / legal** — Account flow requires updated policy, deletion path, and data export story ([PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) § Privacy).

---

## 9. Readiness checklist (Firebase gate — future)

Copy into release planning when approaching gate #6:

- [ ] Content served from versioned manifest (not only inlined `sampleData` monolith)
- [ ] `users/{uid}` schema reviewed; document size limits addressed
- [ ] Auth provider chosen; anonymous → permanent linking spec written
- [ ] localStorage → Firestore merge tested (XP, achievements, favorites, collections, daily)
- [ ] Firestore rules tested (no cross-user reads/writes)
- [ ] Offline behavior defined (Firestore persistence + cached manifest)
- [ ] Quiz session history scope decided (aggregate only vs subcollection)
- [ ] Privacy policy covers accounts, deletion, export
- [ ] Cost model for Firestore reads + Hosting CDN acceptable

---

## 10. Cross-links

| Document | Use |
|----------|-----|
| [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) | When Firebase is allowed |
| [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) | Public launch without accounts |
| [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) | NT data + membership rules |
| [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) | Future `competitions` entities |
| [FOOTBALL_HISTORY_PLAN.md](./FOOTBALL_HISTORY_PLAN.md) | Editorial history — stay CDN/static |
| [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) | Image hosting — CDN, not Firestore blobs |

---

*This review is the final pre-Firebase architecture snapshot for the current codebase. Revisit when player count exceeds ~3,500 or gate #5 (World Cup mode) ships.*
