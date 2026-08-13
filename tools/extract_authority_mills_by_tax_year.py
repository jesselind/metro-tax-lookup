# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
Extract authority (AUTH) total mills by tax year from Arapahoe
"Taxing District Levy Percentage" PDFs into a shipping JSON file.

This script is NOT part of the web runtime. Run it manually when new
Levy % PDFs are published (developer tool).

Usage (from project root, after `tools/requirements.txt`):

  python tools/extract_authority_mills_by_tax_year.py \\
    --out public/data/arapahoe-authority-mills-by-tax-year.json

  # Override one year:
  python tools/extract_authority_mills_by_tax_year.py \\
    --pdf 2025 supporting-data/certs/2025\\ Taxing\\ District\\ Levy\\ Percentage.pdf

Optional raw audit rows write under supporting-data/authority-mills/.

Join key for the app: stack line `code` (AUTH). Prefer AUTH -> taxYear -> mills
when rates are uniform across PDF TAG groups. TAG+AUTH exceptions use the
Levy % PDF TAG code (not Levy.aspx tagId); see payload `_meta`.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import pdfplumber

# PDF TAG column is a short tax-area code (e.g. "0002"). Stack JSON uses
# Levy.aspx TAGId (e.g. "1243330"). Do not treat them as interchangeable.
DEFAULT_PDF_BY_YEAR: Dict[int, Path] = {
  2018: Path("supporting-data/certs/2018 Taxing District Levy Percentages.pdf"),
  2019: Path("supporting-data/certs/2019 Taxing District Levy Percentages.pdf"),
  2020: Path("supporting-data/certs/2020 Taxing District Levy Percentages.pdf"),
  2021: Path("supporting-data/certs/2021 Taxing District Levy Percentages.pdf"),
  2022: Path("supporting-data/certs/2022 Taxing District Levy Percentages.pdf"),
  2023: Path("supporting-data/certs/2023 Taxing District Levy Percentage.pdf"),
  2024: Path("supporting-data/certs/2024 Taxing District Levy Percentages.pdf"),
  2025: Path("supporting-data/certs/2025 Taxing District Levy Percentage.pdf"),
}
DEFAULT_OUT = Path("public/data/arapahoe-authority-mills-by-tax-year.json")
DEFAULT_AUDIT_DIR = Path("supporting-data/authority-mills")


@dataclass(frozen=True)
class AuthorityLevyRow:
  """One TAG + AUTH levy row from a Levy % PDF table."""

  taxYear: int
  pdfTag: str
  authority: str
  description: str
  mills: float
  percentage: Optional[float]
  pageNumber: int


def _parse_float(value: Any) -> Optional[float]:
  """Parse a PDF/table numeric cell; commas allowed. None if empty or invalid."""
  if value is None:
    return None
  text = str(value).strip().replace(",", "")
  if not text:
    return None
  try:
    return float(text)
  except ValueError:
    return None


def _is_header_row(tag: Any, authority: Any, description: Any) -> bool:
  """True for repeating Levy % table header cells (TAG / AUTHORITY / DESCRIPTION)."""
  tag_s = (str(tag).strip() if tag is not None else "").upper()
  auth_s = (str(authority).strip() if authority is not None else "").upper()
  desc_s = (str(description).strip() if description is not None else "").upper()
  if tag_s == "TAG" or auth_s == "AUTHORITY" or desc_s == "DESCRIPTION":
    return True
  return False


def _is_total_row(authority: Any, description: Any) -> bool:
  """True for TAG subtotal rows labeled TOTAL (excluded from per-authority mills)."""
  auth_s = (str(authority).strip() if authority is not None else "").upper()
  desc_s = (str(description).strip() if description is not None else "").upper()
  return desc_s == "TOTAL" or auth_s == "TOTAL"


