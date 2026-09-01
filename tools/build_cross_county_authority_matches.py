#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
Build cross-county authority match file from DOLA tax entities + bundled levy stacks.

Joins wired counties on DOLA Tax Entity ID (same entity, different certifying county
rows), then maps each county's stack AUTH code via ingest dolaMatch when present or
fuzzy name match against that county's DOLA rows. Applies curated overrides from
tools/cross_county_authority_overrides.json last.

Maintainer output only (not loaded by the app). Curated registry rows in
public/data/cross-county-authority-registry.json are hand-picked from **complete**
match rows (see matchStatus).

Usage (repo root):
  python3 tools/build_cross_county_authority_matches.py
  python3 tools/build_cross_county_authority_matches.py --stdout
  python3 tools/build_cross_county_authority_matches.py --only-complete
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

_TOOLS = Path(__file__).resolve().parent
_REPO = _TOOLS.parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))

from ingest.dola_match import (  # noqa: E402
    DEFAULT_DOLA_CSV,
    DEFAULT_OVERRIDES,
    _coalesce_lg_id_from_entity,
    _te_id_str,
    load_overrides,
    match_dola_line,
    parse_levy_mills_cell,
    strip_field,
)

DEFAULT_OUTPUT = _TOOLS / "cross-county-authority-matches.json"
DEFAULT_WIRED_COUNTIES = _TOOLS / "wired-counties.json"
DEFAULT_CROSS_COUNTY_OVERRIDES = _TOOLS / "cross_county_authority_overrides.json"

MatchStatus = Literal["complete", "partial", "dola_only"]


@dataclass(frozen=True)
class StackLineMatch:
    levy_line_code: str
    authority_name: str
    match_method: str
    match_confidence: str | None
    match_score: float | None


