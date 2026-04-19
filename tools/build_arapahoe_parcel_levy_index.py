#!/usr/bin/env python3
"""
Build Arapahoe parcel → levy stack index from county datamart CSV exports.

Outputs (default: metro-tax-lookup/public/data/):
  - arapahoe-levy-stacks-by-tag-id.json — TAGId → levy lines (+ DOLA match, mills from LGIS export when safe)
  - arapahoe-pin-to-tag.json — Pin → { tagId, tagShortDescr, ain, … } (large; see --skip-pin-map)
  - arapahoe-situs-to-pins.json — situs lookup key → [{ pin, label }, ...] for home address flow (see --skip-pin-map)

Mart_TA_TAG: supporting-data/.../Tax Authority Groups and Tax Authorities.csv
Main parcel: supporting-data/.../Main Parcel Table.csv
Optional DOLA: supporting-data/property-tax-entities-export.csv or .xlsx (LGIS Property Tax Entities:
  https://dola.colorado.gov/dlg_lgis_ui_pu/publicLGTaxEntities.jsf — canonical key src/lib/dataSourceUrls.ts DOLA_LGIS_PROPERTY_TAX_ENTITIES)

Run from repo root:
  cd metro-tax-lookup && source .venv/bin/activate && pip install -r tools/requirements.txt
  python tools/build_arapahoe_parcel_levy_index.py

Maintainer notes:
  - Levy.aspx?id= uses TAGId (tax area), same as Mart_TA_TAG Field2 and Main Parcel TAGId.
    It is not a per-parcel serial; many parcels share one TAGId.
  - Field5 code ASSRFEES is the county assessor fee in the mart export; it is not shown on the
    county online Tax District Levies page. The app PIN-load path omits
    that row so the list matches the table users copy from.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from rapidfuzz import fuzz
except ImportError:
    print("Install dependencies: pip install -r tools/requirements.txt", file=sys.stderr)
    raise

REPO_ROOT = Path(__file__).resolve().parent.parent

DEFAULT_MAIN = (
    REPO_ROOT
    / "supporting-data"
    / "Main Parcel Table (CSV)"
    / "Main Parcel Table.csv"
)
DEFAULT_MART = (
    REPO_ROOT
    / "supporting-data"
    / "Tax Authority Groups and Tax Authorities (CSV)"
    / "Tax Authority Groups and Tax Authorities.csv"
)
DEFAULT_DOLA_CSV = REPO_ROOT / "supporting-data" / "property-tax-entities-export.csv"
DEFAULT_DOLA_XLSX = REPO_ROOT / "supporting-data" / "property-tax-entities-export.xlsx"


def default_dola_export_path() -> Path:
    """Prefer committed CSV; fall back to local xlsx when CSV is absent."""
    if DEFAULT_DOLA_CSV.is_file():
        return DEFAULT_DOLA_CSV
    return DEFAULT_DOLA_XLSX
DEFAULT_OVERRIDES = Path(__file__).resolve().parent / "arapahoe_dola_authority_overrides.json"
DEFAULT_OUT_DIR = REPO_ROOT / "public" / "data"

LEVY_ASPX_BASE = "https://parcelsearch.arapahoegov.com/Levy.aspx?id="


def strip_field(s: str | None) -> str:
    if s is None:
        return ""
    return str(s).strip()


def parse_parcel_value_cell(val: Any) -> float | None:
    """Parse TotalActual / TotalAssessed from Main Parcel CSV; returns None if missing or invalid."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        if isinstance(val, float) and math.isnan(val):
            return None
        return float(val)
    s = strip_field(str(val))
    if not s:
        return None
    try:
        return float(s.replace(",", ""))
    except ValueError:
        return None


