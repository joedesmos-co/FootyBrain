# FootyBrain — Production Launch Plan

> **Purpose:** First production-launch planning document — **what must be true** and **in what order** before a broad public launch.  
> **Authority:** [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) (frontend-only, local data, no Firebase until content gates 1–5).  
> **Planning only:** No production infrastructure, hosting accounts, analytics SDKs, or backend deploy in this document.  
> **Last updated:** 2026-05-25

**Companion docs:** [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) · [BETA_READINESS_REVIEW.md](./BETA_READINESS_REVIEW.md) · [POST_BETA_ROADMAP.md](./POST_BETA_ROADMAP.md) · [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) · [WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md) · [DATA_MERGE_PLAN.md](./DATA_MERGE_PLAN.md)

---

## 1. Launch readiness snapshot

FootyBrain today is a **credible static learning app** for European top-flight fans and World Cup **prep** narratives. It is **not** yet balanced for a global “men’s football database” launch without scope discipline.

| Dimension | Current state | Production target |
|-----------|---------------|-------------------|
| **Product** | Browse, profiles, compare, collections, quiz, daily, saved, XP, 5 live national teams | Same shell; honest scope copy; no fake “live scores” |
| **Data** | ~2,331 players, 105 clubs, 8 leagues; **368** quiz-eligible (~16%) | Brief gates 1–5 substantially met; `dataAsOf` visible |
| **Accounts** | None (`localStorage` only) | **v1 launch without sign-in**; Firebase deferred per brief |
| **Images** | 100% placeholders (policy-compliant) | Licensed batch for top quiz faces; rest placeholders OK if disclosed |
| **World Cup** | Collections + paths + international picks | Hub shell + honest “prep not full mode” OR defer WC marketing |
| **Engineering** | Vite SPA; `sample-data` chunk ~1.5 MB minified | Lazy/sharded data or manifest; CI validators green |

**Verdict:** **Production v1** = open HTTPS deploy with **narrow, honest positioning** after beta-exit content/trust work — not “flip DNS on today’s build.”

---

## 2. Deployment readiness

### What is ready now

- **Static SPA** — React + Vite; no server runtime required for core product.
- **Build pipeline** — `npm run build`, `npm run lint`, `validate:overlays`, `validate:data-pipeline`, `validate:app-ready-preview`, merge scripts documented.
- **SPA routing** — Host must rewrite unknown paths to `index.html` ([HANDOFF.md](./HANDOFF.md)).
- **No secrets in client** — No API keys in bundle today; keep that invariant for v1.

### Gaps before production deploy

| Item | Why |
|------|-----|
| **Content release process** | Tagged merge → build → deploy with `dataAsOf` and release notes |
| **Environment config** | `base` URL for Vite if not served from domain root |
| **Error monitoring** | Client-side crash reporting (e.g. Sentry) without PII — plan only until host exists |
| **Cache busting** | Hashed JS/CSS from Vite; plan long-cache for static assets + short-cache or versioned JSON if data is split |
| **Robots / sitemap** | Not required for app-only beta; needed for SEO launch |
| **404 / offline** | Friendly 404 exists for missing entities; optional offline shell later |

### Deployment checklist (go / no-go)

1. [ ] Production branch: `npm run build` + `npm run lint` + validators pass.
2. [ ] SPA fallback configured on host.
3. [ ] HTTPS enforced; HSTS considered.
4. [ ] `dataAsOf` (or equivalent) visible on Browse or footer.
5. [ ] Privacy / localStorage disclosure published and linked from app.
6. [ ] Marketing copy matches live routes (no full World Cup Mode unless shipped).
7. [ ] Smoke test: Home, Browse, Quiz, Daily, Collections, Compare, 5 national teams, deep links.

---

## 3. Hosting considerations

### Recommended v1 architecture: **static hosting**

| Option | Fit | Notes |
|--------|-----|-------|
| **Cloudflare Pages** | Strong | Global CDN, free tier, easy SPA rules, good cache headers |
| **Netlify** | Strong | Same; preview deploys per PR useful for editorial QA |
| **Vercel** | Strong | Same; familiar for Vite |
| **GitHub Pages** | OK | Works with `base` path; slightly more friction for custom domain |
| **S3 + CloudFront** | OK | More ops; good if already on AWS |

