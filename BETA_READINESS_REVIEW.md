# FootyBrain Beta Readiness Review

> **Purpose:** Decide whether FootyBrain is ready for a **public beta** before Firebase, accounts, or live APIs.  
> **Authority:** [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) pre-Firebase roadmap (gates 1–5 before gate 6).  
> **Review date:** 2026-05-25  
> **App state audited:** Frontend-only React + Vite; **2,331** players, **105** clubs, **8** leagues; **368** quiz-eligible; wave-1 national teams (5); MLS + Brasileirão browse live; progression in `localStorage`.  
> **No app code changed** for this review.

**Companion docs:** [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) · [FIREBASE_READINESS_REVIEW.md](./FIREBASE_READINESS_REVIEW.md) · [EDITORIAL_BACKLOG.md](./EDITORIAL_BACKLOG.md) · [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md)

---

## Executive summary

| Verdict | Recommendation |
|---------|----------------|
| **Public beta (open marketing)** | **Not ready** — content and trust gaps outweigh product polish. |
| **Closed / friends-and-family beta** | **Conditional go** — ship only with explicit “beta” scope, snapshot-date copy, and no World Cup “full mode” promises. |
| **Firebase / accounts** | **Correctly deferred** — architecture is swap-friendly; content breadth is the gate, not Auth. |

### Readiness level

**Overall: 🟡 Conditional beta (internal/limited) — 🔴 Not ready for broad public beta**

The app is a credible **learning prototype** for European top-flight fans and editorial-heavy clubs. It is **not** yet a balanced men’s football product across MLS, Brasileirão, or World Cup narratives promised in the brief.

---

## Audit by area

### 1. Data coverage

| Metric | Value | Assessment |
|--------|------:|------------|
| Players | 2,331 | Strong registry scale for browse |
| Clubs | 105 | 8 leagues represented |
| Quiz-eligible | 368 (15.8%) | Editorial gate working; browse-only majority intentional |
| Browse-only | 1,963 | Expected until editorial catches up |
| Clubs ≥5 quiz-ready (“fully healthy”) | 55 / 105 | **52%** of clubs below editorial target |
| Licensed `imageUrl` | **0** | Placeholders only (policy-compliant) |

**League quiz depth (quiz-eligible / squad size)**

| League | Clubs | Squad players | Quiz-ready |
|--------|------:|-------------:|-----------:|
| Premier League | 15 | 341 | 92 |
| La Liga | 10 | 225 | 67 |
| Bundesliga | 10 | 222 | 57 |
| Ligue 1 | 9 | 197 | 50 |
| Eredivisie | 5 | 110 | 27 |
| Serie A | 6 | 136 | 35 |
| **MLS** | 30 | 660 | **20** |
| **Brasileirão** | 20 | 440 | **20** |

**PROJECT_BRIEF pre-Firebase gates**

| Gate | Status | Notes |
|------|--------|-------|
| 1. Major men’s club leagues | **Partial** | Top-5 EU leagues strong; Serie A thin (6 clubs); many mid-table sides browse-only |
| 2. MLS | **Partial** | Full browse (30 clubs × ~22); **25 clubs at 0** quiz-ready; 4–5 stars on a handful only |
| 3. Brasileirão | **Partial** | Full browse (20 clubs); **15 clubs at 0** quiz; big-five at **4** quiz each (below daily club-theme threshold of 5) |
| 4. Major national teams | **Partial** | **5 live** nations (England, France, Spain, Brazil, Argentina); Germany / USA not live |
| 5. World Cup mode | **Prep only** | Collections, learning paths, international Today’s Picks — **no** `/world-cup` hub or competition squads |
| 6. Firebase | **Deferred** | Appropriate |

**Strengths:** Single `players.id` registry; merge/validate pipeline; MLS + Brasileirão squads merged; Maps for team/league/quiz indexes; Brasileirão quiz policy (browse-only unless editorial-approved).

**Gaps:** Unequal learning value (EU vs Americas); stale **manual** MVP rows flagged in `validate:overlays` (e.g. Ederson, Trent, Núñez club vs TM 2025); no consumer-facing **`dataAsOf`** on Browse/Home (only dev preview pages).

