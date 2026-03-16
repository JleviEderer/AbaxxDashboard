# Reviews

This folder holds the latest artifacts for the dashboard builder/reviewer loop.

Use these files:

- `plan-review.md` - adversarial review of the current plan or implementation slice
- `data-access-review.md` - specialist review for fetch architecture and Cloudflare-sensitive decisions
- `resolution.md` - builder decision log for accepted findings, rejected findings, current slice, and deferrals
- `templates/` - required structure for each artifact

Policy:

- Keep one current file per artifact instead of a long archive.
- Overwrite the file when a new review supersedes the old one.
- If historical review logs become useful later, add an `archive/` subfolder. Do not start there.
- The validator expects a findings-first review shape and specific resolution headings.
