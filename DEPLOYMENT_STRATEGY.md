# FootyBrain — Deployment Strategy

> **Status:** Planning only — **do not deploy yet.**  
> **Authority:** [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) (frontend-only React + Vite, local data, no Firebase until content gates 1–5).  
> **Last updated:** 2026-05-26

**Companion docs:** [PRODUCTION_LAUNCH_PLAN.md](./PRODUCTION_LAUNCH_PLAN.md) · [PUBLIC_BETA_READINESS_AUDIT.md](./PUBLIC_BETA_READINESS_AUDIT.md) · [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) · [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) · [PLAYER_IMAGE_SYSTEM_PLAN.md](./PLAYER_IMAGE_SYSTEM_PLAN.md) · [PERFORMANCE_SCALING_PLAN.md](./PERFORMANCE_SCALING_PLAN.md)

This document is the **first serious deployment strategy**: where and how to host the static app, how assets and routes behave in production, and the **safest sequence** from private preview to a narrow public release. It does not provision infrastructure or change application code.

---

## Executive summary

FootyBrain v1 is a **static single-page application** (`npm run build` → `dist/`). There is no application server, database, or Firebase in scope for first deploy. Production is **HTML + hashed JS/CSS + public assets**, served over HTTPS behind a CDN, with **SPA fallback** for client-side routes.

**Recommended v1 stack (safest-first):** Cloudflare Pages (or Netlify) → custom domain + HTTPS → SPA fallback rewrites → strict cache headers for hashed assets → same-origin player images (manifest allowlist) → privacy-friendly analytics only after `/privacy` exists → client error tracking (Sentry or equivalent) → staged beta before any broad marketing.

**Current scale assumptions (public beta):**

- **~2.3k players**, **100+ clubs**, **8 leagues**
- **25 live national teams** + World Cup prep hub (no fixtures/scores/APIs)
- All progress is **device-only** (`localStorage`) per [PROJECT_BRIEF.md](./PROJECT_BRIEF.md)

---

## 1. Static hosting options

| Platform | Fit | Strengths | Watch-outs |
|----------|-----|-----------|------------|
| **Cloudflare Pages** | **Primary recommendation** | Global CDN included, generous free tier, easy SPA `_redirects` / `_routes`, strong cache control, DDoS protection | Build minutes on free tier; learn Pages vs Workers boundary |
| **Netlify** | **Strong alternative** | PR preview deploys (excellent for editorial QA), `_redirects` for SPA, forms not needed for v1 | Slightly different header/cache defaults than Cloudflare |
| **Vercel** | Strong | First-class Vite support, preview URLs per branch | Same SPA rules required; compare cost at scale |
| **GitHub Pages** | OK for experiments | Free with repo; good for `staging.` subdomain | Requires `base` in Vite if not at domain root; weaker preview workflow |
| **AWS S3 + CloudFront** | OK if already on AWS | Full control, WAF optional | More ops (ACM cert, invalidation, OAI); overkill for v1 unless org standard |
| **Firebase Hosting** | **Defer** | Natural later with Auth | Brief defers Firebase until content gates; do not adopt only for static files |

### What we deploy

| Artifact | Source | Notes |
|----------|--------|-------|
| `index.html` | Vite build | Short cache or revalidate on deploy |
| `assets/*.js`, `assets/*.css` | Vite (content-hashed filenames) | `Cache-Control: public, max-age=31536000, immutable` |
| `favicon.svg`, `images/**` | `public/` | Stable paths; version by deploy or filename when images ship |
| `dev-data/**` (if present) | `public/dev-data/` | **Exclude from production** or block `/dev/*` at edge (see §5) |

### Build command (release gate)

```bash
npm run lint && npm run build
```

Optional pre-promote validators (already in repo): `validate:app-ready-preview`, `validate:data-pipeline`, `validate:player-images`.

### Environments

| Environment | Purpose | URL pattern |
|-------------|---------|-------------|
| **Local** | Dev | `npm run dev` |
| **Preview** | PR / branch QA | `*.pages.dev` or Netlify preview |
| **Staging** | Editorial sign-off, smoke tests | `staging.footybrain.com` |
| **Production** | Public beta / v1 | `footybrain.com` (canonical HTTPS) |

**Rule:** Only promote `main` (or a tagged release) to production after checklist sign-off in [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md).

---

## 2. CDN strategy

The host’s CDN **is** the CDN for v1. No separate origin required on day one.

### Cache tiers

