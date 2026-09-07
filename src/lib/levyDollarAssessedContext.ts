// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * County-agnostic assessed values for levy-line dollar estimates.
 *
 * When valuation-history shards include assessed for a tax year, dollar amounts
 * for that year use that figure. The loaded parcel's current assessed value
 * wins for the bill tax year when both are present. Callers must pass the
 * parcel tax year (not assessment year): mill AUTH history and levy YoY pair on
 * tax years (e.g. Arapahoe assessment 2026 + tax 2025; mills end at 2025).
 * When a tax year has no history row, callers fall back to today's assessed
 * (theoretical mill-only effect) or omit chart dollars for that year.
 */

import {
  annualTaxDollarsFromAssessedMills,
  parcelAssessedForDollarEstimate,
} from "@/lib/annualTaxFromAssessedMills";
import type { CountyValuationHistoryPoint } from "@/lib/countyValuationHistoryData";
import { levyDisplayDollarsForAudience } from "@/lib/resolveDwellingCount";
export type LevyDollarAudience = {
  unitCount?: number | null;
  rentMode?: boolean;
};

/**
 * Assessed values available for pairing with AUTH mill-history years.
 * Built from valuation history plus the loaded parcel's current assessed.
 */
export type LevyDollarAssessedContext = {
  currentAssessed: number;
  currentTaxYear: number | null;
  assessedByTaxYear: ReadonlyMap<number, number>;
};

/**
 * Build assessed lookup from valuation history and the loaded parcel.
 * Returns null when current assessed is missing (no dollar estimates).
 */
export function buildLevyDollarAssessedContext(
  series: CountyValuationHistoryPoint[] | null | undefined,
  currentAssessedInput: number | null | undefined,
  currentTaxYear: number | null | undefined,
): LevyDollarAssessedContext | null {
  const currentAssessed = parcelAssessedForDollarEstimate(currentAssessedInput);
  if (currentAssessed == null) return null;

  const assessedByTaxYear = new Map<number, number>();
  for (const point of series ?? []) {
    if (
      typeof point.taxYear === "number" &&
      Number.isFinite(point.taxYear) &&
      typeof point.assessedValue === "number" &&
      Number.isFinite(point.assessedValue) &&
      point.assessedValue > 0
    ) {
      assessedByTaxYear.set(point.taxYear, point.assessedValue);
    }
  }

  const year =
    currentTaxYear != null && Number.isFinite(currentTaxYear)
      ? currentTaxYear
      : null;
  if (year != null) {
    assessedByTaxYear.set(year, currentAssessed);
  }

  return {
    currentAssessed,
    currentTaxYear: year,
    assessedByTaxYear,
  };
}

/** Scale whole-account assessed context for Rent per-unit levy dollars. */
export function scaleLevyDollarAssessedContextPerUnit(
  context: LevyDollarAssessedContext,
  unitCount: number,
): LevyDollarAssessedContext {
  if (!Number.isFinite(unitCount) || unitCount < 1) return context;
  const scale = (value: number) => value / unitCount;
  const assessedByTaxYear = new Map<number, number>();
  for (const [year, assessed] of context.assessedByTaxYear) {
    assessedByTaxYear.set(year, scale(assessed));
  }
  return {
    currentAssessed: scale(context.currentAssessed),
    currentTaxYear: context.currentTaxYear,
    assessedByTaxYear,
  };
}

/**
 * Assessed for one tax year: parcel current year first, then history map.
 * Returns null when neither source has that year.
 */
export function assessedForLevyTaxYear(
  context: LevyDollarAssessedContext | null | undefined,
  taxYear: number,
): number | null {
  if (!context || !Number.isFinite(taxYear)) return null;
  if (
    context.currentTaxYear != null &&
    taxYear === context.currentTaxYear
  ) {
    return context.currentAssessed;
  }
  const fromHistory = context.assessedByTaxYear.get(taxYear);
  if (fromHistory != null && Number.isFinite(fromHistory) && fromHistory > 0) {
    return fromHistory;
  }
  return null;
}

/** Whole-dollar annual tax for one levy line at assessed × mills. */
export function levyLineAnnualDollars(
  assessed: number,
  mills: number,
): number {
  return annualTaxDollarsFromAssessedMills(assessed, mills);
}

/**
 * Resident-facing levy-line dollars (annual or monthly per-unit in Rent).
 * Returns null when assessed is missing or non-positive.
 */
export function levyLineDisplayDollars(
  assessed: number | null | undefined,
  mills: number,
  audience?: LevyDollarAudience,
): number | null {
  if (assessed == null || !Number.isFinite(assessed) || assessed <= 0) {
    return null;
  }
  if (!Number.isFinite(mills)) return null;
  return levyDisplayDollarsForAudience(
    levyLineAnnualDollars(assessed, mills),
    audience?.unitCount,
    audience?.rentMode ?? false,
  );
}

export type LevyDollarsPairResult = {
  previousDollars: number | null;
  currentDollars: number | null;
  differenceDollars: number | null;
  /**
   * True when prior-year dollars use today's assessed because history lacked
   * that tax year (theoretical mill-only effect).
   */
  usesTheoreticalAssessed: boolean;
};

/**
 * Prior/current levy-line dollars for a mill YoY pair.
 * Uses per-year assessed when history has the prior tax year; otherwise holds
 * current assessed constant (theoretical).
 */
export function levyDollarsPairForTaxYears(
  millsPrevious: number,
  millsCurrent: number,
  taxYearPrevious: number,
  taxYearCurrent: number,
  context: LevyDollarAssessedContext | null | undefined,
  audience?: LevyDollarAudience,
): LevyDollarsPairResult {
  const currentAssessed = assessedForLevyTaxYear(context, taxYearCurrent);
  if (currentAssessed == null) {
    return {
      previousDollars: null,
      currentDollars: null,
      differenceDollars: null,
      usesTheoreticalAssessed: true,
    };
  }

  const priorFromHistory = assessedForLevyTaxYear(context, taxYearPrevious);
  const priorAssessed = priorFromHistory ?? currentAssessed;
  const usesTheoreticalAssessed = priorFromHistory == null;

  const previousDollars = levyLineDisplayDollars(
    priorAssessed,
    millsPrevious,
    audience,
  );
  const currentDollars = levyLineDisplayDollars(
    currentAssessed,
    millsCurrent,
    audience,
  );
  const differenceDollars =
    previousDollars != null && currentDollars != null
      ? currentDollars - previousDollars
      : null;

  return {
    previousDollars,
    currentDollars,
    differenceDollars,
    usesTheoreticalAssessed,
  };
}
