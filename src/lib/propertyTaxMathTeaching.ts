// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Numbers for the teaching walkthrough (home sample or locked parcel):
 * assessment rates → appraised → assessed base(s) → mills → mill math → bill.
 * Pure helpers — no React. Home sample omits haircut; locked residential may
 * include {@link PropertyTaxMathTeachingValues.residentialLocalHaircut}.
 */

import { annualTaxDollarsFromAssessedMills } from "@/lib/annualTaxFromAssessedMills";
import {
  COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE_LABEL,
  COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL,
} from "@/lib/coloradoDptAssessmentRates";
import type { ResidentialLocalActualValueReduction } from "@/lib/residentialLocalActualValueReduction";

export type PropertyTaxMathAssessmentPath = "residential_dual" | "single_rate";

/**
 * Which DPT page the rates-step cite opens. Home sample and residential dual
 * use the Understanding Assessed Value section; commercial Real uses the 2026
 * rates chart; BPP uses the business-and-industry brochure.
 */
export type PropertyTaxMathRatesCite =
  | "residential_assessed_value"
  | "nonresidential_assessment_rates"
  | "business_and_industry";

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
  /**
   * School assessment rate label when {@link assessmentPath} is residential_dual.
   * Unused in the single-rate path UI.
   */
  schoolAssessmentRateLabel: string;
  /** Assessed dollars for non-school bill entries. */
  localAssessedDollars: number;
  /**
   * Assessed dollars for school-district bill entries. On the single_rate path
   * equals local. On residential_dual, county school assessed (even when the
   * mill preview collapses to one bucket).
   */
  schoolAssessedDollars: number;
  /**
   * Mill preview + share capsule lines. Home sample: short fake stack.
   * Locked property: school vs other buckets (or one total when single-rate).
   */
  stackLines: readonly PropertyTaxMathStackLine[];
  /** Dual-rate vs one assessment rate. Default residential_dual for sample. */
  assessmentPath?: PropertyTaxMathAssessmentPath;
  /**
   * DPT cite for the rates step. Default residential_assessed_value (home
   * sample + residential dual).
   */
  ratesCite?: PropertyTaxMathRatesCite;
  /**
   * Locked residential 2026+: local actual-value adjustment before the local
   * rate. Omit on the home sample (simplified rate × appraised).
   */
  residentialLocalHaircut?: ResidentialLocalActualValueReduction | null;
};

/** Chart / rate card accent for school (sky-700). */
export const PROPERTY_TAX_MATH_SCHOOL_COLOR = "#0369a1";
/** Chart / rate card accent for local / non-school (teal-700). */
export const PROPERTY_TAX_MATH_LOCAL_COLOR = "#0f766e";
/** Single-rate / combined bucket (slate-700). */
export const PROPERTY_TAX_MATH_COMBINED_COLOR = "#334155";

export type PropertyTaxMathStackLineComputed = PropertyTaxMathStackLine & {
  assessedDollars: number;
  taxDollars: number;
  /** Share of sample total tax, 0–1. */
  shareOfTotal: number;
};

