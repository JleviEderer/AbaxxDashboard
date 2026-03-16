Start the dashboard implementation loop with the default builder/reviewer workflow.

## Argument Parsing

Treat `$ARGUMENTS` as a freeform implementation brief plus optional flags.

Supported flags:

- `--require-data-access-review`
- `--skip-data-access-review`

Examples:
```
/start-dashboard
/start-dashboard scaffold the app and prove browser fetches
/start-dashboard --require-data-access-review build the initial fetch layer
```

## Execution

**Step 1 - Read local context.** Read these files first:

- `./.codex/napkin.md`
- `./HANDOVER.md`
- `./PLAN.md`
- `./AGENT-ORCHESTRATION.md`

**Step 2 - Run the builder pre-pass.** Read:

- `./.claude/agents/builder/builder.md`

The builder owns the plan, decides the implementation target for this run, and identifies whether fetch architecture is materially in scope.

**Step 3 - Run the adversarial review.** Read:

- `./.claude/agents/reviewer/reviewer.md`

Write or overwrite:

- `./reviews/plan-review.md`

The review must list findings first, ordered by severity, before implementation proceeds.
Use `./reviews/templates/plan-review.md` as the structure to preserve.

**Step 4 - Run the specialist data-access review when needed.**

Always run it when:

- `--require-data-access-review` is present
- the task changes fetch strategy
- the task adds caching, proxying, or browser-assisted ingest
- browser and CLI/server behavior are materially different

Skip it only when:

- `--skip-data-access-review` is present and the task clearly does not touch fetch architecture

Read:

- `./.claude/agents/data-access-reviewer/data-access-reviewer.md`

Write or overwrite:

- `./reviews/data-access-review.md`

Use `./reviews/templates/data-access-review.md` as the structure to preserve.

**Step 5 - Record builder resolution.** Write or overwrite:

- `./reviews/resolution.md`

This file must capture:

- accepted findings
- rejected findings with reasons
- the concrete implementation slice for this run
- what is explicitly deferred

Use `./reviews/templates/resolution.md` as the structure to preserve.

**Step 6 - Validate the loop artifacts.** Run:

```bash
python ./.claude/hooks/check-dashboard-loop.py
```

If Step 4 ran, use:

```bash
python ./.claude/hooks/check-dashboard-loop.py --require-data-access-review
```

**Step 7 - Implement.**

The builder then makes the code changes for the agreed slice.

**Step 8 - Close the loop.**

After implementation:

- update `./reviews/resolution.md` with what changed and what remains
- update `./HANDOVER.md` if the project state changed materially
- update `./.codex/napkin.md` if you learned a recurring rule worth preserving
- run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run test:e2e`
