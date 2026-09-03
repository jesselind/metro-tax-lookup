#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
Extract Douglas AUTH total mills by tax year from Tax Districts and Mill
Levies PDFs into shipping JSON (same shape as the Arapahoe Levy % extract).

This script is NOT part of the web runtime. Run it manually when new mill
PDFs are published (developer tool).

Usage (from project root, after `tools/requirements.txt`):

  python tools/extract_douglas_authority_mills_by_tax_year.py

Tax Year 2021 uses the hub's unversioned filename
`tax-districts-mill-levies.pdf`; other years use
`{year}-tax-districts-and-mill-levies.pdf`.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
  sys.path.insert(0, str(TOOLS_DIR))

from extract_authority_mills_by_tax_year import (  # noqa: E402
    AuthorityLevyRow,
    build_authority_mills_for_year,
    build_rate_table_page_payload,
    build_shipping_payload,
    write_outputs,
)
from ingest.mill_pdf import (  # noqa: E402
    extract_pdf_page_texts,
    parse_tax_district_mill_pdf_texts,
    tax_year_from_mill_pdf_texts,
)

DEFAULT_PDF_BY_YEAR: Dict[int, Path] = {
  2020: Path("supporting-data/douglas/2020-tax-districts-and-mill-levies.pdf"),
  2021: Path("supporting-data/douglas/2021-tax-districts-and-mill-levies.pdf"),
  2022: Path("supporting-data/douglas/2022-tax-districts-and-mill-levies.pdf"),
  2023: Path("supporting-data/douglas/2023-tax-districts-and-mill-levies.pdf"),
  2024: Path("supporting-data/douglas/2024-tax-districts-and-mill-levies.pdf"),
  2025: Path("supporting-data/douglas/2025-tax-districts-and-mill-levies.pdf"),
}

# Hub file for 2021 is unversioned (`tax-districts-mill-levies.pdf`).
RESIDENT_URL_BY_TAX_YEAR: Dict[int, str] = {
  2020: "https://www.douglasco.gov/documents/2020-tax-districts-and-mill-levies.pdf",
  2021: "https://www.douglasco.gov/documents/tax-districts-mill-levies.pdf",
  2022: "https://www.douglasco.gov/documents/2022-tax-districts-and-mill-levies.pdf",
  2023: "https://www.douglasco.gov/documents/2023-tax-districts-and-mill-levies.pdf",
  2024: "https://www.douglasco.gov/documents/2024-tax-districts-and-mill-levies.pdf",
  2025: "https://www.douglasco.gov/documents/2025-tax-districts-and-mill-levies.pdf",
}

DEFAULT_OUT = Path("public/data/douglas-authority-mills-by-tax-year.json")
DEFAULT_PAGE_OUT = Path("public/data/douglas-authority-rate-table-pages.json")
DEFAULT_AUTHORITY_CHAIN = Path("public/data/levy-authority-chain-entries.json")
DEFAULT_REGISTRY = Path("public/data/cross-county-authority-registry.json")
DEFAULT_AUDIT_DIR = Path("supporting-data/douglas-authority-mills")

DOUGLAS_JOIN_KEY = (
  "Stack line `code` (AUTH). Look up authorities[code].millsByTaxYear."
)
DOUGLAS_PDF_TAG_NOTE = (
  "Mill PDF tax-district number is parcel tagShortDescr zero-padded to four "
  "digits (same join as levy stacks). Exception maps use those tax-district "
  "keys for audit; app YoY joins AUTH totals."
)
DOUGLAS_YEAR_SEMANTICS = (
  "Numbers are Tax Year mills from Douglas Tax Districts and Mill Levies "
  "PDFs. Do not relabel Tax Year 2025 as budget year 2026."
)


def mill_pdf_rows_to_authority_levy_rows(
  rows: Sequence[dict[str, Any]],
  tax_year: int,
) -> List[AuthorityLevyRow]:
  """Map mill-PDF stack rows to the shared AUTH collapse row type."""
  out: List[AuthorityLevyRow] = []
  for row in rows:
    mills_raw = row.get("millLevy")
    if mills_raw is None:
      continue
    try:
      mills = float(mills_raw)
    except (TypeError, ValueError):
      continue
    page_raw = row.get("pageNumber")
    try:
      page_number = int(page_raw) if page_raw is not None else 1
    except (TypeError, ValueError):
      page_number = 1
    if page_number < 1:
      page_number = 1
    out.append(
      AuthorityLevyRow(
        taxYear=tax_year,
        pdfTag=str(row.get("taxAreaId") or "").strip(),
        authority=str(row.get("lineCode") or "").strip(),
        description=str(row.get("authorityName") or "").strip(),
        mills=mills,
        percentage=None,
        pageNumber=page_number,
      )
    )
  return [r for r in out if r.pdfTag and r.authority]


