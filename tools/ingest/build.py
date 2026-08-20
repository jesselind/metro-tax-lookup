#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""CLI: run the new ingest for one county.

Reads the mapping file, reads the two required CSVs (levy stack source and
account/parcel source), and writes app JSON to the comparison directory.
Does NOT write to public/data/. Production rebuild stays npm run build:arapahoe-index.

Usage:
  python3 tools/ingest/build.py --mapping tools/ingest/mappings/arapahoe.json \\
    --tag-file <TAG CSV> --parcel-file <MAIN PARCEL CSV> \\
    --out-dir supporting-data/_ingest-out \\
    --bundled-as-of YYYY-MM-DD

  npm run build:ingest -- --mapping tools/ingest/mappings/arapahoe.json \\
    --tag-file ... --parcel-file ... --out-dir supporting-data/_ingest-out \\
    --bundled-as-of YYYY-MM-DD
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Sequence

_TOOLS = Path(__file__).resolve().parent.parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))

from ingest.reader import load_mapping, read_levy_stack_rows, read_account_rows  # noqa: E402
from ingest.writer import write_comparison_dir  # noqa: E402
from ingest.classify import path_is_under_public  # noqa: E402


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Run new ingest for one county. Writes to a comparison directory only. "
            "Does not write to public/data/."
        )
    )
    parser.add_argument(
        "--mapping",
        type=Path,
        required=True,
        help="Path to county mapping JSON file (e.g. tools/ingest/mappings/arapahoe.json)",
    )
    parser.add_argument(
        "--tag-file",
        type=Path,
        required=True,
        dest="tag_file",
        help="Path to the levy stack CSV (e.g. Tax Authority Groups and Tax Authorities.csv)",
    )
    parser.add_argument(
        "--parcel-file",
        type=Path,
        required=True,
        dest="parcel_file",
        help="Path to the account/parcel CSV (e.g. Main Parcel Table.csv)",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("supporting-data/_ingest-out"),
        dest="out_dir",
        help="Comparison output directory (default: supporting-data/_ingest-out)",
    )
    parser.add_argument(
        "--bundled-as-of",
        required=True,
        dest="bundled_as_of",
        metavar="DATE",
        help="County mart download date (YYYY-MM-DD). Use the same date as the current rebuild.",
    )
    parser.add_argument(
        "--tax-year",
        default=None,
        dest="tax_year",
        help="Tax year string (optional; read from levy stack CSV when present).",
    )
    args = parser.parse_args(list(argv) if argv is not None else None)

    if path_is_under_public(args.out_dir):
        print(
            f"Error: --out-dir {args.out_dir} is inside public/. "
            "Use supporting-data/_ingest-out/ or another comparison directory.",
            file=sys.stderr,
        )
        return 2

    for label, path in [("--mapping", args.mapping), ("--tag-file", args.tag_file), ("--parcel-file", args.parcel_file)]:
        if not path.is_file():
            print(f"Error: {label} file not found: {path}", file=sys.stderr)
            return 2

    try:
        mapping = load_mapping(args.mapping)
    except Exception as exc:
        print(f"Error loading mapping: {exc}", file=sys.stderr)
        return 1

    print(f"Mapping: {mapping['county']} ({args.mapping})", file=sys.stderr)

    try:
        stack_rows = read_levy_stack_rows(args.tag_file, mapping)
    except Exception as exc:
        print(f"Error reading levy stack file: {exc}", file=sys.stderr)
        return 1

    print(f"Levy stack rows: {len(stack_rows)}", file=sys.stderr)

    try:
        account_rows = read_account_rows(args.parcel_file, mapping)
    except Exception as exc:
        print(f"Error reading parcel file: {exc}", file=sys.stderr)
        return 1

    print(f"Account rows: {len(account_rows)}", file=sys.stderr)

    try:
        write_comparison_dir(
            args.out_dir,
            stack_rows=stack_rows,
            account_rows=account_rows,
            mapping=mapping,
            bundled_as_of=args.bundled_as_of,
            tax_year=args.tax_year,
        )
    except Exception as exc:
        print(f"Error writing comparison directory: {exc}", file=sys.stderr)
        return 1

    print(f"Wrote comparison JSON to: {args.out_dir}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
