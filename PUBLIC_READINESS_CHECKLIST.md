# FootyBrain — public readiness checklist (pre-Firebase)

> **Purpose:** Gate public deployment and marketing until men’s learning content, quality, and compliance are ready—**without** adding Firebase, accounts, or live soccer APIs yet.  
> **Authority:** [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) pre-Firebase roadmap (phases 1–5 before phase 6 accounts).  
> **Scope:** Men’s soccer only until this checklist and the brief are explicitly replanned.

**How to use:** Treat each section as a release gate. Check items only when verified (manual QA, scripts, or editorial sign-off). A section can be “in progress” for internal beta but must be complete for **public** launch unless marked optional.

**Related plans:** [ROADMAP.md](./ROADMAP.md) · [MLS_BRASILEIRAO_EXPANSION_PLAN.md](./MLS_BRASILEIRAO_EXPANSION_PLAN.md) · [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) · [WORLD_CUP_ROADMAP.md](./WORLD_CUP_ROADMAP.md) · [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md)

---

## Data coverage goals (men’s)

High-level targets before calling FootyBrain “public-ready” for football learning (not a live scores product).

| Goal | Target | Rationale |
|------|--------|-----------|
| **Single player registry** | One `players.id` per human; no NT-parent or WC-only clones | Saves, compare, search, quiz integrity |
| **Quiz-eligible depth** | Enough editorial quiz-ready players per priority league/club/nation to run fair quizzes (≥3–5 per scoped session) | Quiz, Daily, Collections depend on hints + `quickFact` |
| **Browse completeness** | Priority clubs have representative squads (browse-only OK; quiz subset editorial) | Learners expect rosters, not 3-name clubs |
| **National linkage** | Major NTs use `nationalMemberships` + live pages, not nationality string alone | Country learning and WC mode |
| **Freshness honesty** | `meta.dataAsOf` or copy where squads are snapshots, not live TM | Trust when transfers happen |
| **Validation green** | `npm run build`, `npm run lint`, `validate:app-ready-preview`, national validators pass on release branch | No silent broken IDs |

---

## Men’s club coverage checklist

Aligns with PROJECT_BRIEF gates **#1 (major clubs)**, **#2 (MLS)**, **#3 (Brasileirão)**.

### Priority leagues (editorial + data)

- [ ] Priority European top flights adequately represented (Premier League, La Liga, Serie A, Bundesliga, Ligue 1) — not thin placeholders per big club
- [ ] MLS clubs and players merged and browseable ([PHASE4_MLS_BRAZIL_PLAN.md](./PHASE4_MLS_BRAZIL_PLAN.md))
- [ ] Brasileirão (Serie A) clubs and players merged and browseable
- [ ] Every `players[].teamId` / `leagueId` resolves; every `teams[].leagueId` resolves
- [ ] No duplicate `players.id` or duplicate `tm-*` source IDs in registry
- [ ] Surname ambiguity report run for major quiz pools (`validate:squad-report` / app-ready preview)

### Club product surfaces

- [ ] Browse: league/club filters and search work on expanded dataset
- [ ] `/team/:teamId` — facts, fan guide, squad, quiz link where quiz-ready ≥ threshold
- [ ] `/league/:leagueId` — club grid, featured players, league quiz where viable
- [ ] `/player/:playerId` — club, league, position, importance score; browse-only note when not quiz-eligible
- [ ] Compare players/clubs works on new IDs
- [ ] Collections referencing clubs/leagues resolve 100% of items

### Club quiz & learning

- [ ] Quiz Mode: league and club filters behave correctly on production data
- [ ] Daily Challenge: club- and league-themed days draw only from quiz-eligible pools (≥5 players per themed entity)
- [ ] Quiz hints avoid volatile “just transferred” as sole clue ([ROSTER_FRESHNESS_PLAN.md](./ROSTER_FRESHNESS_PLAN.md) if present)

---

## National-team coverage checklist

Aligns with PROJECT_BRIEF gate **#4**. Wave 1 may ship before full 12-nation coverage; public launch should state what is live.

### Data & integrity

- [x] Wave 1 live nations in app: `brazil`, `france`, `england`, `germany`, `united-states` (`nationalTeamLive.json`)
- [x] `nationalMemberships` — one membership row per `playerId` (no cross-nation duplicate registry rows verified)
- [ ] Registry backfill: famous quiz-ready players with matching nationality have membership rows (not TM-preview links only)
- [ ] Wave 2 nations planned/shipped as needed: `spain`, `argentina`, `netherlands`, `mexico` (per [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md))
- [ ] Per-nation surname collision check before enabling nation quiz at scale
- [ ] Validator: squad/membership `playerId` ⊆ `players[]`; no import of unmatched TM NT-squad rows as new players

### Routes & discovery

- [x] `/national-teams` hub — database-style copy (no dev-only notes)
- [x] `/national-team/:nationalTeamId` — country guide, squad (`TeamSquadView` national variant), rivals
- [ ] Discoverability: intentional entry from Browse, Home, or main nav (currently partial — search + browse link)
- [x] `/dev/national-teams` remains dev-only, not linked from main nav

