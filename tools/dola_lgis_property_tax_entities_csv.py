# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
Shared helpers for DOLA LGIS Property Tax Entities CSV exports.

These files often use colon-suffixed headers (e.g. "DOLA Tax Entity Name:") and
Tax Entity IDs like 66469/1. Used by build_district_directory_from_lg_export.py
and kept separate from the index-based parser in build_arapahoe_parcel_levy_index.py
so both can share the same certifying-county filter and LGID key rules.
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path


def normalize_csv_header_label(h: object) -> str:
    """Strip UTF-8 BOM, colon suffix, and outer whitespace from a DictReader header."""
    if h is None:
        return ""
    return str(h).lstrip("\ufeff").rstrip(":").strip()


def normalize_csv_row_keys(row: dict[str, str]) -> dict[str, str]:
    """Strip colon-suffixed DictReader headers; skip None keys (overflow cells)."""
    out: dict[str, str] = {}
    for k, v in row.items():
        if k is None:
            continue
        ks = normalize_csv_header_label(k)
        if not ks:
            continue
        out[ks] = (v or "").strip() if v is not None else ""
    return out


def normalize_lg_id_key(raw: str) -> str | None:
    """Match JS padLgId: 5-digit key from digits in raw (e.g. tax entity id left segment)."""
    digits = "".join(c for c in raw if c.isdigit())
    if not digits:
        return None
    if len(digits) >= 6:
        return digits[:5]
    return digits.zfill(5)


def load_lgid_to_entity_name_for_certifying_county(
    path: Path,
    certifying_county: str,
) -> tuple[dict[str, str], bool]:
    """
    Map normalized LGID (5 digits) to DOLA tax entity legal name for one certifying county.

    First matching row wins when multiple tax entities share one LGID prefix (rare).

    Returns (name_by_lg_id, county_filter_applied). The bool is True only when the CSV
    has a Certifying County column and rows were filtered by certifying_county.
    """
    if not path.is_file():
        return {}, False
    want = certifying_county.strip().upper()
    if not want:
        return {}, False

    out: dict[str, str] = {}
    try:
        csv.field_size_limit(sys.maxsize)
    except OverflowError:
        csv.field_size_limit(10_000_000)

    with path.open(newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or ()
        norm_headers = {
            nh for h in fieldnames if (nh := normalize_csv_header_label(h))
        }
        if "Certifying County" not in norm_headers:
            print(
                "Property Tax Entities CSV: no Certifying County column; "
                "skipping LGID name fallback (would otherwise match zero rows).",
                file=sys.stderr,
            )
            return {}, False

        for raw in reader:
            nr = normalize_csv_row_keys(raw)
            county = (nr.get("Certifying County") or "").strip().upper()
            if county != want:
                continue
            te = (nr.get("Tax Entity ID") or "").strip()
            if not te:
                continue
            left = te.split("/", 1)[0].strip()
            if not left.isdigit():
                continue
            nid = normalize_lg_id_key(left)
            if not nid:
                continue
            name = (nr.get("DOLA Tax Entity Name") or "").strip()
            if not name:
                continue
            out.setdefault(nid, name)
    return out, True
