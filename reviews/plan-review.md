# Findings

- Severity: high
  File: src/components/dashboard-workspace.tsx
  Issue: Volume/OI/Fees metric toggle and Bars+Line/Bars/Line display mode toggle make bars and line show the same metric. This is redundant — bars showing volume and line showing volume tells the user nothing new.

- Severity: high
  File: src/components/dashboard-workspace.tsx
  Issue: The chart should show two different metrics: bars = volume (the primary activity signal), line = OI (the structural context). This matches the commodity terminal convention (CME, ICE, Bloomberg).

- Severity: medium
  File: src/components/dashboard-workspace.tsx
  Issue: Fees is a modeled number, not market-observed. Putting it on the hero chart alongside observed metrics makes the chart feel smarter than it is. Fees belong in summary cards and the Revenue tab.

# Summary

Replace the dual toggle system (metric + display mode) with a single OI overlay toggle. Bars always show volume. OI line is optional, rendered on a separate right y-axis. Fees stay off the hero chart entirely.
