// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  buildPropertyTaxMathTeachingValues,
  propertyTaxMathTeachingReconcilesToLevyStack,
} from "@/lib/buildPropertyTaxMathTeachingValues";
import { loadDemoProperty } from "@/lib/demoProperty";
import { totalTaxDollarsFromMathValues } from "@/lib/propertyTaxMathTeaching";
import { resolveParcelAssessmentProfile } from "@/lib/parcelAssessmentRates";

describe("buildPropertyTaxMathTeachingValues", () => {
  it("builds dual-bucket values with haircut for the Try demo residential parcel", () => {
    const demo = loadDemoProperty();
    const profile = resolveParcelAssessmentProfile(demo.parcelRecord);
    expect(profile.mode).toBe("residential_dual");

    const lines = demo.levy.lines.map((line) => ({
      authority: line.authority,
      mills: line.mills,
      levyLineCode: line.levyLineCode,
      dolaMatchedLegalName: line.dolaMatch?.matchedLegalName,
    }));

    const values = buildPropertyTaxMathTeachingValues({
      appraisedDollars: demo.levy.parcelValues.totalActual,
      localAssessedDollars: demo.levy.parcelValues.totalAssessed,
      schoolAssessedDollars: demo.parcelRecord.schoolAssessedTotal,
      levyLines: lines,
      countyId: "arapahoe",
      assessmentProfile: profile,
      assessmentYear: 2026,
    });

    expect(values).not.toBeNull();
    if (values == null) return;
    expect(values.assessmentPath).toBe("residential_dual");
    expect(values.ratesCite).toBe("residential_assessed_value");
    expect(values.appraisedDollars).toBe(584_100);
    expect(values.localAssessedDollars).toBe(35_747);
    expect(values.schoolAssessedDollars).toBe(41_179);
    expect(values.residentialLocalHaircut?.reductionDollars).toBe(58_410);
    expect(values.stackLines.map((l) => l.key)).toEqual(["school", "local"]);
    expect(values.stackLines[0]!.usesSchoolAssessed).toBe(true);
    expect(values.stackLines[1]!.usesSchoolAssessed).toBe(false);
    expect(
      propertyTaxMathTeachingReconcilesToLevyStack(values, lines, "arapahoe"),
    ).toBe(true);
    expect(totalTaxDollarsFromMathValues(values)).toBeGreaterThan(0);
  });

  it("builds a single-rate bucket for commercial without haircut", () => {
    const values = buildPropertyTaxMathTeachingValues({
      appraisedDollars: 1_000_000,
      localAssessedDollars: 250_000,
      schoolAssessedDollars: null,
      levyLines: [
        { authority: "CITY", mills: 10, levyLineCode: "3001" },
        { authority: "COUNTY", mills: 15.959, levyLineCode: "2998" },
      ],
      countyId: "arapahoe",
      assessmentProfile: {
        mode: "single_rate",
        assessedRateLabel: "25%",
        showSchoolAssessedRow: false,
      },
      assessmentYear: 2026,
    });
    expect(values).not.toBeNull();
    if (values == null) return;
    expect(values.assessmentPath).toBe("single_rate");
    expect(values.ratesCite).toBe("nonresidential_assessment_rates");
    expect(values.residentialLocalHaircut).toBeNull();
    expect(values.stackLines).toHaveLength(1);
    expect(values.stackLines[0]!.key).toBe("all");
    expect(values.stackLines[0]!.mills).toBe(25.959);
  });

  it("cites business-and-industry DPT for personal property", () => {
    const values = buildPropertyTaxMathTeachingValues({
      appraisedDollars: 50_000,
      localAssessedDollars: 13_000,
      schoolAssessedDollars: null,
      levyLines: [{ authority: "COUNTY", mills: 16 }],
      countyId: "arapahoe",
      assessmentProfile: {
        mode: "single_rate",
        assessedRateLabel: "26%",
        showSchoolAssessedRow: false,
      },
      assessmentYear: 2026,
      isPersonalProperty: true,
    });
    expect(values?.ratesCite).toBe("business_and_industry");
  });

  it("returns null when appraised or assessed is missing", () => {
    expect(
      buildPropertyTaxMathTeachingValues({
        appraisedDollars: null,
        localAssessedDollars: 10_000,
        schoolAssessedDollars: null,
        levyLines: [{ authority: "COUNTY", mills: 10 }],
        countyId: "arapahoe",
        assessmentProfile: {
          mode: "single_rate",
          assessedRateLabel: "26%",
          showSchoolAssessedRow: false,
        },
        assessmentYear: 2026,
      }),
    ).toBeNull();
  });

  it("returns null on residential dual when school assessed is missing", () => {
    expect(
      buildPropertyTaxMathTeachingValues({
        appraisedDollars: 500_000,
        localAssessedDollars: 30_600,
        schoolAssessedDollars: null,
        levyLines: [
          { authority: "SCHOOL DIST", mills: 40, levyLineCode: "1001" },
          { authority: "COUNTY", mills: 16, levyLineCode: "2998" },
        ],
        countyId: "arapahoe",
        assessmentProfile: {
          mode: "residential_dual",
          assessedRateLabel: "6.8%",
          showSchoolAssessedRow: true,
        },
        assessmentYear: 2025,
      }),
    ).toBeNull();
  });

  it("keeps county school assessed when the mill preview is one bucket (no school lines)", () => {
    const values = buildPropertyTaxMathTeachingValues({
      appraisedDollars: 500_000,
      localAssessedDollars: 30_600,
      schoolAssessedDollars: 35_250,
      levyLines: [{ authority: "COUNTY", mills: 16, levyLineCode: "2998" }],
      countyId: "arapahoe",
      assessmentProfile: {
        mode: "residential_dual",
        assessedRateLabel: "6.8%",
        showSchoolAssessedRow: true,
      },
      assessmentYear: 2025,
    });
    expect(values).not.toBeNull();
    if (values == null) return;
    expect(values.assessmentPath).toBe("residential_dual");
    expect(values.localAssessedDollars).toBe(30_600);
    expect(values.schoolAssessedDollars).toBe(35_250);
    expect(values.stackLines).toHaveLength(1);
    expect(values.stackLines[0]!.key).toBe("all");
    expect(values.residentialLocalHaircut).toBeNull();
  });

  it("opens Douglas 2026 dual-rate teaching with Realware local (R0399058) and omits haircut step", () => {
    const profile = {
      mode: "residential_dual" as const,
      assessedRateLabel: "6.8%",
      showSchoolAssessedRow: true,
    };
    const lines = [
      { authority: "DOUGLAS COUNTY SCHOOL DIST", mills: 20, levyLineCode: "1001" },
      { authority: "DOUGLAS COUNTY", mills: 16.5, levyLineCode: "2998" },
    ];
    expect(
      buildPropertyTaxMathTeachingValues({
        appraisedDollars: 641_560,
        localAssessedDollars: 43_620,
        schoolAssessedDollars: 45_230,
        levyLines: lines,
        countyId: "douglas",
        assessmentProfile: profile,
        assessmentYear: 2026,
      }),
    ).toBeNull();
    const values = buildPropertyTaxMathTeachingValues({
      appraisedDollars: 641_560,
      localAssessedDollars: 43_620,
      schoolAssessedDollars: 45_230,
      levyLines: lines,
      countyId: "douglas",
      propertyTaxEstimateMode: "realwareTaxDollars",
      assessmentProfile: profile,
      assessmentYear: 2026,
    });
    expect(values).not.toBeNull();
    if (values == null) return;
    expect(values.localAssessedDollars).toBe(43_620);
    expect(values.schoolAssessedDollars).toBe(45_230);
    expect(values.residentialLocalHaircut).toBeNull();
    expect(values.stackLines.map((l) => l.key)).toEqual(["school", "local"]);
    expect(
      propertyTaxMathTeachingReconcilesToLevyStack(values, lines, "douglas"),
    ).toBe(true);
  });

  it("returns null when the haircut times local rate does not match local assessed", () => {
    const opts = {
      appraisedDollars: 584_100,
      localAssessedDollars: 40_000, // not 525_690 × 6.8%
      schoolAssessedDollars: 41_179,
      levyLines: [
        { authority: "SCHOOL DIST", mills: 40, levyLineCode: "1001" },
        { authority: "COUNTY", mills: 16, levyLineCode: "2998" },
      ],
      countyId: "arapahoe",
      assessmentProfile: {
        mode: "residential_dual" as const,
        assessedRateLabel: "6.8%",
        showSchoolAssessedRow: true,
      },
      assessmentYear: 2026,
    };
    expect(buildPropertyTaxMathTeachingValues(opts)).toBeNull();
    expect(
      buildPropertyTaxMathTeachingValues({
        ...opts,
        propertyTaxEstimateMode: "levyStackDollars",
      }),
    ).toBeNull();
  });
});
