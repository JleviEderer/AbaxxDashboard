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

3. **[2026-03-12] Use the dashboard review loop before major implementation work**
   Do instead: validate `reviews/` and run `python .\.claude\hooks\check-dashboard-loop.py` before calling a slice complete.

4. **[2026-03-14] Keep ranking/filter interaction logic unit-tested and smoke coverage structural**
   Do instead: validate ranking math and filter behavior in `src/lib/*.test.ts`, then keep Playwright smoke assertions focused on section presence and representative rows.

5. **[2026-03-14] The dashboard is still uncommitted from the parent repo's perspective**
   Do instead: if using a review helper before committing, choose uncommitted review mode and scope it to `dashboard/` when needed.

## Data Source Guardrails
1. **[2026-03-12] The exchange-facing public API is the viable first ingress path**
   Do instead: use `https://abaxx.exchange/api/products`, `instruments`, `historical-data`, `historical-data/time-series`, and `settlement-data` before considering heavier ingress work.

2. **[2026-03-12] Direct backend-style fetches to `cws.prod.ext.xabx.net` can hit CORS or Cloudflare blocks**
   Do instead: do not plan product work around the raw backend host unless the ingress strategy itself is being redesigned.

3. **[2026-03-13] `historical-data?asof=` can return `success: true` with an empty same-day payload**
   Do instead: probe recent dates and select the latest non-empty historical snapshot before computing metrics.

4. **[2026-03-13] `settlement-data?asof=` is a mark-curve surface, not an activity surface**
   Do instead: use it for tenor depth, front/back spreads, and mark changes, not for adoption-flow narratives.

5. **[2026-03-13] Reachable does not mean product-ready**
   Do instead: defer visible sections like block trades when the public route is reachable but the payload is still empty.

6. **[2026-03-14] Product codes in investor materials may not exactly match live feed codes**
   Do instead: anchor fee mappings and product logic to the live API first and document inferred aliases like `GKS` vs `GXS`.

## Modeling & UI Guardrails
1. **[2026-03-14] Keep observed exchange metrics separate from modeled revenue**
   Do instead: treat fee scenarios as a client-side assumptions layer on top of observed volume and open interest.

2. **[2026-03-14] Shared product workflow state belongs in one client workbench, not in isolated panels**
   Do instead: coordinate rankings, drilldown, and comparison from a parent client component and keep child panels controlled by props when cross-panel actions matter.

3. **[2026-03-14] This product must read like a charting dashboard workspace, not a blog/report page**
   Do instead: prioritize command bars, dense chart grids, side rails, detail-on-demand, and workspace patterns over hero copy and stacked narrative sections.

4. **[2026-03-14] Coordinated product workflows should read as one analysis studio, not three unrelated sections**
   Do instead: group rankings, drilldown, and comparison inside one visual shell with shared status cards and a responsive detail grid before polishing lower-value sections.

5. **[2026-03-14] Mimic proven dashboard products instead of inventing a vague investor UI**
   Do instead: borrow layout and interaction patterns from Grafana, Datadog, TradingView, and strong analytics systems when redesigning the surface.

6. **[2026-03-14] Client-side scenario controls only work cleanly if the snapshot exposes raw pricing-group volume**
   Do instead: add reusable raw buckets to the server-built snapshot rather than recomputing from hidden UI state or refetching on each edit.

7. **[2026-03-14] Single-product drilldown and two-product comparison are different workflows**
   Do instead: keep them as separate components with separate state instead of overloading one mega-panel.

8. **[2026-03-14] The next highest-value investor layer was ranking/filtering before further chart churn**
   Do instead: extend the current product surface with sortable rankings, filters, and normalized comparison views before spending time on cosmetic chart rewrites.

9. **[2026-03-13] Open interest is a snapshot metric, not a flow metric**
   Do instead: sum weekly volume, but take weekly OI and breadth from the last available trade date in each bucket.

## Shell & Command Reliability
1. **[2026-03-13] Preview commands must run from `C:\Users\justi\dev\Abaxx\dashboard`**
   Do instead: `cd .\dashboard; npm run dev` in PowerShell or `cd ./dashboard && npm run dev` in Git Bash.

2. **[2026-03-13] E2E preview should not share the default `.next` directory**
   Do instead: keep the smoke harness on `.next-e2e` so it can coexist with a live dev server.

3. **[2026-03-14] UI copy changes can break deterministic smoke assertions even when the app is healthy**
   Do instead: update `scripts/e2e-dashboard-smoke.mjs` whenever section headings or key explanatory strings change.

## User Directives
1. **[2026-03-12] Preserve enough context for a fresh session to resume immediately**
   Do instead: keep `HANDOVER.md` current with the real next step, recent fixes, and file map whenever the product direction changes.

2. **[2026-03-14] The user rejects blog-like UI and wants best-in-class dashboard patterns researched and mimicked**
   Do instead: start the next UI pass from strong external dashboard references and a fresh layout concept, not from incremental polish on the existing page structure.
