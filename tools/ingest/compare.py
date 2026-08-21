#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Compare two JSON output directories (old rebuild vs new ingest).

snapshot fields (bundledAsOf, source, dolaSource, dolaRowCount,
dolaCertifyingCounty, dolaLevyColumn, lookupNote, gisParcelsAsOf) are excluded
from the diff because they describe the tool that produced the file, not the data.

dolaMatch on levy lines is compared (Phase 5 mill join). Stacks and account map
are always compared. Situs and parcel-record shards are compared when either
side has them (missing on one side is a difference). Other shipping JSON
(metro levies, directory, explainers) is ignored.

Usage:
  python3 tools/ingest/compare.py <dir-a> <dir-b>
  python3 tools/ingest/compare.py <dir-a> <dir-b> --json

The tool exits 0 when identical, 1 when differences exist.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Sequence


# Required outputs. Always compared (missing on one side is a difference).
_COMPARE_FILES_REQUIRED = (
    "arapahoe-levy-stacks-by-tag-id.json",
    "arapahoe-pin-to-tag.json",
)
# Optional outputs. Compared when either side has the file (missing on one side
# is a difference). Do not use "both must exist" - that hides a skipped situs build.
_COMPARE_FILES_IF_EITHER = (
    "arapahoe-situs-to-pins.json",
)
_SHARD_DIR = "arapahoe-parcel-record-by-pin"
# Cap human output so a bad shard run cannot dump thousands of lines.
_HUMAN_DIFF_LIMIT = 40


@dataclass
class Difference:
    filename: str
    path: str  # JSON path description
    a_value: object
    b_value: object

    def to_dict(self) -> dict[str, object]:
        return {
            "filename": self.filename,
            "path": self.path,
            "a": self.a_value,
            "b": self.b_value,
        }

    def format_human(self) -> str:
        return (
            f"  {self.filename}  {self.path}\n"
            f"    a: {json.dumps(self.a_value)}\n"
            f"    b: {json.dumps(self.b_value)}"
        )


@dataclass
class _SkipCounts:
    snapshot: int = 0


@dataclass
class DiffResult:
    dir_a: str
    dir_b: str
    differences: list[Difference] = field(default_factory=list)
    skipped_snapshot: int = 0

    @property
    def identical(self) -> bool:
        return len(self.differences) == 0

    def to_dict(self) -> dict[str, object]:
        return {
            "dirA": self.dir_a,
            "dirB": self.dir_b,
            "identical": self.identical,
            "differenceCount": len(self.differences),
            "skippedSnapshot": self.skipped_snapshot,
            "differences": [d.to_dict() for d in self.differences],
        }

    def format_human(self) -> str:
        lines = [
            "Ingest compare",
            f"  A: {self.dir_a}",
            f"  B: {self.dir_b}",
            f"  Result: {'IDENTICAL' if self.identical else 'DIFFERENCES'}",
            f"  Skipped: snapshot={self.skipped_snapshot}",
        ]
        if not self.identical:
            lines.append(f"  Differences: {len(self.differences)}")
            shown = self.differences[:_HUMAN_DIFF_LIMIT]
            for diff in shown:
                lines.append(diff.format_human())
            omitted = len(self.differences) - len(shown)
            if omitted > 0:
                lines.append(f"  ... and {omitted} more (use --json for full report)")
        return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------
# Deep diff
# -----------------------------------------------------------------------

def _path_str(parts: Sequence[str | int]) -> str:
    result = ""
    for p in parts:
        if isinstance(p, int):
            result += f"[{p}]"
        else:
            result += f".{p}" if result else str(p)
    return result or "(root)"


def _numbers_equal(a: Any, b: Any) -> bool:
    """True when int/float values match numerically (bool is not a number here)."""
    if isinstance(a, bool) or isinstance(b, bool):
        return False
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return a == b
    return False


def _diff_values(
    a: Any,
    b: Any,
    path: list[str | int],
    filename: str,
    diffs: list[Difference],
    skips: _SkipCounts,
) -> None:
    if type(a) != type(b):
        if _numbers_equal(a, b):
            return
        diffs.append(Difference(filename, _path_str(path), a, b))
        return

    if isinstance(a, dict):
        all_keys = set(a.keys()) | set(b.keys())
        for key in sorted(all_keys):
            # Skip the snapshot subtree entirely: it contains only metadata
            # (bundledAsOf, source, dolaSource, ...) that differs between the old
            # rebuild and the new ingest by design.
            if key == "snapshot":
                skips.snapshot += 1
                continue
            a_val = a.get(key)
            b_val = b.get(key)
            _diff_values(
                a_val,
                b_val,
                path + [key],
                filename,
                diffs,
                skips,
            )
    elif isinstance(a, list):
        if len(a) != len(b):
            diffs.append(Difference(filename, _path_str(path) + ".length", len(a), len(b)))
        else:
            for i, (av, bv) in enumerate(zip(a, b)):
                _diff_values(
                    av,
                    bv,
                    path + [i],
                    filename,
                    diffs,
                    skips,
                )
    else:
        if a != b:
            diffs.append(Difference(filename, _path_str(path), a, b))


