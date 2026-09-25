# FlowCast

An AI cash and FX agent inside Intuit Enterprise Suite, and an open forecast graph that developers and advisors build on. Product-case prototype: front-end only, scripted-but-reactive AI, deterministic engine, fictional company data.

> FlowCast extends Intuit Intelligence's forecasting and Agent Studio to multi-currency treasury and third-party developers.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run test       # Vitest: forecast anchors, policy routing, FX, API, evals, intents
npm run qa         # banned-pattern grep + Playwright smoke test (needs a build)
```

The smoke test uses a local Chromium (`/opt/pw-browsers/...` or `CHROMIUM_PATH`).

## Deploy

Live at https://flowcast-kk.vercel.app/ (Vercel, SPA rewrites in `vercel.json`).

## Layout

- `src/data`: seed data (entities, rates, line items, agents, research, endpoints, interactions)
- `src/lib`: pure engine: `forecast`, `fx`, `policy`, `derive`, `intents`, `answers`, `api`, `manifest`, `evals`
- `src/store`: zustand store persisted under `flowcast-v1`
- `src/pages`: one file per kept route
- `DECISIONS.md`: judgment calls on ambiguous spec points
