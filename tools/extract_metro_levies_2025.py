"""
One-off utility to extract metropolitan district levy data for 2025
from the Mill Levy Public Information PDF (Tax Year 2024/Budget Year 2025)
into our normalized JSON format used by the app.

This script is NOT part of the web runtime. It is a developer tool
you run manually when new levy PDFs are published.

Usage (from project root, after installing dependencies listed in
`tools/requirements.txt`):

  python tools/extract_metro_levies_2025.py \\
    --pdf supporting-data/Mill\\ Levy\\ Public\\ Information\\ Form.pdf \\
    --out supporting-data/metro-levies-2025.json

Use the 2025 Mill Levy Public Information Form PDF when available;
the layout is the same as the 2026 extractor.
"""

from __future__ import annotations

import argparse
import json
from datetime import date
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional

import pdfplumber
import re


@dataclass
class RawRow:
  """Single extracted table row from the PDF, kept for auditability."""

  row_index: int
  page_number: int
  source_table_index: int
  data: Dict[str, Any]


@dataclass
class Levy:
  purposeRaw: str
  purposeCategory: str
  rateMillsCurrent: Optional[float]
  rateMillsPrevious: Optional[float]
  revenuePrevious: Optional[float]
  millLevyMax: Optional[float]
  taborExempt: Optional[bool]
  statutory55Limit: Optional[bool]
  statutory525Limit: Optional[bool]
  subjectToOtherLimits: Optional[bool]
  needsAdjustment: Optional[bool]
  adjustmentAmount: Optional[float]
  notes: Optional[str]
  rawRowIndex: int


@dataclass
class Aggregates:
  opsMills: float
  debtMills: float
  otherMills: float
  totalMills: float
  audit: Dict[str, Any]


@dataclass
class District:
  districtId: str
  countyId: str
  lgid: str
  subdistrict: Optional[str]
  name: str
  type: str
  levies: List[Levy]
  aggregates: Aggregates


def extract_lines(pdf_path: Path) -> List[RawRow]:
  """
  Extract levy lines from the PDF as plain text.

  We treat each relevant text line as a RawRow with the original text
  preserved for auditability. Table extraction is intentionally avoided.
  """
  raw_rows: List[RawRow] = []
  global_row_index = 0

  with pdfplumber.open(pdf_path) as pdf:
    for page_idx, page in enumerate(pdf.pages, start=1):
      text = page.extract_text() or ""
      for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
          continue
        # Skip obvious header/footer lines
        if stripped.startswith("Mill Levy Public Information"):
          continue
        if stripped.startswith("COUNTY ID") or stripped.startswith("Page "):
          continue
        raw_rows.append(
          RawRow(
            row_index=global_row_index,
            page_number=page_idx,
            source_table_index=0,
            data={"text": stripped},
          )
        )
        global_row_index += 1

  return raw_rows


def _parse_float(value: Any) -> Optional[float]:
  if value is None:
    return None
  text = str(value).strip()
  if not text:
    return None
  # Some cells may contain "-" to indicate not applicable
  if text == "-":
    return None
  try:
    # Rates and revenues use "." as decimal separator and may contain commas
    return float(text.replace(",", ""))
  except ValueError:
    return None


def _parse_bool(value: Any) -> Optional[bool]:
  if value is None:
    return None
  text = str(value).strip().lower()
  if not text:
    return None
  if text in {"y", "yes"}:
    return True
  if text in {"n", "no"}:
    return False
  return None


def _classify_district_type(name: str) -> str:
  n = name.lower()
  if "metropolitan district" in n or "metro district" in n or "metropolitan improvement district" in n:
    return "metro"
  if "city of" in n or "town of" in n or "city " in n:
    return "city"
  if "school district" in n:
    return "school"
  if "county" in n:
    return "county"
  return "other"


