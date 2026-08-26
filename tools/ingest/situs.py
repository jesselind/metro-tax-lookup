#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Situs lookup key / label helpers for the new ingest.

Street dir/type tokens must stay in sync with src/lib/arapahoeSitusLookup.ts.
Shared code uses logical field names (sa_addr_number, …) after mapping resolve.
``lookupVersion`` comes from tools/situs_lookup_contract.py (shared with the
shipping rebuild; not an engine id).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

_TOOLS_DIR = Path(__file__).resolve().parent.parent
if str(_TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(_TOOLS_DIR))

from situs_lookup_contract import SITUS_LOOKUP_VERSION  # noqa: E402

# Keep in sync with STREET_DIR_TOKENS / STREET_TYPE_TOKENS in arapahoeSitusLookup.ts
# and the frozen sets in the old Arapahoe rebuild script (do not import that script).
STREET_DIR_TOKENS = frozenset(
    {
        "N",
        "S",
        "E",
        "W",
        "NE",
        "NW",
        "SE",
        "SW",
        "NORTH",
        "SOUTH",
        "EAST",
        "WEST",
        "NORTHEAST",
        "NORTHWEST",
        "SOUTHEAST",
        "SOUTHWEST",
    }
)
STREET_TYPE_TOKENS = frozenset(
    {
        "ST",
        "STREET",
        "AVE",
        "AVENUE",
        "RD",
        "ROAD",
        "BLVD",
        "BOULEVARD",
        "DR",
        "DRIVE",
        "LN",
        "LANE",
        "CT",
        "COURT",
        "CIR",
        "CIRCLE",
        "WAY",
        "PL",
        "PLACE",
        "PKWY",
        "PARKWAY",
        "TRL",
        "TRAIL",
        "LOOP",
        "TER",
        "TERR",
        "TERRACE",
        "TPKE",
        "TURNPIKE",
        "HWY",
        "HIGHWAY",
        "BL",
        "PATH",
        "PLZ",
        "PLAZA",
        "RUN",
        "COVE",
        "PASS",
        "ALLEY",
        "ALY",
        "BEND",
        "XING",
        "CROSSING",
        "POINT",
        "PT",
        "COMMONS",
        "MALL",
    }
)


