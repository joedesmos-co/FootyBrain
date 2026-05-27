# Public beta readiness audit (FootyBrain)

> **Date:** 2026-05-26  
> **Scope:** Trust, UX polish, privacy, mobile, onboarding, discovery, accessibility, errors — per [PROJECT_BRIEF.md](./PROJECT_BRIEF.md).  
> **App state:** Frontend-only React + Vite · **2,331** players · **105** clubs · **8** leagues · **368** quiz-eligible · **7** live national teams · World Cup prep hub (no live scores) · `localStorage` progression.

**Related:** [BETA_READINESS_REVIEW.md](./BETA_READINESS_REVIEW.md) · [PUBLIC_READINESS_CHECKLIST.md](./PUBLIC_READINESS_CHECKLIST.md) · [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md)

---

## Verdict

| Audience | Recommendation |
|----------|----------------|
| **Broad public marketing beta** | **Not yet** — uneven quiz depth (MLS/Brasileirão), no licensed photos, pre-Firebase content gates incomplete. |
| **Limited / friends-and-family public beta** | **Conditional go** — with “public beta” labeling, snapshot-date copy, and no live-tournament promises. |
| **Firebase / accounts** | **Correctly deferred** per project brief. |

**Overall:** 🟡 **Conditional limited public beta** · 🔴 **Not ready for open marketing at scale**

---

## Audit by area

### Trust / transparency

| Check | Status | Notes |
|-------|--------|-------|
| “Sample / not live API” messaging | ✅ Improved | `DataTrustNotice` on Browse + squad views; footer snapshot date |
| `dataAsOf` visible to users | ✅ | Home hero, footer, trust notice |
| Importance Score vs EA ratings | ✅ | Own metric; brief states editorial nature |
| World Cup = prep not live scores | ✅ | Hub copy explicit |
| Dev routes in production build | ⚠️ | `/dev/*` still routable — hide behind env or robots for wide beta |
| Editorial / TM pipeline disclosure | ⚠️ | Dev pages only; consumers may not know data provenance |

### Loading states

| Check | Status | Notes |
|-------|--------|-------|
| Lazy route `Suspense` + `PageFallback` | ✅ | All major routes |
| `aria-live` / `aria-busy` on fallback | ✅ Fixed | `PageFallback` + search open overlay |
| Universal Search lazy load | ✅ Fixed | “Opening search…” overlay (was `null`) |
| Home below-fold lazy | ✅ | `HomeBelowFold` suspense |
| Skeleton / shimmer | ❌ | Text-only loading (acceptable for beta) |

### Empty states

| Check | Status | Notes |
|-------|--------|-------|
| Browse no results | ✅ | Clear copy + filter hint |
| Saved empty | ✅ | Actions to browse / quiz |
| Squad empty | ✅ | Per-team message |
| Profile / collection not found | ✅ | Back links |
| Search no results | ✅ | Universal Search empty + pending state |
| Compare empty | ✅ | “Choose two players” |

### Stale roster messaging

| Check | Status | Notes |
|-------|--------|-------|
| Snapshot date on consumer paths | ✅ Fixed | Browse + `TeamSquadView` trust notice |
| “Not live transfers” | ✅ Fixed | Trust notice copy |
| Manual MVP vs TM drift | ⚠️ | Validators flag; not shown per-player |
| National membership lag | ⚠️ | Linked squads; explain on NT pages |

### Privacy readiness

| Check | Status | Notes |
|-------|--------|-------|
| No accounts / no server sync | ✅ | By design |
| `localStorage` disclosure | ✅ Fixed | Footer + trust notice + onboarding intro |
| Dedicated privacy policy page | ❌ | Footer summary only — add `/privacy` before wide launch |
| Analytics / third-party trackers | ✅ | None observed in app shell |
| Recently viewed (local) | ✅ | Search panel; same storage boundary |

### Mobile quality

| Check | Status | Notes |
|-------|--------|-------|
| Responsive filters / grids | ✅ | Breakpoints at 700px / 420px |
| 16px form inputs (iOS zoom) | ✅ |
| Touch targets (nav, search) | ✅ | Recent pass (~2.75rem) |
| Collection scroll weight | ✅ Improved | Thumb visuals + `content-visibility` |
| Navbar density on 320px | ⚠️ | Horizontal scroll on links — acceptable |