**Not required for v1:** Node server, Firebase Hosting (unless later unified with Auth), edge functions.

### Hosting decisions to document at deploy time

| Decision | Recommendation |
|----------|----------------|
| **Custom domain** | `footybrain.com` or subdomain; single canonical HTTPS URL |
| **Preview environments** | Staging URL per PR for editorial sign-off before promoting `main` |
| **Data location** | Keep football JSON in repo/build until manifest split; then CDN path per [POST_BETA_ROADMAP.md](./POST_BETA_ROADMAP.md) Phase B |
| **Bandwidth** | ~200 KB gzip JS + ~200 KB gzip data today; monitor after lazy-load split |
| **DDoS / abuse** | CDN default; no public write APIs in v1 |

### Future (post-v1, not launch day)

- Versioned `content-manifest.json` on CDN (league shards, `schemaVersion`, `dataAsOf`).
- Optional Firebase Hosting when Auth ships — same static assets + rules for auth routes only.

---

## 4. Image hosting strategy

Align with [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md).

### v1 (launch)

| Tier | Approach |
|------|----------|
| **Default** | Gradient placeholders via `PlayerVisual` — no TM hotlinks |
| **Priority quiz faces** | App-hosted `/public/images/players/{id}.webp` for 30–50 editorial stars |
| **Clubs / leagues** | `crestUrl` / `logoUrl` remain null until licensed; badge themes suffice |
| **CDN** | Same origin as app for v1; move to `cdn.footybrain.com` when image count grows |

### Production workflow

1. Rights cleared (own art, commissioned, or CC with attribution).
2. File → `public/images/players/{player-id}.webp`.
3. Overlay or `sampleData` fields: `imageUrl`, `imageAlt`, `imageCredit`, `imageSource`, `imageLicense`.
4. `npm run validate:overlays` + app-ready validation.
5. Deploy static assets with long-cache filename hashing (Vite handles JS/CSS; images use stable paths — bump cache on content release).

### Launch marketing implication

- Screenshots should use **placeholder-forward** creative or licensed subset only.
- Do not imply photo-rich cards until batch exists.

### Risks

- Personality/publicity rights vary by jurisdiction — legal review for named players.
- Hotlinking club crests without license is **out of scope** for v1.

---

## 5. Performance goals

Measured on **mid-tier mobile** (4G, Moto G–class or iPhone SE) against production build.

| Metric | Beta acceptable | Production v1 target |
|--------|-----------------|---------------------|
| **First Contentful Paint** | < 3 s | < 2 s |
| **Time to Interactive** | < 5 s | < 3.5 s after data split |
| **Main thread** | No long blocks on route change | Route transitions < 100 ms perceived |
| **Initial JS + data** | ~1.5 MB data chunk today | **Split:** core shell < 300 KB gzip + on-demand league JSON |
| **Search (2.3k players)** | < 50 ms scan OK | Build-time index or worker if > 5k |
| **Quiz / Daily** | Cached pools — keep | No regression |

### Engineering tactics (planned, not shipped)

- Lazy import league player shards by `leagueId`.
- Optional `search-index.json` generated at merge time.
- Code-split dev-only routes (already partial).
- `content-visibility` on long squad lists (already used in places).

### Monitoring

- Real User Monitoring (RUM) after analytics decision — Core Web Vitals on Home, Browse, Quiz.

---

## 6. Mobile goals

Product brief: **mobile-friendly design** — production bar is **primary device**, not desktop-first polish.

| Goal | Criteria |
|------|----------|
| **Layout** | Filters stack; no horizontal scroll on 320px width |
| **Inputs** | 16px+ font on inputs (iOS zoom avoidance) — maintain |
| **Navigation** | Nations, Browse, Quiz, Daily reachable in ≤2 taps from Home |
| **Touch** | Primary CTAs ≥ 44×44 px spot-check on Quiz, Daily, collection actions |
| **Autocomplete** | Usable at `min(42dvh, 16rem)` list height |
| **One-handed use** | Daily pips + primary button reachable thumb zone |
| **Performance** | Cold start acceptable on 4G after bundle split |

