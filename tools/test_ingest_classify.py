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
import os
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


def _write_tsv(path: Path, headers: list[str], rows: list[list[str]] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, delimiter="\t")
        writer.writerow(headers)
        for row in rows or []:
            writer.writerow(row)


def _snapshot_public_tree() -> dict[str, tuple[int, int]]:
    """Relative path -> (mtime_ns, size) for every file under public/."""
    snap: dict[str, tuple[int, int]] = {}
    if not PUBLIC_DIR.is_dir():
        return snap
    for dirpath, _dirnames, filenames in os.walk(PUBLIC_DIR, followlinks=False):
        for name in filenames:
            path = Path(dirpath) / name
            try:
                st = path.lstat()
            except OSError:
                continue
            rel = path.relative_to(PUBLIC_DIR).as_posix()
            snap[rel] = (st.st_mtime_ns, st.st_size)
    return snap


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

    def test_tag_tsv_with_known_filename_is_ready(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "Main Parcel Table.csv",
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
            )
            _write_tsv(
                drop / "Tax Authority Groups.tsv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            report = classify_drop(drop)
            self.assertTrue(report.ok)
            tag = [f for f in report.files if f.kind == "tsv"]
            self.assertEqual(len(tag), 1)
            self.assertEqual(tag[0].signature, "arapahoe-tax-authority-groups")
            self.assertEqual(
                list(tag[0].headers),
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            self.assertEqual(report.coverage["levyStacks"].status, "ready")


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

    def test_generic_field_headers_are_not_tax_authority_groups(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "Main Parcel Table.csv",
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
            )
            _write_csv(
                drop / "unrelated-export.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            report = classify_drop(drop)
            sigs = {f.signature for f in report.files}
            self.assertNotIn("arapahoe-tax-authority-groups", sigs)
            self.assertIn("unknown-csv", sigs)
            self.assertNotEqual(report.coverage["levyStacks"].status, "ready")
            self.assertFalse(report.ok)
            self.assertIsNotNone(report.hard_fail)
            self.assertIn("levy-stack", report.hard_fail or "")

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
        before = _snapshot_public_tree()
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
        after = _snapshot_public_tree()
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


class ClassifyFormatAndWalkTests(unittest.TestCase):
    def test_xls_is_unsupported_not_unknown_xlsx(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            (drop / "legacy.xls").write_bytes(b"\xd0\xcf\x11\xe0" + b"\x00" * 32)
            _write_csv(
                drop / "Tax Authority Groups.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            report = classify_drop(drop)
            xls = [f for f in report.files if f.path == "legacy.xls"]
            self.assertEqual(len(xls), 1)
            self.assertEqual(xls[0].kind, "xls")
            self.assertEqual(xls[0].signature, "unsupported-xls")
            self.assertNotIn("unknown-xlsx", {f.signature for f in report.files})

    def test_xlsx_headers_when_openpyxl_available(self) -> None:
        try:
            import openpyxl
        except ImportError:
            self.skipTest("openpyxl not installed")
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            _write_csv(
                drop / "Main Parcel Table.csv",
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
            )
            path = drop / "Tax Authority Groups.xlsx"
            wb = openpyxl.Workbook()
            ws = wb.active
            assert ws is not None
            for col, header in enumerate(
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
                start=1,
            ):
                ws.cell(1, col, header)
            wb.save(path)
            report = classify_drop(drop)
            xlsx = [f for f in report.files if f.kind == "xlsx"]
            self.assertEqual(len(xlsx), 1)
            self.assertEqual(xlsx[0].signature, "arapahoe-tax-authority-groups")
            self.assertEqual(report.coverage["levyStacks"].status, "ready")

    def test_gdb_directory_is_inspected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            drop = Path(tmp)
            gdb = drop / "parcels.gdb"
            gdb.mkdir()
            (gdb / "placeholder").write_text("x", encoding="utf-8")
            _write_csv(
                drop / "Tax Authority Groups.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            report = classify_drop(drop)
            gdb_recs = [f for f in report.files if f.kind == "gdb"]
            self.assertEqual(len(gdb_recs), 1)
            self.assertEqual(gdb_recs[0].path, "parcels.gdb")
            self.assertIn(
                gdb_recs[0].signature,
                {"gdb-install-pyogrio-to-inspect", "unknown-gdb"},
            )
            self.assertEqual(report.coverage["levyStacks"].status, "ready")
            self.assertNotEqual(report.coverage["shards"].status, "ready")

    def test_skips_symlinked_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            drop = root / "drop"
            drop.mkdir()
            outside = root / "outside.csv"
            _write_csv(
                outside,
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
            )
            _write_csv(
                drop / "Tax Authority Groups.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            link = drop / "Main Parcel Table.csv"
            try:
                link.symlink_to(outside)
            except OSError as exc:
                self.skipTest(f"symlink not allowed: {exc}")
            report = classify_drop(drop)
            paths = {f.path for f in report.files}
            self.assertNotIn("Main Parcel Table.csv", paths)
            self.assertNotIn("arapahoe-main-parcel", {f.signature for f in report.files})

    def test_skips_symlinked_directory(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            drop = root / "drop"
            drop.mkdir()
            hidden = root / "hidden"
            hidden.mkdir()
            _write_csv(
                hidden / "Main Parcel Table.csv",
                ["Pin", "TAGId", "TotalActual", "TotalAssessed"],
            )
            _write_csv(
                drop / "Tax Authority Groups.csv",
                ["Field1", "Field2", "Field3", "Field4", "Field5", "Field6"],
            )
            try:
                (drop / "linked").symlink_to(hidden)
            except OSError as exc:
                self.skipTest(f"symlink not allowed: {exc}")
            report = classify_drop(drop)
            for rec in report.files:
                self.assertFalse(rec.path.startswith("linked/"))
            self.assertNotIn("arapahoe-main-parcel", {f.signature for f in report.files})


if __name__ == "__main__":
    unittest.main()
