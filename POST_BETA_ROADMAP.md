# FootyBrain Post-Beta Roadmap

> **Purpose:** Plan work **after public beta** and **before full production launch** (accounts optional, no live scores API).  
> **Authority:** [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) — Firebase is gate **#6**, after content gates 1–5.  
> **Planning only:** No Firebase SDK, no Auth UI, no backend deploy in this document.  
> **Inputs:** [BETA_READINESS_REVIEW.md](./BETA_READINESS_REVIEW.md) · [FIREBASE_READINESS_REVIEW.md](./FIREBASE_READINESS_REVIEW.md) · [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md)

**Last updated:** 2026-05-25

---

## 1. Executive summary

Public beta proves **learning UX** and **editorial quality** on a static app. Full production launch means **balanced content**, **trust/compliance**, **performance at scale**, and optionally **signed-in sync**—not a rewrite.

| Milestone | Goal | Firebase? |
|-----------|------|-----------|
| **β exit** | Brief gates 1–5 substantially met; privacy + `dataAsOf`; Americas quiz depth credible | No |
| **Production v1** | Open launch, stable hosting, versioned content, checklist green | Optional guest-only |
| **Accounts era** | Cross-device saves, streak integrity, optional leaderboards | Yes (Auth + Firestore) |
| **Growth** | Social, verified competition, AI-assisted learning | After v1 retention proof |

**Safest sequence:** Finish **content + bundle split** → ship **production v1 without accounts** → add **Auth + cloud saves** when users ask for multi-device → add **leaderboards/social** only with server-trusted events → treat **AI** as optional editorial accelerator, not core runtime.

---

## 2. Timeline (phases)

```
Public β ──► β exit (content) ──► Production v1 (static+) ──► Accounts v1 ──► Social / competitive ──► AI assist (optional)
   │              │                      │                      │                    │
   │              │                      │                      │                    └─ Cloud Functions + review
   │              │                      │                      └─ Firestore user docs, streak sync
   │              │                      └─ CDN manifest, privacy, WC hub shell
   │              └─ MLS/BR/NT editorial, lazy data, checklist
   └─ Limited scope, localStorage only
```

### Phase A — Beta exit (post–public β, pre-production)

**Duration:** Weeks–months depending on editorial bandwidth  
**Outcome:** [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) “Must be true” largely complete.

| Workstream | Deliverables |
|------------|--------------|
| **Content** | MLS + Brasileirão quiz waves; NT wave 2 (Germany, USA); World Cup hub shell + honest copy; stale MVP roster fixes |
| **Trust** | Privacy / localStorage page; `dataAsOf` on Browse; beta banner removed or softened at production |
| **Performance** | League-sharded or lazy-loaded player manifest; build-time search index artifact |
| **Product** | Today’s Picks on Home; fan-path step progress (local); quiz session polish (no repeat, summary) |

**Firebase:** None. **UI:** Targeted only (banner, footer, picks)—no accounts screen.

---

### Phase B — Production v1 (full launch, still frontend-first)

**Outcome:** FootyBrain marketed as a **complete men’s learning product** for agreed leagues/nations—not “beta.”

| Workstream | Deliverables |
|------------|--------------|
| **Hosting** | HTTPS static deploy; cache headers on versioned JSON; error monitoring (e.g. Sentry) without PII |
| **Content pipeline** | `contentMeta.schemaVersion`, `dataAsOf`, release notes; CI validators on every merge |
| **Images** | Licensed batch for top quiz faces ([PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md)) |
| **World Cup** | `/world-cup` read-only hub; collections + nation quizzes; no fixture API |
| **Accessibility** | WCAG spot-check; keyboard paths on quiz/search |

**Accounts:** Still optional. Browse, quiz, daily, collections work **without sign-in**.  
**localStorage:** Remains source of truth for XP, favorites, daily streak, collection progress.

---

### Phase C — Accounts v1 (Firebase gate #6 — first cloud slice)

**Precondition:** Phase A content gates met; Phase B bundle/manifest split live.