def _classify_purpose(purpose: str) -> str:
  """
  Map MILL LEVY NAME/PURPOSE to a coarse category used in aggregates.

  Rules are deterministic and conservative: if a line mixes operating
  and debt concepts (e.g. 'General Operating/Bonds'), we classify it as
  'other' so that 'debtMills' reflects clearly debt-only lines.
  """
  p = purpose.lower()

  # Pure debt-ish purposes
  debt_markers = [
    "debt service",
    "bond",
    "bonds",
    "bond redemption",
    "pension plan",
    "ari",  # Aurora Regional Improvements – treated as debt-like
    "contractual obligation",
  ]
  if any(m in p for m in debt_markers):
    # If it ALSO clearly includes "general operating" etc, treat as mixed/other
    if "general operating" in p or "total" in p:
      return "other"
    return "debt_service"

  # Operating-ish purposes
  ops_markers = [
    "general operating",
    "total program",
    "operations & technology",
    "operations and technology",
    "operations and tech",
    "operations & tech",
  ]
  if any(m in p for m in ops_markers):
    return "operations"

  # Some "Total" lines summarize all levies; keep them out of aggregates
  if p.strip() == "total":
    return "other"

  return "other"


def _build_district_id(county_id: str, lgid: str, subdistrict: Optional[str]) -> str:
  sub = subdistrict if subdistrict not in (None, "", "-") else "0"
  return f"{county_id}-{lgid}-{sub}"


def _tokenize(line: str) -> List[str]:
  return line.split()


def _looks_like_county_and_lgid(tokens: List[str]) -> bool:
  if len(tokens) < 3:
    return False
  if not tokens[0].isdigit():
    return False
  if not tokens[1].isdigit():
    return False
  return True


def _parse_leading_ids(
  tokens: List[str],
) -> Optional[tuple[str, str, Optional[str], List[str]]]:
  """
  Parse county_id, lgid, optional subdistrict, and remainder from line tokens.
  Returns (county_id, lgid, subdistrict, remainder) or None if not parseable.

  Handles both:
  - Normal: "4298 3131 East Smoky Hill..." (two numeric tokens).
  - Concatenated: "429703130 East Smoky Hill..." (one numeric token split into county+lgid).
  """
  if len(tokens) < 3:
    return None
  if tokens[0].isdigit() and tokens[1].isdigit():
    county_id = tokens[0]
    lgid = tokens[1]
    cursor = 2
    subdistrict: Optional[str] = None
    if cursor < len(tokens) and re.fullmatch(r"\d{1,3}", tokens[cursor]):
      subdistrict = tokens[cursor]
      cursor += 1
    return (county_id, lgid, subdistrict, tokens[cursor:])
  # Fallback: single concatenated county+lgid (e.g. "429703130" -> 4297, 03130)
  if (
    tokens[0].isdigit()
    and len(tokens[0]) >= 5
    and not tokens[1].isdigit()
  ):
    raw = tokens[0]
    county_id = raw[:4]
    lgid = raw[4:]
    if lgid and lgid.isdigit():
      return (county_id, lgid, None, tokens[1:])
  return None


def _split_name_and_purpose(tokens: List[str]) -> tuple[List[str], List[str], int]:
  """
  Given tokens AFTER countyId / lgid / optional subdistrict, split into:
  - name_tokens
  - purpose_tokens
  - index of first token AFTER purpose (i.e., where numeric fields begin)
  """
  if not tokens:
    return [], [], 0

  purpose_starts = {
    "general",
    "debt",
    "bonds",
    "bond",
    "total",
    "contractual",
    "pension",
    "abatement",
    "operations",
    "aurora",
    "developmental",
  }

  start_idx = 0
  for i, tok in enumerate(tokens):
    if tok.lower() in purpose_starts:
      start_idx = i
      break
  else:
    for i, tok in enumerate(tokens):
      if _parse_float(tok) is not None:
        return tokens[:i], [], i
    return tokens, [], len(tokens)

  end_idx = start_idx
  for j in range(start_idx, len(tokens)):
    if _parse_float(tokens[j]) is not None:
      end_idx = j
      break
  else:
    end_idx = len(tokens)

  name_tokens = tokens[:start_idx]
  purpose_tokens = tokens[start_idx:end_idx]
  return name_tokens, purpose_tokens, end_idx


