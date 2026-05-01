#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
Extract the page-2 six-column comps grid from an Arapahoe NOV-style PDF.

The parser is deterministic and emits every canonical row with six cells:
SUBJECT + SALE 1..5. Each cell preserves raw text and typed parsing status.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import pdfplumber
except ImportError:
    print("Install dependencies: pip install -r tools/requirements.txt", file=sys.stderr)
    raise


REPO_ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = Path(__file__).resolve().parent
DEFINITIONS_PATH = TOOLS_DIR / "nov_comps_grid_definitions.json"
DEFAULT_PDF = REPO_ROOT / "supporting-data" / "_private" / "Traditional-Notice-of-Valuation-656.pdf"

MASK_RE = re.compile(r"^\*+$")
INT_RE = re.compile(r"^-?\d+$")
FLOAT_RE = re.compile(r"^-?\d+(?:\.\d+)?$")
DATE_RE = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{4})$")

ROW_Y_TOLERANCE = 3.0
LABEL_X_CUTOFF = 124.0
# Drop sidebar / footer prose that shares baselines with the grid (see working doc).
GRID_X_MAX = 620.0

LOGICAL_STRING = "string"
LOGICAL_MONEY = "money_usd"
LOGICAL_INT = "integer"
LOGICAL_FLOAT = "number"
LOGICAL_YEAR = "year"
LOGICAL_DATE = "date"
LOGICAL_INDICATOR = "indicator"
LOGICAL_SECTION = "section_marker"


@dataclass(frozen=True)
class CanonicalRow:
    pdf_label: str
    json_key: str
    logical_type: str


CANONICAL_ROWS: list[CanonicalRow] = [
    CanonicalRow("PARCEL ID", "parcel_id", LOGICAL_STRING),
    CanonicalRow("STREET #", "street_number", LOGICAL_STRING),
    CanonicalRow("STREET", "street_name", LOGICAL_STRING),
    CanonicalRow("STREET TYPE", "street_type", LOGICAL_STRING),
    CanonicalRow("APT #", "apt_number", LOGICAL_STRING),
    CanonicalRow("DWELLING", "dwelling", LOGICAL_INDICATOR),
    CanonicalRow("Time Adj Sale Price", "time_adj_sale_price", LOGICAL_MONEY),
    CanonicalRow("Original Sale Price", "original_sale_price", LOGICAL_MONEY),
    CanonicalRow("Concessions and PP", "concessions_and_pp", LOGICAL_MONEY),
    CanonicalRow("Parcel Number", "parcel_number", LOGICAL_STRING),
    CanonicalRow("Neighborhood", "neighborhood", LOGICAL_STRING),
    CanonicalRow("Neighborhood Group", "neighborhood_group", LOGICAL_STRING),
    CanonicalRow("LUC", "luc", LOGICAL_STRING),
    CanonicalRow("Allocated Land Val", "allocated_land_val", LOGICAL_MONEY),
    CanonicalRow("Improvement Type", "improvement_type", LOGICAL_STRING),
    CanonicalRow("Improvement Style", "improvement_style", LOGICAL_STRING),
    CanonicalRow("Year Built", "year_built", LOGICAL_YEAR),
    CanonicalRow("Remodel Year", "remodel_year", LOGICAL_YEAR),
    CanonicalRow("Valuation Grade", "valuation_grade", LOGICAL_STRING),
    CanonicalRow("Living Area", "living_area", LOGICAL_INT),
    CanonicalRow("Basement/Garden lvl", "basement_garden_lvl", LOGICAL_INT),
    CanonicalRow("Finish Bsmt/Grdn lvl", "finish_bsmt_grdn_lvl", LOGICAL_INT),
    CanonicalRow("Walkout Basement", "walkout_basement", LOGICAL_INT),
    CanonicalRow("Attached Garage", "attached_garage", LOGICAL_INT),
    CanonicalRow("Detached Garage", "detached_garage", LOGICAL_INT),
    CanonicalRow("Open Porch", "open_porch", LOGICAL_INT),
    CanonicalRow("Deck/Terrace", "deck_terrace", LOGICAL_INT),
    CanonicalRow("Total Bath Count", "total_bath_count", LOGICAL_FLOAT),
    CanonicalRow("Fireplaces", "fireplaces", LOGICAL_INT),
    CanonicalRow("2nd Residence", "second_residence", LOGICAL_INDICATOR),
    CanonicalRow("Regression Valuation", "regression_valuation", LOGICAL_MONEY),
    CanonicalRow("VALUATION", "valuation_label", LOGICAL_SECTION),
    CanonicalRow("SALE DATE", "sale_date", LOGICAL_DATE),
    CanonicalRow("Time Adj Sale Price", "valuation_time_adj_sale_price", LOGICAL_MONEY),
    CanonicalRow("Adjusted Sale Price", "adjusted_sale_price", LOGICAL_MONEY),
    CanonicalRow("ADJ MKT $", "adj_mkt", LOGICAL_MONEY),
]