def _strip(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def normalize_street_name_key(raw: str) -> str:
    """County address search omits directionals and street types; mirror that on mart situs."""
    s = _strip(raw).upper()
    if not s:
        return ""
    tokens = [t for t in re.split(r"[^\w]+", s) if t]
    kept: list[str] = []
    for t in tokens:
        if t in STREET_DIR_TOKENS or t in STREET_TYPE_TOKENS:
            continue
        kept.append(t)
    return " ".join(kept)


def normalize_street_number_key(primary: str, range_or_suffix: str) -> str:
    """Merge street number + optional range/suffix (e.g. 1/2); sync with arapahoeSitusLookup.ts."""
    a = _strip(primary)
    b = _strip(range_or_suffix)
    merged = " ".join(x for x in (a, b) if x)
    if not merged:
        return ""
    merged_u = merged.upper().replace(" ", "")
    return "".join(c for c in merged_u if c.isdigit() or c in "/-")


def normalize_unit_key(raw: str) -> str:
    """Uppercase unit string with non-alphanumerics removed (situs lookup)."""
    s = _strip(raw).upper()
    if not s:
        return ""
    return re.sub(r"[^A-Z0-9]", "", s)


def row_situs_lookup_key(row: dict[str, str]) -> str | None:
    """Stable num|name|unit key from logical situs fields, or None if unusable."""
    num = normalize_street_number_key(
        row.get("sa_addr_number", ""),
        row.get("sa_street_number_sfx", ""),
    )
    name = normalize_street_name_key(row.get("sa_street_name", ""))
    unit = normalize_unit_key(row.get("sa_unit_number", ""))
    if not num or not name:
        return None
    # Skip common placeholder situs rows in the mart (not useful for address search).
    if _strip(row.get("sa_addr_number", "")) == "0":
        return None
    if "TAG" in _strip(row.get("sa_street_name", "")).upper():
        return None
    return f"{num}|{name}|{unit}"


def format_situs_locality(city: str, state: str, postal: str) -> str:
    """City / state / ZIP last line for situs labels (postage-style)."""
    city_s = _strip(city)
    state_s = _strip(state)
    postal_s = _strip(postal)
    if city_s and not state_s:
        state_s = "CO"
    if city_s and postal_s:
        return f"{city_s}, {state_s} {postal_s}".strip()
    if city_s and state_s:
        return f"{city_s}, {state_s}"
    if city_s:
        return city_s
    return " ".join(x for x in (state_s, postal_s) if x)


def _normalize_postal_for_label(postal: str) -> str:
    """Nine-digit numeric ``sa_postal_cd`` (ZIP + +4 digits) → five-digit ZIP in labels."""
    s = _strip(postal)
    if len(s) == 9 and s.isdigit():
        return s[:5]
    return s


def format_situs_label(row: dict[str, str]) -> str:
    """Human-readable situs line for UI labels (falls back to PIN)."""
    n = _strip(row.get("sa_addr_number", ""))
    pre = _strip(row.get("sa_predirectional", ""))
    name = _strip(row.get("sa_street_name", ""))
    typ = _strip(row.get("sa_street_type", ""))
    post = _strip(row.get("sa_postdirectional", ""))
    unit = _strip(row.get("sa_unit_number", ""))
    line1 = " ".join(x for x in (n, pre, name, typ, post) if x)
    if unit:
        line1 = f"{line1} Unit {unit}".strip()
    locality = format_situs_locality(
        row.get("sa_city", ""),
        row.get("sa_state", ""),
        _normalize_postal_for_label(row.get("sa_postal_cd", "")),
    )
    if locality:
        return f"{line1}, {locality}".strip() if line1 else locality
    return line1 or _strip(row.get("pin", ""))


def accumulate_situs_row(
    by_key: dict[str, dict[str, str]],
    row: dict[str, str],
    pin: str,
) -> None:
    """Add ``pin`` → postage-style label under the situs lookup key when present."""
    lk = row_situs_lookup_key(row)
    if not lk:
        return
    label = format_situs_label(row)
    if lk not in by_key:
        by_key[lk] = {}
    if pin not in by_key[lk]:
        by_key[lk][pin] = label


def merge_aggregate_situs_keys(
    by_key: dict[str, list[dict[str, str]]],
) -> dict[str, list[dict[str, str]]]:
    """
    Add num|name| keys that union every pin from num|name|* so unit can stay optional
    (county treats Unit as optional).
    """
    parent_pins: dict[str, dict[str, str]] = {}
    for k, items in by_key.items():
        parts = k.split("|")
        if len(parts) != 3:
            continue
        num, name, _unit = parts
        if not num or not name:
            continue
        parent = f"{num}|{name}|"
        bucket = parent_pins.setdefault(parent, {})
        for it in items:
            pin = it.get("pin", "")
            if pin and pin not in bucket:
                bucket[pin] = it.get("label", "")
    merged = dict(by_key)
    for parent, pmap in parent_pins.items():
        agg_list = [{"pin": p, "label": pmap[p]} for p in sorted(pmap.keys())]
        if parent not in merged:
            merged[parent] = agg_list
        else:
            combined: dict[str, str] = {x["pin"]: x["label"] for x in merged[parent]}
            for it in agg_list:
                combined.setdefault(it["pin"], it["label"])
            merged[parent] = [
                {"pin": p, "label": combined[p]} for p in sorted(combined.keys())
            ]
    return merged


def finalize_situs_map(
    situs_by_key: dict[str, dict[str, str]],
) -> dict[str, list[dict[str, str]]]:
    """Convert pin→label buckets to sorted lists, then merge unit-optional parent keys."""
    situs_out: dict[str, list[dict[str, str]]] = {}
    for k, pin_labels in situs_by_key.items():
        items = [{"pin": p, "label": pin_labels[p]} for p in sorted(pin_labels.keys())]
        situs_out[k] = items
    return merge_aggregate_situs_keys(situs_out)


def build_situs_json(
    situs_map: dict[str, list[dict[str, str]]],
    *,
    bundled_as_of: str,
    tax_year: str | None,
    source: str,
) -> dict[str, Any]:
    """App JSON shape for arapahoe-situs-to-pins.json (lookupVersion 2)."""
    return {
        "snapshot": {
            "bundledAsOf": bundled_as_of,
            "source": source,
            "taxYear": tax_year,
            "lookupNote": (
                "Keys match county address search rules: street number (+ optional range/suffix), "
                "street name without directionals (N,S,E,W,...) or types (St,Ave,...); optional unit. "
                "Situs labels include city, state, and postal code (postage last line)."
            ),
        },
        "lookupVersion": SITUS_LOOKUP_VERSION,
        "entryCount": len(situs_map),
        "byKey": situs_map,
    }