| Capability | Scope |
|------------|--------|
| **Firebase Authentication** | Google + email link (Apple deferred); optional anonymous → link |
| **Cloud saves** | Favorites, preferences, progression aggregates, collections progress, daily streak |
| **Streak syncing** | `dailyStreak` + `lastCompletedDate` under `users/{uid}/daily` |
| **Migration** | One-time merge from `footybrain:*` keys on first login |

**Not in Accounts v1:** Global leaderboards, friends, feeds, AI chat, live scores.

---

### Phase D — Competitive & social (post-retention proof)

Requires **server-trusted** quiz/daily events if XP or ranks are public.

| Feature | Dependency |
|---------|------------|
| **Leaderboards** | Cloud Functions or trusted writes; daily/quiz event log |
| **Friends / challenges** | Social graph, moderation, reporting |
| **Share cards** | Static OG images; no scraped photos |

**Defer** until DAU and abuse model are understood.

---

### Phase E — AI-assisted learning (optional, later)

| Use case | Model | Where it runs |
|----------|--------|----------------|
| Editorial draft hints / quick facts | Human-reviewed batch | **CI script**, not user-facing API |
| “Explain this player” on profile | On-demand | **Server** (rate-limited, logged, no PII) |
| Personalized study plan | Weekly batch | **Server** or email digest—not in hot path |

**Principle:** AI **assists editors and power users**; quiz answers and Importance Scores stay **curated**, not generated at runtime for v1.

---

## 3. Feature plans (post-beta)

### 3.1 Firebase / accounts

**When:** After PROJECT_BRIEF gates 1–5 and [BETA_READINESS_REVIEW.md](./BETA_READINESS_REVIEW.md) public-beta blockers cleared.

| Decision | Recommendation |
|----------|----------------|
| Provider | Firebase Auth: Google + email magic link |
| Anonymous | Optional for “try before sign-up”; merge into permanent account with explicit UX |
| Gating | **Never** gate browse; sign-in CTA for “Save progress across devices” |
| Admin | Firebase Admin SDK in CI only for content—not in client |

**Implementation surface (future):** Swap I/O in `useProgression`, `useDailyChallenge`, `useFavorites`, `useCollectionProgress`, `usePreferences`—keep hook APIs stable (see TODOs in those files).

---

### 3.2 Cloud saves

**Move to Firestore (per uid, private write):**

| Domain | Today (`localStorage`) | Firestore path (sketch) |
|--------|------------------------|-------------------------|
| Progression | `footybrain:progression` | `users/{uid}/progression` |
| Daily | `footybrain:daily` | `users/{uid}/daily` + optional `dailyDays/{dateKey}` |
| Favorites | `footybrain:favorites` | `users/{uid}/favorites` |
| Collections | `footybrain:collections-progress` | `users/{uid}/collectionsProgress` |
| Preferences | `footybrain:preferences` | `users/{uid}/profile` |

**Merge on first login:** Max XP, union achievements/favorites, latest streak if date ≥ server, union collection viewed/learned keys. Set `footybrain:syncVersion` to prevent double-merge.

**Offline:** Enable Firestore persistence after Auth; queue writes; reconcile on reconnect.

---

### 3.3 Streak syncing

| Field | Sync rule |
|-------|-----------|
| `dailyStreak` | Server max of (local, remote) only if `lastCompletedDate` chain is valid |
| `lastCompletedDate` | ISO date; reject future dates; optional server “today” in UTC for anti-cheat |
| `questionResults` | Optional subcollection per day; not required for v1 sync |

**Stay local until Accounts v1:** Device streak is fine for beta; document that clearing data resets streak.

**Production with accounts:** Streak is **high-value sync**—implement before global leaderboards.

---

### 3.4 Leaderboards

| Type | Phase | Architecture |
|------|-------|----------------|
| **Personal bests** | B (local) | `bestStreak`, XP level—already in progression |
| **Friends leaderboard** | D | `users/{uid}/friends` + weekly score doc; invite links |
| **Global daily** | D+ | Cloud Function aggregates `dailyDays` submissions; cap writes; timezone = UTC date |
| **Club / league boards** | D+ | Scoped queries; heavy read cost—cache aggregates |