### Onboarding clarity

| Check | Status | Notes |
|-------|--------|-------|
| `/onboarding` tour | ✅ | Steps + optional preferences |
| Skip to home | ✅ |
| Device-only preferences | ✅ | Stated on save + intro |
| First-visit redirect to onboarding | ❌ | User must find “How it works” |
| Beta / snapshot expectation | ✅ Improved | Onboarding intro line |

### Discoverability

| Check | Status | Notes |
|-------|--------|-------|
| Universal Search | ✅ | Players, clubs, leagues, NTs |
| Recently viewed | ✅ | Empty search state |
| Collections / paths / World Cup hub | ✅ |
| Home feature grid | ✅ | Lazy below-fold |
| Compare / Daily in nav | ✅ |

### Accessibility

| Check | Status | Notes |
|-------|--------|-------|
| Focus visible | ✅ | Global outline styles |
| Dialog search (`role="dialog"`) | ✅ | Universal Search |
| Combobox patterns | ✅ | Autocomplete + search |
| Alt text on visuals | ✅ | `PlayerVisual` / badges |
| Reduced motion | ✅ | CSS media query |
| Formal WCAG audit | ❌ | Not run |

### Error handling

| Check | Status | Notes |
|-------|--------|-------|
| Unknown player/team/league | ✅ | Empty state + back link |
| Unknown URL | ✅ Fixed | `NotFoundPage` catch-all route |
| React error boundary | ❌ | No global boundary — chunk load fail = white screen risk |
| `localStorage` quota / private mode | ⚠️ | Hooks fail silently; in-memory fallback |

---

## Blockers (do not market as “complete product”)

1. **Unequal learning depth** — MLS / Brasileirão mostly browse-only; many EU clubs below 5 quiz-ready players.
2. **No licensed player photos** — Placeholders only (policy-safe but thin for marketing).
3. **Pre-Firebase roadmap gates 1–5 incomplete** — Germany/Netherlands live but wave 2; World Cup is prep hub only.
4. **No formal privacy policy URL** — Footer disclosure is a stopgap.
5. **Dev preview routes public** — `/dev/expanded-data` exposes pipeline jargon.

---

## Fixes made (this pass — top 5 safest)

1. **Keyboard accessibility** — Added a global “Skip to content” link (focus-visible) targeting `#main-content`.
2. **Stale roster transparency** — Added `DataTrustNotice` (compact) to player, club, league, and national-team profile pages (not just Browse).
3. **Empty state recovery (Browse)** — “No players match” now includes a one-click **Clear filters** action and uses a semantic empty-state section.
4. **Empty state recovery (Team Learning)** — “No teams match” now includes **Clear filters** and uses a semantic empty-state section.
5. **Discovery clarity (nation → club)** — National-team pages now highlight the top clubs represented in the linked squad, providing a guided jump from country learning to club learning.

---

## Safest beta path

1. **Ship limited public beta** with footer + trust copy; label “Public beta” in release notes.
2. **Audience:** Football learners OK with snapshot data — friends, Discord, small landing page — not paid ads at scale.
3. **Before widening launch:** Add `/privacy` page; gate or remove `/dev/*` routes; run iOS Safari + Android Chrome smoke on Browse → Profile → Quiz → Daily.
4. **Do not promise:** Live scores, transfer ticker, photo-rich cards, or full World Cup tournament mode.
5. **Next product wins (post-beta):** MLS/Brasileirão editorial wave, licensed image pilot, Germany/USA NT pages, optional first-visit onboarding redirect.

---

## Quick test plan (pre-release)

- [ ] Home → Browse → club squad → player profile (trust notice visible)
- [ ] Navbar search → type → open result (loading overlay once)
- [ ] Invalid URL `/foo` → not-found page
- [ ] Daily + Quiz on mobile width 390px
- [ ] Clear site data → favorites/XP reset (expected)

---

*Audit performed against the codebase on 2026-05-26. Re-run after major data merges or new public routes.*
