# Player image policy (FootyBrain)

FootyBrain does **not** scrape or hotlink third-party player photos. Placeholder visuals stay the default until you deliberately add **licensed** assets.

## Allowed sources

| Source | `imageUrl` example | Requirements |
|--------|-------------------|--------------|
| **App-hosted files** | `/images/players/haaland.webp` | File in `public/images/players/` (or built asset). Preferred for production. |
| **Your HTTPS CDN** | `https://cdn.example.com/footybrain/players/haaland.webp` | You control hosting and rights. HTTPS only. |
| **Commons / CC** | `https://upload.wikimedia.org/...` | Set `imageCredit`, `imageSource`, and `imageLicense` (e.g. `CC BY-SA 4.0`). |

## Disallowed sources

- Transfermarkt (`image_url`, headshots, any TM URL)
- Google Images / `googleusercontent` / random search results
- FotMob, Getty, Shutterstock, iStock, Alamy, EA/FC official packs, or any URL you do not have rights to use
- Hotlinking club or league sites without a written license

## Why not to scrape

Scraping photos from stats sites or search engines:

- Violates most sites’ terms of use
- Creates unclear copyright (personality / publicity rights vary by country)
- Breaks when URLs change or hotlink protection blocks the app
- Conflicts with the project brief: local, curated, frontend-only data

Facts come from Transfermarkt **preview** pipelines; **images never do**.

## Data fields

| Field | Purpose |
|-------|---------|
| `imageUrl` | HTTPS URL or site-relative path (`/images/...`) |
| `imageAlt` | Accessible description (defaults from name + position if omitted) |
| `imageCredit` | Photographer or rights holder line |
| `imageSource` | Where the file came from (e.g. `Wikimedia Commons`) |
| `imageLicense` | SPDX-style or plain text (e.g. `CC BY-SA 4.0`) |
| `imageSrcSet` | Optional comma-separated srcset (same URL rules as `imageUrl`) for multi-width assets |

Validators reject `image_url` and block known bad URL patterns. With `imageUrl` set, validators **warn** if `imageCredit` or `imageLicense` is missing.

## Manifest (preferred for production)

Licensed URLs are registered in `src/data/playerImageManifest.json` (see [PLAYER_IMAGE_SYSTEM_PLAN.md](./PLAYER_IMAGE_SYSTEM_PLAN.md)). Runtime resolves **manifest → player field → generic SVG → gradient initials**. CDN hosts must appear in `approvedCdnHosts`; arbitrary HTTPS URLs are rejected.

## How to add a licensed image later

1. Obtain permission or use a clearly licensed asset (own photo, commissioned art, or CC with attribution).
2. Save the file under `public/images/players/{player-id}.webp` (or `.jpg`).
3. Add a manifest entry **or** in `src/data/sampleData.js` (or overlay), set on that player:

```js
imageUrl: '/images/players/haaland.webp',
imageAlt: 'Erling Haaland in Manchester City kit',
imageCredit: 'Your name or agency',
imageSource: 'FootyBrain asset library',
imageLicense: 'All rights reserved — FootyBrain',
```

4. Run `npm run validate:overlays` and `npm run validate:app-ready-preview` if the row is in preview/overlay JSON.
5. Reload the app — `PlayerVisual` shows the photo; no feature flags required.

## Fallback behavior (`PlayerVisual`)

1. If `imageUrl` is missing, null, blocked, or fails to load → **gradient placeholder** (initials + jersey motif).
2. If `imageUrl` is valid → `<img>` with `object-fit: cover`, lazy loading, and `onError` back to placeholder.
3. Sizing: `thumb` (autocomplete/search/squad rows), `card` (browse/saved/Today’s Picks), `profile` (profile/compare). Images use intrinsic `width`/`height`, a `sizes` hint, and native lazy loading; above-the-fold profile and the first Today’s Pick use `fetchpriority="high"`.
4. In **development**, the console warns once per player if `imageUrl` is set without `imageCredit` and `imageLicense`.

Placeholders are **not** removed by this policy; they remain until you add approved URLs.
