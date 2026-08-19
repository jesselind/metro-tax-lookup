#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Inspect a county drop folder. Report coverage for app JSON.

Does not write application JSON or any other file under public/. --json-out
writes a classifier report only, and is refused if that path is under public/.

Usage:
  python3 tools/ingest/classify.py supporting-data
  python3 tools/ingest/classify.py /path/to/drop --json
  python3 tools/ingest/classify.py /path/to/drop --json-out /tmp/classify-report.json

Coverage statuses: ready, mapping-needed, new-reader, will-be-off.
Missing a levy-stack source is a hard fail (exit 1). Arapahoe header names are
known-drop signatures until mapping files exist (Phase 4).
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PUBLIC_DIR = REPO_ROOT / "public"

SKIP_DIR_NAMES = {
    ".git",
    ".next",
    ".venv",
    "__pycache__",
    "_private",
    "coverage",
    "node_modules",
    "playwright-report",
    "public",
    "test-results",
}

# Header sets are compacted (alnum, lower). Arapahoe column names live here
# until tools/ingest/mappings/arapahoe.json exists.
ARAPAHOE_MAIN_PARCEL = frozenset({"pin", "tagid", "totalactual", "totalassessed"})
ARAPAHOE_TAG_FIELDS = frozenset(
    {"field1", "field2", "field3", "field4", "field5", "field6"}
)
# Excel-default Field1-Field6 are not enough; path must look like the Data Mart
# Tax Authority Groups export (or Mart_TA_TAG). Named TAGId + AuthorityName is
# the other accepted cue.
ARAPAHOE_TAG_PATH_CUES = ("taxauthoritygroup", "marttatag")
ARAPAHOE_TAG_NAMED = frozenset({"tagid", "authorityname"})
DOLA_PROPERTY_TAX_ENTITIES = frozenset(
    {"certifyingcounty", "taxentityid", "dolataxentityname"}
)
GIS_NEIGHBORHOOD = frozenset({"pin", "neighborhoodcode", "neighborhood"})
SITUS_STREET_PARTS = frozenset({"saaddrnumber", "sastreetname"})
SITUS_FREEFORM = frozenset({"safreeformaddr"})

ACCOUNT_HINTS = frozenset(
    {"schedule", "schedulenumber", "account", "accountid", "parcelid", "pin"}
)
VALUE_HINTS = frozenset(
    {
        "actual",
        "actualvalue",
        "totalactual",
        "assessed",
        "assessedvalue",
        "totalassessed",
        "marketvalue",
    }
)
LEVY_RATE_HINTS = frozenset({"mills", "milllevy", "levymills"})
AUTHORITY_HINTS = frozenset(
    {"authority", "authorityname", "entity", "entityname", "taxingentity"}
)
SITUS_HINTS = frozenset(
    {
        "situs",
        "situsaddress",
        "address",
        "safreeformaddr",
        "sastreetname",
        "saaddrnumber",
    }
)

COVERAGE_PRODUCTS = (
    "levyStacks",
    "accountMap",
    "situs",
    "shards",
    "compsPdf",
)

HARD_FAIL_NO_STACKS = (
    "no levy-stack source (need a tax-area x authority mills table, "
    "for example Arapahoe Tax Authority Groups)"
)


def normalize_header(raw: object) -> str:
    if raw is None:
        return ""
    return str(raw).lstrip("\ufeff").rstrip(":").strip()


def compact_header(raw: object) -> str:
    return "".join(c for c in normalize_header(raw).lower() if c.isalnum())


def compact_header_set(headers: Sequence[object]) -> set[str]:
    return {c for h in headers if (c := compact_header(h))}


def _hits(compacted: set[str], keys: frozenset[str]) -> bool:
    return bool(compacted & keys)


@dataclass(frozen=True)
class FileRecord:
    path: str
    kind: str
    headers: tuple[str, ...]
    signature: str

    def to_dict(self) -> dict[str, object]:
        return {
            "path": self.path,
            "kind": self.kind,
            "headers": list(self.headers),
            "signature": self.signature,
        }


