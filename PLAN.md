# Dashboard Plan

## Current Position

The project is past discovery and ready for implementation.

What is already known:

- Public Abaxx Exchange frontend assets expose the market-data surface and endpoint naming scheme.
- Direct backend-style CLI fetches can hit Cloudflare, so browser-context validation matters.
- The existing Streamlit investor dashboard is weak mostly because of product framing and presentation, not because the visible feature set is technically hard.

## Working Assumption

Start with a browser-first MVP in a custom web app.

Default architecture:

1. Frontend app renders the dashboard and validates exchange data access in browser context.
2. Thin client-side or edge-friendly data layer normalizes responses into investor-facing metrics.
3. Add a cache/snapshot layer only if real-browser access works but direct server fetches remain unreliable.

Fallback:

If browser-only fetches are still too fragile, move to a browser-assisted ingest job plus cached API without changing the product surface.

## Phase 1: Scaffold And Technical Proof

Goal: prove that a custom app can load enough public data to support the MVP.

Tasks:

1. Scaffold the dashboard app in this directory.
2. Choose the initial stack:
   - Next.js preferred for routing, deployability, and future cache options.
   - React + Vite acceptable if we want a thinner client-only build.
3. Build a thin data-access proof for:
   - product list
   - instruments for a selected product
   - one time-series path
   - one settlement or block-trade path
4. Record exactly which requests succeed in browser context and which fail outside it.

Exit criteria:

- The app can render at least one live market-data flow end to end.
- We know whether client-side access is sufficient for MVP.

## Phase 2: Information Architecture

Goal: decide what the investor should understand in under two minutes.

MVP sections:

1. Overview
2. Adoption
3. Open Interest
4. Revenue
5. Products
6. Block Trades
7. Methodology

Design rules:

- Lead with compact KPIs, not filters.
- Default charts to weekly or monthly aggregation.
- Make drilldowns product-first and contract-aware.
- Separate observed data from modeled revenue assumptions.

Exit criteria:

- One clear page structure exists before full chart build-out.
- Each section has a named investor question it answers.

## Phase 3: Metric Layer

Goal: define the calculations before polishing charts.

Core outputs:

- top-line KPIs
- active products/contracts
- open interest trends
- volume and settlement trends
- block-trade activity
- modeled revenue views with explicit assumptions

Implementation notes:

- Keep raw exchange fields separate from derived investor metrics.
- Centralize transformations so chart components stay dumb.
- Mark assumption-driven metrics clearly in UI and code.

Exit criteria:

- Metric definitions are stable enough that UI work is not coupled to endpoint quirks.

## Phase 4: MVP Build

Goal: ship a first version that is obviously better than the current Streamlit app.

Build order:

1. Overview KPI band
2. Adoption and open-interest charts
3. Revenue section with assumptions panel
4. Product drilldown
5. Block-trade monitor
6. Methodology and source notes

Quality bar:

- clean desktop and mobile behavior
- readable labels and spacing
- intentional visual direction, not generic dashboard defaults
- obvious distinction between live data and modeled estimates

Exit criteria:

- The MVP communicates the Abaxx story more clearly than the current dashboard.

## Phase 5: Hardening

Goal: make the MVP durable enough to use regularly.

Tasks:

1. Add caching where it reduces latency or request fragility.
2. Add loading, empty, and partial-failure states.
3. Validate chart ranges and aggregation behavior across products.
4. Decide deploy target and runtime constraints.
5. Document data-access behavior and known limitations.

## Immediate Next Actions

1. Scaffold the app in `C:\Users\justi\dev\Abaxx\dashboard`.
2. Validate a browser-context fetch path for products and one downstream dataset.
3. Lock the frontend stack and charting library after the proof.
4. Sketch the final page structure before implementing all sections.

## Open Decisions

1. `Next.js` vs. `React + Vite`
2. pure client-side fetch vs. browser-assisted ingest plus cache
3. charting library
4. fixed revenue assumptions vs. user-configurable scenarios
