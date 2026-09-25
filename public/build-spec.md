# FLOWCAST — MASTER BUILD SPEC FOR CLAUDE CODE (v2)
### Intuit PM Intern case: "Transform Intuit Enterprise Suite (IES) into an AI-powered finance and business platform for the mid-market"

> Paste everything above the APPENDIX into Claude Code in one go. **Part 0-A (Scope override) takes priority over every other part.** The APPENDIX is for Kaustubh only.
> Product name: **FlowCast**. It is defined once, in `src/config.ts`.

---

## ⚠️ PART 0-A. SCOPE OVERRIDE: 3-HOUR DEADLINE (READ BEFORE EVERYTHING ELSE)

The deadline is now **3 hours away**. This part **supersedes Parts 7, 8, 11, 13 and 14 wherever they conflict**. Every page you *do* build must still meet Part 0: no stubs, no dead links, and no banned patterns. **Anything cut must be removed entirely from the sidebar, links, and demo steps. Do not stub it.** Update `src/data/interactions.ts` so it lists only interactions on kept pages.

### Keep (build in this order; deploy after each phase)

| Phase | Time | Scope |
|---|---|---|
| 0 | 15m | Scaffold, design tokens, shell (top bar, persona switcher, sidebar, toasts, 404, error boundary, Reset demo), router with kept routes only, `vercel.json`, first deploy |
| 1 | 20m | Data + lib + store. Unit tests from Part 5.5 for **only** these: forecast anchors, W7 minimum, policy routing (REC-1 → approve, REC-2 → expert, trades → blocked), UK W6 gap with/without REC-1, and the capex breach in W7 vs. safe in W11 |
| 2 | 40m | `/app` Command Center (brief, KPIs, runway chart, **week drawer**, entity rows, action rail). `/app/ask` with **8 intents**: `fx_shock`, `afford_capex`, `uk_gap`, `low_point`, `hedge_eur`, `collections`, `board_summary`, `policy`. `/app/scenarios` with sliders, presets, breach banner, driver ranking, and critique; **no save or compare** |
| 3 | 30m | `/app/fx` (exposure table, net-first panel, hedge proposals with Adjust, partner execution gated on HedgeLoop). `/app/approvals` with the Escalate modal. `/app/trust` (autonomy matrix with real behavior changes, policy editor, access scopes, audit log with filters; **no guardrail tester, no CSV export**). `/app/marketplace` + detail + install with consent + uninstall |
| 4 | 30m | `/dev` home with journey tracker. `/dev/start` (onboarding stepper + first call). `/dev/api` with **6 endpoints**: entities, cash positions, forecast, fx exposures, forecast signals POST, recommendations POST. Try-it must return 200/400/403. `/dev/build` (manifest validate + two-way side form + run in sandbox + evals 47→50 with fixes). `/dev/publish` (listing form, checklist, review timeline, live, "See it as a customer" flywheel) |
| 5 | 20m | `/advisor` (queue, context package, response that updates the CFO approval). `/` landing. `/strategy` with anchors `#thesis #vision #pillars #moat #operating-model #platform #prioritization #roadmap #business-model #metrics #experiments #risks #competition #trade-offs`; `#experiments` holds the 5 riskiest-assumption cards from Part 10.3, read-only with no status select; `#competition` is a static table + static SVG 2×2. `/research` (evidence cards R1–R19 with theme filter, personas, journey-map table). `/ai-process` (D4D stepper + prompt library). `/about`. **Guided demo reduced to 10 steps** (below) |

### Kept routes (the full list; nothing else)
`/`, `/app`, `/app/ask`, `/app/scenarios`, `/app/fx`, `/app/approvals`, `/app/marketplace`, `/app/marketplace/:agentId`, `/app/trust`, `/dev`, `/dev/start`, `/dev/api`, `/dev/api/:endpointId`, `/dev/build`, `/dev/publish`, `/advisor`, `/strategy`, `/research`, `/ai-process`, `/about`, `*` (404).

### Cut completely
- Routes: `/app/forecast`, `/app/experts`, `/dev/earnings`, `/dev/docs`, `/experiments` (folded into `/strategy#experiments`)
- The command palette
- The notifications bell (keep toasts)
- Scenario save/compare
- All CSV exports and the board-summary .md download (keep Copy)
- The webhooks tab
- An interactive competitive 2×2
- The unit-economics calculator (show a static revenue-streams table instead)

**Re-point links that went to cut pages:**
- KPI tiles and entity rows open the **week drawer** or `/app/fx` / `/app/trust#policy` instead of `/app/forecast`.
- Expert booking disappears. Escalation happens only through the Escalate modal → `/advisor`.
- The "Why IES" and dev journey steps link only to kept pages. "Earn" becomes a static revenue-share explainer section on `/dev` (0% on the first $1M, then 15%; per-active-company pricing).

### Guided demo (10 steps)
1. `/` The problem and personas
2. `/app` The AI brief + sources
3. `/app/ask` Auto-run "What if EUR weakens 5%?"
4. `/app/scenarios` The Mexico expansion preset breaches policy; move the capex to W11
5. `/app/fx` Approve REC-2, which routes to the Escalate modal; submit
6. `/advisor` Elena approves with the ratio modified to 55%
7. `/app/approvals` The result comes back; approve it
8. `/dev/start` Sandbox + first API call
9. `/dev/build` Evals 47/50 → apply fixes → 50/50
10. `/dev/publish` Go live → see it as a customer → install RevForecast

The end card links to `/strategy#roadmap`.

### QA (replaces Part 13)
Keep `npm run build` (zero errors), the unit tests above, and `scripts/qa-grep.mjs`. Replace the Playwright crawler with **one smoke test** that visits every kept route and asserts no console errors and that no link points to a non-kept route. Skip the screenshots.

### Hard stop
At the **110-minute mark**, finish the current page, run QA, deploy, and print the production URL. **Do not start any new page after that point.** If a phase runs over, simplify the remaining pages (fewer items, static tables instead of charts) rather than skipping them. Every kept route must exist and be complete.

---

## PART 0. OPERATING RULES FOR CLAUDE CODE (read first, obey throughout)

You are building a **complete, fully functional, front-end-only web application**. Intuit product leaders will click through it for 10–15 minutes as the primary deliverable of a product-management case. It must behave like a real shipped SaaS product, not a mock-up.

### 0.1 Definition of "fully functional" in this project
- Every route listed in Part 7 exists and renders complete, final content. No route is missing and none is added outside that list.
- Every interactive element (button, link, tab, toggle, slider, input, chip, card click, menu item) does something observable. It must either navigate, change state that is visibly reflected somewhere, open or close UI, validate input, or copy to the clipboard with confirmation.
- Every interaction in the Interaction Inventory (Part 8) is implemented exactly as specified and carries its `data-action="<ID>"` attribute so automated tests can find it.
- All data flows from `src/data` through pure functions in `src/lib`. Numbers never contradict each other across pages, charts, and AI answers.
- State persists across reloads (zustand `persist` to localStorage under the key `flowcast-v1`). A **Reset demo** control restores the seed state.
- The AI is scripted but reactive. Answers are computed from the current state (scenario inputs, approvals, installed agents, autonomy settings), so they change when the user changes things. There are no real LLM calls, no API keys, and no network calls except the Google Fonts CSS.

### 0.2 Banned patterns (the QA script in Part 13 greps for these and must return zero hits)
- `href="#"`, `href=""`, `onClick={() => {}}`, or an empty handler
- `TODO`, `FIXME`, `lorem`, `ipsum`, "Coming soon", "Under construction", or "placeholder" appearing in user-visible text
- `console.log` in committed code
- Any toast or message whose only content is "Not implemented", "Out of scope", or similar
- Any page whose content is a bullet list of what "would" be there
- A form that submits without validation
- A button that looks enabled but does nothing

There is exactly one sanctioned way to show a future capability: a **Roadmap chip**. It is a small, non-button label reading "Roadmap · Next" or "Roadmap · Later". Hovering it shows a tooltip explaining when and why the capability arrives, and clicking it navigates to the matching anchor on `/strategy#roadmap`. Use it at most 6 times in the whole app, and never on a primary action.

### 0.3 Honesty rules (the case explicitly demands these)
- Every assumed number carries an `<AssumptionBadge note="...">` whose tooltip explains the reasoning.
- Every researched fact comes from Part 1, rendered with its source name and a clickable external link (`target="_blank" rel="noreferrer"`).
- Persona quotes are labeled "Composite quote, synthesized from research". Never present an invented quote as a real person's words.
- Mock company names are fictional. There is no real Intuit logo image: render a text wordmark instead.

### 0.4 Working method
1. Build in the phases in Part 14. After each phase, run `npm run build`, `npm run test`, and `npm run qa` (Part 13), fix every failure, commit, and deploy.
2. Before writing UI code, write the data layer and its unit tests (Part 5). The UI must not start until the data tests pass.
3. When a spec detail is ambiguous, choose the option that keeps the app complete and consistent. Record the decision in `DECISIONS.md` and do not stop to ask.
4. At the end of each phase, print a 3-line summary.

---

## PART 1. RESEARCH DOSSIER (ground truth for the Research and Strategy pages)

Render these facts on `/research` and reference them on `/strategy`. Keep the wording paraphrased; do not paste long quotes. Each item needs a source label and URL. Store them in `src/data/research.ts` as `{id, claim, sourceName, url, date, usedFor[]}`.

### 1.1 Intuit Enterprise Suite today (what we build on)
- **R1.** IES is Intuit's AI-native ERP for the mid-market. It combines multi-entity accounting, payroll, project profitability, BI, payments, and bill pay, and added Human Capital Management in the Spring 2026 release (May 2026). Third-party guides describe its target as the ~$5M–$250M revenue band.
  Sources: Out of the Box Technology, "IES Spring 2026", https://outoftheboxtechnology.com/intuit-enterprise-suite-spring-2026 ; Intuit press release, May 13, 2026, https://investors.intuit.com/news-events/press-releases/detail/1311/intuit-unlocks-new-phase-of-growth-for-mid-market-businesses-combining-data-and-ai-to-drive-faster-more-profitable-decisions
