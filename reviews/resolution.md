# Accepted Findings

- Hero must derive weekly aggregates from activeDrilldowns (scoped by marketFilter), not from snapshot-wide weeklyTrends. Build a local aggregation function that sums product-level weekly trends across the filtered set.
- Focus and Compare onChange handlers in the controls drawer must call setHeroView("compare") so the comparison is immediately visible.
- E2e must test both: focus/compare activates compare mode, and market filter changes hero scope.

# Rejected Findings

- None.

# Implementation Slice

1. Add a ScopedWeeklyTrend type and buildScopedWeeklyTrends helper that aggregates activeDrilldowns[].weeklyTrends by periodStart into totalVolume, openInterest, activeContracts, activeProducts, estimatedRevenue.
2. Refactor MarketAggregateSummary and MarketAggregateChart to accept scopedTrends (ScopedWeeklyTrend[]) instead of two separate snapshot-level props.
3. Add setHeroView("compare") to the Focus and Compare onChange handlers in the controls drawer.
4. Update e2e to verify both behaviors: focus/compare activates compare mode, market filter scopes hero.

# What Changed

Files modified:
- `src/components/dashboard-workspace.tsx` — added `ScopedWeeklyTrend` type, `buildScopedWeeklyTrends()` function aggregating product-level weekly trends from `activeDrilldowns`, `scopedMetricValue()` helper replacing `aggregateMetricValue()`, refactored `MarketAggregateSummary` and `MarketAggregateChart` to accept `scopedTrends` prop, added `setHeroView("compare")` to Focus and Compare `onChange` handlers in the controls drawer
- `scripts/e2e-dashboard-smoke.mjs` — added assertions that Focus/Compare controls activate compare mode immediately, market filter scopes the hero, Reset clears state before Workflow tab tests
- `reviews/plan-review.md` — updated with current run findings
- `reviews/resolution.md` — this file

# Deferred

- Query-backing heroView, marketFilter, focus/compare product state in the URL.
- Animated view transitions between hero views.
- Dual-axis aggregate chart (bars + OI line overlay).