**QA matrix before launch:** iOS Safari (latest −1), Android Chrome, one small phone (320px), one tablet (optional).

---

## 7. SEO goals

FootyBrain is an **SPA learning app**, not a content farm. SEO supports **discovery of the product**, not thousands of indexed player URLs on day one.

### v1 SEO scope

| Item | Approach |
|------|----------|
| **Landing / marketing** | Single public landing or Home with meta title, description, OG image (placeholder-safe) |
| **Per-route meta** | `document.title` per major route (Browse, Quiz, Collections, national teams) |
| **Canonical URL** | One domain; avoid duplicate www/non-www |
| **Sitemap** | `/sitemap.xml` for static routes: `/`, `/browse`, `/quiz`, `/daily`, `/collections`, `/national-teams`, live nation pages |
| **Player URLs** | **Optional v1** — 2,331 `/player/:id` pages are thin without images; prefer **noindex** on player pages until richer meta OR index only quiz-eligible subset |
| **Structured data** | Optional `WebApplication` JSON-LD on Home — not `SportsEvent` live scores |
| **Performance** | Core Web Vitals feed SEO indirectly |

### Copy discipline

- Title pattern: `FootyBrain — Learn men's football players & quizzes`
- No implied affiliation with FIFA, clubs, or Transfermarkt in meta descriptions.

### Pre-WC SEO opportunity

- Editorial pages: “World Cup 2026 learning guide” static section or `/world-cup` hub when shipped — targets **learning intent**, not live fixtures.

---

## 8. Analytics considerations

**v1 default: minimal or none** — aligns with privacy-first, no-account launch.

| Approach | When | Notes |
|----------|------|-------|
| **No analytics** | Friends-and-family / closed beta | Simplest; no consent banner if no non-essential cookies |
| **Privacy-friendly analytics** | Public v1 | Plausible, Fathom, or GA4 with IP anonymization — **disclosed in privacy policy** |
| **Product events** | Post-traction | Quiz complete, daily finish, collection complete — no PII, no keystroke logging |
| **Error tracking** | Production v1 recommended | Sentry/Datadog RUM — crash rates only |

### Do not collect in v1 without policy update

- Email, name, precise geolocation
- Cross-site tracking for ads
- Full session replay with PII

### Firebase Analytics

Defer until **Accounts v1** ([POST_BETA_ROADMAP.md](./POST_BETA_ROADMAP.md) Phase C) — same privacy review as Auth.

---

## 9. Legal / privacy considerations

No accounts → **browser `localStorage` only** ([PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md)).

### Must publish before broad marketing

| Topic | User-facing requirement |
|-------|-------------------------|
| **Data storage** | Progress, favorites, daily streak, collection progress stored **on device only** |
| **No account** | No sign-in; clearing site data resets progress |
| **Men's scope** | Product is men's football learning only (per brief) |
| **Images** | Placeholders or licensed assets; not official club/player endorsement |
| **Third parties** | If analytics added, name vendor and purpose |
| **Contact** | Feedback email or form for privacy questions |
| **Children** | General audience; no targeted COPPA collection (no accounts helps) |

### Data / IP

| Area | Posture |
|------|---------|
| **Transfermarkt** | Facts via controlled pipeline; **no** TM images or market values in app |
| **EA FC / FIFA games** | No EA ratings; FootyBrain Importance Score only |
| **Trademarks** | Club/league names for descriptive learning; avoid logo misuse until licensed |
| **GDPR / UK GDPR** | localStorage-only may reduce cookie-banner scope — **get legal review** before EU ad spend |
| **California (CCPA)**** | No sale of personal data; document if analytics added |

### Engineering artifacts (no legal advice)

- Privacy page route: `/privacy` (static copy).
- Footer link: Privacy · Data snapshot date · Feedback.

---

## 10. Public beta rollout ideas

Phased rollout reduces reputational risk while editorial catches up.

### Phase 0 — Internal QA (now)

- Team + 5–10 football-literate testers.
- Script: Browse → profile → quiz → daily → collection → compare.
- File issues against [EDITORIAL_BACKLOG.md](./EDITORIAL_BACKLOG.md) and validators.

