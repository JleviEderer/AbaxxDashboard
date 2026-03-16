# Accepted Findings

- Phase 1 needed a hard data-proof gate before broader UI work.
- The first implementation slice needed to stay narrower than the full MVP.
- The metric layer needed to normalize exchange responses before many chart components were built.
- Next.js should remain the default stack unless the browser-first proof exposed a material reason to choose otherwise.
- The raw backend host `https://cws.prod.ext.xabx.net` should not be used directly because browser calls fail on CORS and naive server calls hit Cloudflare `403`.
- The viable public ingress path is the exchange-facing API on `https://abaxx.exchange/api`.

# Rejected Findings

- None.

# Implementation Slice

- Scaffold the app in `C:\Users\justi\dev\Abaxx\dashboard`.
- Validate products, instruments, and one downstream dataset on the public exchange-facing API.
- Normalize the feeds into a dashboard snapshot layer.
- Render the first real chart and product table from live data.
- Strengthen the process with a structured validator, CI gate, and deterministic required e2e path.

# Deferred

- revenue scenario controls
- full product drilldowns
- broader time-series expansion across all sections
- block-trade depth beyond initial public-surface validation
