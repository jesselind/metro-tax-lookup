#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""JSON writer for the new ingest.

Converts intermediate records (from reader.py) into the app JSON shapes defined
by the Phase 1 contract (arapahoeParcelLevyData.ts). Writes only to the
comparison directory; never touches public/data/.

Usage:
  from ingest.writer import build_levy_stacks_json, build_account_map_json, write_comparison_dir
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from ingest.classify import path_is_under_public


# -----------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------

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
) -> dict[str, Any]:
    """
    Convert levy stack intermediate records to the app JSON shape.

    Output matches arapahoe-levy-stacks-by-tag-id.json:
      { snapshot: {...}, stacksByTagId: { tagId: { tagId, taxYear, levyAspxUrl, lines: [...] } } }

    dolaMatch is always method=none/confidence=low (Phase 4 does not run DOLA matching;
    that is acceptable for the comparison since the old script's dolaMatch is a non-structural
    enrichment and will be the subject of a noted difference).
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
            built_lines.append({
                "code": _strip(ln.get("lineCode", "")),
                "authorityName": _strip(ln.get("authorityName", "")),
                "effectiveYear": _strip(ln.get("effectiveYear", "")) or None,
                "status": _strip(ln.get("status", "")) or None,
                "dolaMatch": {"method": "none", "confidence": "low"},
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

def _refuse_public(out_dir: Path) -> None:
    if path_is_under_public(out_dir):
        raise ValueError(
            f"Refusing to write to {out_dir} — path is inside public/. "
            "Use a comparison directory (e.g. supporting-data/_ingest-out/)."
        )


def write_comparison_dir(
    out_dir: Path,
    *,
    stack_rows: list[dict[str, Any]],
    account_rows: list[dict[str, Any]],
    mapping: dict[str, Any],
    bundled_as_of: str,
    tax_year: str | None = None,
) -> None:
    """
    Write levy stacks + account map JSON to out_dir (comparison only; never public/).

    The filenames intentionally match the shipping filenames so a diff tool can
    compare this directory directly to public/data/.
    """
    _refuse_public(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    sep = (",", ":")

    resolved_tax_year = tax_year or _tax_year_from_rows(stack_rows)
    stacks = build_levy_stacks_json(
        stack_rows, mapping, bundled_as_of=bundled_as_of, tax_year=resolved_tax_year
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

    stacks_path = out_dir / "arapahoe-levy-stacks-by-tag-id.json"
    stacks_path.write_text(json.dumps(stacks, separators=sep), encoding="utf-8")

    account_map = build_account_map_json(
        account_rows, mapping, bundled_as_of=bundled_as_of, tax_year=resolved_tax_year
    )
    account_path = out_dir / "arapahoe-pin-to-tag.json"
    account_path.write_text(json.dumps(account_map, separators=sep), encoding="utf-8")
