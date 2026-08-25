#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later

"""Tests for ingest/out_dir_policy.py (comparison vs ship out_dir guards)."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest import mock

from ingest.out_dir_policy import (
    OutDirPolicyError,
    ship_preflight,
    shipping_data_dir,
    validate_out_dir,
)


class ValidateOutDirTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        self.shipping = self.repo / "public" / "data"
        self.shipping.mkdir(parents=True)
        (self.repo / "public" / "other").mkdir(parents=True)
        self.comparison = self.repo / "supporting-data" / "_ingest-out"
        self.comparison.mkdir(parents=True)

    def test_comparison_dir_allowed_without_ship(self) -> None:
        resolved = validate_out_dir(
            self.comparison,
            ship=False,
            repo_root=self.repo,
        )
        self.assertEqual(resolved, self.comparison.resolve())

    def test_public_data_refused_without_ship(self) -> None:
        with mock.patch(
            "ingest.out_dir_policy.shipping_data_dir",
            return_value=self.shipping.resolve(),
        ):
            with self.assertRaises(OutDirPolicyError) as ctx:
                validate_out_dir(self.shipping, ship=False, repo_root=self.repo)
        self.assertIn("public/data/", str(ctx.exception))

    def test_public_data_allowed_with_ship(self) -> None:
        with mock.patch(
            "ingest.out_dir_policy.shipping_data_dir",
            return_value=self.shipping.resolve(),
        ):
            resolved = validate_out_dir(self.shipping, ship=True, repo_root=self.repo)
        self.assertEqual(resolved, self.shipping.resolve())

    def test_other_public_path_refused_even_with_ship(self) -> None:
        other = self.repo / "public" / "other"
        with mock.patch("ingest.out_dir_policy.path_is_under_public", return_value=True):
            with self.assertRaises(OutDirPolicyError) as ctx:
                validate_out_dir(other, ship=True, repo_root=self.repo)
        self.assertIn("public/data/", str(ctx.exception))

    def test_ship_requires_public_data_out_dir(self) -> None:
        with self.assertRaises(OutDirPolicyError) as ctx:
            validate_out_dir(self.comparison, ship=True, repo_root=self.repo)
        self.assertIn("--ship requires", str(ctx.exception))


class ShipPreflightTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        (self.repo / "tools").mkdir()
        (self.repo / "tools" / "county-mart-data-as-of.txt").write_text(
            "2026-07-15\n", encoding="utf-8"
        )

    def test_bundled_as_of_must_match_stamp_file(self) -> None:
        with self.assertRaises(OutDirPolicyError) as ctx:
            ship_preflight("2026-01-01", repo_root=self.repo)
        self.assertIn("county-mart-data-as-of", str(ctx.exception))

    def test_git_dirty_public_data_refused(self) -> None:
        with mock.patch("ingest.out_dir_policy.subprocess.run") as run:
            run.return_value.returncode = 0
            run.return_value.stdout = " M public/data/arapahoe-pin-to-tag.json\n"
            with self.assertRaises(OutDirPolicyError) as ctx:
                ship_preflight("2026-07-15", repo_root=self.repo)
        self.assertIn("uncommitted changes", str(ctx.exception))

    def test_git_clean_passes(self) -> None:
        with mock.patch("ingest.out_dir_policy.subprocess.run") as run:
            run.return_value.returncode = 0
            run.return_value.stdout = ""
            ship_preflight("2026-07-15", repo_root=self.repo)


class ShippingDataDirTests(unittest.TestCase):
    def test_resolves_under_repo(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            expected = (repo / "public" / "data").resolve()
            expected.mkdir(parents=True)
            self.assertEqual(shipping_data_dir(repo), expected)


if __name__ == "__main__":
    unittest.main()
