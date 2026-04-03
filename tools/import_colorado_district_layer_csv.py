#!/usr/bin/env python3
"""
Convert Colorado DOLA / data.colorado.gov district CSV exports to lean JSON for
the levy stack tool. WKT geometry columns are ignored (not written to JSON).

Dataset page (export CSV from the portal): https://data.colorado.gov/Local-Aggregation/Map-of-All-Special-Districts-in-Colorado/dm2a-biqr
Canonical URL also in src/lib/dataSourceUrls.ts (COLORADO_DATA_GOV_ALL_SPECIAL_DISTRICTS_DATASET).

Exports use slightly different headers; this normalizes them.

Usage (preset defaults to the bundled All Special Districts export):

  python3 tools/import_colorado_district_layer_csv.py --preset all

After refreshing the CSV, attach county GEOIDs (WKT + TL GDB) with:

  .venv/bin/python tools/enrich_district_json_county_geoids.py

Override paths:

  python3 tools/import_colorado_district_layer_csv.py \\
    --csv supporting-data/MyExport.csv \\
    --out public/data/colorado-all-special-districts.json \\
    --source-title "All Special Districts in Colorado"
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import re
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SUPPORT = ROOT / "supporting-data"
PUBLIC_DATA = ROOT / "public" / "data"

PRESETS: dict[str, dict[str, str | Path]] = {
    "all": {
        "csv": SUPPORT / "All_Special_Districts_in_Colorado_20260401.csv",
        "out": PUBLIC_DATA / "colorado-all-special-districts.json",
        "title": "All Special Districts in Colorado",
    },
}


def normalize_website(raw: str) -> str | None:
    t = raw.strip()
    if not t or t.upper() == "NA":
        return None
    if re.match(r"^https?://", t, re.I):
        return t
    return f"https://{t.lstrip('/')}"


def clean_str(raw: str | None) -> str | None:
    if raw is None:
        return None
    t = raw.strip()
    if not t or t.upper() == "NA":
        return None
    return t


def row_to_district(row: dict[str, str]) -> dict[str, Any] | None:
    lg_id = (row.get("lgid") or row.get("lgId") or "").strip()
    name = (row.get("name") or "").strip()
    if not lg_id and not name:
        return None
    abbrev = row.get("abbrevName") or row.get("abbrevNam")
    alt_line = row.get("alrAddress") or row.get("altAddress")
    return {
        "lgId": lg_id,
        "name": name,
        "abbrevName": clean_str(abbrev),
        "websiteUrl": normalize_website(row.get("url") or ""),
        "mailAddress": clean_str(row.get("mailAddress")),
        "altAddress": clean_str(alt_line),
        "mailCity": clean_str(row.get("mailCity")),
        "mailState": clean_str(row.get("mailState")),
        "mailZip": clean_str(row.get("mailZip")),
        "lgTypeId": (row.get("lgTypeId") or "").strip() or None,
        "lgStatus": (row.get("lgStatus") or "").strip() or None,
        "prevName": clean_str(row.get("prevName")),
        "source": clean_str(row.get("source")),
        "lastUpdate": clean_str(row.get("lastUpdate")),
        "objectId": (row.get("objectID_1") or "").strip() or None,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--preset",
        choices=sorted(PRESETS.keys()),
        help="Use bundled default CSV path, output path, and catalog title.",
    )
    ap.add_argument("--csv", type=Path, help="Input CSV path.")
    ap.add_argument("--out", type=Path, help="Output JSON path.")
    ap.add_argument(
        "--source-title",
        help="Short catalog title for snapshot.source (default from preset or generic).",
    )
    args = ap.parse_args()

    if args.preset:
        cfg = PRESETS[args.preset]
        csv_path = Path(args.csv) if args.csv else Path(cfg["csv"])
        out_path = Path(args.out) if args.out else Path(cfg["out"])
        title = args.source_title or str(cfg["title"])
    else:
        if not args.csv or not args.out:
            ap.error("Without --preset, both --csv and --out are required.")
        csv_path = args.csv
        out_path = args.out
        title = args.source_title or "Colorado district layer (tabular export)"

    if not csv_path.is_file():
        raise SystemExit(f"CSV not found: {csv_path}")

    districts: list[dict[str, Any]] = []
    try:
        csv.field_size_limit(sys.maxsize)
    except OverflowError:
        csv.field_size_limit(10_000_000)

    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            d = row_to_district(row)
            if d:
                districts.append(d)

    districts.sort(key=lambda x: (x["lgId"], x["name"]))

    out_obj = {
        "snapshot": {
            "bundledAsOf": date.today().isoformat(),
            "source": f"Colorado data.colorado.gov — {title} "
            f"(tabular export; geometry omitted). DOLA.",
            "sourceCsv": csv_path.name,
        },
        "districtCount": len(districts),
        "districts": districts,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out_obj, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(districts)} districts to {out_path}")


if __name__ == "__main__":
    main()