def extract_rows_from_mill_pdf(pdf_path: Path, tax_year: int) -> List[AuthorityLevyRow]:
  """Extract TAG (tax-district) + AUTH mill rows from one Douglas mill PDF."""
  texts = extract_pdf_page_texts(pdf_path)
  parsed_year = tax_year_from_mill_pdf_texts(texts)
  if parsed_year and parsed_year != str(tax_year):
    raise SystemExit(
      f"{pdf_path}: PDF title year {parsed_year} does not match --pdf year {tax_year}"
    )
  parsed = parse_tax_district_mill_pdf_texts(texts, tax_year=str(tax_year))
  rows = mill_pdf_rows_to_authority_levy_rows(parsed, tax_year)
  if not rows:
    raise SystemExit(f"No mill rows extracted from {pdf_path}")
  return rows


def authority_codes_for_douglas_page_map(
  chain_path: Path,
  registry_path: Path,
) -> List[str]:
  """Curated AUTH codes that need mill-PDF page deep-links for Douglas."""
  codes: set[str] = set()
  chain = json.loads(chain_path.read_text(encoding="utf-8"))
  for entry in chain.get("entries", []):
    match = entry.get("match") or {}
    code = str(match.get("levyLineCode") or "").strip()
    if code:
      codes.add(code)
  registry = json.loads(registry_path.read_text(encoding="utf-8"))
  for row in registry.get("authorities", []):
    by_county = row.get("levyLineCodeByCounty") or {}
    code = str(by_county.get("douglas") or "").strip()
    if code:
      codes.add(code)
  return sorted(codes)


def resolve_pdf_by_year(
  overrides: Optional[Sequence[Tuple[str, str | Path]]],
) -> Dict[int, Path]:
  """Merge default mill PDF paths with optional --pdf YEAR PATH overrides."""
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
  """CLI: read Douglas mill PDFs; write AUTH mills + page-map JSON."""
  parser = argparse.ArgumentParser(
    description=(
      "Extract AUTH total mills by tax year from Douglas Tax Districts "
      "and Mill Levies PDFs."
    )
  )
  parser.add_argument(
    "--pdf",
    nargs=2,
    metavar=("YEAR", "PATH"),
    action="append",
    default=None,
    help=(
      "Tax year and mill PDF path (repeatable). "
      "Default: all years in DEFAULT_PDF_BY_YEAR (2020-2025)."
    ),
  )
  parser.add_argument(
    "--out",
    type=Path,
    default=DEFAULT_OUT,
    help="Path to write shipping JSON under public/data/.",
  )
  parser.add_argument(
    "--page-out",
    type=Path,
    default=DEFAULT_PAGE_OUT,
    help="Path to write curated AUTH mill-PDF page lookup JSON.",
  )
  parser.add_argument(
    "--authority-chain",
    type=Path,
    default=DEFAULT_AUTHORITY_CHAIN,
    help="Curated authority-chain JSON (levyLineCode AUTH codes).",
  )
  parser.add_argument(
    "--registry",
    type=Path,
    default=DEFAULT_REGISTRY,
    help="Cross-county registry (Douglas levyLineCodeByCounty AUTH codes).",
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
    rows = extract_rows_from_mill_pdf(pdf_path, tax_year)
    raw_by_year[tax_year] = rows
    year_results[tax_year] = build_authority_mills_for_year(rows)
    source_files[tax_year] = str(pdf_path)
    stats = year_results[tax_year]["stats"]
    print(
      f"Tax Year {tax_year}: {stats['rowCount']} rows, "
      f"{stats['uniqueAuthorityCount']} AUTH "
      f"({stats['exceptionAuthorityCount']} with tax-district variance) "
      f"from {pdf_path}"
    )

  bundled_as_of = date.today().isoformat()
  payload = build_shipping_payload(
    year_results,
    source_files=source_files,
    bundled_as_of=bundled_as_of,
    resident_url_by_tax_year=RESIDENT_URL_BY_TAX_YEAR,
    source_type="tax_districts_and_mill_levies",
    source_title_template="{taxYear} Tax Districts and Mill Levies",
    join_key=DOUGLAS_JOIN_KEY,
    pdf_tag_note=DOUGLAS_PDF_TAG_NOTE,
    year_semantics=DOUGLAS_YEAR_SEMANTICS,
  )
  authority_codes = authority_codes_for_douglas_page_map(
    args.authority_chain,
    args.registry,
  )
  page_payload = build_rate_table_page_payload(
    raw_by_year,
    authority_codes,
    bundled_as_of=bundled_as_of,
  )
  write_outputs(
    args.out,
    payload,
    raw_by_year,
    audit_dir=None if args.no_audit else args.audit_dir,
  )
  print(f"Wrote {len(payload['authorities'])} authorities to {args.out}")
  args.page_out.parent.mkdir(parents=True, exist_ok=True)
  args.page_out.write_text(
    json.dumps(page_payload, indent=2) + "\n",
    encoding="utf-8",
  )
  print(
    f"Wrote rate-table pages for "
    f"{len(page_payload['pagesByAuthority'])} authorities to {args.page_out}"
  )


if __name__ == "__main__":
  main()
