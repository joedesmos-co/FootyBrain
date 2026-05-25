# FootyBrain Handoff

## Current App Status

FootyBrain is a frontend-only React + Vite MVP for learning football players, clubs, and fan context. It uses local sample data only and does not connect to Firebase or any external soccer API.

Current sample dataset:

- 4 leagues
- 8 teams
- 36 players

The app has a dark pitch-style visual theme with green accents, responsive card layouts, player profiles, team profiles, Fan Mode, Quiz Mode, and local saved items.

## How To Run Locally

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

Production build check:

```bash
npm run build
```

Lint check:

```bash
npm run lint
```

Optional local production preview:

```bash
npm run preview
```

## Routes

- `/` - Home page with entry points into the MVP.
- `/browse` - Browse Database with player search and filters.
- `/player/:playerId` - Player profile page. Invalid IDs show a friendly fallback.
- `/teams` - Team Learning page with team cards.
- `/team/:teamId` - Team detail page with Fan Mode, club facts, fan guide, and roster.
- `/quiz` - Quiz Mode.
- `/quiz?team=teamId` - Quiz Mode preselected for one team when the team ID is valid.
- `/saved` - Saved to Learn page for locally saved players and teams.

## Main Components

- `src/App.jsx` - Browser router, route definitions, app shell, footer.
- `src/components/Navbar.jsx` - Main navigation links.
- `src/components/Home.jsx` - MVP home page.
- `src/components/BrowseDatabase.jsx` - Player browsing, search, league filter, team filter.
- `src/components/PlayerCard.jsx` - Player summary card with Save to Learn and profile link.
- `src/components/PlayerProfile.jsx` - Player profile, facts, playing style, history, quiz hints, save button.
- `src/components/TeamLearning.jsx` - Team browsing and learning entry page.
- `src/components/TeamCard.jsx` - Team summary card with Save to Learn and team profile links.
- `src/components/TeamProfile.jsx` - Team profile, facts, Fan Mode learning path, roster, quiz links.
- `src/components/QuizMode.jsx` - Filterable player quiz with difficulty, hints, score, streak, and answer feedback.
- `src/components/SavedPage.jsx` - Saved players and teams page.
- `src/components/FavoriteButton.jsx` - Shared save/unsave button for players and teams.

## Data Files

- `src/data/sampleData.js` - Local MVP data and helper lookups.

Exports:

- `leagues`
- `teams`
- `players`
- `getPlayerById(playerId)`
- `getTeamById(teamId)`
- `getLeagueById(leagueId)`
- `getTeamName(teamId)`
- `getLeagueName(leagueId)`

Important data shape notes:

- Players use `teamId` and `leagueId`.
- Teams use `leagueId`.
- Quiz questions depend on `player.quizHints`.
- Team roster sections are generated from `players.filter((player) => player.teamId === team.id)`.
- Team key players are editorial names in `team.currentKeyPlayers`; those names do not have to match the local roster perfectly yet.

## Hooks

- `src/hooks/useFavorites.js` - Local saved players and teams.

Current behavior:

- Stores data in `localStorage` under `footybrain:favorites`.
- Keeps saved players and teams as ID arrays.
- Exposes `favorites`, `isPlayerSaved`, `isTeamSaved`, `togglePlayer`, and `toggleTeam`.
- Dispatches a local browser event so multiple mounted save buttons stay in sync.
- Designed to be small enough to replace later with Firebase-backed user data.

## Current Features

- Home page with quick navigation.
- Browse Database for local player data.
- Search players by name, position, club, national team, and related fields.
- League and team filtering.
- Player cards with FootyBrain Importance Score and Save to Learn.
- Player profile routes with invalid-player fallback.
- Team Learning page with team cards.
- Team detail routes with invalid-team fallback.
- Team detail pages showing league, country, stadium, founded year, rivals, history, fan guide, legends, key players, and roster.
- Fan Mode learning path on team pages with steps for basics, squad, key players, rivals, legends, fan culture, and quiz.
- Team quiz links using `/quiz?team=teamId`.
- Quiz Mode with league/team filters, team query preselection, Easy/Medium/Hard difficulty, progressive hints, session score, streak, answer feedback, and Learn this player links.
- Saved to Learn page for locally saved players and teams.
- Mobile-friendly card and grid layouts.

## Known Limitations

- All data is local sample data and may be incomplete, simplified, or outdated.
- There is no authentication, account system, cloud sync, or backend.
- Saved items are browser-local only and can be cleared by the browser or user.
- Quiz score and streak are session-only and are not saved.
- Fan Mode progress is static. There is a TODO in `TeamProfile.jsx` for future Firebase or localStorage progress tracking.
- No real player photos, club crests, official badges, live stats, fixtures, transfers, injuries, or standings are connected.
- FootyBrain Importance Score is a local editorial value, not an official or copied game rating.
- Some team key-player names are editorial text and may not have matching player cards in the 36-player sample dataset.
- For deployment, configure the host for single-page app fallback so direct visits to routes like `/team/arsenal` work.

## Rules For Future AI Tools

- Read `PROJECT_BRIEF.md`, `HANDOFF.md`, and `ROADMAP.md` before changing the app.
- Make targeted improvements only. Do not rewrite the app unless the user explicitly asks.
- Keep the project frontend-only until the user asks for Firebase, backend work, or an external API.
- Do not add Firebase, auth, Firestore, Cloud Functions, or soccer API clients unless requested.
- Preserve the existing route style, data shape, and component patterns unless there is a clear reason to change them.
- Keep local sample data simple and readable.
- Do not copy EA FC, Football Manager, or other proprietary player ratings. Use FootyBrain's own rating methodology.
- Do not scrape player photos, club logos, paid stats, or protected databases.
- Keep mobile layouts usable at narrow widths.
- Keep interactive controls labeled and keyboard-accessible.
- After app code changes, run `npm run build` and `npm run lint`.
- For UI changes, smoke test the affected route in a browser and check a narrow mobile viewport for overflow.
- Update this handoff when routes, components, data shape, hooks, or major features change.
