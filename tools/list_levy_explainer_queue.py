#!/usr/bin/env python3
"""
List unique levy rows from bundled Arapahoe stacks for planning levy-explainer-entries.json.

Outputs TSV: line_code, lg_id, authority_name, sample_tag_id

Usage (from repo root):
  python3 tools/list_levy_explainer_queue.py
  python3 tools/list_levy_explainer_queue.py --json
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print JSON array instead of TSV",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parent.parent
    stacks_path = root / "public/data/arapahoe-levy-stacks-by-tag-id.json"
    raw = json.loads(stacks_path.read_text(encoding="utf-8"))
    stacks = raw.get("stacksByTagId") or {}

    # key -> set of tag ids (one sample per key)
    by_key: dict[tuple[str, str, str], str] = {}

    for tag_id, stack in stacks.items():
        for line in stack.get("lines") or []:
            code = str(line.get("code") or "").strip().upper()
            auth = str(line.get("authorityName") or "").strip()
            dola = line.get("dolaMatch") or {}
            lg = str(dola.get("lgId") or "").strip()
            if not code and not auth and not lg:
                continue
            key = (code, lg, auth)
            if key not in by_key:
                by_key[key] = str(tag_id)

    rows = [
        {"lineCode": k[0], "lgId": k[1], "authorityName": k[2], "sampleTagId": by_key[k]}
        for k in sorted(by_key.keys(), key=lambda x: (x[0], x[1], x[2]))
    ]

    if args.json:
        print(json.dumps(rows, indent=2))
        return

    print("line_code\tlg_id\tauthority_name\tsample_tag_id")
    for r in rows:
        print(
            f"{r['lineCode']}\t{r['lgId']}\t{r['authorityName']}\t{r['sampleTagId']}",
        )


if __name__ == "__main__":
    main()
