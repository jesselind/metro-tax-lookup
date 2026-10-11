#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""County-published mill rates for levy stack lines (AUTH + PDF TAG).

Stack line list comes from the county mart; mills on the resident-facing stack
must match the county Levy % tables (`{countyId}-authority-mills-by-tax-year.json`),
not fuzzy DOLA name match alone.

PDF TAG is parcel ``tagShortDescr`` zero-padded to four digits. Levy.aspx ``tagId``
is unrelated.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

MILL_EPS = 0.0005
ASSRFEES_CODE = "ASSRFEES"


def strip_field(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def pdf_tag_from_short_descr(tag_short_descr: str) -> str:
    t = strip_field(tag_short_descr)
    if not t:
        return ""
    return t.zfill(4)


def build_tag_id_to_pdf_tag(
    account_rows: list[dict[str, Any]],
) -> dict[str, str]:
    """Map Levy.aspx tagId → zero-padded PDF TAG from account rows."""
    out: dict[str, str] = {}
    for row in account_rows:
        tag_id = strip_field(row.get("taxAreaId", ""))
        short_descr = strip_field(row.get("tagShortDescr", ""))
        if not tag_id or not short_descr:
            continue
        pdf_tag = pdf_tag_from_short_descr(short_descr)
        prev = out.get(tag_id)
        if prev is not None and prev != pdf_tag:
            raise ValueError(
                f"tagId {tag_id} maps to multiple PDF TAGs: {prev!r} vs {pdf_tag!r}"
            )
        out[tag_id] = pdf_tag
    return out


def build_tag_id_to_pdf_tag_from_pin_map(
    pin_to_tag_doc: dict[str, Any],
) -> dict[str, str]:
    out: dict[str, str] = {}
    by_pin = pin_to_tag_doc.get("byPin") or {}
    for row in by_pin.values():
        tag_id = strip_field(row.get("tagId", ""))
        short_descr = strip_field(row.get("tagShortDescr", ""))
        if not tag_id or not short_descr:
            continue
        pdf_tag = pdf_tag_from_short_descr(short_descr)
        prev = out.get(tag_id)
        if prev is not None and prev != pdf_tag:
            raise ValueError(
                f"tagId {tag_id} maps to multiple PDF TAGs: {prev!r} vs {pdf_tag!r}"
            )
        out[tag_id] = pdf_tag
    return out


@dataclass(frozen=True)
class CountyLevyMillsBundle:
    tax_years: tuple[str, ...]
    authorities: dict[str, Any]
    exceptions_by_tax_year: dict[str, dict[str, Any]]

    @classmethod
    def load(cls, path: Path) -> CountyLevyMillsBundle:
        data = json.loads(path.read_text(encoding="utf-8"))
        meta = data.get("_meta") or {}
        years_raw = meta.get("taxYears") or []
        tax_years = tuple(str(y) for y in years_raw)
        exceptions = data.get("exceptionsByTaxYear") or {}
        exceptions_norm = {str(k): v for k, v in exceptions.items()}
        authorities = data.get("authorities") or {}
        return cls(
            tax_years=tax_years,
            authorities=authorities,
            exceptions_by_tax_year=exceptions_norm,
        )

    def mills_for_line(
        self,
        auth_code: str,
        pdf_tag: str,
        tax_year: str,
    ) -> float | None:
        code = strip_field(auth_code)
        if not code or code.upper() == ASSRFEES_CODE:
            return None
        ty = strip_field(tax_year)
        tag = strip_field(pdf_tag)
        if not ty or not tag:
            return None

        exc_year = self.exceptions_by_tax_year.get(ty) or {}
        exc = exc_year.get(code)
        if exc:
            by_tag = exc.get("byPdfTag") or {}
            if tag in by_tag:
                return float(by_tag[tag])
            default = exc.get("defaultMills")
            if default is not None:
                return float(default)

        entry = self.authorities.get(code)
        if not entry:
            return None
        mills_by_year = entry.get("millsByTaxYear") or {}
        raw = mills_by_year.get(ty)
        if raw is None:
            return None
        return float(raw)


def stack_line_shipped_mills(line: dict[str, Any]) -> float | None:
    dm = line.get("dolaMatch") or {}
    if dm.get("method") == "skipped":
        return None
    m = dm.get("mills")
    if m is None:
        return None
    return float(m)


def apply_county_published_mills_to_dola_match(
    dola_match: dict[str, Any],
    *,
    auth_code: str,
    authority_upper: str,
    pdf_tag: str,
    tax_year: str,
    bundle: CountyLevyMillsBundle,
    overrides: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Set stack mills from county tables; curated millsOverride wins last."""
    code = strip_field(auth_code)
    if code.upper() == ASSRFEES_CODE:
        return dola_match

    out = dict(dola_match)
    ovr = (overrides or {}).get(strip_field(authority_upper).upper()) or {}

    county_m = bundle.mills_for_line(code, pdf_tag, tax_year)
    if county_m is not None and ovr.get("millsOverride") is None:
        prev = out.get("mills")
        out["mills"] = round(county_m, 6)
        if isinstance(prev, (int, float)) and abs(float(prev) - county_m) > 1e-9:
            if out.get("millsReason") != "county_levy_table_override":
                out["dolaMills"] = round(float(prev), 6)
        if not out.get("millsReason") or out.get("millsReason") == "bond_purpose_mismatch":
            out["millsReason"] = "county_published_levy_table"

    if ovr.get("millsOverride") is not None:
        try:
            mv = float(ovr["millsOverride"])
        except (TypeError, ValueError):
            return out
        prev = out.get("mills")
        out["mills"] = round(mv, 6)
        if isinstance(prev, (int, float)):
            out["dolaMills"] = round(float(prev), 6)
        out["millsReason"] = "county_levy_table_override"

    return out


@dataclass(frozen=True)
class CountyMillsParityViolation:
    tag_id: str
    pdf_tag: str
    auth_code: str
    authority_name: str
    kind: str
    expected_mills: float | None
    actual_mills: float | None
    dola_method: str | None
    dola_score: float | None

    def format_line(self) -> str:
        exp = (
            "—"
            if self.expected_mills is None
            else f"{self.expected_mills:.3f}"
        )
        act = (
            "—"
            if self.actual_mills is None
            else f"{self.actual_mills:.3f}"
        )
        return (
            f"tagId={self.tag_id} pdfTag={self.pdf_tag} "
            f"AUTH={self.auth_code} {self.authority_name!r}: "
            f"{self.kind} expected={exp} actual={act} "
            f"dola={self.dola_method} score={self.dola_score}"
        )


def assert_levy_stack_county_mills_parity(
    stacks_doc: dict[str, Any],
    tag_id_to_pdf_tag: dict[str, str],
    bundle: CountyLevyMillsBundle,
    *,
    tax_year: str | None = None,
) -> list[CountyMillsParityViolation]:
    """
    Compare every stack line to county-published mills when a rate exists.

    Lines with no county AUTH row are skipped (extract gap; not a stack/DOLA miss).
    """
    ty = strip_field(tax_year) or strip_field(
        (stacks_doc.get("snapshot") or {}).get("taxYear", "")
    )
    violations: list[CountyMillsParityViolation] = []
    stacks = stacks_doc.get("stacksByTagId") or {}

    for tag_id, stack in stacks.items():
        pdf_tag = tag_id_to_pdf_tag.get(tag_id)
        if not pdf_tag:
            violations.append(
                CountyMillsParityViolation(
                    tag_id=tag_id,
                    pdf_tag="",
                    auth_code="",
                    authority_name="(stack)",
                    kind="missing_pdf_tag",
                    expected_mills=None,
                    actual_mills=None,
                    dola_method=None,
                    dola_score=None,
                )
            )
            continue

        for line in stack.get("lines") or []:
            code = strip_field(line.get("code", ""))
            if code.upper() == ASSRFEES_CODE:
                continue
            expected = bundle.mills_for_line(code, pdf_tag, ty)
            if expected is None:
                continue
            actual = stack_line_shipped_mills(line)
            actual_cmp = actual if actual is not None else 0.0
            dm = line.get("dolaMatch") or {}
            if actual is None:
                kind = "shipped_null_mills"
            elif abs(actual_cmp - expected) > MILL_EPS:
                kind = "mills_mismatch"
            else:
                continue
            violations.append(
                CountyMillsParityViolation(
                    tag_id=tag_id,
                    pdf_tag=pdf_tag,
                    auth_code=code,
                    authority_name=str(line.get("authorityName") or ""),
                    kind=kind,
                    expected_mills=expected,
                    actual_mills=actual,
                    dola_method=dm.get("method"),
                    dola_score=dm.get("score"),
                )
            )
    return violations


def apply_county_mills_to_stacks_document(
    stacks_doc: dict[str, Any],
    tag_id_to_pdf_tag: dict[str, str],
    bundle: CountyLevyMillsBundle,
    *,
    tax_year: str | None = None,
    overrides: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Return a new stacks document with county mills merged into each line."""
    ty = strip_field(tax_year) or strip_field(
        (stacks_doc.get("snapshot") or {}).get("taxYear", "")
    )
    out = json.loads(json.dumps(stacks_doc))
    stacks = out.get("stacksByTagId") or {}
    for tag_id, stack in stacks.items():
        pdf_tag = tag_id_to_pdf_tag.get(tag_id, "")
        lines_out = []
        for line in stack.get("lines") or []:
            code = strip_field(line.get("code", ""))
            authority = strip_field(line.get("authorityName", ""))
            dm = line.get("dolaMatch") or {"method": "none", "confidence": "low"}
            dm_new = apply_county_published_mills_to_dola_match(
                dm,
                auth_code=code,
                authority_upper=authority.upper(),
                pdf_tag=pdf_tag,
                tax_year=ty,
                bundle=bundle,
                overrides=overrides,
            )
            lines_out.append({**line, "dolaMatch": dm_new})
        stack["lines"] = lines_out
    return out
