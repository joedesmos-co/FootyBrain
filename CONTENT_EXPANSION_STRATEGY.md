# FootyBrain content expansion strategy (Phase 1)

Controlled expansion for four leagues only: **Premier League**, **La Liga**, **Bundesliga**, **Serie A**.

## Targets (Phase 1)

| Metric | Target |
|--------|--------|
| Clubs | 20–30 (config: `editorial-overlays/phase1-clubs.json`, currently 24) |
| Players | 120–180 total in `sampleData.js` |
| Editorial MVP | 36 players (unchanged ids/slugs) |
| Generated squad | Browseable rows, capped per club |

## Pipeline (do not skip)

1. **`npm run build:data-preview`** — TM scraper → `generated-data/footybrain-preview-data.json` (facts only, no editorial dump).
2. **`npm run build:app-ready-preview`** — MVP overlay + curated TM rows → `footybrain-app-ready-preview.json`.
3. **`npm run validate:overlays`** + **`npm run validate:app-ready-preview`** — schema and safety checks.
4. **`npm run merge:phase1-sample`** — writes curated live data to `src/data/sampleData.js`.
5. **`npm run build`** + **`npm run lint`** — app still compiles.

Curation rules live in `scripts/phase1-curation.js` (max 7 seniors per club, age ≥ 19, dedupe names within club, global cap 180).

## Phased rollout

| Phase | What ships | Quiz / daily |
|-------|------------|--------------|
| **1a (this pass)** | 24 clubs, ~150 players in app; generated profiles stubbed | Quiz + daily use **editorial pool only** (36 MVP) |
| **1b** | Editorial overlay for high-profile generated ids (`players.manual.json` or per-id files) | Flip `quizEligible: true` after review |
| **2** | More clubs or Ligue 1 / UCL snippets | Same gates |
| **3** | API/Firebase (out of scope now) | Server-side eligibility rules |

## Editorial coverage

- **MVP (36):** full `quickFact`, `quizHints`, `playingStyle`, `careerHistory` in overlay + sampleData.
- **Generated:** factual fields from preview; placeholder `quickFact` for browse; **empty `quizHints`** until reviewed.
- **New clubs (16):** short stub copy in `phase1-clubs.json`; MVP clubs keep existing long-form team pages.

Never paste raw Transfermarkt HTML, market values, or image URLs into the app.

## Quiz eligibility

A player is in quiz/daily pools only when:

1. `quizEligible !== false`, and  
2. At least **2** `quizHints` and a substantive `quickFact` (`src/utils/quizEligibility.js`).

Generated rows default to `quizEligible: false`. MVP rows inherit overlay flags (all `true` today).

## Duplicate handling

- **Within club (export):** normalized display name dedupe when curating TM squads.
- **Global duplicate names:** logged in preview `suspiciousMappings`; do not enable quiz until disambiguated in overlay notes.
- **Ids:** MVP slugs unchanged; new players use `tm-{sourceId}` from app-ready merge.

## Remaining risks

- TM club code drift (unmatched clubs in preview build).
- Placeholder copy on generated profiles until 1b editorial pass.
- Compare/search load with ~150+ cards (monitor mobile scroll).
- Same last name across clubs (e.g. two "Silva"s) — quiz pool stays MVP-only until reviewed.

See also: `DATA_MERGE_PLAN.md`, `editorial-overlays/README.md`, `DATA_IMPORT_NOTES.md`.
