# Accepted Findings

- Command bar restructure: Split into two visual tiers — top row for tabs, bottom row for all controls (snapshot, filters, metric pills, actions). Add subtle separator and group labels. Remove description text from tab buttons at default size.
- KPI-to-chart hierarchy: Reduce KPI number size, tighten card padding, add more gap before the main stage grid to create clear primacy for the chart.
- Remove redundant tab header: Eliminate the "Workspace tab / Market view" heading block. The tab identity is already in the command bar.
- Right rail emphasis: Make watchlist visually primary (slightly larger heading, border-accent treatment) and make the other two panels visually lighter/secondary.
- Snapshot status: Collapse to a small inline badge when dates match; only expand to full prose when there is a date mismatch.

# Rejected Findings

- Typography change: Not blocking for this pass. Would require font loading changes and broad CSS updates. Defer to a dedicated design pass.

# Implementation Slice

Concentrated changes in two files:
1. `src/components/dashboard-workspace.tsx` — restructure command bar JSX into two rows, remove tab descriptions from visible text (keep as aria labels), remove tab section header block, change snapshot status to badge/inline.
2. `src/app/globals.css` — restyle command bar as two-tier layout, adjust KPI sizing, add hierarchy spacing, differentiate rail panels.

# What Changed

Files modified:
- `src/components/dashboard-workspace.tsx` — two-tier command bar, compact KPI labels, conditional snapshot status, removed tab section header, watchlist primary class, tighter rail copy
- `src/app/globals.css` — `.command-bar-row`, `.command-group`, `.command-group-label`, `.command-group-end`, `.command-bar-status`, `.workspace-panel-header-meta`, `.workspace-rail-panel-primary` classes added; tab segments restyled as compact pills; KPI card sizing reduced; spacing hierarchy improved; dead selectors removed
- `scripts/e2e-dashboard-smoke.mjs` — updated `getByLabel` calls to `{ exact: true }`, updated snapshot status assertion text

# Deferred

- Query-backing active tab, market filter, focus/compare product
- Font pairing change
- Responsive improvements below 640px (current responsive is adequate)
- Animation/transitions on tab switch
