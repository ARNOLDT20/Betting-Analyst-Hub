# BetPredict Pro

A powerful bet prediction platform that analyses matches worldwide, generates daily multi-bets, highlights high-value hot games, and provides deep statistical analysis per fixture.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/betpredict run dev` — run the frontend (port 21765)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Recharts, Wouter, Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/matches.ts` — DB schema: matches, leagues, bet_of_the_day
- `artifacts/api-server/src/routes/` — API routes
- `artifacts/betpredict/src/pages/` — Frontend pages
- `artifacts/betpredict/src/components/` — Shared components (MatchCard, ConfidenceBar, PredictionBadge)

## Architecture decisions

- Dark-mode forced globally via `document.documentElement.classList.add("dark")` in Layout
- Prediction engine runs server-side: confidence scores computed from form, H2H, home advantage
- Bet of the Day generated daily and persisted in DB; regenerate endpoint clears and regenerates
- Free sports data: seeded manually with real teams/leagues; expandable via TheSportsDB or football-data.org
- Confidence bars are color-coded: green ≥75%, amber 50-75%, red <50%

## Product

- **Dashboard** — Mission Control with stats banner, Bet of the Day widget, Hot Games, and upcoming matches
- **Match Explorer** — Search, filter by country/league/status, group by league or country, grid/list view
- **Match Detail** — Deep analysis: team form, win probabilities, H2H history, goal expectations, betting notes
- **Hot Games** — High-value picks with featured game and value ratings
- **Bet of the Day** — AI multi-bet with combined odds, confidence, analysis note, regenerate button
- **Predictions** — Accuracy chart by league (Recharts bar chart) + detailed league breakdown table

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Always run `pnpm --filter @workspace/db run push` after changing DB schema
- Bet of the Day is cached per day in DB — use `/api/bet-of-the-day/regenerate` (POST) to refresh

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
