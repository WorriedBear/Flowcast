# Build decisions

Decisions made where the spec was ambiguous or conflicted, per Part 0.4.

1. **Scope.** Part 0-A applies. Cut completely: `/app/forecast`, `/app/experts`, `/dev/earnings`, `/dev/docs`, `/experiments`, the command palette, the notifications bell, scenario save/compare, all CSV and .md downloads (Copy kept), the webhooks tab, the interactive 2×2 and the unit-economics calculator. None of them appear in links, the sidebar or the demo.
2. **Re-pointed links.** KPI tiles open the week drawer (cash, low), `/app/trust#policy` (headroom), `/app/fx` (unhedged) and Ask (accuracy). US/UK entity rows open their low-week drawer; MX/DE/IN rows open `/app/fx`. "Read docs" (D-03) became "Explore the API". "Earn" links to the revenue-share section `/dev#earn`. The footer's Experiments link goes to `/strategy#experiments`.
3. **Forecast calibration.** All foreign-entity flows are explicit line items. The weekly US commerce payouts (three channels, split 52/31/17%) are the calibrated series that makes the base scenario hit every anchor. Tests enforce ±$0.05M.
4. **FX exposure definition.** Net 13-week *external* flows per currency, wherever the entity sits (e.g. the US parent pays EU suppliers in EUR; DE sells to UK stores in GBP). Intercompany is excluded because it nets to zero in the group. Entity-by-entity requirement = Σ entities Σ currencies |net|; group = Σ currencies |Σ entities net|. The seed gives 35.2% reduction.
5. **Intercompany legs** are denominated in the sender's currency on both sides, so they are zero-sum in consolidation under any FX scenario.
6. **Policy routing.** The $500K expert threshold applies to hedges (per tranche for layered forwards). Intercompany transfers route by autonomy tier only, so setting them to Autonomous really auto-executes REC-1 on the next brief regeneration.
7. **Expert round-trip.** An advisor "Approve" or "Modify" returns the recommendation to *Needs my approval* flagged `expertReviewed`, which routes it to `approve`. Adjusting the ratio afterwards clears the review. "Reject" dismisses it with the expert's note.
8. **Sensitivity** is measured on W13 consolidated closing cash with an instantaneous rate shock applied to balances and flows in that currency; a test checks it equals pct × (opening + net flows) × base rate.
9. **Guided demo.** L-01 starts at step 1 on `/` (the problem and personas), then Next goes to `/app`. The spec's "navigates to /app" was reconciled with step 1 being on `/`.
10. **Notifications.** With the bell cut, "creates a notification" is delivered as a toast plus an audit entry.
11. **QA.** `npm run qa` = banned-pattern grep + one Playwright smoke test (every kept route, no console errors, no links to non-kept routes, initial `data-action` IDs present, accessible button names, `document.title`, no horizontal scroll at 390px) plus the scenario-breach, escalation round-trip and publish-flywheel flows. ESLint was not added in the 3-hour scope; `tsc` runs in strict mode with `noUnusedLocals`.
12. **Fonts.** IBM Plex is loaded from Google Fonts (the only network call). The smoke test ignores font-load failures from sandboxed environments.
13. **Deployment.** Deployed on Vercel at https://flowcast-kk.vercel.app/ ; `PROTOTYPE_URL` in `src/config.ts` points there.
14. **build-spec.md** served on `/ai-process` is the spec without the builder-only appendix.