def normalize_metro_districts_from_lines(raw_rows: List[RawRow]) -> Dict[str, Any]:
  """
  Transform the extracted table into the final JSON-friendly structure.

  This function is Arapahoe-2025-specific in its expectations about the
  Mill Levy Public Information layout for Tax Year 2024/Budget Year 2025.
  """

  districts_by_id: Dict[str, District] = {}

  for raw in raw_rows:
    line = str(raw.data.get("text", "") or "").strip()
    if not line:
      continue

    tokens = _tokenize(line)
    parsed = _parse_leading_ids(tokens)
    if not parsed:
      continue

    county_id, lgid, subdistrict, remainder = parsed
    if not remainder:
      continue

    name_tokens, purpose_tokens, after_purpose_idx = _split_name_and_purpose(remainder)
    if not name_tokens or not purpose_tokens:
      continue

    name_raw = " ".join(name_tokens)
    purpose_raw = " ".join(purpose_tokens)

    numeric_tokens = remainder[after_purpose_idx:]
    if not numeric_tokens:
      continue

    idx = 0
    rate_curr = _parse_float(numeric_tokens[idx]) if idx < len(numeric_tokens) else None
    idx += 1
    rate_prev = _parse_float(numeric_tokens[idx]) if idx < len(numeric_tokens) else None
    idx += 1
    rev_prev = _parse_float(numeric_tokens[idx]) if idx < len(numeric_tokens) else None
    idx += 1
    mill_max = _parse_float(numeric_tokens[idx]) if idx < len(numeric_tokens) else None
    idx += 1
    allow_growth = _parse_float(numeric_tokens[idx]) if idx < len(numeric_tokens) else None
    idx += 1
    actual_growth = _parse_float(numeric_tokens[idx]) if idx < len(numeric_tokens) else None
    idx += 1

    bool_fields: List[Optional[bool]] = []
    for _ in range(5):
      if idx >= len(numeric_tokens):
        bool_fields.append(None)
        continue
      b = _parse_bool(numeric_tokens[idx])
      if b is None and numeric_tokens[idx] not in {"y", "Y", "n", "N"}:
        bool_fields.append(None)
      else:
        bool_fields.append(b)
      idx += 1

    tabor_exempt, limit_55, limit_525, subj_other, needs_adj = bool_fields

    adj_amt = _parse_float(numeric_tokens[idx]) if idx < len(numeric_tokens) else None
    if adj_amt is not None:
      idx += 1

    notes_tokens = numeric_tokens[idx:] if idx < len(numeric_tokens) else []
    notes = " ".join(notes_tokens).strip() or None

    purpose_category = _classify_purpose(purpose_raw)
    district_id = _build_district_id(county_id, lgid, subdistrict)
    raw_index = raw.row_index

    levy = Levy(
      purposeRaw=purpose_raw,
      purposeCategory=purpose_category,
      rateMillsCurrent=rate_curr,
      rateMillsPrevious=rate_prev,
      revenuePrevious=rev_prev,
      millLevyMax=mill_max,
      taborExempt=tabor_exempt,
      statutory55Limit=limit_55,
      statutory525Limit=limit_525,
      subjectToOtherLimits=subj_other,
      needsAdjustment=needs_adj,
      adjustmentAmount=adj_amt,
      notes=notes,
      rawRowIndex=raw_index,
    )

    if district_id not in districts_by_id:
      dtype = _classify_district_type(name_raw)
      districts_by_id[district_id] = District(
        districtId=district_id,
        countyId=county_id,
        lgid=lgid,
        subdistrict=subdistrict,
        name=name_raw,
        type=dtype,
        levies=[],
        aggregates=Aggregates(
          opsMills=0.0,
          debtMills=0.0,
          otherMills=0.0,
          totalMills=0.0,
          audit={"rowCount": 0, "opsRowIds": [], "debtRowIds": []},
        ),
      )

    districts_by_id[district_id].levies.append(levy)

  # Compute aggregates per district
  for district in districts_by_id.values():
    ops = 0.0
    debt = 0.0
    other = 0.0
    ops_rows: List[int] = []
    debt_rows: List[int] = []

    for levy in district.levies:
      rate = levy.rateMillsCurrent or 0.0
      if levy.purposeCategory == "operations":
        ops += rate
        ops_rows.append(levy.rawRowIndex)
      elif levy.purposeCategory == "debt_service":
        debt += rate
        debt_rows.append(levy.rawRowIndex)
      else:
        other += rate

    total = ops + debt + other
    district.aggregates = Aggregates(
      opsMills=ops,
      debtMills=debt,
      otherMills=other,
      totalMills=total,
      audit={
        "rowCount": len(district.levies),
        "opsRowIds": ops_rows,
        "debtRowIds": debt_rows,
      },
    )

  # Build indexes for quick lookup
  by_lgid: Dict[str, List[str]] = {}
  by_name: Dict[str, List[str]] = {}

  for d in districts_by_id.values():
    by_lgid.setdefault(d.lgid, []).append(d.districtId)
    by_name.setdefault(d.name.upper(), []).append(d.districtId)

  districts_payload = [
    {
      **{
        "districtId": d.districtId,
        "countyId": d.countyId,
        "lgid": d.lgid,
        "subdistrict": d.subdistrict,
        "name": d.name,
        "type": d.type,
      },
      "levies": [asdict(l) for l in d.levies],
      "aggregates": asdict(d.aggregates),
    }
    for d in sorted(districts_by_id.values(), key=lambda x: (x.countyId, x.lgid, x.subdistrict or ""))
  ]

  return {
    "year": 2025,
    "snapshot": {
      "bundledAsOf": date.today().isoformat(),
    },
    "source": {
      "type": "mill_levy_public_information",
      "title": "Mill Levy Public Information pursuant to C.R.S. 39-1-125 (1)(c) for Tax Year 2024/Budget Year 2025",
      "file": "supporting-data/Mill Levy Public Information Form.pdf",
    },
    "schema": {
      "districtId": "string; stable key `${countyId}-${lgid}-${subdistrict || '0'}`",
      "countyId": "string; COUNTY ID from the PDF",
      "lgid": "string; LG ID from the PDF",
      "subdistrict": "string | null; SUBDIST. # if present",
      "name": "string; LOCAL GOVERNMENT NAME exactly as in PDF",
      "type": "string; 'metro', 'city', 'school', 'county', 'other'",
      "levies": "array of per-purpose levy lines, see code comments",
      "aggregates": "precomputed sums of operations/debt/other mills with row indexes for audit",
    },
    "districts": districts_payload,
    "indexes": {
      "byLgid": by_lgid,
      "byName": by_name,
    },
  }


