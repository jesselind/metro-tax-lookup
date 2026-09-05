#!/usr/bin/env python3
# Metro Tax Lookup
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
Download Douglas Assessor Realware detail JSON for build-time retain.

Per-account files the Assessor SPA already loads:
  https://apps.douglas.co.us/realware/DATA/{STAMP_YEAR}/detail/{ACCOUNT}.json

Writes under supporting-data/douglas/realware-detail/{STAMP_YEAR}/ (gitignored).
Does not run in CI by default. See docs/county-build-inputs.md.

Usage (from repo root):
  python3 tools/fetch_douglas_realware_detail.py --meta-only
  python3 tools/fetch_douglas_realware_detail.py --accounts R0399058
  python3 tools/fetch_douglas_realware_detail.py --skip-existing
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Sequence

TOOLS_DIR = Path(__file__).resolve().parent
REPO_ROOT = TOOLS_DIR.parent
DEFAULT_STAMP_FILE = TOOLS_DIR / "douglas-realware-detail-stamp.txt"
DEFAULT_LOCATION_FILE = REPO_ROOT / "supporting-data/douglas/Property_Location.txt"
REALWARE_BASE = "https://apps.douglas.co.us/realware/DATA"
DEFAULT_CONCURRENCY = 12
DEFAULT_RETRIES = 3
DEFAULT_RETRY_SLEEP_SEC = 1.5


def read_stamp_year(stamp_file: Path) -> str:
  text = stamp_file.read_text(encoding="utf-8").strip()
  if not text:
    raise SystemExit(f"stamp file is empty: {stamp_file}")
  return text


def fetch_url(url: str, timeout_sec: float = 60.0) -> bytes:
  req = urllib.request.Request(
    url,
    headers={"User-Agent": "metro-tax-lookup-maintainer/1.0"},
  )
  with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
    return resp.read()


def fetch_meta(stamp_year: str) -> dict:
  url = f"{REALWARE_BASE}/meta.json"
  raw = fetch_url(url)
  meta = json.loads(raw.decode("utf-8"))
  tax_years = meta.get("taxYears") or []
  if stamp_year not in [str(y) for y in tax_years]:
    print(
      f"warning: stamp year {stamp_year} not in meta taxYears {tax_years}",
      file=sys.stderr,
    )
  return meta


def iter_account_ids(location_file: Path) -> Iterable[str]:
  with location_file.open(encoding="cp1252", newline="") as handle:
    reader = csv.reader(handle)
    for row in reader:
      if not row:
        continue
      account = (row[0] or "").strip().upper()
      if account:
        yield account


def account_list(
  location_file: Path,
  *,
  only: Sequence[str] | None = None,
  max_count: int | None = None,
) -> list[str]:
  wanted = {a.strip().upper() for a in only} if only else None
  out: list[str] = []
  seen: set[str] = set()
  for account in iter_account_ids(location_file):
    if wanted is not None and account not in wanted:
      continue
    if account in seen:
      continue
    seen.add(account)
    out.append(account)
    if max_count is not None and len(out) >= max_count:
      break
  return out


def detail_url(stamp_year: str, account: str) -> str:
  return f"{REALWARE_BASE}/{stamp_year}/detail/{account}.json"


def download_one(
  stamp_year: str,
  account: str,
  out_dir: Path,
  *,
  skip_existing: bool,
  retries: int,
) -> tuple[str, str]:
  """Return (account, status) where status is ok | skipped | missing | error."""
  dest = out_dir / f"{account}.json"
  if skip_existing and dest.is_file() and dest.stat().st_size > 0:
    return account, "skipped"

  url = detail_url(stamp_year, account)
  last_err: Exception | None = None
  for attempt in range(retries):
    try:
      raw = fetch_url(url)
      dest.write_bytes(raw)
      return account, "ok"
    except urllib.error.HTTPError as err:
      last_err = err
      if err.code == 404:
        return account, "missing"
    except Exception as err:  # noqa: BLE001 — maintainer script
      last_err = err
    if attempt + 1 < retries:
      time.sleep(DEFAULT_RETRY_SLEEP_SEC * (attempt + 1))

  err_path = out_dir / f"{account}.error.txt"
  err_path.write_text(f"{url}\n{last_err}\n", encoding="utf-8")
  return account, "error"