@dataclass(frozen=True)
class CoverageItem:
    status: str
    reason: str
    files: tuple[str, ...]

    def to_dict(self) -> dict[str, object]:
        return {
            "status": self.status,
            "reason": self.reason,
            "files": list(self.files),
        }


@dataclass(frozen=True)
class ClassifyReport:
    drop_dir: str
    ok: bool
    hard_fail: str | None
    files: tuple[FileRecord, ...]
    coverage: dict[str, CoverageItem]
    recommended_feature_flags: dict[str, bool]

    def to_dict(self) -> dict[str, object]:
        return {
            "dropDir": self.drop_dir,
            "ok": self.ok,
            "hardFail": self.hard_fail,
            "files": [f.to_dict() for f in self.files],
            "coverage": {k: self.coverage[k].to_dict() for k in COVERAGE_PRODUCTS},
            "recommendedFeatureFlags": dict(self.recommended_feature_flags),
        }

    def format_human(self) -> str:
        lines = [
            "Ingest classifier",
            f"Drop: {self.drop_dir}",
            f"Result: {'OK' if self.ok else 'HARD FAIL'}",
        ]
        if self.hard_fail:
            lines.append(f"  {self.hard_fail}")
        lines.append("")
        lines.append(f"Files ({len(self.files)})")
        if not self.files:
            lines.append("  (none inspected)")
        for rec in self.files:
            lines.append(f"  {rec.path}  {rec.kind}  {rec.signature}")
        lines.append("")
        lines.append("Coverage")
        width = max(len(k) for k in COVERAGE_PRODUCTS)
        for key in COVERAGE_PRODUCTS:
            item = self.coverage[key]
            lines.append(
                f"  {key:<{width}}  {item.status:<14}  {item.reason}"
            )
        flags = ", ".join(
            f"{k}={str(v).lower()}"
            for k, v in self.recommended_feature_flags.items()
        )
        if flags:
            lines.append("")
            lines.append(f"Recommended feature flags: {flags}")
        return "\n".join(lines) + "\n"


def relative_posix(path: Path, drop: Path) -> str:
    try:
        return path.resolve().relative_to(drop.resolve()).as_posix()
    except ValueError:
        return path.resolve().as_posix()


def iter_drop_paths(drop: Path) -> Iterable[Path]:
    for dirpath, dirnames, filenames in os.walk(drop, followlinks=False):
        here = Path(dirpath)
        dirnames[:] = [
            d
            for d in dirnames
            if d not in SKIP_DIR_NAMES
            and not d.startswith(".")
            and not (here / d).is_symlink()
        ]
        gdb_dirs = [d for d in dirnames if d.lower().endswith(".gdb")]
        dirnames[:] = [d for d in dirnames if not d.lower().endswith(".gdb")]
        for d in gdb_dirs:
            yield here / d
        for name in filenames:
            if name.startswith(".") or name.startswith("~$"):
                continue
            child = here / name
            if child.is_symlink():
                continue
            yield child


def read_csv_headers(path: Path, *, delimiter: str = ",") -> list[str]:
    with path.open(newline="", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f, delimiter=delimiter)
        for row in reader:
            headers = [normalize_header(c) for c in row if normalize_header(c)]
            if headers:
                return headers
    return []


def read_xlsx_headers(path: Path) -> list[str] | None:
    try:
        import openpyxl
    except ImportError:
        return None
    try:
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        try:
            sheet = wb.worksheets[0]
            for row in sheet.iter_rows(max_row=1, values_only=True):
                return [normalize_header(c) for c in row if normalize_header(c)]
        finally:
            wb.close()
    except Exception:
        return []
    return []


def read_geojson_property_keys(path: Path) -> list[str]:
    with path.open(encoding="utf-8-sig", errors="replace") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        return []
    if data.get("type") != "FeatureCollection":
        return []
    features = data.get("features")
    if not isinstance(features, list) or not features:
        return []
    first = features[0]
    if not isinstance(first, dict):
        return []
    props = first.get("properties")
    if not isinstance(props, dict):
        return []
    return [normalize_header(k) for k in props.keys() if normalize_header(k)]