- **R2.** IES already ships domain agents:
  - A **Finance Agent** that produces a monthly multi-entity performance summary with drill-down.
  - A **Payments Agent** that Intuit says gets businesses paid ~5 days faster.
  - A **Sales Tax Agent** in early access.

  Sources: https://outoftheboxtechnology.com/intuit-enterprise-suite-spring-2026 ; https://investors.intuit.com/news-events/press-releases/detail/1260/intuit-launches-new-agentic-ai-experiences-and-financial-management-capabilities-for-intuit-enterprise-suite-to-drive-mid-market-business-growth ; https://investors.intuit.com/news-events/press-releases/detail/1302/intuit-launches-new-ai-powered-construction-edition-for-intuit-enterprise-suite
- **R3.** In August 2026, IES introduced **Intuit Intelligence Chat** (in beta), which recommends next steps and **acts only after the user confirms**. In the same release, **multi-currency moved into beta**. It runs on one permissioned rate table with an audit log and computes realized and unrealized FX gains and losses in line with ASC 830 and IAS 21. Intuit's GM framed the goal as AI that finance teams can stand behind when asked how a number was reached.
  Source: Intuit press release, Aug 12, 2026, https://investors.intuit.com/news-events/press-releases/detail/1319/intuit-advances-its-mid-market-platform-with-conversational-ai-enterprise-scale-and-deep-industry-workflows-for-cfos-and-accounting-firms
- **R4.** The same release says accounting firms are already deploying agents on Intuit's platform to close client books faster. Advisors are an active part of the ecosystem.
  Source: same as R3.
- **R5.** Intuit and Anthropic announced a multi-year partnership (Feb 2026). It lets mid-market businesses build and deploy custom agents inside IES via Intuit Intelligence.
  Source: https://investors.intuit.com/news-events/press-releases/detail/1305/intuit-and-anthropic-partner-to-bring-trusted-financial-intelligence-and-custom-ai-agents-to-consumers-and-businesses
- **R6.** Intuit extended AI-powered human experts to guided setup, onboarding, and bookkeeping (Oct 2025). The human + AI expert model already exists and can be extended to treasury.
  Source: https://investors.intuit.com/news-events/press-releases/detail/1277/intuit-unveils-revolutionary-system-of-intelligence-to-help-businesses-grow-in-the-ai-era
- **R7.** Intuit does not publish IES list prices. Independent estimates are ~$7.8K–8K per year for a single entity and ~$12K–15K+ per year for multi-entity setups. Reviewers flag that the partner and integration ecosystem is still thin because the product is young.
  Source: ERP Research, https://www.erpresearch.com/pricing/intuit-enterprise-suite ; https://www.erpresearch.com/erp/intuit-enterprise-suite

### 1.2 Developer economics today
- **R8.** The Intuit App Partner Program (2025) has four tiers: Builder (free), Silver, Gold, and Platinum. **Core (data-in) calls are unmetered. CorePlus (data-out: reads, queries, reports) calls are metered.** Builder includes 500K CorePlus credits per month, and calls above that are blocked.
  Sources: https://blogs.intuit.com/2025/05/15/introducing-the-intuit-app-partner-program/ ; https://static.developer.intuit.com/resources/Intuit_App_Partner_Program_Guide.pdf
- **R9.** Third-party coverage reports tier prices of Silver at ~$300/month and Gold at ~$1,700/month. Developer blogs describe read-metering as a cost that scales with the partner's success.
  Sources: https://report.woodard.com/articles/intuits-app-partner-program-marks-new-phase-in-developer-ecosystem-fpwr ; https://truto.one/blog/how-much-does-the-quickbooks-api-cost-2026-pricing-rate-limits/
- **INSIGHT (put it on the Strategy page):** AI agents are read-heavy. Metering reads per call penalizes exactly the agents IES wants. FlowCast's developer model therefore prices agent access per active connected company per month, not per read call. Sandbox reads are free. `Assumption`
- **R10.** Benchmark revenue share: Shopify takes 0% on a developer's first $1M in app revenue and 15% above that.
  Source: https://shopify.dev/docs/apps/store/revenue-share

### 1.3 The customer problem: cash forecasting and FX
- **R11.** In AFP's 2025 FP&A benchmarking survey, 96% of respondents used spreadsheets for planning, and only 23% used AI in forecasting regularly.
  Sources (secondary, cite as such): https://www.tesorio.com/blog/best-cash-flow-forecasting-software-in-2026-reviewed-and-compared ; https://www.floatapp.com/blog/implement-cash-flow-forecasting-finance-team
- **R12.** In APQC's 2025 survey of 316 finance leaders, 61% still manage cash flow in spreadsheets, even where payments and bank feeds are automated.
  Source: https://www.apqc.org/resources/blog/why-cash-flow-automation-stalls-and-how-finance-teams-can-break-through
- **R13.** A vendor survey of US mid-sized companies (Agicap, 2025) estimated the cost of unreliable cash forecasts at ~$465K per year, and found 43% admit relying on unreliable forecasts. Label this as vendor research.
  Source: https://agicap.com/en-us/article/cash-flow-forecast/
- **R14.** Gartner (2025, 200+ CFOs): 51% rank improving forecast accuracy among their top five priorities for 2026. (Secondary source.)
  Source: https://www.datarails.com/financial-forecasting-guide/
- **R15.** MillTech's Q1 2026 hedging monitor (250 UK/US corporates, $50M–$1B market cap) found:
  - 96% had losses from unhedged FX exposure in the quarter
  - Average hedge ratios rose to 57%
  - Average unhedged losses were ~£908K per company for the quarter

  Source: https://cfotech.co.uk/story/companies-boost-fx-hedging-as-currency-losses-mount
- **R16.** Among North American non-hedgers, 30% cite burdensome hedging infrastructure as a reason not to hedge. Prudent policy guidance targets 50–75% cover of highly certain flows. Netting across subsidiaries reduces cost.
  Sources: https://ctmfile.com/story/ifrs ; https://www.aspirations-group.com/post/fx-risk-is-the-mid-market-blind-spot-that-keeps-getting-bigger

### 1.4 Competitive landscape
- **R17.** Oracle NetSuite:
  - NetSuite Next (conversational ERP, agentic workflows) is rolling out through 2026.
  - It has an AI Connector Service built on MCP to connect external assistants.
  - SuiteAgents is an agent-building framework in SuiteCloud, described by partners as a developer product that is still maturing.
  - Base pricing is reported at ~$999–$5,000/month plus $129–$199 per user.

  Sources: https://www.kore1.com/netsuite-mcp-connector/ ; https://www.tvarana.com/blog/netsuite-next-a-guide-to-oracles-ai-powered-erp ; https://nexifygrowth.com/blog/ai-in-netsuite
- **R18.** SAP: the Joule Studio agent builder became generally available in Q1 2026. Joule offers role-based assistants, e.g. a finance manager forecasting cash flow.
  Source: https://research.aimultiple.com/sap-ai-agents
- **R19.** AI-native ERP entrants (Rillet, Campfire, DualEntry, Light) raised several hundred million dollars in 2025–26 and pitch replacing NetSuite. Their focus is the general ledger and close, not treasury or FX forecasting, and they lack an expert network.
  Sources: https://www.erpresearch.com/en-us/ai-native-erp ; https://wetheflywheel.com/en/comparisons/dualentry-vs-campfire-vs-rillet/
- **Workday:** strongest in enterprise HCM and financials, and priced for the upper mid-market and enterprise. Mark as "positioning based on public info; verify".

### 1.5 The strategic synthesis (the one-sentence thesis, shown on `/strategy`)
> "IES just gained multi-currency and conversational AI, yet mid-market finance teams still forecast cash in spreadsheets and lose money on FX they cannot see. Incumbents are bolting agent frameworks onto heavy ERPs, while AI-native entrants focus on the ledger. IES should win forward-looking cash and currency decisions: first with its own trusted agent, then by opening the same forecast graph to developers and advisors."

---

## PART 2. PRODUCT CONCEPT

### 2.1 One-liner
**FlowCast** is an always-on AI cash and currency agent inside IES. It is also an open **Forecast Graph** that developers and advisors extend with their own agents and signals.

### 2.2 Personas (all three appear; the CFO and the developer get equal depth)

**Priya Raman, CFO, Solace Living Inc.** (customer)
- **JTBD:** "When the week starts, I want to know where cash will be across every entity and currency for the next 13 weeks, so I can decide what to fund, hedge, or delay with confidence."
- **Pain:** a Monday spreadsheet rebuilt from exports; FX she only sees after the fact; expertise she can't afford to hire.

**Marcus Lee, Controller** (supporting user). He owns approvals, the audit trail, and policy.

**Dev Shah, co-founder of "Northbeam Labs"** (a fictional 6-person fintech; developer/ISV)
- **Builds:** "RevForecast for DTC", an agent that improves revenue and payout forecasts for e-commerce brands.
- **JTBD:** "When I build an AI agent for finance teams, I want real-time, AI-ready data and a clear path to paying customers, so I can ship in weeks, not quarters."
- **Pain:** report-centric APIs, metered reads that punish agents, no agent framework, unclear monetization.

**Elena Vogt, CTP, treasury advisor at partner firm "Harbor & Vale Advisory"** (advisor/expert; fictional)
- **JTBD:** "When a client escalates a treasury decision, I want the full context instantly so I can advise in 30 minutes, not 3 days."

### 2.3 Human + AI operating model (implemented in the Trust Center and enforced app-wide)

| Tier | Meaning | Examples |
|---|---|---|
| **Autonomous** | Acts without asking, logs everything | Data consolidation, FX rate refresh, forecast refresh, anomaly detection, drafting collection emails |
| **Suggest & approve** | Proposes; a human clicks Approve | Intercompany transfers, hedges under the policy threshold, payment timing changes |
| **Expert required** | Routed to a human expert, then approval | Hedges at or above the threshold, anything outside policy, first-time instruments |
| **Never autonomous** | Hard-locked | Moving money or executing trades. These are always executed by a licensed partner after explicit approval |

