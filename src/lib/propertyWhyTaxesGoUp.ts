// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Property-report Summary: multi-year Property value (appraised) + Mill levy
 * total faces for the two-lever bar. Pure helpers — no React.
 */

import { authorityMillsSeries } from "@/lib/authorityMillsHistory";
import type { CountyValuationHistoryPoint } from "@/lib/countyValuationHistoryData";
import { formatCountyLevyMillsDisplay } from "@/lib/formatCountyLevyMills";
import { formatUsdWhole } from "@/lib/formatUsd";

export type WhyTaxesGoUpChangeFace = {
  sinceYear: number;
  startValue: number;
  endValue: number;
  delta: number;
  direction: "higher" | "lower" | "unchanged";
};

export type WhyTaxesGoUpYearPoint = {
  taxYear: number;
  value: number;
};

export type PropertyValueLeverState =
  | { kind: "change"; face: WhyTaxesGoUpChangeFace }
  /** Arapahoe (priorYearValuesGap): county does not publish prior-year values. */
  | { kind: "county_gap" }
  /** Douglas oddity: history usually exists; this parcel lacks a multi-year series. */
  | { kind: "property_missing" }
  /**
   * Valuation history still loading (Douglas shards). Use home teaching subtext
   * on that half so we do not flash "Not available for this property".
   */
  | { kind: "teaching" };

export type PropertyWhyTaxesGoUpModel =
  | { mode: "generic" }
  | {
      mode: "property";
      propertyValue: PropertyValueLeverState;
      millLevy: WhyTaxesGoUpChangeFace;
    };

function changeFaceFromEndpoints(
  start: WhyTaxesGoUpYearPoint,
  end: WhyTaxesGoUpYearPoint,
): WhyTaxesGoUpChangeFace {
  const delta = end.value - start.value;
  let direction: WhyTaxesGoUpChangeFace["direction"] = "unchanged";
  if (delta > 0) direction = "higher";
  else if (delta < 0) direction = "lower";
  return {
    sinceYear: start.taxYear,
    startValue: start.value,
    endValue: end.value,
    delta,
    direction,
  };
}

/**
 * Sum AUTH mills for the parcel's current levy-line codes for each tax year
 * that has at least one published mill among those codes. New entities that
 * appear mid-window are included in later years (not stripped for a matching set).
 */
export function parcelTotalMillsByTaxYear(
  levyLineCodes: readonly (string | null | undefined)[],
  countyId: string | null | undefined,
): WhyTaxesGoUpYearPoint[] {
  const codes = [
    ...new Set(
      levyLineCodes
        .map((c) => (c ?? "").trim())
        .filter((c) => c.length > 0),
    ),
  ];
  if (codes.length === 0 || !countyId?.trim()) return [];

  const yearTotals = new Map<number, number>();
  for (const code of codes) {
    for (const point of authorityMillsSeries(code, countyId)) {
      if (!Number.isFinite(point.mills)) continue;
      yearTotals.set(
        point.taxYear,
        (yearTotals.get(point.taxYear) ?? 0) + point.mills,
      );
    }
  }

  return [...yearTotals.entries()]
    .map(([taxYear, value]) => ({ taxYear, value }))
    .sort((a, b) => a.taxYear - b.taxYear);
}

/** Appraised (actual) value points with finite dollars, sorted by tax year. */
export function appraisedValueByTaxYear(
  series: readonly CountyValuationHistoryPoint[] | null | undefined,
): WhyTaxesGoUpYearPoint[] {
  if (!series?.length) return [];
  const byYear = new Map<number, number>();
  for (const point of series) {
    if (
      !Number.isFinite(point.taxYear) ||
      !Number.isFinite(point.actualValue)
    ) {
      continue;
    }
    byYear.set(point.taxYear, point.actualValue);
  }
  return [...byYear.entries()]
    .map(([taxYear, value]) => ({ taxYear, value }))
    .sort((a, b) => a.taxYear - b.taxYear);
}

function endpointsFromSeries(
  series: readonly WhyTaxesGoUpYearPoint[],
): { start: WhyTaxesGoUpYearPoint; end: WhyTaxesGoUpYearPoint } | null {
  if (series.length < 2) return null;
  const start = series[0];
  const end = series[series.length - 1];
  if (!start || !end || start.taxYear === end.taxYear) return null;
  return { start, end };
}

