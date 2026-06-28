---
name: Football-data.org sync quirks
description: Rate limits, competition availability, standings format, and value rating formula for BetPredict Pro sync.
---

## Rate limits
Free tier: 10 req/min. Fix: sequential requests with 7.5s sleep between each. Never run `Promise.all([fetchMatches, fetchStandings])` — that fires 2 requests simultaneously and triggers 429s.

## Competition availability (free tier)
- WC, PL, PD, BL1, SA, FL1, CL, PPL, DED, BSA — all accessible
- EL (Europa League, id 2146) — returns 403 on free tier, removed from list

## World Cup standings format
`/competitions/WC/standings` returns multiple objects all with `type: "TOTAL"`, one per group (Group A–L). The old code `standings.find(s => s.type === "TOTAL")` only got Group A. Fix: `standings.filter(s => s.type === "TOTAL")` then flatten all `.table` arrays into one list.

## Off-season handling
European leagues (PL, PD, BL1, SA, FL1, CL, PPL, DED) are in off-season from ~May to August. Fetching `dateFrom=today dateTo=+45days` correctly returns 0 matches for those; Brasileirão (BSA) and WC run year-round/summer.

## TBD knockout matches
WC knockout stage (R16, QF, SF, F) has null team names until teams qualify. Filter these out in `fetchMatches`: `m.homeTeam?.name && m.awayTeam?.name && m.homeTeam.id !== 0`.

## Status filter
Always add `&status=SCHEDULED,TIMED,IN_PLAY,PAUSED` to `fetchMatches` to avoid pulling already-finished games.

## Value rating formula (fixed)
The old formula used `1/generateOdds(confidence)` which always gave negative edge (since our odds embed 8% margin). Fixed formula:
```
edge = confidence - (1/3)   // baseline for 3-outcome market
valueRating = clamp(0, 10, 5 + edge * 15)
```
`isHot` threshold: `valueRating >= 7.5` (≈ confidence ≥ 50%).

**Why:** The old formula made value rating *inversely* proportional to confidence (higher confidence → lower value), making Hot Games empty for all real data.