def write_outputs(
  out_path: Path,
  normalized: Dict[str, Any],
  raw_rows: List[RawRow],
) -> None:
  """
  Write the normalized JSON plus a raw-rows audit file next to it.
  """
  out_path.write_text(json.dumps(normalized, indent=2), encoding="utf-8")

  raw_path = out_path.with_name(out_path.stem + "-raw.json")
  raw_payload = {
    "year": 2025,
    "sourceFile": "supporting-data/Mill Levy Public Information Form.pdf",
    "rows": [asdict(r) for r in raw_rows],
  }
  raw_path.write_text(json.dumps(raw_payload, indent=2), encoding="utf-8")


def main() -> None:
  parser = argparse.ArgumentParser(
    description="Extract metropolitan district levies for 2025 into JSON."
  )
  parser.add_argument(
    "--pdf",
    type=Path,
    default=Path("supporting-data/Mill Levy Public Information Form.pdf"),
    help="Path to the Mill Levy Public Information Form PDF (2025).",
  )
  parser.add_argument(
    "--out",
    type=Path,
    default=Path("supporting-data/metro-levies-2025.json"),
    help="Path to write the normalized JSON file.",
  )

  args = parser.parse_args()

  raw_rows = extract_lines(args.pdf)
  normalized = normalize_metro_districts_from_lines(raw_rows)
  write_outputs(args.out, normalized, raw_rows)

  metro_count = sum(1 for d in normalized["districts"] if d["type"] == "metro")
  print(
    f"Wrote {len(normalized['districts'])} district entries "
    f"({metro_count} classified as metro) to {args.out}"
  )


if __name__ == "__main__":
  main()
