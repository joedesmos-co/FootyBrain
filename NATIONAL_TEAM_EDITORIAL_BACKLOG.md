# National team editorial backlog (wave 1)

> Machine-readable priorities: `editorial-overlays/national-team-editorial-backlog.json`  
> Approvals applied by `node scripts/append-national-team-editorial-batch.js` → `players.generated-draft.json`  
> Aligns with live nations in `src/data/nationalTeamLive.json` (England, France, Spain, Brazil, Argentina).

## Snapshot (wave 1 merged)

| Nation | Linked squad | Quiz-ready (linked) | Wave 1 approvals |
|--------|-------------:|--------------------:|-----------------:|
| Argentina | 8 | **8** | 6 |
| France | 23 | **8** | 4 |
| Spain | 19 | **8** | 4 |
| Brazil | 28 | **8** | 3 |
| England | 15 | **11** | 3 |
| **Total** | **93** | **43** | **20** |

Global quiz-eligible players: **368** (+20 from wave 1).

## Priority order

1. **Argentina (critical)** — national quiz blocked below 3 quiz-ready linked players.
2. **France (high)** — many Les Bleus stars linked but browse-only.
3. **Spain (high)** — Euro 2024 core still needs editorial.
4. **Brazil (medium)** — add unmistakable Seleção names (Rodrygo, Militão, Richarlison).
5. **England (medium)** — already healthy; add Euro 2024 depth (Eze, Gallagher, Curtis Jones).

## Selection rules

1. Must be in `nationalTeamLive.json` membership for that nation.
2. Prefer World Cup / Copa / Euro pedigree and roles fans recognize.
3. Use durable hints: nation, tournament, club arc — not market values or stats.
4. Avoid duplicate-surname traps: use full names (Randal Kolo Muani, Leonardo Balerdi, Mikel Merino, Rodrygo not “Rodrigo”).
5. Skip players not in `sampleData.js` or without confident `sourceId`.

## Wave 1 approved players (20)

### Argentina (6)

| Player | `id` | Notes |
|--------|------|-------|
| Giovani Lo Celso | `tm-348795` | 2022 World Cup winner; Betis |
| Emiliano Buendía | `tm-321247` | Villa playmaker; full given name |
| Facundo Medina | `tm-474800` | Marseille centre-back |
| Leonardo Balerdi | `tm-575998` | Marseille; not Facundo Medina |
| Walter Benítez | `tm-296802` | Argentina GK at Crystal Palace |
| Joaquín Panichelli | `tm-1064871` | Strasbourg forward; youth pipeline |

### France (4)

| Player | `id` | Notes |
|--------|------|-------|
| Christopher Nkunku | `tm-344381` | 2018 World Cup winner |
| Eduardo Camavinga | `tm-640428` | Real Madrid; 2022 finalist |
| Hugo Ekitiké | `tm-709726` | Liverpool striker |
| Randal Kolo Muani | `tm-487969` | 2022 final substitute |

### Spain (4)

| Player | `id` | Notes |
|--------|------|-------|
| Mikel Merino | `tm-338424` | Euro 2024; Arsenal |
| Fabián Ruiz | `tm-350219` | PSG midfielder |
| Robin Le Normand | `tm-351809` | Atlético; Euro 2024 CB |
| Isco | `tm-85288` | 2010 World Cup winner |

### Brazil (3)

| Player | `id` | Notes |
|--------|------|-------|
| Rodrygo | `tm-412363` | Real Madrid winger |
| Éder Militão | `tm-401530` | Real Madrid centre-back |
| Richarlison | `tm-378710` | 2022 World Cup no. 9 |

### England (3)

| Player | `id` | Notes |
|--------|------|-------|
| Eberechi Eze | `tm-479999` | Euro 2024; Arsenal |
| Conor Gallagher | `tm-488362` | 2022 World Cup squad |
| Curtis Jones | `tm-433188` | Liverpool academy |

## Deferred (next wave)

- England browse-only: Eberechi Eze duplicates none; Quansah, Chalobah, Egan-Riley (lower star power).
- France: Khéphren Thuram (Thuram surname collision with other French players).
- Spain: Aleix García / Andrés García (García blocklist), Pablo Marín vs Rafa Marín.
- Brazil: Antony, Gerson, Joelinton (approve after wave 1 quality check).
- Messi (`tm-28003`) — MLS editorial star but **not** in wave-1 Argentina TM link set.

## Apply

```bash
node scripts/append-national-team-editorial-batch.js
npm run merge:phase3-sample
npm run validate:overlays
npm run editorial:report
```