def _diff_file(
    filename: str,
    a: dict[str, Any] | None,
    b: dict[str, Any] | None,
    diffs: list[Difference],
    skips: _SkipCounts,
) -> None:
    if a is None and b is None:
        return
    if a is None:
        diffs.append(Difference(filename, "(file)", None, "(present in b)"))
        return
    if b is None:
        diffs.append(Difference(filename, "(file)", "(present in a)", None))
        return

    # Skip snapshot metadata only; dolaMatch is part of parity.
    _diff_values(
        a,
        b,
        [],
        filename,
        diffs,
        skips,
    )


def _load_json_object(path: Path) -> dict[str, Any] | str | None:
    """Load a JSON object from path. None if missing; str error if unreadable/invalid."""
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        return f"(unreadable: {exc})"
    if not isinstance(data, dict):
        return "(root is not a JSON object)"
    return data


# -----------------------------------------------------------------------
# Public API
# -----------------------------------------------------------------------

def compare_dirs(dir_a: Path, dir_b: Path) -> DiffResult:
    """Compare two JSON directories. Returns a DiffResult."""
    result = DiffResult(dir_a=str(dir_a), dir_b=str(dir_b))
    skips = _SkipCounts()

    all_files: set[str] = set(_COMPARE_FILES_REQUIRED)
    for filename in _COMPARE_FILES_IF_EITHER:
        if (dir_a / filename).is_file() or (dir_b / filename).is_file():
            all_files.add(filename)

    for filename in sorted(all_files):
        path_a = dir_a / filename
        path_b = dir_b / filename

        a_data = _load_json_object(path_a)
        b_data = _load_json_object(path_b)
        if isinstance(a_data, str) or isinstance(b_data, str):
            result.differences.append(
                Difference(
                    filename,
                    "(file)",
                    a_data if isinstance(a_data, str) else ("(present)" if a_data is not None else None),
                    b_data if isinstance(b_data, str) else ("(present)" if b_data is not None else None),
                )
            )
            continue
        _diff_file(filename, a_data, b_data, result.differences, skips)

    _compare_shard_dirs(dir_a, dir_b, result.differences, skips)

    result.skipped_snapshot = skips.snapshot
    return result


def _compare_shard_dirs(
    dir_a: Path,
    dir_b: Path,
    diffs: list[Difference],
    skips: _SkipCounts,
) -> None:
    """Compare arapahoe-parcel-record-by-pin/ when either side has the directory.

    Missing on one side only is a difference. When both exist, compare the same
    shard prefixes and byPin content (snapshot still skipped).
    """
    shard_a = dir_a / _SHARD_DIR
    shard_b = dir_b / _SHARD_DIR
    a_exists = shard_a.is_dir()
    b_exists = shard_b.is_dir()
    if not a_exists and not b_exists:
        return
    if a_exists != b_exists:
        diffs.append(
            Difference(
                _SHARD_DIR,
                "(directory)",
                "(present)" if a_exists else None,
                "(present)" if b_exists else None,
            )
        )
        return

    files_a = {p.name for p in shard_a.glob("*.json")}
    files_b = {p.name for p in shard_b.glob("*.json")}
    all_names = files_a | files_b
    for name in sorted(all_names):
        filename = f"{_SHARD_DIR}/{name}"
        if name not in files_a:
            diffs.append(Difference(filename, "(file)", None, "(present in b)"))
            continue
        if name not in files_b:
            diffs.append(Difference(filename, "(file)", "(present in a)", None))
            continue
        a_data = _load_json_object(shard_a / name)
        b_data = _load_json_object(shard_b / name)
        if isinstance(a_data, str) or isinstance(b_data, str):
            diffs.append(
                Difference(
                    filename,
                    "(file)",
                    a_data if isinstance(a_data, str) else ("(present)" if a_data is not None else None),
                    b_data if isinstance(b_data, str) else ("(present)" if b_data is not None else None),
                )
            )
            continue
        _diff_file(filename, a_data, b_data, diffs, skips)


# -----------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------

def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Compare two JSON output directories (old rebuild vs new ingest). "
            "Excludes snapshot metadata from the diff; includes dolaMatch."
        )
    )
    parser.add_argument("dir_a", type=Path, help="Directory A (e.g. public/data)")
    parser.add_argument("dir_b", type=Path, help="Directory B (e.g. supporting-data/_ingest-out)")
    parser.add_argument("--json", action="store_true", help="Print JSON report to stdout")
    args = parser.parse_args(list(argv) if argv is not None else None)

    for d in (args.dir_a, args.dir_b):
        if not d.is_dir():
            print(f"Directory not found: {d}", file=sys.stderr)
            return 2

    result = compare_dirs(args.dir_a, args.dir_b)

    if args.json:
        sys.stdout.write(json.dumps(result.to_dict(), indent=2) + "\n")
    else:
        sys.stdout.write(result.format_human())

    return 0 if result.identical else 1


if __name__ == "__main__":
    raise SystemExit(main())
