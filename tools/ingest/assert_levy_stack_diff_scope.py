#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Fail closed when levy stack diffs exceed an authority-name allowlist.

Compare baseline vs candidate arapahoe-levy-stacks-by-tag-id.json (or any
stacksByTagId document). Used before --ship-allow-diff land when only curated
TE-pin overrides changed (see docs/_working/Antelope-GID/antelope-gid.md).

Rules:
  - TAG ids must match exactly between baseline and candidate.
  - If a TAG stack is unchanged, OK.
  - If a TAG stack changed but contains no allowlisted authorityName, FAIL.
  - If a TAG stack changed, every changed line must have authorityName in the
    allowlist; line identity is (code, authorityName) so mart rename/history
    rows that reuse one AUTH code stay distinct; non-dolaMatch fields on
    allowlisted lines must be identical; other lines on that TAG must be
    unchanged.

Exit 0 when in scope, 1 when not (prints violations to stderr).

Usage:
  python3 tools/ingest/assert_levy_stack_diff_scope.py \\
    --baseline public/data/arapahoe-levy-stacks-by-tag-id.json \\
    --candidate supporting-data/_ingest-out/arapahoe-levy-stacks-by-tag-id.json \\
    --allowlist tools/fixtures/antelope_gid_levy_stack_allowlist.json
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ScopeViolation:
    tag_id: str
    message: str


def _canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def _line_without_dola(line: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in line.items() if k != "dolaMatch"}


def _line_identity(line: dict[str, Any]) -> tuple[str, str]:
    """Stable line key within one TAG.

    Arapahoe TAG CSV sometimes keeps rename/history rows under the same AUTH
    code (inactive old label + active new label). Code alone is not unique;
    (code, authorityName) is unique on shipped Arapahoe stacks.
    """
    code = str(line.get("code") or "").strip()
    name = str(line.get("authorityName") or "").strip()
    return (code, name)


def _lines_by_identity(
    stack: dict[str, Any],
) -> dict[tuple[str, str], dict[str, Any]]:
    out: dict[tuple[str, str], dict[str, Any]] = {}
    for line in stack.get("lines") or []:
        key = _line_identity(line)
        if not key[0] and not key[1]:
            continue
        if key in out:
            raise ValueError(
                f"duplicate line identity code={key[0]!r} "
                f"authorityName={key[1]!r} on one stack"
            )
        out[key] = line
    return out


def _stack_has_allowlisted_authority(
    stack: dict[str, Any], allow: set[str]
) -> bool:
    for line in stack.get("lines") or []:
        name = str(line.get("authorityName") or "").strip()
        if name in allow:
            return True
    return False


