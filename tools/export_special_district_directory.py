#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""
Read Colorado special-district shapefile attributes (dlall.dbf) and write a JSON
bundle for the levy stack tool: LG ID, name, website, mailing address.

Default input: supporting-data/dlall/dlall.dbf (Colorado GIS bundle; not committed).

Usage:
  python3 tools/export_special_district_directory.py \\
    --dbf supporting-data/dlall/dlall.dbf \\
    --out public/data/colorado-special-district-directory.json
"""

from __future__ import annotations

import argparse
import json
import struct
import sys
from datetime import date
from pathlib import Path
from typing import Any, List, Tuple

_TOOLS = Path(__file__).resolve().parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))
from website_normalize import normalize_website  # noqa: E402


def read_dbf_schema_and_records(path: Path) -> Tuple[List[Tuple[str, int]], List[dict[str, str]]]:
    data = path.read_bytes()
    pos = 0
    assert data[pos : pos + 1] == b"\x03"  # dBase III
    pos += 1
    pos += 3  # date
    nrec, hlen, rlen = struct.unpack_from("<IHH", data, pos)
    pos += 8
    pos += 20  # reserved
    fields: List[Tuple[str, int]] = []
    while True:
        if data[pos : pos + 1] == b"\r":
            pos += 1
            break
        name = data[pos : pos + 11].split(b"\x00")[0].decode("latin-1").strip()
        pos += 11
        pos += 1  # type
        pos += 4  # addr
        ln = data[pos]
        pos += 1
        pos += 15
        fields.append((name, ln))
    records: List[dict[str, str]] = []
    for _ in range(nrec):
        row = data[pos : pos + rlen]
        pos += rlen
        if not row or row[0:1] == b"*":
            continue
        raw = row[1:]
        off = 0
        rec: dict[str, str] = {}
        for name, ln in fields:
            chunk = raw[off : off + ln]
            off += ln
            rec[name] = chunk.decode("latin-1", errors="replace").strip()
        records.append(rec)
    return fields, records


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--dbf",
        type=Path,
        default=Path(__file__).resolve().parents[1]
        / "supporting-data"
        / "dlall"
        / "dlall.dbf",
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "public" / "data" / "colorado-special-district-directory.json",
    )
    args = ap.parse_args()
    if not args.dbf.is_file():
        raise SystemExit(f"DBF not found: {args.dbf}")

    _, rows = read_dbf_schema_and_records(args.dbf)
    districts: list[dict[str, Any]] = []
    for r in rows:
        lg_id = (r.get("LG_ID") or "").strip()
        name = (r.get("NAME") or "").strip()
        if not name and not lg_id:
            continue
        abbrev = (r.get("ABBREV_NAM") or "").strip()
        website = normalize_website(r.get("WEBSITE_UR") or "")
        districts.append(
            {
                "lgId": lg_id,
                "name": name,
                "abbrevName": abbrev or None,
                "websiteUrl": website or None,
                "mailAddress": (r.get("MAIL_ADDRE") or "").strip() or None,
                "altAddress": (r.get("ALT_ADDRES") or "").strip() or None,
                "mailCity": (r.get("MAIL_CITY") or "").strip() or None,
                "mailState": (r.get("MAIL_STATE") or "").strip() or None,
                "mailZip": (r.get("MAIL_ZIP") or "").strip() or None,
                "lgTypeId": (r.get("LG_TYPE_ID") or "").strip() or None,
                "prevName": (r.get("PREV_NAME") or "").strip() or None,
                "source": (r.get("source") or "").strip() or None,
                "lastUpdate": (r.get("lastupdate") or "").strip() or None,
            }
        )

    districts.sort(key=lambda d: (d["lgId"], d["name"]))

    out_obj = {
        "snapshot": {
            "bundledAsOf": date.today().isoformat(),
            "source": "Colorado special district GIS export (dlall / Districts_All attributes, WGS84). "
            "Fields from DOLA-style local government registry join; boundaries from mixed sources "
            "per row `source` attribute.",
        },
        "districtCount": len(districts),
        "districts": districts,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out_obj, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(districts)} districts to {args.out}")


if __name__ == "__main__":
    main()