**Blocker:** Client-writable XP is trivially fake. Leaderboards need **server-validated** completion events or **hash of seeded daily** + submission window.

**Recommendation:** Ship **no global leaderboard** in Production v1. Add **“Your week in review”** local summary first.

---

### 3.5 Social features

| Feature | Priority | Notes |
|---------|----------|-------|
| Share profile / quiz score (image link) | C+ | Static OG; no user-generated content |
| Follow favorite club (notify on editorial) | D | Requires push or email—defer |
| Friends list | D | Moderation, COPPA if minors—men’s app still needs safe UX |
| Comments / forums | **Defer** | Out of scope for learning DB |
| Multiplayer quiz | **Defer** | Real-time infra; not core |

**Lightweight social for production v1:** Copy link to player/team/collection; optional **Web Share API** on completion screens—no backend.

---

### 3.6 AI-assisted learning (later)

| Tier | What | Risk control |
|------|------|--------------|
| **0 (now)** | None in app | — |
| **1** | Offline editorial assistant in merge scripts | Human approves every `quizHints` / `quickFact` |
| **2** | “Ask about this player” on profile | Server proxy; rate limit; log prompts; disclaimer |
| **3** | Adaptive quiz difficulty | Needs item response model + privacy review |

**Do not:** Replace Importance Score with model ratings; scrape TM with AI; auto-approve quiz eligibility.

---

## 4. What stays local vs server vs lightweight

### 4.1 Stay client-side (even after Firebase)

| Capability | Rationale |
|------------|-----------|
| Quiz question pick (random / seeded pool) | Public editorial data; deterministic daily already client-side |
| Hint rendering, difficulty rules, variant clues | Presentation only |
| Compare UI | Two public profiles |
| Search UI + grouping | Over downloaded index |
| Placeholders / `visualTheme` / badge fallbacks | Offline-friendly |
| Route shell, collection rendering | Static SPA |
| Cached manifest browse | PWA / SW optional |

### 4.2 Move server-side (or CDN + CI)

| Capability | Rationale |
|------------|-----------|
| Player / team / league registry bulk | Size, update cadence, version pinning |
| National teams + memberships | Same as club overlay JSON today |
| Collections + learning path definitions | Editorial catalog; versioned releases |
| Achievement definitions | Static catalog; earned IDs per user in Firestore |
| Licensed `imageUrl` metadata | CDN paths; no secrets in client |
| **User-specific** favorites, XP, streaks, progress | Firestore private docs |
| Leaderboard aggregates | Cloud Functions / scheduled jobs |
| AI inference (if any) | Keys, rate limits, logging |

### 4.3 Remain lightweight (do not over-build)

| Area | Keep thin |
|------|-----------|
| Auth | One provider stack; no custom JWT server |
| Content CMS | CI merge + JSON releases before full Firestore CMS |
| Quiz history | Aggregates in `progression` doc unless analytics require subcollections |
| Social | Share links only until retention justifies friends |
| Notifications | Email digest optional; no FCM until mobile app exists |
| Live data | No fixtures/scores API in roadmap |
| Women’s / multi-sport | Out of scope per brief |

---

## 5. Safest production roadmap (ordered)

| Step | Action | Risk |
|------|--------|------|
| **1** | Close beta content gaps (MLS/BR/NT, WC hub shell, privacy, `dataAsOf`) | Low |
| **2** | Split content delivery (CDN manifest + `schemaVersion`; lazy league import) | Medium — one pipeline |
| **3** | Build-time search index JSON | Low |
| **4** | Production v1 launch **without** accounts | Low |
| **5** | Monitor: TTI, error rate, editorial backlog burn-down | — |
| **6** | Firebase project + Auth + rules (staging) | Low |
| **7** | Migrate favorites + preferences first | Low |
| **8** | Migrate progression + daily + collections + merge utility | Medium |
| **9** | Privacy update: account, export, delete | Required |
| **10** | Leaderboards (if metrics justify) + server validation | High |
| **11** | Social graph (if justified) | High |
| **12** | AI tier 1 in CI only | Medium (quality) |

