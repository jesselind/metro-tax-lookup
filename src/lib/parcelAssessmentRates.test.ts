// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import type { ArapahoeParcelRecordRow } from "@/lib/arapahoeParcelLevyData";
import {
  buildParcelValueTableRows,
  isResidentialStateUseCode,
  nonResidentialAssessedRateLabel,
  nonResidentialAssessedSplit,
  resolveParcelAssessmentProfile,
  residentialLocalAssessedSplit,
} from "@/lib/parcelAssessmentRates";

describe("isResidentialStateUseCode", () => {
  it("treats 1xxx as residential", () => {
    expect(isResidentialStateUseCode("1177")).toBe(true);
    expect(isResidentialStateUseCode("1177.0")).toBe(true);
  });

  it("treats non-1xxx as non-residential", () => {
    expect(isResidentialStateUseCode("9179")).toBe(false);
    expect(isResidentialStateUseCode("2177")).toBe(false);
  });
});

describe("resolveParcelAssessmentProfile", () => {
  it("shows school row only for residential improvement", () => {
    expect(
      resolveParcelAssessmentProfile({
        stateUseCd: "1177",
        taxRollDescr: "Real",
        propertyClassDescr: "Improvement",
        assessmentYear: "2026",
        improvementActual: 100,
      }).showSchoolAssessedRow,
    ).toBe(true);
    expect(
      resolveParcelAssessmentProfile({
        stateUseCd: "9179",
        taxRollDescr: "Real",
        propertyClassDescr: "Improvement",
        assessmentYear: "2026",
        improvementActual: 100,
      }).showSchoolAssessedRow,
    ).toBe(false);
  });

  it("uses chart rate label for commercial improved", () => {
    expect(
      resolveParcelAssessmentProfile({
        stateUseCd: "2130",
        taxRollDescr: "Real",
        propertyClassDescr: "Improvement",
        assessmentYear: "2026",
        improvementActual: 100,
      }).assessedRateLabel,
    ).toBe("25%");
  });

  it("omits rate label for exempt / unmapped state use", () => {
    expect(
      resolveParcelAssessmentProfile({
        stateUseCd: "9179",
        taxRollDescr: "Real",
        propertyClassDescr: "Improvement",
        assessmentYear: "2026",
        improvementActual: 100,
      }).assessedRateLabel,
    ).toBeNull();
  });

  it("uses mode none for non-REAL tax roll", () => {
    const profile = resolveParcelAssessmentProfile({
      stateUseCd: "9179",
      taxRollDescr: "Personal",
      propertyClassDescr: "Personal",
      assessmentYear: "2026",
      improvementActual: 100,
    });
    expect(profile.mode).toBe("none");
    expect(profile.assessedRateLabel).toBeNull();
    expect(profile.showSchoolAssessedRow).toBe(false);
  });

  it("uses mode none for pre-2025 non-residential", () => {
    const profile = resolveParcelAssessmentProfile({
      stateUseCd: "9179",
      taxRollDescr: "Real",
      propertyClassDescr: "Improvement",
      assessmentYear: "2024",
      improvementActual: 100,
    });
    expect(profile.mode).toBe("none");
    expect(profile.assessedRateLabel).toBeNull();
    expect(profile.showSchoolAssessedRow).toBe(false);
  });
});

describe("nonResidentialAssessedRateLabel", () => {
  it("maps commercial, vacant, industrial, and ag chart rows", () => {
    expect(nonResidentialAssessedRateLabel("2177", 100)).toBe("25%");
    expect(nonResidentialAssessedRateLabel("2177", 0)).toBe("26%");
    expect(nonResidentialAssessedRateLabel("0100", 0)).toBe("26%");
    expect(nonResidentialAssessedRateLabel("3115", 100)).toBe("26%");
    expect(nonResidentialAssessedRateLabel("4147", 0)).toBe("25%");
  });

  it("returns null for exempt, missing, and special-formula classes", () => {
    expect(nonResidentialAssessedRateLabel("9179", 100)).toBeNull();
    expect(nonResidentialAssessedRateLabel("9140", 100)).toBeNull();
    expect(nonResidentialAssessedRateLabel(null, 100)).toBeNull();
    expect(nonResidentialAssessedRateLabel("", 0)).toBeNull();
    expect(nonResidentialAssessedRateLabel("6000", 0)).toBeNull();
  });
});