### Phase 1 — Closed beta (friends & family)

| Element | Detail |
|---------|--------|
| **Audience** | 50–200 users; invite link, no paid ads |
| **Positioning** | “Beta — European leagues strong; MLS/Brasileirão browse-first; quiz depth growing” |
| **Banner** | In-app beta strip + `dataAsOf` |
| **Feedback** | Google Form / GitHub Discussions / email |
| **Success** | Completion rates on Daily + Quiz; qualitative “could you learn a squad?” |

### Phase 2 — Open beta (limited marketing)

| Element | Detail |
|---------|--------|
| **Audience** | Football Twitter/Reddit pockets; no broad paid UA |
| **Scope** | Same honesty; highlight collections + national teams + EU quiz |
| **Avoid** | “Every MLS club quiz-ready,” “Full World Cup 2026 mode,” photo-rich ads |
| **Metrics** | Weekly active, daily completion %, 404 rate, crash-free sessions |

### Phase 3 — Production v1

- Remove or soften beta banner.
- [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) “Must be true” complete.
- PR only after Americas quiz depth and privacy ship.

---

## 11. Pre–World Cup launch opportunities

2026 cycle is a **learning moment**, not a live scores product ([WORLD_CUP_MODE_PLAN.md](./WORLD_CUP_MODE_PLAN.md)).

### Timeline windows (planning)

| Window | Opportunity | Product hook |
|--------|-------------|--------------|
| **12–9 months out** | Qualification narrative, nation discovery | National team pages, collections, “Learn the Seleção” |
| **6–3 months out** | Squad curiosity, group draw education | `/world-cup` hub shell, group guides (editorial), nation quizzes |
| **1 month out** | Name learning spike | Daily national-team themes, “World Cup stars” collection |
| **During tournament** | Peak interest | **Do not** promise live fixtures/scores; quiz + country learning only |

### Ship before WC marketing (minimum)

1. [ ] `/world-cup` read-only hub — hosts, format, links to nations/collections/quiz.
2. [ ] Live nation set expanded or marketing limited to **5 live** nations.
3. [ ] `world-cup-stars` / contender collections verified quiz-ready.
4. [ ] Copy: “Prep mode — not live match data.”

### Content marketing angles (no new infra)

- “Learn every Brazil linked star before the squad drops.”
- “Quiz yourself on England’s linked pool — no account.”
- “Collections: press-resistant mids, WC stars, UCL veterans.”

### Defer until post-v1 or later

- Bracket simulation, live fixtures, `competitionSquads` automation from APIs.

---

## 12. Biggest launch risks

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R1 | **Over-promising scope** (MLS/BR quiz, full WC mode) | Bad reviews, trust loss | Honest Home + checklist; beta banner |
| R2 | **1.5 MB data cold start** | Bounce on mobile | League shard / lazy load before paid UA |
| R3 | **Stale rosters** (manual MVPs vs TM) | Wrong answers in quiz | `dataAsOf`, overlay refresh, avoid transfer-volatile hints |
| R4 | **No privacy policy** | Store rejection, EU ads blocked | Publish `/privacy` before marketing |
| R5 | **Surname quiz collisions** | Frustration in BR/MLS pools | Editorial + UI warnings; expand aliases |
| R6 | **Placeholder-only visuals** | Low conversion on ads | Licensed top-50 faces or illustration-led creative |
| R7 | **SEO thin player pages** | Crawl budget waste / thin content penalty | noindex browse-only players until enriched |
| R8 | **localStorage loss** | Users angry after clearing Safari data | Explain in onboarding + privacy |
| R9 | **Premature Firebase** | Cost, complexity, security rules debt | Brief gate #6 only after content gates |
| R10 | **Trademark / image IP** | Takedown | [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md); no TM URLs |

---

## 13. Launch priorities

Ordered for **production v1** (not every item is launch-blocking for closed beta).

### P0 — Blockers for broad public launch

