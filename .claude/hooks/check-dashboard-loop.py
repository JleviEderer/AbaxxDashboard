from __future__ import annotations

import argparse
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "PLAN.md"
PLAN_REVIEW = ROOT / "reviews" / "plan-review.md"
DATA_ACCESS_REVIEW = ROOT / "reviews" / "data-access-review.md"
RESOLUTION = ROOT / "reviews" / "resolution.md"

REQUIRED_RESOLUTION_HEADINGS = [
    "Accepted Findings",
    "Rejected Findings",
    "Implementation Slice",
    "Deferred",
]


def exists_and_nonempty(path: Path) -> bool:
    return path.exists() and path.stat().st_size > 0


def is_stale(target: Path, reference: Path) -> bool:
    return target.stat().st_mtime < reference.stat().st_mtime


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def first_nonempty_line(text: str) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped
    return ""


def has_heading(text: str, heading: str) -> bool:
    candidates = {
        f"# {heading}",
        f"## {heading}",
        f"### {heading}",
    }
    return any(candidate in text for candidate in candidates)


def validate_findings_review(path: Path, label: str, errors: list[str]) -> None:
    text = read_text(path)
    first_line = first_nonempty_line(text)

    if "Findings" not in first_line:
        errors.append(f"{label} must start with a Findings heading or findings section")

    if "Severity:" not in text and "- No findings." not in text:
        errors.append(
            f"{label} must include severity-tagged findings or an explicit no-findings statement"
        )


def validate_resolution(path: Path, errors: list[str]) -> None:
    text = read_text(path)
    for heading in REQUIRED_RESOLUTION_HEADINGS:
        if not has_heading(text, heading):
            errors.append(f"reviews/resolution.md is missing the heading '{heading}'")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate dashboard review-loop artifacts before implementation."
    )
    parser.add_argument(
        "--require-data-access-review",
        action="store_true",
        help="Require reviews/data-access-review.md to exist and be fresh.",
    )
    args = parser.parse_args()

    errors: list[str] = []

    required = [
        (PLAN, "Missing PLAN.md"),
        (PLAN_REVIEW, "Missing reviews/plan-review.md"),
        (RESOLUTION, "Missing reviews/resolution.md"),
    ]

    for path, message in required:
        if not exists_and_nonempty(path):
            errors.append(message)

    if args.require_data_access_review and not exists_and_nonempty(DATA_ACCESS_REVIEW):
        errors.append("Missing reviews/data-access-review.md")

    if errors:
        for error in errors:
            print(error)
        return 1

    validate_findings_review(PLAN_REVIEW, "reviews/plan-review.md", errors)
    validate_resolution(RESOLUTION, errors)

    if args.require_data_access_review:
        validate_findings_review(
            DATA_ACCESS_REVIEW, "reviews/data-access-review.md", errors
        )

    if is_stale(PLAN_REVIEW, PLAN):
        errors.append("reviews/plan-review.md is older than PLAN.md")

    if args.require_data_access_review and is_stale(DATA_ACCESS_REVIEW, PLAN):
        errors.append("reviews/data-access-review.md is older than PLAN.md")

    freshest_review = PLAN_REVIEW
    if args.require_data_access_review and DATA_ACCESS_REVIEW.stat().st_mtime > PLAN_REVIEW.stat().st_mtime:
        freshest_review = DATA_ACCESS_REVIEW

    if is_stale(RESOLUTION, freshest_review):
        errors.append("reviews/resolution.md is older than the latest review artifact")

    if errors:
        for error in errors:
            print(error)
        return 1

    print("Dashboard review loop artifacts are present, structured, and fresh.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
