#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Unit tests for pure helpers in extract_authority_mills_by_tax_year.py.

Uses synthetic table rows only (no PDF required).
"""

from __future__ import annotations

import unittest

from extract_authority_mills_by_tax_year import (
    AuthorityLevyRow,
    build_authority_mills_for_year,
    build_shipping_payload,
    parse_levy_percentage_table_rows,
    resolve_pdf_by_year,
)


class ParseTableRowsTests(unittest.TestCase):
    def test_carries_pdf_tag_across_blank_tag_cells(self) -> None:
        table = [
            ["TAG", "Authority", "Description", "Levy", "Percentage"],
            ["0002", "0801", "AURORA SCHOOL DIST # 28J", "73.186", "74.50"],
            [None, "2998", "ARAPAHOE COUNTY", "15.959", "16.25"],
            ["", "Total", "Total", "98.232", "100.00"],
            ["0003", "0801", "AURORA SCHOOL DIST # 28J", "73.186", "74.50"],
        ]
        rows, last_tag = parse_levy_percentage_table_rows(2025, table)
        self.assertEqual(last_tag, "0003")
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[0].pdfTag, "0002")
        self.assertEqual(rows[0].authority, "0801")
        self.assertAlmostEqual(rows[0].mills, 73.186)
        self.assertEqual(rows[1].pdfTag, "0002")
        self.assertEqual(rows[1].authority, "2998")
        self.assertEqual(rows[2].pdfTag, "0003")

    def test_carries_starting_pdf_tag_across_page_break(self) -> None:
        table = [
            [None, "3001", "CITY OF AURORA", "7.087", "7.21"],
        ]
        rows, last_tag = parse_levy_percentage_table_rows(
            2025,
            table,
            starting_pdf_tag="0004",
        )
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0].pdfTag, "0004")
        self.assertEqual(last_tag, "0004")


class BuildAuthorityMillsTests(unittest.TestCase):
    def test_uniform_auth_collapses_to_single_mills(self) -> None:
        rows = [
            AuthorityLevyRow(2025, "0002", "0801", "SCHOOL", 73.186, 74.5, 1),
            AuthorityLevyRow(2025, "0003", "0801", "SCHOOL", 73.186, 74.5, 1),
            AuthorityLevyRow(2025, "0002", "2998", "COUNTY", 15.959, 16.25, 1),
        ]
        result = build_authority_mills_for_year(rows)
        self.assertEqual(result["millsByAuthority"]["0801"], 73.186)
        self.assertEqual(result["millsByAuthority"]["2998"], 15.959)
        self.assertEqual(result["exceptions"], {})
        self.assertEqual(result["stats"]["exceptionAuthorityCount"], 0)

    def test_tag_variance_becomes_exception_with_default(self) -> None:
        rows = [
            AuthorityLevyRow(
                2025, "0202", "4739", "HARVEST", 74.953, 40.0, 1
            ),
            AuthorityLevyRow(
                2025, "1981", "4739", "HARVEST", 0.0, 0.0, 1
            ),
            AuthorityLevyRow(
                2025, "1400", "4739", "HARVEST", 74.953, 40.0, 1
            ),
        ]
        result = build_authority_mills_for_year(rows)
        self.assertAlmostEqual(result["millsByAuthority"]["4739"], 74.953)
        exc = result["exceptions"]["4739"]
        self.assertAlmostEqual(exc["defaultMills"], 74.953)
        self.assertEqual(exc["byPdfTag"]["0202"], 74.953)
        self.assertEqual(exc["byPdfTag"]["1981"], 0.0)

    def test_zero_and_nonzero_same_tag_prefers_nonzero(self) -> None:
        rows = [
            AuthorityLevyRow(2025, "1671", "4739", "HARVEST", 0.0, 0.0, 1),
            AuthorityLevyRow(
                2025, "1671", "4739", "HARVEST", 74.953, 40.0, 1
            ),
        ]
        result = build_authority_mills_for_year(rows)
        self.assertAlmostEqual(result["millsByAuthority"]["4739"], 74.953)
        self.assertEqual(result["exceptions"], {})
        self.assertEqual(result["stats"]["tagAuthConflictCount"], 1)


class BuildShippingPayloadTests(unittest.TestCase):
    def test_merges_years_without_inventing_missing_priors(self) -> None:
        y2024 = build_authority_mills_for_year(
            [
                AuthorityLevyRow(2024, "0002", "0801", "SCHOOL", 71.331, 74.0, 1),
                AuthorityLevyRow(2024, "0002", "9999", "ONLY 2024", 1.0, 1.0, 1),
            ]
        )
        y2025 = build_authority_mills_for_year(
            [
                AuthorityLevyRow(2025, "0002", "0801", "SCHOOL", 73.186, 74.0, 1),
                AuthorityLevyRow(2025, "0002", "8888", "ONLY 2025", 2.0, 2.0, 1),
            ]
        )
        payload = build_shipping_payload(
            {2024: y2024, 2025: y2025},
            source_files={
                2024: "supporting-data/certs/2024.pdf",
                2025: "supporting-data/certs/2025.pdf",
            },
            bundled_as_of="2026-07-20",
        )
        auth_0801 = payload["authorities"]["0801"]["millsByTaxYear"]
        self.assertEqual(auth_0801["2024"], 71.331)
        self.assertEqual(auth_0801["2025"], 73.186)
        self.assertEqual(
            list(payload["authorities"]["9999"]["millsByTaxYear"].keys()),
            ["2024"],
        )
        self.assertEqual(
            list(payload["authorities"]["8888"]["millsByTaxYear"].keys()),
            ["2025"],
        )
        self.assertEqual(payload["_meta"]["taxYears"], [2024, 2025])
        self.assertEqual(payload["_meta"]["bundledAsOf"], "2026-07-20")


class ResolvePdfByYearTests(unittest.TestCase):
    def test_returns_defaults_when_no_overrides(self) -> None:
        pdf_by_year = resolve_pdf_by_year(None)
        self.assertEqual(pdf_by_year[2018].name, "2018 Taxing District Levy Percentages.pdf")
        self.assertEqual(pdf_by_year[2025].name, "2025 Taxing District Levy Percentage.pdf")

    def test_merges_repeatable_overrides(self) -> None:
        import tempfile
        from pathlib import Path

        with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
            override_path = tmp.name
            pdf_by_year = resolve_pdf_by_year([("2024", override_path)])
            resolved = pdf_by_year[2024]
            self.assertIsInstance(resolved, Path)
            self.assertTrue(resolved.is_file())
            self.assertEqual(str(resolved), override_path)
        self.assertEqual(
            pdf_by_year[2025].name,
            "2025 Taxing District Levy Percentage.pdf",
        )


if __name__ == "__main__":
    unittest.main()