def parse_levy_percentage_table_rows(
  tax_year: int,
  table_rows: Sequence[Sequence[Any]],
  *,
  page_number: int = 1,
  starting_pdf_tag: Optional[str] = None,
) -> Tuple[List[AuthorityLevyRow], Optional[str]]:
  """
  Parse one pdfplumber table into AuthorityLevyRow values.

  TAG is only printed on the first row of each tax-area group; later rows
  leave TAG blank. Returns (rows, last_pdf_tag) so callers can carry the
  current TAG across page breaks.
  """
  rows: List[AuthorityLevyRow] = []
  current_tag = starting_pdf_tag

  for raw in table_rows:
    if not raw:
      continue
    # Some extractions tables are wider than 5; take the first five cells.
    cells = list(raw) + [None] * 5
    tag_cell, auth_cell, desc_cell, levy_cell, pct_cell = cells[:5]

    if _is_header_row(tag_cell, auth_cell, desc_cell):
      continue
    if _is_total_row(auth_cell, desc_cell):
      continue

    tag_text = str(tag_cell).strip() if tag_cell is not None else ""
    if tag_text:
      current_tag = tag_text

    auth_text = str(auth_cell).strip() if auth_cell is not None else ""
    if not auth_text or not re.fullmatch(r"\d{3,5}", auth_text):
      continue
    if not current_tag:
      continue

    mills = _parse_float(levy_cell)
    if mills is None:
      continue

    desc_text = str(desc_cell).strip() if desc_cell is not None else ""
    rows.append(
      AuthorityLevyRow(
        taxYear=tax_year,
        pdfTag=current_tag,
        authority=auth_text,
        description=desc_text,
        mills=mills,
        percentage=_parse_float(pct_cell),
        pageNumber=page_number,
      )
    )

  return rows, current_tag


def extract_rows_from_pdf(pdf_path: Path, tax_year: int) -> List[AuthorityLevyRow]:
  """Extract all TAG+AUTH levy rows from one Levy % PDF."""
  extracted: List[AuthorityLevyRow] = []
  current_tag: Optional[str] = None

  with pdfplumber.open(pdf_path) as pdf:
    for page_idx, page in enumerate(pdf.pages, start=1):
      for table in page.extract_tables() or []:
        page_rows, current_tag = parse_levy_percentage_table_rows(
          tax_year,
          table,
          page_number=page_idx,
          starting_pdf_tag=current_tag,
        )
        extracted.extend(page_rows)

  return extracted


def _resolve_mills_for_tag(values: Iterable[float]) -> Tuple[Optional[float], bool]:
  """
  Collapse mills seen for one (pdfTag, AUTH) pair.

  Returns (mills, had_conflict). Prefer a single non-zero when mixed with
  zeros (PDF sometimes lists both); otherwise require a unique value.
  """
  unique = sorted({round(v, 6) for v in values})
  if not unique:
    return None, False
  if len(unique) == 1:
    return unique[0], False
  non_zero = [v for v in unique if v != 0.0]
  if len(non_zero) == 1:
    return non_zero[0], True
  return None, True