| Asset class | Cache policy | Invalidation |
|-------------|--------------|--------------|
| Hashed JS/CSS (`assets/index-*.js`) | Long-lived, immutable | New deploy = new filenames (automatic bust) |
| `index.html` | Short TTL or `no-cache` | Every deploy |
| `favicon.svg`, static SVG placeholders | Medium (e.g. 7d) or versioned path | Redeploy or path bump |
| Player images `/images/players/*` | Long cache once stable | Bump path or purge on batch update |
| Future `content-manifest.json` / league shards | Versioned URL (`?v=` or path segment) | Manifest version field per [PERFORMANCE_SCALING_PLAN.md](./PERFORMANCE_SCALING_PLAN.md) |

### Compression

- Enable **Brotli** and **gzip** at edge (default on Cloudflare/Netlify).
- Current production build warning: `sample-data` chunk ~**1.5 MB** minified (~**194 KB** gzip). Monitor **Time to Interactive** on mid-tier mobile; CDN does not fix parse/execute cost.

### Geographic distribution

- Default anycast edge is sufficient for men’s football learning audience (EU + Americas).
- No multi-region origin needed (single static bucket / Pages project).

### Future CDN split (post-v1, not launch day)

| Hostname | Contents |
|----------|----------|
| `footybrain.com` | App shell, `index.html`, entry JS |
| `cdn.footybrain.com` | Player images, optional league JSON shards |

Keeps image bandwidth off the app origin and simplifies cache rules. Requires `approvedCdnHosts` updates in [player image policy](./PLAYER_IMAGE_POLICY.md).

### Security headers (configure at host)

