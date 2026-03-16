# Handover

## Scope

This handover is for the dashboard app at:

`C:\Users\justi\dev\Abaxx\dashboard`

Treat `dashboard/` as the project root for all app work and validation.

## Current State

The dashboard is no longer in the rejected "scrolly report" state.

What is now implemented and working:

- sticky top workspace bar
- chart-first top screen with compare overlay
- right rail for watchlist, movers, and fee concentration
- tabbed `Market`, `Workflow`, and `Revenue` surfaces
- darker, higher-contrast terminal-style visual system
- synchronized workflow state across rankings, drilldown, and comparison
- URL-backed `asof` and `window` controls
- honest requested-vs-resolved snapshot messaging when the selected date falls back
- passing lint, typecheck, tests, build, and e2e smoke

What is still not resolved:

- active tab is not query-backed yet
- market filter is not query-backed yet
- focus/compare product state is not query-backed yet
- no persistence/caching layer beyond URL-backed snapshot controls
- no alerting / saved workspace behavior yet

## What We Worked On

This session did two connected pieces of work:

1. replaced the long report layout with a real analysis workspace
2. made the top-bar `As of` and `Time window` controls real by wiring them through server fetches and URL state

## What Got Done

### 1. Workspace redesign shipped

Implemented:

- `src/components/dashboard-workspace.tsx`
- `src/components/products-dashboard-slice.tsx`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/product-analysis-workbench.tsx`
- `scripts/e2e-dashboard-smoke.mjs`

Behavior:

- first screen is now chart-first instead of prose-first
- command bar stays sticky and persistent
- KPI strip is compact and dashboard-like
- market tab includes the compare overlay, settlement heatmap, and small multiples
- workflow tab reuses the coordinated ranking/drilldown/comparison system
- revenue tab still uses the scenario model, but now sits inside a proper workspace shell

### 2. Snapshot controls are now real

Implemented:

- query parsing in `src/app/page.tsx`
- control props passed through `src/components/products-dashboard-slice.tsx`
- query-driven client navigation in `src/components/dashboard-workspace.tsx`

Behavior:

- `asof` and `window` now live in the URL
- server snapshot fetches are anchored off the requested `asof`
- default date resolution uses `resolveSnapshotNow()` so `ABAXX_SNAPSHOT_NOW` still makes smoke deterministic
- the UI explicitly tells the user when a requested date resolved to an earlier actual snapshot date

## Key Decisions

### Decision 1: Keep the new shell and stop revisiting the old report framing

Reason:

- the user had already rejected the long-page/report structure
- the new workspace direction is materially closer to the intended Grafana/TradingView mental model

### Decision 2: Put snapshot-date state in the URL before adding more polish

Reason:

- the top bar was still partly decorative until `asof` and `window` became real
- URL-backed controls make refresh/share/e2e behavior deterministic
- this establishes the right pattern for any later query-backed workspace state

### Decision 3: Leave most local workspace state client-side for now

Reason:

- the highest-value follow-up is obvious: query-back active tab, market filter, and focus/compare
- that work can now be layered on top of the `asof` / `window` pattern instead of invented from scratch

## What Worked

- the new `dashboard-workspace.tsx` shell gave the page a real terminal/workspace feel quickly
- reusing existing workflow and revenue components preserved data/modeling work
- pushing `asof` / `window` through the page layer was simpler than changing the data library
- the smoke test remained deterministic by keeping `resolveSnapshotNow()` in the server path

## What Didn't Work

- the first e2e update used stale assertions from the old layout and had to be relaxed to new stable selectors
- the top bar still resets local view state only; it does not fully reset query-backed state because only `asof` and `window` are in the URL so far

## Lessons / Gotchas

- run dashboard checks from `C:\Users\justi\dev\Abaxx\dashboard`, not the repo root
- if you add more persistent controls, follow the same pattern now used for `asof` and `window`
- preserve `ABAXX_SNAPSHOT_NOW` compatibility when touching default date behavior, or the smoke harness will get brittle
- the user does not want another incremental polish pass toward report aesthetics; continue building workspace behavior

## Validation Run In This Session

Verified successfully:

- `python .\.claude\hooks\check-dashboard-loop.py`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e`

## Important File Map

Entry and server state:

- `src/app/page.tsx`
- `src/components/products-dashboard-slice.tsx`

Workspace shell:

- `src/components/dashboard-workspace.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`

Workflow integration:

- `src/components/product-analysis-workbench.tsx`
- `src/components/product-rankings-panel.tsx`
- `src/components/product-drilldown-panel.tsx`
- `src/components/product-comparison-panel.tsx`

Revenue and charting:

- `src/components/revenue-scenario-panel.tsx`
- `src/components/line-chart-card.tsx`

Data/modeling:

- `src/lib/abaxx.ts`
- `src/lib/revenue-scenarios.ts`
- `src/lib/product-rankings.ts`

Validation:

- `scripts/e2e-dashboard-smoke.mjs`
- `src/lib/abaxx.test.ts`
- `src/lib/revenue-scenarios.test.ts`
- `src/lib/product-rankings.test.ts`
- `.claude/hooks/check-dashboard-loop.py`

## Recommended Next Step

Make the rest of the workspace state query-backed.

Highest-value order:

1. active tab
2. market filter
3. focus product
4. compare product

Why:

- `asof` / `window` already established the pattern
- this turns the page from "interactive in one session" into a shareable workspace
- it will also make e2e coverage more explicit and easier to extend

## Restart Checklist

1. `cd C:\Users\justi\dev\Abaxx\dashboard`
2. Read `HANDOVER.md`; the key repo napkin lives at `C:\Users\justi\dev\Abaxx\.codex\napkin.md`
3. Assume the workspace redesign is the accepted direction
4. Start from the existing `dashboard-workspace.tsx` shell
5. Extend query-backed state rather than inventing a second persistence model
6. Run `python .\.claude\hooks\check-dashboard-loop.py`
7. Run `npm run dev`

## Session Status

The important truth for the next session is:

- the workspace redesign is shipped and validated
- `asof` and `window` are real, URL-backed controls
- the next move is to make more workspace state persistent in the URL, not to revisit the old report layout
