# FootyBrain MVP Completion Plan

## Goal

Keep FootyBrain frontend-only and local-data-based until it feels like a complete, marketable prototype: polished enough to demo, clear enough for users to understand, and simple enough for future AI tools to extend without rebuilding the app.

The prototype should sell the core idea:

> Learn the game. Know the players. Become a real fan.

## Completed Features

- React + Vite frontend-only app.
- Local sample data only, with no Firebase and no external soccer APIs.
- 4 leagues, 8 teams, and 36 sample players.
- Modern dark sports-learning visual design.
- Homepage with clear product positioning, feature previews, sample data stats, and lightweight CSS-only animated visual.
- Browse Database page with player search, league filter, and team filter.
- Player cards with generated placeholder visuals, local save buttons, FootyBrain Importance Score, and profile links.
- Player profile routes at `/player/:playerId`.
- Friendly invalid player fallback.
- Team Learning page.
- Team cards with generated placeholder club badges and profile links.
- Team detail routes at `/team/:teamId`.
- Friendly invalid team fallback.
- Team profiles with club facts, rivals, history, fan guide, legends, key players, roster cards, and quiz links.
- Fan Mode learning path on team profiles.
- Quiz Mode with league/team filtering, `/quiz?team=teamId` preselection, difficulty, progressive hints, score, streak, answer feedback, and Learn this player links.
- Saved to Learn page at `/saved`.
- LocalStorage favorites for players and teams.
- Mobile-friendly layout checks across core routes.
- Documentation: `PROJECT_BRIEF.md`, `HANDOFF.md`, `ROADMAP.md`, and this MVP completion plan.

## Remaining MVP Features

These are the best remaining features to make the app feel complete without changing the architecture.

1. Local Fan Mode progress
   - Let users mark team learning steps complete.
   - Store progress in `localStorage`.
   - Show a small completion count or "Fan Level" improvement on team pages.
   - Keep the implementation easy to replace later with Firebase.

2. Quiz review loop
   - Track missed players during the current quiz session.
   - Add a "Review missed players" state.
   - Avoid immediate repeat questions.
   - Add a compact session summary.

3. Data validation
   - Add a local script or test that checks player IDs, team IDs, league IDs, required fields, duplicate IDs, quiz hints, and route-safe slugs.
   - This protects the local-data workflow as the sample set grows.

4. Better cross-linking
   - Link player profile current club to `/team/:teamId`.
   - Add "Practice this team" links in more places where useful.
   - Add related players by team or position on player profiles.

5. Prototype content expansion
   - Add enough original sample content for the product to feel credible in a demo.
   - Prioritize depth over volume: more fan context, rival explanations, beginner vocabulary, and player learning cues.
   - Keep all copy original and avoid scraping.

6. Final accessibility pass
   - Keyboard test the main nav, filters, save buttons, cards, quiz form, and profile links.
   - Confirm readable focus states and contrast.
   - Add a skip link only if navigation becomes cumbersome.

7. Deployment readiness
   - Add SPA fallback notes for hosting.
   - Confirm direct visits to `/player/:playerId`, `/team/:teamId`, `/quiz?team=teamId`, and `/saved`.
   - Keep build output clean.

## What Should Stay Local-Only For Now

- Sample players, teams, leagues, histories, fan guides, legends, quiz hints, and placeholder visuals.
- Favorites / Want to Learn.
- Fan Mode progress once added.
- Quiz session state, missed questions, and review flow.
- FootyBrain Importance Score.
- Generated placeholder player cards and team badges.
- Small validation scripts for local sample data.
- Prototype content experiments and copy changes.

Local-only is a strength right now. It keeps iteration fast, avoids account complexity, and lets the product find its learning experience before backend choices harden the shape of the app.

## What Should Wait Until Firebase

- Authentication and user accounts.
- Cloud-synced saved players and teams.
- Persistent Fan Mode progress across devices.
- Persistent quiz history, streaks, best scores, and learning stats.
- User preferences for favorite leagues, clubs, difficulty, and learning goals.
- Admin/editor workflows for updating content.
- User-generated notes or custom study lists.
- Data migration from localStorage to authenticated user records.
- Privacy policy and account deletion/export workflows.

