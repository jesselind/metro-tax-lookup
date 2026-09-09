#!/usr/bin/env python3
# Metro Tax Lookup
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
Build Douglas metro purpose-row JSON from the Abstract of Assessment tax-rates
CSV (page 2) plus DOLA Property Tax Entities (certifying county Douglas).

Output shape matches Arapahoe `metro-levies-*.json` (`LevyDataFile`) so the app
can load by resolved county. Mill rates in JSON are decimal (mills / 1000),
same as Arapahoe Public Info extracts.

The PDF "Tax Rate" column is mills/10 (verified: revenue/assessed*1000 ≈ rate*10
and matches DOLA totals). Prefer mills from revenue/assessed when both are
positive; else tax_rate_mills * 10.

Debt often appears as a separate abstract name ("… Debt Service"). Those rows
fold onto the parent ops district when the parent name is recoverable.

LG ID: exact normalized-name match to Douglas DOLA entities (Tax Entity ID
prefix). Districts without a unique LG ID are omitted (fail closed — stack
match is LG ID only).

Usage (from project root):

  python3 tools/build_douglas_metro_levies.py \\
    --csv supporting-data/douglas/2025-abstract-tax-rates-and-revenues.csv \\
    --dola supporting-data/dola/property-tax-entities-export.csv \\
    --out public/data/douglas-metro-levies-2026.json
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any


SECTION_METRO = "METROPOLITAN DISTRICTS"

# Expand abstract abbreviations before DOLA name normalize.
_ABBREV = (
    (re.compile(r"\bCOMM\b", re.I), "COMMUNITY"),
    (re.compile(r"\bBUS\b", re.I), "BUSINESS"),
    (re.compile(r"\bDIST\b", re.I), "DISTRICT"),
    (re.compile(r"\bIMPROV\b", re.I), "IMPROVEMENT"),
    (re.compile(r"\bIMP\b", re.I), "IMPROVEMENT"),
    (re.compile(r"\bSVC\b", re.I), "SERVICE"),
    (re.compile(r"\bW\s*&\s*S\b", re.I), "WATER AND SANITATION"),
)


def expand_abbreviations(name: str) -> str:
    out = name
    for pat, repl in _ABBREV:
        out = pat.sub(repl, out)
    # "Cherry Creek S " → "Cherry Creek South "
    out = re.sub(r"\bS\b(?=\s+Metro)", "South", out, flags=re.I)
    return out