def normalize_space(raw: str) -> str:
    return " ".join(raw.split())


def is_masked_sentinel(raw: str) -> bool:
    s = normalize_space(raw)
    if not s:
        return False
    return MASK_RE.fullmatch(s) is not None


def parse_money(raw: str) -> int | None:
    s = normalize_space(raw).replace(",", "").replace("$", "")
    if not s:
        return None
    if not INT_RE.fullmatch(s):
        return None
    return int(s)


def parse_integer(raw: str) -> int | None:
    s = normalize_space(raw).replace(",", "")
    if not s:
        return None
    if not INT_RE.fullmatch(s):
        return None
    return int(s)


def parse_number(raw: str) -> float | None:
    s = normalize_space(raw).replace(",", "")
    if not s:
        return None
    if not FLOAT_RE.fullmatch(s):
        return None
    return float(s)


def parse_date(raw: str) -> str | None:
    s = normalize_space(raw)
    m = DATE_RE.fullmatch(s)
    if not m:
        return None
    month = int(m.group(1))
    day = int(m.group(2))
    year = int(m.group(3))
    try:
        dt = datetime(year=year, month=month, day=day, tzinfo=timezone.utc)
    except ValueError:
        return None
    return dt.strftime("%Y-%m-%d")


def parse_cell(raw_text: str, row: CanonicalRow) -> dict[str, Any]:
    raw = normalize_space(raw_text)
    if not raw:
        return {
            "raw_text": "",
            "parsed": None,
            "parse_ok": False,
            "parse_note": "blank cell",
        }
    if row.logical_type == LOGICAL_SECTION and is_masked_sentinel(raw):
        return {
            "raw_text": raw,
            "parsed": None,
            "parse_ok": True,
            "parse_note": "masked section placeholder",
        }

    if is_masked_sentinel(raw):
        return {
            "raw_text": raw,
            "parsed": None,
            "parse_ok": False,
            "parse_note": "masked sentinel",
        }

    if row.logical_type == LOGICAL_SECTION:
        return {"raw_text": raw, "parsed": raw, "parse_ok": True}

    if row.logical_type == LOGICAL_STRING:
        return {"raw_text": raw, "parsed": raw, "parse_ok": True}

    if row.logical_type == LOGICAL_MONEY:
        n = parse_money(raw)
        if n is None:
            return {
                "raw_text": raw,
                "parsed": None,
                "parse_ok": False,
                "parse_note": "invalid money format",
            }
        return {"raw_text": raw, "parsed": n, "parse_ok": True}

    if row.logical_type == LOGICAL_INT:
        n = parse_integer(raw)
        if n is None:
            return {
                "raw_text": raw,
                "parsed": None,
                "parse_ok": False,
                "parse_note": "invalid integer format",
            }
        return {"raw_text": raw, "parsed": n, "parse_ok": True}

    if row.logical_type == LOGICAL_FLOAT:
        n = parse_number(raw)
        if n is None:
            return {
                "raw_text": raw,
                "parsed": None,
                "parse_ok": False,
                "parse_note": "invalid numeric format",
            }
        return {"raw_text": raw, "parsed": n, "parse_ok": True}

    if row.logical_type == LOGICAL_YEAR:
        n = parse_integer(raw)
        if n is None:
            return {
                "raw_text": raw,
                "parsed": None,
                "parse_ok": False,
                "parse_note": "invalid year format",
            }
        if n == 0:
            return {
                "raw_text": raw,
                "parsed": None,
                "parse_ok": False,
                "parse_note": "year 0 treated as missing",
            }
        if n < 1800 or n > 2100:
            return {
                "raw_text": raw,
                "parsed": None,
                "parse_ok": False,
                "parse_note": "year outside expected range",
            }
        return {"raw_text": raw, "parsed": n, "parse_ok": True}

    if row.logical_type == LOGICAL_DATE:
        parsed = parse_date(raw)
        if parsed is None:
            return {
                "raw_text": raw,
                "parsed": None,
                "parse_ok": False,
                "parse_note": "invalid date format",
            }
        return {"raw_text": raw, "parsed": parsed, "parse_ok": True}

    if row.logical_type == LOGICAL_INDICATOR:
        n = parse_integer(raw)
        if n in (0, 1):
            return {"raw_text": raw, "parsed": n, "parse_ok": True}
        return {
            "raw_text": raw,
            "parsed": None,
            "parse_ok": False,
            "parse_note": "expected 0 or 1 indicator",
        }

    return {
        "raw_text": raw,
        "parsed": None,
        "parse_ok": False,
        "parse_note": f"unsupported logical type {row.logical_type}",
    }


