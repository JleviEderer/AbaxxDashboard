# Accepted Findings

- Bars always = volume, remove metric toggle
- Single OI overlay toggle replaces both metric and display mode toggles
- OI line on separate right y-axis scale when overlay is on
- Fees removed from hero chart, stays in KPI strip and Revenue tab
- Summary cards hardcode to volume

# Rejected Findings

- None.

# Implementation Slice

1. Replace `chartMetric` + `chartMode` state with `showOiOverlay` boolean
2. Remove CHART_METRICS and CHART_MODES constants
3. Update ChartPanelToolbar: remove metric/mode pill groups, add single OI toggle
4. Hardcode chart titles to volume: "Market volume trend", "{product} volume trend", "Volume comparison"
5. Update MarketAggregateChart: always draw volume bars, optionally draw OI line on separate scale
6. Update FocusChart: same treatment
7. Update OverlayComparisonChart: grouped volume bars, optional OI lines
8. Update MarketAggregateSummary and FocusSummary: hardcode to volume
9. Update compare summary cards: hardcode spread to volume
10. Update tooltips: show volume, and OI when overlay is on
11. Update Reset button: remove chartMetric/chartMode reset
12. Update e2e: remove metric/mode button assertions, add OI toggle assertion

# Deferred

- Right y-axis numeric labels (OI scale)
- Multi-product compare (3+ products)
- Fees overlay on hero
