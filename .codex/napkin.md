# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-03-12] Treat `C:\Users\justi\dev\Abaxx\dashboard` as the project root for this work**
   Do instead: read and update context files in this directory, not in `C:\Users\justi\dev\Abaxx`.

2. **[2026-03-12] This project is already past discovery**
   Do instead: extend the validated product surface instead of re-proving basic data access or re-inspecting Streamlit.

3. **[2026-03-12] Use the dashboard review loop before calling a slice complete**
   Do instead: update `reviews/` and run `python .\.claude\hooks\check-dashboard-loop.py` before closing the task.

4. **[2026-03-14] Keep ranking/filter interaction logic unit-tested and smoke coverage structural**
   Do instead: validate ranking math and filter behavior in `src/lib/*.test.ts`, then keep Playwright smoke assertions focused on section presence and representative rows.

5. **[2026-03-16] The parent repo Stop hook loops when cwd is `dashboard/`**
   Do instead: report the hook failure and stop. The proper fix is to change the command in `C:\Users\justi\dev\Abaxx\.claude\settings.json` to an absolute path. Do not create stub files or workaround scripts in the dashboard repo.

6. **[2026-03-17] Playwright visual checks are useful, but audit scripts are throwaway**
   Do instead: use ad hoc Playwright scripts or the browser to inspect rendered states, then delete one-off audit/scrape helpers before wrapping the change.

## Data Source Guardrails
1. **[2026-03-12] The exchange-facing public API is the viable first ingress path**
   Do instead: use `https://abaxx.exchange/api/products`, `instruments`, `historical-data`, `historical-data/time-series`, and `settlement-data` before considering heavier ingress work.

2. **[2026-03-12] Direct backend-style fetches to `cws.prod.ext.xabx.net` can hit CORS or Cloudflare blocks**
   Do instead: do not plan product work around the raw backend host unless the ingress strategy itself is being redesigned.

3. **[2026-03-13] `historical-data?asof=` can return `success: true` with an empty same-day payload**
   Do instead: probe recent dates and select the latest non-empty historical snapshot before computing metrics.

4. **[2026-03-13] `settlement-data?asof=` is a mark-curve surface, not an activity surface**
   Do instead: use it for tenor depth, front/back spreads, and mark changes, not for adoption-flow narratives.

5. **[2026-03-14] Product codes in investor materials may not exactly match live feed codes**
   Do instead: anchor fee mappings and product logic to the live API first and document inferred aliases like `GKS` vs `GXS`.

6. **[2026-03-16] YTD and All use sentinel values (-1, -2) resolved server-side**
   Do instead: if adding new special time ranges, follow the same pattern - sentinel in `WINDOW_OPTIONS`, resolve to real day count in `page.tsx` before the fetch.

7. **[2026-03-17] The Abaxx time-series endpoint rejects date ranges wider than 366 days**
   Do instead: chunk `All` or other oversized history requests into <=366-day windows in `src/lib/abaxx.ts` before normalizing trends.

## Modeling & UI Guardrails
1. **[2026-03-14] Keep observed exchange metrics separate from modeled revenue**
   Do instead: treat fee scenarios as a client-side assumptions layer on top of observed volume and open interest.

2. **[2026-03-17] Daily fees must be derived from daily volume and `feePerSide`**
   Do instead: when daily granularity is active, compute estimated revenue from each day's volume in `dashboard-workspace.tsx` instead of reusing weekly aggregates or falling back to zero/null.

3. **[2026-03-17] Short windows and long windows need different chart granularity**
   Do instead: use daily aggregation for 1D, 1W, and 1M; use weekly aggregation for 3M, 6M, YTD, and All; adapt summary labels and tooltip delta labels to match.

4. **[2026-03-17] Hero charts should be volume-first with optional OI overlay**
   Do instead: keep volume as bars, expose a single `Show OI` control, and avoid redundant metric/display toggles that make bars and line show the same thing.

5. **[2026-03-17] Fees do not belong on the hero chart**
   Do instead: keep fees in KPI/revenue surfaces unless the task is explicitly about modeled-fee visualization.

6. **[2026-03-17] The watchlist should stay stable while hero state changes**
   Do instead: preserve the full-height info panels across market/focus/compare states and treat `Focus` / `Compare` as sticky toggles with clear active styling.

7. **[2026-03-16] The user wants professional, not gamer aesthetics**
   Do instead: use restrained blue-teal (`#4ca8a8`), muted gold (`#e8a955`), flat dark surfaces, and low-glow borders. Think Bloomberg terminal, not Discord.

8. **[2026-03-16] "Filters" is the right label, not "Controls"**
   Do instead: keep filter UI close to the chart and use names that reflect scoped editing rather than generic controls.

9. **[2026-03-17] Chart titles should stay neutral while granularity is adaptive**
   Do instead: use titles like `Market volume trend` or `Volume comparison`, then show daily/weekly context in badges and summary labels instead of hardcoding `Weekly` into the heading.

10. **[2026-03-17] Use `lots` for traded volume and `Listed contracts` for instrument counts**
   Do instead: avoid generic `contracts` copy where the metric is actually volume in lots or listed expiries on the exchange surface.

## Shell & Command Reliability
1. **[2026-03-13] Preview commands must run from `C:\Users\justi\dev\Abaxx\dashboard`**
   Do instead: `cd .\dashboard; npm run dev` in PowerShell or `cd ./dashboard && npm run dev` in Git Bash.

2. **[2026-03-13] E2E preview should not share the default `.next` directory**
   Do instead: keep the smoke harness on `.next-e2e` so it can coexist with a live dev server.

3. **[2026-03-16] UI copy changes break deterministic smoke assertions**
   Do instead: update `scripts/e2e-dashboard-smoke.mjs` whenever section headings, chart titles, or filter labels change.

## User Directives
1. **[2026-03-12] Preserve enough context for a fresh session to resume immediately**
   Do instead: keep `HANDOVER.md` current with the real next step, recent fixes, and file map whenever the product direction changes.

2. **[2026-03-16] The user wants professional commodity-dashboard patterns**
   Do instead: reference Bloomberg, TradingView, and CME for interaction and framing. Favor clarity and correctness over flashy styling.

3. **[2026-03-16] Do not drift back to a Streamlit-style left filter sidebar unless explicitly directed**
   Do instead: keep the current chart-first workspace shell and move filters closer to the chart only when it improves cause-and-effect.

4. **[2026-03-17] Do the interaction model change before the chart redesign, not together**
   Do instead: validate that toggle-based selection feels right on its own before changing what the chart renders. Each pass should be independently testable.
