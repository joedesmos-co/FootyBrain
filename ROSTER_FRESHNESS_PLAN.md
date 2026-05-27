# Roster Freshness Plan — 7 Manual MVP Mismatch Warnings

> **Status:** Planning only. No code changes have been made.  
> **Validator run:** `npm run validate:overlays` — 7 warnings, all `sourceId: null` players.  
> **Date assessed:** 2026-05-25

---

## Background

Seven manual MVP players have `sourceId: null` in `players.manual.json`. The validator
uses `findPreviewByName()` to locate them in `footybrain-preview-data.json` and compares
the found team against `sampleData.js` `teamId`. Any mismatch triggers a stale-roster
warning. Players not found at all are flagged as "missing from expected squad."

### Validator categories

| Category | Meaning |
|---|---|
| Stale club mismatch | Player found in TM preview but at a different club |
| Missing from expected squad | Player not found in TM preview at all |

### ⚠ Confirmed false positive — Sané → PSV

The `sane` warning (`TM=psv`) is **not real**. The validator's name-search found
Alassane Alexandre Pléa (PSV, sourceId 167329) because the accent-stripped substring
`"sane"` appears inside `"alassane"`. Leroy Sané has **no entry** in the TM preview
at any club. This is a bug in the `findPreviewByName` substring-match heuristic, not
a real transfer signal. See the recommendation for Sané below.

---

## Summary Table

| Player | sampleData club | TM 2025 status | Recommendation |
|---|---|---|---|
| de-bruyne | manchester-city | Found at **napoli** (sourceId 88755) | **Update club → napoli** |
| trent | liverpool | Found at **real-madrid** (sourceId 314353) | **Update club → real-madrid** |
| modric | real-madrid | Found at **ac-milan** (sourceId 27992) | **Update club → ac-milan** |
| ederson | manchester-city | **Missing** from TM preview | **Mark historical-legacy** |
| nunez | liverpool | **Missing** from TM preview | **Mark historical-legacy** |
| ter-stegen | barcelona | **Missing** from TM preview | **Mark historical-legacy** |
| sane | bayern-munich | False positive (PSV) — actually **missing** | **Mark historical-legacy** |

---

## Per-Player Analysis

---

### 1. Kevin de Bruyne — `de-bruyne`

**Current:** manchester-city · MF · age 33  
**TM 2025:** Found at **napoli** (generated-needs-editorial, sourceId 88755)  
**Validator:** Stale club mismatch (City → Napoli)

**Hint audit:**
- Hint 1: "Belgian international who rebuilt his reputation in the Bundesliga after a brief London spell." — career path, **still valid anywhere**
- Hint 2: "Genk academy product who also wore Wolfsburg green before the Etihad." — career path, **still valid anywhere**
- Hint 3: "Whips crosses from the right half-space — ginger beard and number 17 at City." — **City-specific, now stale**

**QuickFact:** "Set the Premier League single-season assists record in 2019–20 — a benchmark for modern playmakers." — historical record, **still valid anywhere**

**Recommendation: UPDATE club to napoli**

De Bruyne's City contract expired in 2025. TM 2025 confirms him at Napoli. The move is
real editorial information, not a speculative rumour. Hints 1 and 2 are already
career-path framing that survives any club change. Only Hint 3 needs revision to remove
the "number 17 at City" phrasing; the playing-style core (right half-space crosses, ginger
beard) can be rewritten to drop the club-specific jersey reference.

**Changes required:**
1. `sampleData.js`: change `teamId` from `manchester-city` to `napoli`
2. `players.manual.json`: set `sourceId` to `"88755"`, rewrite Hint 3 (drop "number 17 at City")
3. Re-run build and validate scripts

**Impact:**
- **Browse:** De Bruyne moves from Man City squad page to Napoli squad page. Man City loses one quiz-eligible player (4 remaining — still healthy).
- **Quiz/Daily:** He remains quiz-eligible. Napoli gains a world-class anchor player for quiz filtering. Daily challenge can still draw him.
- **Team pages:** Napoli team page gains a featured quiz player. Man City team page loses him.
- **Compare:** Works immediately after teamId update — no structural change.
- **Search:** "de bruyne" and "kevin" still resolve via name search regardless of teamId.
- **Overlays/sourceId:** Setting sourceId to `"88755"` clears the null-sourceId warning and enables direct TM lookup.