### Integrations (post wave 1)

- [x] Universal Search: `national-team` result type, aliases (`usa` → `united-states`, etc.)
- [x] Player profile: club + league links; national team link when live membership exists; plain text otherwise
- [x] Quiz Mode: `nationalTeam` filter + `/quiz?nationalTeam=`; min pool empty states
- [x] Collections: national-team item type; WC/Europe/South America/USMNT collections
- [x] Daily Challenge: occasional national-team themed days (≥5 quiz-ready linked players per nation)

### Copy & UX consistency

- [x] Wording: “national team” preferred over mixed “country” in filters (audit pass)
- [ ] Non-live rivals shown as text, not 404 links (e.g. Argentina until page ships)
- [ ] Large NT squads (400+): acceptable scroll or documented pagination follow-up

---

## World Cup Mode checklist

Aligns with PROJECT_BRIEF gate **#5**. Collections and Daily can tease WC before full mode ships.

### Data (not shipped until checked)

- [ ] `competitions.world-cup-2026` editorial shell (hosts, format, dates text)
- [ ] `competitionSquads[]` — curated `playerId` only; validator subset of `players[]`
- [ ] `qualifiedNationalTeamIds` aligned with live national pages (expand beyond wave 1 when marketed as “48 teams”)
- [ ] `competitionGroups[]` when draw fixed (optional for first WC MVP)
- [ ] `tournamentHistory[]` — 3+ past editions, editorial only

### UI routes ([WORLD_CUP_ROADMAP.md](./WORLD_CUP_ROADMAP.md))

- [ ] `/world-cup` — mode hub
- [ ] `/world-cup/teams` — nations (+ groups tab when data exists)
- [ ] `/world-cup/quiz` — launcher → Quiz Mode params
- [ ] `/world-cup/history` — edition cards
- [ ] Country guides remain `/national-team/:id` (no duplicate country URLs)
- [ ] Search: `competition` result type → WC hub (optional)

### Quiz & collections

- [ ] `/quiz?competition=world-cup-2026` when squads curated
- [ ] World Cup Watchlist collection quiz launch or clear CTA to nation quiz
- [ ] No FIFA/trademark logos without license (text-only tournament branding)

---

## Image & legal checklist

See [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) and [ROADMAP.md](./ROADMAP.md) legal section.

### Images & trademarks

- [ ] No Transfermarkt or scraped headshot URLs in `imageUrl`
- [ ] Player images only from app-hosted paths, owned CDN, or CC with `imageCredit` / `imageLicense`
- [ ] Club crests / FIFA World Cup marks / official NT badges not used without license (abstract `badgeTheme` OK)
- [ ] `npm run validate:overlays` passes on release data

### Ratings & copy

- [ ] No EA FC / FIFA / proprietary third-party ratings — **Importance Score** only
- [ ] Fan guides, quick facts, and quiz hints are original or source-reviewed prose
- [ ] No defamatory or sensitive personal claims on player pages

### Data sourcing

- [ ] TM/scraper used for facts with documented merge rules; no redistribution of scraped photos
- [ ] Public site copy does not imply official affiliation with FIFA, clubs, or leagues

---

## Performance checklist

Frontend-only app; bundle size and list scale matter at public launch.

### Build & bundle

- [ ] `npm run build` succeeds with no errors
- [ ] Production chunk strategy acceptable (consider lazy routes for dev-only pages — already split for dev NT preview)
- [ ] No accidental import of full raw TM JSON into client bundle

### Runtime

- [ ] Browse search/filter responsive on ~1,500+ player registry (target scale post-expansion)
- [ ] National team squad lists: `content-visibility` or pagination if p95 scroll jank on mobile
- [ ] Universal Search remains usable at MIN_PLAYER_QUERY_LENGTH ≥ 2
- [ ] Daily + quiz pool builders do not block UI on main thread (memoized / precomputed where needed)

### Data loading

- [ ] `nationalTeamLive.json` / future `worldCupLive.json` size documented; single edition per lazy load if WC JSON grows

---

## Mobile checklist

PROJECT_BRIEF: mobile-friendly design.

### Layout

- [ ] Navbar usable on 320px width (wrap, tap targets)
- [ ] Browse filters and quiz filters stack without horizontal overflow
- [ ] Player profile hero and national team profile hero readable on small screens
- [ ] National teams hub cards stack (`national-teams-page__card` mobile rules)
- [ ] Collections detail rows and Daily Challenge pips usable one-handed
- [ ] Universal Search panel fits viewport; keyboard does not obscure input

### Touch & interaction

- [ ] Primary CTAs ≥ ~44px touch target where feasible
- [ ] No hover-only critical actions

---

## Accessibility checklist

### Perceivable & operable

- [ ] Focus visible on links, buttons, filters, quiz form, search dialog
- [ ] Color contrast meets WCAG AA for body text and accent on dark theme (spot-check with tooling)
- [ ] Images: `imageAlt` or `PlayerVisual` aria labels on profile visuals
- [ ] Quiz feedback and Daily timer use `role="status"` / `aria-live` where implemented