def assert_levy_stack_diff_scope(
    baseline: dict[str, Any],
    candidate: dict[str, Any],
    allow_authority_names: set[str],
) -> list[ScopeViolation]:
    """Return violations; empty list means the diff is within scope."""
    if not allow_authority_names:
        return [
            ScopeViolation(
                tag_id="",
                message="allow_authority_names is empty; refusing to pass",
            )
        ]

    base_map = baseline.get("stacksByTagId") or {}
    cand_map = candidate.get("stacksByTagId") or {}
    if not isinstance(base_map, dict) or not isinstance(cand_map, dict):
        return [
            ScopeViolation(
                tag_id="",
                message="stacksByTagId must be objects on both sides",
            )
        ]

    base_tags = set(base_map.keys())
    cand_tags = set(cand_map.keys())
    if base_tags != cand_tags:
        only_base = sorted(base_tags - cand_tags)[:5]
        only_cand = sorted(cand_tags - base_tags)[:5]
        return [
            ScopeViolation(
                tag_id="",
                message=(
                    "TAG id set changed "
                    f"(only baseline sample: {only_base!r}; "
                    f"only candidate sample: {only_cand!r})"
                ),
            )
        ]

    violations: list[ScopeViolation] = []
    for tag_id in sorted(base_tags):
        old_stack = base_map[tag_id]
        new_stack = cand_map[tag_id]
        if _canonical_json(old_stack) == _canonical_json(new_stack):
            continue

        if not _stack_has_allowlisted_authority(old_stack, allow_authority_names):
            violations.append(
                ScopeViolation(
                    tag_id=str(tag_id),
                    message=(
                        "stack changed but contains no allowlisted authorityName"
                    ),
                )
            )
            continue

        try:
            old_lines = _lines_by_identity(old_stack)
            new_lines = _lines_by_identity(new_stack)
        except ValueError as exc:
            violations.append(
                ScopeViolation(tag_id=str(tag_id), message=str(exc))
            )
            continue

        if set(old_lines) != set(new_lines):
            violations.append(
                ScopeViolation(
                    tag_id=str(tag_id),
                    message="line identity set changed (code, authorityName)",
                )
            )
            continue

        for key in old_lines:
            code, auth = key
            old_line = old_lines[key]
            new_line = new_lines[key]
            if _canonical_json(old_line) == _canonical_json(new_line):
                continue

            if auth not in allow_authority_names:
                violations.append(
                    ScopeViolation(
                        tag_id=str(tag_id),
                        message=(
                            f"non-allowlisted line changed: code={code!r} "
                            f"authorityName={auth!r}"
                        ),
                    )
                )
                continue

            if _canonical_json(_line_without_dola(old_line)) != _canonical_json(
                _line_without_dola(new_line)
            ):
                violations.append(
                    ScopeViolation(
                        tag_id=str(tag_id),
                        message=(
                            f"allowlisted line changed outside dolaMatch: "
                            f"code={code!r} authorityName={auth!r}"
                        ),
                    )
                )

    return violations


def load_allowlist(path: Path) -> set[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    names = data.get("allowAuthorityNames")
    if not isinstance(names, list) or not names:
        raise SystemExit(f"allowlist {path} must contain allowAuthorityNames[]")
    return {str(n).strip() for n in names if str(n).strip()}


def load_stacks(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise SystemExit(f"Missing levy stacks file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Assert levy stack diff stays within authority allowlist.",
    )
    parser.add_argument(
        "--baseline",
        type=Path,
        default=Path("public/data/arapahoe-levy-stacks-by-tag-id.json"),
        help="Shipping or pre-change stacks JSON.",
    )
    parser.add_argument(
        "--candidate",
        type=Path,
        required=True,
        help=(
            "New stacks JSON (e.g. supporting-data/_ingest-out/... or "
            "supporting-data/_ingest-ship-staging/...)."
        ),
    )
    parser.add_argument(
        "--allowlist",
        type=Path,
        help="JSON file with allowAuthorityNames[] (see tools/fixtures/).",
    )
    parser.add_argument(
        "--allow-authority",
        action="append",
        default=[],
        metavar="NAME",
        help="Repeatable mart authorityName; merged with --allowlist.",
    )
    args = parser.parse_args(argv)

    allow: set[str] = {str(a).strip() for a in args.allow_authority if str(a).strip()}
    if args.allowlist:
        allow |= load_allowlist(args.allowlist)
    if not allow:
        parser.error("Provide --allowlist and/or at least one --allow-authority")

    baseline = load_stacks(args.baseline)
    candidate = load_stacks(args.candidate)
    violations = assert_levy_stack_diff_scope(baseline, candidate, allow)

    if not violations:
        print(
            f"OK: levy stack diff within scope ({len(allow)} allowlisted names).",
            file=sys.stderr,
        )
        return 0

    print(
        f"FAIL: {len(violations)} levy stack scope violation(s). Do not ship.",
        file=sys.stderr,
    )
    for v in violations[:50]:
        prefix = f"TAG {v.tag_id}" if v.tag_id else "FILE"
        print(f"  {prefix}: {v.message}", file=sys.stderr)
    if len(violations) > 50:
        print(f"  ... and {len(violations) - 50} more", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