def read_gdb_fields(path: Path) -> tuple[list[str], list[str]] | None:
    """Layer names plus field names of the first layer. No feature rows."""
    try:
        import pyogrio
    except ImportError:
        return None
    try:
        layers = pyogrio.list_layers(path)
        names = [str(row[0]) for row in layers] if layers is not None else []
        fields: list[str] = []
        if names:
            info = pyogrio.read_info(path, layer=names[0])
            raw_fields = info.get("fields") if isinstance(info, dict) else None
            if raw_fields is not None:
                fields = [normalize_header(x) for x in list(raw_fields)]
        return names, fields
    except Exception:
        return [], []


def pdf_signature(path: Path) -> str:
    text = ""
    try:
        import pdfplumber
    except ImportError:
        return "unknown-pdf"
    try:
        with pdfplumber.open(path) as pdf:
            if not pdf.pages:
                return "unknown-pdf"
            text = pdf.pages[0].extract_text() or ""
    except Exception:
        return "unknown-pdf"
    sample = text.lower()
    if any(h in sample for h in ("comparable", "notice of valuation")):
        return "unknown-comps-pdf"
    if any(h in sample for h in ("mill levy", "certification of levies")):
        return "unknown-mill-pdf"
    return "unknown-pdf"


def _is_arapahoe_tag_path(rel_path: str) -> bool:
    compact = "".join(c for c in rel_path.lower() if c.isalnum())
    return any(cue in compact for cue in ARAPAHOE_TAG_PATH_CUES)


def match_tabular_signature(
    headers: Sequence[str], *, rel_path: str = ""
) -> str:
    compacted = compact_header_set(headers)
    if not compacted:
        return "unknown-csv"
    if DOLA_PROPERTY_TAX_ENTITIES <= compacted:
        return "dola-property-tax-entities"
    if ARAPAHOE_TAG_NAMED <= compacted:
        return "arapahoe-tax-authority-groups"
    if ARAPAHOE_TAG_FIELDS <= compacted and _is_arapahoe_tag_path(rel_path):
        return "arapahoe-tax-authority-groups"
    if ARAPAHOE_MAIN_PARCEL <= compacted:
        return "arapahoe-main-parcel"
    if GIS_NEIGHBORHOOD <= compacted:
        return "gis-parcels"
    if "pin" in compacted:
        return "arapahoe-mart-sibling"
    if (
        _hits(compacted, ACCOUNT_HINTS)
        and _hits(compacted, VALUE_HINTS)
        and not (ARAPAHOE_MAIN_PARCEL <= compacted)
    ):
        return "mapping-candidate-account"
    if _hits(compacted, LEVY_RATE_HINTS) and _hits(compacted, AUTHORITY_HINTS):
        return "mapping-candidate-levy"
    return "unknown-csv"


def inspect_path(path: Path, drop: Path) -> FileRecord | None:
    rel = relative_posix(path, drop)
    if path.is_dir() and path.name.lower().endswith(".gdb"):
        inspected = read_gdb_fields(path)
        if inspected is None:
            return FileRecord(rel, "gdb", (), "gdb-install-pyogrio-to-inspect")
        _layers, fields = inspected
        sig = match_tabular_signature(fields, rel_path=rel)
        if sig == "unknown-csv":
            sig = "unknown-gdb"
        return FileRecord(rel, "gdb", tuple(fields), sig)

    suffix = path.suffix.lower()
    if suffix in {".csv", ".tsv"}:
        delimiter = "\t" if suffix == ".tsv" else ","
        headers = read_csv_headers(path, delimiter=delimiter)
        kind = "csv" if suffix == ".csv" else "tsv"
        return FileRecord(
            rel, kind, tuple(headers), match_tabular_signature(headers, rel_path=rel)
        )

    if suffix == ".xls":
        return FileRecord(rel, "xls", (), "unsupported-xls")

    if suffix == ".xlsx":
        headers = read_xlsx_headers(path)
        if headers is None:
            return FileRecord(rel, "xlsx", (), "xlsx-install-openpyxl-to-inspect")
        sig = match_tabular_signature(headers, rel_path=rel)
        if sig == "unknown-csv":
            sig = "unknown-xlsx"
        return FileRecord(rel, "xlsx", tuple(headers), sig)

    if suffix == ".pdf":
        return FileRecord(rel, "pdf", (), pdf_signature(path))

    if suffix == ".geojson":
        try:
            headers = read_geojson_property_keys(path)
        except (json.JSONDecodeError, OSError, UnicodeError):
            return FileRecord(rel, "geojson", (), "unknown-csv")
        return FileRecord(
            rel,
            "geojson",
            tuple(headers),
            match_tabular_signature(headers, rel_path=rel),
        )

    if suffix == ".json":
        try:
            headers = read_geojson_property_keys(path)
        except (json.JSONDecodeError, OSError, UnicodeError):
            return None
        if not headers:
            return None
        return FileRecord(
            rel,
            "geojson",
            tuple(headers),
            match_tabular_signature(headers, rel_path=rel),
        )

    return None


