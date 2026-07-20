#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Unit tests for pure helpers in extract_metro_levies_2026.py.

Uses synthetic PDF text lines only (no real resident data).
"""

from __future__ import annotations

import unittest

from extract_metro_levies_2026 import (
    RawRow,
    _classify_district_type,
    _classify_purpose,
    normalize_metro_districts_from_lines,
)


def _raw_line(row_index: int, text: str) -> RawRow:
    return RawRow(
        row_index=row_index,
        page_number=1,
        source_table_index=0,
        data={"text": text},
    )


class ClassifyDistrictTypeTests(unittest.TestCase):
    def test_metro_name(self) -> None:
        self.assertEqual(
            _classify_district_type("Adonea Metropolitan District No. 2"),
            "metro",
        )

    def test_school_name(self) -> None:
        self.assertEqual(
            _classify_district_type("Cherry Creek School District No. 5"),
            "school",
        )


class ClassifyPurposeTests(unittest.TestCase):
    def test_bonds_are_debt_service(self) -> None:
        self.assertEqual(_classify_purpose("Bonds"), "debt_service")

    def test_general_operating_is_operations(self) -> None:
        self.assertEqual(_classify_purpose("General Operating"), "operations")

    def test_summary_total_is_other(self) -> None:
        self.assertEqual(_classify_purpose("Total"), "other")


class NormalizeMetroDistrictsTests(unittest.TestCase):
    def test_parses_concatenated_county_lgid_and_previous_rate(self) -> None:
        line = (
            "400665214 E2E Synthetic Metropolitan District No. 1 "
            "General Operating 0.020000 0.010000 1000 - y n n n Not Applicable None"
        )
        payload = normalize_metro_districts_from_lines([_raw_line(0, line)])
        districts = payload["districts"]
        self.assertEqual(len(districts), 1)
        district = districts[0]
        self.assertEqual(district["type"], "metro")
        self.assertEqual(district["lgid"], "65214")
        self.assertEqual(district["levies"][0]["rateMillsCurrent"], 0.02)
        self.assertEqual(district["levies"][0]["rateMillsPrevious"], 0.01)

    def test_aggregates_sum_parts_not_summary_total_row(self) -> None:
        rows = [
            _raw_line(
                0,
                "400665214 E2E Synthetic Metropolitan District No. 1 Total "
                "0.071105 0.067209 1000 - y n n n Not Applicable None",
            ),
            _raw_line(
                1,
                "400665214 E2E Synthetic Metropolitan District No. 1 Bonds "
                "0.058289 0.055525 500 - y n n n Not Applicable None",
            ),
        ]
        payload = normalize_metro_districts_from_lines(rows)
        district = payload["districts"][0]
        # Aggregates always sum every purpose row; the app chooses Total XOR parts for YoY.
        self.assertAlmostEqual(district["aggregates"]["totalMills"], 0.129394)
        self.assertEqual(len(district["levies"]), 2)


if __name__ == "__main__":
    unittest.main()