/**
 * Round residential sample: $500,000 appraised at 2026 DPT rates, with a
 * four-line fake stack (School / County / Fire / Metro). Not a real parcel.
 * Local mills sum to 60; school 40 — clean whole-dollar products. Share capsule
 * uses a phone min-width floor so short labels stay readable off true scale.
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
  "Here's a sample property to show how this works.";

export const PROPERTY_TAX_MATH_TEACHING_DISCLOSURE_TEASER =
  "See how this property's appraised value becomes a tax bill";

export const PROPERTY_TAX_MATH_RATES_STEP_TITLE =
  "Colorado sets two assessment rates";

export const PROPERTY_TAX_MATH_RATES_STEP_PLAIN =
  "This is the percent of your property value that can be taxed. Homes use two rates: one for schools, one for other local governments on the bill.";

export const PROPERTY_TAX_MATH_RATES_SINGLE_STEP_TITLE =
  "Colorado sets an assessment rate";

export const PROPERTY_TAX_MATH_RATES_SINGLE_STEP_PLAIN =
  "This is the percent of your property value that can be taxed for the districts on your bill.";

export const PROPERTY_TAX_MATH_APPRAISED_STEP_TITLE =
  "The county appraises your property";

export const PROPERTY_TAX_MATH_APPRAISED_PLAIN =
  "Appraised value (actual value) is what the Assessor puts on your property.";

export const PROPERTY_TAX_MATH_ASSESSED_STEP_TITLE =
  "Appraised value becomes two assessed values";

export const PROPERTY_TAX_MATH_ASSESSED_STEP_PLAIN =
  "Multiply appraised value by each assessment rate.";

export const PROPERTY_TAX_MATH_ASSESSED_SINGLE_STEP_TITLE =
  "Appraised value becomes assessed value";

export const PROPERTY_TAX_MATH_ASSESSED_SINGLE_STEP_PLAIN =
  "Multiply appraised value by the assessment rate.";

export const PROPERTY_TAX_MATH_ASSESSED_AFTER_HAIRCUT_PLAIN =
  "Multiply the adjusted appraised value by the local rate. Schools still use the full appraised value.";

export const PROPERTY_TAX_MATH_HAIRCUT_STEP_TITLE =
  "Colorado trims part of appraised value for local taxes";

export const PROPERTY_TAX_MATH_HAIRCUT_STEP_PLAIN =
  "For local governments on the bill (not schools), Colorado subtracts 10% of the first $700,000 of appraised value, then applies the local assessment rate.";

export const PROPERTY_TAX_MATH_MILLS_STEP_TITLE = "Mills and the mill levy";

/** Lead-in before the sample mill stack in step 4 (rates only; no dollar math yet). */
export const PROPERTY_TAX_MATH_MILLS_SAMPLE_LEAD =
  "Here's a sample mill levy:";

/** Locked property: shortened school vs other mill totals. */
export const PROPERTY_TAX_MATH_MILLS_PROPERTY_LEAD =
  "School mills and other mills on this bill (totals):";

export const PROPERTY_TAX_MATH_MILLS_PROPERTY_SINGLE_LEAD =
  "Total mills on this bill:";

export const PROPERTY_TAX_MATH_LEVY_STACK_POINTER =
  "Each district's mills and dollars are under Where is your money going?";

export const PROPERTY_TAX_MATH_SCHOOL_MATH_STEP_TITLE =
  "School mills use school assessed value";

export const PROPERTY_TAX_MATH_LOCAL_MATH_STEP_TITLE =
  "Other districts use local assessed value";

export const PROPERTY_TAX_MATH_SINGLE_MATH_STEP_TITLE =
  "Mills use assessed value";

export const PROPERTY_TAX_MATH_TOTAL_STEP_TITLE = "Add the pieces for the tax bill";

/** Final step when the share capsule would have only one segment (no pieces to add). */
export const PROPERTY_TAX_MATH_TOTAL_STEP_TITLE_SINGLE =
  "That's the estimated tax bill";

export const PROPERTY_TAX_MATH_SCHOOL_RESIDENTIAL_NOTE =
  "On residential property, Colorado uses a separate school assessed value. Other property types follow different assessment-rate rules.";

export const PROPERTY_TAX_MATH_DPT_LINK_LABEL =
  "Colorado Division of Property Taxation: Assessed Value";

export const PROPERTY_TAX_MATH_DPT_RATES_CHART_LINK_LABEL =
  "Colorado Division of Property Taxation: 2026 Assessment Rates";

export const PROPERTY_TAX_MATH_DPT_BUSINESS_LINK_LABEL =
  "Colorado Division of Property Taxation: Property valuation for business and industry";

export const PROPERTY_TAX_MATH_DPT_HAIRCUT_LINK_LABEL =
  "Colorado Division of Property Taxation: Residential local assessment rate";

export function ratesCiteFromValues(
  values: PropertyTaxMathTeachingValues,
): PropertyTaxMathRatesCite {
  return values.ratesCite ?? "residential_assessed_value";
}

/** Mills face that keeps home sample integers (40) and property fractions (25.38). */
export function formatTeachingMills(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 1000) / 1000;
  return String(rounded);
}

export function assessmentPathFromValues(
  values: PropertyTaxMathTeachingValues,
): PropertyTaxMathAssessmentPath {
  return values.assessmentPath ?? "residential_dual";
}

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