def load_wired_counties(path: Path) -> list[dict[str, str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    counties = data.get("counties")
    if not isinstance(counties, list) or not counties:
        raise ValueError(f"{path}: counties must be a non-empty array")
    out: list[dict[str, str]] = []
    seen: set[str] = set()
    for row in counties:
        if not isinstance(row, dict):
            raise ValueError(f"{path}: each county must be an object")
        county_id = strip_field(str(row.get("id") or ""))
        dola_certifying = strip_field(str(row.get("dolaCertifyingCounty") or ""))
        if not county_id or not dola_certifying:
            raise ValueError(f"{path}: each county needs id and dolaCertifyingCounty")
        if county_id in seen:
            raise ValueError(f"{path}: duplicate county id {county_id}")
        seen.add(county_id)
        out.append({"id": county_id, "dolaCertifyingCounty": dola_certifying})
    return out


def load_cross_county_overrides(path: Path) -> dict[str, dict[str, Any]]:
    if not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    raw = data.get("byTaxEntityId") or {}
    if not isinstance(raw, dict):
        raise ValueError(f"{path}: byTaxEntityId must be an object")
    out: dict[str, dict[str, Any]] = {}
    for te_key, row in raw.items():
        te_id = _te_id_str(te_key)
        if not te_id or not isinstance(row, dict):
            continue
        codes_raw = row.get("levyLineCodeByCounty")
        if not isinstance(codes_raw, dict):
            raise ValueError(f"{path}: [{te_id}] levyLineCodeByCounty must be an object")
        codes: dict[str, str] = {}
        for county_id, code_raw in codes_raw.items():
            code = strip_field(str(code_raw)).upper()
            if code:
                codes[strip_field(str(county_id))] = code
        if not codes:
            raise ValueError(f"{path}: [{te_id}] levyLineCodeByCounty is empty")
        out[te_id] = {
            "displayName": strip_field(str(row.get("displayName") or "")) or None,
            "levyLineCodeByCounty": codes,
            "note": strip_field(str(row.get("note") or "")) or None,
        }
    return out


def _county_id_from_dola_certifying(
    name: str,
    county_id_by_dola_name: dict[str, str],
) -> str | None:
    return county_id_by_dola_name.get(strip_field(name).lower())


def load_dola_rows_by_tax_entity(
    dola_path: Path,
    county_id_by_dola_name: dict[str, str],
) -> dict[str, dict[str, Any]]:
    """Group DOLA export rows by Tax Entity ID."""
    by_te: dict[str, dict[str, Any]] = {}
    with dola_path.open(newline="", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            te_id = _te_id_str(row.get("Tax Entity ID:") or row.get("Tax Entity ID"))
            if not te_id:
                continue
            legal_name = strip_field(
                row.get("DOLA Tax Entity Name:") or row.get("DOLA Tax Entity Name")
            )
            certifying = strip_field(row.get("Certifying County:") or row.get("Certifying County"))
            county_id = _county_id_from_dola_certifying(certifying, county_id_by_dola_name)
            mills = parse_levy_mills_cell(
                row.get("2026 Budget Year Total Levy (2025 Tax Year)")
                or row.get("Total Levy")
            )
            entry = by_te.setdefault(
                te_id,
                {
                    "taxEntityId": te_id,
                    "lgId": _coalesce_lg_id_from_entity(None, te_id),
                    "dolaName": legal_name,
                    "certifyingCounties": [],
                    "dolaMillsByCountyId": {},
                },
            )
            if legal_name and not entry["dolaName"]:
                entry["dolaName"] = legal_name
            if certifying and certifying not in entry["certifyingCounties"]:
                entry["certifyingCounties"].append(certifying)
            if county_id and county_id not in entry["dolaMillsByCountyId"]:
                entry["dolaMillsByCountyId"][county_id] = mills

    for entry in by_te.values():
        entry["certifyingCounties"] = sorted(entry["certifyingCounties"])
    return by_te


def load_unique_stack_lines(stacks_path: Path) -> dict[str, dict[str, Any]]:
    """Unique AUTH code -> representative stack line."""
    raw = json.loads(stacks_path.read_text(encoding="utf-8"))
    by_code: dict[str, dict[str, Any]] = {}
    for stack in (raw.get("stacksByTagId") or {}).values():
        for line in stack.get("lines") or []:
            code = strip_field(str(line.get("code") or "")).upper()
            if not code or code in by_code:
                continue
            by_code[code] = line
    return by_code


def map_stack_lines_to_tax_entities(
    stack_lines: dict[str, dict[str, Any]],
    dola_entities: list[dict[str, Any]],
    overrides: dict[str, dict[str, Any]],
) -> dict[str, StackLineMatch]:
    """Map Tax Entity ID -> best stack line match for one county."""
    te_to_stack: dict[str, StackLineMatch] = {}
    for code, line in stack_lines.items():
        authority_name = strip_field(str(line.get("authorityName") or ""))
        dola_match = line.get("dolaMatch") or {}
        te_id = _te_id_str(dola_match.get("taxEntityId"))
        method = strip_field(str(dola_match.get("method") or ""))
        confidence = dola_match.get("confidence")
        score = dola_match.get("score")

        if te_id and method and method not in ("none", "skipped"):
            stack_match = StackLineMatch(
                levy_line_code=code,
                authority_name=authority_name,
                match_method=method,
                match_confidence=str(confidence) if confidence is not None else None,
                match_score=float(score) if isinstance(score, (int, float)) else None,
            )
        else:
            resolved = match_dola_line(authority_name, dola_entities, overrides)
            te_id = _te_id_str(resolved.get("taxEntityId"))
            if not te_id or resolved.get("method") == "none":
                continue
            stack_match = StackLineMatch(
                levy_line_code=code,
                authority_name=authority_name,
                match_method=str(resolved.get("method") or "fuzzy"),
                match_confidence=str(resolved.get("confidence"))
                if resolved.get("confidence") is not None
                else None,
                match_score=float(resolved["score"])
                if isinstance(resolved.get("score"), (int, float))
                else None,
            )

        existing = te_to_stack.get(te_id)
        if existing is None:
            te_to_stack[te_id] = stack_match
            continue
        existing_score = existing.match_score if existing.match_score is not None else -1.0
        new_score = stack_match.match_score if stack_match.match_score is not None else -1.0
        if new_score > existing_score or (
            new_score == existing_score
            and stack_match.levy_line_code < existing.levy_line_code
        ):
            te_to_stack[te_id] = stack_match
    return te_to_stack


def _match_row_id(tax_entity_id: str) -> str:
    """Stable row id: full Tax Entity ID with / replaced (avoids lgId collisions)."""
    return re.sub(r"[^A-Za-z0-9]+", "-", tax_entity_id).strip("-")


def _compute_match_status(
    wired_overlap: list[str],
    levy_line_code_by_county: dict[str, str],
) -> MatchStatus:
    if not levy_line_code_by_county:
        return "dola_only"
    if all(county_id in levy_line_code_by_county for county_id in wired_overlap):
        return "complete"
    return "partial"


def _apply_cross_county_override(
    match_row: dict[str, Any],
    override: dict[str, Any],
) -> None:
    codes = override.get("levyLineCodeByCounty") or {}
    if not isinstance(codes, dict):
        return
    for county_id, code in codes.items():
        normalized_code = strip_field(str(code)).upper()
        if not normalized_code:
            continue
        match_row["levyLineCodeByCounty"][county_id] = normalized_code
        methods = match_row.setdefault("stackMatchMethodByCounty", {})
        if isinstance(methods, dict):
            methods[county_id] = "curated_override"
        conf = match_row.setdefault("stackMatchConfidenceByCounty", {})
        if isinstance(conf, dict):
            conf[county_id] = "high"
    if override.get("displayName"):
        match_row["curatedDisplayName"] = override["displayName"]
    if override.get("note"):
        match_row["curatedNote"] = override["note"]
    missing = match_row.get("missingStackMatchInCountyIds")
    if isinstance(missing, list):
        match_row["missingStackMatchInCountyIds"] = [
            county_id
            for county_id in missing
            if county_id not in match_row["levyLineCodeByCounty"]
        ]
        if not match_row["missingStackMatchInCountyIds"]:
            del match_row["missingStackMatchInCountyIds"]


def _repo_relative(path: Path) -> str:
    try:
        return str(path.relative_to(_REPO))
    except ValueError:
        return str(path)


def build_cross_county_matches(
    *,
    dola_path: Path = DEFAULT_DOLA_CSV,
    wired_counties_path: Path = DEFAULT_WIRED_COUNTIES,
    overrides_path: Path = DEFAULT_CROSS_COUNTY_OVERRIDES,
    stacks_dir: Path | None = None,
    only_complete: bool = False,
) -> dict[str, Any]:
    stacks_root = stacks_dir or (_REPO / "public" / "data")
    wired_counties = load_wired_counties(wired_counties_path)
    wired_county_ids = tuple(row["id"] for row in wired_counties)
    county_id_by_dola_name = {
        row["dolaCertifyingCounty"].lower(): row["id"] for row in wired_counties
    }

    dola_by_te = load_dola_rows_by_tax_entity(dola_path, county_id_by_dola_name)
    mart_overrides = load_overrides(DEFAULT_OVERRIDES)
    cross_county_overrides = load_cross_county_overrides(overrides_path)

    stack_maps: dict[str, dict[str, StackLineMatch]] = {}
    for row in wired_counties:
        county_id = row["id"]
        dola_certifying = row["dolaCertifyingCounty"]
        stacks_path = stacks_root / f"{county_id}-levy-stacks-by-tag-id.json"
        stack_lines = load_unique_stack_lines(stacks_path)
        from ingest.dola_match import load_dola_entities  # local import avoids cycle noise

        dola_entities, _, _ = load_dola_entities(dola_path, dola_certifying)
        stack_maps[county_id] = map_stack_lines_to_tax_entities(
            stack_lines,
            dola_entities,
            mart_overrides,
        )

    matches: list[dict[str, Any]] = []
    status_counts: dict[str, int] = {"complete": 0, "partial": 0, "dola_only": 0}

    for te_id, dola_entry in sorted(dola_by_te.items(), key=lambda item: item[0]):
        overlap = [
            county_id
            for county_id in wired_county_ids
            if county_id in dola_entry["dolaMillsByCountyId"]
        ]
        if len(overlap) < 2:
            continue

        levy_line_code_by_county: dict[str, str] = {}
        authority_name_by_county: dict[str, str] = {}
        stack_match_method_by_county: dict[str, str] = {}
        stack_match_confidence_by_county: dict[str, str] = {}
        missing_stack_in: list[str] = []

        for county_id in overlap:
            stack_match = stack_maps[county_id].get(te_id)
            if stack_match is None:
                missing_stack_in.append(county_id)
                continue
            levy_line_code_by_county[county_id] = stack_match.levy_line_code
            authority_name_by_county[county_id] = stack_match.authority_name
            stack_match_method_by_county[county_id] = stack_match.match_method
            if stack_match.match_confidence:
                stack_match_confidence_by_county[county_id] = stack_match.match_confidence

        match_row: dict[str, Any] = {
            "id": _match_row_id(te_id),
            "taxEntityId": te_id,
            "lgId": dola_entry.get("lgId"),
            "dolaName": dola_entry.get("dolaName"),
            "certifyingCounties": dola_entry.get("certifyingCounties") or [],
            "wiredCountyOverlap": overlap,
            "levyLineCodeByCounty": levy_line_code_by_county,
            "authorityNameByCounty": authority_name_by_county,
            "stackMatchMethodByCounty": stack_match_method_by_county,
            "dolaMillsByCountyId": {
                county_id: dola_entry["dolaMillsByCountyId"].get(county_id)
                for county_id in overlap
            },
        }
        if stack_match_confidence_by_county:
            match_row["stackMatchConfidenceByCounty"] = stack_match_confidence_by_county
        if missing_stack_in:
            match_row["missingStackMatchInCountyIds"] = missing_stack_in

        override = cross_county_overrides.get(te_id)
        if override:
            _apply_cross_county_override(match_row, override)

        status = _compute_match_status(overlap, match_row["levyLineCodeByCounty"])
        match_row["matchStatus"] = status

        if only_complete and status != "complete":
            continue
        matches.append(match_row)
        status_counts[status] += 1

    return {
        "version": 1,
        "note": (
            "Maintainer cross-county overlap list from DOLA Tax Entity ID + bundled "
            "levy stacks. Not loaded by the app. Curate public/data/"
            "cross-county-authority-registry.json from rows with matchStatus "
            "complete (every wiredCountyOverlap county has a stack AUTH code)."
        ),
        "generatedFrom": {
            "dolaExport": _repo_relative(dola_path),
            "wiredCounties": _repo_relative(wired_counties_path),
            "crossCountyOverrides": _repo_relative(overrides_path),
            "levyStacksByCountyId": {
                row["id"]: _repo_relative(
                    stacks_root / f"{row['id']}-levy-stacks-by-tag-id.json"
                )
                for row in wired_counties
            },
        },
        "wiredCountyIds": list(wired_county_ids),
        "matchCount": len(matches),
        "matchStatusCounts": status_counts,
        "matches": matches,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dola-export",
        type=Path,
        default=DEFAULT_DOLA_CSV,
        help="DOLA property-tax-entities export (CSV)",
    )
    parser.add_argument(
        "--wired-counties",
        type=Path,
        default=DEFAULT_WIRED_COUNTIES,
        help="Wired county manifest (default: tools/wired-counties.json)",
    )
    parser.add_argument(
        "--overrides",
        type=Path,
        default=DEFAULT_CROSS_COUNTY_OVERRIDES,
        help="Curated cross-county overrides by Tax Entity ID",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Write JSON here (default: tools/cross-county-authority-matches.json)",
    )
    parser.add_argument(
        "--only-complete",
        action="store_true",
        help="Omit partial and dola_only rows from output",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Print JSON to stdout instead of writing --output",
    )
    args = parser.parse_args()

    if args.dola_export.suffix.lower() != ".csv":
        print(
            f"--dola-export must be a CSV file (got {args.dola_export.suffix!r}): "
            f"{args.dola_export}",
            file=sys.stderr,
        )
        sys.exit(1)

    if not args.dola_export.is_file():
        print(f"DOLA export not found: {args.dola_export}", file=sys.stderr)
        sys.exit(1)
    if not args.wired_counties.is_file():
        print(f"Wired counties manifest not found: {args.wired_counties}", file=sys.stderr)
        sys.exit(1)

    payload = build_cross_county_matches(
        dola_path=args.dola_export,
        wired_counties_path=args.wired_counties,
        overrides_path=args.overrides,
        only_complete=args.only_complete,
    )
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"

    if args.stdout:
        sys.stdout.write(text)
        return

    args.output.write_text(text, encoding="utf-8")
    counts = payload["matchStatusCounts"]
    print(
        f"Wrote {payload['matchCount']} cross-county matches to {args.output} "
        f"(complete={counts['complete']}, partial={counts['partial']}, "
        f"dola_only={counts['dola_only']})",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