def normalize_entity_name(name: str) -> str:
    s = expand_abbreviations(name or "").upper()
    s = re.sub(r"[^A-Z0-9]+", " ", s)
    for w in (
        "METROPOLITAN",
        "METRO",
        "DISTRICT",
        "DIST",
        "NO",
        "NUMBER",
        "THE",
        "OF",
        "AND",
    ):
        s = re.sub(rf"\b{w}\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def strip_debt_parent_name(name: str) -> str:
    n = name.strip()
    n = re.sub(r"\s+-\s+Consol\s+Debt\s+Svc(?:\s+\d+)?\s*$", "", n, flags=re.I)
    n = re.sub(r"\s+Debt\s+Service(?:\s+\d+)?\s*$", "", n, flags=re.I)
    n = re.sub(r"\s+Debt\s+Svc(?:\s+\d+)?\s*$", "", n, flags=re.I)
    return n.strip()


def mills_from_abstract_row(row: dict[str, str]) -> float:
    """True mills for one abstract row (not decimal rate)."""
    try:
        assessed = float(row.get("assessed_value") or 0)
        revenue = float(row.get("revenue") or 0)
        rate = float(row.get("tax_rate_mills") or 0)
    except ValueError:
        return 0.0
    if assessed > 0 and revenue > 0:
        return revenue / assessed * 1000.0
    # PDF Tax Rate column is mills/10.
    return rate * 10.0


def purpose_category(name_kind: str) -> str:
    if name_kind == "debt_service":
        return "debt_service"
    if name_kind == "general_or_ops":
        return "operations"
    return "other"


def purpose_raw(name_kind: str, name: str) -> str:
    if name_kind == "debt_service":
        return "Debt Service"
    if name_kind == "general_or_ops":
        return "General Operating"
    if name_kind == "subdistrict":
        return "Subdistrict"
    if name_kind == "judgment":
        return "Judgment"
    return name


def load_douglas_dola_by_norm(path: Path) -> dict[str, list[tuple[str, str]]]:
    """norm name → list of (lgId digits, legal name). Prefer /1 entities for ops."""
    by_norm: dict[str, list[tuple[str, str]]] = defaultdict(list)
    with path.open(newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            county = (row.get("Certifying County:") or "").strip().upper()
            if county != "DOUGLAS":
                continue
            te = (row.get("Tax Entity ID:") or "").strip()
            if not te:
                continue
            lg = te.split("/")[0].strip()
            lg_digits = re.sub(r"\D", "", lg)
            if not lg_digits:
                continue
            legal = (row.get("DOLA Tax Entity Name:") or "").strip()
            if not legal:
                continue
            # Skip standalone debt TE rows for LG join of parent ops names;
            # debt mills come from the abstract debt name_kind rows.
            if re.search(r"\bdebt\b", legal, re.I):
                continue
            by_norm[normalize_entity_name(legal)].append((lg_digits, legal))
    return by_norm


def unique_lgid(
    by_norm: dict[str, list[tuple[str, str]]], name: str
) -> tuple[str, str] | None:
    hits = by_norm.get(normalize_entity_name(name)) or []
    # Deduplicate by lgId
    by_lg: dict[str, str] = {}
    for lg, legal in hits:
        by_lg.setdefault(lg, legal)
    if len(by_lg) != 1:
        return None
    lg, legal = next(iter(by_lg.items()))
    return lg, legal


def build_districts(
    csv_path: Path, dola_path: Path
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    by_norm = load_douglas_dola_by_norm(dola_path)
    groups: dict[str, dict[str, list[dict[str, str]]]] = defaultdict(
        lambda: {"ops": [], "debt": [], "other": []}
    )

    with csv_path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if (row.get("section") or "").strip() != SECTION_METRO:
                continue
            kind = (row.get("name_kind") or "").strip()
            name = (row.get("name") or "").strip()
            if not name:
                continue
            if kind == "general_or_ops":
                groups[name]["ops"].append(row)
            elif kind == "debt_service":
                parent = strip_debt_parent_name(name)
                groups[parent]["debt"].append(row)
            else:
                groups[name]["other"].append(row)

    districts: list[dict[str, Any]] = []
    matched = 0
    skipped_no_lgid = 0
    skipped_empty = 0
    multi_lgid = 0

    for parent_name, bunches in sorted(groups.items(), key=lambda x: x[0].lower()):
        rows_for_levies: list[tuple[str, dict[str, str]]] = []
        for r in bunches["ops"]:
            rows_for_levies.append(("general_or_ops", r))
        for r in bunches["debt"]:
            rows_for_levies.append(("debt_service", r))
        for r in bunches["other"]:
            rows_for_levies.append((r.get("name_kind") or "other", r))

        if not rows_for_levies:
            skipped_empty += 1
            continue

        # Prefer ops/other name for LG join; debt-only groups use stripped parent.
        join_name = parent_name
        if bunches["ops"]:
            join_name = bunches["ops"][0]["name"]
        elif bunches["other"]:
            join_name = bunches["other"][0]["name"]

        resolved = unique_lgid(by_norm, join_name)
        if resolved is None:
            # Count multi vs miss
            hits = by_norm.get(normalize_entity_name(join_name)) or []
            if len({lg for lg, _ in hits}) > 1:
                multi_lgid += 1
            else:
                skipped_no_lgid += 1
            continue

        lg_digits, legal = resolved
        lgid = lg_digits.zfill(5)
        matched += 1

        levies: list[dict[str, Any]] = []
        ops_m = debt_m = other_m = 0.0
        for idx, (kind, row) in enumerate(rows_for_levies):
            mills = mills_from_abstract_row(row)
            rate = mills / 1000.0
            cat = purpose_category(kind)
            if cat == "operations":
                ops_m += rate
            elif cat == "debt_service":
                debt_m += rate
            else:
                other_m += rate
            levies.append(
                {
                    "purposeRaw": purpose_raw(kind, row.get("name") or parent_name),
                    "purposeCategory": cat,
                    "rateMillsCurrent": round(rate, 10),
                    "rateMillsPrevious": None,
                    "taborExempt": None,
                    "rawRowIndex": idx,
                }
            )

        districts.append(
            {
                "districtId": f"douglas-{lgid}-0",
                "countyId": "",
                "lgid": lgid,
                "subdistrict": None,
                "name": legal,
                "type": "metro",
                "levies": levies,
                "aggregates": {
                    "opsMills": round(ops_m, 10),
                    "debtMills": round(debt_m, 10),
                    "otherMills": round(other_m, 10),
                    "totalMills": round(ops_m + debt_m + other_m, 10),
                    "audit": {
                        "abstractParentName": parent_name,
                        "levyRowCount": len(levies),
                    },
                },
            }
        )

    meta = {
        "matchedDistricts": matched,
        "skippedNoLgid": skipped_no_lgid,
        "skippedMultiLgid": multi_lgid,
        "skippedEmpty": skipped_empty,
        "groupCount": len(groups),
    }
    districts.sort(key=lambda d: d["name"].lower())
    return districts, meta


def build_file(
    csv_path: Path,
    dola_path: Path,
    *,
    bundled_as_of: str | None = None,
) -> dict[str, Any]:
    districts, meta = build_districts(csv_path, dola_path)
    return {
        "year": 2026,
        "snapshot": {
            "bundledAsOf": bundled_as_of or date.today().isoformat(),
        },
        "source": {
            "type": "douglas_abstract_tax_rates",
            "title": "2025 Tax Rates and Revenues (Abstract of Assessment, page 2)",
            "file": str(csv_path).replace("\\", "/"),
            "residentUrl": (
                "https://www.douglasco.gov/documents/current-abstract-of-assessment.pdf/"
            ),
            "hubUrl": "https://www.douglasco.gov/assessor/taxing-authorities/",
            "dolaFile": str(dola_path).replace("\\", "/"),
            "buildMeta": meta,
        },
        "schema": {
            "notes": (
                "Douglas metro purpose rows from abstract CSV; LG ID from DOLA "
                "Douglas certifying-county entities. Rates are mills/1000. "
                "No prior-year purpose mills in this source."
            ),
        },
        "districts": districts,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--csv",
        type=Path,
        default=Path(
            "supporting-data/douglas/2025-abstract-tax-rates-and-revenues.csv"
        ),
    )
    parser.add_argument(
        "--dola",
        type=Path,
        default=Path("supporting-data/dola/property-tax-entities-export.csv"),
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("public/data/douglas-metro-levies-2026.json"),
    )
    parser.add_argument(
        "--bundled-as-of",
        default=None,
        help="ISO date for snapshot.bundledAsOf (default: today)",
    )
    args = parser.parse_args()
    if not args.csv.is_file():
        raise SystemExit(f"missing CSV: {args.csv}")
    if not args.dola.is_file():
        raise SystemExit(f"missing DOLA export: {args.dola}")

    payload = build_file(args.csv, args.dola, bundled_as_of=args.bundled_as_of)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    meta = payload["source"]["buildMeta"]
    print(
        f"Wrote {args.out} districts={len(payload['districts'])} "
        f"matched={meta['matchedDistricts']} "
        f"skippedNoLgid={meta['skippedNoLgid']} "
        f"skippedMultiLgid={meta['skippedMultiLgid']}"
    )


if __name__ == "__main__":
    main()