Firebase should come after the local prototype proves that users care about saving progress and returning to learn more.

## What Should Wait Until Real Soccer API Or Data Licensing

- Real player photos.
- Real club crests, badges, kits, and official branding.
- Live squads, transfers, injuries, fixtures, standings, stats, and form.
- Official IDs from providers.
- Automated data refresh.
- Commercial use of detailed player/stat databases.
- Provider-backed search, rankings, or comparisons.

Before adding any real soccer data provider, choose a licensed source, read the terms, confirm caching/display rules, and separate imported factual data from FootyBrain's original learning content.

## Next 5 Recommended Development Prompts

1. "Read PROJECT_BRIEF.md, HANDOFF.md, ROADMAP.md, and MVP_COMPLETION_PLAN.md first. Add localStorage-based Fan Mode progress to team profiles. Make targeted changes only. Do not add Firebase or APIs."

2. "Read the project docs first. Improve Quiz Mode with a current-session Review Missed flow and simple repeat prevention. Keep existing quiz filters and `/quiz?team=teamId` working."

3. "Read the project docs first. Add a local data validation script for sampleData IDs and required fields. Do not change app behavior unless the validation reveals a small obvious data bug."

4. "Read the project docs first. Improve player/team cross-linking: link player current clubs to team pages and add related players on player profiles. Keep the visual design and routes intact."

5. "Read the project docs first. Expand the local sample content with original fan-learning copy for existing teams and players. Do not use scraped data, real photos, or club logos."

## What Makes FootyBrain Unique

FootyBrain should not compete with FotMob or Transfermarkt as a live stats database. Its strongest angle is fan education.

- FotMob is excellent for live scores, fixtures, lineups, and match data. FootyBrain is for learning who matters and why.
- Transfermarkt is excellent for market values, transfers, contract data, and database depth. FootyBrain is for beginner-friendly context, recall, and fan literacy.
- FootyBrain can explain clubs like a fan would: rivals, legends, culture, chants, matchday identity, and current players to know.
- FootyBrain combines database browsing with quiz practice and saved learning.
- FootyBrain can use its own FootyBrain Importance Score as an editorial learning signal, not a copied game rating or market value.
- FootyBrain can become a "fan onboarding" product: less spreadsheet, more guided path from confused new viewer to confident supporter.

The product promise should stay simple:

- Learn the current players.
- Understand the club context.
- Practice recall.
- Save what you want to learn next.

## Risks To Avoid

### Overengineering

- Do not add Firebase before local progress and quiz loops prove the need.
- Do not add a backend for static sample data.
- Do not introduce global state libraries unless local hooks become genuinely painful.
- Do not rewrite the design system for every visual improvement.
- Do not add Three.js or heavy animation libraries until CSS visuals are clearly insufficient.
- Do not optimize for every league, provider, and future monetization path before the prototype feels great.

### Legal And Data Issues

- Do not scrape FotMob, Transfermarkt, Google Images, club websites, social media, or news sites.
- Do not add real player headshots unless they are licensed or clearly allowed.
- Do not add real club logos, crests, kit art, or official badges without permission.
- Do not copy EA FC, Football Manager, Opta, StatsBomb, or other proprietary ratings/data.
- Do not imply FootyBrain ratings are official.
- Do not cache or redistribute API data unless the provider terms explicitly allow it.
- Keep player claims factual, respectful, and source-reviewable.

### Product Focus

- Do not turn FootyBrain into a generic sports dashboard.
- Do not bury the learning path behind decorative UI.
- Do not add too many filters before the content is richer.
- Do not prioritize volume of players over quality of learning context.
- Do not let placeholder visuals look like real licensed photos or official logos.

## MVP Completion Definition

FootyBrain is MVP-complete when:

- A new user can understand the product from the homepage in under 10 seconds.
- A user can browse players, open profiles, learn clubs, save items, and take team-specific quizzes without confusion.
- Team pages feel like fan-learning pages, not just fact sheets.
- Quiz Mode encourages repeated practice through feedback and review.
- Local progress and saved items make the app feel personal enough for a demo.
- The app runs cleanly with `npm run build` and `npm run lint`.
- The app remains frontend-only, local-data-based, legally safe, and easy to extend.
