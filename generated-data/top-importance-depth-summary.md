# Top-importance depth audit

Generated: 2026-05-29T12:33:58.702Z

## Scope

| Entity | Count audited |
|--------|----------------|
| Top players | 300 |
| Major clubs | 164 |
| Leagues | 8 |
| National teams | 55 |

## Summary

- **Thin top players** (depth ≤3): 265
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

- **Lionel Messi** (96) — 3 gaps
- **Neymar** (95) — 3 gaps
- **Heung-min Son** (92) — 3 gaps
- **David Alaba** (92) — 3 gaps
- **Eduardo Camavinga** (92) — 3 gaps
- **Christopher Nkunku** (91) — 3 gaps
- **Rodrygo** (91) — 3 gaps
- **Mikel Merino** (90) — 3 gaps
- **Antoine Griezmann** (90) — 3 gaps
- **Jan Oblak** (90) — 3 gaps
- **Min-jae Kim** (90) — 3 gaps
- **Giorgian de Arrascaeta** (90) — 3 gaps
- **Luis Suárez** (90) — 3 gaps
- **Dušan Vlahović** (90) — 3 gaps
- **Andrew Robertson** (90) — 3 gaps
- **James Rodríguez** (90) — 3 gaps
- **Giovani Lo Celso** (90) — 3 gaps
- **Éder Militão** (90) — 3 gaps
- **Eberechi Eze** (89) — 3 gaps
- **Hugo Ekitiké** (89) — 3 gaps
- **Bruno Fernandes** (89) — 3 gaps
- **Khvicha Kvaratskhelia** (89) — 3 gaps
- **Ousmane Dembélé** (89) — 3 gaps
- **Daniel Carvajal** (89) — 3 gaps
- **Richarlison** (89) — 3 gaps

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