def build_row_label_lookup() -> list[tuple[str, CanonicalRow]]:
    out: list[tuple[str, CanonicalRow]] = []
    for row in CANONICAL_ROWS:
        if row.pdf_label == "Time Adj Sale Price":
            continue
        out.append((normalize_space(row.pdf_label).lower(), row))
    return out


def load_definitions_bundle() -> dict[str, Any] | None:
    if not DEFINITIONS_PATH.exists():
        return None
    raw = DEFINITIONS_PATH.read_text(encoding="utf-8")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid definitions JSON ({DEFINITIONS_PATH}): {exc}") from exc


def merge_definitions_optional(payload: dict[str, Any], bundle: dict[str, Any]) -> dict[str, Any]:
    cols = bundle.get("columns") or {}
    rows = bundle.get("rows") or {}
    enriched: dict[str, Any] = {**payload, "definitions": {"columns": cols, "rows": rows}}
    return enriched


def definitions_coverage_guard(bundle: dict[str, Any]) -> None:
    rows = bundle.get("rows") or {}
    cols = bundle.get("columns") or {}
    missing_rows = [
        row.json_key for row in CANONICAL_ROWS if row.json_key not in rows
    ]
    required_cols = ["subject"] + [f"sale_{idx}" for idx in range(1, 6)]
    missing_cols = [key for key in required_cols if key not in cols]
    if missing_rows or missing_cols:
        raise RuntimeError(
            "Definition bundle is missing rows or columns: "
            f"missing_rows={missing_rows}; missing_cols={missing_cols}"
        )


def cluster_rows(words: list[dict[str, Any]], y_tolerance: float = ROW_Y_TOLERANCE) -> list[list[dict[str, Any]]]:
    lines: list[list[dict[str, Any]]] = []
    for word in sorted(words, key=lambda w: (float(w["top"]), float(w["x0"]))):
        placed = False
        top = float(word["top"])
        for line in lines:
            if abs(top - float(line[0]["top"])) <= y_tolerance:
                line.append(word)
                placed = True
                break
        if not placed:
            lines.append([word])
    for line in lines:
        line.sort(key=lambda w: float(w["x0"]))
    return lines


