# Editorial overlays

Human-maintained learning content for FootyBrain players and (later) teams. Separates **app-owned pedagogy** from **machine-generated factual data** (Transfermarkt preview / core).

See [DATA_MERGE_PLAN.md](../DATA_MERGE_PLAN.md) Stage 2.

## Files

| File | Purpose |
|------|---------|
| `players.manual.json` | MVP **36** players — `quickFact`, `quizHints`, `playingStyle`, `importanceScore`, optional TM `sourceId` |

Future (not created yet):

- `meta/mvp-player-ids.json` — canonical id list
- `players/{id}.json` — per-player splits if the manual file grows unwieldy

## What belongs here

- Display names, quiz hints, quick facts, playing style, FootyBrain `importanceScore`
- Flags: `quizEligible`, `rosterTier`
- Maintainer `notes` (e.g. why `sourceId` is null)

## What does **not** belong here

- Transfermarkt market values, photos, or `image_url`
- Raw TM `full_name` strings copied verbatim without cleanup
- League/team fan guides (still in `sampleData.js` until team overlays exist)

## `sourceId` rules

- Use Transfermarkt `spieler` id **only** when matched confidently to `generated-data/footybrain-preview-data.json` on the **same** `teamId` as `sampleData.js`.
- If the player is missing from the preview squad or TM lists a different club, leave `sourceId: null` and explain in `notes`.

## Validation

```bash
npm run validate:overlays
```

Checks overlay JSON, MVP id coverage, required editorial fields, `sourceId` integrity against `footybrain-preview-data.json`, and stale roster reports.

## Regenerating

`players.manual.json` was bootstrapped from `src/data/sampleData.js`. After editing sample data in the app, update this file manually or re-run the bootstrap script (when added) — **do not** overwrite handcrafted hints without review.

## Merge flow (future)

```
footybrain-preview-data.json  →  core (facts)
players.manual.json           →  overlay (this folder)
                              →  merge script → sampleData.js (reviewed PR)
```

The React app continues to import `sampleData.js` until that merge is explicitly approved.
