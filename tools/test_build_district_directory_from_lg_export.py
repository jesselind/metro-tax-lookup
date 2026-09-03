#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Unit tests for tools/build_district_directory_from_lg_export.py."""

from __future__ import annotations

import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path

_TOOLS = Path(__file__).resolve().parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))

from build_district_directory_from_lg_export import (  # noqa: E402
    build_directory_payload,
    collect_lg_ids_from_levy_stack_paths,
    collect_lg_ids_from_levy_stacks,
)


def _write_stacks(path: Path, lines_by_tag: dict[str, list[dict]]) -> None:
    stacks = {
        tag: {"tagId": tag, "lines": lines}
        for tag, lines in lines_by_tag.items()
    }
    path.write_text(
        json.dumps({"stacksByTagId": stacks}, indent=2) + "\n",
        encoding="utf-8",
    )


def _write_lg_csv(path: Path, rows: list[dict[str, str]]) -> None:
    fieldnames = [
        "LGID",
        "Local Government Name",
        "Website URL",
        "Mailing Address",
        "Alternate Address",
        "Mailing City",
        "Mailing State",
        "Mailing Zip",
        "Local Government Type",
    ]
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def _write_pt_csv(path: Path, rows: list[dict[str, str]]) -> None:
    fieldnames = [
        "Tax Entity ID",
        "DOLA Tax Entity Name",
        "Certifying County",
    ]
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


class BuildDistrictDirectoryTests(unittest.TestCase):
    def test_collect_lg_ids_normalizes_and_unions_counties(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            ara = root / "arapahoe-levy-stacks-by-tag-id.json"
            doug = root / "douglas-levy-stacks-by-tag-id.json"
            _write_stacks(
                ara,
                {
                    "1000": [
                        {"authorityName": "A", "dolaMatch": {"lgId": "64108"}},
                        {"authorityName": "B", "dolaMatch": {"lgId": "64108/1"}},
                    ]
                },
            )
            _write_stacks(
                doug,
                {
                    "0035": [
                        {"authorityName": "C", "dolaMatch": {"lgId": "18010"}},
                        {"authorityName": "County", "dolaMatch": {}},
                    ]
                },
            )
            self.assertEqual(collect_lg_ids_from_levy_stacks(ara), {"64108"})
            wanted, names = collect_lg_ids_from_levy_stack_paths([ara, doug])
            self.assertEqual(wanted, {"64108", "18010"})
            self.assertEqual(
                names,
                [
                    "arapahoe-levy-stacks-by-tag-id.json",
                    "douglas-levy-stacks-by-tag-id.json",
                ],
            )

    def test_build_unions_stacks_and_fills_pt_fallback(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            ara = root / "arapahoe-levy-stacks-by-tag-id.json"
            doug = root / "douglas-levy-stacks-by-tag-id.json"
            lg_csv = root / "lg-export-all.csv"
            pt_csv = root / "property-tax-entities-export.csv"

            _write_stacks(
                ara,
                {"1000": [{"authorityName": "SMFR", "dolaMatch": {"lgId": "64108"}}]},
            )
            _write_stacks(
                doug,
                {
                    "0035": [
                        {
                            "authorityName": "Soil",
                            "dolaMatch": {"lgId": "18010"},
                        },
                        {
                            "authorityName": "Missing both",
                            "dolaMatch": {"lgId": "99999"},
                        },
                    ]
                },
            )
            _write_lg_csv(
                lg_csv,
                [
                    {
                        "LGID": "64108",
                        "Local Government Name": "South Metro Fire Rescue",
                        "Website URL": "https://example.com/smfr",
                        "Mailing Address": "1 Main St",
                        "Alternate Address": "",
                        "Mailing City": "Centennial",
                        "Mailing State": "CO",
                        "Mailing Zip": "80112",
                        "Local Government Type": "Fire Protection Districts",
                    }
                ],
            )
            _write_pt_csv(
                pt_csv,
                [
                    {
                        "Tax Entity ID": "18010/1",
                        "DOLA Tax Entity Name": "Douglas County Soil Conservation District",
                        "Certifying County": "Douglas",
                    },
                    {
                        "Tax Entity ID": "64108/1",
                        "DOLA Tax Entity Name": "South Metro Fire Rescue Fire Protection District",
                        "Certifying County": "Arapahoe",
                    },
                ],
            )

            payload = build_directory_payload(
                lg_csv=lg_csv,
                levy_stacks=[ara, doug],
                property_tax_entities=pt_csv,
                certifying_counties=["Arapahoe", "Douglas"],
            )

            by_lg = {d["lgId"]: d for d in payload["districts"]}
            self.assertEqual(payload["districtCount"], 2)
            self.assertIn("64108", by_lg)
            self.assertEqual(by_lg["64108"]["websiteUrl"], "https://example.com/smfr")
            self.assertIn("18010", by_lg)
            self.assertIsNone(by_lg["18010"]["websiteUrl"])
            self.assertIn("Property Tax Entities", by_lg["18010"]["source"])

            meta = payload["_meta"]
            self.assertEqual(
                meta["levyStacksReferences"],
                [
                    "arapahoe-levy-stacks-by-tag-id.json",
                    "douglas-levy-stacks-by-tag-id.json",
                ],
            )
            self.assertEqual(
                meta["certifyingCountiesForPropertyTaxFallback"],
                ["Arapahoe", "Douglas"],
            )
            self.assertEqual(meta["lgIdsFilledFromPropertyTaxEntities"], ["18010"])
            self.assertEqual(meta["missingLgIdsInExport"], ["99999"])
            self.assertEqual(meta["referencedLgIdCount"], 3)


if __name__ == "__main__":
    unittest.main()
