#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
Build public/data/colorado-special-district-directory.json from DOLA LG tabular export,
keeping only rows whose LGID appears in bundled levy stacks (dolaMatch.lgId).

Default filter is the union of LGIDs from every shipping county's levy stacks
(Arapahoe + Douglas today). One shared directory file; Contact lookup is LGID-keyed.

This replaces the older GIS dlall + data.gov merge: one pipeline, LGID-keyed contact rows
aligned with Property Tax Entity / bill-side LG IDs.

Inputs:
  - DOLA "lg export" CSV (default: supporting-data/dola/lg-export-all.csv)
  - One or more levy stacks JSON files (default: Arapahoe + Douglas under public/data/)
  - Optional: DOLA LGIS Property Tax Entities CSV (default: supporting-data/dola/property-tax-entities-export.csv)
    used only when a referenced LGID is missing from the LG directory export (name-only fallback row).
    Use --certifying-county (repeatable) to match that CSV's certifying county column
    (default: Arapahoe and Douglas).

Usage:
  python3 tools/build_district_directory_from_lg_export.py
  python3 tools/build_district_directory_from_lg_export.py \\
    --lg-csv path/to/lg-export.csv \\
    --levy-stacks public/data/arapahoe-levy-stacks-by-tag-id.json \\
    --levy-stacks public/data/douglas-levy-stacks-by-tag-id.json \\
    --out public/data/colorado-special-district-directory.json
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
_TOOLS = Path(__file__).resolve().parent
DEFAULT_PROPERTY_TAX_ENTITIES = ROOT / "supporting-data" / "dola" / "property-tax-entities-export.csv"
DEFAULT_LEVY_STACKS = [
    ROOT / "public" / "data" / "arapahoe-levy-stacks-by-tag-id.json",
    ROOT / "public" / "data" / "douglas-levy-stacks-by-tag-id.json",
]
DEFAULT_CERTIFYING_COUNTIES = ["Arapahoe", "Douglas"]
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))
from dola_lgis_property_tax_entities_csv import (  # noqa: E402
    load_lgid_to_entity_name_for_certifying_counties,
    normalize_csv_row_keys,
    normalize_lg_id_key,
)
from website_normalize import normalize_website  # noqa: E402


def normalize_mailing_field(raw: str | None) -> str | None:
    """Trim LG export noise: empty/NA, trailing commas and spaces on addresses."""
    s = (raw or "").strip()
    s = s.rstrip(", \t").strip()
    if not s or s.upper() == "NA":
        return None
    return s


def collect_lg_ids_from_levy_stacks(path: Path) -> set[str]:
    """
    Normalized LG IDs referenced by ``dolaMatch.lgId`` on bundled levy stack lines.

    Used to filter the statewide LG export down to districts that appear on
    shipping stacks (and to detect export gaps).
    """
    data = json.loads(path.read_text(encoding="utf-8"))
    out: set[str] = set()
    stacks = data.get("stacksByTagId") or {}
    for stack in stacks.values():
        for line in stack.get("lines") or []:
            dm = line.get("dolaMatch") or {}
            lg = dm.get("lgId")
            if lg is None:
                continue
            s = str(lg).strip()
            if not s:
                continue
            nid = normalize_lg_id_key(s)
            if nid:
                out.add(nid)
    return out


def collect_lg_ids_from_levy_stack_paths(paths: list[Path]) -> tuple[set[str], list[str]]:
    """Union of stack LGIDs across paths; return (wanted, stack filenames in caller order)."""
    wanted: set[str] = set()
    names: list[str] = []
    for path in paths:
        wanted |= collect_lg_ids_from_levy_stacks(path)
        names.append(path.name)
    return wanted, names