---

### 2. Search quality

| Surface | Behavior | Assessment |
|---------|----------|------------|
| Browse | Accent-insensitive name + aliases; cap **100** results with “narrow filters” message | **Good** at ~2.3k scale |
| Universal Search | Players, clubs, leagues, national teams; debounced; per-type caps | **Good** for discovery |
| Quiz autocomplete | Pool-scoped; ambiguous surname handling + UI note | **Good** after recent pass |
| Performance | Linear scan over full `players[]` | **Acceptable now**; will degrade past ~5k without index/worker |

**Risks:** Very common surnames across leagues; last-name-only answers blocked when ambiguous (correct, but needs user education). No search across non-live national rivals as pages (text only).

---

### 3. Image quality

| Check | Status |
|-------|--------|
| TM / scraped URLs in data | Validators block; **0** `imageUrl` in live `sampleData` |
| `PlayerVisual` | Consistent placeholders + alt text |
| Policy | [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) clear |
| Asset library | `public/images/players/` empty (`.gitkeep` only) |

**Assessment:** **Legally safe, visually thin.** Acceptable for a closed beta **if** copy states “illustrations coming” or similar. Weak for marketing screenshots that imply photo-rich cards.

---

### 4. Mobile UX

| Check | Status |
|-------|--------|
| Filter rows stack (`filters__row` column on small screens) | ✅ |
| 16px inputs (iOS zoom avoidance) | ✅ |
| Navbar: Browse, Nations, Compare, Collections, Quiz, Saved, Daily, XP | Dense but usable; may wrap on 320px |
| Quiz scoreboard grid | `auto-fit` min columns |
| Autocomplete list height | `min(42dvh, 16rem)` |
| Daily pips + one-handed CTAs | Implemented |
| Touch targets | Generally adequate; not formally audited to 44px everywhere |

**Assessment:** **Good enough for beta** with spot-check on iOS Safari + Android Chrome. Not a blocker if labeled beta.

---

### 5. Quiz depth

| Dimension | Status |
|-----------|--------|
| Quiz Mode | League, club, position, national filters; classic + variants; timed mode; min pool **3** for club/NT |
| Daily Challenge | Deterministic; club/league/NT/general themes; requires **≥5** quiz-ready per themed entity |
| Editorial gate | `quizHints` + `quickFact` + `quizEligible` |
| EU depth | Strong (e.g. Real Madrid 11, Arsenal 10 quiz-ready) |
| MLS / Brasileirão | **20** quiz each league-wide; most clubs **0**; BR big-five **4** each → **no club-themed daily** for those clubs yet |
| Surname risk | Brasileirão league pool: shared `henrique`, `rafael`; UI warns users |

**Assessment:** Quiz **engine** is beta-ready; quiz **content** is not for Americas-heavy positioning.

---

### 6. Collections

| Metric | Status |
|--------|--------|
| Curated collections | **21** playlists |
| World Cup prep subset | `getWorldCupCollections()` — watchlist, contenders, recent winners, country packs |
| National-team items | Resolve to live `/national-team/:id` |
| `quizLaunch` | League/club/NT deep links where editorial supports |
| Progress + XP | `useCollectionProgress` + progression dedupe keys |

**Assessment:** **Strong editorial product** for EU + WC **prep** narrative. Collections referencing thin MLS/BR clubs may over-promise quiz CTAs — verify per collection before marketing.

---

### 7. National teams

| Nation | Linked squad | Quiz-ready (linked) |
|--------|-------------:|--------------------:|
| England | 15 | 11 |
| France | 23 | 8 |
| Spain | 19 | 8 |
| Brazil | 28 | 8 |
| Argentina | 8 | 8 |

**Integrated:** `/national-teams`, `/national-team/:id`, Nations nav, universal search, quiz `?nationalTeam=`, collections, occasional daily NT days (≥5 quiz per nation).

**Gaps:** Wave 1 only (no Germany, USA, Mexico, Netherlands live); large TM NT previews not fully linked; rivals may 404 if linked before pages exist.

**Assessment:** **Beta-ready for 5-nation positioning**; not for “all major nations” marketing.