**Trust mechanics:**
- A deterministic calculation engine produces every number; the "AI" only explains.
- Source chips appear on every claim.
- A confidence score is shown, and the agent abstains below 70%.
- Third-party agents get scoped, revocable permissions.
- Every action is written to the audit log.

---

## PART 3. TECH STACK AND ARCHITECTURE

- **Vite + React 18 + TypeScript (strict)**
- **Tailwind CSS**
- **React Router v6** (`createBrowserRouter`), plus `vercel.json` rewrites
- **zustand** with `persist`
- **Recharts**
- **lucide-react**
- **framer-motion** (for the few meaningful motions listed in Part 4 only)
- **Vitest** (unit tests)
- **Playwright** (crawler QA)
- No component library. Build a small in-house kit.

```
src/
  config.ts                 product name, tagline, builder bio, external links, feature constants
  data/
    seed.ts                 the full seed state (Part 5)
    company.ts entities.ts rates.ts flows.ts
    fx.ts agents.ts experts.ts developer.ts
    research.ts strategy.ts chat/ (intent definitions)
  lib/
    forecast.ts             buildForecast(state, scenario) → weekly series per entity + consolidated + bands
    fx.ts                   exposures(), netting(), sensitivity(), hedgeProposal()
    policy.ts               checkPolicy(action, policy) → {allowed, route: 'auto'|'approve'|'expert'|'blocked', reasons[]}
    intents.ts              matchIntent(text) → intentId | null  (keyword + synonym scoring)
    answers.ts              buildAnswer(intentId, state) → {thinking[], text, sources[], confidence, viz?, actions[]}
    api.ts                  mockApi(endpoint, params, state) → {status, json} (validates params, returns 400/403 properly)
    manifest.ts             parseManifest(text) → {ok, errors[], manifest}
    evals.ts                runEvals(manifest, attempt) → deterministic results
    format.ts               money(), pct(), fxRate(), weekLabel()
  store/
    useApp.ts               a single zustand store with slices: session, customer, developer, advisor, ui, audit
  components/               kit + domain components
  layouts/                  AppShell, CustomerLayout, DeveloperLayout, AdvisorLayout, StoryLayout
  pages/                    one file per route in Part 7
  tests/                    vitest unit tests
e2e/                        Playwright crawler + flow tests
scripts/qa-grep.mjs         banned-pattern scanner
```

**Store slices (minimum):**
- `session`
  - `persona: 'cfo' | 'developer' | 'advisor'`
  - `demo: {active, step}`
- `customer`
  - `scenario` (all slider values)
  - `savedScenarios[]`
  - `recommendations[]` (`status: open | approved | dismissed | escalated | executed`)
  - `autonomy: Record<TaskId, Tier>`
  - `policy: {minCash, hedgeBandMin, hedgeBandMax, approvalThresholdUSD, allowedInstruments[]}`
  - `installedAgents: string[]`
  - `agentScopes: Record<agentId, scope[]>`
  - `bookings[]`
  - `notifications[]`
  - `chatHistory[]`
- `developer`
  - `onboardingStep`, `apiKey`, `sandboxReady`
  - `manifestText`, `evalRuns[]`
  - `listing`, `publishStatus: draft | submitted | in_review | live`
  - `firstCallAt`, `startedAt`
- `advisor`
  - `queue[]`, `responses[]`
- `audit`
  - `log[]` (`{ts, actor: 'agent' | 'user' | 'expert' | 'thirdParty', tier, message, sourceIds[]}`)

All mutations go through named store actions. Every action that changes business state also appends an audit entry.

---

## PART 4. DESIGN SYSTEM (deliberate, not templated)

Direction: **"Treasury desk, made calm."** The product borrows the precision of an FX trading screen (tight numerals, clear signed values, crisp rules), softened for a mid-market CFO. The memorable element is the **13-week cash "runway" chart** with its confidence band and policy floor. Spend the visual boldness there, and keep everything else quiet.

**Color tokens**, defined as CSS variables:

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0E2A47` | Primary text and headers |
| `--action` | `#236CFF` | Primary buttons and links |
| `--cash` | `#0F8A5F` | Positive values, success |
| `--risk` | `#C2410C` | Policy breach, negative |
| `--fx` | `#B7791F` | Currency and exposure accents |
| `--ai` | `#6E56CF` | Reserved only for AI-generated content |
| `--paper` | `#F5F7FA` | Page background |
| `--surface` | `#FFFFFF` | Cards and panels |
| `--rule` | `#DDE3EA` | Borders and dividers |
| `--muted` | `#5B6B7C` | Secondary text |

Developer pages use a dark variant: background `#0B1B2E`, surface `#11263D`, text `#E6EDF5`, with the same action and AI colors.

**Typography:**
- **IBM Plex Sans** for all UI, with **tabular numerals everywhere** (`font-feature-settings: "tnum"`).
- **IBM Plex Mono** only inside code blocks and JSON.
- Type scale: 12 / 14 / 16 / 20 / 28 / 40.
- Headlines use sentence case. No ALL-CAPS eyebrow labels. No single-word color accents in headlines.

**Layout:**
- Left sidebar navigation (240px) for app areas; a top bar holds persona switch, search, notifications, and the demo button.
- Content max-width is 1280px.
- Don't chop everything into identical cards. Use hierarchy: one dominant chart panel, a secondary rail, and plain tables with rules.
- Vary border radius by role: 10px panels, 6px inputs and chips, 999px only for status pills.

**Signed numbers:**
- Positive values render in `--cash` with a leading "+".
- Negative values render in `--risk` with "−" (the U+2212 minus sign).
- Currency codes appear as small caps-free chips (e.g. `EUR`).

**Motion.** Only these five:
1. The AI "thinking" checklist
2. Token streaming of AI text (20ms per word; `prefers-reduced-motion` renders instantly)
3. The chart morph when scenario inputs change
4. Drawer and modal open/close
5. A single confetti burst when an agent goes live

No scroll-triggered fade-ins.

**Copy rules:**
- Active voice; buttons say exactly what happens ("Approve transfer" produces the toast "Transfer approved").
- No "→" appended to button text.
- Errors state what happened and how to fix it.

**Accessibility:**
- Visible focus rings; every control reachable by keyboard.
- `aria-label` on icon buttons.
- Color is never the only signal (pair it with an icon or text).
- Contrast of at least 4.5:1.

**Responsive:** must work at 1440, 1280, 1024, 768, and 390px. At ≤1024px the sidebar collapses to icons; at ≤768px it becomes a drawer. Tables scroll horizontally inside their own container.

---

## PART 5. DATA MODEL AND ANCHORS (write these first, with tests)

### 5.1 Company (fictional). Every figure is marked `Assumption`.

**Solace Living Inc.**
- A home goods brand headquartered in Austin, TX.
- ~640 employees and ~$180M revenue.
- Runs on IES with multi-currency (beta) enabled.

| id | Entity | Ccy | Role | Opening cash (local) |
|---|---|---|---|---|
| US | Solace Living Inc. (parent) | USD | HQ, D2C + wholesale | 13,700,000 |
| UK | Solace UK Ltd | GBP | UK retail/wholesale | 2,100,000 |
| DE | Solace GmbH | EUR | EU distribution | 3,050,000 |
| MX | Solace Manufactura S.A. de C.V. | MXN | Manufacturing | 58,000,000 |
| IN | Solace Design India Pvt Ltd | INR | Design & engineering | 145,000,000 |

**Base rates (USD per 1 unit):** GBP 1.27, EUR 1.09, MXN 0.055, INR 0.012. These are shown as "Rate table · IES multi-currency (beta)", with an assumption note that they are illustrative, not live.

**Consolidated opening cash:** ≈ **$24.62M**. This must be computed from the table above, not typed in.

**Policy (seed):**
- Minimum consolidated cash: **$12.0M**
- Hedge band: **40–75%** of net forecast exposure
- Approval threshold: **$500K** notional; at or above this, expert review is required
- Allowed instruments: forward, layered forwards

### 5.2 Forecast anchors (the base scenario must hit these; enforce with tests)

Consolidated closing cash, USD millions, weeks 1–13. The tolerance is ±0.05.

| Week | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 | W12 | W13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Closing cash (USD M) | 24.0 | 22.9 | 23.3 | 21.5 | 20.6 | 17.5 | **15.2 (low)** | 17.8 | 15.8 | 16.7 | 22.3 | 21.1 | 21.6 |

**Story beats**, each generated from explicit line items so the drill-downs make sense:
- **W6:** UK monthly payroll plus quarterly VAT. The UK entity's local balance goes **negative (≈ −£0.35M)** without action, even though consolidated cash is fine.
- **W7:** US biweekly payroll plus a large supplier AP run. This is the consolidated low point.
- **W9:** Mexico raw-materials prepayment of **MX$42M**.
- **W11:** EU wholesale receipt of **€4.8M** from the customer "Maison Nord".
- **Recurring payroll cadence:** US biweekly (W1, 3, 5, 7, 9, 11, 13); UK, DE, and IN monthly; MX weekly.

**Line-item categories:** `ar_collections`, `commerce_payouts`, `wholesale_receipts`, `ap_suppliers`, `payroll`, `rent`, `tax`, `intercompany`, `capex`, `other`. Each item has `{id, entity, week, category, amountLocal, currency, sourceSystem: 'IES Accounting'|'IES Payroll'|'IES Commerce'|'Bank feed'|'Marketplace: ShipSignal', counterparty?, confidence}`.

**Confidence band:** the P10/P90 half-width grows linearly from ±3% in W1 to ±11% in W13.

**Accuracy history:** 8 past weeks of forecast vs. actual.
- FlowCast's 4-week-horizon MAPE should come out at ~3.8%; a "spreadsheet baseline" series has MAPE ~14%.
- Both are computed from seeded pairs and marked `Assumption`, with this note: "illustrative. The real target is validated in shadow mode (see Experiments)."

### 5.3 FX exposure (computed in `lib/fx.ts` from line items, with no hard-coded outputs)

The seed data should produce roughly these net 13-week exposures:

