// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Lookups for bundled AUTH total mills by tax year.
 * Join key is stack line `code` (AUTH). Never invents a missing year.
 * Arapahoe: Levy % PDFs. Douglas: Tax Districts and Mill Levies PDFs.
 */

import authorityMillsData from "@/data/authorityMillsByTaxYear";
import authorityRateTablePagesData from "@/data/authorityRateTablePages";
import douglasAuthorityMillsData from "@/data/douglasAuthorityMillsByTaxYear";
import douglasAuthorityRateTablePagesData from "@/data/douglasAuthorityRateTablePages";
import {
  resolveAuthorityMillsLookup,
  resolveRegistryEntityMillsLookup,
} from "@/lib/crossCountyAuthorityRegistry";

export type AuthorityMillsByTaxYearFile = {
  _meta: {
    bundledAsOf: string;
    taxYears: number[];
    sources: Array<{
      taxYear: number;
      type: string;
      title: string;
      file: string;
      /** Resident https cite for the mill rate-table PDF (same source as AUTH mills). */
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

type CountyMillsBundle = {
  countyId: string;
  fileName: string;
  mills: AuthorityMillsByTaxYearFile;
  pages: AuthorityRateTablePagesFile;
  urlByTaxYear: Map<number, string>;
  sortedTaxYears: number[];
};

function loadCountyMillsBundle(
  countyId: string,
  millsRaw: unknown,
  pagesRaw: unknown,
): CountyMillsBundle {
  const fileName = `${countyId}-authority-mills-by-tax-year.json`;
  const mills = millsRaw as AuthorityMillsByTaxYearFile;
  const pages = pagesRaw as AuthorityRateTablePagesFile;
  const urlByTaxYear = new Map<number, string>();
  for (const source of mills._meta.sources) {
    const url = source.residentUrl?.trim();
    if (!url || !url.startsWith("https://")) {
      throw new Error(
        `${fileName}: tax year ${source.taxYear} missing https residentUrl`,
      );
    }
    urlByTaxYear.set(source.taxYear, url);
  }
  for (const taxYear of mills._meta.taxYears) {
    if (!urlByTaxYear.has(taxYear)) {
      throw new Error(
        `${fileName}: tax year ${taxYear} missing _meta.sources residentUrl`,
      );
    }
  }
  return {
    countyId,
    fileName,
    mills,
    pages,
    urlByTaxYear,
    sortedTaxYears: [...mills._meta.taxYears].sort((a, b) => a - b),
  };
}

const BUNDLES: Record<string, CountyMillsBundle> = {
  arapahoe: loadCountyMillsBundle(
    "arapahoe",
    authorityMillsData,
    authorityRateTablePagesData,
  ),
  douglas: loadCountyMillsBundle(
    "douglas",
    douglasAuthorityMillsData,
    douglasAuthorityRateTablePagesData,
  ),
};

const ARAPAHOE_BUNDLE = BUNDLES.arapahoe!;

function millsBundleForCounty(
  countyId?: string | null,
): CountyMillsBundle | null {
  const id = countyId?.trim();
  if (!id) return ARAPAHOE_BUNDLE;
  return BUNDLES[id] ?? null;
}

/** True when this county ships `{countyId}-authority-mills-by-tax-year.json`. */
export function countyHasAuthorityMillsBundle(
  countyId: string | null | undefined,
): boolean {
  const id = countyId?.trim();
  return Boolean(id && BUNDLES[id]);
}

/** Resident link label for a county mill rate-table PDF cite. */
export function levyPercentageResidentLinkText(taxYear: number): string {
  return `County rate table for ${taxYear} (PDF)`;
}

/**
 * Official https cite for the county mill rate-table PDF that published AUTH
 * mills for a tax year. Same bundle as {@link authorityMillsSeries}.
 * Omit `countyId` for the Arapahoe Levy % bundle (existing callers).
 */
export function levyPercentageResidentUrlForTaxYear(
  taxYear: number,
  countyId?: string | null,
): string {
  const bundle = millsBundleForCounty(countyId);
  if (!bundle) {
    throw new Error(
      `No AUTH mills bundle for county ${countyId?.trim() ?? "(none)"}`,
    );
  }
  const url = bundle.urlByTaxYear.get(taxYear);
  if (!url) {
    throw new Error(
      `No resident mill rate-table PDF url bundled for tax year ${taxYear} (${bundle.fileName})`,
    );
  }
  return url;
}

export type AuthorityMillsResidentSource = {
  taxYear: number;
  title: string;
  url: string;
};

/**
 * Bundled mill rate-table PDFs for one county (same cites as the chart and
 * authority-chain What changed?). Empty when that county has no mills bundle.
 */
export function authorityMillsResidentSources(
  countyId?: string | null,
): AuthorityMillsResidentSource[] {
  const bundle = millsBundleForCounty(countyId);
  if (!bundle) return [];
  return [...bundle.mills._meta.sources]
    .sort((a, b) => a.taxYear - b.taxYear)
    .map((source) => ({
      taxYear: source.taxYear,
      title: source.title,
      url: source.residentUrl.trim(),
    }));
}

/**
 * County parcel `tagShortDescr` uses the rate-table PDF tax-area code without
 * guaranteed leading zeros (e.g. `747` -> `0747`). Levy.aspx `tagId` is unrelated.
 */
export function normalizeLevyPercentagePdfTag(
  taxAreaShortCode: string | null | undefined,
): string | null {
  const raw = taxAreaShortCode?.trim();
  if (!raw || !/^\d{1,4}$/.test(raw)) return null;
  return raw.padStart(4, "0");
}

function pageForParcelInBundle(
  bundle: CountyMillsBundle,
  taxYear: number,
  authorityCode: string | null | undefined,
  taxAreaShortCode: string | null | undefined,
): number | null {
  const authority = authorityCode?.trim();
  const pdfTag = normalizeLevyPercentagePdfTag(taxAreaShortCode);
  if (!authority || !pdfTag) return null;
  const page =
    bundle.pages.pagesByAuthority[authority]?.[String(taxYear)]?.[pdfTag];
  return Number.isInteger(page) && page > 0 ? page : null;
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
  countyId?: string | null,
): number | null {
  const bundle = millsBundleForCounty(countyId);
  if (!bundle) return null;
  return pageForParcelInBundle(
    bundle,
    taxYear,
    authorityCode,
    taxAreaShortCode,
  );
}

/**
 * Add a parcel-specific page fragment only when `rawUrl` is one of the bundled
 * county mill rate-table PDFs and that year's TAG + AUTH page is known.
 * Otherwise leave the URL unchanged (viewer opens at page 1; never invent a page).
 */
export function deepLinkLevyPercentageUrlForParcel(
  rawUrl: string,
  authorityCode: string | null | undefined,
  taxAreaShortCode: string | null | undefined,
): string {
  const withoutHash = rawUrl.split("#", 1)[0] ?? rawUrl;
  for (const bundle of Object.values(BUNDLES)) {
    for (const [taxYear, residentUrl] of bundle.urlByTaxYear) {
      if (withoutHash !== residentUrl) continue;
      const page = pageForParcelInBundle(
        bundle,
        taxYear,
        authorityCode,
        taxAreaShortCode,
      );
      return page ? `${withoutHash}#page=${page}` : rawUrl;
    }
  }
  return rawUrl;
}

export function levyPercentageResidentLinkForTaxYear(
  taxYear: number,
  countyId?: string | null,
): {
  text: string;
  url: string;
} {
  return {
    text: levyPercentageResidentLinkText(taxYear),
    url: levyPercentageResidentUrlForTaxYear(taxYear, countyId),
  };
}

const arapahoeSortedTaxYears = ARAPAHOE_BUNDLE.sortedTaxYears;

/** Latest tax year in the Arapahoe AUTH history (Levy % label). */
export const AUTHORITY_MILLS_CURRENT_TAX_YEAR =
  arapahoeSortedTaxYears[arapahoeSortedTaxYears.length - 1] ?? 2025;

/** Prior tax year in the Arapahoe AUTH history (one year back for Phase 0). */
export const AUTHORITY_MILLS_PREVIOUS_TAX_YEAR =
  arapahoeSortedTaxYears.length >= 2
    ? arapahoeSortedTaxYears[arapahoeSortedTaxYears.length - 2]!
    : AUTHORITY_MILLS_CURRENT_TAX_YEAR - 1;

/** Minimum published years before showing the modal mill-rate history chart. */
export const AUTHORITY_MILLS_HISTORY_MIN_POINTS = 3;

/**
 * Max |stack mills − reference current-year mills| before omitting registry
 * entity YoY (resident county has no mills bundle).
 */
export const AUTHORITY_MILLS_STACK_RECONCILE_EPS = 0.011;

export type AuthorityMillsYoYOptions = {
  /** Resident stack mills on the levy line (required for registry entity YoY). */
  residentStackMills?: number | null;
};

export type AuthorityMillsSeriesPoint = {
  taxYear: number;
  mills: number;
};

function yoyYearPair(
  bundle: CountyMillsBundle,
): { current: number; previous: number } | null {
  if (bundle.sortedTaxYears.length < 2) return null;
  return {
    current: bundle.sortedTaxYears[bundle.sortedTaxYears.length - 1]!,
    previous: bundle.sortedTaxYears[bundle.sortedTaxYears.length - 2]!,
  };
}

function readBundledMillsForYear(
  bundle: CountyMillsBundle,
  authorityCode: string,
  taxYear: number,
): number | null {
  const mills =
    bundle.mills.authorities[authorityCode]?.millsByTaxYear[String(taxYear)];
  return typeof mills === "number" && Number.isFinite(mills) ? mills : null;
}

/**
 * Published AUTH mills for one stack line code, ascending by tax year.
 * Omits years with no data (never invents).
 *
 * @param countyId Resident county when known; used for cross-county registry
 *   resolution and mills-bundle selection.
 */
export function authorityMillsSeries(
  code: string | null | undefined,
  countyId?: string | null,
): AuthorityMillsSeriesPoint[] {
  const target = resolveAuthorityMillsLookup(code, countyId);
  if (!target) return [];
  const bundle = millsBundleForCounty(target.bundleCountyId);
  if (!bundle) return [];
  const key = normalizeAuthorityCode(target.authorityCode);
  if (!key) return [];
  const byYear = bundle.mills.authorities[key]?.millsByTaxYear;
  if (!byYear) return [];
  const points: AuthorityMillsSeriesPoint[] = [];
  for (const taxYear of bundle.sortedTaxYears) {
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
  countyId?: string | null,
): number | null {
  const target = resolveAuthorityMillsLookup(code, countyId);
  if (!target) return null;
  const bundle = millsBundleForCounty(target.bundleCountyId);
  if (!bundle) return null;
  const key = normalizeAuthorityCode(target.authorityCode);
  if (!key) return null;
  return readBundledMillsForYear(bundle, key, taxYear);
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
 *
 * When the resident county has no mills-history bundle but the line is
 * registry-linked, current mills come from the resident stack and prior mills
 * from the reference-county entity series — only when stack and reference
 * current year agree within {@link AUTHORITY_MILLS_STACK_RECONCILE_EPS}.
 */
export function authorityTotalMillsYoY(
  code: string | null | undefined,
  countyId?: string | null,
  options?: AuthorityMillsYoYOptions,
): AuthorityTotalMillsYoY | null {
  const residentTarget = resolveAuthorityMillsLookup(code, countyId);
  const residentBundle = residentTarget
    ? millsBundleForCounty(residentTarget.bundleCountyId)
    : null;
  if (residentTarget && residentBundle) {
    const key = normalizeAuthorityCode(residentTarget.authorityCode);
    if (!key) return null;
    const years = yoyYearPair(residentBundle);
    if (!years) return null;
    const millsCurrent = readBundledMillsForYear(
      residentBundle,
      key,
      years.current,
    );
    const millsPrevious = readBundledMillsForYear(
      residentBundle,
      key,
      years.previous,
    );
    if (millsCurrent == null || millsPrevious == null) return null;
    return {
      authorityCode: key,
      taxYearCurrent: years.current,
      taxYearPrevious: years.previous,
      millsCurrent,
      millsPrevious,
      millsDelta: millsCurrent - millsPrevious,
    };
  }

  const entityTarget = resolveRegistryEntityMillsLookup(code, countyId);
  if (!entityTarget) return null;
  const referenceBundle = millsBundleForCounty(entityTarget.bundleCountyId);
  if (!referenceBundle) return null;

  const key = normalizeAuthorityCode(entityTarget.authorityCode);
  if (!key) return null;

  const stackMills = options?.residentStackMills;
  if (stackMills == null || !Number.isFinite(stackMills)) {
    return null;
  }

  const years = yoyYearPair(referenceBundle);
  if (!years) return null;
  const referenceCurrent = readBundledMillsForYear(
    referenceBundle,
    key,
    years.current,
  );
  const millsPrevious = readBundledMillsForYear(
    referenceBundle,
    key,
    years.previous,
  );
  if (referenceCurrent == null || millsPrevious == null) {
    return null;
  }
  if (
    Math.abs(stackMills - referenceCurrent) > AUTHORITY_MILLS_STACK_RECONCILE_EPS
  ) {
    return null;
  }

  const millsDelta = stackMills - millsPrevious;
  return {
    authorityCode: key,
    taxYearCurrent: years.current,
    taxYearPrevious: years.previous,
    millsCurrent: stackMills,
    millsPrevious,
    millsDelta,
  };
}

/** True when both years exist and mills differ beyond epsilon. */
export function authorityTotalMillsChanged(
  code: string | null | undefined,
  epsMills: number,
  countyId?: string | null,
  options?: AuthorityMillsYoYOptions,
): boolean {
  const yoy = authorityTotalMillsYoY(code, countyId, options);
  if (!yoy) return false;
  return Math.abs(yoy.millsDelta) > epsMills;
}
