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


def unresolved_ship_staging(repo_root: Path | None = None) -> Path:
    """Repo-relative ship staging path without resolving symlinks."""
    root = repo_root or REPO_ROOT
    return root / SHIP_STAGING_REL


def ship_staging_dir(repo_root: Path | None = None) -> Path:
    """Resolved path to the ship staging directory."""
    raw = unresolved_ship_staging(repo_root)
    _reject_symlink_staging(raw)
    return raw.resolve()


def _reject_symlink_staging(raw: Path) -> None:
    """Refuse staging delete/create when the staging entry itself is a symlink."""
    if raw.is_symlink():
        raise ShipLandError(
            "Ship staging path is a symlink; refusing delete or reset: "
            f"{raw}"
        )


def reset_ship_staging(repo_root: Path | None = None) -> Path:
    """Remove any prior staging tree and create an empty staging directory."""
    root = repo_root or REPO_ROOT
    raw = unresolved_ship_staging(root)
    _reject_symlink_staging(raw)
    staging = raw.resolve()
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True, exist_ok=True)
    return staging


def cleanup_ship_staging(repo_root: Path | None = None) -> None:
    """Delete the ship staging directory after a successful land."""
    root = repo_root or REPO_ROOT
    raw = unresolved_ship_staging(root)
    _reject_symlink_staging(raw)
    staging = raw.resolve()
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


def _remove_path(path: Path) -> None:
    if not path.exists() and not path.is_symlink():
        return
    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path)
    else:
        path.unlink()


def _restore_backups(backups: list[tuple[Path, Path]]) -> None:
    """Restore live targets from .ship-old backups (reverse commit order)."""
    for backup, dst in reversed(backups):
        _remove_path(dst)
        if backup.exists() or backup.is_symlink():
            backup.rename(dst)


def land_arapahoe_shipping(
    *,
    staging: Path,
    shipping: Path,
    skip_pre_swap_identical: bool = False,
) -> None:
    """Gate on IDENTICAL, then replace Arapahoe shipping targets from staging.

    Live shipping is unchanged until the pre-swap gate passes. Prepare all
    side copies first, then commit the full top-level + shard set; on any
    failure restore prior targets. Kill during the rename window can still
    leave temps; backup + git remain the safety net. Does not delete staging
    (caller cleans up on success).
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

    prepared: list[tuple[Path, Path]] = []  # (ship-new path, live dst)
    shard_new: Path | None = None
    shard_dst = shipping / ARAPAHOE_SHARD_DIR
    backups: list[tuple[Path, Path]] = []  # (ship-old path, live dst)

    try:
        for name in ARAPAHOE_TOP_LEVEL_FILES:
            src = staging / name
            if not src.is_file():
                continue
            dst = shipping / name
            new_tmp = dst.with_name(dst.name + ".ship-new")
            _remove_path(new_tmp)
            shutil.copy2(src, new_tmp)
            prepared.append((new_tmp, dst))

        shard_src = staging / ARAPAHOE_SHARD_DIR
        if shard_src.is_dir():
            shard_new = shipping / f"{ARAPAHOE_SHARD_DIR}.ship-new"
            _remove_path(shard_new)
            shutil.copytree(shard_src, shard_new)

        for new_tmp, dst in prepared:
            if dst.exists() or dst.is_symlink():
                old = dst.with_name(dst.name + ".ship-old")
                _remove_path(old)
                dst.rename(old)
                backups.append((old, dst))
            new_tmp.rename(dst)

        if shard_new is not None:
            shard_old = shipping / f"{ARAPAHOE_SHARD_DIR}.ship-old"
            _remove_path(shard_old)
            if shard_dst.exists() or shard_dst.is_symlink():
                shard_dst.rename(shard_old)
                backups.append((shard_old, shard_dst))
            shard_new.rename(shard_dst)
            shard_new = None

        assert_identical_for_ship(shipping, staging, label="Post-land")
    except Exception:
        _restore_backups(backups)
        for new_tmp, _dst in prepared:
            _remove_path(new_tmp)
        if shard_new is not None:
            _remove_path(shard_new)
        raise
    else:
        for backup, _dst in backups:
            _remove_path(backup)
