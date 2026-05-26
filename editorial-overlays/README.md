# Editorial overlays

Human-maintained learning content for FootyBrain players and club expansion config. Separates **app-owned pedagogy** from **machine-generated factual data** (Transfermarkt preview / core).

See [DATA_MERGE_PLAN.md](../DATA_MERGE_PLAN.md) for the full layer model.

## Files

| File | Purpose |
|------|---------|
| `players.manual.json` | MVP **36** players — `quickFact`, `quizHints`, `playingStyle`, `importanceScore`, optional TM `sourceId` |
| `players.generated-draft.json` | **Approved** generated-player editorial (332+ rows) — merged via `build:app-ready-preview` |
| `phase1-clubs.json` … `phase3-clubs.json` | Expansion club lists (required phase1; others optional) |
| `phase4-mls-clubs.json` | MLS club expansion |
| `phase4-brasileirao-clubs.json` | Brasileirão club expansion |
| `phase4-clubs.json` | Legacy phase4 TM codes (preview build only — not in merge loader) |
| `expansion-club-identity-stubs.json` | Rich fan identity for priority expansion clubs |
| `*-editorial-backlog.json` | Suggested approval targets for batch scripts (not loaded at runtime) |

Canonical paths for scripts: `scripts/lib/data-pipeline-paths.js`.

## What belongs here

- Display names, quiz hints, quick facts, playing style, FootyBrain `importanceScore`
- Flags: `quizEligible`, `rosterTier`, `reviewStatus` (draft)
- Maintainer `notes` (e.g. why `sourceId` is null)

## What does **not** belong here

- Transfermarkt market values, photos, or `image_url`
- Hotlinked third-party image URLs (see [PLAYER_IMAGE_POLICY.md](../PLAYER_IMAGE_POLICY.md))

Optional licensed image fields (on `sampleData` or overlay when approved): `imageUrl`, `imageAlt`, `imageCredit`, `imageSource`, `imageLicense`

## Pipeline (current)

```
TM raw CSVs
  → npm run build:data-preview          → footybrain-preview-data.json
  → editorial batch / manual edits      → players.generated-draft.json
  → npm run build:app-ready-preview     → footybrain-app-ready-preview.json
  → npm run validate:overlays
  → npm run validate:data-pipeline
  → npm run merge:phase3-sample         → src/data/sampleData.js (reviewed PR)
```

The React app imports `sampleData.js` until an explicit generated-bundle switch.

### Transfer / roster refresh workflow

1. **Refresh TM snapshot** — update `raw-data/transfermarkt-datasets/…`, bump `DATA_AS_OF` in `merge-phase1-sample-data.js` when merging.
2. **Rebuild previews** — `npm run build:data-preview` then `npm run build:app-ready-preview`.
3. **Validate drift** — `npm run validate:overlays` reports stale `teamId` vs TM for manual MVPs (`sourceId` null) and club mismatches for linked `sourceId`.
4. **Fix editorial** — update `sampleData` club via merge inputs or adjust `players.manual.json` / retire draft rows; use `append-*-editorial-batch.js` for wave upserts (`scripts/lib/upsert-draft-players.js`).
5. **Search aliases** — add conservative entries in `src/utils/searchAliases.js` for new quiz stars (no auto-generation yet).
6. **Merge** — `npm run merge:phase3-sample` (blocks on duplicate player ids / duplicate TM `sourceId` in output).

National-team links: `npm run build:national-team-live` after club merge when NT CSVs change.

## `sourceId` rules

- Use Transfermarkt `spieler` id **only** when matched confidently to preview data on the **same** `teamId` as `sampleData.js`.
- If the player moved clubs or is missing from the preview squad, leave `sourceId: null` and document in `notes`.

## Editorial backlog report

```bash
npm run editorial:report
```

Writes `EDITORIAL_BACKLOG.md` and `generated-data/editorial-backlog-report.json`.

## Validation

```bash
npm run validate:data-pipeline   # phase config + draft id/sourceId uniqueness
npm run validate:overlays        # manual + draft field rules + stale roster warnings
```

For the hidden dev page, copy draft overlay to static assets after edits:

```bash
cp editorial-overlays/players.generated-draft.json public/dev-data/players.generated-draft.json
```

## Batch upserts

```bash
node scripts/append-mls-editorial-batch.js
node scripts/append-brasileirao-editorial-batch.js
node scripts/append-national-team-editorial-batch.js
```

Then rebuild app-ready preview and re-run validation before merge.
