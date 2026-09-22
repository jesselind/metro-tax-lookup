#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Unit tests for tools/ingest/assert_levy_stack_diff_scope.py."""

from __future__ import annotations

import unittest

from ingest.assert_levy_stack_diff_scope import assert_levy_stack_diff_scope


ALLOW = {
    "ANTELOPE HLS GEN IMP DIST",
    "BENNETT FIRE PROTECTION",
}


def _stack(tag_id: str, lines: list[dict]) -> dict:
    return {"stacksByTagId": {tag_id: {"tagId": tag_id, "lines": lines}}}


def _line(code: str, name: str, *, mills: float | None = None) -> dict:
    line = {
        "code": code,
        "authorityName": name,
        "dolaMatch": {"method": "none", "mills": mills},
    }
    return line


class AssertLevyStackDiffScopeTests(unittest.TestCase):
    def test_unchanged_tag_passes(self) -> None:
        doc = _stack(
            "1",
            [
                _line("4042", "ANTELOPE HLS GEN IMP DIST"),
                _line("0901", "BENNETT SCHOOL DIST # 29"),
            ],
        )
        self.assertEqual(assert_levy_stack_diff_scope(doc, doc, ALLOW), [])

    def test_allowlisted_dola_match_change_passes(self) -> None:
        before = _stack(
            "1258496",
            [
                _line("4042", "ANTELOPE HLS GEN IMP DIST"),
                _line("0901", "BENNETT SCHOOL DIST # 29", mills=25.38),
            ],
        )
        after = _stack(
            "1258496",
            [
                {
                    "code": "4042",
                    "authorityName": "ANTELOPE HLS GEN IMP DIST",
                    "dolaMatch": {
                        "method": "override",
                        "taxEntityId": "64265/1",
                        "lgId": "64265",
                        "mills": 36.71,
                    },
                },
                _line("0901", "BENNETT SCHOOL DIST # 29", mills=25.38),
            ],
        )
        self.assertEqual(assert_levy_stack_diff_scope(before, after, ALLOW), [])

    def test_tag_without_allowlist_must_not_change(self) -> None:
        before = _stack("999", [_line("2998", "ARAPAHOE COUNTY", mills=15.959)])
        after = _stack(
            "999",
            [_line("2998", "ARAPAHOE COUNTY", mills=16.0)],
        )
        v = assert_levy_stack_diff_scope(before, after, ALLOW)
        self.assertEqual(len(v), 1)
        self.assertIn("no allowlisted", v[0].message)

    def test_non_allowlisted_line_on_scoped_tag_fails(self) -> None:
        before = _stack(
            "1258496",
            [
                _line("4042", "ANTELOPE HLS GEN IMP DIST"),
                _line("0901", "BENNETT SCHOOL DIST # 29", mills=25.38),
            ],
        )
        after = _stack(
            "1258496",
            [
                _line("4042", "ANTELOPE HLS GEN IMP DIST", mills=36.71),
                _line("0901", "BENNETT SCHOOL DIST # 29", mills=26.0),
            ],
        )
        v = assert_levy_stack_diff_scope(before, after, ALLOW)
        self.assertEqual(len(v), 1)
        self.assertIn("non-allowlisted", v[0].message)

    def test_allowlisted_non_dola_field_change_fails(self) -> None:
        before = _stack("1258496", [_line("4042", "ANTELOPE HLS GEN IMP DIST")])
        after = _stack(
            "1258496",
            [
                {
                    "code": "4042",
                    "authorityName": "ANTELOPE HLS GEN IMP DIST",
                    "effectiveYear": "2001",
                    "dolaMatch": {"method": "override", "mills": 36.71},
                },
            ],
        )
        v = assert_levy_stack_diff_scope(before, after, ALLOW)
        self.assertEqual(len(v), 1)
        self.assertIn("outside dolaMatch", v[0].message)

    def test_shared_auth_code_rename_history_rows_do_not_block(self) -> None:
        """Mart can keep inactive old label + active new label under one AUTH."""
        prosper_old = {
            "code": "4539",
            "authorityName": "PROSPER REGIONAL W & S SVC METRO DIST",
            "effectiveYear": "2014",
            "status": "I",
            "dolaMatch": {"method": "none", "mills": None},
        }
        prosper_new = {
            "code": "4539",
            "authorityName": "PROSPER REGIONAL WATER & SAN DIST",
            "effectiveYear": "2015",
            "status": "A",
            "dolaMatch": {"method": "none", "mills": None},
        }
        before = _stack(
            "1264810",
            [
                _line("4060", "BENNETT FIRE PROTECTION"),
                prosper_old,
                prosper_new,
            ],
        )
        after = _stack(
            "1264810",
            [
                {
                    "code": "4060",
                    "authorityName": "BENNETT FIRE PROTECTION",
                    "dolaMatch": {
                        "method": "override",
                        "taxEntityId": "64018/1",
                        "mills": 10.898,
                    },
                },
                prosper_old,
                prosper_new,
            ],
        )
        self.assertEqual(assert_levy_stack_diff_scope(before, after, ALLOW), [])

    def test_duplicate_code_and_name_still_fails(self) -> None:
        before = _stack(
            "1",
            [
                _line("4060", "BENNETT FIRE PROTECTION"),
                _line("4060", "BENNETT FIRE PROTECTION", mills=1.0),
            ],
        )
        after = _stack(
            "1",
            [
                _line("4060", "BENNETT FIRE PROTECTION", mills=10.898),
                _line("4060", "BENNETT FIRE PROTECTION", mills=1.0),
            ],
        )
        v = assert_levy_stack_diff_scope(before, after, ALLOW)
        self.assertEqual(len(v), 1)
        self.assertIn("duplicate line identity", v[0].message)


if __name__ == "__main__":
    unittest.main()
