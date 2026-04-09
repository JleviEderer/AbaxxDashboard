# Handover

## Scope

This handover is for the dashboard app at:

`C:\Users\justi\dev\Abaxx\dashboard`

Treat `dashboard/` as the project root for all app work and validation.

Current branch: `uiux/dashboard-cleanup`

## What We Worked On

This branch has been focused on making the custom Abaxx dashboard feel more usable than the original Streamlit reference without reverting to a report-style layout.

The work on this branch now includes:

- a chart-first Market / Workflow / Revenue workspace shell
- a chart-adjacent `Filters` surface instead of generic `Controls`
- separate hero modes for market overview, single-product focus, and compare
- a stable watchlist/market-info rail that does not collapse when hero state changes
- volume-first hero charts with optional OI overlay instead of redundant metric/display toggles
- de-gamified styling with restrained professional colors
- adaptive chart granularity so short windows behave like rolling periods instead of collapsing into weekly buckets

## What Is Done

### Hero and chart UX

- Main hero chart now owns the full row instead of sharing width with the old right rail.
- Watchlist, settlement movers, and fee concentration panels live below the chart.
- The old metric toggle (`Volume` / `OI` / `Fees`) and display toggle (`Bars + Line` / `Bars` / `Line`) were removed.
- Hero charts now always use volume bars as the primary signal.
- A single `Show OI` toggle overlays open interest as a line on a separate scale.
- Fees were removed from the hero chart and remain in the KPI strip and Revenue tab.
- Hover tooltips are implemented with widened hit areas so bars/points are easier to inspect.
- Focus and compare are separate workflows:
  - `Focus` shows a single-product chart and stats
  - `Compare` shows the two-product overlay
- Watchlist actions are now sticky toggles instead of one-way navigation:
  - clicking an inactive `Focus` or `Compare` button activates that state
  - clicking the same active button again deselects back toward market overview
- The watchlist, settlement board, and fee board stay the same size in every hero mode.
- Watchlist rows now show clear active states:
  - focused row = teal accent treatment
  - compare-left row = teal compare treatment
  - compare-right row = gold compare treatment

### Filters and framing

- `Controls` was renamed to `Filters`.
- Filters are expanded by default on desktop.
- Hero-state is expressed in the chart eyebrow instead of a separate pill row:
  - `ABAXX EXCHANGE / MARKET OVERVIEW`
  - `PRODUCT FOCUS / <product>`
  - `COMPARE / <left> VS <right>`
- Chart titles were tightened to neutral phrasing such as `Market volume trend` and `Volume comparison`.
- `Show OI` is now the only hero-chart overlay control.
- Chart footer cards were removed from market/focus mode because they duplicated tooltip detail.

### Visual tone

- The palette was shifted away from neon/gamer styling toward restrained blue-teal and muted gold.
- Heavy glow and gradient treatment was reduced.
- Dropdown option text was explicitly styled for dark backgrounds to fix unreadable select menus.

### Window semantics and adaptive granularity

- Window options are now:
  - `1D`
  - `1W`
  - `1M`
  - `3M`
  - `6M`
  - `YTD`
  - `All`
- `YTD` and `All` use sentinel values in `src/app/page.tsx` and are resolved to real day counts before fetch:
  - `-1` => year-to-date day count
  - `-2` => full history day count back to 2000-01-01
- The Abaxx `historical-data/time-series` endpoint only accepts ranges up to 366 days wide.
- `src/lib/abaxx.ts` now chunks oversized time-series requests so `All` still returns real trend data instead of an empty chart.
- Granularity now adapts by requested window:
  - `1D`, `1W`, `1M` => daily
  - `3M`, `6M`, `YTD`, `All` => weekly
- Summary cards and tooltip delta labels adapt with granularity:
  - daily => `Latest day`, `Day-over-day`, `DoD`
  - weekly => `Latest week`, `Week-over-week`, `WoW`
- Daily fees bug was fixed in `dashboard-workspace.tsx` by deriving daily estimated revenue from each day’s volume and `feePerSide` instead of using zero/null placeholders.

## What Worked

