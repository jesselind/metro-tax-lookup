// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Lookups for bundled AUTH total mills by tax year (Levy % PDFs).
 * Join key is stack line `code` (AUTH). Never invents a missing year.
 */

import authorityMillsData from "@/data/authorityMillsByTaxYear";

export type AuthorityMillsByTaxYearFile = {
  _meta: {
    bundledAsOf: string;
    taxYears: number[];
    sources: Array<{
      taxYear: number;
      type: string;
      title: string;
      file: string;
    }>;
  };
  authorities: Record<
    string,
    {
      name?: string | null;
      millsByTaxYear: Record<string, number>;
    }
  >;
};

const file = authorityMillsData as AuthorityMillsByTaxYearFile;

const sortedTaxYears = [...file._meta.taxYears].sort((a, b) => a - b);

/** Latest tax year in the bundled AUTH history (county Levy % label). */
export const AUTHORITY_MILLS_CURRENT_TAX_YEAR =
  sortedTaxYears[sortedTaxYears.length - 1] ?? 2025;

/** Prior tax year in the bundled AUTH history (one year back for Phase 0). */
export const AUTHORITY_MILLS_PREVIOUS_TAX_YEAR =
  sortedTaxYears.length >= 2
    ? sortedTaxYears[sortedTaxYears.length - 2]!
    : AUTHORITY_MILLS_CURRENT_TAX_YEAR - 1;

/** Minimum published years before showing the modal mill-rate history chart. */
export const AUTHORITY_MILLS_HISTORY_MIN_POINTS = 3;

export type AuthorityMillsSeriesPoint = {
  taxYear: number;
  mills: number;
};

/**
 * Published AUTH mills for one stack line code, ascending by tax year.
 * Omits years with no data (never invents).
 */
export function authorityMillsSeries(
  code: string | null | undefined,
): AuthorityMillsSeriesPoint[] {
  const key = normalizeAuthorityCode(code);
  if (!key) return [];
  const byYear = file.authorities[key]?.millsByTaxYear;
  if (!byYear) return [];
  const points: AuthorityMillsSeriesPoint[] = [];
  for (const taxYear of sortedTaxYears) {
    const mills = byYear[String(taxYear)];
    if (typeof mills === "number" && Number.isFinite(mills)) {
      points.push({ taxYear, mills });
    }
  }
  return points;
}

/** Normalize stack line `code` for AUTH lookup. */
export function normalizeAuthorityCode(
  code: string | null | undefined,
): string | null {
  const t = (code ?? "").trim();
  return t ? t : null;
}

/**
 * AUTH total mills for one tax year, or null when the code/year is absent.
 * Does not invent priors.
 */
export function authorityMillsForTaxYear(
  code: string | null | undefined,
  taxYear: number,
): number | null {
  const key = normalizeAuthorityCode(code);
  if (!key) return null;
  const mills = file.authorities[key]?.millsByTaxYear[String(taxYear)];
  return typeof mills === "number" && Number.isFinite(mills) ? mills : null;
}

export type AuthorityTotalMillsYoY = {
  authorityCode: string;
  taxYearCurrent: number;
  taxYearPrevious: number;
  millsCurrent: number;
  millsPrevious: number;
  millsDelta: number;
};

/**
 * AUTH total mills for current vs prior tax year when both are published.
 * Null when either year is missing (never invent).
 */
export function authorityTotalMillsYoY(
  code: string | null | undefined,
): AuthorityTotalMillsYoY | null {
  const key = normalizeAuthorityCode(code);
  if (!key) return null;
  const millsCurrent = authorityMillsForTaxYear(
    key,
    AUTHORITY_MILLS_CURRENT_TAX_YEAR,
  );
  const millsPrevious = authorityMillsForTaxYear(
    key,
    AUTHORITY_MILLS_PREVIOUS_TAX_YEAR,
  );
  if (millsCurrent == null || millsPrevious == null) return null;
  return {
    authorityCode: key,
    taxYearCurrent: AUTHORITY_MILLS_CURRENT_TAX_YEAR,
    taxYearPrevious: AUTHORITY_MILLS_PREVIOUS_TAX_YEAR,
    millsCurrent,
    millsPrevious,
    millsDelta: millsCurrent - millsPrevious,
  };
}

/** True when both years exist and mills differ beyond epsilon. */
export function authorityTotalMillsChanged(
  code: string | null | undefined,
  epsMills: number,
): boolean {
  const yoy = authorityTotalMillsYoY(code);
  if (!yoy) return false;
  return Math.abs(yoy.millsDelta) > epsMills;
}
