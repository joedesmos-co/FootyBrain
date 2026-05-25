# FootyBrain Roadmap

## MVP Completed Features

- React + Vite frontend-only app.
- Local sample dataset with 4 leagues, 8 teams, and 36 players.
- Dark pitch-style theme with green accents.
- Home page.
- Browse Database with search and filters.
- Player cards and player profile routes.
- Team Learning page.
- Team detail pages at `/team/:teamId`.
- Team facts, rivals, history, fan guide, legends, key players, and local roster cards.
- Fan Mode learning path on team pages.
- Team quiz links using `/quiz?team=teamId`.
- Quiz Mode with league/team filters, team preselection, difficulty, progressive hints, score, streak, answer feedback, and Learn this player links.
- Local Favorites / Want to Learn using `localStorage`.
- Saved page at `/saved`.
- Friendly fallbacks for invalid player and team IDs.
- Basic mobile-friendly layouts.

## Next Recommended Features

1. Add local Fan Mode progress.
   - Let users check off learning path steps per team.
   - Keep it in `localStorage` first so it can later move to Firebase.

2. Improve Quiz Mode review.
   - Track missed players during the current session.
   - Add a Review Missed flow.
   - Avoid immediate repeat questions.
   - Add a small session summary at the end of a round.

3. Add data validation.
   - Add a simple script or test that checks every player `teamId` and `leagueId`.
   - Check every team `leagueId`.
   - Check route IDs for duplicates.
   - Check required player/team fields.

4. Deepen team and player cross-linking.
   - Link a player's current club to `/team/:teamId` from the player profile.
   - Add team roster filters by position.
   - Add related players by team, league, or position.

5. Polish Saved to Learn.
   - Add saved counts in the navbar or page header.
   - Add remove buttons directly on the Saved page.
   - Add filters for saved players vs saved teams.

6. Accessibility pass.
   - Confirm focus states across all routes.
   - Check color contrast.
   - Add skip link if the app grows.
   - Test keyboard-only quiz and save flows.

7. Content expansion.
   - Add more clubs and players in the local sample data.
   - Add richer fan culture, derby context, and beginner explanations.
   - Keep content original and source-reviewed.

## Later Firebase Features

- Firebase Authentication for saved user profiles.
- Firestore-backed favorites and Want to Learn lists.
- Saved Fan Mode progress per team.
- Persistent quiz history, best streaks, and learning stats.
- User profile settings, preferred clubs, and preferred leagues.
- Admin-only content editing tools.
- Data migration from `localStorage` to authenticated user records.
- Firestore security rules for private user data and public read-only football content.
- Optional Cloud Functions for scheduled content checks or API sync jobs.

## Later Real Soccer API And Data Features

- Evaluate licensed soccer data providers before integration.
- Map provider IDs to FootyBrain local IDs.
- Keep editorial learning content separate from live imported stats.
- Add fixtures, standings, squads, transfers, injuries, and form only if the provider license allows the use case.
- Add source metadata and last-updated timestamps.
- Build a data refresh strategy that handles stale teams, transferred players, retired players, and API downtime.
- Cache responsibly and only within provider terms.
- Add fallback UI for unavailable or delayed live data.

## Monetization Ideas

- Freemium model with free basic learning and paid advanced quiz modes.
- Premium fan learning paths for specific clubs or leagues.
- Personalized study plans for new fans.
- League packs, derby packs, or tournament packs.
- Classroom, academy, or group learning mode.
- Light sponsorships or affiliate links where legally appropriate.
- Licensed merchandise links if brand and affiliate permissions are clear.
- Ad-free paid tier if the app grows beyond MVP.

## Legal And Data Warnings

- Player photos require permission, a licensed image source, or clearly allowed public-domain/open-license assets. Do not scrape photos from search results, club sites, social media, or news sites.
- Club logos, crests, kits, and badges are usually protected by trademark and copyright. Use text-only team names or generic visual treatments until licensed assets are available.
- Do not copy EA FC, Football Manager, FIFA, Opta, StatsBomb, or other proprietary ratings. FootyBrain should use its own transparent rating or importance methodology.
- Scraped data can violate site terms, copyright, database rights, or API restrictions. Prefer licensed APIs and documented public sources.
- Live data providers may restrict caching, redistribution, screenshots, commercial use, or public display.
- Player biographical and performance claims should be source-reviewed and kept factual.
- Avoid sensitive personal data and speculative claims about players.
- If Firebase user accounts are added, add privacy policy coverage for saved items, quiz history, account deletion, and data export.

## Suggested Build Order

1. Local Fan Mode progress.
2. Quiz Review Missed and repeat prevention.
3. Data validation script or tests.
4. More original team/player learning content.
5. Firebase auth and user data sync.
6. Licensed soccer API research and provider selection.
7. Live data integration.
8. Monetization experiments after retention is proven.
