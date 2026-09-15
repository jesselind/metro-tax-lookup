// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { annualTaxDollarsFromAssessedMills } from "@/lib/annualTaxFromAssessedMills";
import {
  estimatedAnnualPropertyTaxDollars,
  faceValuationHistoryPoint,
  realwareTaxDollarsTotal,
} from "@/lib/propertyTaxEstimate";

/** Matches tools/fixtures/douglas_realware_detail_synthetic_split_rate.json after extract. */
const SYNTHETIC_SPLIT_RATE_HISTORY = [
  {
    taxYear: 2025,
    actualValue: 360000,
    assessedValue: 25740,
    alternateAssessedValue: 25380,
    taxDollars: 1200,
    alternateTaxDollars: 1100,
  },
  {
    taxYear: 2026,
    actualValue: 380000,
    assessedValue: 27170,
    alternateAssessedValue: 26790,
    taxDollars: 1300,
    alternateTaxDollars: 1200,
  },
] as const;

describe("realwareTaxDollarsTotal", () => {
  it("sums local and school Realware tax dollars", () => {
    expect(
      realwareTaxDollarsTotal({
        taxDollars: 1300,
        alternateTaxDollars: 1200,
      }),
    ).toBe(2500);
  });

  it("fails closed when taxDollars is missing", () => {
    expect(
      realwareTaxDollarsTotal({ alternateTaxDollars: 1200 }),
    ).toBeNull();
  });
});

describe("faceValuationHistoryPoint", () => {
  it("prefers the year matching pin assessed", () => {
    expect(faceValuationHistoryPoint(SYNTHETIC_SPLIT_RATE_HISTORY, 27170)?.taxYear).toBe(
      2026,
    );
    expect(faceValuationHistoryPoint(SYNTHETIC_SPLIT_RATE_HISTORY, 25740)?.taxYear).toBe(
      2025,
    );
  });

  it("falls back to latest when pin assessed does not match", () => {
    expect(faceValuationHistoryPoint(SYNTHETIC_SPLIT_RATE_HISTORY, 99999)?.taxYear).toBe(
      2026,
    );
  });
});

describe("estimatedAnnualPropertyTaxDollars", () => {
  it("uses Realware totals for realwareTaxDollars mode", () => {
    expect(
      estimatedAnnualPropertyTaxDollars({
        mode: "realwareTaxDollars",
        totalAssessed: 27170,
        sumMills: 98.821,
        valuationHistory: SYNTHETIC_SPLIT_RATE_HISTORY,
      }),
    ).toBe(2500);
  });

  it("does not equal assessed × totalMills when Realware totals exist", () => {
    const sumMills = 98.821;
    const face = estimatedAnnualPropertyTaxDollars({
      mode: "realwareTaxDollars",
      totalAssessed: 27170,
      sumMills,
      valuationHistory: SYNTHETIC_SPLIT_RATE_HISTORY,
    });
    const millsProduct = annualTaxDollarsFromAssessedMills(27170, sumMills);
    expect(face).toBe(2500);
    expect(millsProduct).toBeGreaterThan(0);
    expect(face).not.toBe(millsProduct);
  });

  it("does not fall back to mills when Realware fields are missing", () => {
    expect(
      estimatedAnnualPropertyTaxDollars({
        mode: "realwareTaxDollars",
        totalAssessed: 27170,
        sumMills: 98.821,
        valuationHistory: [
          {
            taxYear: 2026,
            actualValue: 380000,
            assessedValue: 27170,
          },
        ],
      }),
    ).toBeNull();
  });

  it("keeps singleAssessedTimesTotalMills for Arapahoe-shaped mode", () => {
    expect(
      estimatedAnnualPropertyTaxDollars({
        mode: "singleAssessedTimesTotalMills",
        totalAssessed: 10000,
        sumMills: 100,
      }),
    ).toBe(1000);
  });
});