def header_columns_from_line(line: list[dict[str, Any]]) -> list[dict[str, Any]]:
    subject_word = next((w for w in line if normalize_space(w["text"]).upper() == "SUBJECT"), None)
    if subject_word is None:
        raise RuntimeError("Could not find SUBJECT token in page-2 header line")

    sale_num_words = [
        w
        for w in line
        if normalize_space(str(w["text"])) in ("1", "2", "3", "4", "5")
        and any(
            normalize_space(str(other["text"])).upper() == "SALE"
            and abs(float(other["x0"]) - float(w["x0"])) < 35
            for other in line
        )
    ]
    if len(sale_num_words) != 5:
        raise RuntimeError("Could not find SALE 1..5 tokens in page-2 header line")

    sale_num_words.sort(key=lambda w: float(w["x0"]))
    centers = [
        (float(subject_word["x0"]) + float(subject_word["x1"])) / 2.0,
        *[((float(w["x0"]) + float(w["x1"])) / 2.0) for w in sale_num_words],
    ]
    labels = ["SUBJECT", "SALE 1", "SALE 2", "SALE 3", "SALE 4", "SALE 5"]
    return [
        {"index": idx, "key": ("subject" if idx == 0 else f"sale_{idx}"), "label": labels[idx], "center_x": centers[idx]}
        for idx in range(6)
    ]


def compute_column_bounds(columns: list[dict[str, Any]]) -> list[tuple[float, float]]:
    centers = [float(c["center_x"]) for c in columns]
    bounds: list[tuple[float, float]] = []
    for i, c in enumerate(centers):
        left = (centers[i - 1] + c) / 2.0 if i > 0 else c - (centers[i + 1] - c) / 2.0
        right = (c + centers[i + 1]) / 2.0 if i < len(centers) - 1 else c + (c - centers[i - 1]) / 2.0
        bounds.append((left, right))
    return bounds


def find_header_line(lines: list[list[dict[str, Any]]]) -> list[dict[str, Any]]:
    candidates: list[list[dict[str, Any]]] = []
    for line in lines:
        text = " ".join(normalize_space(str(w["text"])) for w in line).upper()
        if "SUBJECT" not in text or "SALE" not in text:
            continue
        try:
            header_columns_from_line(line)
        except RuntimeError:
            continue
        candidates.append(line)
    if not candidates:
        raise RuntimeError("Could not find page-2 header row with SUBJECT and SALE 1..5 columns")
    return min(candidates, key=lambda ln: float(ln[0]["top"]))