| Header | Recommendation |
|--------|----------------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` after HTTPS verified |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Disable unused APIs (camera, mic, geolocation) |
| `Content-Security-Policy` | Start report-only; tighten after analytics domain known |

No API keys in the client bundle — maintain this invariant.

### Safest first deployment architecture (reference)

**Single static origin + CDN edge only** is the safest and lowest-ops architecture for v1:

- **Origin**: Cloudflare Pages (or Netlify) serves `dist/` directly
- **Edge**: CDN handles TLS, compression, caching, and SPA rewrite
- **No backend**: no API surface, no database, no auth, no server runtime

This matches the product constraints (frontend-only, local data, no Firebase yet).

---

## 3. Image hosting

Align with [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) and manifest system in [PLAYER_IMAGE_SYSTEM_PLAN.md](./PLAYER_IMAGE_SYSTEM_PLAN.md).

### v1 (first public release)

| Tier | Hosting | Cache |
|------|---------|-------|
| **Default** | Same origin — gradient/SVG via `PlayerVisual` | N/A |
| **Licensed batch** | `public/images/players/{player-id}.webp` deployed with static site | Long cache; stable IDs |
| **External CDN** | Only URLs in manifest `approvedCdnHosts` | HTTPS only; attribution fields required |

**Do not** hotlink Transfermarkt, Google Images, or unlicensed club press photos.

### Workflow for new images

1. Rights cleared → file in `public/images/players/`.
2. Manifest entry + `npm run validate:player-images`.
3. Deploy with static release; note in release notes (no silent image swaps without `dataAsOf` awareness).

### Bandwidth estimate

- Placeholder-only v1: negligible image egress.
- 50 WebP faces (~30–80 KB each): ~2–4 MB total — trivial on CDN.

### Launch implication

Marketing screenshots should match reality: mostly placeholders unless a licensed subset is shipped and disclosed.

---

## 4. Caching

### Browser

| Resource | Strategy |
|----------|----------|
| Hashed bundles | Immutable — safe forever in browser cache |
| `index.html` | Always revalidate — users get new chunk references after deploy |
| `localStorage` (XP, favorites, daily) | **Not** CDN — device-only; document in privacy copy |

### Service worker

**Not in v1.** Optional later for offline shell; adds cache invalidation complexity. SPA + CDN is enough for beta.

### Data bundle (app-specific)

Today football data ships inside JS chunks (`sample-data`, `nationalTeamData`). Deploying new data **requires** a new JS build — hashed filenames handle cache busting. When manifest split lands:

- Fetch versioned JSON at runtime.
- Cache with `Cache-Control` + `schemaVersion` / `dataAsOf` checks in app (future code change — planned only here).

### Stale content UX

Footer and `DataTrustNotice` already expose snapshot date — keep visible after every data deploy so users understand rosters are editorial, not live API.

---

## 5. Route handling

FootyBrain uses **React Router** (`BrowserRouter`) with client-side routes only. The server must **not** return 404 for deep links.

### Routes that must work on refresh

| Pattern | Example |
|---------|---------|
| Home | `/` |
| Browse / search entry | `/browse` |
| Entity profiles | `/player/:id`, `/team/:id`, `/league/:id`, `/national-team/:id` |
| Learning | `/collections/:id`, `/learning-paths/:id`, `/world-cup` |
| Modes | `/quiz`, `/daily`, `/compare`, `/saved`, `/profile` |
| Marketing/legal (planned) | `/privacy` |
| Catch-all | `*` → in-app `NotFoundPage` |

### SPA fallback configuration

**Cloudflare Pages** — `_redirects` in `public/`:

```
/*    /index.html   200
```

**Netlify** — same rule in `public/_redirects` or `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel** — `vercel.json` rewrite to `/index.html`.

### Reference: cache headers (recommended defaults)

Prefer configuring headers at the host (Pages/Netlify) rather than changing app code.

| Path | Header recommendation |
|------|------------------------|
| `/index.html` | `Cache-Control: no-cache` (or very short TTL) |
| `/assets/*` (hashed) | `Cache-Control: public, max-age=31536000, immutable` |
| `/images/*` | `Cache-Control: public, max-age=604800` (7d) initially; move to immutable once filenames are versioned/stable |
| `/data/*` (future runtime JSON) | `Cache-Control: public, max-age=300` (5m) + versioned URLs for deploy safety |

### Subpath hosting

If the app is served from `example.com/footybrain/` (not recommended for v1), set Vite `base: '/footybrain/'` and mirror in router `basename`. **Prefer apex domain** for simpler SEO and share links.

### Dev routes in production

`/dev/expanded-data` and `/dev/national-teams` are **routable today** but not in main nav. Before wide beta:

| Option | Action |
|--------|--------|
| **A (safest for public)** | Build-time strip or env-gated routes (future code) |
| **B (interim)** | Edge rule: return 404 for `/dev/*` on production hostname |
| **C (staging only)** | Allow on preview/staging; block on production |

### Trailing slashes

Pick one canonical style (no trailing slash) and enforce 301 at CDN if host adds slashes inconsistently.

---

## 6. SEO handling

The app is a **client-rendered SPA**. Crawlers that execute JavaScript will index content; others see mostly empty shell unless prerendering is added later.

### v1 (minimum viable SEO)

| Item | Action |
|------|--------|
| **`<title>` / meta description** | Per-route updates via React (future small change) or static defaults in `index.html` for launch |
| **Canonical URL** | `<link rel="canonical">` on production domain |
| **Open Graph / Twitter** | `og:title`, `og:description`, `og:url`, `og:image` (licensed or brand-only image) |
| **`robots.txt`** | Allow `/`; disallow `/dev/`; point to sitemap when ready |
| **`sitemap.xml`** | Static file listing high-value paths: `/`, `/browse`, `/world-cup`, `/collections`, major `/league/*`, `/national-teams` — regenerate per data release |
| **Structured data** | Optional `WebSite` + `SearchAction` JSON-LD on Home — low priority for v1 |
| **Honest copy** | Meta must not promise live scores, full World Cup sim, or photo-rich cards unless shipped |

### v1.5+ (not required for friends-and-family beta)

- Prerender critical routes (Vite SSR plugin, or prerender.io-style service).
- Dynamic OG for `/player/:id` (needs prerender or edge function).

### Indexing strategy for beta

| Phase | `robots.txt` |
|-------|----------------|
| Private preview | `Disallow: /` or noindex on staging |
| Limited public beta | Allow `/`; optional `noindex` until content sign-off |
| Production v1 | Allow; submit sitemap in Search Console |

---

## 7. Analytics

**Today:** No analytics SDK in the bundle ([PUBLIC_BETA_READINESS_AUDIT.md](./PUBLIC_BETA_READINESS_AUDIT.md)).

### Principles

- No PII collection in v1 (no accounts).
- If analytics are added, **disclose in `/privacy`** and name the vendor.
- Prefer **cookieless / privacy-friendly** tools to avoid heavy consent banners for a `localStorage`-only app (legal review still required for EU/UK).

### Recommended options (when ready)

| Tool | Use case | Notes |
|------|----------|-------|
| **Plausible** or **Fathom** | Page views, referrers, top paths | Lightweight script; EU-friendly positioning |
| **Cloudflare Web Analytics** | RUM-lite without third-party cookie | Free with Pages; limited product analytics |
| **GA4** | Deeper funnels | Heavier; IP anonymization + policy disclosure |

### Event taxonomy (define before enabling)

| Event | Purpose |
|-------|---------|
| `page_view` | Route changes (virtual) |
| `quiz_start` / `quiz_answer` | Engagement (no player names in payload) |
| `daily_complete` | Retention proxy |
| `collection_open` | Content interest |
| `search_open` | Discovery |

**Do not** send player names, emails, or raw `localStorage` contents to analytics.

### Beta sequence

1. **Closed preview** — no analytics (host access logs only).
2. **Limited beta** — optional Plausible/Fathom + 5–10 custom events.
3. **Public v1** — full taxonomy + dashboard review weekly.

---

## 8. Monitoring

### What to monitor (no backend in v1)

| Signal | Source |
|--------|--------|
| **Deploy success / rollback** | CI + host deploy logs |
| **CDN 4xx/5xx rate** | Cloudflare / Netlify dashboard |
| **Bandwidth & cache hit ratio** | CDN analytics |
| **Core Web Vitals** | CrUX (after traffic) or synthetic (PageSpeed, Checkly) |
| **Build size regression** | CI artifact size on `sample-data` chunk |
| **Uptime** | Better Uptime, Pingdom, or Cloudflare health check on `/` |

### Minimal monitoring stack (recommended)

- **Uptime + deep-link checks**: Better Uptime (or similar) hitting `/`, `/browse`, `/player/haaland`, `/world-cup`
- **Client error tracking**: Sentry (post-staging) for chunk load errors + runtime exceptions
- **Performance**: PageSpeed Insights / Lighthouse mobile snapshots per release tag

### Synthetic checks (post-staging)

Hit every release:

- `GET /` → 200
- `GET /browse` → 200 (SPA fallback)
- `GET /player/{known-id}` → 200
- `GET /quiz` → 200
- `GET /dev/expanded-data` → **404 on production** (if policy B)

### Alerts

| Condition | Action |
|-----------|--------|
| 5xx rate > 1% for 5 min | Page on-call |
| Deploy failed | Block promote to production |
| P95 LCP > 4s (synthetic mobile) | Investigate bundle size / lazy routes |

### Not in v1

- Server APM, database metrics, queue depth (no server).

---

## 9. Error tracking

Client-only errors dominate for a static SPA.

### Recommended: **Sentry** (or equivalent)

| Setting | Value |
|---------|-------|
| SDK | `@sentry/react` — add only when deploying (not in repo yet) |
| Environment | `staging` / `production` |
| PII | **Off** — scrub breadcrumbs; no `localStorage` dump |
| Sample rate | 100% staging; 10–25% production initially |
| Source maps | Upload in CI for readable stack traces (keep maps off public CDN) |
| Release | Tag with git SHA / `dataAsOf` |

### What to capture

- Uncaught exceptions
- React error boundary failures (if added)
- Failed dynamic `import()` (chunk load after deploy — signals cache mismatch)

### What not to capture

- User guesses in quiz, search queries with names (unless hashed/anonymized)
- Full player records

### Free alternatives for earliest preview

- Host/browser console only
- Optional: LogRocket session replay **only** after explicit consent — defer for v1

---

## 10. Beta rollout sequence

Aligned with [PUBLIC_BETA_READINESS_AUDIT.md](./PUBLIC_BETA_READINESS_AUDIT.md): **conditional limited public beta**, not broad marketing.

### Phase 0 — Local & CI (now)

- [ ] `npm run lint` + `npm run build` on release branch
- [ ] Validators green (`validate:app-ready-preview`, overlays, player images if manifest used)
- [ ] Manual smoke: Home, Browse, Quiz, Daily, Collections, Compare, World Cup hub, **25 national teams**
- [ ] **No deploy**

### Phase 1 — Private preview (password or unlisted URL)

- [ ] Create Cloudflare Pages / Netlify project; connect repo
- [ ] Deploy `staging` branch to preview URL
- [ ] Configure SPA fallback + HTTPS
- [ ] `robots.txt`: `Disallow: /`
- [ ] Invite 5–15 testers (editors, friends)
- [ ] Collect feedback doc; no analytics or Sentry optional

### Phase 2 — Staging on custom subdomain

- [ ] `staging.footybrain.com` → same build pipeline as production
- [ ] Block `/dev/*` at edge on production only (allow on staging if needed)
- [ ] Add `/privacy` page (static route + copy) — **gate before public beta**
- [ ] Enable Sentry on staging
- [ ] Synthetic uptime checks

### Phase 3 — Limited public beta (“Public beta” label in UI)

- [ ] Promote tagged release to production domain
- [ ] Footer: snapshot date, localStorage disclosure, link to privacy
- [ ] `robots.txt`: allow crawl; consider `noindex` meta until week 2
- [ ] Privacy-friendly analytics (optional)
- [ ] Sentry production sample rate on
- [ ] Share only in direct channels (Discord, X thread, friends) — **no paid ads**
- [ ] Monitor: 404 rate on deep links, chunk load errors, mobile LCP

### Phase 4 — Narrow public v1

- [ ] [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) sign-off
- [ ] Remove beta banner or soften to “Editorial database”
- [ ] `sitemap.xml` + Search Console
- [ ] OG tags for share cards
- [ ] Marketing matches scope (no live scores, no full WC mode claims)
- [ ] Optional: 30–50 licensed player images

### Phase 5 — Scale & split (post-v1)

- [ ] CDN manifest / league lazy load per [PERFORMANCE_SCALING_PLAN.md](./PERFORMANCE_SCALING_PLAN.md)
- [ ] `cdn.` image hostname
- [ ] Prerender or SSR for SEO on top profiles
- [ ] Firebase only after PROJECT_BRIEF gates 1–5

---

## 11. Safest first public release plan

**Goal:** One honest, stable URL for learners — not maximum traffic on day one.

### Week-zero (minimum deploy — still only after Phase 3 checklist)

| Step | Owner | Done when |
|------|-------|-----------|
| 1 | Eng | Production host connected; SPA fallback verified |
| 2 | Eng | `main` tag built; `dist/` promoted |
| 3 | Content | `dataAsOf` matches release notes |
| 4 | Legal/trust | `/privacy` live; localStorage explained |
| 5 | Eng | `/dev/*` blocked on production |
| 6 | QA | Mobile smoke iOS Safari + Android Chrome |
| 7 | Product | Home hero + World Cup hub say “prep / editorial / not live API” |

### What ships in “first public”

- Static app only
- Same feature set as today (browse, quiz, daily, collections, **25 national teams**, World Cup prep hub)
- Placeholder images OK with policy compliance
- No accounts, no Firebase, no live fixtures API

Update for current build: **25 live national teams** are in-product; World Cup remains **prep-only**.

### What explicitly does **not** ship

- Firebase Auth / Firestore
- Live scores, brackets, fixture feeds
- Women's soccer coverage
- Full marketing blast / paid acquisition
- Scraped or unlicensed player photos

### Rollback plan

| Scenario | Action |
|----------|--------|
| Bad deploy (white screen) | Revert to previous Pages deployment (one click) |
| Bad data merge | Redeploy previous git tag; announce snapshot rollback |
| CDN misconfiguration (404 on routes) | Fix `_redirects`; purge cache |
| Spike in Sentry errors | Roll back; hotfix forward |

### Success metrics (first 30 days)

- Crash-free sessions > 99%
- Deep-link 404 rate < 0.5% (excluding bad bookmarks)
- Median mobile LCP < 3.5s on Home (synthetic + spot Real User Monitoring)
- Qualitative: quiz/daily completable without empty-pool dead ends on featured nations
- Zero copyright / image policy incidents

---

## 12. Pre-deploy checklist (consolidated)

Use this before **any** production URL is shared outside the team.

### Engineering

- [ ] `npm run lint` && `npm run build` pass on release commit
- [ ] SPA fallback: refresh `/player/{id}`, `/quiz`, `/collections/{id}` returns app shell
- [ ] Hashed assets cache immutable; `index.html` not long-cached
- [ ] No secrets in `dist/` bundle
- [ ] Production: `/dev/*` blocked or routes stripped

### Trust & legal

- [ ] `/privacy` published and linked from footer
- [ ] `dataAsOf` / trust copy visible (Browse, footer)
- [ ] World Cup = prep only in user-facing copy
- [ ] [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) satisfied for any non-placeholder images

### Observability

- [ ] Sentry (or equivalent) configured for production with PII scrubbing
- [ ] Uptime check on `/`
- [ ] Analytics (if any) named in privacy policy

### SEO & discovery

- [ ] `robots.txt` intentional for phase (disallow vs allow)
- [ ] Canonical domain chosen (apex vs www)
- [ ] Share preview smoke test (OG tags when added)

### Product

- [ ] Smoke script run on staging
- [ ] Scope matches [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) — men's learning DB, not live sports app
- [ ] Sign-off owner recorded ([PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md))

---

## Document map

| Question | Read |
|----------|------|
| What must content achieve before launch? | [PRODUCTION_LAUNCH_PLAN.md](./PRODUCTION_LAUNCH_PLAN.md), [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) |
| Is beta ready today? | [PUBLIC_BETA_READINESS_AUDIT.md](./PUBLIC_BETA_READINESS_AUDIT.md) |
| How do images work? | [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) |
| When does data move to CDN shards? | [PERFORMANCE_SCALING_PLAN.md](./PERFORMANCE_SCALING_PLAN.md) |
| **How do we deploy and operate?** | **This document** |

---

*Planning only. No hosting accounts, DNS, or production deploy are authorized by this document alone.*
