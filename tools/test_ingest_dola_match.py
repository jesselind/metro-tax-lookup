#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Unit tests for tools/ingest/dola_match.py (new-engine mill join)."""

from __future__ import annotations

import csv
import sys
import tempfile
import unittest
from pathlib import Path

_TOOLS = Path(__file__).resolve().parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))

from ingest.dola_match import (  # noqa: E402
    DEFAULT_OVERRIDES,
    attach_levy_mills,
    dola_match_for_mart_line,
    load_dola_entities_csv,
    load_overrides,
    normalize_for_match,
)


class NormalizeForMatchTests(unittest.TestCase):
    def test_expands_common_abbreviations(self) -> None:
        self.assertIn("METROPOLITAN", normalize_for_match("FOO METRO"))
        self.assertIn("DISTRICT", normalize_for_match("FOO DIST"))
        self.assertIn("AND", normalize_for_match("A & B"))


class AssessorFeeSkipTests(unittest.TestCase):
    def test_assrfees_is_skipped(self) -> None:
        result = dola_match_for_mart_line(
            "ASSRFEES",
            "ASSESSOR FEE",
            entities=[],
            overrides={},
            entities_by_te_id={},
        )
        self.assertEqual(result["method"], "skipped")
        self.assertEqual(result["skipReason"], "assessor_fee")


class OverrideAndMillsTests(unittest.TestCase):
    def test_mills_override_sets_reason(self) -> None:
        entities = [
            {
                "legalName": "Arapahoe County",
                "norm": normalize_for_match("Arapahoe County"),
                "taxEntityId": "03001/1",
                "lgId": "03001",
                "levyMills": 16.959,
            }
        ]
        by_te = {"03001/1": entities[0]}
        overrides = {
            "ARAPAHOE COUNTY": {
                "legalName": "Arapahoe County",
                "taxEntityId": "03001/1",
                "millsOverride": 15.959,
            }
        }
        result = dola_match_for_mart_line(
            "2998",
            "ARAPAHOE COUNTY",
            entities=entities,
            overrides=overrides,
            entities_by_te_id=by_te,
        )
        self.assertEqual(result["method"], "override")
        self.assertEqual(result["mills"], 15.959)
        self.assertEqual(result["dolaMills"], 16.959)
        self.assertEqual(result["millsReason"], "county_levy_table_override")

    def test_bond_purpose_mismatch_clears_mills(self) -> None:
        dola = {
            "method": "fuzzy",
            "confidence": "high",
            "taxEntityId": "1/1",
            "matchedLegalName": "Example Metropolitan District",
        }
        by_te = {
            "1/1": {
                "legalName": "Example Metropolitan District",
                "levyMills": 10.0,
            }
        }
        out = attach_levy_mills(dola, "EXAMPLE METRO BOND", by_te)
        self.assertIsNone(out["mills"])
        self.assertEqual(out["millsReason"], "bond_purpose_mismatch")


class LoadCsvTests(unittest.TestCase):
    def test_filters_certifying_county(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "entities.csv"
            with path.open("w", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                w.writerow(
                    [
                        "Tax Entity Name",
                        "Tax Entity ID",
                        "LG ID",
                        "Certifying County",
                        "Total Levy",
                    ]
                )
                w.writerow(["Alpha District", "1/1", "1", "Arapahoe", "5.5"])
                w.writerow(["Beta District", "2/1", "2", "El Paso", "9.9"])
            entities, levy_col, filtered = load_dola_entities_csv(path, "Arapahoe")
        self.assertTrue(filtered)
        self.assertEqual(levy_col, "Total Levy")
        self.assertEqual(len(entities), 1)
        self.assertEqual(entities[0]["legalName"], "Alpha District")
        self.assertEqual(entities[0]["levyMills"], 5.5)


class OverridesFileTests(unittest.TestCase):
    def test_shared_overrides_file_exists(self) -> None:
        self.assertTrue(DEFAULT_OVERRIDES.is_file(), str(DEFAULT_OVERRIDES))
        self.assertEqual(
            DEFAULT_OVERRIDES.name,
            "arapahoe_dola_authority_overrides.json",
        )
        # Must live under tools/, not under tools/ingest/mappings/ (one shared copy).
        self.assertEqual(DEFAULT_OVERRIDES.parent.name, "tools")
        loaded = load_overrides(DEFAULT_OVERRIDES)
        self.assertIn("ARAPAHOE COUNTY", loaded)
        self.assertEqual(loaded["ARAPAHOE COUNTY"].get("millsOverride"), 15.959)

    def test_no_duplicate_overrides_under_ingest_mappings(self) -> None:
        dup = (
            Path(__file__).resolve().parent
            / "ingest"
            / "mappings"
            / "arapahoe-dola-authority-overrides.json"
        )
        self.assertFalse(
            dup.is_file(),
            f"duplicate overrides file must not exist: {dup}",
        )


if __name__ == "__main__":
    unittest.main()