def load_lg_csv(path: Path) -> tuple[list[dict[str, Any]], str]:
    """Return (district dict rows, source filename)."""
    try:
        csv.field_size_limit(sys.maxsize)
    except OverflowError:
        csv.field_size_limit(10_000_000)

    districts: list[dict[str, Any]] = []
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for raw in reader:
            nr = normalize_csv_row_keys(raw)
            lg_raw = (nr.get("LGID") or "").strip()
            lg_id = normalize_lg_id_key(lg_raw) if lg_raw else None
            if not lg_id:
                continue
            name = (nr.get("Local Government Name") or "").strip()
            if not name:
                continue
            abbrev = None
            alt_address = normalize_mailing_field(nr.get("Alternate Address"))
            lg_type = (nr.get("Local Government Type") or "").strip() or None

            districts.append(
                {
                    "lgId": lg_id,
                    "name": name,
                    "abbrevName": abbrev,
                    "websiteUrl": normalize_website(nr.get("Website URL") or ""),
                    "mailAddress": normalize_mailing_field(nr.get("Mailing Address")),
                    "altAddress": alt_address,
                    "mailCity": (nr.get("Mailing City") or "").strip() or None,
                    "mailState": (nr.get("Mailing State") or "").strip() or None,
                    "mailZip": (nr.get("Mailing Zip") or "").strip() or None,
                    "lgTypeId": None,
                    "localGovernmentType": lg_type,
                    "prevName": None,
                    "source": "DOLA LG tabular export (Local Government directory)",
                    "lastUpdate": None,
                }
            )

    districts.sort(key=lambda d: (d["lgId"], d["name"]))
    return districts, path.name


def minimal_district_row_from_entity_name(lg_id: str, legal_name: str) -> dict[str, Any]:
    """Directory row shape aligned with load_lg_csv; contact fields null until LG export has a row."""
    return {
        "lgId": lg_id,
        "name": legal_name,
        "abbrevName": None,
        "websiteUrl": None,
        "mailAddress": None,
        "altAddress": None,
        "mailCity": None,
        "mailState": None,
        "mailZip": None,
        "lgTypeId": None,
        "localGovernmentType": None,
        "prevName": None,
        "source": (
            "DOLA LGIS Property Tax Entities export (fallback; row absent from LG directory CSV)"
        ),
        "lastUpdate": None,
    }


def build_directory_payload(
    *,
    lg_csv: Path,
    levy_stacks: list[Path],
    property_tax_entities: Path,
    certifying_counties: list[str],
) -> dict[str, Any]:
    """
    Filter LG export rows to the union of LGIDs on the given levy stacks.

    Adds name-only fallback rows from the Property Tax Entities CSV when an LGID
    is referenced on stacks but missing from the LG directory export.
    """
    if not lg_csv.is_file():
        raise FileNotFoundError(f"LG CSV not found: {lg_csv}")
    if not levy_stacks:
        raise ValueError("At least one --levy-stacks path is required")
    for path in levy_stacks:
        if not path.is_file():
            raise FileNotFoundError(f"Levy stacks JSON not found: {path}")

    wanted, stack_names = collect_lg_ids_from_levy_stack_paths(levy_stacks)
    all_rows, source_csv_name = load_lg_csv(lg_csv)
    by_lg = {d["lgId"]: d for d in all_rows}
    filtered: list[dict[str, Any]] = []
    missing: list[str] = []
    for lg in sorted(wanted):
        row = by_lg.get(lg)
        if row:
            filtered.append(row)
        else:
            missing.append(lg)

    pt_path = property_tax_entities
    if pt_path.is_file():
        name_by_lg, pt_county_filter_applied, counties_applied = (
            load_lgid_to_entity_name_for_certifying_counties(pt_path, certifying_counties)
        )
    else:
        name_by_lg, pt_county_filter_applied, counties_applied = {}, False, []
    filled_from_pt: list[str] = []
    still_missing: list[str] = []
    for lg in missing:
        nm = name_by_lg.get(lg)
        if nm:
            filtered.append(minimal_district_row_from_entity_name(lg, nm))
            filled_from_pt.append(lg)
        else:
            still_missing.append(lg)
    missing = still_missing
    filtered.sort(key=lambda d: (d["lgId"], d["name"]))

    bundled_date = date.today().isoformat()
    export_stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    stacks_label = ", ".join(stack_names)

    if filled_from_pt:
        snapshot_source = (
            f"DOLA LG tabular export, filtered to bundled levy stacks ({stacks_label}); "
            "fallback rows from DOLA LGIS Property Tax Entities when an LGID is absent "
            "from the LG directory."
        )
    else:
        snapshot_source = (
            "DOLA LG tabular export, filtered to LGIDs referenced in bundled levy stacks "
            f"({stacks_label})."
        )

    return {
        "snapshot": {
            "bundledAsOf": bundled_date,
            "source": snapshot_source,
            "sourceCsv": source_csv_name,
        },
        "_meta": {
            "lgExportSourceCsv": source_csv_name,
            "lgExportBundledAt": export_stamp,
            "levyStacksReferences": stack_names,
            "propertyTaxEntitiesFallbackCsv": pt_path.name if pt_path.is_file() else None,
            "propertyTaxEntitiesCountyFilterApplied": pt_county_filter_applied,
            "certifyingCountiesForPropertyTaxFallback": (
                counties_applied if pt_county_filter_applied else []
            ),
            "referencedLgIdCount": len(wanted),
            "directoryRowCount": len(filtered),
            "lgIdsFilledFromPropertyTaxEntities": sorted(filled_from_pt),
            "missingLgIdsInExport": missing,
        },
        "districtCount": len(filtered),
        "districts": filtered,
    }