---

### 2. Trent Alexander-Arnold — `trent`

**Current:** liverpool · RB · age 26  
**TM 2025:** Found at **real-madrid** (sourceId 314353)  
**Validator:** Stale club mismatch (Liverpool → Real Madrid)

**Hint audit:**
- Hint 1: "Scouse academy graduate from West Derby who never left his boyhood club." — **now factually false** (he left for Real Madrid)
- Hint 2: "Among the Premier League's most prolific assist-makers for a defender." — historically accurate, but Premier League framing is now stale (he plays in La Liga)
- Hint 3: "Set-piece delivery from the right touchline — free-kicks and corners for Liverpool." — **Liverpool-specific, now stale**

**QuickFact:** "Wears number 66 — a nod to the year his postal district was founded, not a random squad number." — The number 66 lore may no longer apply if he changed squad numbers at Real Madrid. Needs verification but not factually wrong as a historical note.

**Recommendation: UPDATE club to real-madrid**

This is the clearest-cut case. Trent's transfer to Real Madrid is confirmed by TM 2025
with a sourceId. Hint 1 is not just stale — it is actively incorrect. It must be rewritten.
Hint 3 must also be rewritten to remove Liverpool-specific wording. Real Madrid already
has 5 quiz-eligible players, but Trent adds La Liga full-back representation and is
genuinely world-famous. Liverpool will drop to 4 quiz-eligible players (still healthy).

**Changes required:**
1. `sampleData.js`: change `teamId` from `liverpool` to `real-madrid`
2. `players.manual.json`: set `sourceId` to `"314353"`, rewrite Hints 1 and 3, review Hint 2 for La Liga framing
3. Re-run build and validate scripts

**Impact:**
- **Browse:** Moves from Liverpool to Real Madrid squad page. Liverpool drops to 4 quiz-eligible players.
- **Quiz/Daily:** Remains quiz-eligible. Real Madrid gains a sixth quiz player, which is fine.
- **Team pages:** Real Madrid team page gains him. Liverpool team page loses him.
- **Compare:** Works immediately after teamId update.
- **Search:** Name search unaffected by teamId.
- **Overlays/sourceId:** Setting sourceId to `"314353"` resolves the warning and links to TM profile.

---

### 3. Luka Modrić — `modric`

**Current:** real-madrid · CM · age 39  
**TM 2025:** Found at **ac-milan** (sourceId 27992)  
**Validator:** Stale club mismatch (Real Madrid → AC Milan)

**Hint audit:**
- Hint 1: "Croatian midfielder who fled war as a child and grew up in a hotel as a refugee." — biographical, **valid anywhere**
- Hint 2: "White Hart Lane years before a decade-plus in Madrid white." — career history framing, **valid anywhere** (past tense by design)
- Hint 3: "Outside-of-the-foot passes and metronome tempo — number 10 for La Roja's neighbors." — playing style + Croatian national team reference, **valid anywhere** (no club mention)

**QuickFact:** "Ballon d'Or winner in 2018 — the first player outside Messi or Ronaldo to win it in over a decade." — historical award, **valid anywhere**

**Recommendation: UPDATE club to ac-milan**

