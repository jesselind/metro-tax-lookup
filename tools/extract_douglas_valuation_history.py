#!/usr/bin/env python3
# Metro Tax Lookup
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
Aggregate Douglas Realware detail JSON into slim valuation-history shards.

Reads retained detail files under supporting-data/douglas/realware-detail/{year}/.
Writes {county}-valuation-history-by-account/{prefix}.json for ship under
public/data/ (or --out-dir for prove-out).

Usage (from repo root):
  python3 tools/extract_douglas_valuation_history.py
  python3 tools/extract_douglas_valuation_history.py --detail-dir supporting-data/douglas/realware-detail/2026
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any

TOOLS_DIR = Path(__file__).resolve().parent
REPO_ROOT = TOOLS_DIR.parent
DEFAULT_STAMP_FILE = TOOLS_DIR / "douglas-realware-detail-stamp.txt"
DEFAULT_BUNDLED_AS_OF_FILE = TOOLS_DIR / "douglas-data-as-of.txt"
DEFAULT_DETAIL_ROOT = REPO_ROOT / "supporting-data/douglas/realware-detail"
DEFAULT_OUT_DIR = REPO_ROOT / "supporting-data/_ingest-out/douglas"
COUNTY_ID = "douglas"
SHARD_PREFIX_LEN = 6


def read_text_file(path: Path) -> str:
  return path.read_text(encoding="utf-8").strip()


def aggregate_values_by_tax_year(rows: list[dict[str, Any]]) -> list[dict[str, int]]:
  by_year: dict[int, dict[str, int]] = defaultdict(
    lambda: {"actualValue": 0, "assessedValue": 0},
  )
  for row in rows:
    year_raw = row.get("taxYear")
    if year_raw is None:
      continue
    try:
      year = int(float(year_raw))
    except (TypeError, ValueError):
      continue
    actual = row.get("actualValue")
    assessed = row.get("assessedValue")
    try:
      if actual is not None:
        by_year[year]["actualValue"] += int(round(float(actual)))
      if assessed is not None:
        by_year[year]["assessedValue"] += int(round(float(assessed)))
    except (TypeError, ValueError):
      continue
  return [
    {
      "taxYear": year,
      "actualValue": totals["actualValue"],
      "assessedValue": totals["assessedValue"],
    }
    for year, totals in sorted(by_year.items())
  ]


def account_from_detail(payload: dict[str, Any], fallback_name: str) -> str | None:
  for key in ("accountNumber", "accountNo", "account_no"):
    raw = payload.get(key)
    if isinstance(raw, str) and raw.strip():
      return raw.strip().upper()
  stem = Path(fallback_name).stem
  return stem.upper() if stem else None


def parse_detail_file(path: Path) -> tuple[str, list[dict[str, int]]] | None:
  try:
    payload = json.loads(path.read_text(encoding="utf-8"))
  except (OSError, json.JSONDecodeError):
    return None
  if not isinstance(payload, dict):
    return None
  account = account_from_detail(payload, path.name)
  if not account:
    return None
  rows = payload.get("valuesByAbstractCode")
  if not isinstance(rows, list) or not rows:
    return None
  history = aggregate_values_by_tax_year(rows)
  if not history:
    return None
  return account, history


def load_manifest(detail_parent: Path) -> dict[str, Any]:
  manifest_path = detail_parent / "manifest.json"
  if not manifest_path.is_file():
    return {}
  try:
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
  except json.JSONDecodeError:
    return {}
  return data if isinstance(data, dict) else {}


def write_shards(
  out_dir: Path,
  by_account: dict[str, list[dict[str, int]]],
  *,
  bundled_as_of: str,
  stamp_year: str,
  process_run_date: str | None,
  pin_digits: int,
) -> int:
  shard_dir = out_dir / f"{COUNTY_ID}-valuation-history-by-account"
  if shard_dir.exists():
    for old in shard_dir.glob("*.json"):
      old.unlink()
  shard_dir.mkdir(parents=True, exist_ok=True)

  shards: dict[str, dict[str, list[dict[str, int]]]] = defaultdict(dict)
  for account, history in by_account.items():
    if len(account) < SHARD_PREFIX_LEN:
      continue
    prefix = account[:SHARD_PREFIX_LEN]
    if not re.fullmatch(r"[A-Za-z0-9]+", prefix):
      continue
    shards[prefix][account] = history

  snapshot = {
    "bundledAsOf": bundled_as_of,
    "source": (
      f"Douglas Assessor Realware detail JSON ({stamp_year} stamp); "
      "valuesByAbstractCode summed per taxYear"
    ),
    "stampYear": stamp_year,
  }
  if process_run_date:
    snapshot["processRunDate"] = process_run_date

  total_bytes = 0
  for prefix in sorted(shards):
    path = shard_dir / f"{prefix}.json"
    body = {
      "snapshot": snapshot,
      "pinDigits": pin_digits,
      "shardPrefix": prefix,
      "byAccount": shards[prefix],
    }
    text = json.dumps(body, separators=(",", ":"), ensure_ascii=False)
    path.write_text(text, encoding="utf-8")
    total_bytes += path.stat().st_size

  return total_bytes


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument(
    "--stamp-year",
    help="Realware stamp folder name (default: tools/douglas-realware-detail-stamp.txt)",
  )
  parser.add_argument(
    "--detail-dir",
    type=Path,
    help="Directory of per-account detail JSON (default: .../realware-detail/{year})",
  )
  parser.add_argument(
    "--out-dir",
    type=Path,
    default=DEFAULT_OUT_DIR,
    help="Ship root (default: public/data)",
  )
  parser.add_argument(
    "--bundled-as-of",
    help="Snapshot date (default: tools/douglas-data-as-of.txt)",
  )
  parser.add_argument(
    "--pin-digits",
    type=int,
    default=8,
    help="Douglas account id length",
  )
  return parser.parse_args()


def main() -> None:
  args = parse_args()
  stamp_year = (args.stamp_year or read_text_file(DEFAULT_STAMP_FILE)).strip()
  detail_dir = args.detail_dir or (DEFAULT_DETAIL_ROOT / stamp_year)
  if not detail_dir.is_dir():
    raise SystemExit(f"detail dir not found: {detail_dir}")

  bundled_as_of = (
    args.bundled_as_of
    or read_text_file(DEFAULT_BUNDLED_AS_OF_FILE)
    or date.today().isoformat()
  )
  manifest = load_manifest(detail_dir.parent)
  process_run_date = manifest.get("processRunDate")

  by_account: dict[str, list[dict[str, int]]] = {}
  skipped = 0
  files = sorted(detail_dir.glob("*.json"))
  if not files:
    raise SystemExit(f"no detail JSON in {detail_dir}")

  for path in files:
    parsed = parse_detail_file(path)
    if not parsed:
      skipped += 1
      continue
    account, history = parsed
    by_account[account] = history

  if not by_account:
    raise SystemExit("no valuation history extracted")

  total_bytes = write_shards(
    args.out_dir,
    by_account,
    bundled_as_of=bundled_as_of,
    stamp_year=stamp_year,
    process_run_date=process_run_date if isinstance(process_run_date, str) else None,
    pin_digits=args.pin_digits,
  )

  print(
    f"wrote {len(by_account)} accounts to "
    f"{args.out_dir / f'{COUNTY_ID}-valuation-history-by-account'} "
    f"({total_bytes / (1024 * 1024):.1f} MiB); skipped {skipped} files",
    file=sys.stderr,
  )


if __name__ == "__main__":
  main()