def _files_with_signature(
    files: Sequence[FileRecord], *signatures: str
) -> tuple[FileRecord, ...]:
    wanted = set(signatures)
    return tuple(f for f in files if f.signature in wanted)


def _paths(recs: Sequence[FileRecord]) -> tuple[str, ...]:
    return tuple(f.path for f in recs)


def _item(status: str, reason: str, recs: Sequence[FileRecord]) -> CoverageItem:
    return CoverageItem(status, reason, _paths(recs))


def _has_situs_headers(rec: FileRecord) -> bool:
    compacted = compact_header_set(rec.headers)
    return SITUS_STREET_PARTS <= compacted or SITUS_FREEFORM <= compacted


def coverage_from_files(
    files: Sequence[FileRecord],
) -> tuple[dict[str, CoverageItem], str | None, dict[str, bool]]:
    tag = _files_with_signature(files, "arapahoe-tax-authority-groups")
    dola = _files_with_signature(files, "dola-property-tax-entities")
    main = _files_with_signature(files, "arapahoe-main-parcel")
    siblings = _files_with_signature(files, "arapahoe-mart-sibling")
    gis = _files_with_signature(files, "gis-parcels")
    account_map_needed = _files_with_signature(files, "mapping-candidate-account")
    levy_map_needed = _files_with_signature(files, "mapping-candidate-levy")
    comps_pdfs = _files_with_signature(files, "unknown-comps-pdf")
    mill_pdfs = _files_with_signature(files, "unknown-mill-pdf")
    unknown_pdfs = _files_with_signature(files, "unknown-pdf")
    unknown_tables = tuple(
        f
        for f in files
        if f.signature in {"unknown-csv", "unknown-xlsx"}
    )

    coverage: dict[str, CoverageItem] = {}

    if tag:
        reason = "Arapahoe Tax Authority Groups headers"
        if dola:
            reason += "; DOLA Property Tax Entities present for optional lgId"
        coverage["levyStacks"] = _item("ready", reason, tag + dola)
        hard_fail = None
    elif levy_map_needed:
        coverage["levyStacks"] = _item(
            "mapping-needed",
            "table looks like entity mills, not a known tax-area stack export",
            levy_map_needed,
        )
        hard_fail = None
    elif mill_pdfs:
        coverage["levyStacks"] = _item(
            "new-reader",
            "mill-levy PDF found; not a tax-area stack table",
            mill_pdfs,
        )
        hard_fail = HARD_FAIL_NO_STACKS
    else:
        extra = unknown_tables + unknown_pdfs
        coverage["levyStacks"] = _item(
            "new-reader" if extra else "will-be-off",
            HARD_FAIL_NO_STACKS,
            extra,
        )
        hard_fail = HARD_FAIL_NO_STACKS

    if main:
        coverage["accountMap"] = _item(
            "ready",
            "Arapahoe Main Parcel headers (Pin, TAGId, TotalActual, TotalAssessed)",
            main,
        )
    elif account_map_needed:
        coverage["accountMap"] = _item(
            "mapping-needed",
            "account + value columns present, not Arapahoe Pin/TAGId headers",
            account_map_needed,
        )
    else:
        coverage["accountMap"] = _item(
            "mapping-needed" if unknown_tables else "will-be-off",
            "no account map source (need account id, tax-area key, actual, assessed)",
            unknown_tables,
        )

    situs_from_main = tuple(f for f in main if _has_situs_headers(f))
    situs_candidates = tuple(
        f
        for f in account_map_needed
        if _hits(compact_header_set(f.headers), SITUS_HINTS)
    )
    if situs_from_main:
        coverage["situs"] = _item(
            "ready",
            "Main Parcel situs columns (SA*)",
            situs_from_main,
        )
    elif situs_candidates:
        coverage["situs"] = _item(
            "mapping-needed",
            "address-like columns on a non-Arapahoe account table",
            situs_candidates,
        )
    else:
        coverage["situs"] = _item(
            "will-be-off",
            "no situs / address columns; id-only lookup",
            (),
        )

    if main:
        shard_files = main + siblings + gis
        bits = ["Main Parcel"]
        if siblings:
            bits.append("mart sibling tables")
        if gis:
            bits.append("GIS neighborhood fields")
        coverage["shards"] = _item("ready", ", ".join(bits), shard_files)
    elif account_map_needed:
        coverage["shards"] = _item(
            "mapping-needed",
            "parcel table present; needs a mapping file before shards",
            account_map_needed + gis,
        )
    else:
        coverage["shards"] = _item(
            "will-be-off",
            "no parcel table for shards",
            (),
        )

    if comps_pdfs:
        coverage["compsPdf"] = _item(
            "new-reader",
            "PDF looks like comps / notice of valuation; no ingest reader yet",
            comps_pdfs,
        )
        comps_flag = False
    else:
        coverage["compsPdf"] = _item(
            "will-be-off",
            "no comps PDF in drop; leave feature flag compsPdf off",
            unknown_pdfs,
        )
        comps_flag = False

    return coverage, hard_fail, {"compsPdf": comps_flag}


