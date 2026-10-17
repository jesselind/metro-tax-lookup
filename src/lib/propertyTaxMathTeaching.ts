// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Sample (or later, property) numbers for the home teaching walkthrough:
 * assessment rates → appraised → two assessed bases → mills → school math →
 * local math → bill total. Pure helpers — no React.
 */

import { annualTaxDollarsFromAssessedMills } from "@/lib/annualTaxFromAssessedMills";
import {
  COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE_LABEL,
  COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL,
} from "@/lib/coloradoDptAssessmentRates";

export type PropertyTaxMathStackLine = {
  key: string;
  /** Full label for accessibility (e.g. "School District"). */
  label: string;
  /** Short face label on the legend (e.g. "Schools"). */
  shortLabel: string;
  mills: number;
  /** True → school assessed; false → local assessed. */
  usesSchoolAssessed: boolean;
  /** Solid fill for the share chart and legend swatch. */
  chartColor: string;
};

export type PropertyTaxMathTeachingValues = {
  /** County appraised (actual) value in whole dollars. */
  appraisedDollars: number;
  /** Display label for the local-government assessment rate (e.g. "6.8%"). */
  localAssessmentRateLabel: string;
  /** Display label for the school assessment rate (e.g. "7.05%"). */
  schoolAssessmentRateLabel: string;
  /** Assessed dollars for non-school bill entries. */
  localAssessedDollars: number;
  /** Assessed dollars for school-district bill entries. */
  schoolAssessedDollars: number;
  /** Short fake levy stack shown in the walkthrough. */
  stackLines: readonly PropertyTaxMathStackLine[];
};

export type PropertyTaxMathStackLineComputed = PropertyTaxMathStackLine & {
  assessedDollars: number;
  taxDollars: number;
  /** Share of sample total tax, 0–1. */
  shareOfTotal: number;
};

/**
 * Round residential sample: $500,000 appraised at 2026 DPT rates, with a
 * four-line fake stack (School / County / Fire / Metro). Not a real parcel.
 * Local mills sum to 60; school 40 — clean whole-dollar products. Shares stay
 * large enough that each share-bar segment fits short label + dollars.
 */
export const SAMPLE_PROPERTY_TAX_MATH_VALUES: PropertyTaxMathTeachingValues = {
  appraisedDollars: 500_000,
  localAssessmentRateLabel: COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE_LABEL,
  schoolAssessmentRateLabel: COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL,
  localAssessedDollars: 34_000, // 500_000 × 6.8%
  schoolAssessedDollars: 35_250, // 500_000 × 7.05%
  stackLines: [
    {
      key: "school",
      label: "School District",
      shortLabel: "Schools",
      mills: 40,
      usesSchoolAssessed: true,
      chartColor: "#0369a1", // sky-700 — school accent; not indigo badges or fire red
    },
    {
      key: "county",
      label: "County",
      shortLabel: "County",
      mills: 25,
      usesSchoolAssessed: false,
      chartColor: "#334155", // slate-700
    },
    {
      key: "fire",
      label: "Fire",
      shortLabel: "Fire",
      mills: 15,
      usesSchoolAssessed: false,
      chartColor: "#b91c1c", // red-700
    },
    {
      key: "metro",
      label: "Metro District",
      shortLabel: "Metro",
      mills: 20,
      usesSchoolAssessed: false,
      chartColor: "#047857", // emerald-700
    },
  ],
};

export const PROPERTY_TAX_MATH_TEACHING_HEADING =
  "From appraised value to a tax bill";

export const PROPERTY_TAX_MATH_TEACHING_SAMPLE_NOTE =
  "Made-up sample property. Colorado 2026 residential assessment rates.";

export const PROPERTY_TAX_MATH_RATES_STEP_TITLE =
  "Colorado sets two assessment rates";

export const PROPERTY_TAX_MATH_RATES_STEP_PLAIN =
  "This is the percent of your property value that can be taxed. Homes use two rates: one for schools, one for other local governments on the bill.";

export const PROPERTY_TAX_MATH_APPRAISED_STEP_TITLE =
  "The county appraises your property";

export const PROPERTY_TAX_MATH_APPRAISED_PLAIN =
  "Appraised value (actual value) is what the Assessor puts on your property.";

export const PROPERTY_TAX_MATH_ASSESSED_STEP_TITLE =
  "Appraised value becomes two assessed values";

export const PROPERTY_TAX_MATH_ASSESSED_STEP_PLAIN =
  "Multiply appraised value by each assessment rate.";

export const PROPERTY_TAX_MATH_MILLS_STEP_TITLE = "Mills and the mill levy";

/** Lead-in before the sample mill stack in step 4 (rates only; no dollar math yet). */
export const PROPERTY_TAX_MATH_MILLS_SAMPLE_LEAD =
  "Here's a sample mill levy:";

export const PROPERTY_TAX_MATH_SCHOOL_MATH_STEP_TITLE =
  "School mills use school assessed value";

export const PROPERTY_TAX_MATH_LOCAL_MATH_STEP_TITLE =
  "Other districts use local assessed value";

export const PROPERTY_TAX_MATH_TOTAL_STEP_TITLE = "Add the pieces for the tax bill";

export const PROPERTY_TAX_MATH_SCHOOL_RESIDENTIAL_NOTE =
  "On residential property, Colorado uses a separate school assessed value. Other property types follow different assessment-rate rules.";

export const PROPERTY_TAX_MATH_DPT_LINK_LABEL =
  "Colorado Division of Property Taxation: Assessed Value";

/** Assessed as a fraction of appraised (for share-of-bar visuals). */
export function assessedShareOfAppraised(
  assessedDollars: number,
  appraisedDollars: number,
): number {
  if (!(appraisedDollars > 0) || !(assessedDollars >= 0)) return 0;
  return assessedDollars / appraisedDollars;
}

export function assessedDollarsForStackLine(
  line: PropertyTaxMathStackLine,
  values: PropertyTaxMathTeachingValues,
): number {
  return line.usesSchoolAssessed
    ? values.schoolAssessedDollars
    : values.localAssessedDollars;
}

export function computePropertyTaxMathStack(
  values: PropertyTaxMathTeachingValues,
): PropertyTaxMathStackLineComputed[] {
  const withTax = values.stackLines.map((line) => {
    const assessedDollars = assessedDollarsForStackLine(line, values);
    return {
      ...line,
      assessedDollars,
      taxDollars: annualTaxDollarsFromAssessedMills(
        assessedDollars,
        line.mills,
      ),
    };
  });
  const total = withTax.reduce((sum, line) => sum + line.taxDollars, 0);
  return withTax.map((line) => ({
    ...line,
    shareOfTotal: total > 0 ? line.taxDollars / total : 0,
  }));
}

export function totalTaxDollarsFromMathValues(
  values: PropertyTaxMathTeachingValues,
): number {
  return computePropertyTaxMathStack(values).reduce(
    (sum, line) => sum + line.taxDollars,
    0,
  );
}

export function totalMillsFromMathValues(
  values: PropertyTaxMathTeachingValues,
): number {
  return values.stackLines.reduce((sum, line) => sum + line.mills, 0);
}

export function schoolStackLines(
  values: PropertyTaxMathTeachingValues,
): PropertyTaxMathStackLineComputed[] {
  return computePropertyTaxMathStack(values).filter((l) => l.usesSchoolAssessed);
}

export function localStackLines(
  values: PropertyTaxMathTeachingValues,
): PropertyTaxMathStackLineComputed[] {
  return computePropertyTaxMathStack(values).filter((l) => !l.usesSchoolAssessed);
}
