// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Colorado residential local-government actual-value adjustment (2026+):
 * subtract 10% of the first $700,000 of actual value before the local
 * assessment rate. Schools use full appraised value. Cite DPT residential
 * local assessment rate page / Assessors' Library.
 */

import type { ParcelAssessmentRateMode } from "@/lib/parcelAssessmentRates";

/** First assessment year the statewide residential local adjustment applies. */
export const RESIDENTIAL_LOCAL_ACTUAL_VALUE_REDUCTION_MIN_ASSESSMENT_YEAR = 2026;

/** Cap on actual value that receives the 10% reduction (2026 statute). */
export const RESIDENTIAL_LOCAL_ACTUAL_VALUE_REDUCTION_FIRST_DOLLARS = 700_000;

/** Fraction of the first-cap slice subtracted from actual (local base only). */
export const RESIDENTIAL_LOCAL_ACTUAL_VALUE_REDUCTION_RATE = 0.1;

export type ResidentialLocalActualValueReduction = {
  firstDollarsCap: number;
  reductionRate: number;
  reductionDollars: number;
  adjustedActualDollars: number;
};

/** Dollars subtracted from appraised before the local assessment rate. */
export function residentialLocalActualValueReductionDollars(
  appraisedDollars: number,
): number {
  if (!(appraisedDollars > 0) || !Number.isFinite(appraisedDollars)) return 0;
  return Math.round(
    RESIDENTIAL_LOCAL_ACTUAL_VALUE_REDUCTION_RATE *
      Math.min(
        appraisedDollars,
        RESIDENTIAL_LOCAL_ACTUAL_VALUE_REDUCTION_FIRST_DOLLARS,
      ),
  );
}

export function residentialLocalActualValueReduction(
  appraisedDollars: number,
): ResidentialLocalActualValueReduction | null {
  if (!(appraisedDollars > 0) || !Number.isFinite(appraisedDollars)) return null;
  const reductionDollars =
    residentialLocalActualValueReductionDollars(appraisedDollars);
  return {
    firstDollarsCap: RESIDENTIAL_LOCAL_ACTUAL_VALUE_REDUCTION_FIRST_DOLLARS,
    reductionRate: RESIDENTIAL_LOCAL_ACTUAL_VALUE_REDUCTION_RATE,
    reductionDollars,
    adjustedActualDollars: Math.max(0, Math.round(appraisedDollars) - reductionDollars),
  };
}

/**
 * Year + dual-rate gate for the residential local haircut (2026+). Home sample
 * stays simplified (no haircut). Matching parcel local assessed is a separate
 * check in `buildPropertyTaxMathTeachingValues` (Arapahoe fail closed;
 * Douglas Realware may omit the step and still teach).
 */
export function shouldTeachResidentialLocalActualValueReduction(
  assessmentYear: number | null | undefined,
  assessmentMode: ParcelAssessmentRateMode,
): boolean {
  return (
    assessmentMode === "residential_dual" &&
    assessmentYear != null &&
    Number.isFinite(assessmentYear) &&
    assessmentYear >= RESIDENTIAL_LOCAL_ACTUAL_VALUE_REDUCTION_MIN_ASSESSMENT_YEAR
  );
}
