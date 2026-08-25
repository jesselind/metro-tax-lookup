#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""CLI: run the new ingest for one county.

Reads the mapping file, reads the levy stack CSV and Main Parcel (one pass for
account map + situs + parcel records), joins sibling mart / GIS when present,
and writes app JSON to a comparison directory or, with --ship, to ship staging
then an atomic land into public/data/ after IDENTICAL.
Production emergency rebuild stays npm run build:arapahoe-index until cutover
and afterward as rollback.

Usage:
  python3 tools/ingest/build.py --mapping tools/ingest/mappings/arapahoe.json \\
    --tag-file <TAG CSV> --parcel-file <MAIN PARCEL CSV> \\
    --out-dir supporting-data/_ingest-out \\
    --bundled-as-of YYYY-MM-DD

  npm run build:ingest -- --mapping tools/ingest/mappings/arapahoe.json \\
    --tag-file ... --parcel-file ... --out-dir supporting-data/_ingest-out \\
    --bundled-as-of YYYY-MM-DD

  Ship-from-new (raw → v2 → staging → IDENTICAL → atomic land):
  npm run build:ingest:ship
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Sequence

_TOOLS = Path(__file__).resolve().parent.parent
_REPO = _TOOLS.parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))

from ingest.reader import load_mapping, read_levy_stack_rows  # noqa: E402
from ingest.writer import write_comparison_dir  # noqa: E402
from ingest.out_dir_policy import OutDirPolicyError, ship_preflight, validate_out_dir  # noqa: E402
from ingest.ship_land import (  # noqa: E402
    ShipLandError,
    cleanup_ship_staging,
    land_arapahoe_shipping,
    reset_ship_staging,
)
from ingest.dola_match import (  # noqa: E402
    DEFAULT_OVERRIDES,
    load_dola_join_context,
)
from ingest.parcel_record import read_main_parcel_bundle  # noqa: E402