All four hints and the quickFact are deliberately career/biography/style framed — none
reference Real Madrid directly. This makes the update unusually low-risk: only the
`teamId` and `sourceId` fields change, with zero hint rewrites required. AC Milan
currently has 2 quiz-eligible players and would benefit from a genuine world-class
addition. Real Madrid already has 5 quiz-eligible players and will have 4 after Trent
moves there (3 if this change is applied before Trent's), so the balance remains healthy.

**Changes required:**
1. `sampleData.js`: change `teamId` from `real-madrid` to `ac-milan`
2. `players.manual.json`: set `sourceId` to `"27992"`
3. Re-run build and validate scripts (no hint edits needed)

**Impact:**
- **Browse:** Moves from Real Madrid to AC Milan squad page.
- **Quiz/Daily:** Remains quiz-eligible. AC Milan gains a strong anchor player (was thin at 2 quiz-eligible).
- **Team pages:** AC Milan team page gains a featured quiz player. Real Madrid loses one (still has 4–5 depending on Trent's update order).
- **Compare:** Unaffected beyond teamId.
- **Search:** "modric" and "luka" still resolve by name.
- **Overlays/sourceId:** Setting sourceId to `"27992"` resolves the warning.

---

### 4. Ederson — `ederson`

**Current:** manchester-city · GK · age 31  
**TM 2025:** **Missing from TM preview entirely** (no match found at any club)  
**Validator:** Missing from expected squad

**Hint audit:**
- Hint 1: "Brazilian who won the Premier League Golden Glove in his first season at City." — historical, but "at City" situates him at Man City
- Hint 2: "Left Benfica's Eagles before joining Guardiola's possession side." — career path, "Guardiola's possession side" = City reference
- Hint 3: "Often plays long-sleeved with striking tattoos — distribution rivals outfielders." — style-only, **valid anywhere**

**QuickFact:** "Set up a goal with a kick from his own penalty area in a 2018 Manchester derby." — specific historical event, **valid as a memory-hook**

**Recommendation: MARK HISTORICAL-LEGACY**

Ederson's destination is genuinely unknown from TM preview data. His City contract may
have expired or he may have joined a club not yet in FootyBrain's dataset. Since his
hints explicitly mention City (Hints 1 and 2), updating his teamId without confirmed
destination would mean rewriting content to be vague. The better path is to keep him
in the dataset as a legacy featured player — still appearing in Browse, search, and
the player profile — but to add a flag or note indicating his club information is
historical rather than current. Man City already has 5 quiz-eligible players (4 after
De Bruyne moves), so losing Ederson from active quiz pool has minimal impact.

**Changes required (minimal):**
1. `players.manual.json`: add/update `notes` field to reflect legacy status
2. Optionally set `quizEligible: false` if City-specific hints would mislead quizzers
   (see discussion below)

**Hint sensitivity note:** Hint 1 names "City" and Hint 2 names "Guardiola's possession
side." If Ederson is still quizEligible, a player who knows he left City could game Hints
1 and 2 without knowing his style at all. For a daily challenge, this is a minor issue.
For quiz mode filtering by Man City, it becomes more confusing. Suggested: keep
`quizEligible: true` but do not assign to Man City quiz filter — achieved by updating
teamId to a neutral placeholder only if a canonical destination is found later.

**Impact:**
- **Browse:** Ederson remains visible in Browse and player profile. Man City squad page still shows him until teamId changes.
- **Quiz/Daily:** If kept quiz-eligible, he can still appear. If set `quizEligible: false`, he drops out of quiz pool entirely.
- **Team pages:** Man City squad page still lists him — acceptable as historical.
- **Compare:** Unaffected.
- **Search:** Still findable by name.
- **Overlays/sourceId:** Warning remains until sourceId is confirmed. Accept as known-gap.

---

### 5. Darwin Núñez — `nunez`

**Current:** liverpool · ST · age 25  
**TM 2025:** **Missing from Liverpool squad** (Gakpo and Chiesa appear in TM Liverpool preview)  
**Validator:** Missing from expected squad

**Hint audit:**
- Hint 1: "Uruguayan striker whose hair colour changes as often as debate about his finishing." — biographical, **valid anywhere**
- Hint 2: "Portuguese league top scorer season preceded a big Anfield transfer fee." — career path ("Anfield" is Liverpool-specific)
- Hint 3: "Often plays central in a front three beside Egypt's king on the right wing." — **Liverpool-specific** (Salah = "Egypt's king" at Liverpool)

**QuickFact:** "Almería bought him from Uruguay for about €4M and sold him to Benfica for roughly eight times that one season later." — transfer history, **valid anywhere**

**Recommendation: MARK HISTORICAL-LEGACY**

Núñez's destination is unknown from TM data. Hint 3 is the most problematic — it
directly references his Liverpool positioning relative to Mohamed Salah. If he has
moved, this clue actively misleads. Hint 2 mentions "Anfield transfer fee" which is
historical context (still accurate), not a current-club claim. The quickFact is solidly
historical. Liverpool already has 5 quiz-eligible players (4 after Trent moves), so the
pool remains healthy without Núñez. Mark legacy, keep in Browse/search, remove from
active quiz pool by setting `quizEligible: false` — Hint 3 is too club-specific to be
safe in quiz context without confirmation of his destination.

**Changes required:**
1. `players.manual.json`: set `quizEligible: false`, update `notes` to reflect legacy status
2. Rewriting hints for a future update is deferred until destination is confirmed

**Impact:**
- **Browse:** Núñez remains visible. Liverpool squad page still shows him (acceptable).
- **Quiz/Daily:** Drops out of quiz pool due to `quizEligible: false`. Liverpool goes from 5 to 4 quiz-eligible (after Trent departs). Still healthy.
- **Team pages:** Liverpool team page quiz button may change count.
- **Compare:** Unaffected.
- **Search:** Still findable by name.
- **Overlays/sourceId:** Warning accepted as known-gap until confirmed destination.

---

### 6. Marc-André ter Stegen — `ter-stegen`

**Current:** barcelona · GK · age 33  
**TM 2025:** **Missing from TM preview** (Szczesny appears as Barcelona GK in preview)  
**Validator:** Missing from expected squad

**Hint audit:**
- Hint 1: "Mönchengladbach 'Foals' graduate who joined Barça in 2014." — career history with Barcelona, **still accurate historically**
- Hint 2: "Sweeper-keeper who starts attacks with short passes under pressure." — style, **valid anywhere**
- Hint 3: "Catalan club's long-term number one while Neuer ruled for Die Mannschaft." — **Barcelona-specific**, present-tense framing ("long-term number one") is now misleading

**QuickFact:** "Germany's number-one debate often pits him against Bayern's long-serving keeper — both rose through Bundesliga rivals." — career narrative, **valid anywhere**

**Recommendation: MARK HISTORICAL-LEGACY**

Ter Stegen suffered a serious knee injury (ruptured patellar tendon) in late 2024, missed
most of the 2024–25 season, and is absent from TM preview. Szczesny's presence as
Barcelona's starting GK in TM 2025 data further confirms ter Stegen's current-squad
status is uncertain. Barcelona already has 5 quiz-eligible players — the deepest quiz
bench of any club in FootyBrain. Removing ter Stegen from the active quiz pool has
zero impact on Barcelona quiz coverage. Hint 3's present-tense framing ("long-term
number one") is the key problem: it reads as a current club clue, not a historical one.

**Changes required:**
1. `players.manual.json`: set `quizEligible: false`, update `notes` to reflect legacy/injury status

**Impact:**
- **Browse:** Ter Stegen remains visible in Browse and player profile.
- **Quiz/Daily:** Drops out of quiz pool. Barcelona still has 5 quiz-eligible players — no coverage gap.
- **Team pages:** Barcelona team page loses one quiz player from count but has 4 others.
- **Compare:** Unaffected.
- **Search:** Still findable.
- **Overlays/sourceId:** Warning accepted as known-gap.

---

### 7. Leroy Sané — `sane`

**Current:** bayern-munich · LW · age 29  
**TM 2025:** **False positive (PSV)** — actually missing from TM preview entirely  
**Validator:** Warning reads "stale → psv" but this is caused by Alassane Pléa's name

**False positive explanation:** `findPreviewByName` accent-strips "Sané" to "sane" and
then checks `pname.includes('sane')` (length 4 > 3). Alassane Pléa's first name
"Alassane" contains "sane" as a substring, triggering a false match. Pléa is at PSV,
so the validator reports Sané as stale at PSV. No real Sané entry exists in the TM
preview data. This is a bug in the validator's heuristic, not a real transfer.

**Hint audit:**
- Hint 1: "German winger who wore sky blue in Manchester before Munich." — career history, **valid anywhere** (past tense for Man City, Munich is historical for Bayern)
- Hint 2: "Schalke breakout with a famous surname tied to Senegalese football." — career path, **valid anywhere**
- Hint 3: "Often cuts inside from the left with rapid stepovers — father played for Senegal." — style + biographical, **valid anywhere**

**QuickFact:** "His mother won Olympic gold in gymnastics — pundits often cite that background for his balance and body control." — biographical, **valid anywhere**

**Recommendation: MARK HISTORICAL-LEGACY (at Bayern)**

Sané's Bayern contract expired in summer 2025. His actual 2025/26 club is unknown from
TM preview. Crucially, all four hints and the quickFact are **completely club-agnostic**
— none mention Bayern Munich. This is the lowest-urgency change: the hints do not
mislead on current club, and Bayern has 5 quiz-eligible players remaining without him.
Mark as legacy, keep `quizEligible: true` for now (hints are safe), but the teamId
should be updated once a confirmed destination surfaces. If no destination is confirmed
within one editorial cycle, consider `quizEligible: false` to be conservative.

**Changes required:**
1. `players.manual.json`: update `notes` to document the false-positive and the expired contract
2. No immediate hint changes — hints are already career-framed

**Validator bug note:** The `findPreviewByName` substring heuristic (`pname.includes(last)`)
is too broad for short/common name segments. A future hardening pass could add `sane`
to the `matchMononym` switch, or require the last name segment to be `>= 5` characters
for substring matching.

**Impact:**
- **Browse:** Sané remains visible. Bayern squad page still lists him (acceptable as recent squad member).
- **Quiz/Daily:** Remains quiz-eligible. Bayern still has 5 quiz-eligible players — no gap.
- **Team pages:** Bayern team page unaffected.
- **Compare:** Unaffected.
- **Search:** Still findable.
- **Overlays/sourceId:** Warning is a false positive — acceptable to leave as known-gap with note.

---

## Implementation Order

If changes are made, apply in this sequence to keep quiz pool counts balanced:

1. **Modrić → AC Milan** (sourceId only, no hint rewrites — safest change)
2. **De Bruyne → Napoli** (sourceId + rewrite Hint 3 only)
3. **Trent → Real Madrid** (sourceId + rewrite Hints 1 and 3, review Hint 2)
4. **Núñez → quizEligible: false** (set flag + update notes)
5. **Ter Stegen → quizEligible: false** (set flag + update notes)
6. **Ederson → quizEligible: false** (optional; hints are less misleading than Núñez/ter Stegen)
7. **Sané → notes update only** (lowest urgency; hints are already club-agnostic)

After each group of changes, run:
```
npm run validate:overlays
npm run build
npm run lint
```

---

## Post-Change Quiz Pool Counts

| Club | Current quiz-eligible | After changes |
|---|---|---|
| manchester-city | 5 | 4 (de Bruyne moves, Ederson optionally drops) |
| liverpool | 5 | 3 (Trent moves, Núñez drops) |
| real-madrid | 5 | 5–6 (Trent arrives, Modrić departs) |
| barcelona | 5 | 4 (ter Stegen drops) |
| bayern-munich | 5 | 5 (Sané stays, no change) |
| ac-milan | 2 | 3 (Modrić arrives) |
| napoli | 1 (Lukaku) | 2 (de Bruyne arrives) |

All clubs remain at ≥ 2 quiz-eligible players. Liverpool at 3 is the tightest —
acceptable but worth noting for future editorial expansion in the Premier League pool.

---

## Hints That Need Rewriting (if changes proceed)

| Player | Hint # | Current (stale) text | Problem |
|---|---|---|---|
| de-bruyne | 3 | "…ginger beard and number 17 at City." | "at City" — stale |
| trent | 1 | "…who never left his boyhood club." | Factually false now |
| trent | 2 | "Premier League's most prolific assist-makers…" | League framing stale |
| trent | 3 | "…free-kicks and corners for Liverpool." | Club-specific, stale |
| nunez | 3 | "…beside Egypt's king on the right wing." | Liverpool-specific |

De Bruyne (1 hint), Trent (3 hints), and Núñez (1 hint, moot if quizEligible=false)
are the only rewrite work. Modrić, Ederson, ter Stegen, and Sané require no hint edits.

---

*No code or data changes have been made. This document records decisions only.*
