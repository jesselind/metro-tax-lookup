// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Face Property tax estimate modes.
 *
 * Source of truth is county-produced figures when available. Do not invent
 * Colorado DPT / legislative-adjustment dollars for the face tile.
 * Fail closed (null) when the configured mode lacks usable fields.
 */

import {
  annualTaxDollarsFromAssessedMills,
  parcelAssessedForDollarEstimate,
} from "@/lib/annualTaxFromAssessedMills";
import type { CountyConfig } from "@/lib/countyConfig";
import type { CountyValuationHistoryPoint } from "@/lib/countyValuationHistoryData";

/** How the locked-report Property tax tile gets its dollar. */
export type PropertyTaxEstimateMode = CountyConfig["propertyTaxEstimateMode"];

/**
 * Realware face tax for one history point: taxDollars + alternateTaxDollars.
 * Returns null when taxDollars is missing (fail closed — do not fall back to mills).
 */
export function realwareTaxDollarsTotal(
  point: Pick<
    CountyValuationHistoryPoint,
    "taxDollars" | "alternateTaxDollars"
  >,
): number | null {
  const local = point.taxDollars;
  if (typeof local !== "number" || !Number.isFinite(local)) return null;
  const school = point.alternateTaxDollars;
  const schoolPart =
    typeof school === "number" && Number.isFinite(school) ? school : 0;
  return Math.round(local + schoolPart);
}

/**
 * Face valuation-history row for Douglas: prefer the year whose local assessed
 * matches the pin Values total; otherwise the latest tax year in the series.
 */
export function faceValuationHistoryPoint(
  series: readonly CountyValuationHistoryPoint[] | null | undefined,
  pinAssessed: number | null | undefined,
): CountyValuationHistoryPoint | null {
  if (!series?.length) return null;
  const sorted = [...series].sort((a, b) => a.taxYear - b.taxYear);
  const pin = parcelAssessedForDollarEstimate(pinAssessed);
  if (pin != null) {
    const pinRounded = Math.round(pin);
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      const point = sorted[i]!;
      if (point.assessedValue === pinRounded) return point;
    }
  }
  return sorted[sorted.length - 1] ?? null;
}

export function estimatedAnnualPropertyTaxDollars(opts: {
  mode: PropertyTaxEstimateMode;
  totalAssessed: number | null | undefined;
  sumMills: number;
  valuationHistory?: readonly CountyValuationHistoryPoint[] | null;
  /** When true, levy mills are not ready — omit mills-based estimates. */
  levyAwaitingTemplateMills?: boolean;
}): number | null {
  const { mode } = opts;
  if (mode === "omit") return null;

  if (mode === "realwareTaxDollars") {
    const face = faceValuationHistoryPoint(
      opts.valuationHistory,
      opts.totalAssessed,
    );
    if (!face) return null;
    return realwareTaxDollarsTotal(face);
  }

  if (opts.levyAwaitingTemplateMills) return null;
  const assessed = parcelAssessedForDollarEstimate(opts.totalAssessed);
  if (assessed == null || opts.sumMills <= 0) return null;
  return annualTaxDollarsFromAssessedMills(assessed, opts.sumMills);
}

export function propertyTaxEstimateModeForCounty(
  config: Pick<CountyConfig, "propertyTaxEstimateMode">,
): PropertyTaxEstimateMode {
  return config.propertyTaxEstimateMode;
}