### Keyboard

- [ ] Universal Search: Escape closes; arrows navigate results; Enter selects
- [ ] Quiz answer flow completable without mouse
- [ ] Skip link considered if main nav + hero repetition grows (optional for v1 public)

### Screen readers

- [ ] Page titles and h1 reflect route (national team vs club team)
- [ ] Empty states announced (quiz pool, daily blocked, 404 national team)

---

## Privacy & localStorage checklist

No accounts yet — all persistence is device-local.

### What is stored locally

| Key / area | Data | Notes |
|------------|------|--------|
| `footybrain:daily` | Daily completion, streak, per-question results | No PII |
| Progression / XP | Level, XP, achievements | [hooks/useProgression.js](./src/hooks/useProgression.js) |
| Favorites | Saved player/team IDs | Device-only |
| Collection progress | Viewed/learned item indices | Per collection |
| Onboarding preferences | Optional league/club prefs | If enabled |

### Public deployment requirements

- [ ] Privacy policy or landing copy states: **no account**, data stored in **browser localStorage**, clearing site data resets progress
- [ ] No collection of email, name, or location without consent (none in app today)
- [ ] Third-party analytics (if added) disclosed in privacy copy — **none required for pre-Firebase gate**
- [ ] Cookie banner only if non-essential cookies added (localStorage-only may not need EU cookie banner — legal review)
- [ ] Link to contact / feedback for data questions before public marketing

### Security (static hosting)

- [ ] No API keys or secrets in client bundle
- [ ] HTTPS enforced on production host
- [ ] `localStorage` not used for sensitive secrets

---

## Firebase & account readiness checklist

**Do not add Firebase until this section is intentionally executed** after all pre-Firebase content gates above are met.

### Pre-conditions (from PROJECT_BRIEF)

- [ ] Major men’s club coverage — substantially complete
- [ ] MLS — in dataset and learning surfaces
- [ ] Brasileirão — in dataset and learning surfaces
- [ ] Major men’s national teams — learning surfaces complete for agreed nation set
- [ ] World Cup Mode — shipped or explicitly deferred with public copy

### Firebase work (future — not for public v1)

- [ ] Product decision: auth providers (email, Google, etc.)
- [ ] Firestore schema for favorites, quiz history, daily streak, collection progress
- [ ] Security rules: user-private writes; public read-only football content
- [ ] Migration path from `localStorage` keys to `users/{uid}/…`
- [ ] Privacy policy updated: account data, deletion, export
- [ ] Admin tooling for content edits (optional)
- [ ] Cost and quota monitoring

---

## Must be true before public deployment

Minimum **go / no-go** list. All should be checked `[x]` for a broad public launch (friends-and-family beta can relax optional items if labeled “beta”).

### Product & content

1. [ ] **Men’s-only scope** clear in UI copy (no implied women’s NT/club coverage).
2. [ ] **No broken routes** for linked entities in Home, Browse, Quiz, Daily, Collections, national teams.
3. [ ] **Quiz-eligible** players only in Quiz, Daily themed pools, and collection quiz CTAs.
4. [ ] **Single registry** — validators confirm no duplicate player IDs.
5. [ ] **National team pages** — only link live nations; plain text for others.
6. [ ] **World Cup** — either shipped with honest scope or not linked from marketing as full tournament sim.

### Engineering

7. [ ] `npm run build` and `npm run lint` pass on release tag.
8. [ ] `npm run validate:app-ready-preview` (or stricter release validator) pass.
9. [ ] No dev-only routes linked from production nav (`/dev/*`).
10. [ ] Error/empty states for quiz, daily, search, 404 profiles.

### Legal & trust

11. [ ] [PLAYER_IMAGE_POLICY.md](./PLAYER_IMAGE_POLICY.md) compliance verified on shipped players.
12. [ ] No proprietary ratings; Importance Score labeling consistent.
13. [ ] Privacy/localStorage disclosure published (page or footer link).

### Experience

14. [ ] Smoke-tested on mobile (iOS Safari, Android Chrome) and desktop.
15. [ ] Core flows keyboard-accessible: search, quiz answer, daily complete, save favorite.
16. [ ] Performance acceptable on mid-tier phone with full player count.

### Explicitly out of scope for public v1

- Firebase Authentication or Firestore sync
- Live scores, fixtures API, or bracket simulation
- Women’s soccer
- Official FIFA / club trademark artwork without license

---

## Suggested sign-off order

1. Run validators and fix data regressions.  
2. Complete club + national + WC sections for the target launch narrative.  
3. Pass image/legal and privacy review.  
4. Mobile + accessibility spot-check.  
5. Performance check on production build.  
6. Review **Must be true before public deployment** with a single owner sign-off.  
7. Only after that — plan Firebase (phase 6) separately.

---

*Last aligned with national-team wave 1, quiz/collections/daily integration, and PROJECT_BRIEF pre-Firebase gates. Update checkboxes as the release branch evolves.*