| Currency | Direction | Amount |
|---|---|---|
| EUR | Long | ≈ €2.3M |
| GBP | Short | ≈ £0.8M |
| MXN | Short | ≈ MX$96M |
| INR | Short | ≈ ₹120M |

**Netting view:**
- "Entity-by-entity hedge requirement" = the sum of each entity's own absolute net foreign exposure.
- "Group-level requirement after netting" = the requirement once intercompany offsets are applied.
- Tune the seed so the reduction lands between 30% and 45%. Display the computed percentage, headlined "Net first, hedge second".

**Sensitivity:**
- `sensitivity(ccy, pct)` returns the USD impact on 13-week consolidated cash.
- Show the impact for ±1%, ±5%, and ±10%.

### 5.4 Recommendations (seed; statuses live in the store)

Each recommendation's route is computed by `policy.ts`, never hard-coded.

| ID | Title | Detail | Route |
|---|---|---|---|
| REC-1 | Move €720K from DE to UK in W5 | Covers the W6 GBP gap. Estimated saving vs. spot purchase + fees: ~$9.4K `Assumption` | Suggest & approve |
| REC-2 | Forward-hedge 60% of the net EUR long (≈€1.38M, 3-month tenor) | Notional ≥ $500K | Expert required |
| REC-3 | Layered forwards for 50% of the MXN short | Tranches below the threshold | Suggest & approve |
| REC-4 | Draft reminders for 3 overdue Maison Nord invoices (€610K) | — | Autonomous (drafts only) |
| REC-5 | India payroll +9% vs. trailing average | Traced to 14 new hires in IES Payroll data | Autonomous (insight only) |

### 5.5 Unit tests that must pass (`src/tests/*.test.ts`)
- The consolidated opening balance equals the sum of converted entity openings.
- The base scenario hits every W1–W13 anchor within ±0.05M, and W7 is the minimum.
- The UK entity's local balance in W6 is below 0 without REC-1 and above 0 with REC-1 approved.
- The netting reduction is between 30% and 45%.
- `checkPolicy`:
  - REC-2 → `expert`
  - REC-1 → `approve`
  - Any `execute_trade` → `blocked` unless partner-executed after approval
- Moving a $3.5M capex into W7 breaches the $12M policy (new low ≈ $11.7M). Moving it to W11 keeps the low at W7 = $15.2M.
- EUR −5% produces a negative consolidated impact, equal to −5% of all EUR-denominated net inflows and balances converted at the base rate.
- `parseManifest` rejects:
  - a missing `name`
  - an unknown scope
  - `autonomy: act` without a `humanCheckpoint`
- `runEvals` is deterministic: attempt 1 → 47/50 with 3 named failures; attempt 2 after "fixes" → 50/50.
- `mockApi`:
  - returns **403** when the key lacks a scope
  - returns **400** on an invalid `entity`
  - returns **200** with correct numbers otherwise

---

## PART 6. GLOBAL SHELL (present on every app page)

- **Top bar:**
  - The wordmark "FlowCast", with the small text "for Intuit Enterprise Suite" (links to `/`).
  - **Persona switcher** (CFO · Developer · Advisor). Switching navigates to that persona's home and persists.
  - **Command palette** (⌘K / Ctrl K and a search button). Fuzzy search over every route, every scripted question, every marketplace agent, and every API endpoint. Enter navigates; for a question, it opens `/app/ask` and runs it.
  - **Notifications bell**, showing an unread count from `notifications[]`. The dropdown lists items; clicking one navigates and marks it read. "Mark all read" works.
  - **Guided demo** button.
  - Avatar menu: Profile (opens a modal with the persona card), Reset demo (confirm modal, then restore the seed and show a toast), About the builder (`/about`).
- **Sidebar:** per-persona navigation, exactly as in Part 7.
- **Footer** on story pages: Strategy, Research, Experiments, How I used AI, About, and Reset demo.
- **404 page:** a friendly message with links to the three persona homes and the palette hint.
- **Error boundary:** a readable error, a "Reset demo and reload" button, and a "Go home" button.
- **Toasts:** bottom-left. Success, info, and error variants. Auto-dismiss after 4s with an Undo action where the spec says so.

---

## PART 7. ROUTE INVENTORY (complete; no other routes)

| Route | Page | Sidebar group |
|---|---|---|
| `/` | Story landing | none |
| `/app` | CFO Command Center | CFO: Overview |
| `/app/forecast` | Forecast explorer | CFO: Overview |
| `/app/ask` | Ask FlowCast | CFO: Overview |
| `/app/scenarios` | Scenario Lab | CFO: Plan |
| `/app/fx` | FX exposure & hedging | CFO: Plan |
| `/app/approvals` | Approvals inbox | CFO: Act |
| `/app/experts` | Expert help | CFO: Act |
| `/app/marketplace` | Agent marketplace | CFO: Extend |
| `/app/marketplace/:agentId` | Agent detail | (child) |
| `/app/trust` | Trust Center (autonomy, policy, access, audit log) | CFO: Govern |
| `/dev` | Developer home | Developer |
| `/dev/start` | Onboarding & sandbox | Developer |
| `/dev/api` | API explorer | Developer |
| `/dev/api/:endpointId` | Endpoint detail | (child) |
| `/dev/build` | Agent builder & evals | Developer |
| `/dev/publish` | Certification & publish | Developer |
| `/dev/earnings` | Earnings & agent health | Developer |
| `/dev/docs` | Docs (guides: quickstart, scopes, autonomy levels, eval spec, pricing, rev share) | Developer |
| `/advisor` | Advisor workspace (client queue + context package + response) | Advisor |
| `/strategy` | Vision → risks, long page with anchors | Story |
| `/research` | Research dossier + personas + journey map | Story |
| `/experiments` | Riskiest assumptions and test plans (interactive board) | Story |
| `/ai-process` | How AI was used (D4D stepper + prompt library) | Story |
| `/about` | Builder bio + links | Story |
| `*` | 404 | none |

---

## PART 8. PAGE SPECS + INTERACTION INVENTORY

Each page lists its sections and interactions. The **ID** must appear as `data-action` on the element. Each page also needs loading skeletons: show them for 400ms on first visit per session to simulate fetches, never longer.

### 8.1 `/` Story landing
- **Hero:**
  - Headline: "Know where your cash will be, in every currency, before it moves."
  - Subline: "FlowCast is an AI cash and FX agent inside Intuit Enterprise Suite, and an open forecast graph that developers and advisors can build on."
  - The signature element is a live mini version of the runway chart, animated once on load.
- **Problem strip.** Three stats from R11, R15, and R13, each linked to its source. Below them, a D4D line in the customer's words: "Every Monday I rebuild the cash forecast from four exports, and I still find out about FX after it's hit us." (Composite quote label.)
- **Three journey entries:** "Run finance as Priya", "Build as Dev", "Advise as Elena". Each has a one-line description and a primary button.
- **"Start the 12-minute guided demo"** as the primary CTA.
- **Why IES wins this:** four short points (unified ledger, payroll, commerce, and bank data; multi-currency now native; human + AI experts; an open agent platform), each linking to the matching Strategy anchor.

| ID | Element | Behavior |
|---|---|---|
| L-01 | Start guided demo | Sets demo active at step 1 and navigates to `/app` |
| L-02 | Run finance as Priya | Sets persona `cfo` and navigates to `/app` |
| L-03 | Build as Dev | Sets persona `developer` and navigates to `/dev` |
| L-04 | Advise as Elena | Sets persona `advisor` and navigates to `/advisor` |
| L-05..08 | "Why IES" points | Navigate to `/strategy#pillars`, `#moat`, `#operating-model`, `#platform` |
| L-09 | Stat source links | Open the external URL in a new tab |

### 8.2 `/app` CFO Command Center
- **Header:** "Good morning, Priya". Show the entity count and a freshness chip ("Refreshed 6:02 AM · Autonomous"), where the chip's tooltip lists the sources refreshed.
- **AI brief panel** (violet):
  - Streams on the first visit each session.
  - Its text is built by `answers.ts` from current state: consolidated cash, the 13-week low and its week, the UK gap status (resolved or unresolved depending on REC-1), unhedged exposure, and the pending approvals count.
  - Source chips sit under the text; clicking one opens the **Source drawer**, which lists the actual line items.
- **KPI row** (5 tiles):
  - Consolidated cash
  - 13-week low (with week)
  - Headroom vs. policy
  - Unhedged exposure (USD)
  - Forecast accuracy (MAPE)
  - Each tile is clickable.
- **Runway chart:**
  - Consolidated closing cash with the P10–P90 band, a dashed policy line, and event markers for W6, W7, W9, and W11.
  - A week hover shows a tooltip with inflows, outflows, and closing cash.
  - Clicking a week opens the **Week drawer**, which shows line items grouped by entity and category, with totals that reconcile to the chart.
- **Entity strip:** 5 rows (not cards). Each shows code, currency, local balance, USD equivalent, a 13-week sparkline, and a status: OK, Watch, or Gap. The UK row shows "Gap" until REC-1 is approved.
- **Action rail:** open recommendations (top 3), each with autonomy tier pill, confidence, impact, and inline actions.

| ID | Element | Behavior |
|---|---|---|
| C-01 | Source chip | Opens the Source drawer filtered to the source |
| C-02 | KPI tiles (×5) | Navigate: cash → `/app/forecast`; low → `/app/forecast?week=<w>`; headroom → `/app/trust#policy`; unhedged → `/app/fx`; MAPE → `/app/forecast#accuracy` |
| C-03 | Chart week click | Opens the Week drawer |
| C-04 | Entity row click | Navigates to `/app/forecast?entity=<id>` |
| C-05 | Recommendation "Approve" | Runs `policy.ts` checks. If the route is `approve`, sets status approved, logs an audit entry, recalculates the forecast, and shows a toast with Undo (5s). If the route is `expert`, opens the **Escalate modal** instead (see 8.7) |
| C-06 | Recommendation "Why?" | Opens `/app/ask` and runs the intent explaining that recommendation |
| C-07 | Recommendation "Dismiss" | Asks for a reason (select + optional text, required select), sets status dismissed, logs it |
| C-08 | "View all approvals" | Navigates to `/app/approvals` |
| C-09 | Brief "Regenerate" | Re-streams the brief from current state |

