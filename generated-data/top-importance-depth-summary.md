# Top-importance depth audit

Generated: 2026-05-28T20:19:08.514Z

## Scope

| Entity | Count audited |
|--------|----------------|
| Top players | 300 |
| Major clubs | 164 |
| Leagues | 8 |
| National teams | 55 |

## Summary

- **Thin top players** (depth ≤3): 300
- **Thin major clubs** (depth ≤4): 124
- **Thin leagues**: 0
- **Thin national teams**: 0
- **Players with runtime synthesis** (thin + missing style/fact, importance ≥68): 0
- **Clubs with runtime Club identity synthesis**: 0

### Player gaps (top 300)

| Gap | Count |
|-----|------:|
| Missing quick fact | 0 |
| Missing play style | 0 |
| Missing career history | 264 |
| Missing quiz hints | 0 |

### Club gaps (all in-league clubs)

| Gap | Count |
|-----|------:|
| Missing short history | 0 |
| Missing rivalries | 100 |
| Missing identity tags | 0 |
| Missing legends | 104 |

## Thin top players (sample)

- **Erling Haaland** (96) — 3 gaps
- **Jude Bellingham** (96) — 3 gaps
- **Lionel Messi** (96) — 4 gaps
- **Mohamed Salah** (95) — 3 gaps
- **Vinícius Júnior** (95) — 3 gaps
- **Neymar** (95) — 4 gaps
- **Kevin De Bruyne** (94) — 3 gaps
- **Harry Kane** (94) — 3 gaps
- **Rodri** (93) — 3 gaps
- **Virgil van Dijk** (93) — 3 gaps
- **Jamal Musiala** (93) — 3 gaps
- **Bukayo Saka** (92) — 3 gaps
- **Lautaro Martínez** (92) — 3 gaps
- **Heung-min Son** (92) — 4 gaps
- **David Alaba** (92) — 4 gaps
- **Eduardo Camavinga** (92) — 4 gaps
- **Phil Foden** (91) — 3 gaps
- **Martin Ødegaard** (91) — 3 gaps
- **Federico Valverde** (91) — 3 gaps
- **Robert Lewandowski** (91) — 3 gaps
- **Joshua Kimmich** (91) — 3 gaps
- **Rafael Leão** (91) — 3 gaps
- **Christopher Nkunku** (91) — 4 gaps
- **Rodrygo** (91) — 4 gaps
- **William Saliba** (90) — 3 gaps

## Thin major clubs (sample)

- **Chapecoense** (roster sum 1785) — 5 gaps
- **Clube do Remo** (roster sum 1785) — 5 gaps
- **Vitória** (roster sum 1785) — 5 gaps
- **Red Bull Bragantino** (roster sum 1785) — 5 gaps
- **VfL Wolfsburg** (roster sum 1749) — 3 gaps
- **Real Betis** (roster sum 1705) — 3 gaps
- **Fluminense** (roster sum 1688) — 5 gaps
- **Crystal Palace** (roster sum 1687) — 3 gaps
- **Athletic Club** (roster sum 1661) — 3 gaps
- **VfB Stuttgart** (roster sum 1642) — 3 gaps
- **Los Angeles FC** (roster sum 1640) — 3 gaps
- **FC Dallas** (roster sum 1638) — 5 gaps
- **Mirassol** (roster sum 1638) — 5 gaps
- **Botafogo** (roster sum 1638) — 5 gaps
- **TSG Hoffenheim** (roster sum 1620) — 5 gaps
- **Villarreal** (roster sum 1617) — 3 gaps
- **Atlético Mineiro** (roster sum 1613) — 5 gaps
- **Borussia Mönchengladbach** (roster sum 1611) — 3 gaps
- **Mainz 05** (roster sum 1605) — 5 gaps
- **OGC Nice** (roster sum 1598) — 3 gaps
- **Celta Vigo** (roster sum 1596) — 3 gaps
- **Werder Bremen** (roster sum 1592) — 3 gaps
- **Cruzeiro** (roster sum 1587) — 5 gaps
- **Valencia** (roster sum 1577) — 3 gaps
- **Internacional** (roster sum 1565) — 5 gaps

## Rerun

```bash
npm run audit:top-importance-depth
```

Runtime synthesis modules: `src/utils/entityEditorialSynthesis.js`, `src/utils/entityDepthAudit.js`.
