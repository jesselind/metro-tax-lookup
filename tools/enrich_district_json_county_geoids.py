#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
For each row in supporting-data/colorado-all-special-districts.json (from All Special Districts CSV),
set countyGeoids: county GEOIDs (5-digit, e.g. 08005 for Arapahoe) where the
district WKT intersects the TL GDB County layer.

Requires: geopandas, pandas (see tools/requirements.txt).

Usage:
  .venv/bin/python tools/enrich_district_json_county_geoids.py
  .venv/bin/python tools/enrich_district_json_county_geoids.py \\
    --csv supporting-data/All_Special_Districts_in_Colorado_20260401.csv \\
    --gdb supporting-data/tlgdb_2025_a_08_co.gdb \\
    --layer County \\
    --json supporting-data/colorado-all-special-districts.json
"""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path

import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--csv",
        type=Path,
        default=ROOT / "supporting-data" / "All_Special_Districts_in_Colorado_20260401.csv",
    )
    ap.add_argument(
        "--gdb",
        type=Path,
        default=ROOT / "supporting-data" / "tlgdb_2025_a_08_co.gdb",
    )
    ap.add_argument("--layer", default="County", help="GDB layer name (default County).")
    ap.add_argument(
        "--json",
        type=Path,
        default=ROOT / "supporting-data" / "colorado-all-special-districts.json",
    )
    args = ap.parse_args()

    if not args.csv.is_file():
        raise SystemExit(f"CSV not found: {args.csv}")
    if not args.gdb.is_dir():
        raise SystemExit(f"GDB not found: {args.gdb}")
    if not args.json.is_file():
        raise SystemExit(f"JSON not found: {args.json}")

    df = pd.read_csv(args.csv, dtype=str, keep_default_na=False)
    if "geometry" not in df.columns:
        raise SystemExit("CSV missing geometry column")

    wkt_series = df["geometry"].replace("", pd.NA)
    valid = wkt_series.notna() & (wkt_series.astype(str).str.strip() != "")
    wkt_only = wkt_series[valid].reset_index(drop=True)
    geom = gpd.GeoSeries.from_wkt(wkt_only, on_invalid="warn")
    dist = gpd.GeoDataFrame(
        df.loc[valid].reset_index(drop=True),
        geometry=geom,
        crs="EPSG:4326",
    )
    dist = dist.to_crs(4269)

    counties = gpd.read_file(args.gdb, layer=args.layer)
    if "GEOID" not in counties.columns:
        raise SystemExit(f"Layer {args.layer!r} has no GEOID column")

    joined = dist.sjoin(
        counties[["GEOID", "geometry"]],
        predicate="intersects",
        how="left",
    )
    oid_col = "objectID_1" if "objectID_1" in joined.columns else None
    if not oid_col:
        raise SystemExit("CSV missing objectID_1 for matching JSON rows")

    def geoids_for_group(s: pd.Series) -> list[str]:
        return sorted({str(x) for x in s.dropna() if str(x).strip()})

    by_object_id: dict[str, list[str]] = {}
    for _, group in joined.groupby(joined.index, sort=False):
        oid = str(group[oid_col].iloc[0]).strip()
        if not oid:
            continue
        by_object_id[oid] = geoids_for_group(group["GEOID"])

    payload = json.loads(args.json.read_text(encoding="utf-8"))
    districts = payload.get("districts")
    if not isinstance(districts, list):
        raise SystemExit("JSON districts must be a list")

    matched = 0
    for d in districts:
        if not isinstance(d, dict):
            continue
        oid = (d.get("objectId") or "").strip()
        if oid and oid in by_object_id:
            d["countyGeoids"] = by_object_id[oid]
            matched += 1
        else:
            d["countyGeoids"] = []

    snap = payload.setdefault("snapshot", {})
    note = (
        f"District county GEOIDs from WKT ∩ {args.gdb.name} layer {args.layer!r} "
        f"(EPSG:4269); CSV {args.csv.name}."
    )
    snap["countyGeoidsAsOf"] = date.today().isoformat()
    existing = snap.get("source", "")
    if note not in existing:
        snap["source"] = f"{existing} {note}".strip()

    args.json.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote countyGeoids for {matched}/{len(districts)} districts -> {args.json}")


if __name__ == "__main__":
    main()