def _default_path_from_mapping(mapping: dict[str, Any], key: str) -> Path | None:
    defaults = mapping.get("defaultPaths") or {}
    rel = defaults.get(key)
    if not rel or not isinstance(rel, str):
        return None
    return _REPO / rel


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Run new ingest for one county. Default: comparison directory only. "
            "With --ship: build in staging, require IDENTICAL vs public/data/, "
            "then atomically land Arapahoe shipping files."
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
        help=(
            "Output directory (default: supporting-data/_ingest-out). "
            "With --ship, must be public/data/ (land target; build uses staging)."
        ),
    )
    parser.add_argument(
        "--ship",
        action="store_true",
        help=(
            "Ship-from-new: build from raw inputs into staging, require "
            "IDENTICAL vs public/data/, then atomically replace Arapahoe "
            "shipping files. Requires clean git status public/data/ and "
            "--bundled-as-of matching tools/county-mart-data-as-of.txt."
        ),
    )
    parser.add_argument(
        "--ship-allow-diff",
        action="store_true",
        dest="ship_allow_diff",
        help=(
            "With --ship only: skip the pre-swap IDENTICAL gate so a mart "
            "refresh can land intentional diffs. Still builds in staging and "
            "atomically swaps. Cutover must omit this flag."
        ),
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
    parser.add_argument(
        "--dola-export",
        type=Path,
        default=None,
        dest="dola_export",
        help=(
            "DOLA Property Tax Entities CSV/xlsx for mill join. "
            "Default: supporting-data/dola/property-tax-entities-export.csv if present."
        ),
    )
    parser.add_argument(
        "--dola-overrides",
        type=Path,
        default=None,
        dest="dola_overrides",
        help=(
            "New-engine authority overrides JSON. "
            f"Default: {DEFAULT_OVERRIDES}"
        ),
    )
    parser.add_argument(
        "--dola-certifying-county",
        default="Arapahoe",
        dest="dola_certifying_county",
        help="Certifying County filter for the DOLA export (default: Arapahoe).",
    )
    parser.add_argument(
        "--skip-dola-join",
        action="store_true",
        dest="skip_dola_join",
        help="Leave dolaMatch as method=none (structural-only; not for parity compare).",
    )
    parser.add_argument(
        "--skip-situs-shards",
        action="store_true",
        dest="skip_situs_shards",
        help="Write only levy stacks + account map (skip situs index and parcel-record shards).",
    )
    parser.add_argument(
        "--skip-neighborhood",
        action="store_true",
        dest="skip_neighborhood",
        help="Build parcel-record shards without GIS neighborhood fields.",
    )
    parser.add_argument(
        "--gis-parcels-gdb",
        type=Path,
        default=None,
        dest="gis_parcels_gdb",
        help="Open GIS Assessor Parcels FileGDB (default from mapping defaultPaths).",
    )
    parser.add_argument(
        "--legal-descriptions",
        type=Path,
        default=None,
        dest="legal_descriptions",
        help="Parcel Legal Descriptions CSV (default from mapping).",
    )
    parser.add_argument(
        "--legal-parties",
        type=Path,
        default=None,
        dest="legal_parties",
        help="Parcel Legal Parties CSV (default from mapping).",
    )
    parser.add_argument(
        "--land",
        type=Path,
        default=None,
        dest="land",
        help="Parcel Land Information CSV (default from mapping).",
    )
    parser.add_argument(
        "--building",
        type=Path,
        default=None,
        dest="building",
        help="Parcel Building Information CSV (default from mapping).",
    )
    parser.add_argument(
        "--building-xfob",
        type=Path,
        default=None,
        dest="building_xfob",
        help="Parcel Building Extra Features CSV (default from mapping; unused today).",
    )
    parser.add_argument(
        "--transfers",
        type=Path,
        default=None,
        dest="transfers",
        help="Parcel Transfer Information CSV (default from mapping).",
    )
    parser.add_argument(
        "--permits",
        type=Path,
        default=None,
        dest="permits",
        help="Parcel Permit Information CSV (default from mapping).",
    )
    parser.add_argument(
        "--state-class-xlsx",
        type=Path,
        default=None,
        dest="state_class_xlsx",
        help="State Class Codes xlsx (default from mapping).",
    )
    parser.add_argument(
        "--nbhd-xlsx",
        type=Path,
        default=None,
        dest="nbhd_xlsx",
        help="NBHD codes xlsx backup lookup (default from mapping; not joined without GIS).",
    )
    args = parser.parse_args(list(argv) if argv is not None else None)

    if args.ship_allow_diff and not args.ship:
        print("Error: --ship-allow-diff requires --ship.", file=sys.stderr)
        return 2

    try:
        resolved_out_dir = validate_out_dir(args.out_dir, ship=args.ship, repo_root=_REPO)
    except OutDirPolicyError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    if args.ship:
        try:
            ship_preflight(args.bundled_as_of, repo_root=_REPO)
        except OutDirPolicyError as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 2
        if args.skip_situs_shards:
            print(
                "Error: --ship requires situs and parcel-record shards "
                "(do not pass --skip-situs-shards).",
                file=sys.stderr,
            )
            return 2

    for label, path in [
        ("--mapping", args.mapping),
        ("--tag-file", args.tag_file),
        ("--parcel-file", args.parcel_file),
    ]:
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
        account_rows, situs_map, parcel_record_map = read_main_parcel_bundle(
            args.parcel_file, mapping
        )
    except Exception as exc:
        print(f"Error reading parcel file: {exc}", file=sys.stderr)
        return 1

    print(
        f"Account rows: {len(account_rows)}; situs keys: {len(situs_map)}; "
        f"parcel records: {len(parcel_record_map)}",
        file=sys.stderr,
    )

    dola_join = None
    if not args.skip_dola_join:
        dola_join = load_dola_join_context(
            dola_export=args.dola_export,
            overrides_path=args.dola_overrides,
            certifying_county=args.dola_certifying_county,
        )

    def _resolve(cli: Path | None, key: str) -> Path | None:
        if cli is not None:
            return cli
        return _default_path_from_mapping(mapping, key)

    sibling_paths = {
        "legalDescriptions": _resolve(args.legal_descriptions, "legalDescriptions"),
        "legalParties": _resolve(args.legal_parties, "legalParties"),
        "land": _resolve(args.land, "land"),
        "building": _resolve(args.building, "building"),
        "buildingXfob": _resolve(args.building_xfob, "buildingXfob"),
        "transfers": _resolve(args.transfers, "transfers"),
        "permits": _resolve(args.permits, "permits"),
        "stateClassXlsx": _resolve(args.state_class_xlsx, "stateClassXlsx"),
        "nbhdXlsx": _resolve(args.nbhd_xlsx, "nbhdXlsx"),
    }
    gis_gdb = _resolve(args.gis_parcels_gdb, "gisParcelsGdb")

    write_dir = resolved_out_dir
    shipping_dir: Path | None = None
    if args.ship:
        shipping_dir = resolved_out_dir
        write_dir = reset_ship_staging(repo_root=_REPO)
        print(
            f"SHIP: building engine v2 output in staging ({write_dir}); "
            "live public/data/ unchanged until IDENTICAL + atomic land.",
            file=sys.stderr,
        )

    try:
        write_comparison_dir(
            write_dir,
            stack_rows=stack_rows,
            account_rows=account_rows,
            mapping=mapping,
            bundled_as_of=args.bundled_as_of,
            tax_year=args.tax_year,
            dola_join=dola_join,
            situs_map=None if args.skip_situs_shards else situs_map,
            parcel_record_map=None if args.skip_situs_shards else parcel_record_map,
            sibling_paths=sibling_paths,
            skip_neighborhood=args.skip_neighborhood,
            gis_parcels_gdb=gis_gdb,
            skip_situs_shards=args.skip_situs_shards,
        )
    except OutDirPolicyError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:
        print(f"Error writing output directory: {exc}", file=sys.stderr)
        return 1

    if args.ship:
        assert shipping_dir is not None
        try:
            print("SHIP: pre-swap IDENTICAL gate...", file=sys.stderr)
            land_arapahoe_shipping(
                staging=write_dir,
                shipping=shipping_dir,
                skip_pre_swap_identical=args.ship_allow_diff,
            )
        except ShipLandError as exc:
            print(f"Error: {exc}", file=sys.stderr)
            print(
                "SHIP aborted: live public/data/ Arapahoe files were not replaced. "
                f"Staging left at {write_dir} for inspection.",
                file=sys.stderr,
            )
            return 1
        cleanup_ship_staging(repo_root=_REPO)
        print(f"SHIP: atomic land complete → {shipping_dir}", file=sys.stderr)
        return 0

    print(f"Wrote comparison JSON to: {write_dir}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
