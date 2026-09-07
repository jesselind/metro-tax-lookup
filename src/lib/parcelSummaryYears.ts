// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { CountyConfig } from "@/lib/countyConfig";
import type { CountyValuationHistoryPoint } from "@/lib/countyValuationHistoryData";

export type ParcelSummaryYears = {
  assessmentYear: string | null;
  taxYear: string | null;
  parcelRecordLinkYear: string | null;
};

function trimYear(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  return t || null;
}

function hashPathParcelRecordStampYear(config: CountyConfig): string | null {
  const template = config.urls.parcelRecord;
  if (template.style !== "hashPath") return null;
  return trimYear(template.year);
}

function latestValuationHistoryTaxYear(
  history: readonly CountyValuationHistoryPoint[] | null | undefined,
): string | null {
  if (!history?.length) return null;
  let latest = history[0]!.taxYear;
  for (const row of history) {
    if (row.taxYear > latest) latest = row.taxYear;
  }
  return String(latest);
}

/**
 * Summary-tile and county property-page years from file-backed sources only.
 * Arapahoe: mart columns on pin-to-tag. Douglas bulk lacks those columns — use
 * hashPath maintainer stamp (SPA path year), levy-stack snapshot tax year, and
 * Realware valuation history when loaded.
 */
export function resolveParcelSummaryYears(
  config: CountyConfig,
  opts: {
    pinRowAssessmentYear?: string | null;
    pinRowTaxYear?: string | null;
    levyStacksTaxYear?: string | null;
    valuationHistory?: readonly CountyValuationHistoryPoint[] | null;
  },
): ParcelSummaryYears {
  const pinAssess = trimYear(opts.pinRowAssessmentYear);
  const pinTax = trimYear(opts.pinRowTaxYear);

  if (config.id !== "douglas") {
    return {
      assessmentYear: pinAssess,
      taxYear: pinTax,
      parcelRecordLinkYear: pinAssess ?? pinTax,
    };
  }

  const stampYear = hashPathParcelRecordStampYear(config);
  const historyLatest = latestValuationHistoryTaxYear(opts.valuationHistory);
  const stacksTax = trimYear(opts.levyStacksTaxYear);

  const assessmentYear = pinAssess ?? stampYear ?? historyLatest;
  const taxYear = pinTax ?? stacksTax;
  const parcelRecordLinkYear = historyLatest ?? pinAssess ?? stampYear;

  return { assessmentYear, taxYear, parcelRecordLinkYear };
}

export function parseSummaryYearNumber(
  year: string | null | undefined,
): number | null {
  const raw = trimYear(year);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