def classify_drop(drop_dir: Path) -> ClassifyReport:
    drop = drop_dir.expanduser().resolve()
    if not drop.is_dir():
        raise FileNotFoundError(f"drop directory not found: {drop}")
    records = [
        rec
        for path in iter_drop_paths(drop)
        if (rec := inspect_path(path, drop)) is not None
    ]
    records.sort(key=lambda r: r.path)
    coverage, hard_fail, flags = coverage_from_files(records)
    return ClassifyReport(
        drop_dir=str(drop),
        ok=hard_fail is None,
        hard_fail=hard_fail,
        files=tuple(records),
        coverage=coverage,
        recommended_feature_flags=flags,
    )


def json_out_is_forbidden(path: Path) -> bool:
    resolved = path.expanduser().resolve()
    try:
        resolved.relative_to(PUBLIC_DIR.resolve())
        return True
    except ValueError:
        return False


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Classify a county drop folder. Does not write app JSON."
    )
    parser.add_argument(
        "drop_dir",
        type=Path,
        help="Folder of county/state files (CSV, XLSX, PDF, GeoJSON, GDB)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print JSON report to stdout instead of the human summary",
    )
    parser.add_argument(
        "--json-out",
        type=Path,
        help="Write JSON report to this path (refused under public/)",
    )
    args = parser.parse_args(list(argv) if argv is not None else None)

    if args.json_out is not None and json_out_is_forbidden(args.json_out):
        print(
            f"Refusing to write under public/: {args.json_out}",
            file=sys.stderr,
        )
        return 2

    try:
        report = classify_drop(args.drop_dir)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    payload = json.dumps(report.to_dict(), indent=2) + "\n"
    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(payload, encoding="utf-8")
    if args.json:
        sys.stdout.write(payload)
    else:
        sys.stdout.write(report.format_human())
    return 0 if report.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