function endpointsForYears(
  series: readonly WhyTaxesGoUpYearPoint[],
  startYear: number,
  endYear: number,
): { start: WhyTaxesGoUpYearPoint; end: WhyTaxesGoUpYearPoint } | null {
  const start = series.find((p) => p.taxYear === startYear);
  const end = series.find((p) => p.taxYear === endYear);
  if (!start || !end || startYear === endYear) return null;
  return { start, end };
}

function overlappingYears(
  a: readonly WhyTaxesGoUpYearPoint[],
  b: readonly WhyTaxesGoUpYearPoint[],
): number[] {
  const bYears = new Set(b.map((p) => p.taxYear));
  return a.map((p) => p.taxYear).filter((y) => bYears.has(y));
}

/**
 * Resolve property-report Summary faces.
 * Mill multi-year is required for `mode: "property"`; otherwise fall back to
 * the generic home teaching bar.
 */
export function resolvePropertyWhyTaxesGoUpModel(options: {
  levyLineCodes: readonly (string | null | undefined)[];
  countyId: string | null | undefined;
  valuationHistory: readonly CountyValuationHistoryPoint[] | null | undefined;
  /** County confirms prior-year values are not published (Arapahoe). */
  priorYearValuesGap: boolean;
  /** Valuation history shard fetch in flight. */
  valuationHistoryPending?: boolean;
}): PropertyWhyTaxesGoUpModel {
  const millSeries = parcelTotalMillsByTaxYear(
    options.levyLineCodes,
    options.countyId,
  );
  const millEnds = endpointsFromSeries(millSeries);
  if (!millEnds) return { mode: "generic" };

  if (options.valuationHistoryPending) {
    return {
      mode: "property",
      propertyValue: { kind: "teaching" },
      millLevy: changeFaceFromEndpoints(millEnds.start, millEnds.end),
    };
  }

  const appraisedSeries = appraisedValueByTaxYear(options.valuationHistory);
  const appraisedEnds = endpointsFromSeries(appraisedSeries);

  if (appraisedEnds) {
    const shared = overlappingYears(millSeries, appraisedSeries);
    if (shared.length >= 2) {
      const startYear = shared[0]!;
      const endYear = shared[shared.length - 1]!;
      const millWindow = endpointsForYears(millSeries, startYear, endYear);
      const appraisedWindow = endpointsForYears(
        appraisedSeries,
        startYear,
        endYear,
      );
      if (millWindow && appraisedWindow) {
        return {
          mode: "property",
          propertyValue: {
            kind: "change",
            face: changeFaceFromEndpoints(
              appraisedWindow.start,
              appraisedWindow.end,
            ),
          },
          millLevy: changeFaceFromEndpoints(millWindow.start, millWindow.end),
        };
      }
    }
  }

  const propertyValue: PropertyValueLeverState = options.priorYearValuesGap
    ? { kind: "county_gap" }
    : { kind: "property_missing" };

  return {
    mode: "property",
    propertyValue,
    millLevy: changeFaceFromEndpoints(millEnds.start, millEnds.end),
  };
}

/** `$120,000 higher since 2020` (whole dollars). */
export function formatAppraisedChangeFaceLine(
  face: WhyTaxesGoUpChangeFace,
): string {
  const amount = formatUsdWhole(Math.abs(face.delta));
  if (face.direction === "unchanged") {
    return `Unchanged since ${face.sinceYear}`;
  }
  const word = face.direction === "higher" ? "higher" : "lower";
  return `${amount} ${word} since ${face.sinceYear}`;
}

/** `12.500 mills higher since 2020` (three-decimal mill display). */
export function formatMillsChangeFaceLine(face: WhyTaxesGoUpChangeFace): string {
  const amount = formatCountyLevyMillsDisplay(Math.abs(face.delta));
  if (face.direction === "unchanged") {
    return `Unchanged since ${face.sinceYear}`;
  }
  const word = face.direction === "higher" ? "higher" : "lower";
  return `${amount} mills ${word} since ${face.sinceYear}`;
}

export const PROPERTY_VALUE_COUNTY_GAP_FACE =
  "The county will not publish prior-year values.";

export const PROPERTY_VALUE_PROPERTY_MISSING_FACE =
  "Not available for this property";

export const PROPERTY_VALUE_TEACHING_SUBTEXT =
  "What the county says your property is worth";

export const MILL_LEVY_TEACHING_SUBTEXT = "Everyone on your bill, added up";
