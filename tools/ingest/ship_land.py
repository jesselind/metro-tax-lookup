#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Atomic land of engine v2 staging into public/data/ (ship-from-new).

Build completes under supporting-data/_ingest-ship-staging/ first. Live
Arapahoe shipping files change only after compare_dirs reports IDENTICAL.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from ingest.classify import REPO_ROOT
from ingest.compare import compare_dirs

SHIP_STAGING_REL = Path("supporting-data/_ingest-ship-staging")

# Only these Arapahoe products are replaced on land. Metro levies, directory,
# explainers, and authority-mills JSON stay untouched.
ARAPAHOE_TOP_LEVEL_FILES = (
    "arapahoe-levy-stacks-by-tag-id.json",
    "arapahoe-pin-to-tag.json",
    "arapahoe-situs-to-pins.json",
)
ARAPAHOE_SHARD_DIR = "arapahoe-parcel-record-by-pin"

REQUIRED_STAGING_FILES = (
    "arapahoe-levy-stacks-by-tag-id.json",
    "arapahoe-pin-to-tag.json",
    "arapahoe-situs-to-pins.json",
)


class ShipLandError(ValueError):
    """Refused or failed atomic land into public/data/."""


def ship_staging_dir(repo_root: Path | None = None) -> Path:
    """Resolved path to the ship staging directory."""
    root = repo_root or REPO_ROOT
    return (root / SHIP_STAGING_REL).resolve()


def reset_ship_staging(repo_root: Path | None = None) -> Path:
    """Remove any prior staging tree and create an empty staging directory."""
    staging = ship_staging_dir(repo_root)
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True, exist_ok=True)
    return staging


def cleanup_ship_staging(repo_root: Path | None = None) -> None:
    """Delete the ship staging directory after a successful land."""
    staging = ship_staging_dir(repo_root)
    if staging.exists():
        shutil.rmtree(staging)


def require_staging_ready(staging: Path) -> None:
    """Fail when required Arapahoe products are missing from staging."""
    missing: list[str] = []
    for name in REQUIRED_STAGING_FILES:
        if not (staging / name).is_file():
            missing.append(name)
    shard = staging / ARAPAHOE_SHARD_DIR
    if not shard.is_dir() or not any(shard.glob("*.json")):
        missing.append(f"{ARAPAHOE_SHARD_DIR}/ (non-empty)")
    if missing:
        raise ShipLandError(
            "Ship staging is incomplete; refusing land. Missing: "
            + ", ".join(missing)
        )


def assert_identical_for_ship(live: Path, staging: Path, *, label: str) -> None:
    """Require compare_dirs IDENTICAL (snapshot subtree excluded)."""
    result = compare_dirs(live, staging)
    if result.identical:
        return
    raise ShipLandError(
        f"{label}: staging is not IDENTICAL to live public/data/ "
        f"(refusing land or post-land check failed).\n"
        + result.format_human()
    )


def _replace_file(src: Path, dst: Path) -> None:
    """Copy src over dst via a same-directory temp name, then os.replace."""
    tmp = dst.with_name(dst.name + ".ship-tmp")
    if tmp.exists():
        tmp.unlink()
    shutil.copy2(src, tmp)
    tmp.replace(dst)


def _replace_shard_dir(src_dir: Path, dst_dir: Path) -> None:
    """Replace shard directory with a rename swap; roll back on failure."""
    parent = dst_dir.parent
    new_dir = parent / f"{dst_dir.name}.ship-new"
    old_dir = parent / f"{dst_dir.name}.ship-old"
    if new_dir.exists():
        shutil.rmtree(new_dir)
    if old_dir.exists():
        shutil.rmtree(old_dir)

    shutil.copytree(src_dir, new_dir)
    try:
        if dst_dir.exists():
            dst_dir.rename(old_dir)
        new_dir.rename(dst_dir)
    except Exception:
        if not dst_dir.exists() and old_dir.exists():
            old_dir.rename(dst_dir)
        if new_dir.exists():
            shutil.rmtree(new_dir)
        raise
    if old_dir.exists():
        shutil.rmtree(old_dir)


def land_arapahoe_shipping(
    *,
    staging: Path,
    shipping: Path,
    skip_pre_swap_identical: bool = False,
) -> None:
    """Gate on IDENTICAL, then replace Arapahoe shipping targets from staging.

    Live shipping is unchanged until the pre-swap gate passes. After replace,
    compare again. Does not delete staging (caller cleans up on success).
    """
    staging = staging.resolve()
    shipping = shipping.resolve()
    if not staging.is_dir():
        raise ShipLandError(f"Ship staging is not a directory: {staging}")
    if not shipping.is_dir():
        raise ShipLandError(f"Shipping data dir is not a directory: {shipping}")

    require_staging_ready(staging)
    if not skip_pre_swap_identical:
        assert_identical_for_ship(shipping, staging, label="Pre-swap")

    for name in ARAPAHOE_TOP_LEVEL_FILES:
        src = staging / name
        if not src.is_file():
            continue
        _replace_file(src, shipping / name)

    shard_src = staging / ARAPAHOE_SHARD_DIR
    if shard_src.is_dir():
        _replace_shard_dir(shard_src, shipping / ARAPAHOE_SHARD_DIR)

    assert_identical_for_ship(shipping, staging, label="Post-land")
