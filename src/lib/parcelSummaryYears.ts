// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { CountyConfig } from "@/lib/countyConfig";
import type { CountyValuationHistoryPoint } from "@/lib/countyValuationHistoryData";
import { faceValuationHistoryPoint } from "@/lib/propertyTaxEstimate";

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
 * Arapahoe: mart columns on pin-to-tag (dual Assessment year / Tax year).
 * Douglas: when Realware valuation history is loaded, Tax year is the face
 * Realware tax year (coherent with Values / face Property tax) — not the mill
 * PDF title alone. Assessment year uses the hashPath stamp when present.
 * Without history, stamp + levy-stack tax year remain (legacy until history loads).
 */
export function resolveParcelSummaryYears(
  config: CountyConfig,
  opts: {
    pinRowAssessmentYear?: string | null;
    pinRowTaxYear?: string | null;
    levyStacksTaxYear?: string | null;
    valuationHistory?: readonly CountyValuationHistoryPoint[] | null;
    /** Pin total assessed; used to pick the Realware face year when history loads. */
    pinTotalAssessed?: number | null;
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
  const face = faceValuationHistoryPoint(
    opts.valuationHistory,
    opts.pinTotalAssessed,
  );
  const historyFaceTaxYear = face ? String(face.taxYear) : null;

  const assessmentYear =
    pinAssess ?? stampYear ?? historyFaceTaxYear ?? historyLatest;
  // Once Realware history is loaded, face tax year wins over mill-PDF / pin
  // synthesis so Values, Property tax, and Tax year stay one coherent set.
  const taxYear =
    historyFaceTaxYear ?? pinTax ?? stacksTax ?? historyLatest;
  const parcelRecordLinkYear =
    historyFaceTaxYear ?? historyLatest ?? pinAssess ?? stampYear;

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