def extract_grid(pdf_path: Path, include_definitions: bool = True) -> dict[str, Any]:
    with pdfplumber.open(pdf_path) as pdf:
        if len(pdf.pages) < 2:
            raise RuntimeError("Expected at least 2 pages in NOV PDF")
        page = pdf.pages[1]
        words_all = page.extract_words(use_text_flow=False, keep_blank_chars=False) or []
        words = [w for w in words_all if float(w["x0"]) < GRID_X_MAX]
        if not words:
            raise RuntimeError("No words found on page 2 (after grid x filter)")
        lines = cluster_rows(words)
        header_line = find_header_line(lines)
        header_top = float(header_line[0]["top"])
        columns = header_columns_from_line(header_line)
        bounds = compute_column_bounds(columns)
        right_edge = bounds[-1][1]

        row_lookup = build_row_label_lookup()
        output_rows: dict[str, dict[str, Any]] = {}
        time_adj_seen = 0

        for line in lines:
            row_top = float(line[0]["top"])
            if row_top <= header_top + ROW_Y_TOLERANCE:
                continue
            left_tokens = [w for w in line if float(w["x0"]) < LABEL_X_CUTOFF]
            if not left_tokens:
                continue
            label_text = normalize_space(" ".join(str(w["text"]) for w in left_tokens))
            if not label_text:
                continue

            row_key = label_text.lower()
            row_def: CanonicalRow | None = None
            if row_key == "time adj sale price":
                time_adj_seen += 1
                if time_adj_seen == 1:
                    target_key = "time_adj_sale_price"
                elif time_adj_seen == 2:
                    target_key = "valuation_time_adj_sale_price"
                else:
                    target_key = ""
                if target_key:
                    row_def = next((row for row in CANONICAL_ROWS if row.json_key == target_key), None)
            else:
                for candidate_label, candidate in row_lookup:
                    if candidate_label == row_key:
                        row_def = candidate
                        break
            if row_def is None:
                continue

            if row_def.json_key in output_rows:
                continue

            cells_raw: list[str] = []
            for left, right in bounds:
                tokens = [
                    w
                    for w in line
                    if float(w["x0"]) >= left
                    and float(w["x0"]) < right
                    and float(w["x0"]) > LABEL_X_CUTOFF
                    and float(w["x0"]) < right_edge + 2
                ]
                tokens.sort(key=lambda w: float(w["x0"]))
                raw_text = normalize_space(" ".join(str(w["text"]) for w in tokens))
                cells_raw.append(raw_text)

            output_rows[row_def.json_key] = {
                "pdf_label": row_def.pdf_label,
                "json_key": row_def.json_key,
                "logical_type": row_def.logical_type,
                "cells": [parse_cell(raw, row_def) for raw in cells_raw],
            }

        for row in CANONICAL_ROWS:
            if row.json_key in output_rows:
                continue
            output_rows[row.json_key] = {
                "pdf_label": row.pdf_label,
                "json_key": row.json_key,
                "logical_type": row.logical_type,
                "cells": [
                    {
                        "raw_text": "",
                        "parsed": None,
                        "parse_ok": False,
                        "parse_note": "row not found on page",
                    }
                    for _ in range(6)
                ],
            }

        row_order = [r.json_key for r in CANONICAL_ROWS]
        ordered_rows = {k: output_rows[k] for k in row_order}
        columns_out = [{k: v for k, v in col.items() if k != "center_x"} for col in columns]
        payload: dict[str, Any] = {
            "source": {
                "pdf_path": str(pdf_path),
                "page_index": 1,
            },
            "grid": {
                "mask_sentinel_hint": (
                    "Long runs of asterisks denote masked omission in county PDF grids; normalize to parsed null "
                    "with masked sentinel metadata."
                ),
                "columns": columns_out,
                "canonical_row_order": row_order,
                "rows": ordered_rows,
            },
            "limitations": [
                "Parser targets NOV page 2 six-column layout (subject + sale 1..5).",
                "Line-based table extraction is not used; parser relies on text geometry and x-bands.",
                "County print format wins when it diverges from strict UAD-style formatting.",
                "This tooling is informational, not appraisal software; USPAP and UAD are cited for discipline "
                "and language care, not for claiming compliance.",
            ],
        }

        if include_definitions:
            defs = load_definitions_bundle()
            if defs is None:
                return payload

            definitions_coverage_guard(defs)
            return merge_definitions_optional(payload, defs)
        return payload


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Extract Arapahoe NOV page-2 comps grid to JSON. "
            "Output can include parcel or address text from the PDF; do not commit or paste raw output."
        )
    )
    parser.add_argument("--pdf", type=Path, default=DEFAULT_PDF, help="Input PDF path.")
    parser.add_argument("--out", type=Path, default=None, help="Optional output JSON file path.")
    parser.add_argument("--indent", type=int, default=2, help="JSON indentation.")
    parser.add_argument(
        "--skip-definitions",
        action="store_true",
        help="Omit bundled lay and official citations from output.",
    )
    args = parser.parse_args()

    if not args.pdf.exists():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 2

    try:
        payload = extract_grid(args.pdf, include_definitions=not args.skip_definitions)
    except (RuntimeError, OSError, ValueError) as exc:
        print(f"extract failed: {exc}", file=sys.stderr)
        return 1

    print(
        "Notice: JSON may contain parcel or address fields from the source PDF; treat output as sensitive.",
        file=sys.stderr,
    )
    text = json.dumps(payload, indent=args.indent, ensure_ascii=True) + "\n"
    if args.out is None:
        print(text, end="")
    else:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
