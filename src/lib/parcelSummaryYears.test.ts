// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import {
  ARAPAHOE_COUNTY_CONFIG,
  DOUGLAS_COUNTY_CONFIG,
} from "@/lib/countyConfig";
import {
  parseSummaryYearNumber,
  resolveParcelSummaryYears,
} from "@/lib/parcelSummaryYears";

describe("resolveParcelSummaryYears", () => {
  it("passes through Arapahoe mart years", () => {
    expect(
      resolveParcelSummaryYears(ARAPAHOE_COUNTY_CONFIG, {
        pinRowAssessmentYear: "2026",
        pinRowTaxYear: "2025",
      }),
    ).toEqual({
      assessmentYear: "2026",
      taxYear: "2025",
      parcelRecordLinkYear: "2026",
    });
  });

  it("uses Douglas stamp and levy-stack tax year when pin-to-tag lacks columns", () => {
    expect(
      resolveParcelSummaryYears(DOUGLAS_COUNTY_CONFIG, {
        levyStacksTaxYear: "2025",
      }),
    ).toEqual({
      assessmentYear: "2026",
      taxYear: "2025",
      parcelRecordLinkYear: "2026",
    });
  });

  it("prefers Realware face tax year over mill-PDF stack year when history loads", () => {
    expect(
      resolveParcelSummaryYears(DOUGLAS_COUNTY_CONFIG, {
        levyStacksTaxYear: "2025",
        pinTotalAssessed: 27170,
        valuationHistory: [
          {
            taxYear: 2025,
            actualValue: 360000,
            assessedValue: 25740,
            taxDollars: 1200,
            alternateTaxDollars: 1100,
          },
          {
            taxYear: 2026,
            actualValue: 380000,
            assessedValue: 27170,
            taxDollars: 1300,
            alternateTaxDollars: 1200,
          },
        ],
      }),
    ).toEqual({
      assessmentYear: "2026",
      taxYear: "2026",
      parcelRecordLinkYear: "2026",
    });
  });

  it("prefers pin-to-tag years when present on Douglas rows", () => {
    expect(
      resolveParcelSummaryYears(DOUGLAS_COUNTY_CONFIG, {
        pinRowAssessmentYear: "2026",
        pinRowTaxYear: "2025",
        levyStacksTaxYear: "2024",
      }),
    ).toEqual({
      assessmentYear: "2026",
      taxYear: "2025",
      parcelRecordLinkYear: "2026",
    });
  });
});

describe("parseSummaryYearNumber", () => {
  it("parses year strings", () => {
    expect(parseSummaryYearNumber("2026")).toBe(2026);
    expect(parseSummaryYearNumber("  ")).toBeNull();
  });
});
