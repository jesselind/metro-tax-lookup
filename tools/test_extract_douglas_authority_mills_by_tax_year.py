#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Unit tests for Douglas mill-PDF → AUTH mills helpers (no PDF required)."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from extract_authority_mills_by_tax_year import build_shipping_payload
from extract_douglas_authority_mills_by_tax_year import (
    authority_codes_for_douglas_page_map,
    mill_pdf_rows_to_authority_levy_rows,
)
from ingest.mill_pdf import parse_tax_district_mill_pdf_texts


class MillPdfToAuthorityLevyRowTests(unittest.TestCase):
    def test_maps_tax_district_and_page(self) -> None:
        parsed = parse_tax_district_mill_pdf_texts(
            [
                "2024 Tax Districts and Mill Levies\n"
                "Tax District: 35\n"
                "0001 Douglas County Government 19.774\n"
            ]
        )
        rows = mill_pdf_rows_to_authority_levy_rows(parsed, 2024)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0].taxYear, 2024)
        self.assertEqual(rows[0].pdfTag, "0035")
        self.assertEqual(rows[0].authority, "0001")
        self.assertEqual(rows[0].description, "Douglas County Government")
        self.assertAlmostEqual(rows[0].mills, 19.774)
        self.assertEqual(rows[0].pageNumber, 1)


class DouglasPageMapCodesTests(unittest.TestCase):
    def test_includes_registry_douglas_codes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            chain = Path(tmp) / "chain.json"
            registry = Path(tmp) / "registry.json"
            chain.write_text(
                json.dumps(
                    {
                        "entries": [
                            {"match": {"levyLineCode": "0501"}},
                            {"match": {"registryId": "smfr-fire"}},
                        ]
                    }
                ),
                encoding="utf-8",
            )
            registry.write_text(
                json.dumps(
                    {
                        "authorities": [
                            {
                                "levyLineCodeByCounty": {
                                    "arapahoe": "4100",
                                    "douglas": "4014",
                                }
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            codes = authority_codes_for_douglas_page_map(chain, registry)
            self.assertEqual(codes, ["0501", "4014"])


class DouglasShippingPayloadTests(unittest.TestCase):
    def test_uses_mill_pdf_source_type_and_resident_urls(self) -> None:
        from extract_authority_mills_by_tax_year import (
            AuthorityLevyRow,
            build_authority_mills_for_year,
        )

        year = build_authority_mills_for_year(
            [
                AuthorityLevyRow(
                    2025, "0035", "4014", "SMFR", 12.25, None, 10
                )
            ]
        )
        payload = build_shipping_payload(
            {2025: year},
            source_files={2025: "supporting-data/douglas/2025.pdf"},
            bundled_as_of="2026-09-02",
            resident_url_by_tax_year={
                2025: "https://www.douglasco.gov/documents/2025-tax-districts-and-mill-levies.pdf"
            },
            source_type="tax_districts_and_mill_levies",
            source_title_template="{taxYear} Tax Districts and Mill Levies",
        )
        source = payload["_meta"]["sources"][0]
        self.assertEqual(source["type"], "tax_districts_and_mill_levies")
        self.assertEqual(source["title"], "2025 Tax Districts and Mill Levies")
        self.assertTrue(source["residentUrl"].startswith("https://"))
        self.assertEqual(
            payload["authorities"]["4014"]["millsByTaxYear"]["2025"],
            12.25,
        )


if __name__ == "__main__":
    unittest.main()