1. **Privacy / localStorage page** linked from app.
2. **`dataAsOf` / snapshot honesty** on Browse or global footer.
3. **Scope copy** — men's only; prep-not-full WC; MLS/BR browse vs quiz depth.
4. **Bundle / performance** — data split or manifest before paid acquisition.
5. **PUBLIC_READINESS checklist** — engineering + content gates green.

### P1 — High value before marketing spend

6. **MLS + Brasileirão quiz waves** — ≥5 quiz-ready on priority clubs (Home league hubs).
7. **Stale MVP roster fixes** (validate:overlays stale report).
8. **Licensed image batch** for top quiz faces (marketing + profiles).
9. **`/world-cup` hub shell** for 2026 prep narrative.
10. **Error monitoring** on production host.

### P2 — Polish and growth enablers

11. National team wave 2 (Germany, USA) or narrow marketing to live five.
12. Build-time search index.
13. SEO sitemap + route titles; player page index strategy.
14. Privacy-friendly analytics + event taxonomy.
15. Today’s Picks on Home (if not already promoted).

### Explicitly later (post-v1)

- Firebase Auth + cloud saves.
- Leaderboards / social.
- Live scores or fixture APIs.
- AI-generated hints at runtime.

---

## 14. Biggest blockers

Consolidated from [BETA_READINESS_REVIEW.md](./BETA_READINESS_REVIEW.md) and [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md).

| Blocker | Status | Unblocks |
|---------|--------|----------|
| **Americas quiz desert** | ~50 MLS/BR clubs at 0 quiz-ready | Editorial waves + honest regional copy |
| **Privacy disclosure** | Not shipped | Legal copy + `/privacy` route |
| **Pre-Firebase brief gates 2–5** | Partial | Content + WC hub, not infrastructure |
| **Data bundle weight** | ~1.5 MB chunk | Lazy league payloads / CDN manifest |
| **Roster freshness trust** | Stale manual rows; no `dataAsOf` UI | Merge refresh + visible snapshot date |
| **World Cup positioning** | Prep only | Marketing discipline or ship hub |
| **Visual expectations** | 0 licensed photos | Policy-compliant creative or image batch |

**Not blockers for closed beta:** Firebase, accounts, live APIs, full Serie A depth.

---

## 15. Safest launch sequence

Aligns with [POST_BETA_ROADMAP.md](./POST_BETA_ROADMAP.md) — **no production infrastructure until the step says “deploy.”**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. CONTENT & TRUST (no new hosting)                                     │
│    privacy page · dataAsOf · stale MVP fixes · MLS/BR quiz waves          │
│    validate:* green · merge · build                                     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. PERFORMANCE (still local / preview deploys)                          │
│    league-sharded data OR manifest · search index artifact              │
│    measure FCP/TTI on 4G                                                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. CLOSED BETA DEPLOY                                                   │
│    static host + SPA rules · staging URL · smoke tests                  │
│    optional Sentry · no paid ads                                        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. WC PREP LAYER                                                        │
│    /world-cup hub · collections verified · NT marketing scoped to live  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. IMAGES (parallel track)                                              │
│    30–50 licensed player WebPs · validate overlays                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. OPEN BETA                                                            │
│    friends + community · feedback loop · checklist audit                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. PRODUCTION v1                                                        │
│    remove beta banner · SEO basics · optional analytics · PR            │
│    still no Firebase                                                    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 8. POST-LAUNCH (separate program)                                       │
│    Accounts / Firebase · social · AI assist · live data APIs (if ever)    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Week-zero deploy (absolute minimum)

If you must put **something** on a URL immediately: **Step 3 only** with **Step 1 partial** (privacy + beta banner + no paid ads). Label **closed beta**; do not call it production v1.

---

## 16. Document maintenance

| Trigger | Action |
|---------|--------|
| New league merge | Update snapshot metrics in §1 |
| Privacy page ships | Check off §9 and §14 |
| Data split ships | Revise §5 targets and R2 |
| WC hub ships | Update §11 and R6 |
| Firebase approved | Move account work to [POST_BETA_ROADMAP.md](./POST_BETA_ROADMAP.md); keep this doc as static-launch record |

---

*This plan does not authorize production infrastructure spend or third-party contracts. Implementation tickets should reference section numbers and companion checklists.*