### 8.3 `/app/forecast` Forecast explorer
- **Controls:** entity selector (All + 5 entities), currency toggle (USD / local; local is disabled for All), horizon (4 / 8 / 13 weeks), and a category filter (multi-select chips). All of these sync to URL query params, so deep links work.
- **Main chart** responds to the controls.
- **Driver waterfall** for the selected horizon: opening balance, each category, then closing balance.
- **"Explain this forecast"** streams an explanation for the current selection.
- **Line-item table:** sortable columns, search, pagination (25 per page), and a **CSV export** that downloads a real CSV of the filtered rows.
- **Accuracy section** (`#accuracy`): forecast vs. actual (8 weeks), the MAPE trend, and a baseline comparison.
- **Data lineage:**
  - A node diagram (SVG) showing IES Accounting, IES Payroll, IES Commerce, Bank feeds, and installed marketplace signals feeding the forecast.
  - Installed agents appear as nodes dynamically. For example, ShipSignal is seeded as installed, and RevForecast appears once it is live and installed.
  - Clicking a node filters the table to that source.

| ID | Element | Behavior |
|---|---|---|
| F-01 | Entity select | Updates URL and all views |
| F-02 | USD / local toggle | Updates URL and all views |
| F-03 | Horizon select | Updates URL and all views |
| F-04 | Category chips | Update URL and all views |
| F-05 | Explain | Streams the answer |
| F-06 | Table sort / search / page | Sort, search, and paginate the table |
| F-07 | Export CSV | Downloads `flowcast-forecast-<entity>-<date>.csv` |
| F-08 | Lineage node | Filters the table to that source |

### 8.4 `/app/ask` Ask FlowCast
- Chat thread (persisted), composer, **suggested question chips**, and a "Clear conversation" control with confirmation.
- `intents.ts` scores the text against the intent keyword and synonym lists.
  - If the best score is at or above the threshold, answer that intent.
  - Otherwise respond with a **clarifying answer** that lists the 3 closest intents as chips. This counts as a real answer, not a failure.
  - Out-of-domain text (e.g. "weather") gets "I only work with Solace Living's cash, currency, and approvals data" plus the chips.
- **Every answer includes:**
  - a thinking checklist (2–4 steps, derived from which lib functions ran)
  - streamed text
  - an optional inline visualization (mini chart or table)
  - source chips
  - a confidence pill
  - an autonomy footer ("I can prepare this; you approve")
  - action buttons that perform real store actions

**Intents** (at least 12; all numbers computed from state):

| Intent | What the answer does |
|---|---|
| `fx_shock` ("what if EUR / GBP / MXN / INR moves X%") | Parses currency and % from the text (default EUR −5%). Shows the impact on the low point and total. Action: "Open in Scenario Lab" (deep-links with those values) |
| `afford_capex` ("can we afford $X in week N") | Parses amount and week. Computes the new low; if it breaches policy, suggests the earliest safe week. Actions: "Model it", "Ask an expert" |
| `uk_gap` | Explains W6. Action: "Approve REC-1" (routes through the policy check) |
| `low_point` | Why the low is where it is, with the top 3 drivers |
| `collections` | Top overdue invoices table. Action: "Draft reminders" (creates 3 drafts viewable in a modal with copy buttons) |
| `hedge_eur` | REC-2, with the policy explanation and the "not financial advice" line. Action: "Escalate to expert" |
| `hedge_mxn` | REC-3 |
| `payroll_india` | REC-5 anomaly, with the new-hire breakdown |
| `board_summary` | 5-bullet summary. Actions: "Copy", and "Download .md" (a real file) |
| `whats_changed` | Diff since the last visit: approvals made, scenario changes, installed agents |
| `policy` | Current policy values. Action: "Edit policy" (navigates to `/app/trust#policy`) |
| `agents` | Lists installed agents and what each contributes. Action: "Browse marketplace" |

| ID | Element | Behavior |
|---|---|---|
| A-01 | Send (Enter) | Sends the message and answers |
| A-02 | Suggested chip | Sends the chip text |
| A-03 | Answer action buttons | Perform the specified action |
| A-04 | Source chip | Opens the drawer |
| A-05 | Clear conversation | Confirms, then clears |
| A-06 | Copy answer | Copies to the clipboard and shows a toast |

### 8.5 `/app/scenarios` Scenario Lab (live math)
- **Sliders:**
  - EUR, GBP, MXN, and INR vs. USD (−10% to +10%, step 0.5)
  - DSO shift (−10 to +20 days); this shifts `ar_collections` timing
  - Revenue change (−20% to +20%); this scales commerce and wholesale receipts
  - Additional hires (0–50); this adds a payroll cost using per-entity average salaries from the seed
  - Capex item: amount + week picker
  - Toggle: delay the MX prepayment to W12
- **Output:**
  - Base vs. scenario runway chart
  - Low point delta
  - Policy status banner (OK or Breach, with the breach week)
  - A **driver ranking bar**, showing which input moved the low the most (computed by one-at-a-time sensitivity)
- **Presets:** Strong dollar, Recession-lite, Growth push, and Mexico expansion ($3.5M in W7). Each sets defined values.
- **Save scenario:** name required (validated, unique), stored, and listed in "Saved scenarios" with load, rename, and delete.
- **Compare:** pick 2 saved scenarios to see an overlay chart.
- **"Critique my scenario":** a streamed answer that names the top driver and suggests a mitigation drawn from the recommendation set.

| ID | Element | Behavior |
|---|---|---|
| S-01 | Sliders / inputs | Recompute live (debounced 100ms) |
| S-02 | Presets | Apply their defined values |
| S-03 | Reset to base | Restores base values |
| S-04 | Save | Saves the named scenario |
| S-05 | Load | Loads a saved scenario |
| S-06 | Rename | Renames a saved scenario |
| S-07 | Delete | Deletes with Undo |
| S-08 | Compare | Shows the overlay chart |
| S-09 | Critique | Streams the critique |
| S-10 | "Send to Ask" | Opens chat with the scenario context |

### 8.6 `/app/fx` FX exposure & hedging
- **Exposure table:** currency, inflows, outflows, net, hedged %, unhedged USD, and ±1% sensitivity. Rows expand to show the contributing entities.
- **"Net first, hedge second" panel:** a two-bar comparison with the computed % reduction and an explanation. Intercompany transfer suggestions come from the netting logic.
- **Hedge proposals:** built by `hedgeProposal()` from the policy band. Each card shows instrument, notional, tenor, rationale, confidence, and the policy check list (✓/⚠).
  - Actions: Approve, Escalate to expert, Adjust. "Adjust" opens a modal with a hedge ratio slider constrained to the policy band; the notional and routing update live.
- **Execution panel** (for approved hedges only):
  - "Execute via partner" is enabled only if a partner execution agent (HedgeLoop) is installed. Otherwise the button reads "Install an execution partner" and links to the marketplace filtered to FX execution.
  - Execution opens a confirmation modal ("FlowCast never moves money itself. HedgeLoop, a licensed partner, will execute. Confirm?"), then status becomes Executed via partner, with an audit log entry.
- **Policy summary** with a link to edit it.

| ID | Element | Behavior |
|---|---|---|
| X-01 | Expand row | Shows contributing entities |
| X-02 | Approve hedge | Policy check: approve, or route to expert |
| X-03 | Escalate | Opens the Escalate modal |
| X-04 | Adjust | Opens the modal; saving updates the proposal |
| X-05 | Execute via partner | Confirm modal, then executed |
| X-06 | Install partner link | Navigates to `/app/marketplace?category=fx-execution` |
| X-07 | Edit policy | Navigates to `/app/trust#policy` |

### 8.7 `/app/approvals` Approvals inbox
- **Tabs:** Needs my approval, With expert, Approved, Executed, Dismissed. Counts are live.
- Each row shows its full detail, policy routing reasons, sources, and history (audit entries for that item).
- **Bulk approve** only works for items whose route is `approve`. Mixed selections show which items were skipped and why.
- **Escalate modal** (shared component):
  - A pre-built context package (question, exposures, forecast snapshot, policy, relevant sources)
  - Expert chooser (3 experts from `experts.ts`)
  - Urgency select
  - Note (required, at least 10 characters)
  - On submit: status becomes `escalated`, the item appears in the Advisor queue, and a notification and audit entry are created.

| ID | Element | Behavior |
|---|---|---|
| P-01 | Tab switch | Switches tab |
| P-02 | Row expand | Expands the row |
| P-03 | Approve | Approves the item |
| P-04 | Dismiss | Dismisses the item |
| P-05 | Escalate | Opens the Escalate modal |
| P-06 | Bulk select | Selects multiple items |
| P-07 | Bulk approve | Approves eligible items |
| P-08 | Undo | Undoes the last action |

### 8.8 `/app/experts` Expert help
- **Expert directory:** 3 fictional experts (Elena Vogt, CTP, FX & treasury; Rahul Menon, CPA, intercompany & tax; Sofia Park, FP&A). Each shows specialties, languages, rating, and next slots.
- **Book session:** choose an expert, then a slot (from generated availability for the next 7 days), then a topic (select), then attach context (checkboxes for recommendations or saved scenarios), then confirm. Bookings appear under "Upcoming", where they can be cancelled with a confirmation.
- **Past session:** one seeded completed session with the expert's notes and an "AI summary of session" that has 3 action items. "Add to approvals" converts an action item into a recommendation.
- **Pricing note:** "2 sessions per quarter included with the FlowCast Treasury add-on; then $149 per session" `Assumption`.

| ID | Element | Behavior |
|---|---|---|
| E-01 | Book | Opens the booking stepper |
| E-02 | Stepper next/back | Moves between steps (with validation) |
| E-03 | Confirm | Creates the booking |
| E-04 | Cancel booking | Confirms, then cancels |
| E-05 | Add action item to approvals | Creates a recommendation |
| E-06 | View escalations | Navigates to `/app/approvals` with the "With expert" tab |

