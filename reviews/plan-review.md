# Findings

- Severity: high
  File: src/components/dashboard-workspace.tsx (lines 432-443)
  Issue: MarketAggregateSummary and MarketAggregateChart receive snapshot.weeklyTrends and snapshot.revenueModel.weeklyTrends, which are global unscoped aggregates. When marketFilter is set to a specific market, the hero chart still shows all-markets data while the KPI strip, watchlist, settlement movers, and everything else scopes to the filtered set. The hero and the rest of the page disagree about what they are showing.

- Severity: high
  File: src/components/dashboard-workspace.tsx (lines 326-330, 346)
  Issue: Changing Focus or Compare product in the controls drawer updates internal state but does not call setHeroView("compare"). The user selects a product to compare and sees no visible effect until they separately click "Compare products" in the hero header. This makes Focus and Compare controls feel broken.

- Severity: low
  File: scripts/e2e-dashboard-smoke.mjs
  Issue: E2e does not test that the Focus/Compare controls activate compare mode, nor that market filter changes the hero scope. Both behaviors need assertions.

# Summary

Two targeted fixes with no architecture or fetch changes. The scoped hero requires aggregating product-level weekly trends from activeDrilldowns instead of using snapshot-wide totals. The controls fix is a one-line addition to two onChange handlers. Low regression risk.
