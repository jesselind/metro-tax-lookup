#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later

"""Tests for ingest/ship_land.py (staging + IDENTICAL + atomic land)."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from ingest.out_dir_policy import OutDirPolicyError
from ingest.ship_land import (
    ARAPAHOE_SHARD_DIR,
    ShipLandError,
    cleanup_ship_staging,
    land_arapahoe_shipping,
    require_staging_ready,
    reset_ship_staging,
    ship_staging_dir,
    unresolved_ship_staging,
)


def _write_minimal_arapahoe_tree(root: Path, *, mill: float = 1.0) -> None:
    """Tiny Arapahoe-shaped tree that compare_dirs can treat as IDENTICAL."""
    stacks = {
        "snapshot": {"bundledAsOf": "2026-07-15T12:00:00Z", "source": "test-a"},
        "stacksByTagId": {
            "1": {
                "tagId": "1",
                "taxYear": "2025",
                "levyAspxUrl": "https://example.test/levy?id=1",
                "lines": [
                    {
                        "code": "0601",
                        "name": "SYNTH",
                        "millLevy": mill,
                    }
                ],
            }
        },
    }
    account = {
        "snapshot": {"bundledAsOf": "2026-07-15T12:00:00Z", "source": "test-a"},
        "pinDigits": 9,
        "byPin": {
            "197070001": {
                "tagId": "1",
                "tagShortDescr": "0001",
            }
        },
    }
    situs = {
        "snapshot": {"bundledAsOf": "2026-07-15T12:00:00Z", "source": "test-a"},
        "lookupVersion": 2,
        "byKey": {},
    }
    shard = {
        "snapshot": {"bundledAsOf": "2026-07-15T12:00:00Z", "source": "test-a"},
        "pinDigits": 9,
        "shardPrefix": "197",
        "byPin": {
            "197070001": {"pin": "197070001"},
        },
    }
    (root / "arapahoe-levy-stacks-by-tag-id.json").write_text(
        json.dumps(stacks, separators=(",", ":")), encoding="utf-8"
    )
    (root / "arapahoe-pin-to-tag.json").write_text(
        json.dumps(account, separators=(",", ":")), encoding="utf-8"
    )
    (root / "arapahoe-situs-to-pins.json").write_text(
        json.dumps(situs, separators=(",", ":")), encoding="utf-8"
    )
    shard_dir = root / ARAPAHOE_SHARD_DIR
    shard_dir.mkdir(parents=True, exist_ok=True)
    (shard_dir / "197.json").write_text(
        json.dumps(shard, separators=(",", ":")), encoding="utf-8"
    )
    # Non-Arapahoe sibling that land must not touch.
    (root / "metro-levies-2026.json").write_text(
        '{"snapshot":{"taxYear":"2026"},"districts":[]}', encoding="utf-8"
    )


def _mill_from_live(live: Path) -> float:
    stacks = json.loads(
        (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8")
    )
    return float(stacks["stacksByTagId"]["1"]["lines"][0]["millLevy"])


class ShipStagingPathTests(unittest.TestCase):
    def test_reset_and_cleanup(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            staging = reset_ship_staging(repo_root=repo)
            self.assertEqual(staging, ship_staging_dir(repo))
            self.assertTrue(staging.is_dir())
            marker = staging / "marker.txt"
            marker.write_text("x", encoding="utf-8")
            staging2 = reset_ship_staging(repo_root=repo)
            self.assertFalse((staging2 / "marker.txt").exists())
            cleanup_ship_staging(repo_root=repo)
            self.assertFalse(ship_staging_dir(repo).exists())

    def test_reset_refuses_symlink_staging(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            target = repo / "elsewhere"
            target.mkdir()
            (target / "secret.txt").write_text("keep", encoding="utf-8")
            raw = unresolved_ship_staging(repo)
            raw.parent.mkdir(parents=True, exist_ok=True)
            raw.symlink_to(target)
            with self.assertRaises(ShipLandError) as ctx:
                reset_ship_staging(repo_root=repo)
            self.assertIn("symlink", str(ctx.exception).lower())
            self.assertEqual((target / "secret.txt").read_text(encoding="utf-8"), "keep")
            self.assertTrue(raw.is_symlink())

    def test_cleanup_refuses_symlink_staging(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            target = repo / "elsewhere"
            target.mkdir()
            (target / "secret.txt").write_text("keep", encoding="utf-8")
            raw = unresolved_ship_staging(repo)
            raw.parent.mkdir(parents=True, exist_ok=True)
            raw.symlink_to(target)
            with self.assertRaises(ShipLandError) as ctx:
                cleanup_ship_staging(repo_root=repo)
            self.assertIn("symlink", str(ctx.exception).lower())
            self.assertEqual((target / "secret.txt").read_text(encoding="utf-8"), "keep")
            self.assertTrue(raw.is_symlink())


class RequireStagingReadyTests(unittest.TestCase):
    def test_missing_shard_refused(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            staging = Path(tmp)
            (staging / "arapahoe-levy-stacks-by-tag-id.json").write_text("{}", encoding="utf-8")
            (staging / "arapahoe-pin-to-tag.json").write_text("{}", encoding="utf-8")
            (staging / "arapahoe-situs-to-pins.json").write_text("{}", encoding="utf-8")
            with self.assertRaises(ShipLandError) as ctx:
                require_staging_ready(staging)
            self.assertIn(ARAPAHOE_SHARD_DIR, str(ctx.exception))


class LandArapahoeShippingTests(unittest.TestCase):
    def test_refuses_when_not_identical_and_leaves_live_untouched(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            live = base / "public" / "data"
            staging = base / "staging"
            live.mkdir(parents=True)
            staging.mkdir(parents=True)
            _write_minimal_arapahoe_tree(live, mill=1.0)
            _write_minimal_arapahoe_tree(staging, mill=99.0)
            before = (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8")
            metro_before = (live / "metro-levies-2026.json").read_text(encoding="utf-8")

            with self.assertRaises(ShipLandError) as ctx:
                land_arapahoe_shipping(staging=staging, shipping=live)
            self.assertIn("Pre-swap", str(ctx.exception))
            self.assertEqual(
                (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8"),
                before,
            )
            self.assertEqual(
                (live / "metro-levies-2026.json").read_text(encoding="utf-8"),
                metro_before,
            )

    def test_identical_land_replaces_arapahoe_only(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            live = base / "public" / "data"
            staging = base / "staging"
            live.mkdir(parents=True)
            staging.mkdir(parents=True)
            _write_minimal_arapahoe_tree(live, mill=1.0)
            _write_minimal_arapahoe_tree(staging, mill=1.0)
            # Different snapshot.source only — compare skips snapshot; land still copies staging bytes.
            stacks = json.loads(
                (staging / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8")
            )
            stacks["snapshot"]["source"] = "new ingest (mapping: arapahoe)"
            (staging / "arapahoe-levy-stacks-by-tag-id.json").write_text(
                json.dumps(stacks, separators=(",", ":")), encoding="utf-8"
            )
            metro_before = (live / "metro-levies-2026.json").read_text(encoding="utf-8")

            land_arapahoe_shipping(staging=staging, shipping=live)

            landed = json.loads(
                (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8")
            )
            self.assertEqual(
                landed["snapshot"]["source"],
                "new ingest (mapping: arapahoe)",
            )
            self.assertEqual(
                (live / "metro-levies-2026.json").read_text(encoding="utf-8"),
                metro_before,
            )
            self.assertTrue((live / ARAPAHOE_SHARD_DIR / "197.json").is_file())
            self.assertFalse((live / f"{ARAPAHOE_SHARD_DIR}.ship-new").exists())
            self.assertFalse((live / f"{ARAPAHOE_SHARD_DIR}.ship-old").exists())

    def test_ship_allow_diff_lands_when_bill_data_differs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            live = base / "public" / "data"
            staging = base / "staging"
            live.mkdir(parents=True)
            staging.mkdir(parents=True)
            _write_minimal_arapahoe_tree(live, mill=1.0)
            _write_minimal_arapahoe_tree(staging, mill=42.0)

            land_arapahoe_shipping(
                staging=staging,
                shipping=live,
                skip_pre_swap_identical=True,
            )

            landed = json.loads(
                (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8")
            )
            self.assertEqual(landed["stacksByTagId"]["1"]["lines"][0]["millLevy"], 42.0)

    def test_post_land_failure_restores_all_live_targets(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            live = base / "public" / "data"
            staging = base / "staging"
            live.mkdir(parents=True)
            staging.mkdir(parents=True)
            _write_minimal_arapahoe_tree(live, mill=1.0)
            _write_minimal_arapahoe_tree(staging, mill=42.0)
            before_stacks = (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(
                encoding="utf-8"
            )
            before_account = (live / "arapahoe-pin-to-tag.json").read_text(encoding="utf-8")
            before_situs = (live / "arapahoe-situs-to-pins.json").read_text(encoding="utf-8")
            before_shard = (live / ARAPAHOE_SHARD_DIR / "197.json").read_text(encoding="utf-8")
            metro_before = (live / "metro-levies-2026.json").read_text(encoding="utf-8")

            with mock.patch(
                "ingest.ship_land.assert_identical_for_ship",
                side_effect=ShipLandError("Post-land: forced failure"),
            ):
                with self.assertRaises(ShipLandError) as ctx:
                    land_arapahoe_shipping(
                        staging=staging,
                        shipping=live,
                        skip_pre_swap_identical=True,
                    )
            self.assertIn("Post-land", str(ctx.exception))
            self.assertEqual(
                (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8"),
                before_stacks,
            )
            self.assertEqual(
                (live / "arapahoe-pin-to-tag.json").read_text(encoding="utf-8"),
                before_account,
            )
            self.assertEqual(
                (live / "arapahoe-situs-to-pins.json").read_text(encoding="utf-8"),
                before_situs,
            )
            self.assertEqual(
                (live / ARAPAHOE_SHARD_DIR / "197.json").read_text(encoding="utf-8"),
                before_shard,
            )
            self.assertEqual(
                (live / "metro-levies-2026.json").read_text(encoding="utf-8"),
                metro_before,
            )
            self.assertEqual(_mill_from_live(live), 1.0)
            self.assertFalse((live / "arapahoe-levy-stacks-by-tag-id.json.ship-new").exists())
            self.assertFalse((live / "arapahoe-levy-stacks-by-tag-id.json.ship-old").exists())
            self.assertFalse((live / f"{ARAPAHOE_SHARD_DIR}.ship-new").exists())
            self.assertFalse((live / f"{ARAPAHOE_SHARD_DIR}.ship-old").exists())

    def test_mid_commit_failure_restores_partial_updates(self) -> None:
        """If a later rename fails after earlier commits, restore prior targets."""
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            live = base / "public" / "data"
            staging = base / "staging"
            live.mkdir(parents=True)
            staging.mkdir(parents=True)
            _write_minimal_arapahoe_tree(live, mill=1.0)
            _write_minimal_arapahoe_tree(staging, mill=42.0)
            before_stacks = (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(
                encoding="utf-8"
            )
            before_account = (live / "arapahoe-pin-to-tag.json").read_text(encoding="utf-8")

            orig_rename = Path.rename

            def flaky_rename(self: Path, target: Path | str) -> Path:
                # Fail when committing the shard directory into place (late in the set).
                target_path = Path(target)
                if self.name == f"{ARAPAHOE_SHARD_DIR}.ship-new":
                    raise OSError("forced shard commit failure")
                return orig_rename(self, target_path)

            with mock.patch.object(Path, "rename", flaky_rename):
                with self.assertRaises(OSError):
                    land_arapahoe_shipping(
                        staging=staging,
                        shipping=live,
                        skip_pre_swap_identical=True,
                    )

            self.assertEqual(
                (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8"),
                before_stacks,
            )
            self.assertEqual(
                (live / "arapahoe-pin-to-tag.json").read_text(encoding="utf-8"),
                before_account,
            )
            self.assertEqual(_mill_from_live(live), 1.0)
            self.assertTrue((live / ARAPAHOE_SHARD_DIR / "197.json").is_file())


class LandShipFromStagingTests(unittest.TestCase):
    def test_second_preflight_blocks_land_when_state_went_stale(self) -> None:
        from ingest.build import land_ship_from_staging

        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            live = base / "public" / "data"
            staging = base / "staging"
            live.mkdir(parents=True)
            staging.mkdir(parents=True)
            _write_minimal_arapahoe_tree(live, mill=1.0)
            _write_minimal_arapahoe_tree(staging, mill=1.0)
            before = (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8")

            preflight_calls: list[str] = []

            def stale_on_second(bundled_as_of: str, *, repo_root=None) -> None:
                preflight_calls.append(bundled_as_of)
                if len(preflight_calls) >= 1:
                    raise OutDirPolicyError(
                        "public/data/ has uncommitted changes (stale after build)."
                    )

            with mock.patch("ingest.build.ship_preflight", side_effect=stale_on_second):
                with mock.patch("ingest.build.land_arapahoe_shipping") as land_mock:
                    with self.assertRaises(OutDirPolicyError):
                        land_ship_from_staging(
                            bundled_as_of="2026-07-15",
                            staging=staging,
                            shipping=live,
                            ship_allow_diff=False,
                            repo_root=base,
                        )
                    land_mock.assert_not_called()

            self.assertEqual(preflight_calls, ["2026-07-15"])
            self.assertEqual(
                (live / "arapahoe-levy-stacks-by-tag-id.json").read_text(encoding="utf-8"),
                before,
            )

    def test_ship_allow_diff_still_rechecks_preflight_then_lands(self) -> None:
        from ingest.build import land_ship_from_staging

        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            live = base / "public" / "data"
            staging = base / "staging"
            live.mkdir(parents=True)
            staging.mkdir(parents=True)
            _write_minimal_arapahoe_tree(live, mill=1.0)
            _write_minimal_arapahoe_tree(staging, mill=42.0)

            with mock.patch("ingest.build.ship_preflight") as preflight_mock:
                land_ship_from_staging(
                    bundled_as_of="2026-07-15",
                    staging=staging,
                    shipping=live,
                    ship_allow_diff=True,
                    repo_root=base,
                )
            preflight_mock.assert_called_once()
            self.assertEqual(_mill_from_live(live), 42.0)


class BuildShipCliGuardTests(unittest.TestCase):
    def test_ship_allow_diff_requires_ship(self) -> None:
        from ingest.build import main
        import contextlib
        import io

        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            code = main(
                [
                    "--mapping",
                    "tools/ingest/mappings/arapahoe.json",
                    "--tag-file",
                    "nonexistent-tag.csv",
                    "--parcel-file",
                    "nonexistent-parcel.csv",
                    "--bundled-as-of",
                    "2026-07-15",
                    "--ship-allow-diff",
                ]
            )
        self.assertEqual(code, 2)
        self.assertIn("--ship-allow-diff requires --ship", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