---

### 8. World Cup prep

| Delivered (lightweight) | Not shipped (full mode) |
|-------------------------|-------------------------|
| WC-tagged collections & learning paths | `/world-cup` hub |
| International Today’s Picks (~1 in 3 days) on **Browse** | `competitionSquads`, groups, tournament history JSON |
| Country collections (Brazil, Argentina, France, Spain, England, USMNT-adjacent copy) | `/quiz?competition=world-cup-2026` |
| Copy on Collections page: prep, not full mode | Bracket / fixture simulation |

**Assessment:** Honest **prep layer** exists. **Blocker** only if public copy sells “World Cup Mode” as shipped.

---

### 9. Scalability

| Layer | Finding | Severity |
|-------|---------|----------|
| Bundle | `sample-data` chunk ~**1.53 MB** minified (~193 KB gzip) | **High** for first load on slow mobile |
| Memory | Full `players[]` parsed at startup | Medium at 2.3k; **High** at 5k+ |
| Quiz / daily | Cached eligible pools + per-date plan cache | **Mitigated** |
| Browse search | O(n) scan, cap 100 | OK now |
| National JSON | Small (`nationalTeamLive.json`) | OK |
| Code-split | Dev routes lazy; main data not lazy per league | Future work |

**Assessment:** Fine for **closed beta** with tech-aware users; **risky** for viral public launch without lazy league payloads or CDN JSON shards.

---

### 10. Local progression systems

| System | Storage | Assessment |
|--------|---------|------------|
| XP / level | `footybrain:progression` | Sanitized reads; cross-tab sync |
| Daily streak | `footybrain:daily` | Deterministic challenge; completion persisted |
| Favorites | `footybrain:favorites` | Player + team IDs |
| Collections progress | `footybrain:collections-progress` | Viewed/learned indices |
| Preferences | `footybrain:preferences` | Optional onboarding |
| Achievements | Client-computed rules | **Not anti-cheat** (DevTools editable) |

**Firebase-ready:** Hook boundaries documented (`useProgression`, `useDailyChallenge`).

**Gaps:** No privacy policy explaining local-only data; no export/reset UX beyond clearing site data; unbounded dedupe arrays on heavy use (edge case).

**Assessment:** **Functional for beta**; document trust limits; not a launch blocker for no-account product.

---

## Strengths (ship with confidence)

1. **Coherent product shell** — Browse, profiles, compare, collections, learning paths, quiz, daily, saved, profile/XP, universal search, national teams in nav.
2. **Editorial quality where invested** — 368 quiz-ready players with hints/facts; top EU clubs at or above 5-per-club target.
3. **Data integrity patterns** — Single registry, NT memberships join table, validators (`validate:overlays`, phase-4/Brasileirão audits), merge guards for quiz policy.
4. **Quiz & daily architecture** — Filter modes, empty states, themed daily, surname safeguards, NT minimum pools.
5. **World Cup prep without over-building** — Collections/paths/international picks tee 2026 without fake tournament sim.
6. **Legal posture on images** — No TM hotlinks; clear policy path for licensed assets.
7. **Pre-Firebase discipline** — No premature Auth; localStorage progression is intentional.

---

## Blockers (public beta)

These should be resolved or explicitly scoped down before **open** beta:

| # | Blocker | Why it matters |
|---|---------|----------------|
| B1 | **MLS + Brasileirão quiz desert** | 50 clubs with 0 quiz-ready; Americas leagues marketed via Home league hubs but weak learn/quiz loop |
| B2 | **No privacy / localStorage disclosure** | [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) requires published copy before marketing |
| B3 | **Pre-Firebase brief not met** | Gates 2–5 partial; public beta implies broader men’s scope than delivered |
| B4 | **Bundle / first-load weight** | ~1.5 MB data chunk hurts cold start on mobile networks |
| B5 | **Freshness trust** | Stale manual stars + no `dataAsOf` on user-facing browse |
| B6 | **World Cup positioning** | Must not advertise full World Cup Mode; prep-only today |
| B7 | **Visual expectations** | 100% placeholders — fine if disclosed; poor for acquisition creative |

---