- Tight, scoped UI passes worked better than broad redesign prompts.
- Playwright-based visual review was useful for catching layout and interaction issues before committing to more code churn.
- Moving chart-specific controls into the chart panel materially improved cause-and-effect for the hero.
- Adaptive daily/weekly granularity is the right model for the short-window problem the user flagged from the Streamlit app.

## What Did Not Work

- Claude repeatedly tried to work around the parent repo stop-hook issue by creating stub files or editing unrelated config. Those changes were cleaned out each time and should not be repeated.
- Generated-file churn kept coming back, especially `next-env.d.ts` pointing at `.next-e2e`. That file should stay on `./.next/types/routes.d.ts`.
- One-off audit/scrape scripts were useful during investigation but should not remain in the repo unless they are intentionally productized.

## Current Risks / Open Items

- The parent repo stop hook can still loop from `dashboard/` because `C:\Users\justi\dev\Abaxx\.claude\settings.json` uses a relative command path. This is a parent-repo config problem, not a dashboard repo problem.
- Remaining workspace state is still not query-backed:
  - active tab
  - market filter
  - focus product
  - compare product
  - hero mode
- The hero charts are still custom SVGs, so zoom/pan/export/crosshair behavior is hand-rolled and limited compared with a real charting library.
- Compare mode is still capped at two products; multi-product compare has been discussed but is not implemented.
- The info panels beneath the chart still use their existing line/sparkline assumptions and do not yet adapt to daily granularity.

## Latest Market-Tab Audit

Playwright review of the current Market tab found:

- The previous Market-tab cleanup pass was completed:
  - watchlist rows keep horizontal `Focus` / `Compare` buttons
  - the two redundant lower line-chart cards were removed
  - product activity snapshots were tightened with clearer hierarchy
  - `Listings` was renamed to `Listed contracts`
- The current hero pass was also completed:
  - watchlist remains stable across market/focus/compare states
  - `Focus` / `Compare` are toggle actions with clear row/button states
  - hero charts now show volume bars with optional OI overlay
  - fees are no longer plotted on the hero

## Validation

This session's current branch state passed:

- `python .\.claude\hooks\check-dashboard-loop.py`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e`

If any copy or hero title changes again, update `scripts/e2e-dashboard-smoke.mjs` at the same time.

## Important Files

### Entry and server state

- `src/app/page.tsx`
  - `WINDOW_OPTIONS`
  - `YTD` / `All` resolution
  - server fetch for snapshot

### Main workspace

- `src/components/dashboard-workspace.tsx`
  - hero mode logic
  - adaptive daily/weekly chart data shaping
  - chart toolbar, tooltips, summary cards
  - filter interactions

- `src/app/globals.css`
  - workspace layout
  - color system
  - chart, filter, and responsive styling

### Data/modeling

- `src/lib/abaxx.ts`
  - snapshot assembly
  - chunked time-series fetching for `All` / oversized windows
  - `ProductDrilldown` shape now includes `dailyTrends`

- `src/lib/product-rankings.test.ts`
  - fixtures updated for `dailyTrends`

### Validation and review artifacts

- `scripts/e2e-dashboard-smoke.mjs`
- `reviews/plan-review.md`
- `reviews/resolution.md`
- `.claude/hooks/check-dashboard-loop.py`

## Recommended Next Steps

1. Query-back the remaining workspace state so shared URLs preserve more of the analysis context.
2. Decide whether compare should remain two-product or expand to a separate multi-product compare pass.
3. Decide whether the parent repo hook path should be fixed locally in `C:\Users\justi\dev\Abaxx\.claude\settings.json` or simply tolerated when working from `dashboard/`.
4. If chart sophistication becomes the bottleneck, evaluate a real charting library instead of extending the custom SVG system further.

## Restart Checklist

1. `cd C:\Users\justi\dev\Abaxx\dashboard`
2. Read `HANDOVER.md`
3. Read `.codex/napkin.md`
4. Run `git status --short --branch`
5. Confirm branch is still `uiux/dashboard-cleanup`
6. Run the dashboard review loop
7. Continue from `src/components/dashboard-workspace.tsx`
