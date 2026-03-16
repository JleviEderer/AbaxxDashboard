# Findings

- Severity: high
  Area: Command bar (`dashboard-workspace.tsx` lines 188–345, `globals.css` lines 1671–1704)
  Issue: The sticky command bar packs 4 conceptually different control groups (tabs, snapshot controls, workspace filters, metric/actions) into one undifferentiated row. At narrow widths it collapses to a flat stack with no grouping cues. Tab buttons include both label and description text, adding bulk. Focus/Compare selects sit inline with Market filter with no visual separation of scope controls vs. product controls.

- Severity: high
  Area: KPI strip and stage grid (`globals.css` lines 1881–1953)
  Issue: KPI card numbers are nearly as visually dominant as the main chart title. 18px gap everywhere means no whitespace hierarchy between command bar, KPIs, and the main compare chart. The KPI strip and chart panel share the same border/radius/shadow treatment, making them feel like siblings rather than a clear primary-secondary relationship.

- Severity: medium
  Area: Right rail panels (`dashboard-workspace.tsx` lines 431–525)
  Issue: Watchlist, Front Movers, and Fee Leaders are visually identical. No ranking/emphasis tells the user which panel to look at first. Watchlist Focus/Compare buttons don't clearly link to the command bar dropdowns above.

- Severity: medium
  Area: Tab section header (`dashboard-workspace.tsx` lines 529–537)
  Issue: The "Workspace tab / Market view" heading block repeats what the command bar tabs already communicate and adds vertical dead space before tab content.

- Severity: low
  Area: Snapshot status message (`dashboard-workspace.tsx` line 148–149)
  Issue: Verbose date-resolution prose is always visible below the chart title, even when requested and resolved dates match. Better as a subtle indicator or collapsed detail.

- Severity: low
  Area: Typography (`layout.tsx`)
  Issue: Space Grotesk + IBM Plex Sans are safe but generic. Not blocking, but worth noting for future polish.

# Summary

The highest-leverage UX changes are: (1) restructuring the command bar into visually grouped tiers, (2) creating stronger visual hierarchy between KPI strip and main chart, and (3) removing the redundant tab section header. These three changes would measurably reduce cognitive load without touching fetch architecture or metric definitions. The right rail can be improved with lighter changes in the same pass.