def build_authority_mills_for_year(
  rows: Sequence[AuthorityLevyRow],
) -> Dict[str, Any]:
  """
  Collapse TAG+AUTH rows for one tax year into AUTH mills plus exceptions.

  When every PDF TAG shows the same mills for an AUTH, store AUTH -> mills.
  When mills vary by TAG, store TAG overrides under exceptions (PDF TAG keys)
  and set mills to the modal non-zero value when one dominates.
  """
  if not rows:
    return {
      "millsByAuthority": {},
      "namesByAuthority": {},
      "exceptions": {},
      "stats": {
        "rowCount": 0,
        "uniqueAuthorityCount": 0,
        "uniformAuthorityCount": 0,
        "exceptionAuthorityCount": 0,
        "tagAuthConflictCount": 0,
      },
    }

  tax_year = rows[0].taxYear
  # authority -> pdfTag -> set(mills)
  by_auth_tag: Dict[str, Dict[str, set]] = defaultdict(lambda: defaultdict(set))
  names: Dict[str, str] = {}
  tag_auth_conflicts = 0

  for row in rows:
    if row.taxYear != tax_year:
      raise ValueError(
        f"Mixed tax years in one collapse pass: {tax_year} vs {row.taxYear}"
      )
    by_auth_tag[row.authority][row.pdfTag].add(row.mills)
    if row.description and row.authority not in names:
      names[row.authority] = row.description

  mills_by_authority: Dict[str, float] = {}
  exceptions: Dict[str, Any] = {}

  for authority, tag_map in sorted(by_auth_tag.items()):
    resolved_by_tag: Dict[str, float] = {}
    for pdf_tag, mills_set in tag_map.items():
      mills, conflict = _resolve_mills_for_tag(mills_set)
      if conflict:
        tag_auth_conflicts += 1
      if mills is None:
        continue
      resolved_by_tag[pdf_tag] = mills

    distinct = sorted({round(v, 6) for v in resolved_by_tag.values()})
    if not distinct:
      continue

    if len(distinct) == 1:
      mills_by_authority[authority] = distinct[0]
      continue

    # Non-uniform across PDF TAGs: keep per-TAG map; pick a default for
    # AUTH-only joins (modal value, preferring non-zero).
    counts: Dict[float, int] = defaultdict(int)
    for mills in resolved_by_tag.values():
      counts[round(mills, 6)] += 1
    # Sort: highest count, then prefer non-zero, then higher mills.
    default_mills = sorted(
      counts.items(),
      key=lambda item: (item[1], item[0] != 0.0, item[0]),
      reverse=True,
    )[0][0]
    mills_by_authority[authority] = default_mills
    exceptions[authority] = {
      "name": names.get(authority),
      "defaultMills": default_mills,
      "byPdfTag": {
        tag: mills for tag, mills in sorted(resolved_by_tag.items())
      },
      "note": (
        "AUTH total mills vary by Levy % PDF TAG in this tax year. "
        "byPdfTag keys are PDF TAG codes, not Levy.aspx tagId."
      ),
    }

  return {
    "millsByAuthority": mills_by_authority,
    "namesByAuthority": names,
    "exceptions": exceptions,
    "stats": {
      "rowCount": len(rows),
      "uniqueAuthorityCount": len(by_auth_tag),
      "uniformAuthorityCount": len(by_auth_tag) - len(exceptions),
      "exceptionAuthorityCount": len(exceptions),
      "tagAuthConflictCount": tag_auth_conflicts,
    },
  }


def build_shipping_payload(
  year_results: Dict[int, Dict[str, Any]],
  *,
  source_files: Dict[int, str],
  bundled_as_of: Optional[str] = None,
) -> Dict[str, Any]:
  """
  Merge per-year collapses into public/data shipping JSON.

  Never invents a prior/current mills value when an AUTH is missing from
  a year's PDF. Tax year labels follow the county PDF (not budget year).
  """
  tax_years = sorted(year_results.keys())
  authorities: Dict[str, Any] = {}
  exceptions_by_tax_year: Dict[str, Any] = {}
  names: Dict[str, str] = {}

  for tax_year in tax_years:
    result = year_results[tax_year]
    for authority, name in result["namesByAuthority"].items():
      names.setdefault(authority, name)
    for authority, mills in result["millsByAuthority"].items():
      entry = authorities.setdefault(
        authority,
        {"name": names.get(authority), "millsByTaxYear": {}},
      )
      if entry.get("name") is None and authority in names:
        entry["name"] = names[authority]
      entry["millsByTaxYear"][str(tax_year)] = mills
    if result["exceptions"]:
      exceptions_by_tax_year[str(tax_year)] = result["exceptions"]

  sources = []
  for tax_year in tax_years:
    sources.append(
      {
        "taxYear": tax_year,
        "type": "taxing_district_levy_percentage",
        "title": f"Taxing District Levy Percentage - Tax Year {tax_year}",
        "file": source_files[tax_year],
      }
    )

  stats_by_year = {
    str(tax_year): year_results[tax_year]["stats"] for tax_year in tax_years
  }

  return {
    "_meta": {
      "bundledAsOf": bundled_as_of or date.today().isoformat(),
      "taxYears": tax_years,
      "joinKey": (
        "Stack line `code` (AUTH). Look up authorities[code].millsByTaxYear."
      ),
      "pdfTagNote": (
        "Levy % PDF TAG is a short tax-area code. It is not the same as "
        "Levy.aspx tagId in arapahoe-levy-stacks-by-tag-id.json. Exception "
        "maps use PDF TAG keys for audit; app YoY joins AUTH totals."
      ),
      "yearSemantics": (
        "Numbers are Tax Year mills from the county Levy % PDFs. "
        "Do not relabel Tax Year 2025 as budget year 2026."
      ),
      "sources": sources,
      "statsByTaxYear": stats_by_year,
    },
    "authorities": dict(sorted(authorities.items())),
    "exceptionsByTaxYear": exceptions_by_tax_year,
  }


