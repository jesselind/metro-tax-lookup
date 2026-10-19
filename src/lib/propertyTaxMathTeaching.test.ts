// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  assessedShareOfAppraised,
  computePropertyTaxMathStack,
  localStackLines,
  PROPERTY_TAX_MATH_TEACHING_SAMPLE_NOTE,
  PROPERTY_TAX_MATH_TOTAL_STEP_TITLE,
  PROPERTY_TAX_MATH_TOTAL_STEP_TITLE_SINGLE,
  SAMPLE_PROPERTY_TAX_MATH_VALUES,
  schoolStackLines,
  totalMillsFromMathValues,
  totalTaxDollarsFromMathValues,
} from "@/lib/propertyTaxMathTeaching";

describe("SAMPLE_PROPERTY_TAX_MATH_VALUES", () => {
  it("matches 2026 residential rate math on $500,000 appraised", () => {
    const v = SAMPLE_PROPERTY_TAX_MATH_VALUES;
    expect(v.appraisedDollars).toBe(500_000);
    expect(v.localAssessedDollars).toBe(34_000);
    expect(v.schoolAssessedDollars).toBe(35_250);
    expect(v.localAssessmentRateLabel).toBe("6.8%");
    expect(v.schoolAssessmentRateLabel).toBe("7.05%");
    // Home sample stays simplified (no residential local haircut step).
    expect(v.residentialLocalHaircut ?? null).toBeNull();
  });

  it("fake stack uses school assessed only on School District", () => {
    const lines = computePropertyTaxMathStack(SAMPLE_PROPERTY_TAX_MATH_VALUES);
    expect(lines.map((l) => l.shortLabel)).toEqual([
      "Schools",
      "County",
      "Fire",
      "Metro",
    ]);
    const school = lines.find((l) => l.key === "school");
    expect(school?.usesSchoolAssessed).toBe(true);
    expect(school?.assessedDollars).toBe(35_250);
    expect(school?.taxDollars).toBe(1_410);
    expect(school?.shareOfTotal).toBeCloseTo(1410 / 3450, 5);
    for (const line of lines.filter((l) => l.key !== "school")) {
      expect(line.usesSchoolAssessed).toBe(false);
      expect(line.assessedDollars).toBe(34_000);
    }
  });

  it("demo mills produce clean whole-dollar line taxes and total", () => {
    const v = SAMPLE_PROPERTY_TAX_MATH_VALUES;
    const lines = computePropertyTaxMathStack(v);
    expect(lines.map((l) => l.taxDollars)).toEqual([1_410, 850, 510, 680]);
    expect(totalMillsFromMathValues(v)).toBe(100);
    expect(totalTaxDollarsFromMathValues(v)).toBe(3_450);
  });

  it("share fractions sum to 1", () => {
    const lines = computePropertyTaxMathStack(SAMPLE_PROPERTY_TAX_MATH_VALUES);
    const shareSum = lines.reduce((sum, l) => sum + l.shareOfTotal, 0);
    expect(shareSum).toBeCloseTo(1, 5);
  });

  it("assessed share of appraised matches sample rates", () => {
    const v = SAMPLE_PROPERTY_TAX_MATH_VALUES;
    expect(
      assessedShareOfAppraised(v.localAssessedDollars, v.appraisedDollars),
    ).toBeCloseTo(0.068, 5);
    expect(
      assessedShareOfAppraised(v.schoolAssessedDollars, v.appraisedDollars),
    ).toBeCloseTo(0.0705, 5);
  });

  it("splits school and local stack lines", () => {
    const v = SAMPLE_PROPERTY_TAX_MATH_VALUES;
    expect(schoolStackLines(v).map((l) => l.key)).toEqual(["school"]);
    expect(localStackLines(v).map((l) => l.key)).toEqual([
      "county",
      "fire",
      "metro",
    ]);
  });

  it("keeps multi-piece vs single-total final-step titles distinct", () => {
    expect(PROPERTY_TAX_MATH_TOTAL_STEP_TITLE).toMatch(/pieces/i);
    expect(PROPERTY_TAX_MATH_TOTAL_STEP_TITLE_SINGLE).toMatch(/estimated tax bill/i);
    expect(PROPERTY_TAX_MATH_TOTAL_STEP_TITLE_SINGLE).not.toBe(
      PROPERTY_TAX_MATH_TOTAL_STEP_TITLE,
    );
    expect(PROPERTY_TAX_MATH_TEACHING_SAMPLE_NOTE).toMatch(/sample property/i);
  });
});