def main() -> None:
    """CLI: filter DOLA LG export to LGIDs on shipping levy stacks; write public directory JSON."""
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--lg-csv",
        type=Path,
        default=ROOT / "supporting-data" / "dola" / "lg-export-all.csv",
        help="DOLA LG export CSV (full state list).",
    )
    ap.add_argument(
        "--levy-stacks",
        type=Path,
        action="append",
        default=None,
        help=(
            "Bundled levy stacks JSON (LGIDs taken from each line's dolaMatch). "
            "Repeat for each shipping county. Default: Arapahoe + Douglas under public/data/."
        ),
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=ROOT / "public" / "data" / "colorado-special-district-directory.json",
    )
    ap.add_argument(
        "--property-tax-entities",
        type=Path,
        default=DEFAULT_PROPERTY_TAX_ENTITIES,
        help=(
            "DOLA LGIS Property Tax Entities CSV for name-only fallback rows when an LGID "
            "is referenced in levy stacks but missing from --lg-csv. Pass a non-existent path to disable."
        ),
    )
    ap.add_argument(
        "--certifying-county",
        action="append",
        default=None,
        dest="certifying_counties",
        help=(
            "Certifying county label in the Property Tax Entities CSV (case-insensitive). "
            "Repeat for each county used in fallback name lookup. "
            "Default: Arapahoe and Douglas."
        ),
    )
    args = ap.parse_args()

    levy_stacks = args.levy_stacks if args.levy_stacks else list(DEFAULT_LEVY_STACKS)
    certifying_counties = (
        args.certifying_counties
        if args.certifying_counties
        else list(DEFAULT_CERTIFYING_COUNTIES)
    )

    try:
        out_obj = build_directory_payload(
            lg_csv=args.lg_csv,
            levy_stacks=levy_stacks,
            property_tax_entities=args.property_tax_entities,
            certifying_counties=certifying_counties,
        )
    except (FileNotFoundError, ValueError) as exc:
        raise SystemExit(str(exc)) from exc

    missing = out_obj["_meta"]["missingLgIdsInExport"]
    if missing:
        print(
            f"Warning: {len(missing)} LGID(s) from levy stacks not found in LG export: "
            f"{missing[:20]}{'...' if len(missing) > 20 else ''}",
            file=sys.stderr,
        )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out_obj, indent=2) + "\n", encoding="utf-8")
    wanted = out_obj["_meta"]["referencedLgIdCount"]
    filtered = out_obj["districtCount"]
    stacks = ", ".join(out_obj["_meta"]["levyStacksReferences"])
    print(
        f"Wrote {filtered} districts (from {wanted} referenced LGIDs across {stacks}) "
        f"to {args.out}"
    )


if __name__ == "__main__":
    main()