def parse_levy_mills_cell(val: Any) -> float | None:
    """Parse DOLA LGIS total levy cell; returns None if missing or invalid."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        if isinstance(val, float) and math.isnan(val):
            return None
        return float(val)
    s = strip_field(str(val))
    if not s:
        return None
    try:
        return float(s.replace(",", ""))
    except ValueError:
        return None


def mart_line_looks_bond_purpose(authority_upper: str) -> bool:
    """True if the mart label names a bond/debt levy line (not general 'debt' in unrelated words)."""
    au = strip_field(authority_upper).upper()
    if "BOND" in au:
        return True
    if "DEBT" in au:
        return True
    return False


def dola_name_looks_bond_purpose(legal_name: str) -> bool:
    u = strip_field(legal_name).upper()
    if "BOND" in u:
        return True
    if "DEBT SERVICE" in u:
        return True
    return False


def normalize_pin(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return ""
    return digits.zfill(9)[:20]


# Situs lookup keys must stay in sync with src/lib/arapahoeSitusLookup.ts (home address flow).
_STREET_DIR_TOKENS = frozenset(
    {
        "N",
        "S",
        "E",
        "W",
        "NE",
        "NW",
        "SE",
        "SW",
        "NORTH",
        "SOUTH",
        "EAST",
        "WEST",
        "NORTHEAST",
        "NORTHWEST",
        "SOUTHEAST",
        "SOUTHWEST",
    }
)
_STREET_TYPE_TOKENS = frozenset(
    {
        "ST",
        "STREET",
        "AVE",
        "AVENUE",
        "RD",
        "ROAD",
        "BLVD",
        "BOULEVARD",
        "DR",
        "DRIVE",
        "LN",
        "LANE",
        "CT",
        "COURT",
        "CIR",
        "CIRCLE",
        "WAY",
        "PL",
        "PLACE",
        "PKWY",
        "PARKWAY",
        "TRL",
        "TRAIL",
        "LOOP",
        "TER",
        "TERR",
        "TERRACE",
        "TPKE",
        "TURNPIKE",
        "HWY",
        "HIGHWAY",
        "BL",
        "PATH",
        "PLZ",
        "PLAZA",
        "RUN",
        "COVE",
        "PASS",
        "ALLEY",
        "ALY",
        "BEND",
        "XING",
        "CROSSING",
        "POINT",
        "PT",
        "COMMONS",
        "MALL",
    }
)


def normalize_street_name_key(raw: str) -> str:
    """County address search omits directionals and street types; mirror that on mart situs."""
    s = strip_field(raw).upper()
    if not s:
        return ""
    tokens = [t for t in re.split(r"[^\w]+", s) if t]
    kept: list[str] = []
    for t in tokens:
        if t in _STREET_DIR_TOKENS or t in _STREET_TYPE_TOKENS:
            continue
        kept.append(t)
    return " ".join(kept)


def normalize_street_number_key(primary: str, range_or_suffix: str) -> str:
    """Merge SAAddrNumber + optional SAStreetNumberSfx (e.g. 1/2); keep in sync with arapahoeSitusLookup.ts."""
    a = strip_field(primary)
    b = strip_field(range_or_suffix)
    merged = " ".join(x for x in (a, b) if x)
    if not merged:
        return ""
    merged_u = merged.upper().replace(" ", "")
    return "".join(c for c in merged_u if c.isdigit() or c in "/-")


def normalize_unit_key(raw: str) -> str:
    s = strip_field(raw).upper()
    if not s:
        return ""
    return re.sub(r"[^A-Z0-9]", "", s)


def row_situs_lookup_key(row: dict[str, str]) -> str | None:
    num = normalize_street_number_key(row.get("SAAddrNumber", ""), row.get("SAStreetNumberSfx", ""))
    name = normalize_street_name_key(row.get("SAStreetName", ""))
    unit = normalize_unit_key(row.get("SAUnitNumber", ""))
    if not num or not name:
        return None
    # Skip common placeholder situs rows in the mart (not useful for address search).
    if strip_field(row.get("SAAddrNumber", "")) == "0":
        return None
    if "TAG" in strip_field(row.get("SAStreetName", "")).upper():
        return None
    return f"{num}|{name}|{unit}"


def format_situs_label(row: dict[str, str]) -> str:
    n = strip_field(row.get("SAAddrNumber", ""))
    pre = strip_field(row.get("SAPredirectional", ""))
    name = strip_field(row.get("SAStreetName", ""))
    typ = strip_field(row.get("SAStreetType", ""))
    post = strip_field(row.get("SAPostdirectional", ""))
    unit = strip_field(row.get("SAUnitNumber", ""))
    city = strip_field(row.get("SACity", ""))
    line1 = " ".join(x for x in (n, pre, name, typ, post) if x)
    if unit:
        line1 = f"{line1} Unit {unit}".strip()
    if city:
        return f"{line1}, {city}".strip()
    return line1 or strip_field(row.get("Pin", ""))


def build_situs_to_pins(path: Path) -> dict[str, list[dict[str, str]]]:
    """Pin -> one label each; multiple parcels can share the same lookup key."""
    by_key: dict[str, dict[str, str]] = {}
    with path.open(newline="", encoding="utf-8", errors="replace") as f:
        r = csv.DictReader(f)
        for row in r:
            pin = normalize_pin(strip_field(row.get("Pin", "")))
            if not pin:
                continue
            lk = row_situs_lookup_key(row)
            if not lk:
                continue
            label = format_situs_label(row)
            if lk not in by_key:
                by_key[lk] = {}
            # Duplicate PIN rows in the export share the same situs; keep one label.
            if pin not in by_key[lk]:
                by_key[lk][pin] = label
    out: dict[str, list[dict[str, str]]] = {}
    for k, pin_map in by_key.items():
        items = [{"pin": p, "label": pin_map[p]} for p in sorted(pin_map.keys())]
        out[k] = items
    return merge_aggregate_situs_keys(out)


def merge_aggregate_situs_keys(
    by_key: dict[str, list[dict[str, str]]],
) -> dict[str, list[dict[str, str]]]:
    """
    Add num|name| keys that union every pin from num|name|* so unit can stay optional
    (county treats Unit as optional).
    """
    parent_pins: dict[str, dict[str, str]] = {}
    for k, items in by_key.items():
        parts = k.split("|")
        if len(parts) != 3:
            continue
        num, name, _unit = parts
        if not num or not name:
            continue
        parent = f"{num}|{name}|"
        bucket = parent_pins.setdefault(parent, {})
        for it in items:
            pin = it.get("pin", "")
            if pin and pin not in bucket:
                bucket[pin] = it.get("label", "")
    merged = dict(by_key)
    for parent, pmap in parent_pins.items():
        agg_list = [{"pin": p, "label": pmap[p]} for p in sorted(pmap.keys())]
        if parent not in merged:
            merged[parent] = agg_list
        else:
            combined: dict[str, str] = {x["pin"]: x["label"] for x in merged[parent]}
            for it in agg_list:
                combined.setdefault(it["pin"], it["label"])
            merged[parent] = [{"pin": p, "label": combined[p]} for p in sorted(combined.keys())]
    return merged


def mart_row_maps(fieldnames: list[str] | None) -> dict[str, str]:
    """Map logical names to actual CSV header."""
    if not fieldnames:
        return {}
    fset = {strip_field(h) for h in fieldnames}
    if fset >= {"Field1", "Field2", "Field3", "Field4", "Field5", "Field6"}:
        return {
            "internal_id": "Field1",
            "tag_id": "Field2",
            "tax_year": "Field3",
            "kind": "Field4",
            "line_code": "Field5",
            "authority_name": "Field6",
            "effective_year": "Field7",
            "status": "Field8",
        }
    # Named export (future)
    lower = {strip_field(h).lower(): strip_field(h) for h in fieldnames}
    def pick(*candidates: str) -> str | None:
        for c in candidates:
            if c.lower() in lower:
                return lower[c.lower()]
        return None

    m = {
        "tag_id": pick("TAGId", "TagId", "tag_id"),
        "tax_year": pick("TaxYear", "tax_year"),
        "line_code": pick("LevyLineCode", "line_code", "Code"),
        "authority_name": pick("AuthorityName", "authority_name", "TaxAuthorityName"),
        "effective_year": pick("EffectiveYear", "effective_year"),
        "status": pick("Status", "status"),
    }
    return {k: v for k, v in m.items() if v}


def sort_line_code(code: str) -> tuple[int, str]:
    c = strip_field(code).upper()
    if c == "ASSRFEES":
        return (2, c)
    if c.isdigit():
        return (0, c.zfill(4))
    return (1, c)


def normalize_for_match(name: str) -> str:
    """
    Shared normalization for mart authority labels and DOLA legal names before
    fuzz.token_sort_ratio. Keeps both sides comparable so common abbreviations
    do not tank scores (e.g. METRO vs METROPOLITAN, DIST vs DISTRICT).

    Word-boundary rules use \\b so we do not alter METROPOLITAN (METRO is not a
    standalone token inside that word).
    """
    s = strip_field(name).upper()
    s = s.replace("&", " AND ")
    s = s.replace("#", " ")
    s = re.sub(r"[^A-Z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    repl = (
        (" DIST ", " DISTRICT "),
        (" DIST", " DISTRICT"),
        (" SCH ", " SCHOOL "),
        (" S SUBURBAN ", " SOUTH SUBURBAN "),
    )
    for a, b in repl:
        s = s.replace(a, b)
    # Typo occasionally seen in exports
    s = s.replace("DISTRRICT", "DISTRICT")
    # Mart lines often say METRO; DOLA legal names say METROPOLITAN
    s = re.sub(r"\bMETRO\b", "METROPOLITAN", s)
    return s


def load_overrides(path: Path) -> dict[str, dict[str, Any]]:
    if not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    raw = data.get("byAuthorityUpper") or {}
    return {strip_field(k).upper(): v for k, v in raw.items()}


def build_entities_by_te_id(entities: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """One row per Tax Entity ID (Arapahoe-only list from load_dola_entities)."""
    out: dict[str, dict[str, Any]] = {}
    for e in entities:
        tid = _te_id_str(e.get("taxEntityId"))
        if not tid:
            continue
        if tid in out:
            print(
                f"Duplicate Tax Entity ID in DOLA Arapahoe rows: {tid} (keeping first).",
                file=sys.stderr,
            )
            continue
        out[tid] = e
    return out


def attach_levy_mills(
    dola: dict[str, Any],
    authority_upper: str,
    entities_by_te_id: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """
    Attach mills from the matched DOLA row when bond/debt purpose aligns with the
    mart label and matched legal name. Otherwise set mills to null (wrong is worse than missing).
    """
    method = dola.get("method")
    if method in ("none", "skipped"):
        return dola
    te_str = _te_id_str(dola.get("taxEntityId"))
    if not te_str:
        out = dict(dola)
        out["mills"] = None
        return out
    ent = entities_by_te_id.get(te_str)
    matched_name = strip_field(str(dola.get("matchedLegalName") or ""))
    if not ent:
        out = dict(dola)
        out["mills"] = None
        return out
    legal = strip_field(str(ent.get("legalName") or ""))

    mart_bond = mart_line_looks_bond_purpose(authority_upper)
    dola_bond = dola_name_looks_bond_purpose(matched_name or legal)

    if mart_bond != dola_bond:
        out = dict(dola)
        out["mills"] = None
        out["millsReason"] = "bond_purpose_mismatch"
        return out

    levy = ent.get("levyMills")
    if levy is None:
        out = dict(dola)
        out["mills"] = None
        return out

    out = dict(dola)
    out["mills"] = round(float(levy), 6)
    return out


def enrich_overrides_from_entities(
    overrides: dict[str, dict[str, Any]],
    entities: list[dict[str, Any]],
    min_score: float = 0.88,
) -> dict[str, dict[str, Any]]:
    """
    Fill taxEntityId / lgId on override rows by matching legalName to DOLA export
    rows (token_sort_ratio). Does not overwrite existing taxEntityId.
    """
    out: dict[str, dict[str, Any]] = {}
    resolved = 0
    for key, v in overrides.items():
        ovr = dict(v)
        if ovr.get("taxEntityId"):
            out[key] = ovr
            continue
        ln = ovr.get("legalName")
        if not ln or not entities:
            out[key] = ovr
            continue
        q = normalize_for_match(str(ln))
        best: dict[str, Any] | None = None
        best_score = -1.0
        for e in entities:
            s = fuzz.token_sort_ratio(q, e["norm"]) / 100.0
            if s > best_score:
                best_score = s
                best = e
        if best and best_score >= min_score:
            ovr["taxEntityId"] = best.get("taxEntityId")
            ovr["lgId"] = best.get("lgId")
            ovr["resolvedFromXlsx"] = True
            ovr["resolvedScore"] = round(best_score, 4)
            resolved += 1
        out[key] = ovr
    if resolved:
        print(f"Enriched {resolved} override rows from DOLA export (>= {min_score:.0%} name match).", file=sys.stderr)
    return out


def _dola_column_indices(headers: list[str]) -> tuple[int | None, int | None, int | None, int | None, int | None] | None:
    """Heuristic column detection for DOLA LGIS exports (xlsx or CSV). Returns None if no name column."""
    idx_name = None
    idx_entity = None
    idx_lgid = None
    idx_county = None
    idx_levy = None
    for i, h in enumerate(headers):
        hl = h.lower()
        if idx_name is None and "name" in hl and "tax" in hl:
            idx_name = i
        if idx_name is None and hl in ("tax entity name", "entity name", "legal name"):
            idx_name = i
        if idx_entity is None and "tax entity" in hl and "id" in hl:
            idx_entity = i
        if idx_lgid is None and ("lgid" in hl.replace(" ", "") or hl == "lg id"):
            idx_lgid = i
        if idx_county is None and "certifying" in hl and "county" in hl:
            idx_county = i
        if idx_levy is None and "levy" in hl and ("total" in hl or "budget" in hl):
            idx_levy = i

    if idx_name is None:
        for i, h in enumerate(headers):
            if "name" in h.lower() and "county" not in h.lower():
                idx_name = i
                break

    if idx_name is None:
        return None
    return idx_name, idx_entity, idx_lgid, idx_county, idx_levy


def _entities_from_dola_table_rows(
    rows: Any,
    idx_name: int,
    idx_entity: int | None,
    idx_lgid: int | None,
    idx_county: int | None,
    idx_levy: int | None,
) -> list[dict[str, Any]]:
    entities: list[dict[str, Any]] = []
    for row in rows:
        if row is None:
            continue
        cells = list(row)
        if not cells or idx_name >= len(cells):
            continue
        if idx_county is not None and idx_county < len(cells):
            cty = strip_field(str(cells[idx_county] if cells[idx_county] is not None else ""))
            if cty.upper() != "ARAPAHOE":
                continue
        legal = cells[idx_name]
        if legal is None or strip_field(str(legal)) == "":
            continue
        legal_s = strip_field(str(legal))
        te_id = ""
        if idx_entity is not None and idx_entity < len(cells) and cells[idx_entity] is not None:
            te_id = strip_field(str(cells[idx_entity]))
        lg = ""
        if idx_lgid is not None and idx_lgid < len(cells) and cells[idx_lgid] is not None:
            lg = strip_field(str(cells[idx_lgid]))
        levy_mills: float | None = None
        if idx_levy is not None and idx_levy < len(cells):
            levy_mills = parse_levy_mills_cell(cells[idx_levy])
        norm = normalize_for_match(legal_s)
        if not norm:
            continue
        entities.append(
            {
                "legalName": legal_s,
                "norm": norm,
                "taxEntityId": te_id or None,
                "lgId": lg or None,
                "levyMills": levy_mills,
            }
        )
    return entities


def load_dola_entities_csv(csv_path: Path) -> tuple[list[dict[str, Any]], str | None]:
    with csv_path.open(newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        try:
            header_row = next(reader)
        except StopIteration:
            return [], None
        headers = [strip_field(str(h) if h is not None else "") for h in header_row]
        parsed = _dola_column_indices(headers)
        if parsed is None:
            print("Could not detect name column in DOLA CSV; skipping DOLA join.", file=sys.stderr)
            return [], None
        idx_name, idx_entity, idx_lgid, idx_county, idx_levy = parsed
        if idx_county is None:
            print(
                "DOLA CSV: no Certifying County column; using all rows (may duplicate Tax Entity IDs across counties).",
                file=sys.stderr,
            )
        levy_header = headers[idx_levy] if idx_levy is not None else None
        entities = _entities_from_dola_table_rows(
            reader, idx_name, idx_entity, idx_lgid, idx_county, idx_levy
        )
        return entities, levy_header


def load_dola_entities_xlsx(xlsx_path: Path) -> tuple[list[dict[str, Any]], str | None]:
    try:
        from openpyxl import load_workbook
    except ImportError:
        print("openpyxl required for DOLA xlsx; skipping DOLA join.", file=sys.stderr)
        return [], None

    wb = load_workbook(xlsx_path, read_only=True, data_only=True)
    try:
        ws = wb.active
        rows = ws.iter_rows(values_only=True)
        try:
            header_row = next(rows)
        except StopIteration:
            return [], None
        headers = [strip_field(str(h) if h is not None else "") for h in header_row]
        parsed = _dola_column_indices(headers)
        if parsed is None:
            print("Could not detect name column in DOLA xlsx; skipping DOLA join.", file=sys.stderr)
            return [], None
        idx_name, idx_entity, idx_lgid, idx_county, idx_levy = parsed
        if idx_county is None:
            print(
                "DOLA xlsx: no Certifying County column; using all rows (may duplicate Tax Entity IDs across counties).",
                file=sys.stderr,
            )
        levy_header = headers[idx_levy] if idx_levy is not None else None
        entities = _entities_from_dola_table_rows(
            rows, idx_name, idx_entity, idx_lgid, idx_county, idx_levy
        )
        return entities, levy_header
    finally:
        wb.close()


def load_dola_entities(path: Path) -> tuple[list[dict[str, Any]], str | None]:
    """
    Load DOLA Tax Entity rows for Arapahoe County only (avoids duplicate TE IDs across
    certifying counties). Attaches levyMills from the export's total levy column when present.
    Accepts .csv (UTF-8) or .xlsx. Returns (entities, levy_column_header_or_none).
    """
    if not path.is_file():
        return [], None
    suf = path.suffix.lower()
    if suf == ".csv":
        return load_dola_entities_csv(path)
    if suf in (".xlsx", ".xlsm"):
        return load_dola_entities_xlsx(path)
    print(f"Unsupported DOLA export format (expected .csv or .xlsx): {path}", file=sys.stderr)
    return [], None


def dola_match_for_mart_line(
    line_code: str,
    authority_upper: str,
    entities: list[dict[str, Any]],
    overrides: dict[str, dict[str, Any]],
    entities_by_te_id: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """ASSRFEES is an assessor fee row, not a taxing district — skip DOLA fuzzy matching."""
    code = strip_field(line_code).upper()
    if code == "ASSRFEES":
        return {
            "method": "skipped",
            "confidence": "high",
            "skipReason": "assessor_fee",
            "taxEntityId": None,
            "lgId": None,
            "matchedLegalName": None,
            "score": None,
        }
    au = strip_field(authority_upper).upper()
    ovr = overrides.get(au)
    dola = match_dola_line(authority_upper, entities, overrides)
    result = attach_levy_mills(dola, authority_upper, entities_by_te_id)
    if ovr is not None and ovr.get("millsOverride") is not None:
        try:
            mv = float(ovr["millsOverride"])
        except (TypeError, ValueError):
            return result
        out = dict(result)
        prev = out.get("mills")
        if isinstance(prev, (int, float)):
            out["dolaMills"] = round(float(prev), 6)
        out["mills"] = round(mv, 6)
        out["millsReason"] = "county_levy_table_override"
        return out
    return result


def _te_id_str(x: Any) -> str:
    if x is None:
        return ""
    return strip_field(str(x))


def _coalesce_lg_id_from_entity(lg_id: Any, tax_entity_id: Any) -> Any:
    """Property tax export sometimes omits lgId; tax entity id is often '{lgId}/1'."""
    lid = strip_field(str(lg_id)) if lg_id is not None else ""
    if lid:
        return lid
    te = _te_id_str(tax_entity_id)
    if "/" in te:
        left = te.split("/", 1)[0].strip()
        if left.isdigit():
            return left
    return None


def match_dola_line(
    authority_upper: str,
    entities: list[dict[str, Any]],
    overrides: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    au = strip_field(authority_upper).upper()
    ovr = overrides.get(au)
    query_base = normalize_for_match(authority_upper)
    if ovr and ovr.get("legalName"):
        query_base = normalize_for_match(str(ovr["legalName"]))

    def ura_extra() -> dict[str, Any]:
        if ovr and ovr.get("ura"):
            return {"uraHint": True}
        return {}

    # Direct Tax Entity ID (after enrich from DOLA export) — exact row match
    if ovr and ovr.get("taxEntityId") and entities:
        want = _te_id_str(ovr.get("taxEntityId"))
        if want:
            for e in entities:
                if _te_id_str(e.get("taxEntityId")) == want:
                    return {
                        "method": "override",
                        "confidence": "high",
                        "taxEntityId": e.get("taxEntityId"),
                        "lgId": _coalesce_lg_id_from_entity(
                            e.get("lgId"), e.get("taxEntityId")
                        ),
                        "matchedLegalName": e.get("legalName"),
                        "score": 1.0,
                        **ura_extra(),
                    }

    if not entities:
        if ovr:
            return {
                "method": "override",
                "confidence": "low",
                "taxEntityId": ovr.get("taxEntityId"),
                "lgId": _coalesce_lg_id_from_entity(
                    ovr.get("lgId"), ovr.get("taxEntityId")
                ),
                "matchedLegalName": ovr.get("legalName"),
                "score": None,
                **ura_extra(),
            }
        return {"method": "none", "confidence": "low", "matchedLegalName": None, "score": None}

    best: dict[str, Any] | None = None
    best_score = -1.0
    for e in entities:
        score = fuzz.token_sort_ratio(query_base, e["norm"]) / 100.0
        if score > best_score:
            best_score = score
            best = e

    assert best is not None
    if best_score >= 0.92:
        conf = "high"
    elif best_score >= 0.78:
        conf = "medium"
    else:
        conf = "low"

    if ovr and ovr.get("legalName") and best_score < 0.78:
        query2 = normalize_for_match(str(ovr["legalName"]))
        for e in entities:
            score = fuzz.token_sort_ratio(query2, e["norm"]) / 100.0
            if score > best_score:
                best_score = score
                best = e
        if best_score >= 0.92:
            conf = "high"
        elif best_score >= 0.78:
            conf = "medium"
        else:
            conf = "low"

    if best_score < 0.70:
        return {
            "method": "none",
            "confidence": "low",
            "taxEntityId": None,
            "lgId": None,
            "matchedLegalName": None,
            "score": round(best_score, 4),
            **ura_extra(),
        }

    method = "fuzzy"
    if ovr:
        method = "override"

    return {
        "method": method,
        "confidence": conf,
        "taxEntityId": best.get("taxEntityId"),
        "lgId": _coalesce_lg_id_from_entity(
            best.get("lgId"), best.get("taxEntityId")
        ),
        "matchedLegalName": best.get("legalName"),
        "score": round(best_score, 4),
        **ura_extra(),
    }


def read_mart_groups(path: Path) -> tuple[dict[str, list[dict[str, Any]]], str]:
    with path.open(newline="", encoding="utf-8", errors="replace") as f:
        r = csv.DictReader(f)
        maps = mart_row_maps(r.fieldnames)
        if not maps.get("tag_id") or not maps.get("line_code") or not maps.get("authority_name"):
            raise SystemExit(f"Unexpected mart CSV headers: {r.fieldnames}")

        by_tag: dict[str, list[dict[str, Any]]] = defaultdict(list)
        tax_year = ""
        for row in r:
            tag = strip_field(row.get(maps["tag_id"], ""))
            if not tag:
                continue
            if not tax_year and maps.get("tax_year"):
                tax_year = strip_field(row.get(maps["tax_year"], ""))
            code = strip_field(row.get(maps["line_code"], ""))
            name = strip_field(row.get(maps["authority_name"], ""))
            eff = (
                strip_field(row.get(maps["effective_year"], ""))
                if maps.get("effective_year")
                else ""
            )
            st = strip_field(row.get(maps["status"], "")) if maps.get("status") else ""
            by_tag[tag].append(
                {
                    "code": code,
                    "authorityName": name,
                    "authorityNameUpper": name.upper(),
                    "effectiveYear": eff,
                    "status": st,
                }
            )
    return by_tag, tax_year or ""


def read_pin_map(path: Path) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    with path.open(newline="", encoding="utf-8", errors="replace") as f:
        r = csv.DictReader(f)
        for row in r:
            pin = normalize_pin(strip_field(row.get("Pin", "")))
            if not pin:
                continue
            tag_id = strip_field(row.get("TAGId", ""))
            short_d = strip_field(row.get("TAGShortDescr", ""))
            if not tag_id:
                continue
            if pin not in out:
                ta = parse_parcel_value_cell(row.get("TotalActual"))
                ts = parse_parcel_value_cell(row.get("TotalAssessed"))
                ty = strip_field(row.get("TaxYear", ""))
                pclass = strip_field(row.get("PropertyClassDescr", ""))
                rec: dict[str, Any] = {
                    "tagId": tag_id,
                    "tagShortDescr": short_d,
                    "totalActual": ta,
                    "totalAssessed": ts,
                    "parcelTaxYear": ty or None,
                    "propertyClassDescr": pclass or None,
                }
                owner_list = strip_field(row.get("OwnerList", ""))
                if owner_list:
                    rec["ownerList"] = owner_list
                ain = strip_field(row.get("AIN", ""))
                if ain:
                    rec["ain"] = ain
                out[pin] = rec
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description="Build Arapahoe parcel levy index JSON.")
    ap.add_argument("--main-parcel", type=Path, default=DEFAULT_MAIN)
    ap.add_argument("--mart-ta-tag", type=Path, default=DEFAULT_MART)
    ap.add_argument(
        "--dola-export",
        "--dola-xlsx",
        type=Path,
        default=None,
        dest="dola_export",
        metavar="PATH",
        help="DOLA LGIS Property Tax Entities export (.csv or .xlsx). "
        "Default: supporting-data/property-tax-entities-export.csv if present, else .xlsx.",
    )
    ap.add_argument("--overrides", type=Path, default=DEFAULT_OVERRIDES)
    ap.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    ap.add_argument("--skip-pin-map", action="store_true", help="Only emit stacks-by-tag-id JSON.")
    args = ap.parse_args()

    if not args.main_parcel.is_file():
        raise SystemExit(f"Missing main parcel CSV: {args.main_parcel}")
    if not args.mart_ta_tag.is_file():
        raise SystemExit(f"Missing mart CSV: {args.mart_ta_tag}")

    overrides = load_overrides(args.overrides)
    dola_path = args.dola_export if args.dola_export is not None else default_dola_export_path()
    entities, levy_col_header = load_dola_entities(dola_path)
    entities_by_te_id = build_entities_by_te_id(entities)
    if entities:
        print(f"DOLA entities loaded: {len(entities)} (Arapahoe certifying county only)", file=sys.stderr)
        if levy_col_header:
            print(f"DOLA levy column: {levy_col_header}", file=sys.stderr)
    else:
        print("No DOLA export or empty parse; emitting matches as method=none.", file=sys.stderr)

    overrides = enrich_overrides_from_entities(overrides, entities)

    by_tag_raw, tax_year = read_mart_groups(args.mart_ta_tag)
    bundled_as_of = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    stacks: dict[str, Any] = {}
    for tag_id, lines in by_tag_raw.items():
        lines_sorted = sorted(lines, key=lambda x: sort_line_code(x["code"]))
        built_lines = []
        for ln in lines_sorted:
            dola = dola_match_for_mart_line(
                ln["code"], ln["authorityNameUpper"], entities, overrides, entities_by_te_id
            )
            built_lines.append(
                {
                    "code": ln["code"],
                    "authorityName": ln["authorityName"],
                    "effectiveYear": ln["effectiveYear"] or None,
                    "status": ln["status"] or None,
                    "dolaMatch": dola,
                }
            )
        stacks[tag_id] = {
            "tagId": tag_id,
            "taxYear": tax_year or None,
            "levyAspxUrl": f"{LEVY_ASPX_BASE}{tag_id}",
            "lines": built_lines,
        }

    snapshot = {
        "bundledAsOf": bundled_as_of,
        "source": "Arapahoe County datamart: Mart_TA_TAG + Main Parcel (Pin → TAGId, AIN, OwnerList, values)",
        "taxYear": tax_year or None,
        "dolaSource": str(dola_path.name) if dola_path.is_file() else None,
        "dolaRowCount": len(entities),
        "dolaCertifyingCounty": "Arapahoe",
        "dolaLevyColumn": levy_col_header,
    }

    args.out_dir.mkdir(parents=True, exist_ok=True)
    sep = (",", ":")
    stacks_path = args.out_dir / "arapahoe-levy-stacks-by-tag-id.json"

    if args.skip_pin_map:
        stacks_path.write_text(
            json.dumps({"snapshot": snapshot, "stacksByTagId": stacks}, separators=sep),
            encoding="utf-8",
        )
        print(f"Wrote {stacks_path} ({len(stacks)} TAG stacks)", file=sys.stderr)
        print("Skipping arapahoe-pin-to-tag.json and arapahoe-situs-to-pins.json (--skip-pin-map).", file=sys.stderr)
        return

    pin_map = read_pin_map(args.main_parcel)
    used_tag_ids = {v["tagId"] for v in pin_map.values()}
    stacks_out = {k: v for k, v in stacks.items() if k in used_tag_ids}
    if len(stacks_out) < len(stacks):
        print(
            f"Filtered stacks: {len(stacks)} -> {len(stacks_out)} (TAGIds on parcels only)",
            file=sys.stderr,
        )
    stacks_path.write_text(
        json.dumps({"snapshot": snapshot, "stacksByTagId": stacks_out}, separators=sep),
        encoding="utf-8",
    )
    print(f"Wrote {stacks_path} ({len(stacks_out)} TAG stacks)", file=sys.stderr)

    pin_path = args.out_dir / "arapahoe-pin-to-tag.json"
    pin_payload = {
        "snapshot": snapshot,
        "pinDigits": 9,
        "byPin": pin_map,
    }
    pin_path.write_text(json.dumps(pin_payload, separators=sep), encoding="utf-8")
    mb = pin_path.stat().st_size / (1024 * 1024)
    print(f"Wrote {pin_path} ({len(pin_map)} pins, {mb:.2f} MiB)", file=sys.stderr)

    situs_map = build_situs_to_pins(args.main_parcel)
    situs_snapshot = {
        "bundledAsOf": bundled_as_of,
        "source": "Arapahoe County datamart: Main Parcel situs fields (Pin, SA*)",
        "taxYear": tax_year or None,
        "lookupNote": (
            "Keys match county address search rules: street number (+ optional range/suffix), "
            "street name without directionals (N,S,E,W,...) or types (St,Ave,...); optional unit."
        ),
    }
    situs_path = args.out_dir / "arapahoe-situs-to-pins.json"
    situs_path.write_text(
        json.dumps(
            {
                "snapshot": situs_snapshot,
                "lookupVersion": 1,
                "entryCount": len(situs_map),
                "byKey": situs_map,
            },
            separators=sep,
        ),
        encoding="utf-8",
    )
    sm = situs_path.stat().st_size / (1024 * 1024)
    print(
        f"Wrote {situs_path} ({len(situs_map)} keys, {sm:.2f} MiB)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
