// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Build locked-report teaching values from parcel + levy lines.
 * Shortened mill preview: school mills total vs other mills total (or one
 * combined bucket when single-rate). Returns null when the walkthrough cannot
 * be filled honestly.
 */

import {
  annualTaxDollarsFromAssessedMills,
  parcelAssessedForDollarEstimate,
} from "@/lib/annualTaxFromAssessedMills";
import {
  COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE_LABEL,
  COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL,
} from "@/lib/coloradoDptAssessmentRates";
import {
  annualTaxDollarsForLevyStack,
  isSchoolAuthorityLevyLine,
  type LevyLineForDualBaseDollars,
} from "@/lib/levyLineAssessedBase";
import {
  COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE,
  type ParcelAssessmentProfile,
} from "@/lib/parcelAssessmentRates";
import {
  PROPERTY_TAX_MATH_COMBINED_COLOR,
  PROPERTY_TAX_MATH_LOCAL_COLOR,
  PROPERTY_TAX_MATH_SCHOOL_COLOR,
  type PropertyTaxMathTeachingValues,
} from "@/lib/propertyTaxMathTeaching";
import {
  residentialLocalActualValueReduction,
  shouldTeachResidentialLocalActualValueReduction,
} from "@/lib/residentialLocalActualValueReduction";

export type BuildPropertyTaxMathTeachingValuesOpts = {
  appraisedDollars: number | null | undefined;
  localAssessedDollars: number | null | undefined;
  schoolAssessedDollars: number | null | undefined;
  levyLines: readonly LevyLineForDualBaseDollars[];
  countyId: string | null | undefined;
  assessmentProfile: ParcelAssessmentProfile;
  assessmentYear: number | null | undefined;
  /** True for business personal property accounts (DPT business-and-industry cite). */
  isPersonalProperty?: boolean;
};

