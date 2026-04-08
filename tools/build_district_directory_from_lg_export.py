#!/usr/bin/env python3
"""
Build public/data/colorado-special-district-directory.json from DOLA LG tabular export,
keeping only rows whose LGID appears in bundled Arapahoe levy stacks (dolaMatch.lgId).

This replaces the older GIS dlall + data.gov merge: one pipeline, LGID-keyed contact rows
aligned with Property Tax Entity / bill-side LG IDs.

Inputs:
  - DOLA "lg export" CSV (default: supporting-data-phase-2/lg-export-all.csv)
  - Levy stacks JSON (default: public/data/arapahoe-levy-stacks-by-tag-id.json)

Usage:
  python3 tools/build_district_directory_from_lg_export.py
  python3 tools/build_district_directory_from_lg_export.py \\
    --lg-csv path/to/lg-export.csv \\
    --levy-stacks public/data/arapahoe-levy-stacks-by-tag-id.json \\
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
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))
from website_normalize import normalize_website  # noqa: E402


def normalize_lg_id(raw: str) -> str | None:
    """Match JS padLgId / lgIdKeyFromRaw: 5-digit key for directory lookup."""
    digits = "".join(c for c in raw if c.isdigit())
    if not digits:
        return None
    if len(digits) >= 6:
        return digits[:5]
    return digits.zfill(5)


def normalize_csv_row_keys(row: dict[str, str]) -> dict[str, str]:
    return {k.rstrip(":").strip(): (v or "").strip() for k, v in row.items()}


def collect_lg_ids_from_levy_stacks(path: Path) -> set[str]:
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
            nid = normalize_lg_id(s)
            if nid:
                out.add(nid)
    return out


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
            lg_id = normalize_lg_id(lg_raw) if lg_raw else None
            if not lg_id:
                continue
            name = (nr.get("Local Government Name") or "").strip()
            if not name:
                continue
            abbrev = None
            alt_raw = nr.get("Alternate Address") or ""
            alt_address = alt_raw.strip() if alt_raw.strip() and alt_raw.upper() != "NA" else None
            lg_type = (nr.get("Local Government Type") or "").strip() or None

            districts.append(
                {
                    "lgId": lg_id,
                    "name": name,
                    "abbrevName": abbrev,
                    "websiteUrl": normalize_website(nr.get("Website URL") or ""),
                    "mailAddress": (nr.get("Mailing Address") or "").strip() or None,
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


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--lg-csv",
        type=Path,
        default=ROOT / "supporting-data-phase-2" / "lg-export-all.csv",
        help="DOLA LG export CSV (full state list).",
    )
    ap.add_argument(
        "--levy-stacks",
        type=Path,
        default=ROOT / "public" / "data" / "arapahoe-levy-stacks-by-tag-id.json",
        help="Bundled levy stacks JSON (LGIDs taken from each line's dolaMatch).",
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=ROOT / "public" / "data" / "colorado-special-district-directory.json",
    )
    args = ap.parse_args()

    if not args.lg_csv.is_file():
        raise SystemExit(f"LG CSV not found: {args.lg_csv}")
    if not args.levy_stacks.is_file():
        raise SystemExit(f"Levy stacks JSON not found: {args.levy_stacks}")

    wanted = collect_lg_ids_from_levy_stacks(args.levy_stacks)
    all_rows, source_csv_name = load_lg_csv(args.lg_csv)
    by_lg = {d["lgId"]: d for d in all_rows}
    filtered: list[dict[str, Any]] = []
    missing: list[str] = []
    for lg in sorted(wanted):
        row = by_lg.get(lg)
        if row:
            filtered.append(row)
        else:
            missing.append(lg)

    bundled_date = date.today().isoformat()
    export_stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    out_obj: dict[str, Any] = {
        "snapshot": {
            "bundledAsOf": bundled_date,
            "source": "DOLA LG tabular export, filtered to LGIDs referenced in bundled Arapahoe levy stacks.",
            "sourceCsv": source_csv_name,
        },
        "_meta": {
            "lgExportSourceCsv": source_csv_name,
            "lgExportBundledAt": export_stamp,
            "levyStacksReference": args.levy_stacks.name,
            "referencedLgIdCount": len(wanted),
            "directoryRowCount": len(filtered),
            "missingLgIdsInExport": missing,
        },
        "districtCount": len(filtered),
        "districts": filtered,
    }

    if missing:
        print(
            f"Warning: {len(missing)} LGID(s) from levy stacks not found in LG export: "
            f"{missing[:20]}{'...' if len(missing) > 20 else ''}",
            file=sys.stderr,
        )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out_obj, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(filtered)} districts (from {len(wanted)} referenced LGIDs) to {args.out}")


if __name__ == "__main__":
    main()
