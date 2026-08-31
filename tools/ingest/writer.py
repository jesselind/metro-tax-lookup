#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""JSON writer for the new ingest.

Converts intermediate records (from reader.py) into the app JSON shapes defined
by the Phase 1 contract (countyParcelLevyData.ts). Writes only to a comparison
or ship-staging directory — never mid-run into live public/data/. Ship-from-new
lands via build.py --ship + ship_land.py after IDENTICAL.

Usage:
  from ingest.writer import build_levy_stacks_json, build_account_map_json, write_comparison_dir
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

from ingest.out_dir_policy import validate_out_dir
from ingest.dola_match import DolaJoinContext
from ingest.parcel_record import (
    PARCEL_RECORD_SHARD_PREFIX_LEN,
    enrich_parcel_record_from_sibling_marts,
    read_gis_parcels_data_as_of,
    write_parcel_record_shards,
)
from ingest.situs import build_situs_json


# -----------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------



def county_data_basename(mapping: dict[str, Any], leaf: str) -> str:
    """Return ``{countyId}-{leaf}`` for app JSON filenames (pin-to-tag, etc.)."""
    county = _strip(mapping.get("county", "")) or "county"
    return f"{county}-{leaf}"

def _strip(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def _normalize_account_id(raw: Any, pin_digits: int) -> str:
    """
    Strip, drop a trailing Excel-style ``.0``, and zero-pad digit-only ids.

    Digit-only values must land at exactly ``pin_digits`` width after padding.
    Non-digit ids are returned stripped (no length check).
    Raises ValueError when a digit-only id is longer than ``pin_digits``.
    """
    s = _strip(raw)
    if not s:
        return ""
    m = re.fullmatch(r"(-?\d+)\.0+", s)
    if m:
        s = m.group(1)
    if s.isdigit():
        if len(s) > pin_digits:
            raise ValueError(
                f"accountId {s!r} has {len(s)} digits; expected at most {pin_digits}"
            )
        return s.zfill(pin_digits)
    return s


def _normalize_bundled_as_of(raw: str) -> str:
    """Expand YYYY-MM-DD to noon-UTC ISO; leave other stamps unchanged."""
    o = raw.strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", o):
        return f"{o}T12:00:00Z"
    return o


def _sort_line_code(code: str) -> tuple[int, str]:
    """Sort key: numeric codes first, ASSRFEES last, other codes between."""
    c = _strip(code).upper()
    if c == "ASSRFEES":
        return (2, c)
    if c.isdigit():
        return (0, c.zfill(4))
    return (1, c)


def _status_rank(status: str) -> int:
    """Prefer active, then blank, then inactive, then other."""
    st = _strip(status).upper()
    if st == "A":
        return 0
    if st == "":
        return 1
    if st == "I":
        return 2
    return 3


def _effective_year_number(raw: str | None) -> int:
    t = _strip(raw)
    if t.isdigit():
        return int(t)
    return -1


def _collapse_levy_lines(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    One canonical row per (line code, authority name) in a tax area.

    Prefer status A over blank over I/other; then newest effectiveYear; then first seen.
    Same rules as the current production rebuild (shared field names only).
    """
    best_by_key: dict[tuple[str, str], dict[str, Any]] = {}
    best_rank: dict[tuple[str, str], tuple[int, int, int]] = {}
    for idx, row in enumerate(rows):
        key = (
            _strip(row.get("lineCode", "")).upper(),
            _strip(row.get("authorityName", "")).upper(),
        )
        rank = (
            _status_rank(str(row.get("status") or "")),
            -_effective_year_number(str(row.get("effectiveYear") or "")),
            idx,
        )
        prev = best_rank.get(key)
        if prev is None or rank < prev:
            best_rank[key] = rank
            best_by_key[key] = row
    return list(best_by_key.values())


def _tax_year_from_rows(rows: list[dict[str, Any]]) -> str | None:
    for row in rows:
        ty = _strip(row.get("taxYear", ""))
        if ty:
            return ty
    return None


# -----------------------------------------------------------------------
# Levy stacks
# -----------------------------------------------------------------------

def build_levy_stacks_json(
    rows: list[dict[str, Any]],
    mapping: dict[str, Any],
    *,
    bundled_as_of: str,
    tax_year: str | None = None,
    dola_join: DolaJoinContext | None = None,
) -> dict[str, Any]:
    """
    Convert levy stack intermediate records to the app JSON shape.

    Output matches arapahoe-levy-stacks-by-tag-id.json:
      { snapshot: {...}, stacksByTagId: { tagId: { tagId, taxYear, levyAspxUrl, lines: [...] } } }

    When dola_join is provided, each line gets a full dolaMatch (mills when safe).
    Without it, dolaMatch is method=none (unit tests / structural-only runs).
    """
    template: str = mapping["levyAspxTemplate"]

    resolved_tax_year = tax_year or _tax_year_from_rows(rows)

    by_tag: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        tag_id = _strip(row.get("taxAreaId", ""))
        if not tag_id:
            continue
        by_tag[tag_id].append(row)

    stacks: dict[str, Any] = {}
    for tag_id, tag_rows in sorted(by_tag.items()):
        lines_collapsed = _collapse_levy_lines(tag_rows)
        lines_sorted = sorted(
            lines_collapsed, key=lambda r: _sort_line_code(_strip(r.get("lineCode", "")))
        )
        built_lines = []
        for ln in lines_sorted:
            code = _strip(ln.get("lineCode", ""))
            authority = _strip(ln.get("authorityName", ""))
            if dola_join is not None:
                dola_match = dola_join.match_line(code, authority)
            else:
                dola_match = {"method": "none", "confidence": "low"}
            mill_raw = ln.get("millLevy")
            if mill_raw is not None and mill_raw != "":
                try:
                    mill_val = float(mill_raw)
                except (TypeError, ValueError):
                    mill_val = None
                if mill_val is not None:
                    dola_match = dict(dola_match)
                    prev_mills = dola_match.get("mills")
                    dola_match["mills"] = mill_val
                    if isinstance(prev_mills, (int, float)) and abs(
                        float(prev_mills) - mill_val
                    ) > 1e-6:
                        dola_match["dolaMills"] = round(float(prev_mills), 6)
                        dola_match["millsReason"] = "county_levy_table_override"
                    elif dola_match.get("method") == "none" and not dola_match.get(
                        "millsReason"
                    ):
                        dola_match["millsReason"] = "published_mill_levy_table"
            built_lines.append({
                "code": code,
                "authorityName": authority,
                "effectiveYear": _strip(ln.get("effectiveYear", "")) or None,
                "status": _strip(ln.get("status", "")) or None,
                "dolaMatch": dola_match,
            })
        levy_url = template.replace("{taxAreaId}", tag_id)
        stacks[tag_id] = {
            "tagId": tag_id,
            "taxYear": resolved_tax_year,
            "levyAspxUrl": levy_url,
            "lines": built_lines,
        }

    snapshot: dict[str, Any] = {
        "bundledAsOf": _normalize_bundled_as_of(bundled_as_of),
        "source": f"new ingest (mapping: {mapping.get('county', 'unknown')})",
        "taxYear": resolved_tax_year,
    }
    if dola_join is not None:
        snapshot.update(dola_join.snapshot_fields())
    return {"snapshot": snapshot, "stacksByTagId": stacks}


# -----------------------------------------------------------------------
# Account map
# -----------------------------------------------------------------------

def build_account_map_json(
    rows: list[dict[str, Any]],
    mapping: dict[str, Any],
    *,
    bundled_as_of: str,
    tax_year: str | None = None,
) -> dict[str, Any]:
    """
    Convert account intermediate records to the app JSON shape.

    Output matches arapahoe-pin-to-tag.json:
      { snapshot: {...}, pinDigits: int, byPin: { accountId: { tagId, tagShortDescr, ... } } }
    """
    pin_digits: int = int(mapping["identifierDigits"])

    by_pin: dict[str, dict[str, Any]] = {}
    for row in rows:
        account_id = _normalize_account_id(row.get("accountId", ""), pin_digits)
        if not account_id:
            continue
        if account_id in by_pin:
            # Keep first row; fill in ain from later rows if missing (mirrors old script)
            existing = by_pin[account_id]
            if not existing.get("ain") and row.get("ain"):
                existing["ain"] = row["ain"]
            continue

        pin_row: dict[str, Any] = {
            "tagId": _strip(row.get("taxAreaId", "")),
            "tagShortDescr": _strip(row.get("tagShortDescr", "")) or "",
        }
        if row.get("totalActual") is not None:
            pin_row["totalActual"] = row["totalActual"]
        if row.get("totalAssessed") is not None:
            pin_row["totalAssessed"] = row["totalAssessed"]
        if row.get("parcelTaxYear"):
            pin_row["parcelTaxYear"] = row["parcelTaxYear"]
        if row.get("assessmentYear"):
            pin_row["assessmentYear"] = row["assessmentYear"]
        if row.get("propertyClassDescr"):
            pin_row["propertyClassDescr"] = row["propertyClassDescr"]
        if row.get("ownerList"):
            pin_row["ownerList"] = row["ownerList"]
        if row.get("ain"):
            pin_row["ain"] = row["ain"]

        by_pin[account_id] = pin_row

    snapshot: dict[str, Any] = {
        "bundledAsOf": _normalize_bundled_as_of(bundled_as_of),
        "source": f"new ingest (mapping: {mapping.get('county', 'unknown')})",
        "taxYear": tax_year or None,
    }
    return {
        "snapshot": snapshot,
        "pinDigits": pin_digits,
        "byPin": by_pin,
    }


# -----------------------------------------------------------------------
# Comparison directory writer
# -----------------------------------------------------------------------

def write_comparison_dir(
    out_dir: Path,
    *,
    stack_rows: list[dict[str, Any]],
    account_rows: list[dict[str, Any]],
    mapping: dict[str, Any],
    bundled_as_of: str,
    tax_year: str | None = None,
    dola_join: DolaJoinContext | None = None,
    situs_map: dict[str, list[dict[str, str]]] | None = None,
    parcel_record_map: dict[str, dict[str, Any]] | None = None,
    sibling_paths: dict[str, Path | None] | None = None,
    skip_neighborhood: bool = False,
    gis_parcels_gdb: Path | None = None,
    skip_situs_shards: bool = False,
) -> None:
    """
    Write levy stacks + account map (+ optional situs/shards) to out_dir.

    Comparison builds use supporting-data/_ingest-out/. Ship-from-new builds
    into supporting-data/_ingest-ship-staging/ then lands via ship_land.py.
    Refuses paths under public/ (including public/data/).
    """
    validate_out_dir(out_dir, ship=False)
    out_dir.mkdir(parents=True, exist_ok=True)

    sep = (",", ":")
    pin_digits = int(mapping.get("identifierDigits", 9))
    bundled_norm = _normalize_bundled_as_of(bundled_as_of)

    resolved_tax_year = tax_year or _tax_year_from_rows(stack_rows)
    stacks = build_levy_stacks_json(
        stack_rows,
        mapping,
        bundled_as_of=bundled_as_of,
        tax_year=resolved_tax_year,
        dola_join=dola_join,
    )
    used_tax_area_ids = {
        _strip(row.get("taxAreaId", ""))
        for row in account_rows
        if _strip(row.get("taxAreaId", ""))
    }
    if used_tax_area_ids:
        stacks["stacksByTagId"] = {
            k: v for k, v in stacks["stacksByTagId"].items() if k in used_tax_area_ids
        }

    stacks_path = out_dir / county_data_basename(mapping, "levy-stacks-by-tag-id.json")
    stacks_path.write_text(json.dumps(stacks, separators=sep), encoding="utf-8")

    account_map = build_account_map_json(
        account_rows, mapping, bundled_as_of=bundled_as_of, tax_year=resolved_tax_year
    )
    account_path = out_dir / county_data_basename(mapping, "pin-to-tag.json")
    account_path.write_text(json.dumps(account_map, separators=sep), encoding="utf-8")

    if skip_situs_shards:
        return

    if situs_map is not None:
        county_name = mapping.get("county", "unknown")
        if (mapping.get("accountMap") or {}).get("valuesFile"):
            situs_source = f"new ingest (mapping: {county_name}; location situs)"
        else:
            situs_source = f"new ingest (mapping: {county_name}; Main Parcel situs)"
        situs_payload = build_situs_json(
            situs_map,
            bundled_as_of=bundled_norm,
            tax_year=resolved_tax_year,
            source=situs_source,
        )
        situs_path = out_dir / county_data_basename(mapping, "situs-to-pins.json")
        situs_path.write_text(json.dumps(situs_payload, separators=sep), encoding="utf-8")

    if parcel_record_map is None:
        return

    paths = sibling_paths or {}
    gdb = None if skip_neighborhood else gis_parcels_gdb
    if not skip_neighborhood and (gdb is None or not gdb.exists()):
        missing = "not configured (mapping defaultPaths.gisParcelsGdb / --gis-parcels-gdb)" if gdb is None else str(gdb)
        raise ValueError(
            f"Missing Open GIS Parcels GDB: {missing}\n"
            "Download the Parcels layer from https://gis.arapahoegov.com/datadownload/, "
            "or pass --skip-neighborhood to build shards without neighborhood fields."
        )

    join_counts = enrich_parcel_record_from_sibling_marts(
        parcel_record_map,
        mapping,
        legal_descriptions_path=paths.get("legalDescriptions"),
        legal_parties_path=paths.get("legalParties"),
        land_path=paths.get("land"),
        building_path=paths.get("building"),
        building_xfob_path=paths.get("buildingXfob"),
        transfers_path=paths.get("transfers"),
        permits_path=paths.get("permits"),
        state_class_xlsx_path=paths.get("stateClassXlsx"),
        nbhd_xlsx_path=paths.get("nbhdXlsx"),
        gis_parcels_gdb_path=gdb,
        ownership_path=paths.get("ownership"),
        subdivision_path=paths.get("subdivision"),
        values_path=paths.get("values"),
        filing_path=paths.get("filing"),
        parcels_csv_path=paths.get("parcelsCsv"),
    )
    if not skip_neighborhood and not join_counts.get("neighborhood"):
        raise ValueError(
            f"Open GIS Parcels GDB joined 0 neighborhoods: {gdb}\n"
            "Check the layer name and PIN / Neighborhood_Code columns, "
            "or pass --skip-neighborhood to build shards without neighborhood fields."
        )
    if any(join_counts.values()):
        print(
            "Parcel record sibling joins: "
            + ", ".join(f"{k}={v}" for k, v in join_counts.items() if v),
            file=sys.stderr,
        )

    county_name = mapping.get("county", "unknown")
    if (mapping.get("accountMap") or {}).get("valuesFile"):
        parcel_source = (
            f"new ingest (mapping: {county_name}; "
            "location + values + ownership/improvements/subdivision/sales/filing"
        )
    else:
        parcel_source = (
            f"new ingest (mapping: {county_name}; "
            "Main Parcel + sibling mart tables"
        )
    if join_counts.get("neighborhood"):
        parcel_source += " + Open GIS Assessor Parcels (neighborhood)"
    parcel_source += f"; sharded by {PARCEL_RECORD_SHARD_PREFIX_LEN}-char account prefix)"
    parcel_snapshot: dict[str, Any] = {
        "bundledAsOf": bundled_norm,
        "source": parcel_source,
        "taxYear": resolved_tax_year,
    }
    if join_counts.get("neighborhood") and gdb is not None:
        gis_as_of = read_gis_parcels_data_as_of(gdb)
        if gis_as_of:
            parcel_snapshot["gisParcelsAsOf"] = gis_as_of

    write_parcel_record_shards(
        out_dir,
        parcel_record_map,
        parcel_snapshot,
        pin_digits=pin_digits,
        county_id=_strip(mapping.get("county", "")) or "county",
        separators=sep,
    )
