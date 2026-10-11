#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later

"""Unit tests for county levy mills lookup and parity."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from ingest.county_levy_mills import (
    CountyLevyMillsBundle,
    apply_county_published_mills_to_dola_match,
    assert_levy_stack_county_mills_parity,
    build_tag_id_to_pdf_tag,
)


class CountyLevyMillsTests(unittest.TestCase):
    def _mini_bundle(self) -> CountyLevyMillsBundle:
        path = Path(__file__).resolve().parent.parent / (
            "public/data/arapahoe-authority-mills-by-tax-year.json"
        )
        if not path.is_file():
            self.skipTest("shipping authority mills bundle not present")
        return CountyLevyMillsBundle.load(path)

    def test_cherry_creek_auth_uniform_mills(self) -> None:
        bundle = self._mini_bundle()
        mills = bundle.mills_for_line("0501", "1948", "2025")
        self.assertIsNotNone(mills)
        self.assertAlmostEqual(mills, 54.108, places=3)

    def test_apply_county_mills_when_dola_none(self) -> None:
        bundle = self._mini_bundle()
        dm = {"method": "none", "confidence": "low", "mills": None, "score": 0.918}
        out = apply_county_published_mills_to_dola_match(
            dm,
            auth_code="0501",
            authority_upper="CHERRY CRK SCHOOL DIST 5",
            pdf_tag="1948",
            tax_year="2025",
            bundle=bundle,
            overrides={},
        )
        self.assertAlmostEqual(out["mills"], 54.108, places=3)
        self.assertEqual(out["millsReason"], "county_published_levy_table")

    def test_override_wins_over_county_bundle(self) -> None:
        bundle = self._mini_bundle()
        dm = {"method": "override", "confidence": "high", "mills": 16.959}
        out = apply_county_published_mills_to_dola_match(
            dm,
            auth_code="2998",
            authority_upper="ARAPAHOE COUNTY",
            pdf_tag="1948",
            tax_year="2025",
            bundle=bundle,
            overrides={
                "ARAPAHOE COUNTY": {"millsOverride": 15.959},
            },
        )
        self.assertAlmostEqual(out["mills"], 15.959, places=3)
        self.assertEqual(out["millsReason"], "county_levy_table_override")

    def test_parity_flags_null_when_county_known(self) -> None:
        bundle = self._mini_bundle()
        stacks = {
            "snapshot": {"taxYear": "2025"},
            "stacksByTagId": {
                "1265103": {
                    "tagId": "1265103",
                    "lines": [
                        {
                            "code": "0501",
                            "authorityName": "CHERRY CRK SCHOOL DIST 5",
                            "dolaMatch": {"method": "none", "mills": None},
                        }
                    ],
                }
            },
        }
        tag_map = {"1265103": "1948"}
        v = assert_levy_stack_county_mills_parity(
            stacks, tag_map, bundle, tax_year="2025"
        )
        self.assertEqual(len(v), 1)
        self.assertEqual(v[0].kind, "shipped_null_mills")

    def test_tag_id_to_pdf_tag_from_accounts(self) -> None:
        rows = [
            {"taxAreaId": "99", "tagShortDescr": "1948"},
            {"taxAreaId": "99", "tagShortDescr": "1948"},
        ]
        self.assertEqual(build_tag_id_to_pdf_tag(rows), {"99": "1948"})

    def test_tag_id_conflict_raises(self) -> None:
        rows = [
            {"taxAreaId": "99", "tagShortDescr": "1"},
            {"taxAreaId": "99", "tagShortDescr": "2"},
        ]
        with self.assertRaises(ValueError):
            build_tag_id_to_pdf_tag(rows)


if __name__ == "__main__":
    unittest.main()