describe("assessed split math", () => {
  const IMPROVEMENT = 454100;
  const LAND = 130000;
  const TOTAL_ASSESSED = 35747;

  it("residential local split uses 6.8% on land", () => {
    const split = residentialLocalAssessedSplit(
      IMPROVEMENT,
      LAND,
      TOTAL_ASSESSED,
    );
    expect(split.land).toBe(8840);
    expect(split.building).toBe(26907);
  });

  it("non-residential proportional split matches county hospital pattern", () => {
    const split = nonResidentialAssessedSplit(
      110047224,
      25008510,
      135055734,
      36465048,
    );
    expect(split.building).toBe(29712750);
    expect(split.land).toBe(6752298);
    expect((split.building ?? 0) + (split.land ?? 0)).toBe(36465048);
  });
});

describe("buildParcelValueTableRows", () => {
  const porterHospital: ArapahoeParcelRecordRow = {
    ain: "2077-34-1-12-014",
    stateUseCd: "9179",
    taxRollDescr: "Real",
    propertyClassDescr: "Improvement",
    assessmentYear: "2026",
    parcelTaxYear: "2025",
    totalActual: 135055734,
    improvementActual: 110047224,
    landActual: 25008510,
    totalAssessed: 36465048,
    assessedBuilding: 34764469,
    assessedLand: 1700579,
    schoolAssessedTotal: 9521429,
    schoolAssessedBuilding: 7758329,
    schoolAssessedLand: 1763100,
  };

  it("hides school row and recomputes assessed splits for non-residential", () => {
    const rows = buildParcelValueTableRows(porterHospital);
    expect(rows.map((r) => r.kind)).toEqual(["appraised", "assessed"]);
    const assessed = rows.find((r) => r.kind === "assessed");
    // Exempt 9xxx: no invented chart percent; splits still proportional.
    expect(assessed?.rateLabel).toBeNull();
    expect(assessed?.values.building).toBe(29712750);
    expect(assessed?.values.land).toBe(6752298);
    expect(assessed?.values.total).toBe(36465048);
  });

  it("labels commercial improved assessed row at 25%", () => {
    const rows = buildParcelValueTableRows({
      ...porterHospital,
      stateUseCd: "2130",
      stateUseLabel: "Special Purpose",
      totalActual: 50_000_000,
      improvementActual: 40_000_000,
      landActual: 10_000_000,
      totalAssessed: 12_500_000,
    });
    const assessed = rows.find((r) => r.kind === "assessed");
    expect(assessed?.rateLabel).toBe("25%");
    expect(assessed?.values.building).toBe(10_000_000);
    expect(assessed?.values.land).toBe(2_500_000);
  });

  it("includes school row for residential improvement", () => {
    const rows = buildParcelValueTableRows({
      ...porterHospital,
      stateUseCd: "1177",
      totalActual: 584100,
      improvementActual: 454100,
      landActual: 130000,
      totalAssessed: 35747,
    });
    expect(rows.map((r) => r.kind)).toEqual([
      "appraised",
      "assessed",
      "assessed-school",
    ]);
    const assessed = rows.find((r) => r.kind === "assessed");
    expect(assessed?.rateLabel).toBe("6.8%");
  });

  it("keeps mart assessed splits for pre-2025 non-residential", () => {
    const rows = buildParcelValueTableRows({
      ...porterHospital,
      assessmentYear: "2024",
    });
    expect(rows.map((r) => r.kind)).toEqual(["appraised", "assessed"]);
    const assessed = rows.find((r) => r.kind === "assessed");
    expect(assessed?.rateLabel).toBeNull();
    expect(assessed?.values.building).toBe(porterHospital.assessedBuilding);
    expect(assessed?.values.land).toBe(porterHospital.assessedLand);
  });

  it("keeps mart assessed splits for non-REAL accounts", () => {
    const rows = buildParcelValueTableRows({
      ...porterHospital,
      taxRollDescr: "Personal",
      propertyClassDescr: "Personal",
    });
    expect(rows.map((r) => r.kind)).toEqual(["appraised", "assessed"]);
    const assessed = rows.find((r) => r.kind === "assessed");
    expect(assessed?.rateLabel).toBeNull();
    expect(assessed?.values.building).toBe(porterHospital.assessedBuilding);
  });
});
