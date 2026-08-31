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

from contextlib import contextmanager

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


def resolve_role_column_map(
    headers: Sequence[str],
    mapping: dict[str, Any],
    file_role: str,
) -> dict[str, str]:
    """
    Map every known logical field for ``file_role`` to a CSV header present in ``headers``.

    Uses ``columnAliases[file_role]`` only (no Arapahoe header names in callers).
    Returns logical_field -> csv_column_name for columns found.
    """
    file_aliases: dict[str, list[str]] = mapping.get("columnAliases", {}).get(file_role, {})
    result: dict[str, str] = {}
    for logical, aliases in file_aliases.items():
        if logical.startswith("_"):
            continue
        if not isinstance(aliases, list):
            continue
        found = _resolve_column(headers, aliases)
        if found is not None:
            result[logical] = found
    return result


def logical_row_from_csv(
    raw_row: dict[str, str | None],
    col_map: dict[str, str],
) -> dict[str, str]:
    """Project a CSV DictReader row onto logical field names (stripped strings)."""
    out: dict[str, str] = {}
    for logical, csv_col in col_map.items():
        out[logical] = _strip(raw_row.get(csv_col, ""))
    return out


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


from contextlib import contextmanager


def tabular_options_for_role(mapping: dict[str, Any], file_role: str) -> dict[str, Any]:
    """Return optional tabular options for a file role from mapping["tabular"].

    Shared shape (any county):
      hasHeaderRow (bool, default True)
      encoding (str, default "utf-8-sig")
      headers (list[str], required when hasHeaderRow is false)
    """
    tabular = mapping.get("tabular") or {}
    opts = tabular.get(file_role) or {}
    return opts if isinstance(opts, dict) else {}


@contextmanager
def open_csv_dict_reader(csv_path: Path, mapping: dict[str, Any], file_role: str):
    """Yield (DictReader, headers) for a CSV/TXT, injecting headers when mapping says so.

    County-specific paths and column names stay in the mapping file. This helper
    is the reusable intake seam for headerless Assessor dumps and non-UTF8 files.
    """
    opts = tabular_options_for_role(mapping, file_role)
    encoding = str(opts.get("encoding") or "utf-8-sig")
    has_header = opts.get("hasHeaderRow", True)
    if has_header is None:
        has_header = True
    f = csv_path.open(newline="", encoding=encoding, errors="replace")
    try:
        if has_header:
            reader = csv.DictReader(f)
            yield reader, list(reader.fieldnames or [])
        else:
            headers = opts.get("headers")
            if (
                not isinstance(headers, list)
                or not headers
                or not all(isinstance(h, str) and h for h in headers)
            ):
                raise MappingError(
                    f"{csv_path}: mapping tabular.{file_role} hasHeaderRow is false but "
                    f"headers is missing or empty"
                )
            reader = csv.DictReader(f, fieldnames=list(headers))
            yield reader, list(headers)
    finally:
        f.close()


