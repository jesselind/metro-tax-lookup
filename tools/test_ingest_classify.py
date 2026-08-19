#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Classifier tests: synthetic drop folders, invented headers only. No mart CSVs."""

from __future__ import annotations

import csv
import io
import json
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

from ingest.classify import (
    PUBLIC_DIR,
    classify_drop,
    json_out_is_forbidden,
    main,
)
from synthetic_test_ids import SYNTHETIC_PIN, SYNTHETIC_SCHEDULE_10


def _write_csv(path: Path, headers: list[str], rows: list[list[str]] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in rows or []:
            writer.writerow(row)


def _write_geojson(path: Path, property_keys: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    props = {k: "" for k in property_keys}
    payload = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": props,
                "geometry": None,
            }
        ],
    }
    path.write_text(json.dumps(payload), encoding="utf-8")


def _minimal_pdf(path: Path, text: str = "Hello") -> None:
    """Tiny PDF with one Helvetica string. No parcel data."""
    # Keep this short; pdfplumber is optional. Extension is enough for unknown-pdf.
    body = f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET"
    content = f"<< /Length {len(body)} >>\nstream\n{body}\nendstream"
    pdf = "\n".join(
        [
            "%PDF-1.1",
            "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
            "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
            "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            "/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
            f"4 0 obj{content}endobj",
            "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
            "trailer<< /Root 1 0 R >>",
            "%%EOF",
            "",
        ]
    )
    path.write_bytes(pdf.encode("latin-1"))


class ClassifyArapahoeShapedDropTests(unittest.TestCase):
    def test_arapahoe_headers_ready_for_required_and_optional(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "Main Parcel Table (CSV)" / "Main Parcel Table.csv",
                [
                    "Pin",
                    "TAGId",
                    "AIN",
                    "TotalActual",
                    "TotalAssessed",
                    "TaxRollDescr",
                    "SAAddrNumber",
                    "SAStreetName",
                    "SACity",
                    "SAState",
                    "SAPostalCd",
                ],
                [[SYNTHETIC_PIN, "1", "", "1", "1", "Real", "1", "SYNTHETIC", "X", "CO", "80000"]],
            )
            _write_csv(
                drop
                / "Tax Authority Groups and Tax Authorities (CSV)"
                / "Tax Authority Groups and Tax Authorities.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6", "Field7", "Field8"],
            )
            _write_csv(
                drop / "dola" / "property-tax-entities-export.csv",
                ["Certifying County", "Tax Entity ID", "DOLA Tax Entity Name"],
            )
            _write_csv(
                drop / "Parcel Legal Descriptions (CSV)" / "Parcel Legal Descriptions.csv",
                ["PIN", "AssessmentYear", "DescrType", "DisplayDescr"],
            )
            _write_geojson(
                drop / "parcels.geojson",
                ["PIN", "Neighborhood_Code", "Neighborhood"],
            )
            report = classify_drop(drop)
            self.assertTrue(report.ok)
            self.assertIsNone(report.hard_fail)
            self.assertEqual(report.coverage["levyStacks"].status, "ready")
            self.assertEqual(report.coverage["accountMap"].status, "ready")
            self.assertEqual(report.coverage["situs"].status, "ready")
            self.assertEqual(report.coverage["shards"].status, "ready")
            self.assertEqual(report.coverage["compsPdf"].status, "will-be-off")
            self.assertFalse(report.recommended_feature_flags["compsPdf"])
            sigs = {f.signature for f in report.files}
            self.assertIn("arapahoe-main-parcel", sigs)
            self.assertIn("arapahoe-tax-authority-groups", sigs)
            self.assertIn("dola-property-tax-entities", sigs)
            self.assertIn("gis-parcels", sigs)


