#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Guard: both engines and shipping situs JSON share one lookupVersion contract."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_TOOLS = Path(__file__).resolve().parent
_REPO = _TOOLS.parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))

from situs_lookup_contract import (  # noqa: E402
    SITUS_LOOKUP_VERSION,
    read_situs_lookup_version,
)


class SitusLookupContractTests(unittest.TestCase):
    def test_shipping_situs_matches_shared_constant(self) -> None:
        shipping = _REPO / "public" / "data" / "arapahoe-situs-to-pins.json"
        self.assertTrue(shipping.is_file(), str(shipping))
        shipped = read_situs_lookup_version(shipping)
        self.assertEqual(
            shipped,
            SITUS_LOOKUP_VERSION,
            "Shipping situs lookupVersion drifted from tools/situs_lookup_contract.py. "
            "Bump the constant only when key/label rules change, then regenerate situs "
            "with both engines on that same constant.",
        )

    def test_new_ingest_imports_shared_constant(self) -> None:
        from ingest import situs as ingest_situs

        self.assertEqual(ingest_situs.SITUS_LOOKUP_VERSION, SITUS_LOOKUP_VERSION)
        situs_path = _TOOLS / "ingest" / "situs.py"
        text = situs_path.read_text(encoding="utf-8")
        self.assertIn(
            "from situs_lookup_contract import SITUS_LOOKUP_VERSION",
            text,
        )
        self.assertIn('"lookupVersion": SITUS_LOOKUP_VERSION', text)
        self.assertNotRegex(
            text,
            r'"lookupVersion":\s*\d+',
            "New ingest must not hardcode lookupVersion; use SITUS_LOOKUP_VERSION.",
        )

    def test_old_rebuild_imports_shared_constant(self) -> None:
        build_path = _TOOLS / "build_arapahoe_parcel_levy_index.py"
        text = build_path.read_text(encoding="utf-8")
        self.assertIn(
            "from situs_lookup_contract import SITUS_LOOKUP_VERSION",
            text,
        )
        self.assertIn('"lookupVersion": SITUS_LOOKUP_VERSION', text)
        self.assertNotRegex(
            text,
            r'"lookupVersion":\s*\d+',
            "Old rebuild must not hardcode lookupVersion; use SITUS_LOOKUP_VERSION.",
        )


if __name__ == "__main__":
    unittest.main()
