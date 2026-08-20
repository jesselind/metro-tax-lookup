#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Phase 4 ingest tests: mapping file, reader, writer, compare.

Synthetic county data only (invented headers and ids). No mart CSVs.
Tests must pass without any files in supporting-data/.
"""

from __future__ import annotations

import csv
import json
import tempfile
import unittest
from pathlib import Path

from ingest.reader import (
    load_mapping,
    read_levy_stack_rows,
    read_account_rows,
    MappingError,
)
from ingest.writer import (
    build_levy_stacks_json,
    build_account_map_json,
    write_comparison_dir,
)
from ingest.compare import compare_dirs, DiffResult
from synthetic_test_ids import SYNTHETIC_PIN, SYNTHETIC_SCHEDULE_10


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _write_csv(path: Path, headers: list[str], rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in rows:
            writer.writerow(row)


def _arapahoe_mapping() -> dict:
    """Minimal Arapahoe-shaped mapping for tests (mirrors arapahoe.json structure)."""
    return {
        "county": "arapahoe",
        "identifierDigits": 9,
        "levyAspxTemplate": "https://parcelsearch.arapahoegov.com/Levy.aspx?id={taxAreaId}",
        "levyStack": {
            "file": "tag",
            "taxAreaId": "tag_id",
            "lineCode": "line_code",
            "authorityName": "authority_name",
            "taxYear": "tax_year",
            "effectiveYear": "effective_year",
            "status": "status",
        },
        "accountMap": {
            "file": "parcel",
            "accountId": "pin",
            "taxAreaId": "tag_id",
            "tagShortDescr": "tag_short_descr",
            "totalActual": "total_actual",
            "totalAssessed": "total_assessed",
            "parcelTaxYear": "parcel_tax_year",
            "assessmentYear": "assessment_year",
            "propertyClassDescr": "property_class_descr",
            "ownerList": "owner_list",
            "ain": "ain",
        },
        "columnAliases": {
            "tag": {
            "tag_id": ["TAGId", "Field2"],
            "tax_year": ["TaxYear", "Field3"],
            "line_code": ["LevyLineCode", "Field5"],
                "authority_name": ["AuthorityName", "Field6"],
                "effective_year": ["EffectiveYear", "Field7"],
                "status": ["Status", "Field8"],
            },
            "parcel": {
                "pin": ["Pin"],
                "tag_id": ["TAGId"],
                "tag_short_descr": ["TAGShortDescr"],
                "total_actual": ["TotalActual"],
                "total_assessed": ["TotalAssessed"],
                "parcel_tax_year": ["TaxYear"],
                "assessment_year": ["AssessmentYear"],
                "property_class_descr": ["PropertyClassDescr"],
                "owner_list": ["OwnerList"],
                "ain": ["AIN"],
            },
        },
    }


def _el_paso_mapping() -> dict:
    """Minimal El Paso-shaped mapping: schedule number, not Pin/TAGId."""
    return {
        "county": "el-paso-synthetic",
        "identifierDigits": 10,
        "levyAspxTemplate": "https://synthetic.example.test/levy?area={taxAreaId}",
        "levyStack": {
            "file": "mills",
            "taxAreaId": "tax_area",
            "lineCode": "entity_code",
            "authorityName": "entity_name",
        },
        "accountMap": {
            "file": "parcels",
            "accountId": "account_id",
            "taxAreaId": "tax_area",
            "totalActual": "actual_value",
            "totalAssessed": "assessed_value",
        },
        "columnAliases": {
            "mills": {
                "tax_area": ["TAX_AREA"],
                "entity_code": ["ENTITY_CODE"],
                "entity_name": ["ENTITY_NAME"],
            },
            "parcels": {
                "account_id": ["SCHEDULE"],
                "tax_area": ["TAX_AREA"],
                "actual_value": ["ACTUAL_VALUE"],
                "assessed_value": ["ASSESSED_VALUE"],
            },
        },
    }


# ---------------------------------------------------------------------------
# load_mapping
# ---------------------------------------------------------------------------

class LoadMappingTests(unittest.TestCase):
    def test_loads_valid_mapping_from_file(self) -> None:
        m = _arapahoe_mapping()
        with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as f:
            json.dump(m, f)
            path = Path(f.name)
        try:
            mapping = load_mapping(path)
            self.assertEqual(mapping["county"], "arapahoe")
            self.assertIn("levyStack", mapping)
            self.assertIn("accountMap", mapping)
        finally:
            path.unlink(missing_ok=True)

    def test_loads_shipped_arapahoe_mapping(self) -> None:
        """Repo mapping file must stay loadable (schema drift guard)."""
        path = Path(__file__).resolve().parent / "ingest" / "mappings" / "arapahoe.json"
        mapping = load_mapping(path)
        self.assertEqual(mapping["county"], "arapahoe")
        self.assertEqual(mapping["identifierDigits"], 9)
        self.assertIn("tag", mapping["columnAliases"])
        self.assertIn("parcel", mapping["columnAliases"])

    def test_missing_required_key_raises_mapping_error(self) -> None:
        bad = {"county": "test"}  # no levyStack, accountMap
        with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as f:
            json.dump(bad, f)
            path = Path(f.name)
        try:
            with self.assertRaises(MappingError):
                load_mapping(path)
        finally:
            path.unlink(missing_ok=True)

    def test_missing_file_raises_file_not_found(self) -> None:
        with self.assertRaises(FileNotFoundError):
            load_mapping(Path("/nonexistent/mapping.json"))


# ---------------------------------------------------------------------------
# read_levy_stack_rows — Arapahoe-shaped (named export)
# ---------------------------------------------------------------------------

class ReadLevyStackRowsArapahoeTests(unittest.TestCase):
    def test_reads_named_arapahoe_headers(self) -> None:
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            tag_path = Path(tmp) / "tag.csv"
            _write_csv(
                tag_path,
                ["TAGId", "LevyLineCode", "AuthorityName", "EffectiveYear", "Status"],
                [
                    ["1", "0601", "SYNTHETIC SCHOOL", "2025", "A"],
                    ["1", "2999", "SYNTHETIC COUNTY", "2025", "A"],
                    ["2", "0601", "SYNTHETIC SCHOOL", "2025", "A"],
                ],
            )
            rows = read_levy_stack_rows(tag_path, mapping)
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[0]["taxAreaId"], "1")
        self.assertEqual(rows[0]["lineCode"], "0601")
        self.assertEqual(rows[0]["authorityName"], "SYNTHETIC SCHOOL")

    def test_reads_field1_field6_arapahoe_headers(self) -> None:
        """Field1-Field6 headers map via columnAliases."""
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            tag_path = Path(tmp) / "tag.csv"
            _write_csv(
                tag_path,
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6", "Field7", "Field8"],
                [["1001", "5", "2025", "A", "0601", "SYNTH SCH", "2024", "A"]],
            )
            rows = read_levy_stack_rows(tag_path, mapping)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["taxAreaId"], "5")
        self.assertEqual(rows[0]["lineCode"], "0601")
        self.assertEqual(rows[0]["authorityName"], "SYNTH SCH")
        self.assertEqual(rows[0]["taxYear"], "2025")

    def test_skips_blank_taxareaid(self) -> None:
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            tag_path = Path(tmp) / "tag.csv"
            _write_csv(
                tag_path,
                ["TAGId", "LevyLineCode", "AuthorityName"],
                [
                    ["", "0601", "SYNTH"],
                    ["1", "0601", "SYNTH"],
                ],
            )
            rows = read_levy_stack_rows(tag_path, mapping)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["taxAreaId"], "1")

    def test_no_arapahoe_column_names_in_output(self) -> None:
        """Output records use shared field names, not Arapahoe CSV headers."""
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            tag_path = Path(tmp) / "tag.csv"
            _write_csv(
                tag_path,
                ["TAGId", "LevyLineCode", "AuthorityName"],
                [["1", "0601", "SYNTH SCHOOL"]],
            )
            rows = read_levy_stack_rows(tag_path, mapping)
        self.assertNotIn("TAGId", rows[0])
        self.assertNotIn("LevyLineCode", rows[0])
        self.assertNotIn("AuthorityName", rows[0])
        self.assertIn("taxAreaId", rows[0])
        self.assertIn("lineCode", rows[0])
        self.assertIn("authorityName", rows[0])


# ---------------------------------------------------------------------------
# read_levy_stack_rows — El Paso-shaped (10-digit schedule)
# ---------------------------------------------------------------------------

class ReadLevyStackRowsElPasoShapedTests(unittest.TestCase):
    def test_reads_el_paso_shaped_headers(self) -> None:
        mapping = _el_paso_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            mills_path = Path(tmp) / "mills.csv"
            _write_csv(
                mills_path,
                ["TAX_AREA", "ENTITY_CODE", "ENTITY_NAME"],
                [
                    ["9", "SCH", "SYNTHETIC SCHOOL DIST"],
                    ["9", "FIRE", "SYNTHETIC FIRE"],
                ],
            )
            rows = read_levy_stack_rows(mills_path, mapping)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["taxAreaId"], "9")
        self.assertEqual(rows[0]["lineCode"], "SCH")
        self.assertNotIn("TAX_AREA", rows[0])

    def test_output_identical_shape_regardless_of_county(self) -> None:
        """Same output field names for both Arapahoe and El Paso-shaped mappings."""
        ara_m = _arapahoe_mapping()
        ep_m = _el_paso_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            ara_path = Path(tmp) / "ara.csv"
            ep_path = Path(tmp) / "ep.csv"
            _write_csv(
                ara_path,
                ["TAGId", "LevyLineCode", "AuthorityName"],
                [["1", "0601", "SYNTH"]],
            )
            _write_csv(
                ep_path,
                ["TAX_AREA", "ENTITY_CODE", "ENTITY_NAME"],
                [["1", "0601", "SYNTH"]],
            )
            ara_rows = read_levy_stack_rows(ara_path, ara_m)
            ep_rows = read_levy_stack_rows(ep_path, ep_m)
        self.assertEqual(set(ara_rows[0].keys()), set(ep_rows[0].keys()))


# ---------------------------------------------------------------------------
# read_account_rows
# ---------------------------------------------------------------------------

class ReadAccountRowsTests(unittest.TestCase):
    def test_reads_arapahoe_shaped_headers(self) -> None:
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            parcel_path = Path(tmp) / "parcel.csv"
            _write_csv(
                parcel_path,
                ["Pin", "TAGId", "TotalActual", "TotalAssessed", "TaxYear",
                 "AssessmentYear", "PropertyClassDescr", "OwnerList", "AIN", "TAGShortDescr"],
                [
                    [SYNTHETIC_PIN, "1", "500000", "40000", "2025", "2025",
                     "Real", "SYNTH OWNER", "1000-00-0-00-001", "0001"],
                ],
            )
            rows = read_account_rows(parcel_path, mapping)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["accountId"], SYNTHETIC_PIN)
        self.assertEqual(rows[0]["taxAreaId"], "1")
        self.assertAlmostEqual(rows[0]["totalActual"], 500000.0)
        self.assertAlmostEqual(rows[0]["totalAssessed"], 40000.0)
        self.assertNotIn("Pin", rows[0])
        self.assertNotIn("TAGId", rows[0])

    def test_reads_el_paso_shaped_headers(self) -> None:
        mapping = _el_paso_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            parcel_path = Path(tmp) / "parcels.csv"
            _write_csv(
                parcel_path,
                ["SCHEDULE", "TAX_AREA", "ACTUAL_VALUE", "ASSESSED_VALUE"],
                [
                    [SYNTHETIC_SCHEDULE_10, "9", "300000", "24000"],
                ],
            )
            rows = read_account_rows(parcel_path, mapping)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["accountId"], SYNTHETIC_SCHEDULE_10)
        self.assertEqual(rows[0]["taxAreaId"], "9")

    def test_skips_blank_account_id(self) -> None:
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            parcel_path = Path(tmp) / "parcel.csv"
            _write_csv(
                parcel_path,
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
                [
                    ["", "1", "1", "1"],
                    [SYNTHETIC_PIN, "1", "1", "1"],
                ],
            )
            rows = read_account_rows(parcel_path, mapping)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["accountId"], SYNTHETIC_PIN)

    def test_parses_numeric_values(self) -> None:
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            parcel_path = Path(tmp) / "parcel.csv"
            _write_csv(
                parcel_path,
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
                [[SYNTHETIC_PIN, "1", "1,234,567", "99,876"]],
            )
            rows = read_account_rows(parcel_path, mapping)
        self.assertAlmostEqual(rows[0]["totalActual"], 1234567.0)
        self.assertAlmostEqual(rows[0]["totalAssessed"], 99876.0)

    def test_handles_missing_optional_columns_gracefully(self) -> None:
        """Mapping has optional columns (ain, ownerList) not in the CSV; should not crash."""
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            parcel_path = Path(tmp) / "parcel.csv"
            _write_csv(
                parcel_path,
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
                [[SYNTHETIC_PIN, "1", "100", "8"]],
            )
            rows = read_account_rows(parcel_path, mapping)
        self.assertEqual(len(rows), 1)
        self.assertIsNone(rows[0].get("ain"))
        self.assertIsNone(rows[0].get("ownerList"))


# ---------------------------------------------------------------------------
# Refuse to guess mills vs actual value (classifier concern; reader validates)
# ---------------------------------------------------------------------------

class ReadRefusesGuessTests(unittest.TestCase):
    def test_missing_required_levy_column_raises_mapping_error(self) -> None:
        """If the CSV does not have the mapped taxAreaId column, raise MappingError."""
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            tag_path = Path(tmp) / "tag.csv"
            _write_csv(
                tag_path,
                ["LevyLineCode", "AuthorityName"],  # no TAGId / Field2
                [["0601", "SYNTH"]],
            )
            with self.assertRaises(MappingError):
                read_levy_stack_rows(tag_path, mapping)

    def test_missing_required_account_column_raises_mapping_error(self) -> None:
        """If accountId column is absent, raise MappingError."""
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            parcel_path = Path(tmp) / "parcel.csv"
            _write_csv(
                parcel_path,
                ["TAGId", "TotalActual", "TotalAssessed"],  # no Pin
                [["1", "100", "8"]],
            )
            with self.assertRaises(MappingError):
                read_account_rows(parcel_path, mapping)


# ---------------------------------------------------------------------------
# build_levy_stacks_json
# ---------------------------------------------------------------------------

class BuildLevyStacksJsonTests(unittest.TestCase):
    def _minimal_rows(self) -> list[dict]:
        return [
            {"taxAreaId": "1", "lineCode": "0601", "authorityName": "SYNTH SCHOOL",
             "effectiveYear": "2025", "status": "A"},
            {"taxAreaId": "1", "lineCode": "2999", "authorityName": "SYNTH COUNTY",
             "effectiveYear": "2025", "status": "A"},
            {"taxAreaId": "2", "lineCode": "0601", "authorityName": "SYNTH SCHOOL",
             "effectiveYear": "2025", "status": "A"},
        ]

    def test_produces_stacksbytagid_structure(self) -> None:
        mapping = _arapahoe_mapping()
        rows = self._minimal_rows()
        result = build_levy_stacks_json(rows, mapping, bundled_as_of="2026-07-15")
        self.assertIn("snapshot", result)
        self.assertIn("stacksByTagId", result)
        self.assertIn("bundledAsOf", result["snapshot"])
        self.assertIn("2026-07-15", result["snapshot"]["bundledAsOf"])

    def test_groups_lines_by_tax_area(self) -> None:
        mapping = _arapahoe_mapping()
        rows = self._minimal_rows()
        result = build_levy_stacks_json(rows, mapping, bundled_as_of="2026-07-15")
        stacks = result["stacksByTagId"]
        self.assertIn("1", stacks)
        self.assertIn("2", stacks)
        self.assertEqual(len(stacks["1"]["lines"]), 2)
        self.assertEqual(len(stacks["2"]["lines"]), 1)

    def test_each_stack_has_tagid_and_levyaspxurl(self) -> None:
        mapping = _arapahoe_mapping()
        rows = self._minimal_rows()
        result = build_levy_stacks_json(rows, mapping, bundled_as_of="2026-07-15")
        stack = result["stacksByTagId"]["1"]
        self.assertEqual(stack["tagId"], "1")
        self.assertIn("levyAspxUrl", stack)
        self.assertIn("1", stack["levyAspxUrl"])

    def test_each_line_has_code_and_authorityname_and_dolamatch(self) -> None:
        mapping = _arapahoe_mapping()
        rows = self._minimal_rows()
        result = build_levy_stacks_json(rows, mapping, bundled_as_of="2026-07-15")
        line = result["stacksByTagId"]["1"]["lines"][0]
        self.assertIn("code", line)
        self.assertIn("authorityName", line)
        self.assertIn("dolaMatch", line)
        # dolaMatch must be an object with at least method and confidence
        self.assertIn("method", line["dolaMatch"])
        self.assertIn("confidence", line["dolaMatch"])

    def test_collapses_duplicate_code_and_authority_preferring_active(self) -> None:
        mapping = _arapahoe_mapping()
        rows = [
            {"taxAreaId": "1", "lineCode": "4408", "authorityName": "FITZ URA",
             "effectiveYear": "2013", "status": "I"},
            {"taxAreaId": "1", "lineCode": "4408", "authorityName": "FITZ URA",
             "effectiveYear": "2014", "status": "A"},
        ]
        result = build_levy_stacks_json(rows, mapping, bundled_as_of="2026-07-15")
        lines = result["stacksByTagId"]["1"]["lines"]
        self.assertEqual(len(lines), 1)
        self.assertEqual(lines[0]["status"], "A")
        self.assertEqual(lines[0]["effectiveYear"], "2014")

    def test_tax_year_from_levy_rows_when_cli_omits_it(self) -> None:
        mapping = _arapahoe_mapping()
        rows = [
            {"taxAreaId": "1", "lineCode": "0601", "authorityName": "SYNTH SCHOOL",
             "taxYear": "2025", "effectiveYear": "2025", "status": "A"},
        ]
        result = build_levy_stacks_json(rows, mapping, bundled_as_of="2026-07-15")
        self.assertEqual(result["stacksByTagId"]["1"]["taxYear"], "2025")

    def test_output_has_phase1_required_shape(self) -> None:
        """build_levy_stacks_json output must carry the Phase 1 required keys/shapes."""
        mapping = _arapahoe_mapping()
        rows = self._minimal_rows()
        result = build_levy_stacks_json(rows, mapping, bundled_as_of="2026-07-15")
        # Structural check mirrors appJsonValidate.ts validateArapahoeLevyStacksFile
        self.assertIsInstance(result.get("snapshot"), dict)
        self.assertTrue(result["snapshot"].get("bundledAsOf"))
        self.assertIsInstance(result.get("stacksByTagId"), dict)
        for tag_id, stack in result["stacksByTagId"].items():
            self.assertTrue(stack.get("tagId"))
            self.assertTrue(stack.get("levyAspxUrl"))
            for line in stack.get("lines", []):
                self.assertTrue(line.get("code"))
                self.assertTrue(line.get("authorityName"))
                self.assertIsInstance(line.get("dolaMatch"), dict)


# ---------------------------------------------------------------------------
# build_account_map_json
# ---------------------------------------------------------------------------

class BuildAccountMapJsonTests(unittest.TestCase):
    def _minimal_rows(self) -> list[dict]:
        return [
            {
                "accountId": SYNTHETIC_PIN,
                "taxAreaId": "1",
                "tagShortDescr": "0001",
                "totalActual": 500000.0,
                "totalAssessed": 40000.0,
                "parcelTaxYear": "2025",
                "assessmentYear": "2025",
                "propertyClassDescr": "Real",
                "ownerList": None,
                "ain": None,
            }
        ]

    def test_produces_bypin_structure(self) -> None:
        mapping = _arapahoe_mapping()
        rows = self._minimal_rows()
        result = build_account_map_json(rows, mapping, bundled_as_of="2026-07-15")
        self.assertIn("snapshot", result)
        self.assertIn("byPin", result)
        self.assertIn("pinDigits", result)

    def test_pindigits_matches_mapping_identifier_digits(self) -> None:
        mapping = _arapahoe_mapping()
        rows = self._minimal_rows()
        result = build_account_map_json(rows, mapping, bundled_as_of="2026-07-15")
        self.assertEqual(result["pinDigits"], 9)

    def test_el_paso_shaped_pindigits_is_10(self) -> None:
        mapping = _el_paso_mapping()
        rows = [
            {
                "accountId": SYNTHETIC_SCHEDULE_10,
                "taxAreaId": "9",
                "totalActual": 300000.0,
                "totalAssessed": 24000.0,
            }
        ]
        result = build_account_map_json(rows, mapping, bundled_as_of="2026-07-15")
        self.assertEqual(result["pinDigits"], 10)
        self.assertIn(SYNTHETIC_SCHEDULE_10, result["byPin"])

    def test_each_row_has_tagid_and_tagshortdescr(self) -> None:
        mapping = _arapahoe_mapping()
        rows = self._minimal_rows()
        result = build_account_map_json(rows, mapping, bundled_as_of="2026-07-15")
        row = result["byPin"][SYNTHETIC_PIN]
        self.assertEqual(row["tagId"], "1")
        self.assertEqual(row["tagShortDescr"], "0001")

    def test_output_passes_phase1_validator_shape(self) -> None:
        mapping = _arapahoe_mapping()
        rows = self._minimal_rows()
        result = build_account_map_json(rows, mapping, bundled_as_of="2026-07-15")
        self.assertIsInstance(result.get("snapshot"), dict)
        self.assertTrue(result["snapshot"].get("bundledAsOf"))
        self.assertIsInstance(result.get("pinDigits"), int)
        self.assertGreater(result["pinDigits"], 0)
        self.assertIsInstance(result.get("byPin"), dict)
        for pin, row in result["byPin"].items():
            self.assertEqual(len(pin), result["pinDigits"])
            self.assertTrue(row.get("tagId"))
            self.assertTrue(row.get("tagShortDescr"))


# ---------------------------------------------------------------------------
# write_comparison_dir
# ---------------------------------------------------------------------------

class WriteComparisonDirTests(unittest.TestCase):
    def test_writes_levy_stacks_and_account_map_json(self) -> None:
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp) / "ingest-out"
            stack_rows = [
                {"taxAreaId": "1", "lineCode": "0601", "authorityName": "SYNTH SCHOOL",
                 "effectiveYear": "2025", "status": "A"},
            ]
            account_rows = [
                {
                    "accountId": SYNTHETIC_PIN,
                    "taxAreaId": "1",
                    "tagShortDescr": "0001",
                    "totalActual": 500000.0,
                    "totalAssessed": 40000.0,
                }
            ]
            write_comparison_dir(
                out_dir,
                stack_rows=stack_rows,
                account_rows=account_rows,
                mapping=mapping,
                bundled_as_of="2026-07-15",
            )
            stacks_path = out_dir / "arapahoe-levy-stacks-by-tag-id.json"
            account_path = out_dir / "arapahoe-pin-to-tag.json"
            self.assertTrue(stacks_path.exists(), "levy stacks file missing")
            self.assertTrue(account_path.exists(), "account map file missing")
            stacks = json.loads(stacks_path.read_text(encoding="utf-8"))
            acct = json.loads(account_path.read_text(encoding="utf-8"))
            self.assertIn("stacksByTagId", stacks)
            self.assertIn("byPin", acct)

    def test_drops_tax_areas_not_on_any_account(self) -> None:
        mapping = _arapahoe_mapping()
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp) / "ingest-out"
            write_comparison_dir(
                out_dir,
                stack_rows=[
                    {"taxAreaId": "1", "lineCode": "0601", "authorityName": "USED",
                     "effectiveYear": "2025", "status": "A"},
                    {"taxAreaId": "99", "lineCode": "ASSRFEES", "authorityName": "UNUSED",
                     "effectiveYear": "2025", "status": "A"},
                ],
                account_rows=[
                    {"accountId": SYNTHETIC_PIN, "taxAreaId": "1", "tagShortDescr": "0001"}
                ],
                mapping=mapping,
                bundled_as_of="2026-07-15",
            )
            stacks = json.loads(
                (out_dir / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8")
            )
            self.assertIn("1", stacks["stacksByTagId"])
            self.assertNotIn("99", stacks["stacksByTagId"])

    def test_refuses_out_dir_under_public(self) -> None:
        from ingest.classify import PUBLIC_DIR

        mapping = _arapahoe_mapping()
        with self.assertRaises(ValueError) as ctx:
            write_comparison_dir(
                PUBLIC_DIR / "data",
                stack_rows=[
                    {"taxAreaId": "1", "lineCode": "0601", "authorityName": "SYNTH",
                     "effectiveYear": "2025", "status": "A"}
                ],
                account_rows=[
                    {"accountId": SYNTHETIC_PIN, "taxAreaId": "1", "tagShortDescr": "0001"}
                ],
                mapping=mapping,
                bundled_as_of="2026-07-15",
            )
        self.assertIn("public/", str(ctx.exception))

    def test_does_not_write_outside_comparison_dir(self) -> None:
        """write_comparison_dir must not touch public/data/."""
        import os
        from ingest.classify import PUBLIC_DIR
        before: dict[str, object] = {}
        if PUBLIC_DIR.is_dir():
            for dirpath, _, filenames in os.walk(PUBLIC_DIR, followlinks=False):
                for name in filenames:
                    path = Path(dirpath) / name
                    st = path.lstat()
                    rel = path.relative_to(PUBLIC_DIR).as_posix()
                    before[rel] = (st.st_mtime_ns, st.st_size)

        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp) / "ingest-out"
            write_comparison_dir(
                out_dir,
                stack_rows=[
                    {"taxAreaId": "1", "lineCode": "0601", "authorityName": "SYNTH",
                     "effectiveYear": "2025", "status": "A"}
                ],
                account_rows=[
                    {"accountId": SYNTHETIC_PIN, "taxAreaId": "1", "tagShortDescr": "0001"}
                ],
                mapping=_arapahoe_mapping(),
                bundled_as_of="2026-07-15",
            )

        after: dict[str, object] = {}
        if PUBLIC_DIR.is_dir():
            for dirpath, _, filenames in os.walk(PUBLIC_DIR, followlinks=False):
                for name in filenames:
                    path = Path(dirpath) / name
                    st = path.lstat()
                    rel = path.relative_to(PUBLIC_DIR).as_posix()
                    after[rel] = (st.st_mtime_ns, st.st_size)
        self.assertEqual(before, after)


# ---------------------------------------------------------------------------
# compare_dirs
# ---------------------------------------------------------------------------

class CompareDirsTests(unittest.TestCase):
    def _make_stacks(self, tax_year: str = "2025") -> dict:
        return {
            "snapshot": {"bundledAsOf": "2026-07-15", "source": "test"},
            "stacksByTagId": {
                "1": {
                    "tagId": "1",
                    "taxYear": tax_year,
                    "levyAspxUrl": "https://example.test/levy?id=1",
                    "lines": [
                        {"code": "0601", "authorityName": "SYNTH SCHOOL",
                         "dolaMatch": {"method": "none", "confidence": "low"}}
                    ],
                }
            },
        }

    def _make_account(self) -> dict:
        return {
            "snapshot": {"bundledAsOf": "2026-07-15", "source": "test"},
            "pinDigits": 9,
            "byPin": {
                SYNTHETIC_PIN: {"tagId": "1", "tagShortDescr": "0001"}
            },
        }

    def test_identical_dirs_produce_empty_diff(self) -> None:
        with tempfile.TemporaryDirectory() as a_tmp, tempfile.TemporaryDirectory() as b_tmp:
            a = Path(a_tmp)
            b = Path(b_tmp)
            for d in (a, b):
                (d / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                    json.dumps(self._make_stacks()), encoding="utf-8"
                )
                (d / "arapahoe-pin-to-tag.json").write_text(
                    json.dumps(self._make_account()), encoding="utf-8"
                )
            result = compare_dirs(a, b)
        self.assertTrue(result.identical, result.format_human())
        self.assertEqual(len(result.differences), 0)

    def test_changed_field_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as a_tmp, tempfile.TemporaryDirectory() as b_tmp:
            a = Path(a_tmp)
            b = Path(b_tmp)
            (a / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                json.dumps(self._make_stacks("2025")), encoding="utf-8"
            )
            (b / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                json.dumps(self._make_stacks("2024")), encoding="utf-8"
            )
            (a / "arapahoe-pin-to-tag.json").write_text(
                json.dumps(self._make_account()), encoding="utf-8"
            )
            (b / "arapahoe-pin-to-tag.json").write_text(
                json.dumps(self._make_account()), encoding="utf-8"
            )
            result = compare_dirs(a, b)
        self.assertFalse(result.identical)
        self.assertGreater(len(result.differences), 0)

    def test_file_only_in_one_dir_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as a_tmp, tempfile.TemporaryDirectory() as b_tmp:
            a = Path(a_tmp)
            b = Path(b_tmp)
            (a / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                json.dumps(self._make_stacks()), encoding="utf-8"
            )
            # b has no stacks file
            result = compare_dirs(a, b)
        self.assertFalse(result.identical)
        self.assertGreater(len(result.differences), 0)

    def test_diff_result_has_format_human(self) -> None:
        with tempfile.TemporaryDirectory() as a_tmp, tempfile.TemporaryDirectory() as b_tmp:
            a = Path(a_tmp)
            b = Path(b_tmp)
            (a / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                json.dumps(self._make_stacks("2025")), encoding="utf-8"
            )
            (b / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                json.dumps(self._make_stacks("2024")), encoding="utf-8"
            )
            result = compare_dirs(a, b)
        human = result.format_human()
        self.assertIsInstance(human, str)
        self.assertGreater(len(human.strip()), 0)

    def test_snapshot_fields_excluded_from_diff(self) -> None:
        """snapshot.bundledAsOf and snapshot.source differ between old and new rebuild;
        the compare should skip those fields so transient metadata does not count as a difference."""
        with tempfile.TemporaryDirectory() as a_tmp, tempfile.TemporaryDirectory() as b_tmp:
            a = Path(a_tmp)
            b = Path(b_tmp)
            stacks_a = self._make_stacks()
            stacks_b = self._make_stacks()
            stacks_a["snapshot"]["bundledAsOf"] = "2026-07-01"
            stacks_b["snapshot"]["bundledAsOf"] = "2026-07-15"
            stacks_a["snapshot"]["source"] = "old script"
            stacks_b["snapshot"]["source"] = "new ingest"
            (a / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                json.dumps(stacks_a), encoding="utf-8"
            )
            (b / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                json.dumps(stacks_b), encoding="utf-8"
            )
            (a / "arapahoe-pin-to-tag.json").write_text(
                json.dumps(self._make_account()), encoding="utf-8"
            )
            (b / "arapahoe-pin-to-tag.json").write_text(
                json.dumps(self._make_account()), encoding="utf-8"
            )
            result = compare_dirs(a, b)
        # snapshot-only differences should not fail the compare
        self.assertTrue(result.identical, result.format_human())

    def test_dolamatch_excluded_from_diff(self) -> None:
        """Phase 4 ingest leaves dolaMatch method=none; production may have mills. Not structural."""
        with tempfile.TemporaryDirectory() as a_tmp, tempfile.TemporaryDirectory() as b_tmp:
            a = Path(a_tmp)
            b = Path(b_tmp)
            stacks_a = self._make_stacks()
            stacks_b = self._make_stacks()
            stacks_a["stacksByTagId"]["1"]["lines"][0]["dolaMatch"] = {
                "method": "exact",
                "confidence": "high",
                "mills": 12.345,
            }
            stacks_b["stacksByTagId"]["1"]["lines"][0]["dolaMatch"] = {
                "method": "none",
                "confidence": "low",
            }
            for d, payload in ((a, stacks_a), (b, stacks_b)):
                (d / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                    json.dumps(payload), encoding="utf-8"
                )
                (d / "arapahoe-pin-to-tag.json").write_text(
                    json.dumps(self._make_account()), encoding="utf-8"
                )
            result = compare_dirs(a, b)
        self.assertTrue(result.identical, result.format_human())

    def test_unreadable_json_is_reported_not_treated_as_missing(self) -> None:
        with tempfile.TemporaryDirectory() as a_tmp, tempfile.TemporaryDirectory() as b_tmp:
            a = Path(a_tmp)
            b = Path(b_tmp)
            (a / "arapahoe-levy-stacks-by-tag-id.json").write_text("{not-json", encoding="utf-8")
            (b / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                json.dumps(self._make_stacks()), encoding="utf-8"
            )
            (a / "arapahoe-pin-to-tag.json").write_text(
                json.dumps(self._make_account()), encoding="utf-8"
            )
            (b / "arapahoe-pin-to-tag.json").write_text(
                json.dumps(self._make_account()), encoding="utf-8"
            )
            result = compare_dirs(a, b)
        self.assertFalse(result.identical)
        self.assertTrue(
            any("unreadable" in str(d.a_value) for d in result.differences),
            result.format_human(),
        )

    def test_extra_unrelated_json_in_dir_a_is_ignored(self) -> None:
        with tempfile.TemporaryDirectory() as a_tmp, tempfile.TemporaryDirectory() as b_tmp:
            a = Path(a_tmp)
            b = Path(b_tmp)
            payload_stacks = json.dumps(self._make_stacks())
            payload_acct = json.dumps(self._make_account())
            for d in (a, b):
                (d / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                    payload_stacks, encoding="utf-8"
                )
                (d / "arapahoe-pin-to-tag.json").write_text(
                    payload_acct, encoding="utf-8"
                )
            (a / "metro-levies-2026.json").write_text("{}", encoding="utf-8")
            (a / "arapahoe-situs-to-pins.json").write_text("{}", encoding="utf-8")
            result = compare_dirs(a, b)
        self.assertTrue(result.identical, result.format_human())


if __name__ == "__main__":
    unittest.main()