**Parallel tracks (do not block step 4):** Editorial waves, licensed images, roster freshness ([ROSTER_FRESHNESS_PLAN.md](./ROSTER_FRESHNESS_PLAN.md)).

---

## 6. Biggest scaling concerns (production → growth)

| Concern | Symptom | Mitigation (pre-Firebase → post) |
|---------|---------|----------------------------------|
| **Monolithic player bundle** | Slow first load on 4G | Phase B: shard by league / lazy `import()` |
| **O(n) search** | Jank at 5k+ players | Phase B: prefix index artifact; worker optional |
| **Firestore as player CMS** | Bill shock, slow browse | **CDN JSON** for registry; Firestore for users only |
| **Single progression doc growth** | 1 MiB limit, slow reads | Cap dedupe arrays; subcollections for history |
| **Client-writable XP** | Fraudulent leaderboards | Server events before competitive features |
| **Player ID churn** | Broken favorites/progress | `schemaVersion` migrations + changelog |
| **NT/WC duplicate registries** | Split quiz/save keys | Keep join tables; never second `players[]` |
| **Image bandwidth** | Large LCP | WebP, lazy load, SW cache for licensed set |
| **Editorial throughput** | 1,963 browse-only rows | Batch scripts + human review; AI tier 1 assists drafts only |

---

## 7. Post-beta priorities (ranked)

### P0 — Required for production v1 (no Firebase)

1. Complete PROJECT_BRIEF **gates 1–5** to agreed “substantially complete” bar.  
2. Privacy + local data disclosure; remove misleading WC “full mode” copy.  
3. Content delivery split + `dataAsOf` / `schemaVersion`.  
4. [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) sign-off.

### P1 — Production quality (still no Firebase)

5. MLS/Brasileirão quiz depth to daily-themed thresholds.  
6. NT wave 2 + expanded memberships.  
7. Licensed images for flagship quiz players.  
8. Search index + mobile perf budget (<500 KB initial JS excl. lazy data).

### P2 — Accounts era (Firebase, smallest slice)

9. Auth + Firestore favorites/preferences/progression/daily merge.  
10. Streak sync + updated privacy (export/delete).  
11. Firestore offline persistence policy documented.

### P3 — Growth (only with metrics)

12. Server-validated daily submissions → weekly leaderboard.  
13. Lightweight share + optional friends.  
14. AI editorial assistant in CI (human-in-loop).

---

## 8. Explicit non-goals (before full production + through Accounts v1)

- Firebase implementation in repo until Phase C preconditions met  
- Live scores, fixtures, or bracket engines  
- Women’s soccer coverage  
- EA/FIFA-style ratings or scraped headshots  
- Global chat, forums, or UGC without moderation  
- Real-time multiplayer quiz  
- AI-generated quiz answers in production without editorial sign-off  
- Custom auth server (use Firebase Auth)

---

## 9. Success metrics (suggested)

| Phase | Signals |
|-------|---------|
| **β exit** | ≥50% clubs at 5+ quiz-ready; MLS/BR not majority 0-quiz; validator green; mobile smoke pass |
| **Production v1** | Retention D1/D7 on daily + quiz; <3s TTI p75 on mid-tier Android; support burden low |
| **Accounts v1** | ≥20% returning users link account; merge conflicts <1% support tickets |
| **Leaderboards** | Abuse rate bounded; Cloud Function cost predictable |

---

## 10. Document map

| Question | Read |
|----------|------|
| Ready for beta? | [BETA_READINESS_REVIEW.md](./BETA_READINESS_REVIEW.md) |
| Firestore schema & sync sketch | [FIREBASE_READINESS_REVIEW.md](./FIREBASE_READINESS_REVIEW.md) |
| Launch gates checklist | [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) |
| WC product scope | [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) |
| Brief authority | [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) |

---

*This roadmap is planning-only. Implementation tickets should reference phase IDs (A–E) and must not add Firebase until Phase C preconditions are explicitly approved.*