### 8.9 `/app/marketplace` and `/app/marketplace/:agentId`

**Catalog.** Agents in `agents.ts` (at least 9), each with `{id, name, publisher, category, description, scopes[], pricing, rating, installs, verified, contributes: 'signal'|'action'|'insight', status}`:

| Agent | Publisher | Notes |
|---|---|---|
| ShipSignal | Freight cost signals | Seeded as installed |
| HedgeLoop | FX execution via licensed partner banks | Category `fx-execution` |
| TariffWatch | Tariff impact on COGS | — |
| CollectIQ | AR collections agent | — |
| BankBridge | Additional bank connectors | — |
| PayTiming | Optimizes payment timing | — |
| Intuit Close Assistant | First-party | — |
| Harbor & Vale Treasury Desk | Advisor firm offering packaged reviews | Shows the advisor side of the ecosystem |
| **RevForecast for DTC** | Northbeam Labs | Status `unpublished` until the developer journey publishes it; hidden from the catalog until then, with a "New" badge after |

**Catalog page:** search, category filter, "Installed" filter, and sort by rating, installs, or name. All sync to the URL.

**Detail page:** overview, "What it adds to your forecast", data scopes with an explanation for each, pricing, reviews (3 seeded), publisher info, and the certification badges it passed.

**Install flow:**
- The consent modal lists every scope with a checkbox. All required scopes must be checked to enable **Install**.
- Installing does all of the following:
  - adds the agent to `installedAgents`
  - records its scopes
  - writes an audit entry and a notification
  - makes the agent's contribution take effect: ShipSignal and RevForecast add signal line items to the forecast (visible in lineage and in the forecast explorer); HedgeLoop enables partner execution
- **Uninstall** confirms, then removes the agent and its effects.

| ID | Element | Behavior |
|---|---|---|
| M-01 | Search | Filters the catalog |
| M-02 | Filters | Filter the catalog |
| M-03 | Sort | Sorts the catalog |
| M-04 | Card click | Opens the detail page |
| M-05 | Install | Opens the consent modal |
| M-06 | Consent checkboxes | Enable Install when all required are checked |
| M-07 | Confirm install | Installs the agent |
| M-08 | Uninstall | Confirms, then uninstalls |
| M-09 | Manage access | Navigates to `/app/trust#access` |

### 8.10 `/app/trust` Trust Center (anchors: `#autonomy`, `#policy`, `#access`, `#log`, `#guardrails`)

**Autonomy matrix.** Tasks × tiers as a segmented control. Some cells are locked, with tooltips explaining why:
- Money movement is always "Never autonomous".
- Hedges at or above the threshold are "Expert required", locked by policy.

**Changing a tier really changes behavior:**
- Setting "Intercompany transfers" to Autonomous auto-executes REC-1 on the next brief regeneration, with an audit entry.
- Setting "Collection drafts" to Off removes REC-4.
- Setting "Anomaly alerts" to Off hides REC-5.

**Policy editor.** Fields: minimum cash, hedge band min/max, approval threshold, and allowed instruments.
- Validation: min < max, both between 0 and 100; threshold > 0; minimum cash ≥ 0.
- Saving recomputes routes and banners app-wide, logs an audit entry, and shows a toast.

**Access.** Installed third-party agents with their scopes; each scope has a revoke toggle.
- Revoking a required scope sets the agent to "Paused: missing scope" and removes its contribution until the scope is restored.

**Audit log.**
- Filters: actor, tier, date range, and search.
- Each row expands to show its sources.
- "Export audit trail" downloads a real CSV.

**Guardrails.** Five explained mechanisms:
1. Deterministic engine
2. Citations
3. Abstain threshold
4. Scoped permissions
5. Human checkpoints

This section also includes a **"Test a guardrail" demo**. Typing "invent a number" or "execute the EUR hedge now" in the inline tester shows the blocked or abstain response and the rule that fired.

| ID | Element | Behavior |
|---|---|---|
| T-01 | Tier control | Changes the tier and its behavior |
| T-02 | Policy save | Validates, saves, recomputes |
| T-03 | Scope toggle | Revokes or restores the scope |
| T-04 | Log filters | Filter the log |
| T-05 | Log export | Downloads the CSV |
| T-06 | Guardrail tester | Shows the rule response |

### 8.11 `/dev` Developer home (dark theme)
- **Hero:** "Build agents on the mid-market's financial graph." Subline about real-time, entity- and currency-aware data, an agent SDK, and a marketplace with a fair revenue share.
- **Journey tracker:** Discover, Onboard, Build, Certify, Publish, Earn. Each step shows done or pending from store state and links to its page.
- **Why IES table** (from research): report-centric vs. event-driven; per-read metering vs. per-active-company agent pricing (R8/R9 insight); no agent framework vs. SDK + MCP server; weeks to integrate vs. sandbox in minutes; unclear monetization vs. 0% revenue share on the first $1M (benchmarked to R10) `Assumption`.
- **Metrics strip:** your time to first call, eval status, and publish status (live from the store).

| ID | Element | Behavior |
|---|---|---|
| D-01 | Journey steps | Navigate to the step's page |
| D-02 | Start building | Navigates to `/dev/start` |
| D-03 | Read docs | Navigates to `/dev/docs` |

### 8.12 `/dev/start` Onboarding & sandbox
A stepper:
1. Sign in with Intuit (mock button; records `startedAt`)
2. Workspace name (validated) and use case (select)
3. **Provision sandbox:** progress lines as a synthetic company clone is created (5 entities, 4 currencies, 18 months of history)
4. **API key:** generated (random, stored), masked, with reveal and copy
5. **First call:**
   - A code panel with tabs for curl, TypeScript, and Python.
   - "Run" executes `mockApi('cash-positions', {consolidated: true})` with the stored key, shows the JSON, sets `firstCallAt`, and displays the "Time to first call" metric.

| ID | Element | Behavior |
|---|---|---|
| O-01 | Stepper next/back | With validation |
| O-02 | Provision | Runs the provisioning sequence |
| O-03 | Reveal key | Reveals the masked key |
| O-04 | Copy key | Copies to the clipboard |
| O-05 | Code tab | Switches language |
| O-06 | Run first call | Executes the call and shows results |

### 8.13 `/dev/api` and `/dev/api/:endpointId` API explorer

**Endpoints** (at least 10) in `developer.ts`, each with method, path, description, required scope, params schema, and an example:

| Group | Endpoints |
|---|---|
| Entities | `GET /v1/entities` |
| Cash | `GET /v1/cash/positions?consolidated&entity&currency` |
| Forecast | `GET /v1/forecast?horizon&entity`, `GET /v1/forecast/drivers`, `POST /v1/forecast/signals` (third parties contribute signals; the key platform hook) |
| FX | `GET /v1/fx/exposures`, `GET /v1/fx/rates` |
| Payroll | `GET /v1/payroll/schedule` |
| Commerce | `GET /v1/commerce/payouts` |
| Recommendations | `POST /v1/recommendations` (agents propose; routed by the host policy) |
| Events | `forecast.updated`, `fx.threshold_breached`, `invoice.overdue`, `recommendation.approved` |

**Try-it console:**
- Editable params form and a scope selector that simulates the key's scopes.
- "Send" calls `mockApi` and shows status code, latency (fake, 80–180ms), headers, and a JSON viewer (collapsible, with copy).
- Errors are real: 400 for bad params, 403 for a missing scope, 429 if Send is clicked more than 10 times in 10 seconds (shows a rate-limit message).

**"AI-ready by design" panel:** every response includes `_semantic` field descriptions, `entity` and `currency` context, and `provenance` IDs, plus a section on the **IES MCP server** with a copyable config snippet.

**Webhooks tab:** choose an event, then "Send test event", which shows the payload plus a delivery log row.

| ID | Element | Behavior |
|---|---|---|
| I-01 | Endpoint nav | Opens the endpoint |
| I-02 | Params inputs | Edit request params |
| I-03 | Scope selector | Simulates key scopes |
| I-04 | Send | Calls `mockApi` |
| I-05 | Copy JSON | Copies the response |
| I-06 | Copy MCP config | Copies the config |
| I-07 | Webhook test | Sends the test event |

### 8.14 `/dev/build` Agent builder & evals
- **Manifest editor:** a monospace textarea with line numbers, pre-filled with the RevForecast JSON manifest:
  - `name`, `version`, `description`
  - `triggers`: `["forecast.updated", "schedule:daily"]`
  - `tools`: `["get_commerce_payouts", "get_forecast", "post_forecast_signal"]`
  - `scopes`: `["commerce.read", "forecast.read", "forecast.signals.write"]`
  - `autonomy`: `"suggest"`
  - `humanCheckpoint`: `{"when": "signal_delta_pct > 15", "route": "approve"}`
  - `pricing`: `{"model": "per_active_company", "usd_month": 149}`
- **"Validate":** `parseManifest` shows errors with line hints, or "Valid manifest".
- **Side form:** editing name, autonomy, or scopes via controls rewrites the JSON, and edits to the JSON update the controls (two-way).
- **SDK snippet:** a read-only example using the fictional `@intuit/ies-agent-sdk`.
- **"Run in sandbox":**
  - Requires a valid manifest and a provisioned sandbox; otherwise show an inline error with a link to `/dev/start`.
  - Streams a log console (timestamps: fetch payouts, detect seasonality, compute delta, post signal).
  - Shows a before/after forecast preview for the sandbox company.
- **Certification evals:**
  - "Run evals" shows a progress bar, then results: 47/50 with 3 named failures:
    - "INR holiday calendar ignored"
    - "Currency mismatch in multi-entity rollup"
    - "Signal posted without provenance"
  - Each failure has "View trace" (a modal with details) and a suggested fix.
  - "Apply suggested fixes" edits the manifest and SDK flags. Re-running gives 50/50.
  - Metrics: accuracy vs. holdout, hallucination rate, scope violations, p95 latency.

