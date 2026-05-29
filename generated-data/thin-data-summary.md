# Thin data quality audit

Generated: 2026-05-29T12:48:52.274Z

## Summary

| Metric | Count |
|--------|------:|
| Major clubs | 164 |
| Thin / placeholder clubs | 45 |
| Placeholder club copy | 45 |
| Clubs with editorial overlay | 72 |
| Thin clubs with overlay | 0 |
| Top 300 players (thin) | 0 |
| Browse-only players (importance ≥48) | 3902 |
| Browse-only ≥48 without overlay | 3662 |
| Thin leagues | 0 |
| Thin national teams | 0 |

## Priority thin clubs (by roster importance)

- **Cremonese** — depth 7, placeholder=true, overlay=false
- **Le Havre** — depth 7, placeholder=true, overlay=false
- **Chicago Fire FC** — depth 7, placeholder=true, overlay=false
- **CF Montréal** — depth 7, placeholder=true, overlay=false
- **Nashville SC** — depth 7, placeholder=true, overlay=false
- **Philadelphia Union** — depth 7, placeholder=true, overlay=false
- **Real Salt Lake** — depth 7, placeholder=true, overlay=false
- **Houston Dynamo FC** — depth 7, placeholder=true, overlay=false
- **New York Red Bulls** — depth 7, placeholder=true, overlay=false
- **Toronto FC** — depth 7, placeholder=true, overlay=false
- **Portland Timbers** — depth 7, placeholder=true, overlay=false
- **Elche** — depth 7, placeholder=true, overlay=false
- **Leeds United** — depth 7, placeholder=true, overlay=false
- **Bologna** — depth 7, placeholder=true, overlay=false
- **Genoa** — depth 7, placeholder=true, overlay=false
- **Lecce** — depth 7, placeholder=true, overlay=false
- **Como** — depth 7, placeholder=true, overlay=false
- **FC Utrecht** — depth 7, placeholder=true, overlay=false
- **sc Heerenveen** — depth 7, placeholder=true, overlay=false
- **NEC Nijmegen** — depth 7, placeholder=true, overlay=false

## Browse-only players (importance ≥48, sample)

- **Abdoulaye Touré** (54) — overlay=true, thin=false
- **Felix Mambimbi** (54) — overlay=true, thin=false
- **Lionel Mpasi-Nzau** (54) — overlay=true, thin=false
- **Reda Khadra** (54) — overlay=true, thin=false
- **Alvin Petit Dol** (54) — overlay=true, thin=false
- **Francisco Sierralta** (54) — overlay=true, thin=false
- **Lasso Coulibaly** (54) — overlay=true, thin=false
- **Ryan Rodin** (54) — overlay=true, thin=false
- **Ko Itakura** (54) — overlay=true, thin=false
- **Oscar Gloukh** (54) — overlay=true, thin=false
- **Abde Rebbach** (54) — overlay=true, thin=false
- **Victor Parada** (54) — overlay=true, thin=false
- **Ben White** (54) — overlay=true, thin=false
- **Alysson** (54) — overlay=true, thin=false
- **Ezri Konsa** (54) — overlay=true, thin=false
- **Lucas Digne** (54) — overlay=true, thin=false
- **Tammy Abraham** (54) — overlay=true, thin=false
- **Berat Djimsiti** (54) — overlay=true, thin=false
- **Giorgio Scalvini** (54) — overlay=true, thin=false
- **Mario Pašalić** (54) — overlay=true, thin=false

## Commands

```bash
npm run enrich:thin-clubs
npm run enrich:thin-players
npm run audit:thin-data
```
