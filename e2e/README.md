# Required E2E Path

This project's required end-to-end path is:

1. start the dashboard app
2. load a deterministic fixture data source
3. return an empty same-day historical payload
4. fall back to the latest non-empty historical snapshot
5. render the KPI layer, first chart, and product table

This path exists to prove that the app still works end to end even when the
historical endpoint returns `success: true` with empty data for the current day.
