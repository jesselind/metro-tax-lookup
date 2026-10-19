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
});
