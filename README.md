# FootyBrain

Soccer/football learning database with browse, team learning, and quiz modes. Frontend-only MVP using local sample data.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

- `src/App.jsx` — routing and layout
- `src/components/` — UI pages and cards
- `src/data/sampleData.js` — leagues, teams, players (replace with API/Firebase later)

## Features

- **Home** — entry points for Browse, Quiz, and Teams
- **Browse Database** — filter by league/team, search, player cards and profiles
- **Team Learning** — club profiles with history, fan guides, legends
- **Quiz Mode** — progressive hints, loose answer matching, next question flow
