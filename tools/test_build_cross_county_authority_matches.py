#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Unit tests for tools/build_cross_county_authority_matches.py."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

_TOOLS = Path(__file__).resolve().parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))

from build_cross_county_authority_matches import (  # noqa: E402
    DEFAULT_OUTPUT,
    _match_row_id,
    build_cross_county_matches,
    load_cross_county_overrides,
)


class BuildCrossCountyAuthorityMatchesTests(unittest.TestCase):
    def test_match_row_id_uses_tax_entity_id(self) -> None:
        self.assertEqual(_match_row_id("64108/1"), "64108-1")
        self.assertEqual(_match_row_id("64179/2"), "64179-2")
        self.assertNotEqual(_match_row_id("64179/1"), _match_row_id("64179/2"))

    def test_overrides_load_smfr(self) -> None:
        overrides = load_cross_county_overrides(
            _TOOLS / "cross_county_authority_overrides.json",
        )
        smfr = overrides.get("64108/1")
        self.assertIsNotNone(smfr)
        assert smfr is not None
        self.assertEqual(smfr["levyLineCodeByCounty"]["douglas"], "4014")

    def test_build_finds_smfr_and_udfcd_overlaps(self) -> None:
        repo = _TOOLS.parent
        dola = repo / "supporting-data/dola/property-tax-entities-export.csv"
        if not dola.is_file():
            self.skipTest("DOLA export missing locally")

        payload = build_cross_county_matches(dola_path=dola)
        self.assertEqual(payload["version"], 1)
        self.assertIn("matchStatusCounts", payload)
        self.assertGreaterEqual(payload["matchCount"], 3)

        by_te = {row["taxEntityId"]: row for row in payload["matches"]}

        smfr = by_te.get("64108/1")
        self.assertIsNotNone(smfr, "expected SMFR tax entity 64108/1")
        assert smfr is not None
        self.assertEqual(smfr["matchStatus"], "complete")
        self.assertEqual(smfr["levyLineCodeByCounty"].get("arapahoe"), "4100")
        self.assertEqual(smfr["levyLineCodeByCounty"].get("douglas"), "4014")
        self.assertEqual(smfr["id"], "64108-1")

        udfcd = by_te.get("64147/1")
        self.assertIsNotNone(udfcd, "expected UDFCD main 64147/1")
        assert udfcd is not None
        self.assertEqual(udfcd["matchStatus"], "complete")
        self.assertEqual(udfcd["levyLineCodeByCounty"].get("arapahoe"), "4712")
        self.assertEqual(udfcd["levyLineCodeByCounty"].get("douglas"), "4002")

        south_platte = by_te.get("64174/1")
        self.assertIsNotNone(south_platte, "expected UDFCD South Platte 64174/1")
        assert south_platte is not None
        self.assertEqual(south_platte["matchStatus"], "complete")
        self.assertEqual(south_platte["levyLineCodeByCounty"].get("arapahoe"), "4713")
        self.assertEqual(south_platte["levyLineCodeByCounty"].get("douglas"), "4392")

        frrd = by_te.get("67661/1")
        if frrd is not None:
            self.assertEqual(frrd["matchStatus"], "dola_only")

    def test_only_complete_filters_noise(self) -> None:
        repo = _TOOLS.parent
        dola = repo / "supporting-data/dola/property-tax-entities-export.csv"
        if not dola.is_file():
            self.skipTest("DOLA export missing locally")

        all_rows = build_cross_county_matches(dola_path=dola)
        complete_rows = build_cross_county_matches(dola_path=dola, only_complete=True)
        self.assertLess(complete_rows["matchCount"], all_rows["matchCount"])
        for row in complete_rows["matches"]:
            self.assertEqual(row["matchStatus"], "complete")
        counts = complete_rows["matchStatusCounts"]
        self.assertEqual(sum(counts.values()), complete_rows["matchCount"])
        self.assertEqual(counts["partial"], 0)
        self.assertEqual(counts["dola_only"], 0)

    def test_shipped_match_file_matches_builder(self) -> None:
        repo = _TOOLS.parent
        dola = repo / "supporting-data/dola/property-tax-entities-export.csv"
        if not dola.is_file() or not DEFAULT_OUTPUT.is_file():
            self.skipTest("DOLA export or committed match file missing")

        built = build_cross_county_matches(dola_path=dola)
        shipped = json.loads(DEFAULT_OUTPUT.read_text(encoding="utf-8"))
        self.assertEqual(shipped["matchCount"], built["matchCount"])
        self.assertEqual(
            {m["taxEntityId"] for m in shipped["matches"]},
            {m["taxEntityId"] for m in built["matches"]},
        )

    def test_stack_embedded_dola_match_used_without_fuzzy_fallback(self) -> None:
        from build_cross_county_authority_matches import map_stack_lines_to_tax_entities

        stack_lines = {
            "4014": {
                "code": "4014",
                "authorityName": "South Metro Fire Rescue Fire Protection District",
                "dolaMatch": {
                    "method": "fuzzy",
                    "confidence": "high",
                    "taxEntityId": "64108/1",
                    "score": 1.0,
                },
            }
        }
        # No DOLA entities: name-only fallback would not resolve TE id.
        result = map_stack_lines_to_tax_entities(stack_lines, [], {})
        self.assertIn("64108/1", result)
        self.assertEqual(result["64108/1"].levy_line_code, "4014")
        self.assertEqual(result["64108/1"].match_method, "fuzzy")


if __name__ == "__main__":
    unittest.main()
