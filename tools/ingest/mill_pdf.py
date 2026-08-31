#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Tax-district mill PDF → shared levy-stack intermediate rows.

Reusable for counties that publish a tax-district header + authority mill table
as a PDF (Douglas Tax Districts and Mill Levies). County-specific path and
optional field names stay in the mapping file; this module only parses the
shared page pattern.

Pattern (per district):
  Tax District: NNNN
  Authority No. Authority Name Mill Levy
  0001 Some Authority 12.345
  ...
  Authority Count: N Total Mill Levy: ...
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from ingest.reader import MappingError

_TAX_DISTRICT_RE = re.compile(r"^Tax District:\s*(\d+)\s*$", re.IGNORECASE)
_AUTHORITY_ROW_RE = re.compile(
    r"^(\d{3,5})\s+(.+?)\s+(-?\d+(?:\.\d+)?)\s*$"
)
_AUTHORITY_COUNT_RE = re.compile(r"^Authority Count:\s*", re.IGNORECASE)
_HEADER_NOISE_RE = re.compile(
    r"^(Authority No\.?\s+Authority Name\s+Mill Levy|"
    r"\d{4}\s+Tax Districts and Mill Levies)\s*$",
    re.IGNORECASE,
)
_YEAR_RE = re.compile(r"\b(20\d{2})\b")


def _strip(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def _zero_pad_tax_area(raw: str, width: int = 4) -> str:
    s = _strip(raw)
    if s.isdigit():
        return s.zfill(width)
    return s


def extract_pdf_page_texts(pdf_path: Path) -> list[str]:
    """Return plain text per page. Raises MappingError if pdfplumber is missing."""
    try:
        import pdfplumber
    except ImportError as exc:
        raise MappingError(
            f"{pdf_path}: pdfplumber is required to read mill PDFs "
            "(pip install pdfplumber)"
        ) from exc
    texts: list[str] = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                texts.append(page.extract_text() or "")
    except MappingError:
        raise
    except Exception as exc:
        raise MappingError(f"{pdf_path}: failed to read PDF: {exc}") from exc
    return texts


def tax_year_from_mill_pdf_texts(page_texts: list[str]) -> str | None:
    """Best-effort tax year from the first page title (e.g. '2025 Tax Districts…')."""
    if not page_texts:
        return None
    first = page_texts[0]
    for line in first.splitlines()[:8]:
        m = _YEAR_RE.search(line)
        if m and "tax district" in line.lower():
            return m.group(1)
    m = _YEAR_RE.search(first[:200])
    return m.group(1) if m else None


def parse_tax_district_mill_pdf_texts(
    page_texts: list[str],
    *,
    tax_year: str | None = None,
) -> list[dict[str, Any]]:
    """
    Parse page texts into intermediate levy-stack rows.

    Each row: taxAreaId, lineCode, authorityName, millLevy (float), taxYear (optional).
    """
    rows: list[dict[str, Any]] = []
    current_tax_area: str | None = None
    resolved_year = tax_year

    for text in page_texts:
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            if resolved_year is None:
                ym = _YEAR_RE.search(line)
                if ym and "tax district" in line.lower():
                    resolved_year = ym.group(1)

            td = _TAX_DISTRICT_RE.match(line)
            if td:
                current_tax_area = _zero_pad_tax_area(td.group(1))
                continue

            if _AUTHORITY_COUNT_RE.match(line) or _HEADER_NOISE_RE.match(line):
                continue

            auth = _AUTHORITY_ROW_RE.match(line)
            if not auth:
                continue
            if not current_tax_area:
                continue

            line_code = auth.group(1).zfill(4)
            authority_name = auth.group(2).strip()
            mill_levy = float(auth.group(3))
            row: dict[str, Any] = {
                "taxAreaId": current_tax_area,
                "lineCode": line_code,
                "authorityName": authority_name,
                "millLevy": mill_levy,
                "taxYear": resolved_year,
                "effectiveYear": None,
                "status": None,
            }
            rows.append(row)
    return rows


def read_tax_district_mill_pdf_rows(
    pdf_path: Path,
    mapping: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """
    Read a tax-district mill PDF into shared levy-stack intermediate rows.

    mapping is accepted for call-site symmetry; format is fixed for this reader.
    """
    if mapping is not None:
        levy_cfg = mapping.get("levyStack") or {}
        fmt = levy_cfg.get("format")
        if fmt and fmt not in {"tax-district-mill-pdf", "csv"}:
            # csv format on a PDF path is a mapping mistake
            if fmt != "tax-district-mill-pdf" and pdf_path.suffix.lower() == ".pdf":
                pass
    if not pdf_path.is_file():
        raise MappingError(f"mill PDF not found: {pdf_path}")
    texts = extract_pdf_page_texts(pdf_path)
    if not texts:
        raise MappingError(f"{pdf_path}: PDF has no pages")
    rows = parse_tax_district_mill_pdf_texts(texts)
    if not rows:
        raise MappingError(
            f"{pdf_path}: no tax-district authority mill rows found "
            "(expected 'Tax District: NNNN' + authority mill lines)"
        )
    return rows
