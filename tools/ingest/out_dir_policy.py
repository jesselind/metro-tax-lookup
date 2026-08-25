#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Where engine v2 may write JSON (comparison vs ship-from-new).

Default: comparison directories only (never under public/).
With ship=True: exactly repo public/data/ after explicit --ship on build.py.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from ingest.classify import REPO_ROOT, path_is_under_public

SHIPPING_DATA_REL = Path("public/data")
MART_DATA_AS_OF_FILE = Path("tools/county-mart-data-as-of.txt")


class OutDirPolicyError(ValueError):
    """Refused out_dir for comparison or ship."""


def shipping_data_dir(repo_root: Path | None = None) -> Path:
    """Resolved path to repo public/data/ (shipping JSON root)."""
    root = repo_root or REPO_ROOT
    return (root / SHIPPING_DATA_REL).resolve()


def resolve_out_dir(out_dir: Path, *, repo_root: Path | None = None) -> Path:
    """Resolve out_dir relative to repo root when not absolute."""
    root = repo_root or REPO_ROOT
    candidate = out_dir.expanduser()
    if not candidate.is_absolute():
        return (root / candidate).resolve()
    return candidate.resolve()


def validate_out_dir(out_dir: Path, *, ship: bool, repo_root: Path | None = None) -> Path:
    """Allow comparison dirs always; allow public/data/ only when ship=True.

    Raises OutDirPolicyError when the path is under public/ without --ship,
    is another public/ path, or --ship is set without public/data/.
    """
    root = repo_root or REPO_ROOT
    resolved = resolve_out_dir(out_dir, repo_root=root)
    shipping = shipping_data_dir(root)

    if resolved == shipping:
        if not ship:
            raise OutDirPolicyError(
                f"Refusing to write to {out_dir} (public/data/). "
                "Use supporting-data/_ingest-out/ for comparison builds, "
                "or pass --ship for an explicit ship-from-new write."
            )
        return resolved

    if path_is_under_public(out_dir):
        raise OutDirPolicyError(
            f"Refusing to write to {out_dir} - path is inside public/ but is not "
            "public/data/. Only public/data/ is allowed with --ship."
        )

    if ship:
        raise OutDirPolicyError(
            "--ship requires --out-dir public/data (repo-relative)."
        )

    return resolved


def ship_preflight(
    bundled_as_of: str,
    *,
    repo_root: Path | None = None,
) -> None:
    """Require matching mart stamp and clean git status for public/data/.

    Raises OutDirPolicyError on failure. Prints a SHIP notice to stderr on success.
    """
    root = repo_root or REPO_ROOT
    stamp_path = root / MART_DATA_AS_OF_FILE
    if stamp_path.is_file():
        expected = stamp_path.read_text(encoding="utf-8").strip()
        if bundled_as_of != expected:
            raise OutDirPolicyError(
                f"--bundled-as-of {bundled_as_of!r} does not match "
                f"{MART_DATA_AS_OF_FILE} ({expected!r})."
            )

    try:
        result = subprocess.run(
            ["git", "status", "--porcelain", "public/data"],
            capture_output=True,
            text=True,
            cwd=root,
            check=False,
        )
    except OSError as exc:
        raise OutDirPolicyError(
            f"Could not run git status on public/data/: {exc}"
        ) from exc

    if result.returncode != 0:
        raise OutDirPolicyError(
            "git status public/data/ failed; resolve git state before --ship."
        )
    if result.stdout.strip():
        raise OutDirPolicyError(
            "public/data/ has uncommitted changes. Commit or restore before --ship.\n"
            + result.stdout.strip()
        )

    print(
        "SHIP: writing engine v2 output to public/data/ (shipping JSON).",
        file=sys.stderr,
    )
