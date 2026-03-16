# Dashboard Agent Orchestration

## Default Roles

Use three roles by default for this project:

1. `builder`
2. `reviewer`
3. `data-access-reviewer` (optional, but preferred whenever fetch architecture is in scope)

This is a bounded review loop, not a debate swarm.

## Why This Shape

- The dashboard has product and architecture ambiguity, but not a fast objective score for every change.
- Independent review is useful.
- Open-ended multi-agent debate is likely to generate churn before we have benchmarks.

## Default Sequence

1. `builder` owns the plan, the implementation order, and all code changes.
2. `reviewer` challenges the plan before major build work begins.
3. `data-access-reviewer` evaluates only browser-fetch viability, Cloudflare risk, caching tradeoffs, and ingestion architecture.
4. `builder` resolves accepted findings and continues.

Use `./.claude/commands/start-dashboard.md` as the default entrypoint for this sequence.

## Trigger Rules

Run `reviewer` by default when:

- starting implementation from a new plan
- changing page architecture materially
- changing metric definitions materially
- preparing to ship the MVP

Run `data-access-reviewer` when:

- changing fetch strategy
- adding caching or proxy layers
- relying on server-side calls to exchange endpoints
- browser and CLI/server behavior diverge

## Non-Goals

Do not default to:

- multiple builders editing in parallel
- free-form agent debates without a decision owner
- swarm experimentation without a measurable benchmark

## Validation

Use `python ./.claude/hooks/check-dashboard-loop.py` to verify that the required review artifacts exist before implementation.

Add `--require-data-access-review` when the run materially touches fetch architecture.

## CI Policy

Do not treat the loop as complete unless the project also passes:

- `python ./.claude/hooks/check-dashboard-loop.py`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e`

The required e2e path for this project is:

- load the dashboard against a deterministic fixture data source
- fall back from an empty same-day historical payload to the latest non-empty snapshot
- render the first chart and product table successfully

## When To Revisit Autoresearch Patterns

Use stronger automated multi-agent loops only after we have scoreable subproblems such as:

- endpoint success rate and latency
- transform correctness against fixtures
- render performance and bundle size
- benchmarked UI experiments with fixed tasks