def write_manifest(
  manifest_path: Path,
  *,
  stamp_year: str,
  meta: dict,
  fetched_at: str,
  counts: dict[str, int],
) -> None:
  metrics = meta.get("metrics") or {}
  payload = {
    "stampYear": stamp_year,
    "processRunDate": meta.get("processRunDate"),
    "realwareVersion": meta.get("version"),
    "totalAccountsProcessed": metrics.get("totalAccountsProcessed"),
    "fetchedAt": fetched_at,
    "sourceUrl": f"{REALWARE_BASE}/{stamp_year}/detail/",
    "counts": counts,
  }
  manifest_path.write_text(
    json.dumps(payload, indent=2, sort_keys=True) + "\n",
    encoding="utf-8",
  )


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument(
    "--stamp-year",
    help="Realware DATA year folder (default: tools/douglas-realware-detail-stamp.txt)",
  )
  parser.add_argument(
    "--location-file",
    type=Path,
    default=DEFAULT_LOCATION_FILE,
    help="Property_Location.txt for account ids",
  )
  parser.add_argument(
    "--out-dir",
    type=Path,
    help="Output directory (default: supporting-data/douglas/realware-detail/{year})",
  )
  parser.add_argument(
    "--concurrency",
    type=int,
    default=DEFAULT_CONCURRENCY,
    help="Parallel downloads",
  )
  parser.add_argument(
    "--skip-existing",
    action="store_true",
    help="Skip accounts whose JSON file already exists",
  )
  parser.add_argument(
    "--accounts",
    help="Comma-separated account ids (spot-check); omit for full location list",
  )
  parser.add_argument(
    "--max",
    type=int,
    help="Limit account count (testing)",
  )
  parser.add_argument(
    "--meta-only",
    action="store_true",
    help="Fetch meta.json and manifest only",
  )
  return parser.parse_args()


def main() -> None:
  args = parse_args()
  stamp_year = (args.stamp_year or read_stamp_year(DEFAULT_STAMP_FILE)).strip()
  out_dir = args.out_dir or (
    REPO_ROOT / "supporting-data/douglas/realware-detail" / stamp_year
  )
  out_dir.mkdir(parents=True, exist_ok=True)

  meta = fetch_meta(stamp_year)
  meta_dest = out_dir.parent / "meta.json"
  meta_dest.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
  print(f"wrote {meta_dest.relative_to(REPO_ROOT)}")

  if args.meta_only:
    write_manifest(
      out_dir.parent / "manifest.json",
      stamp_year=stamp_year,
      meta=meta,
      fetched_at=datetime.now(timezone.utc).isoformat(),
      counts={"ok": 0, "skipped": 0, "missing": 0, "error": 0},
    )
    return

  if not args.location_file.is_file():
    raise SystemExit(
      f"location file not found: {args.location_file} "
      "(use --accounts for spot-check without Property_Location.txt)",
    )

  only = None
  if args.accounts:
    only = [part.strip() for part in args.accounts.split(",") if part.strip()]

  accounts = account_list(
    args.location_file,
    only=only,
    max_count=args.max,
  )
  if not accounts:
    raise SystemExit("no accounts to fetch")

  counts = {"ok": 0, "skipped": 0, "missing": 0, "error": 0}
  started = time.monotonic()
  total = len(accounts)
  print(f"fetching {total} accounts into {out_dir.relative_to(REPO_ROOT)} …")

  with ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as pool:
    futures = {
      pool.submit(
        download_one,
        stamp_year,
        account,
        out_dir,
        skip_existing=args.skip_existing,
        retries=DEFAULT_RETRIES,
      ): account
      for account in accounts
    }
    done = 0
    for future in as_completed(futures):
      _account, status = future.result()
      counts[status] = counts.get(status, 0) + 1
      done += 1
      if done % 5000 == 0 or done == total:
        elapsed = time.monotonic() - started
        rate = done / elapsed if elapsed > 0 else 0.0
        print(
          f"  {done}/{total} ({rate:.1f}/s) "
          f"ok={counts['ok']} skip={counts['skipped']} "
          f"missing={counts['missing']} err={counts['error']}",
          flush=True,
        )

  write_manifest(
    out_dir.parent / "manifest.json",
    stamp_year=stamp_year,
    meta=meta,
    fetched_at=datetime.now(timezone.utc).isoformat(),
    counts=counts,
  )
  print("done.", counts)


if __name__ == "__main__":
  main()
