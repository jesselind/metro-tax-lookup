#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Mapping-file-driven CSV reader for the new ingest.

Reads a county CSV file using the column aliases in a mapping file and returns
intermediate records using shared field names. County-specific column names
(SAFreeFormAddr, TAGId, Pin, ...) live only in the mapping file, not here.

Usage:
  from ingest.reader import load_mapping, read_levy_stack_rows, read_account_rows
"""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path
from typing import Any, Sequence


class MappingError(ValueError):
    """Raised when the mapping file is invalid or required columns are absent."""


# -----------------------------------------------------------------------
# Mapping file
# -----------------------------------------------------------------------

_REQUIRED_TOP_LEVEL_KEYS = {"county", "identifierDigits", "levyAspxTemplate", "levyStack", "accountMap", "columnAliases"}
_REQUIRED_LEVY_KEYS = {"file", "taxAreaId", "lineCode", "authorityName"}
_REQUIRED_ACCOUNT_KEYS = {"file", "accountId", "taxAreaId"}


def load_mapping(path: Path) -> dict[str, Any]:
    """Load and validate a mapping JSON file. Raises MappingError for invalid shape."""
    if not path.is_file():
        raise FileNotFoundError(f"mapping file not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise MappingError(f"invalid JSON in mapping file {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise MappingError(f"mapping file root must be an object: {path}")
    missing = _REQUIRED_TOP_LEVEL_KEYS - set(data.keys())
    if missing:
        raise MappingError(
            f"mapping file {path} missing required top-level keys: {sorted(missing)}"
        )
    levy_stack = data["levyStack"]
    if not isinstance(levy_stack, dict):
        raise MappingError(f"mapping file {path} levyStack must be an object")
    levy_missing = _REQUIRED_LEVY_KEYS - set(levy_stack.keys())
    if levy_missing:
        raise MappingError(
            f"mapping file {path} levyStack missing keys: {sorted(levy_missing)}"
        )
    account_map = data["accountMap"]
    if not isinstance(account_map, dict):
        raise MappingError(f"mapping file {path} accountMap must be an object")
    account_missing = _REQUIRED_ACCOUNT_KEYS - set(account_map.keys())
    if account_missing:
        raise MappingError(
            f"mapping file {path} accountMap missing keys: {sorted(account_missing)}"
        )
    return data


# -----------------------------------------------------------------------
# Column alias resolution
# -----------------------------------------------------------------------

def _resolve_column(
    headers: Sequence[str],
    aliases: list[str],
) -> str | None:
    """Return the first alias present in headers (case-sensitive match), or None."""
    header_set = set(headers)
    for alias in aliases:
        if alias in header_set:
            return alias
    return None


def _build_column_map(
    headers: Sequence[str],
    file_role: str,
    schema: dict[str, str],
    aliases: dict[str, list[str]],
) -> dict[str, str]:
    """
    Map logical field name -> actual CSV column name for one file role.

    schema: logical_name -> alias-key (from levyStack/accountMap, excluding "file")
    aliases: full mapping columnAliases object (file_role -> alias-key -> CSV headers)
    Returns: alias-key -> csv_column_name (only for found columns)
    """
    file_aliases = aliases.get(file_role, {})
    result: dict[str, str] = {}
    for alias_key in schema.values():
        col_aliases = file_aliases.get(alias_key, [])
        found = _resolve_column(headers, col_aliases)
        if found is not None:
            result[alias_key] = found
    return result


def _schema_without_file(cfg: dict[str, Any]) -> dict[str, str]:
    return {k: v for k, v in cfg.items() if k != "file" and isinstance(v, str)}


# -----------------------------------------------------------------------
# Field parsing helpers
# -----------------------------------------------------------------------

def _strip(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def _parse_float(val: Any) -> float | None:
    s = _strip(val)
    if not s:
        return None
    try:
        return float(s.replace(",", ""))
    except ValueError:
        return None


def _parse_float_or_none(val: Any) -> float | None:
    result = _parse_float(val)
    if result is None:
        return None
    if isinstance(result, float) and math.isnan(result):
        return None
    return result


def _optional_str(val: Any) -> str | None:
    s = _strip(val)
    return s if s else None


# -----------------------------------------------------------------------
# Read levy stack rows (intermediate records)
# -----------------------------------------------------------------------

def read_levy_stack_rows(
    csv_path: Path,
    mapping: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Read a levy-stack CSV into intermediate records using shared field names.

    Each output record has:
      taxAreaId (str, required), lineCode (str, required), authorityName (str, required)
      taxYear (str|None), effectiveYear (str|None), status (str|None)

    No Arapahoe-specific column names appear in output.
    Raises MappingError when required mapped columns are absent from the file.
    """
    levy_cfg = mapping["levyStack"]
    file_role = levy_cfg["file"]
    schema = _schema_without_file(levy_cfg)
    aliases: dict[str, list[str]] = mapping.get("columnAliases", {}).get(file_role, {})

    with csv_path.open(newline="", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        headers = list(reader.fieldnames or [])
        col_map = _build_column_map(headers, file_role, schema, mapping.get("columnAliases", {}))

        # Validate required columns
        required = {"taxAreaId", "lineCode", "authorityName"}
        for field in required:
            alias_key = levy_cfg.get(field)
            if alias_key and alias_key not in col_map:
                raise MappingError(
                    f"{csv_path}: required levy column '{field}' (mapped from '{alias_key}') "
                    f"not found in headers {headers}. "
                    f"Available aliases: {aliases.get(alias_key, [])}"
                )

        rows: list[dict[str, Any]] = []
        for raw_row in reader:
            tag_area = _strip(raw_row.get(col_map.get(levy_cfg["taxAreaId"], ""), ""))
            if not tag_area:
                continue
            line_code = _strip(raw_row.get(col_map.get(levy_cfg["lineCode"], ""), ""))
            auth_name = _strip(raw_row.get(col_map.get(levy_cfg["authorityName"], ""), ""))
            tax_year_col = col_map.get(levy_cfg.get("taxYear", ""), "")
            eff_year_col = col_map.get(levy_cfg.get("effectiveYear", ""), "")
            status_col = col_map.get(levy_cfg.get("status", ""), "")
            rows.append({
                "taxAreaId": tag_area,
                "lineCode": line_code,
                "authorityName": auth_name,
                "taxYear": _optional_str(raw_row.get(tax_year_col)) if tax_year_col else None,
                "effectiveYear": _optional_str(raw_row.get(eff_year_col)) if eff_year_col else None,
                "status": _optional_str(raw_row.get(status_col)) if status_col else None,
            })
    return rows


# -----------------------------------------------------------------------
# Read account rows (intermediate records)
# -----------------------------------------------------------------------

def read_account_rows(
    csv_path: Path,
    mapping: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Read a parcel/account CSV into intermediate records using shared field names.

    Each output record has:
      accountId (str, required), taxAreaId (str, required)
      tagShortDescr (str|None), totalActual (float|None), totalAssessed (float|None)
      parcelTaxYear (str|None), assessmentYear (str|None),
      propertyClassDescr (str|None), ownerList (str|None), ain (str|None)

    No Arapahoe-specific column names appear in output.
    Raises MappingError when required mapped columns are absent.
    """
    acct_cfg = mapping["accountMap"]
    file_role = acct_cfg["file"]
    schema = _schema_without_file(acct_cfg)

    with csv_path.open(newline="", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        headers = list(reader.fieldnames or [])
        col_map = _build_column_map(headers, file_role, schema, mapping.get("columnAliases", {}))

        # Validate required columns
        required = {"accountId", "taxAreaId"}
        aliases_for_role: dict[str, list[str]] = mapping.get("columnAliases", {}).get(file_role, {})
        for field in required:
            alias_key = acct_cfg.get(field)
            if alias_key and alias_key not in col_map:
                raise MappingError(
                    f"{csv_path}: required account column '{field}' (mapped from '{alias_key}') "
                    f"not found in headers {headers}. "
                    f"Available aliases: {aliases_for_role.get(alias_key, [])}"
                )

        # Helper: get value from CSV row using logical field name
        def _get(row: dict[str, str], field: str) -> str:
            logical = acct_cfg.get(field, "")
            col = col_map.get(logical, "")
            return _strip(row.get(col, "")) if col else ""

        rows: list[dict[str, Any]] = []
        for raw_row in reader:
            account_id = _get(raw_row, "accountId")
            if not account_id:
                continue
            rows.append({
                "accountId": account_id,
                "taxAreaId": _get(raw_row, "taxAreaId"),
                "tagShortDescr": _optional_str(_get(raw_row, "tagShortDescr")),
                "totalActual": _parse_float_or_none(_get(raw_row, "totalActual")),
                "totalAssessed": _parse_float_or_none(_get(raw_row, "totalAssessed")),
                "parcelTaxYear": _optional_str(_get(raw_row, "parcelTaxYear")),
                "assessmentYear": _optional_str(_get(raw_row, "assessmentYear")),
                "propertyClassDescr": _optional_str(_get(raw_row, "propertyClassDescr")),
                "ownerList": _optional_str(_get(raw_row, "ownerList")),
                "ain": _optional_str(_get(raw_row, "ain")),
            })
    return rows