## Highest-risk areas

| Risk | Impact | Likelihood |
|------|--------|------------|
| User opens MLS/BR club → “Quiz after editorial review” | Feels broken vs EU | **High** |
| Marketing “World Cup 2026 mode” | Trust hit when routes missing | **High** if copy wrong |
| Mobile first visit on 4G | Slow TTI from data chunk | **Medium** |
| Quiz last-name collisions (BR league, EU duplicates) | Frustration / “bug” reports | **Medium** |
| Edited `localStorage` XP | Meaningless leaderboards later | **Low** until competitive features |
| ID/roster drift without `dataAsOf` | Wrong club on profile | **Medium** over season |

---

## Recommended fixes before public beta

Prioritized; aligns with brief gates, not Firebase.

### P0 — Trust & positioning (no large code)

1. Publish **Privacy / local data** page: no account, `localStorage` keys, clear-site-data resets progress.
2. Add **beta banner** + scope line: men’s only; 5 national teams; MLS/Brasileirão browse-first; quiz depth varies by league.
3. Show **`dataAsOf` / snapshot season** on Browse or footer (from merge meta).
4. Marketing copy: **“World Cup prep”** not “World Cup Mode”; link only to live nations/collections.

### P1 — Content (editorial pipeline)

5. **MLS wave 2:** 2–3 quiz-ready per Inter Miami, LAFC, LA Galaxy, Seattle (already at 4); then next priority clubs — target 5 for daily club theme.
6. **Brasileirão wave 2:** +1 quiz per big-five (Flamengo, Palmeiras, Corinthians, São Paulo, Santos) → unlock club daily + “fully healthy.”
7. **BR secondary clubs:** 2–3 stars each on Botafogo, Grêmio, Atlético Mineiro before long-tail 0-quiz clubs.
8. **National wave 2:** Germany + USA (brief mentions them); expand Argentina membership beyond 8 linked.
9. Fix **stale manual MVP** rows (Ederson, Trent, Núñez) in overlay or sample merge.

### P2 — Product polish (targeted code — post-review)

10. **Today’s Picks on Home** (or hero link to Browse picks) — discovery gap today.
11. **Lazy league data** or split `sampleData` by `leagueId` for production chunk budget.
12. **Roster freshness** pass per [ROSTER_FRESHNESS_PLAN.md](./ROSTER_FRESHNESS_PLAN.md) on quiz hints.
13. Run full [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) sign-off with owner.

### P3 — Nice for public v1 (not blocking closed beta)

14. Licensed images for top ~50 quiz faces (policy-compliant).
15. World Cup hub route (read-only shell) even before `competitionSquads`.
16. Accessibility contrast audit + keyboard pass on navbar wrap.

---

## Suggested beta tiers

| Tier | Audience | Requirements |
|------|----------|----------------|
| **α (now)** | Contributors + QA | P0 copy; known-issue list; validators green |
| **β closed** | Friends, Discord, TestFlight web link | P0 + MLS/BR wave-2 partial; `dataAsOf`; mobile smoke test |
| **β public** | Open URL + light marketing | P0–P2 complete; ≥30 more quiz-ready in MLS+BR; bundle budget addressed; checklist § “Must be true” largely `[x]` |

---

## Validation snapshot (release branch)

Run before any beta URL:

```bash
npm run build
npm run lint
npm run validate:overlays
npm run editorial:report
npm run validate:brasileirao-live   # if Americas in narrative
```

Last known: **build/lint pass**; **validate:overlays** passes with **5 manual warnings** (stale rosters / missing TM preview for ter-Stegen, Sané).

---

## Sign-off recommendation

| Question | Answer |
|----------|--------|
| Ready for **public** beta before Firebase? | **No** — complete P0 + P1 and re-run this review. |
| Ready for **limited** beta with honest scope? | **Yes**, with beta labeling and Americas expectations set to browse-first. |
| Ready for Firebase? | **No** — per PROJECT_BRIEF; content gates 1–5 incomplete. |

---

*Next update: after MLS/Brasileirão editorial wave 2, privacy page, and `dataAsOf` surfacing — bump readiness tier and checkbox [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md).*
