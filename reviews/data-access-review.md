# Findings

- Severity: high
  Domain: data access
  Issue: do not start with a backend poller against `https://cws.prod.ext.xabx.net`; validate the exchange-facing public API first.

- Severity: medium
  Domain: data access
  Issue: server-side requests may diverge from browser behavior because of Cloudflare, request choreography, or missing browser context.

- Severity: medium
  Domain: data access
  Issue: historical and settlement routes may differ in reliability from simpler list endpoints such as products and instruments.

- Severity: low
  Domain: data access
  Issue: if browser-only success masks server-side failures, partial success can create misleading confidence about future caching or proxy work.

# Summary

Browser-first architecture was the correct starting recommendation. Validate
browser and server behavior separately, and move to browser-assisted ingest plus
cache only if persistence or reliability requirements exceed what the public API
surface can support directly.