def write_outputs(
  out_path: Path,
  payload: Dict[str, Any],
  raw_by_year: Dict[int, List[AuthorityLevyRow]],
  *,
  audit_dir: Optional[Path] = DEFAULT_AUDIT_DIR,
) -> None:
  """Write shipping JSON and optional raw-row audit files."""
  out_path.parent.mkdir(parents=True, exist_ok=True)
  out_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

  if audit_dir is None:
    return

  audit_dir.mkdir(parents=True, exist_ok=True)
  for tax_year, rows in sorted(raw_by_year.items()):
    raw_path = audit_dir / f"authority-mills-{tax_year}-raw.json"
    raw_payload = {
      "taxYear": tax_year,
      "rowCount": len(rows),
      "rows": [asdict(r) for r in rows],
    }
    raw_path.write_text(json.dumps(raw_payload, indent=2) + "\n", encoding="utf-8")


def resolve_pdf_by_year(
  overrides: Optional[Sequence[Tuple[str, str | Path]]],
) -> Dict[int, Path]:
  """Merge default Levy % PDF paths with optional --pdf YEAR PATH overrides."""
  pdf_by_year: Dict[int, Path] = dict(DEFAULT_PDF_BY_YEAR)
  if not overrides:
    return pdf_by_year
  for tax_year_text, pdf_path in overrides:
    try:
      tax_year = int(tax_year_text)
    except ValueError as exc:
      raise SystemExit(f"Invalid tax year for --pdf: {tax_year_text!r}") from exc
    pdf_by_year[tax_year] = Path(pdf_path)
  return pdf_by_year


def main() -> None:
  """CLI: read Levy % PDFs for bundled tax years; write shipping JSON."""
  parser = argparse.ArgumentParser(
    description=(
      "Extract AUTH total mills by tax year from Taxing District Levy "
      "Percentage PDFs."
    )
  )
  parser.add_argument(
    "--pdf",
    nargs=2,
    metavar=("YEAR", "PATH"),
    action="append",
    default=None,
    help=(
      "Tax year and Levy % PDF path (repeatable). "
      "Default: all years in DEFAULT_PDF_BY_YEAR (2018-2025)."
    ),
  )
  parser.add_argument(
    "--out",
    type=Path,
    default=DEFAULT_OUT,
    help="Path to write shipping JSON under public/data/.",
  )
  parser.add_argument(
    "--no-audit",
    action="store_true",
    help="Skip writing raw-row audit JSON under supporting-data/.",
  )
  parser.add_argument(
    "--audit-dir",
    type=Path,
    default=DEFAULT_AUDIT_DIR,
    help="Directory for optional raw-row audit JSON.",
  )

  args = parser.parse_args()
  pdf_by_year = resolve_pdf_by_year(args.pdf)

  year_results: Dict[int, Dict[str, Any]] = {}
  raw_by_year: Dict[int, List[AuthorityLevyRow]] = {}
  source_files: Dict[int, str] = {}

  for tax_year, pdf_path in sorted(pdf_by_year.items()):
    if not pdf_path.is_file():
      raise SystemExit(f"Missing PDF for tax year {tax_year}: {pdf_path}")
    rows = extract_rows_from_pdf(pdf_path, tax_year)
    if not rows:
      raise SystemExit(f"No levy rows extracted from {pdf_path}")
    raw_by_year[tax_year] = rows
    year_results[tax_year] = build_authority_mills_for_year(rows)
    source_files[tax_year] = str(pdf_path)
    stats = year_results[tax_year]["stats"]
    print(
      f"Tax Year {tax_year}: {stats['rowCount']} rows, "
      f"{stats['uniqueAuthorityCount']} AUTH "
      f"({stats['exceptionAuthorityCount']} with TAG variance) "
      f"from {pdf_path}"
    )

  payload = build_shipping_payload(year_results, source_files=source_files)
  write_outputs(
    args.out,
    payload,
    raw_by_year,
    audit_dir=None if args.no_audit else args.audit_dir,
  )
  print(
    f"Wrote {len(payload['authorities'])} authorities to {args.out}"
  )


if __name__ == "__main__":
  main()