function roundMills(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function sumMillsBySchoolBucket(
  lines: readonly LevyLineForDualBaseDollars[],
  countyId: string | null | undefined,
): { schoolMills: number; localMills: number } {
  let schoolMills = 0;
  let localMills = 0;
  for (const line of lines) {
    if (!(line.mills > 0) || !Number.isFinite(line.mills)) continue;
    const isSchool = isSchoolAuthorityLevyLine({
      authorityName: line.authority,
      levyLineCode: line.levyLineCode,
      countyId,
      dolaMatchedLegalName: line.dolaMatchedLegalName,
    });
    if (isSchool) schoolMills += line.mills;
    else localMills += line.mills;
  }
  return {
    schoolMills: roundMills(schoolMills),
    localMills: roundMills(localMills),
  };
}

/**
 * Parcel teaching values, or null when appraised, assessed, or mills are
 * missing so the walkthrough would invent numbers.
 */
export function buildPropertyTaxMathTeachingValues(
  opts: BuildPropertyTaxMathTeachingValuesOpts,
): PropertyTaxMathTeachingValues | null {
  const appraised = parcelAssessedForDollarEstimate(opts.appraisedDollars);
  const localAssessed = parcelAssessedForDollarEstimate(
    opts.localAssessedDollars,
  );
  if (appraised == null || localAssessed == null) return null;
  if (opts.levyLines.length === 0) return null;

  const { schoolMills, localMills } = sumMillsBySchoolBucket(
    opts.levyLines,
    opts.countyId,
  );
  if (schoolMills + localMills <= 0) return null;

  const profile = opts.assessmentProfile;
  if (profile.mode === "none") return null;

  if (profile.mode === "single_rate") {
    const rateLabel = profile.assessedRateLabel;
    if (rateLabel == null || !rateLabel.trim()) return null;
    const totalMills = roundMills(schoolMills + localMills);
    return {
      appraisedDollars: Math.round(appraised),
      localAssessmentRateLabel: rateLabel.trim(),
      schoolAssessmentRateLabel: rateLabel.trim(),
      localAssessedDollars: Math.round(localAssessed),
      schoolAssessedDollars: Math.round(localAssessed),
      assessmentPath: "single_rate",
      ratesCite: opts.isPersonalProperty
        ? "business_and_industry"
        : "nonresidential_assessment_rates",
      residentialLocalHaircut: null,
      stackLines: [
        {
          key: "all",
          label: "Taxing districts",
          shortLabel: "All",
          mills: totalMills,
          usesSchoolAssessed: false,
          chartColor: PROPERTY_TAX_MATH_COMBINED_COLOR,
        },
      ],
    };
  }

  // residential_dual: both assessed faces are required for the dual-rate
  // assessed equations. Do not substitute local when school assessed is missing.
  const schoolAssessed = parcelAssessedForDollarEstimate(
    opts.schoolAssessedDollars,
  );
  if (schoolAssessed == null) return null;

  const dualActive =
    Math.round(schoolAssessed) !== Math.round(localAssessed);

  const haircut = shouldTeachResidentialLocalActualValueReduction(
    opts.assessmentYear,
    profile.mode,
  )
    ? residentialLocalActualValueReduction(appraised)
    : null;

  // Haircut equation must reconcile to county local assessed before teaching.
  if (haircut != null) {
    const localFromHaircut = Math.round(
      haircut.adjustedActualDollars * COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE,
    );
    if (localFromHaircut !== Math.round(localAssessed)) return null;
  }

  if (!dualActive || schoolMills <= 0) {
    // One mill bucket when school mills are absent or assessed bases match;
    // still residential dual rates + both assessed faces in the rates/assessed steps.
    const totalMills = roundMills(schoolMills + localMills);
    return {
      appraisedDollars: Math.round(appraised),
      localAssessmentRateLabel: COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE_LABEL,
      schoolAssessmentRateLabel: COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL,
      localAssessedDollars: Math.round(localAssessed),
      schoolAssessedDollars: Math.round(schoolAssessed),
      assessmentPath: "residential_dual",
      ratesCite: "residential_assessed_value",
      residentialLocalHaircut: haircut,
      stackLines: [
        {
          key: "all",
          label: "Taxing districts",
          shortLabel: "All",
          mills: totalMills,
          usesSchoolAssessed: false,
          chartColor: PROPERTY_TAX_MATH_COMBINED_COLOR,
        },
      ],
    };
  }

  return {
    appraisedDollars: Math.round(appraised),
    localAssessmentRateLabel: COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE_LABEL,
    schoolAssessmentRateLabel: COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL,
    localAssessedDollars: Math.round(localAssessed),
    schoolAssessedDollars: Math.round(schoolAssessed),
    assessmentPath: "residential_dual",
    ratesCite: "residential_assessed_value",
    residentialLocalHaircut: haircut,
    stackLines: [
      {
        key: "school",
        label: "School districts",
        shortLabel: "Schools",
        mills: schoolMills,
        usesSchoolAssessed: true,
        chartColor: PROPERTY_TAX_MATH_SCHOOL_COLOR,
      },
      {
        key: "local",
        label: "Other districts",
        shortLabel: "Other",
        mills: localMills,
        usesSchoolAssessed: false,
        chartColor: PROPERTY_TAX_MATH_LOCAL_COLOR,
      },
    ],
  };
}

/** True when walkthrough total matches dual-base / single-base stack estimate. */
export function propertyTaxMathTeachingReconcilesToLevyStack(
  values: PropertyTaxMathTeachingValues,
  levyLines: readonly LevyLineForDualBaseDollars[],
  countyId: string | null | undefined,
): boolean {
  const fromTeaching = values.stackLines.reduce((sum, line) => {
    const assessed = line.usesSchoolAssessed
      ? values.schoolAssessedDollars
      : values.localAssessedDollars;
    return sum + annualTaxDollarsFromAssessedMills(assessed, line.mills);
  }, 0);
  const fromStack = annualTaxDollarsForLevyStack(
    levyLines,
    values.localAssessedDollars,
    values.schoolAssessedDollars,
    countyId,
  );
  return fromTeaching === fromStack;
}
