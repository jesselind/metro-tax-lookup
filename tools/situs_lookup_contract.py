#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Shared situs lookupVersion contract for both rebuild engines.

``lookupVersion`` on ``arapahoe-situs-to-pins.json`` is a **schema stamp** for
address-lookup key and label rules. It is **not** an engine id (old vs new).
Tell engines apart by output directory and ``snapshot.source``.

Both ``tools/build_arapahoe_parcel_levy_index.py`` (shipping rebuild) and
``tools/ingest/situs.py`` (comparison ingest) must import ``SITUS_LOOKUP_VERSION``
from this module. Do not hardcode the integer in either engine.

Bump only when key normalization or label shape changes in a way that tools or
docs need to distinguish generations. After bumping: regenerate situs JSON,
keep both engines on this constant, and bump
``ARAPAHOE_SITUS_TO_PINS_CACHE_BUST`` in ``src/lib/arapahoeSitusLookup.ts``.

Version history (shipping rules):
  1 — early situs index (keys as today; labels without postage locality emphasis)
  2 — labels include city / state / postal (postage last line); current shipping
"""

from __future__ import annotations

import re
from pathlib import Path

# Current shipping schema (postage-style locality on labels).
SITUS_LOOKUP_VERSION = 2

_LOOKUP_VERSION_RE = re.compile(r'"lookupVersion"\s*:\s*(\d+)')


def read_situs_lookup_version(path: Path, *, prefix_bytes: int = 8192) -> int:
    """
    Read ``lookupVersion`` from a situs JSON file without loading the full map.

    Shipping files are compact JSON with ``lookupVersion`` near the start
    (after ``snapshot``). Raises ValueError if the field is missing in the prefix.
    """
    with path.open("r", encoding="utf-8", errors="replace") as f:
        chunk = f.read(prefix_bytes)
    match = _LOOKUP_VERSION_RE.search(chunk)
    if not match:
        raise ValueError(
            f"lookupVersion not found in the first {prefix_bytes} bytes of {path}"
        )
    return int(match.group(1))