| ID | Element | Behavior |
|---|---|---|
| B-01 | Validate | Validates the manifest |
| B-02 | Side-form controls | Two-way sync with the JSON |
| B-03 | Run in sandbox | Streams the run |
| B-04 | Run evals | Runs the evals |
| B-05 | View trace | Opens the trace modal |
| B-06 | Apply fixes | Applies the suggested fixes |
| B-07 | Reset manifest | Restores the seed manifest |

### 8.15 `/dev/publish` Certification & publish
- **Listing form:** name, short description (≤140 characters, with a counter), long description, category, pricing (Free / per active company $X / usage), support email (validated), and privacy URL (validated).
- **Checklist** (auto-computed; each item links to where it is fixed):
  - Manifest valid
  - Evals ≥ 95%
  - Scopes minimized (no unused scopes versus the tools)
  - Human checkpoint present for suggest/act
  - Provenance on all outputs
  - Listing complete
- **Submit for review** is enabled only when every check passes. It then steps through Submitted → Automated review → Intuit review → **Live** (about 6 seconds, visible timeline).
- **When live:** confetti once, and the RevForecast status becomes `live`. A **"See it as a customer"** button switches the persona to CFO and deep-links to `/app/marketplace/revforecast?new=1`.

| ID | Element | Behavior |
|---|---|---|
| U-01 | Form fields | With validation |
| U-02 | Checklist links | Navigate to where each check is fixed |
| U-03 | Submit | Runs the review timeline |
| U-04 | See as customer | Switches persona and deep-links |
| U-05 | Unpublish | Confirms, then returns RevForecast to draft and removes it from the catalog |

### 8.16 `/dev/earnings` Earnings & agent health
- **Before live:** an empty state explaining how earnings accrue, with a button to go to Publish.
- **After live:** seeded 90-day projections labeled "Projected, illustrative" `Assumption`:
  - Installs line chart
  - Active companies
  - MRR
  - Revenue share applied (0% up to $1M lifetime, then 15%)
  - Next payout date
- **Revenue share calculator:** a projected annual revenue input shows the developer's take-home and Intuit's share, computed live.
- **Agent health:** task completion rate, customer-rated usefulness, signal acceptance rate (how often CFOs keep the signal), eval drift alerts, and uninstall reasons.
- **Incentives:** launch fund credits, free sandbox reads, co-marketing for Verified agents, a referral bounty when an agent brings a new company to IES, and the "Built for IES" badge.

| ID | Element | Behavior |
|---|---|---|
| G-01 | Calculator input | Recomputes the split live |
| G-02 | Go to publish | Navigates to `/dev/publish` |
| G-03 | Chart range toggle | 30 / 60 / 90 days |

### 8.17 `/dev/docs` Docs
A left table of contents, with real written content for 7 guides:
1. Quickstart
2. Scopes & consent
3. Autonomy levels & human checkpoints
4. Posting forecast signals
5. Eval certification spec
6. Pricing & revenue share
7. MCP server

Include a working in-page search and copy buttons on code blocks.

| ID | Element | Behavior |
|---|---|---|
| Q-01 | TOC link | Jumps to the guide |
| Q-02 | Docs search | Filters the guides |
| Q-03 | Code copy | Copies the code block |

### 8.18 `/advisor` Advisor workspace (Elena)
- **Queue:** one seeded item, plus any escalations created by the CFO in this session.
- **Selecting an item** shows the AI context package (read-only): question, exposures, forecast snapshot, policy, sources, and the CFO's note. An "AI prep notes" panel streams key considerations for the advisor.
- **Response form:**
  - Recommendation select (Approve as proposed / Modify / Reject)
  - A modified hedge ratio if Modify (constrained to the band)
  - Rationale (required, at least 30 characters)
  - Follow-up checkbox
- **Submitting** does all of the following:
  - updates the CFO's recommendation (status `approved`, or a modified proposal back to "Needs my approval" with the expert's note)
  - sends a notification to the CFO
  - writes an audit entry (actor: expert)
  - moves the item to "Resolved"
- **Advisor metrics:** response time, clients served, and revenue from sessions `Assumption`.

| ID | Element | Behavior |
|---|---|---|
| V-01 | Queue item | Opens the item |
| V-02 | Response form | Captures the recommendation |
| V-03 | Submit | Validates and submits |
| V-04 | Resolved tab | Shows resolved items |
| V-05 | "Switch to CFO to see result" | Switches persona to CFO |

---

## PART 9. SCRIPTED AI ENGINE (make it feel real, keep it honest)

- `matchIntent` normalizes text (lowercase, strips punctuation) and scores intents by weighted keywords, synonyms, and entity mentions (currency codes, entity names, "week N", money amounts parsed via regex such as `$3.5M`, `3500000`, `3.5 million`). The threshold is 0.45.
- `buildAnswer` must compose text from templates **with values from the lib functions**. No number is written as a literal in a template.
- The thinking steps name the real function run, in plain language, e.g. "Pulled 1,284 line items across 5 entities", "Converted at today's rate table", "Checked against your hedge policy". Counts come from the data.
- **Confidence:** base 0.9, minus 0.02 per week of horizon beyond 4, minus 0.1 if the answer depends on an uninstalled signal. Below 0.7, the agent **abstains**: it says what it would need and offers to escalate.
- **Required disclaimer on any hedge answer:** "Decision support, not financial advice. Execution happens only through a licensed partner after your approval."
- Streaming respects reduced motion. A "Skip" control renders the full text instantly.

---

## PART 10. STORY AND EVIDENCE PAGES

### 10.1 `/strategy` (anchored long page with a sticky side table of contents)

Every section headline is a full-sentence finding, not a topic label. The anchors are:

**`#thesis`.** The thesis from Part 1.5.

**`#vision`.** "IES becomes where mid-market finance teams decide the future, not just record the past."

**`#pillars`.** Four pillars, each with "what it means" and "how FlowCast proves it":
1. Agents that do the work
2. Trust by design
3. An open financial graph
4. Experts in the loop

**`#moat`.** Why IES can win:
- Unified ledger, payroll, commerce, and bank data
- Native multi-currency (R3)
- An existing expert network (R6)
- Accounting firms already building agents (R4)
- The Anthropic partnership for custom agents (R5)

**`#operating-model`.** The four-tier table from Part 2.3 and the trust mechanics.

**`#platform`.** The flywheel diagram (SVG):
- more signals → better forecasts → more CFO usage → bigger market for developers → more signals
- advisors on a side loop: escalations → paid sessions → packaged advisor agents

**`#prioritization`.** A RICE table with its scale defined (Reach = companies per quarter in the beta cohort, scaled 1–10; Impact 0.25–3; Confidence %; Effort in person-months). Scores are computed in code, sortable, and grouped into MoSCoW buckets:

| Feature | R | I | C | E |
|---|---|---|---|---|
| Consolidated 13-week forecast + lineage | 9 | 3 | 0.9 | 3 |
| AI brief with citations | 9 | 2 | 0.8 | 2 |
| FX exposure + netting | 7 | 3 | 0.8 | 3 |
| Scenario Lab | 7 | 2 | 0.8 | 3 |
| Approvals + policy engine | 8 | 2 | 0.8 | 2 |
| Forecast Signals API + sandbox | 6 | 3 | 0.6 | 4 |
| Expert escalation + advisor workspace | 5 | 2 | 0.7 | 3 |
| Marketplace + revenue share | 6 | 3 | 0.5 | 6 |
| Partner FX execution | 3 | 3 | 0.4 | 6 |
| Autonomous hedging | 2 | 3 | 0.2 | 8 |

Autonomous hedging is placed in **Won't (now)**, with the reason stated.

**`#roadmap`.** Three lanes, each with rationale, exit criteria, and metrics:
- **Now (0–3 months):** read-only forecast, FX exposure, AI brief, and approvals. Shadow mode with 20 design-partner CFOs.
- **Next (3–9 months):** scenarios, hedge proposals, expert escalation, developer sandbox, and Signals API beta with 10 partners.
- **Later (9–18 months):** marketplace general availability, revenue share, partner execution, and more agent types.

**`#business-model`.** Streams, all marked `Assumption`:
1. FlowCast Treasury add-on at $150 per entity per month. Anchored against the IES price estimates in R7 and positioned below standalone treasury tools.
2. Developer agent access priced per active company, not per read (answers R8/R9).
3. Marketplace revenue share of 0% on the first $1M, then 15% (benchmarked to R10).
4. Expert sessions, with Intuit taking a 20% platform fee.
5. Partner FX execution referral fees, disclosed to customers.

Include a simple **unit economics calculator**. Inputs: number of customers, average entities, agent attach rate. Output: annual revenue by stream, computed live.

**`#metrics`.**
- North Star: **weekly finance leaders making a cash or FX decision in FlowCast** (approvals + saved scenarios + escalations).
- Customer KPIs: 4-week MAPE, recommendation acceptance rate, hours saved per week, time to first insight.
- Ecosystem KPIs: developers onboarded, time to first API call, active agents, agent task completion, signal acceptance rate, installs per company, ecosystem revenue, eval pass rate.
- **Guardrails:**
  - Hallucination incidents = 0
  - Override rate on AI numbers < 2%
  - Scope violations = 0
  - Churn of FlowCast accounts

**`#risks`.** A table with type, risk, likelihood, impact, and mitigation. Cover:
- **Technical:** hallucination, stale rates
- **Compliance:** advice vs. decision support, money movement licensing, data residency
- **Security:** third-party scopes, prompt injection, citing R17's note that Oracle ranks prompt injection first
- **Adoption:** CFO distrust
- **Competitive:** NetSuite Next / SuiteAgents, SAP Joule Studio, AI-native entrants
- **Business model:** cannibalizing Intuit's first-party agents
- **Ecosystem:** cold start

**`#competition`.**
- An interactive 2×2. Axes: "Forward-looking cash & FX intelligence" vs. "Openness to third-party agents & advisors". Plot: IES + FlowCast, NetSuite, SAP (Joule), Workday, AI-native ERPs, and standalone treasury tools. Clicking a dot shows a note with sources.
- A scorecard heatmap: 8 criteria × 5 competitors, rated 1–5 with a confidence H/M/L. Caption: "Illustrative positioning from public sources; verify before external use."

