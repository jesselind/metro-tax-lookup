#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Fail closed when shipped levy stack mills disagree with county tables.

Usage:
  python3 tools/ingest/assert_levy_stack_county_mills.py \\
    --stacks public/data/arapahoe-levy-stacks-by-tag-id.json \\
    --pin-to-tag public/data/arapahoe-pin-to-tag.json \\
    --authority-mills public/data/arapahoe-authority-mills-by-tax-year.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_TOOLS = Path(__file__).resolve().parent.parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))

from ingest.county_levy_mills import (
    CountyLevyMillsBundle,
    assert_levy_stack_county_mills_parity,
    build_tag_id_to_pdf_tag_from_pin_map,
)


def _load_json(path: Path) -> dict:
    if not path.is_file():
        raise SystemExit(f"Missing file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Assert levy stack dolaMatch.mills match county AUTH mills.",
    )
    parser.add_argument("--stacks", type=Path, required=True)
    parser.add_argument("--pin-to-tag", type=Path, required=True, dest="pin_to_tag")
    parser.add_argument(
        "--authority-mills",
        type=Path,
        required=True,
        dest="authority_mills",
    )
    parser.add_argument(
        "--tax-year",
        default=None,
        dest="tax_year",
        help="Tax year (default: stacks snapshot.taxYear).",
    )
    parser.add_argument(
        "--max-report",
        type=int,
        default=40,
        dest="max_report",
        help="Max violation lines on stderr (default 40).",
    )
    args = parser.parse_args(argv)

    stacks_doc = _load_json(args.stacks)
    pin_doc = _load_json(args.pin_to_tag)
    bundle = CountyLevyMillsBundle.load(args.authority_mills)
    tag_map = build_tag_id_to_pdf_tag_from_pin_map(pin_doc)

    violations = assert_levy_stack_county_mills_parity(
        stacks_doc,
        tag_map,
        bundle,
        tax_year=args.tax_year,
    )
    if not violations:
        print(
            f"OK: levy stack mills match county tables "
            f"({len(stacks_doc.get('stacksByTagId') or {})} TAG stacks).",
            file=sys.stderr,
        )
        return 0

    print(
        f"FAIL: {len(violations)} levy stack county-mills violation(s).",
        file=sys.stderr,
    )
    for v in violations[: args.max_report]:
        print(f"  {v.format_line()}", file=sys.stderr)
    if len(violations) > args.max_report:
        print(
            f"  ... and {len(violations) - args.max_report} more",
            file=sys.stderr,
        )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
