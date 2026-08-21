#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Phase 5 ingest tests: situs keys, parcel-record shards, refuse public write.

Synthetic ids only (tools/synthetic_test_ids.py). No mart CSVs required.
"""

from __future__ import annotations

import csv
import json
import tempfile
import unittest
from pathlib import Path

from ingest.compare import compare_dirs
from ingest.parcel_record import (
    PARCEL_RECORD_SHARD_PREFIX_LEN,
    parcel_record_from_logical_row,
    write_parcel_record_shards,
)
from ingest.reader import load_mapping
from ingest.situs import (
    SITUS_LOOKUP_VERSION,
    accumulate_situs_row,
    finalize_situs_map,
    format_situs_label,
    merge_aggregate_situs_keys,
    normalize_street_name_key,
    normalize_street_number_key,
    row_situs_lookup_key,
)
from ingest.writer import write_comparison_dir
from synthetic_test_ids import SYNTHETIC_PIN, SYNTHETIC_PIN_SHARD_PREFIX


_MAPPING_PATH = (
    Path(__file__).resolve().parent / "ingest" / "mappings" / "arapahoe.json"
)


def _write_csv(path: Path, headers: list[str], rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in rows:
            writer.writerow(row)


class TestSitusNormalization(unittest.TestCase):
    def test_street_name_drops_dir_and_type(self) -> None:
        self.assertEqual(normalize_street_name_key("W Evans Ave"), "EVANS")
        self.assertEqual(normalize_street_name_key("South Tejon Street"), "TEJON")

    def test_street_number_keeps_suffix_chars(self) -> None:
        self.assertEqual(normalize_street_number_key("123", "1/2"), "1231/2")
        self.assertEqual(normalize_street_number_key(" 10 ", ""), "10")

    def test_lookup_key_and_label(self) -> None:
        row = {
            "pin": SYNTHETIC_PIN,
            "sa_addr_number": "1940",
            "sa_street_number_sfx": "",
            "sa_predirectional": "W",
            "sa_street_name": "Evans",
            "sa_street_type": "Ave",
            "sa_postdirectional": "",
            "sa_unit_number": "",
            "sa_city": "Englewood",
            "sa_state": "CO",
            "sa_postal_cd": "80110",
        }
        self.assertEqual(row_situs_lookup_key(row), "1940|EVANS|")
        label = format_situs_label(row)
        self.assertIn("1940 W Evans Ave", label)
        self.assertIn("Englewood, CO 80110", label)

    def test_skips_placeholder_zero_and_tag_street(self) -> None:
        self.assertIsNone(
            row_situs_lookup_key(
                {
                    "sa_addr_number": "0",
                    "sa_street_name": "Main",
                    "sa_unit_number": "",
                }
            )
        )
        self.assertIsNone(
            row_situs_lookup_key(
                {
                    "sa_addr_number": "100",
                    "sa_street_name": "TAG 12",
                    "sa_unit_number": "",
                }
            )
        )

    def test_merge_aggregate_unit_optional_parent(self) -> None:
        by_key = {
            "10|MAIN|A": [{"pin": SYNTHETIC_PIN, "label": "10 Main Unit A"}],
            "10|MAIN|B": [{"pin": "010000002", "label": "10 Main Unit B"}],
        }
        merged = merge_aggregate_situs_keys(by_key)
        self.assertIn("10|MAIN|", merged)
        pins = {x["pin"] for x in merged["10|MAIN|"]}
        self.assertEqual(pins, {SYNTHETIC_PIN, "010000002"})

    def test_lookup_version_is_two(self) -> None:
        self.assertEqual(SITUS_LOOKUP_VERSION, 2)


class TestParcelRecordShards(unittest.TestCase):
    def test_refuse_public_shard_write(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            # Simulate a path under public/ by using classify's repo-relative check:
            # path_is_under_public only matches the real repo public/. Build a
            # fake tree named public under tmp and patch via write that checks
            # path_is_under_public — that only trips on repo public/.
            # So call write_parcel_record_shards with the real public/data path
            # (must refuse without writing).
            repo_public = Path(__file__).resolve().parent.parent / "public" / "data"
            if not repo_public.is_dir():
                self.skipTest("public/data not present")
            with self.assertRaises(ValueError) as ctx:
                write_parcel_record_shards(
                    repo_public,
                    {SYNTHETIC_PIN: {"ain": "x"}},
                    {"bundledAsOf": "2026-07-15T12:00:00Z"},
                )
            self.assertIn("public/", str(ctx.exception))

    def test_writes_shard_by_prefix(self) -> None:
        rec = parcel_record_from_logical_row(
            {
                "ain": "1000-00-0-00-001",
                "sa_free_form_addr": "1 Test St",
                "sa_city": "Testville",
                "owner_list": "Test Owner",
                "total_actual": "100000",
                "total_assessed": "7000",
                "parcel_tax_year": "2025",
                "assessment_year": "2025",
                "tax_roll_descr": "REAL",
                "state_use_cd": "1112",
                "property_class_descr": "Improvement",
                "improvement_actual": "80000",
                "land_actual": "20000",
            }
        )
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            write_parcel_record_shards(
                out,
                {SYNTHETIC_PIN: rec},
                {"bundledAsOf": "2026-07-15T12:00:00Z", "source": "test"},
            )
            shard = out / "arapahoe-parcel-record-by-pin" / f"{SYNTHETIC_PIN_SHARD_PREFIX}.json"
            self.assertTrue(shard.is_file())
            data = json.loads(shard.read_text(encoding="utf-8"))
            self.assertEqual(data["shardPrefix"], SYNTHETIC_PIN_SHARD_PREFIX)
            self.assertEqual(data["pinDigits"], 9)
            self.assertIn(SYNTHETIC_PIN, data["byPin"])
            self.assertEqual(
                len(SYNTHETIC_PIN_SHARD_PREFIX), PARCEL_RECORD_SHARD_PREFIX_LEN
            )


class TestSitusShardsEndToEnd(unittest.TestCase):
    def test_write_comparison_dir_situs_and_shards(self) -> None:
        mapping = load_mapping(_MAPPING_PATH)
        stack_rows = [
            {
                "taxAreaId": "T1",
                "lineCode": "100",
                "authorityName": "Test Auth",
                "taxYear": "2025",
                "effectiveYear": "2025",
                "status": "A",
            }
        ]
        account_rows = [
            {
                "accountId": SYNTHETIC_PIN,
                "taxAreaId": "T1",
                "tagShortDescr": "Test",
                "totalActual": 1.0,
                "totalAssessed": 1.0,
                "parcelTaxYear": "2025",
                "assessmentYear": "2025",
                "propertyClassDescr": None,
                "ownerList": None,
                "ain": None,
            }
        ]
        situs_by_key: dict[str, dict[str, str]] = {}
        accumulate_situs_row(
            situs_by_key,
            {
                "pin": SYNTHETIC_PIN,
                "sa_addr_number": "100",
                "sa_street_number_sfx": "",
                "sa_street_name": "Oak",
                "sa_street_type": "St",
                "sa_predirectional": "",
                "sa_postdirectional": "",
                "sa_unit_number": "",
                "sa_city": "Aurora",
                "sa_state": "CO",
                "sa_postal_cd": "80010",
            },
            SYNTHETIC_PIN,
        )
        situs_map = finalize_situs_map(situs_by_key)
        parcel_map = {
            SYNTHETIC_PIN: parcel_record_from_logical_row(
                {
                    "sa_free_form_addr": "100 Oak St",
                    "sa_city": "Aurora",
                    "total_actual": "1",
                    "total_assessed": "1",
                }
            )
        }
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            write_comparison_dir(
                out,
                stack_rows=stack_rows,
                account_rows=account_rows,
                mapping=mapping,
                bundled_as_of="2026-07-15",
                tax_year="2025",
                dola_join=None,
                situs_map=situs_map,
                parcel_record_map=parcel_map,
                sibling_paths={},
                skip_neighborhood=True,
            )
            situs_path = out / "arapahoe-situs-to-pins.json"
            self.assertTrue(situs_path.is_file())
            situs = json.loads(situs_path.read_text(encoding="utf-8"))
            self.assertEqual(situs["lookupVersion"], 2)
            self.assertIn("100|OAK|", situs["byKey"])
            shard = (
                out
                / "arapahoe-parcel-record-by-pin"
                / f"{SYNTHETIC_PIN_SHARD_PREFIX}.json"
            )
            self.assertTrue(shard.is_file())

    def test_compare_shards_when_both_present(self) -> None:
        # compare_dirs ignores snapshot metadata (including shard snapshots), so
        # differing snapshot.source alone must not fail the compare.
        payload = {
            "snapshot": {"source": "a"},
            "pinDigits": 9,
            "shardPrefix": SYNTHETIC_PIN_SHARD_PREFIX,
            "byPin": {SYNTHETIC_PIN: {"ain": "x"}},
        }
        with tempfile.TemporaryDirectory() as a_tmp, tempfile.TemporaryDirectory() as b_tmp:
            a = Path(a_tmp)
            b = Path(b_tmp)
            for d in (a, b):
                (d / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                    json.dumps(
                        {
                            "snapshot": {},
                            "stacksByTagId": {
                                "T1": {
                                    "tagId": "T1",
                                    "taxYear": "2025",
                                    "levyAspxUrl": "u",
                                    "lines": [],
                                }
                            },
                        }
                    ),
                    encoding="utf-8",
                )
                (d / "arapahoe-pin-to-tag.json").write_text(
                    json.dumps({"snapshot": {}, "pinDigits": 9, "byPin": {}}),
                    encoding="utf-8",
                )
                shard_dir = d / "arapahoe-parcel-record-by-pin"
                shard_dir.mkdir()
                shard = dict(payload)
                shard["snapshot"] = {"source": str(d)}
                (shard_dir / f"{SYNTHETIC_PIN_SHARD_PREFIX}.json").write_text(
                    json.dumps(shard), encoding="utf-8"
                )
            result = compare_dirs(a, b)
        self.assertTrue(result.identical)

    def test_compare_missing_shard_dir_is_difference(self) -> None:
        with tempfile.TemporaryDirectory() as a_tmp, tempfile.TemporaryDirectory() as b_tmp:
            a = Path(a_tmp)
            b = Path(b_tmp)
            for d in (a, b):
                (d / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                    json.dumps({"snapshot": {}, "stacksByTagId": {}}),
                    encoding="utf-8",
                )
                (d / "arapahoe-pin-to-tag.json").write_text(
                    json.dumps({"snapshot": {}, "pinDigits": 9, "byPin": {}}),
                    encoding="utf-8",
                )
            (a / "arapahoe-parcel-record-by-pin").mkdir()
            result = compare_dirs(a, b)
        self.assertFalse(result.identical)


if __name__ == "__main__":
    unittest.main()