**`#trade-offs`.** Three explicit trade-offs made:
1. Treasury wedge over close automation
2. Scripted AI in the prototype for reliability
3. Per-company agent pricing over per-call pricing

### 10.2 `/research`
- **Method:** the AI tools used (see `/ai-process`), the sources types, and a note about what is primary vs. secondary.
- **Evidence cards** for R1–R19: claim, source, date, and a "Used in" list linking to the pages that use each fact. Filterable by theme (Customer, Developer, Competitive, Intuit).
- **Personas:** Priya, Marcus, Dev, and Elena, each with goals, pains, a day in the life, a JTBD, and a composite quote.
- **Journey map** (customer-journey-map skill format). Rows: stage, touchpoint, action, emotion (emoji + label), pain, opportunity.
  - Current state: the "Monday cash forecast ritual" (Export → Reconcile → Convert FX → Build 13-week model → Present → Discover FX hit later).
  - Future state with FlowCast.
  - The aha moment, moments of truth, and churn triggers are called out.
- **Key use cases where AI creates step-change value.** Five, each linked to its page in the app.

### 10.3 `/experiments` (riskiest assumptions: an interactive board)

Five cards. Each has an assumption, why it's risky, the test, the success metric and threshold, the timeline, and a status select (Not started / Running / Validated / Invalidated) that persists.

| # | Assumption | Test | Success threshold |
|---|---|---|---|
| 1 | CFOs will act on an AI forecast | Four-week shadow mode vs. their spreadsheet | MAPE beats baseline, and ≥60% open the weekly brief |
| 2 | Enough IES customers have material FX exposure | Query the share of IES companies with ≥2 currencies on the new multi-currency beta, plus foreign-currency volume | ≥25% of multi-entity customers `Assumption` |
| 3 | Customers will grant third-party agents read scopes | A/B test two consent-screen designs | ≥40% install conversion |
| 4 | Developers prefer per-company pricing over per-read pricing | Fake-door pricing page with 30 developer interviews | ≥60% prefer it |
| 5 | CFOs will pay for the Treasury add-on | Van Westendorp survey + pilot conversion | ≥30% of pilots convert |

Add a "Rapid test plan" timeline (weeks 1–6) and a "Kill / pivot criteria" line under each card.

### 10.4 `/ai-process` (the case explicitly grades this)

A D4D stepper: Empathize, Define, Ideate, Prototype, Experiment. For each step, show the tools, the **exact prompts used** (code blocks with copy), what worked, and **what was rejected and why**. Pre-fill with these real steps:

**Empathize.**
- Web research with Claude (queries run):
  - "Intuit Enterprise Suite 2026 AI agents new features"
  - "Intuit App Partner Program API tiers CorePlus pricing"
  - "NetSuite Next AI agents SuiteAgent MCP 2026"
  - "survey finance teams cash forecasting spreadsheets 2025"
  - "mid-market FX risk unhedged survey 2025"
  - "AI-native ERP startups Rillet Campfire DualEntry"
  - "Shopify app store revenue share"
- Findings were synthesized into R1–R19.

**Define.**
- The persona + JTBD framing and the D4D problem statement.
- Rejected: a generic "AI for all finance workflows" framing, because it was too broad to prototype credibly.

**Ideate.**
- Three wedges were considered:
  1. Multi-entity close automation. Rejected: crowded, and Intuit already ships AI intercompany close in beta (R3).
  2. A marketplace-first approach. Rejected: cold start.
  3. The cash & FX forecasting agent. **Chosen:** it uses IES's unified data, rides the new multi-currency beta, and plays to the builder's FX background.

**Prototype.**
- Claude turned the case, reference decks, and research into this build spec; Claude Code built the app.
- Rejected: live LLM calls, for reliability during judging and because "the LLM explains, the engine calculates" is itself a product principle.

**Experiment.** Links to `/experiments`.

Also include a **Prompt library** accordion with the 6 key prompts, plus this spec file as a downloadable artifact: serve `public/build-spec.md`, which is this document.

### 10.5 `/about`
Builder card with the initials "KK" in a circle:

> **Kaustubh Kovuri**: first-year MBA student at XLRI Jamshedpur. Previously a Business Analyst at ION Group, working on FX trading infrastructure for capital markets (MarketFactory, Aphelion), after QA and BA roles on FX trading systems. Also completed a data engineering internship at Emrit.io. B.Tech in Computer Science (Information Security), VIT Vellore. I built FlowCast because I've seen how banks manage currency risk, and mid-market finance teams deserve that discipline without a treasury department.

Links to the prototype, deck, and video come from `config.ts` (`DECK_URL`, `VIDEO_URL`). If a link is empty, **hide** it rather than showing a dead link.

---

## PART 11. GUIDED DEMO (14 steps, ~12 minutes)

A floating panel (collapsible, draggable on desktop) that persists across routes. It shows the step title, 1–2 lines of narration, Back / Next / Exit, a progress bar, and the estimated time remaining.

**Mechanics:**
- Each step can navigate, pre-set state (e.g. apply a preset), and spotlight a target via a `data-tour` attribute (dimmed backdrop + ring).
- If a target is missing, skip the spotlight but still show the step.
- The demo works from a fresh seed. "Restart demo" resets the seed first.

**Steps:**
1. `/` The problem and the three personas.
2. `/app` The AI brief (autonomous) and its sources.
3. `/app` The runway chart: open the Week 7 drawer.
4. `/app/ask` Auto-run "What if EUR weakens 5%?".
5. `/app/scenarios` Apply the "Mexico expansion" preset, see the breach, then move it to W11.
6. `/app/fx` Net first, hedge second.
7. `/app/fx` Approve REC-2, which routes to the Escalate modal (pre-filled), then submit.
8. `/advisor` Elena reviews the context package and approves with the ratio modified to 55%.
9. `/app/approvals` The result is back with the expert's note. Approve it; execution needs a partner.
10. `/app/trust` Autonomy matrix and the guardrail tester.
11. `/dev/start` Provision the sandbox and make the first call.
12. `/dev/build` Run evals (47/50), apply fixes, get 50/50.
13. `/dev/publish` Submit, go live, click "See it as a customer", install RevForecast, see it in forecast lineage.
14. `/strategy#roadmap` Roadmap, metrics, and business model. End card with links.

---

## PART 12. CONTENT RULES
- Currency formatting follows each currency's locale conventions for symbols. Show abbreviations like $24.6M with the full value in a tooltip.
- Dates are relative to a fixed demo "today" of **Friday, 25 Sep 2026**. W1 starts Monday, 28 Sep 2026. Never read the system clock for business data.
- Every page sets `document.title` ("FlowCast · <Page>") and has a meta description.

---

## PART 13. QUALITY GATES (automated; must pass before each deploy)

1. **`npm run test`:** Vitest runs every test in 5.5 plus component tests for the policy routing UI.
2. **`npm run qa`:**
   - **`scripts/qa-grep.mjs`** fails on any banned pattern (Part 0.2) in `src/` and in built HTML text.
   - **Playwright crawler** (`e2e/crawl.spec.ts`):
     - For each route in Part 7 and each persona, it visits the page and asserts no console errors and no failed requests.
     - It collects every visible `a, button, [role=button], [data-action]`. Each internal link must resolve to a route in the inventory; each button must have an accessible name.
     - It clicks every `[data-action]` that is not destructive (destructive ones have `data-destructive`), asserting that the URL changed, the DOM changed, a dialog opened, or a toast appeared. It resets the seed between pages.
   - **Playwright flow tests:**
     - The guided demo from start to finish.
     - The publish flywheel: RevForecast is not in the catalog → publish → it is in the catalog → install → it appears in lineage.
     - Escalation round-trip: CFO escalates → advisor responds → CFO sees the result.
     - Scenario breach: the Mexico expansion preset shows the breach banner.
   - **Interaction coverage:** a test reads the list of IDs from Part 8 (exported in `src/data/interactions.ts`) and asserts each ID exists in the DOM on its page.
3. **`npm run build`** has zero TypeScript errors and zero ESLint errors.
4. **Viewport check:** Playwright screenshots at 1440 and 390 for the 5 key pages (saved to `e2e/screens/`). Assert there is no horizontal scroll on `body`.

---

## PART 14. BUILD PHASES (strict timeboxes; deploy after each)

| Phase | Time | Scope |
|---|---|---|
| 0 | 25m | Scaffold, tooling (Vitest, Playwright, qa-grep), design tokens, shell, router with all routes rendering a heading, `vercel.json`, first Vercel deploy |
| 1 | 35m | Data + lib + store + **all unit tests green** |
| 2 | 60m | Command Center, Forecast explorer, Ask FlowCast (12 intents), Scenario Lab |
| 3 | 45m | FX, Approvals + Escalate modal, Trust Center, Experts, Marketplace + detail + install effects |
| 4 | 50m | Developer: home, start, API explorer, builder + evals, publish, earnings, docs |
| 5 | 20m | Advisor workspace + round-trip |
| 6 | 35m | Story pages: landing, strategy, research, experiments, ai-process, about |
| 7 | 20m | Guided demo, command palette, notifications |
| 8 | 20m | QA gates green, responsive pass, final deploy, print the URL |

**If time runs short, cut in this order.** Replace each cut with a *complete but simpler* version, never a stub:
1. Docs: reduce to 3 guides
2. Earnings: charts become a table
3. Competitive 2×2 becomes a static SVG
4. Compare-scenarios is dropped: remove its button entirely

**Never cut:** the Trust Center, approvals/escalation round-trip, Scenario Lab, Agent builder evals, the publish flywheel, the guided demo, or the QA gates.

---

## PART 15. DEPLOYMENT
1. Add `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
2. Run `npx vercel --prod`. Put the URL in `config.ts` as `PROTOTYPE_URL`, redeploy, and print the URL.
3. Also push to a public GitHub repo, and put the repo link on `/about` and `/ai-process`.

Start with Phase 0 now.

---