class ClassifyMappingNeededTests(unittest.TestCase):
    def test_schedule_style_headers_mapping_needed_not_crash(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "parcels.csv",
                [
                    "SCHEDULE",
                    "SITUS",
                    "ACTUAL_VALUE",
                    "ASSESSED_VALUE",
                    "TAX_AREA",
                ],
                [[SYNTHETIC_SCHEDULE_10, "1 SYNTHETIC ST", "1", "1", "9"]],
            )
            _write_csv(
                drop / "mills.csv",
                ["ENTITY_NAME", "MILLS"],
                [["SYNTHETIC FIRE", "1.0"]],
            )
            report = classify_drop(drop)
            self.assertTrue(report.ok, report.format_human())
            self.assertIsNone(report.hard_fail)
            self.assertEqual(report.coverage["levyStacks"].status, "mapping-needed")
            self.assertEqual(report.coverage["accountMap"].status, "mapping-needed")
            self.assertEqual(report.coverage["situs"].status, "mapping-needed")
            self.assertEqual(report.coverage["shards"].status, "mapping-needed")
            self.assertNotIn("Pin", {h for f in report.files for h in f.headers})
            self.assertNotIn("TAGId", {h for f in report.files for h in f.headers})


class ClassifyUnknownAndMissingTests(unittest.TestCase):
    def test_unknown_pdf_and_csv_new_reader_or_will_be_off(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(drop / "mystery.csv", ["Foo", "Bar", "Baz"])
            _minimal_pdf(drop / "mystery.pdf", "lorem ipsum")
            report = classify_drop(drop)
            sigs = {f.signature for f in report.files}
            self.assertIn("unknown-csv", sigs)
            self.assertTrue(
                {"unknown-pdf", "unknown-comps-pdf", "unknown-mill-pdf"} & sigs
            )
            self.assertIn(
                report.coverage["levyStacks"].status,
                {"new-reader", "will-be-off"},
            )
            self.assertEqual(report.coverage["compsPdf"].status, "will-be-off")

    def test_missing_levy_stack_source_hard_fail(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "Main Parcel Table.csv",
                ["Pin", "TAGId", "TotalActual", "TotalAssessed", "SAAddrNumber", "SAStreetName"],
            )
            report = classify_drop(drop)
            self.assertFalse(report.ok)
            self.assertIsNotNone(report.hard_fail)
            self.assertIn("levy-stack", report.hard_fail or "")
            self.assertEqual(report.coverage["accountMap"].status, "ready")
            buf = io.StringIO()
            with redirect_stdout(buf):
                self.assertEqual(main([str(drop)]), 1)

    def test_missing_comps_pdf_is_optional_flag_off(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "Main Parcel Table.csv",
                ["Pin", "TAGId", "TotalActual", "TotalAssessed", "SAAddrNumber", "SAStreetName"],
            )
            _write_csv(
                drop / "Tax Authority Groups.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            report = classify_drop(drop)
            self.assertTrue(report.ok)
            self.assertEqual(report.coverage["compsPdf"].status, "will-be-off")
            self.assertFalse(report.recommended_feature_flags["compsPdf"])

    def test_does_not_write_public_data(self) -> None:
        public_json = sorted(PUBLIC_DIR.joinpath("data").glob("*.json"))
        before = {p: p.stat().st_mtime_ns for p in public_json}
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "Tax Authority Groups.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            _write_csv(
                drop / "Main Parcel Table.csv",
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
            )
            classify_drop(drop)
            buf = io.StringIO()
            with redirect_stdout(buf):
                main([str(drop), "--json"])
        after = {p: p.stat().st_mtime_ns for p in public_json}
        self.assertEqual(before, after)

    def test_refuses_json_out_under_public(self) -> None:
        forbidden = PUBLIC_DIR / "data" / "should-not-write-classify.json"
        self.assertTrue(json_out_is_forbidden(forbidden))
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "Tax Authority Groups.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            err = io.StringIO()
            with redirect_stderr(err):
                code = main([str(drop), "--json-out", str(forbidden)])
            self.assertEqual(code, 2)
            self.assertFalse(forbidden.exists())

    def test_skips_private_directory_inside_drop(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "_private" / "sample.csv",
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
            )
            _write_csv(
                drop / "Tax Authority Groups.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            report = classify_drop(drop)
            for rec in report.files:
                self.assertFalse(rec.path.startswith("_private/"))

    def test_skips_public_directory_inside_drop(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "public" / "data" / "fake-shipping.csv",
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
            )
            _write_csv(
                drop / "Tax Authority Groups.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            report = classify_drop(drop)
            for rec in report.files:
                self.assertNotIn("/public/", f"/{rec.path}/")
                self.assertFalse(rec.path.startswith("public/"))


if __name__ == "__main__":
    unittest.main()
