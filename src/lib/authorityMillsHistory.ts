// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Lookups for bundled AUTH total mills by tax year (Levy % PDFs).
 * Join key is stack line `code` (AUTH). Never invents a missing year.
 */

import authorityMillsData from "@/data/authorityMillsByTaxYear";
import authorityRateTablePagesData from "@/data/authorityRateTablePages";

export type AuthorityMillsByTaxYearFile = {
  _meta: {
    bundledAsOf: string;
    taxYears: number[];
    sources: Array<{
      taxYear: number;
      type: string;
      title: string;
      file: string;
      /** Resident https cite for the Levy % PDF (same source as AUTH mills). */
      residentUrl: string;
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

type AuthorityRateTablePagesFile = {
  _meta: {
    bundledAsOf: string;
    taxYears: number[];
    authorityCodes: string[];
  };
  pagesByAuthority: Record<
    string,
    Record<string, Record<string, number>>
  >;
};

const file = authorityMillsData as AuthorityMillsByTaxYearFile;
const pageFile = authorityRateTablePagesData as AuthorityRateTablePagesFile;

const levyPercentageResidentUrlByTaxYear = new Map<number, string>();
for (const source of file._meta.sources) {
  const url = source.residentUrl?.trim();
  if (!url || !url.startsWith("https://")) {
    throw new Error(
      `arapahoe-authority-mills-by-tax-year.json: tax year ${source.taxYear} missing https residentUrl`,
    );
  }
  levyPercentageResidentUrlByTaxYear.set(source.taxYear, url);
}
for (const taxYear of file._meta.taxYears) {
  if (!levyPercentageResidentUrlByTaxYear.has(taxYear)) {
    throw new Error(
      `arapahoe-authority-mills-by-tax-year.json: tax year ${taxYear} missing _meta.sources residentUrl`,
    );
  }
}

/** Resident link label for a county Levy % PDF cite (year-specific text). */
export function levyPercentageResidentLinkText(taxYear: number): string {
  return `County rate table for ${taxYear} (PDF)`;
}

/**
 * Official https cite for the county Levy % PDF that published AUTH mills for a
 * tax year. Same bundle as {@link authorityMillsSeries} (not a second map).
 */
export function levyPercentageResidentUrlForTaxYear(taxYear: number): string {
  const url = levyPercentageResidentUrlByTaxYear.get(taxYear);
  if (!url) {
    throw new Error(
      `No resident Levy % PDF url bundled for tax year ${taxYear}`,
    );
  }
  return url;
}

/**
 * County parcel `tagShortDescr` uses the Levy % PDF TAG code without guaranteed
 * leading zeros (e.g. `747` -> PDF TAG `0747`). Levy.aspx `tagId` is unrelated.
 */
export function normalizeLevyPercentagePdfTag(
  taxAreaShortCode: string | null | undefined,
): string | null {
  const raw = taxAreaShortCode?.trim();
  if (!raw || !/^\d{1,4}$/.test(raw)) return null;
  return raw.padStart(4, "0");
}

/**
 * Exact PDF viewer page for one tax year + AUTH + parcel tax area.
 *
 * TAG groups may cross page boundaries, so TAG alone is insufficient. Missing
 * historical combinations return null and callers keep the year PDF fallback.
 */
export function authorityRateTablePageForParcel(
  taxYear: number,
  authorityCode: string | null | undefined,
  taxAreaShortCode: string | null | undefined,
): number | null {
  const authority = authorityCode?.trim();
  const pdfTag = normalizeLevyPercentagePdfTag(taxAreaShortCode);
  if (!authority || !pdfTag) return null;
  const page =
    pageFile.pagesByAuthority[authority]?.[String(taxYear)]?.[pdfTag];
  return Number.isInteger(page) && page > 0 ? page : null;
}

/**
 * Add a parcel-specific page fragment only when `rawUrl` is one of the bundled
 * county Levy % PDFs and that year's TAG + AUTH page is known. Otherwise leave
 * the URL unchanged (no fragment → viewer opens at page 1; never invent a page).
 */
export function deepLinkLevyPercentageUrlForParcel(
  rawUrl: string,
  authorityCode: string | null | undefined,
  taxAreaShortCode: string | null | undefined,
): string {
  const withoutHash = rawUrl.split("#", 1)[0] ?? rawUrl;
  for (const [taxYear, residentUrl] of levyPercentageResidentUrlByTaxYear) {
    if (withoutHash !== residentUrl) continue;
    const page = authorityRateTablePageForParcel(
      taxYear,
      authorityCode,
      taxAreaShortCode,
    );
    return page ? `${withoutHash}#page=${page}` : rawUrl;
  }
  return rawUrl;
}

export function levyPercentageResidentLinkForTaxYear(taxYear: number): {
  text: string;
  url: string;
} {
  return {
    text: levyPercentageResidentLinkText(taxYear),
    url: levyPercentageResidentUrlForTaxYear(taxYear),
  };
}

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
