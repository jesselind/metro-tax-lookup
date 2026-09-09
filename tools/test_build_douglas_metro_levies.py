# Metro Tax Lookup
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Unit tests for tools/build_douglas_metro_levies.py (no PDF / network)."""

from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from build_douglas_metro_levies import (
    build_file,
    mills_from_abstract_row,
    normalize_entity_name,
    strip_debt_parent_name,
)


class MillsFromAbstractRowTest(unittest.TestCase):
    def test_prefers_revenue_over_assessed(self) -> None:
        # Airport Vista MD 2 from abstract paste math → ~16.11 mills
        mills = mills_from_abstract_row(
            {
                "assessed_value": "63110",
                "revenue": "1017",
                "tax_rate_mills": "1.6111",
            }
        )
        self.assertAlmostEqual(mills, 16.1147, places=3)

    def test_falls_back_to_tax_rate_times_ten(self) -> None:
        mills = mills_from_abstract_row(
            {
                "assessed_value": "0",
                "revenue": "0",
                "tax_rate_mills": "5.086",
            }
        )
        self.assertAlmostEqual(mills, 50.86, places=5)


class NameHelpersTest(unittest.TestCase):
    def test_strip_debt_parent(self) -> None:
        self.assertEqual(
            strip_debt_parent_name("Canyons Metro District 3 Debt Service"),
            "Canyons Metro District 3",
        )

    def test_normalize_matches_dola_style(self) -> None:
        self.assertEqual(
            normalize_entity_name("Antelope Heights Metro District"),
            normalize_entity_name("Antelope Heights Metropolitan District"),
        )


class BuildFileIntegrationTest(unittest.TestCase):
    def test_builds_district_with_lgid_and_debt_fold(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            csv_path = root / "abstract.csv"
            dola_path = root / "dola.csv"

            with csv_path.open("w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(
                    f,
                    fieldnames=[
                        "source_file",
                        "source_page",
                        "source_title",
                        "parent_column",
                        "section",
                        "name",
                        "assessed_value",
                        "tax_rate_mills",
                        "revenue",
                        "name_kind",
                        "parse_notes",
                    ],
                )
                w.writeheader()
                w.writerow(
                    {
                        "source_file": "x",
                        "source_page": "2",
                        "source_title": "t",
                        "parent_column": "2",
                        "section": "METROPOLITAN DISTRICTS",
                        "name": "Canyons Metro District 3",
                        "assessed_value": "9359500",
                        "tax_rate_mills": "6.1032",
                        "revenue": "571229",
                        "name_kind": "general_or_ops",
                        "parse_notes": "test",
                    }
                )
                w.writerow(
                    {
                        "source_file": "x",
                        "source_page": "2",
                        "source_title": "t",
                        "parent_column": "2",
                        "section": "METROPOLITAN DISTRICTS",
                        "name": "Canyons Metro District 3 Debt Service",
                        "assessed_value": "0",
                        "tax_rate_mills": "5.086",
                        "revenue": "0",
                        "name_kind": "debt_service",
                        "parse_notes": "test",
                    }
                )

            with dola_path.open("w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(
                    f,
                    fieldnames=[
                        "DOLA Tax Entity Name:",
                        "Tax Entity ID:",
                        "Certifying County:",
                        "2026 Budget Year Total Levy (2025 Tax Year)",
                        "2026 Budget Year Net Assessed Value (2025 Tax Year)",
                    ],
                )
                w.writeheader()
                w.writerow(
                    {
                        "DOLA Tax Entity Name:": "Canyons Metropolitan District No. 3",
                        "Tax Entity ID:": "65041/1",
                        "Certifying County:": "Douglas",
                        "2026 Budget Year Total Levy (2025 Tax Year)": "61.032",
                        "2026 Budget Year Net Assessed Value (2025 Tax Year)": "9359500",
                    }
                )
                w.writerow(
                    {
                        "DOLA Tax Entity Name:": (
                            "Canyons Metropolitan District No. 3 - Debt Service"
                        ),
                        "Tax Entity ID:": "65041/2",
                        "Certifying County:": "Douglas",
                        "2026 Budget Year Total Levy (2025 Tax Year)": "50.86",
                        "2026 Budget Year Net Assessed Value (2025 Tax Year)": "0",
                    }
                )

            payload = build_file(csv_path, dola_path, bundled_as_of="2026-09-08")
            self.assertEqual(len(payload["districts"]), 1)
            d = payload["districts"][0]
            self.assertEqual(d["lgid"], "65041")
            self.assertEqual(d["type"], "metro")
            self.assertEqual(len(d["levies"]), 2)
            cats = {levy["purposeCategory"] for levy in d["levies"]}
            self.assertEqual(cats, {"operations", "debt_service"})
            self.assertAlmostEqual(d["aggregates"]["opsMills"] * 1000, 61.032, places=2)
            self.assertAlmostEqual(d["aggregates"]["debtMills"] * 1000, 50.86, places=2)
            self.assertIsNone(d["levies"][0]["rateMillsPrevious"])


if __name__ == "__main__":
    unittest.main()
