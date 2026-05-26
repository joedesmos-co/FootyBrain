# National Team Quiz Audit (Wave 3 preview)

Generated: 2026-05-26  
Scope: **49 nations** in `generated-data/national-teams-preview.json` (Wave 1–3). **25 nations live** in app (`nationalTeamLive.json`). Frontend-only; no Firebase/APIs.

Scripts: `npm run build:national-teams-preview` → `npm run report:national-teams-wave3`

## Executive summary

- **Live (25):** Wave 1 (5) + Wave 2 (20) — unchanged by Wave 3 staging.
- **Preview-only (24):** Wave 3 nations — **not** in `LIVE_NATIONAL_TEAM_IDS` until individual promotion.
- **Quiz gate:** ≥ **3 quiz-ready** linked players per nation (`QUIZ_MIN_SESSION_POOL` / rollout `quizMinLive: 3`).
- **Link gate (rollout):** ≥ **8** combined linked players (`linkedMinHealthy: 8`) for “healthy” promotion.
- **26 / 49** nations pass all rollout “safe to live” checks; **8** are new Wave 3 candidates.
- **Duplicate surname blockers:** Brazil (`pedro`×2), Argentina (`martinez`×2) — already live; disambiguation recommended before relying on last-name-only answers.

## Quiz-ready counts by nation (registry + preview links)

Counts from `generated-data/national-teams-wave3-rollout-summary.json` (simulates live backfill + preview links).

### Tier A (18+ quiz-ready)

| Nation | Quiz-ready | Linked | Live? |
|--------|----------:|-------:|-------|
| England | 35 | 35 | yes |
| Spain | 29 | 29 | yes |
| France | 25 | 25 | yes |
| Germany | 22 | 22 | yes |
| Netherlands | 22 | 22 | yes |
| Brazil | 35 | 35 | yes (dup surname risk) |
| Argentina | 19 | 19 | yes (dup surname risk) |

### Tier B (9–17)

| Nation | Quiz-ready | Linked | Live? |
|--------|----------:|-------:|-------|
| United States | 9 | 9 | yes |
| Belgium | 12 | 12 | yes |
| Portugal | 10 | 10 | yes |
| Italy | 9 | 9 | yes |
| Croatia | 7 | 7 | yes |
| Denmark | 6 | 6 | yes |
| Switzerland | 5 | 5 | yes |
| Japan | 5 | 5 | yes |
| Uruguay | 4 | 4 | yes |
| Morocco | 4 | 4 | yes |
| Senegal | 4 | 4 | yes |
| Ghana | 4 | 28 | **preview — promote** |
| Norway | 4 | 23 | **preview — promote** |
| Algeria | 4 | 14 | **preview — promote** |

### Tier C (3 — viable minimum)

| Nation | Quiz-ready | Linked | Live? |
|--------|----------:|-------:|-------|
| Colombia | 3 | 3 | yes |
| Nigeria | 3 | 3 | yes |
| Poland | 3 | 18 | **preview — promote** |
| Austria | 3 | 21 | **preview — promote** |
| Ukraine | 3 | 11 | **preview — promote** |
| Scotland | 3 | 11 | **preview — promote** |
| Paraguay | 3 | 17 | **preview — promote** |

### Below gate (&lt;3 quiz-ready) — not viable for nation-only quiz

**Live but weak (already shipped in Wave 2):** Serbia (0), Mexico (1), Chile (1), Turkey (0), South Korea (2).

**Wave 3 preview-only:** Sweden (2), Czechia (2), Republic of Ireland (2), Cameroon (2), Côte d'Ivoire (2), Wales (1), Egypt (1), Tunisia (1), Canada (1), Australia (0), IR Iran (0), Saudi Arabia (0), Qatar (0), Costa Rica (0), Ecuador (0), Peru (0).

## Unmatched-player issues

- **528** TM NT-parent squad rows are **unmatched** (not in `sampleData.js` by TM `spieler` id).
- **Policy:** mark `previewOnly`; do **not** force into `sampleData.js`.
- High unmatched volume (editorial backlog, not a linker bug): Qatar (51), Peru (61), Egypt (40), Costa Rica (37), Republic of Ireland (28), Algeria (27), Wales (20), Australia (14), IR Iran (13).

## Duplicate-name risks

| Nation | Surname | Count | Status |
|--------|---------|------:|--------|
| Brazil | pedro | 2 | live — false-positive risk on last-name-only |
| Argentina | martinez | 2 | live — same |

No other nations exceeded the duplicate-surname gate in the Wave 3 report.

## Recommended live rollout order (Wave 3 only)

After Wave 2’s 25 nations, promote **in this order** (all pass preview gates):

1. Norway  
2. Ghana  
3. Algeria  
4. Poland  
5. Austria  
6. Ukraine  
7. Scotland  
8. Paraguay  

**Defer:** all other Wave 3 nations until quiz-ready ≥ 3 and linked ≥ 8; resolve TM entity gaps for Cameroon and Côte d'Ivoire.

## Safe fixes already in app (prior audit)

- National-team quiz dropdown disables nations with &lt;3 quiz-ready players.
- Surname suffix handling (`Jr`, `III`, …) in `quizSession.js`.
- International Today’s Picks samples across live nations.

## Major international coverage?

**Yes, approaching in preview:** 49 men’s nations staged with TM metadata + registry joins. **Live product:** 25 nations — strong UEFA/CONMEBOL core, thin CONCACAF/Africa/Asia on several Wave 2 and most Wave 3 sides. World Cup mode remains **off**.

## Related

- [NATIONAL_TEAM_PLAN.md](./NATIONAL_TEAM_PLAN.md) §13  
- [WORLD_CUP_ROADMAP.md](./WORLD_CUP_ROADMAP.md)  
- `generated-data/national-teams-wave3-rollout-summary.json`