def read_levy_stack_rows(
    csv_path: Path,
    mapping: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Read a levy-stack CSV into intermediate records using shared field names.

    Each output record has:
      taxAreaId (str, required), lineCode (str, required), authorityName (str, required)
      taxYear (str|None), effectiveYear (str|None), status (str|None)
      millLevy (float|None) when the source is a tax-district mill PDF

    Dispatches to the mill-PDF reader when levyStack.format is
    tax-district-mill-pdf (or the path is a .pdf with no format set).
    No Arapahoe-specific column names appear in output.
    Raises MappingError when required mapped columns are absent from the file.
    """
    levy_cfg = mapping["levyStack"]
    file_role = levy_cfg["file"]
    stack_format = str(levy_cfg.get("format") or "").strip().lower()
    path = csv_path
    if stack_format == "tax-district-mill-pdf" or (
        not stack_format and path.suffix.lower() == ".pdf"
    ):
        from ingest.mill_pdf import read_tax_district_mill_pdf_rows

        return read_tax_district_mill_pdf_rows(path, mapping)

    schema = _schema_without_file(levy_cfg)
    aliases: dict[str, list[str]] = mapping.get("columnAliases", {}).get(file_role, {})

    with open_csv_dict_reader(csv_path, mapping, file_role) as (reader, headers):
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

    with open_csv_dict_reader(csv_path, mapping, file_role) as (reader, headers):
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


def read_values_totals_by_account(
    values_path: Path,
    mapping: dict[str, Any],
) -> dict[str, dict[str, float]]:
    """
    Sum actual/assessed value rows per account id from a values file.

    Requires accountMap.valuesFile (file role) and valuesAggregate "sum".
    Uses columnAliases on that role for accountId / totalActual / totalAssessed
    logical keys from accountMap. Returns accountId -> {totalActual, totalAssessed}.
    """
    from ingest.writer import _normalize_account_id

    acct_cfg = mapping["accountMap"]
    values_role = acct_cfg.get("valuesFile")
    if not isinstance(values_role, str) or not values_role:
        raise MappingError("accountMap.valuesFile must be a non-empty file role string")
    aggregate = acct_cfg.get("valuesAggregate") or "sum"
    if aggregate != "sum":
        raise MappingError(
            f"unsupported accountMap.valuesAggregate {aggregate!r}; only 'sum' is implemented"
        )

    account_alias = acct_cfg.get("accountId")
    actual_alias = acct_cfg.get("totalActual")
    assessed_alias = acct_cfg.get("totalAssessed")
    if not account_alias or not actual_alias or not assessed_alias:
        raise MappingError(
            "accountMap must map accountId, totalActual, and totalAssessed "
            "when valuesFile is set"
        )

    pin_digits = int(mapping.get("identifierDigits", 9))
    schema = {
        "accountId": account_alias,
        "totalActual": actual_alias,
        "totalAssessed": assessed_alias,
    }
    totals: dict[str, dict[str, float]] = {}
    with open_csv_dict_reader(values_path, mapping, values_role) as (reader, headers):
        col_map = _build_column_map(
            headers, values_role, schema, mapping.get("columnAliases", {})
        )
        aliases_for_role = mapping.get("columnAliases", {}).get(values_role, {})
        for field, alias_key in schema.items():
            if alias_key not in col_map:
                raise MappingError(
                    f"{values_path}: required values column '{field}' "
                    f"(mapped from '{alias_key}') not found in headers {headers}. "
                    f"Available aliases: {aliases_for_role.get(alias_key, [])}"
                )

        acct_col = col_map[account_alias]
        actual_col = col_map[actual_alias]
        assessed_col = col_map[assessed_alias]
        for raw_row in reader:
            account_id = _normalize_account_id(raw_row.get(acct_col, ""), pin_digits)
            if not account_id:
                continue
            actual = _parse_float_or_none(raw_row.get(actual_col, ""))
            assessed = _parse_float_or_none(raw_row.get(assessed_col, ""))
            bucket = totals.get(account_id)
            if bucket is None:
                bucket = {"totalActual": 0.0, "totalAssessed": 0.0}
                totals[account_id] = bucket
            if actual is not None:
                bucket["totalActual"] += actual
            if assessed is not None:
                bucket["totalAssessed"] += assessed
    return totals


def apply_values_totals(
    account_rows: list[dict[str, Any]],
    totals: dict[str, dict[str, float]],
    pin_digits: int,
) -> list[dict[str, Any]]:
    """Copy account rows with totalActual/totalAssessed filled from totals when present."""
    from ingest.writer import _normalize_account_id

    out: list[dict[str, Any]] = []
    for row in account_rows:
        account_id = _normalize_account_id(row.get("accountId", ""), pin_digits)
        merged = dict(row)
        bucket = totals.get(account_id) if account_id else None
        if bucket is not None:
            merged["totalActual"] = bucket["totalActual"]
            merged["totalAssessed"] = bucket["totalAssessed"]
        out.append(merged)
    return out


def read_account_rows_with_values(
    account_path: Path,
    values_path: Path,
    mapping: dict[str, Any],
) -> list[dict[str, Any]]:
    """Read the account/location file, then join summed values by account id."""
    rows = read_account_rows(account_path, mapping)
    totals = read_values_totals_by_account(values_path, mapping)
    pin_digits = int(mapping.get("identifierDigits", 9))
    return apply_values_totals(rows, totals, pin_digits)


def read_location_situs_map(
    location_path: Path,
    mapping: dict[str, Any],
) -> dict[str, list[dict[str, str]]]:
    """
    Build situs lookup keys from a location/account CSV (Douglas-style).

    Uses ``columnAliases`` on the accountMap file role for logical situs fields
    (``sa_addr_number``, ``pin``, …) and shared ``ingest.situs`` key/label rules.
    """
    from ingest.situs import accumulate_situs_row, finalize_situs_map
    from ingest.writer import _normalize_account_id

    acct_cfg = mapping["accountMap"]
    file_role = acct_cfg["file"]
    pin_digits = int(mapping.get("identifierDigits", 9))
    account_alias = acct_cfg.get("accountId", "")
    situs_by_key: dict[str, dict[str, str]] = {}

    with open_csv_dict_reader(location_path, mapping, file_role) as (reader, headers):
        col_map = resolve_role_column_map(headers, mapping, file_role)
        pin_alias = "pin" if "pin" in col_map else account_alias
        if pin_alias not in col_map:
            raise MappingError(
                f"{location_path}: situs build needs pin/account column via mapping "
                f"(accountMap.accountId={account_alias!r})"
            )
        for raw_row in reader:
            logical = logical_row_from_csv(raw_row, col_map)
            pin_raw = logical.get(pin_alias, "") or logical.get(account_alias, "")
            pin = _normalize_account_id(pin_raw, pin_digits)
            if not pin:
                continue
            accumulate_situs_row(situs_by_key, {**logical, "pin": pin}, pin)

    return finalize_situs_map(situs_by_key)


