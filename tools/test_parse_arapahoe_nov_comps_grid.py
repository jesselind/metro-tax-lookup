#!/usr/bin/env python3

from __future__ import annotations

import unittest

from pathlib import Path

from parse_arapahoe_nov_comps_grid import (
    CANONICAL_ROWS,
    DEFINITIONS_PATH,
    LOGICAL_DATE,
    LOGICAL_MONEY,
    LOGICAL_SECTION,
    LOGICAL_STRING,
    LOGICAL_YEAR,
    CanonicalRow,
    definitions_coverage_guard,
    is_masked_sentinel,
    load_definitions_bundle,
    parse_cell,
    parse_date,
    parse_money,
)


class ParseHelpersTests(unittest.TestCase):
    def test_masked_sentinel(self) -> None:
        self.assertTrue(is_masked_sentinel("*************"))
        self.assertFalse(is_masked_sentinel("** 123 **"))

    def test_parse_money_plain_and_commas(self) -> None:
        self.assertEqual(parse_money("512900"), 512900)
        self.assertEqual(parse_money("531,905"), 531905)
        self.assertEqual(parse_money("-5,000"), -5000)
        self.assertIsNone(parse_money("53O,905"))

    def test_parse_date(self) -> None:
        self.assertEqual(parse_date("8/18/2022"), "2022-08-18")
        self.assertEqual(parse_date("04/15/2024"), "2024-04-15")
        self.assertIsNone(parse_date("2024-04-15"))

    def test_parse_cell_blank_and_masked(self) -> None:
        row = CanonicalRow("DWELLING", "dwelling", "indicator")
        blank = parse_cell("", row)
        self.assertFalse(blank["parse_ok"])
        self.assertEqual(blank["parse_note"], "blank cell")

        masked = parse_cell("*************", row)
        self.assertFalse(masked["parse_ok"])
        self.assertEqual(masked["parse_note"], "masked sentinel")

    def test_parse_cell_valuation_section_masked(self) -> None:
        row = CanonicalRow("VALUATION", "valuation_label", LOGICAL_SECTION)
        masked = parse_cell("*************", row)
        self.assertTrue(masked["parse_ok"])
        self.assertIsNone(masked["parsed"])
        self.assertEqual(masked["parse_note"], "masked section placeholder")

    def test_parcel_id_accepts_non_nine_digit_tokens(self) -> None:
        row = CanonicalRow("PARCEL ID", "parcel_id", LOGICAL_STRING)
        parsed = parse_cell("032490357001", row)
        self.assertTrue(parsed["parse_ok"])
        self.assertEqual(parsed["parsed"], "032490357001")

    def test_parse_cell_year_zero_is_missing(self) -> None:
        row = CanonicalRow("Remodel Year", "remodel_year", LOGICAL_YEAR)
        parsed = parse_cell("0", row)
        self.assertFalse(parsed["parse_ok"])
        self.assertIsNone(parsed["parsed"])

    def test_parse_cell_money_commas(self) -> None:
        row = CanonicalRow("Adjusted Sale Price", "adjusted_sale_price", LOGICAL_MONEY)
        parsed = parse_cell("531,905", row)
        self.assertTrue(parsed["parse_ok"])
        self.assertEqual(parsed["parsed"], 531905)

    def test_parse_cell_date(self) -> None:
        row = CanonicalRow("SALE DATE", "sale_date", LOGICAL_DATE)
        parsed = parse_cell("10/10/2022", row)
        self.assertTrue(parsed["parse_ok"])
        self.assertEqual(parsed["parsed"], "2022-10-10")

    def test_duplicate_time_adj_rows_in_canonical_order(self) -> None:
        keys = [r.json_key for r in CANONICAL_ROWS if r.pdf_label == "Time Adj Sale Price"]
        self.assertEqual(keys, ["time_adj_sale_price", "valuation_time_adj_sale_price"])

    def test_definition_bundle_alignment(self) -> None:
        self.assertTrue(Path(DEFINITIONS_PATH).is_file())
        bundle = load_definitions_bundle()
        self.assertIsNotNone(bundle)
        definitions_coverage_guard(bundle or {})


if __name__ == "__main__":
    unittest.main()
