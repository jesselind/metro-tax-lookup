// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { annualTaxDollarsFromAssessedMills } from "@/lib/annualTaxFromAssessedMills";
import { annualTaxDollarsForLevyStack } from "@/lib/levyLineAssessedBase";
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

/** Huron-shaped synthetic: school ≠ local (not a real situs in tests). */
const HURON_SHAPED_LINES = [
  { authority: "SYNTHETIC SCHOOL DIST # 1", mills: 51.071 },
  { authority: "SYNTHETIC COUNTY", mills: 27.695 },
] as const;
const HURON_LOCAL = 23183;
const HURON_SCHOOL = 26705;

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
        valuationHistory: SYNTHETIC_SPLIT_RATE_HISTORY,
      }),
    ).toBe(2500);
  });

  it("does not equal assessed × totalMills when Realware totals exist", () => {
    const sumMills = 98.821;
    const face = estimatedAnnualPropertyTaxDollars({
      mode: "realwareTaxDollars",
      totalAssessed: 27170,
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
        levyLines: [...HURON_SHAPED_LINES],
        schoolAssessed: HURON_SCHOOL,
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

  it("levyStackDollars equals annualTaxDollarsForLevyStack (dual-base)", () => {
    const face = estimatedAnnualPropertyTaxDollars({
      mode: "levyStackDollars",
      totalAssessed: HURON_LOCAL,
      schoolAssessed: HURON_SCHOOL,
      levyLines: [...HURON_SHAPED_LINES],
    });
    const stack = annualTaxDollarsForLevyStack(
      [...HURON_SHAPED_LINES],
      HURON_LOCAL,
      HURON_SCHOOL,
    );
    expect(stack).toBe(2006);
    expect(face).toBe(stack);
    const naiveSingle = annualTaxDollarsFromAssessedMills(
      HURON_LOCAL,
      51.071 + 27.695,
    );
    expect(naiveSingle).toBe(1826);
    expect(face).not.toBe(naiveSingle);
  });

  it("levyStackDollars equals stack when school equals local (single-base)", () => {
    const assessed = 10000;
    const lines = [
      { authority: "SYNTHETIC SCHOOL DIST # 1", mills: 40 },
      { authority: "SYNTHETIC COUNTY", mills: 10 },
    ];
    const face = estimatedAnnualPropertyTaxDollars({
      mode: "levyStackDollars",
      totalAssessed: assessed,
      schoolAssessed: assessed,
      levyLines: lines,
    });
    expect(face).toBe(annualTaxDollarsForLevyStack(lines, assessed, assessed));
    expect(face).toBe(annualTaxDollarsFromAssessedMills(assessed, 50));
  });

  it("levyStackDollars omits when mills are awaiting", () => {
    expect(
      estimatedAnnualPropertyTaxDollars({
        mode: "levyStackDollars",
        totalAssessed: HURON_LOCAL,
        schoolAssessed: HURON_SCHOOL,
        levyLines: [...HURON_SHAPED_LINES],
        levyAwaitingTemplateMills: true,
      }),
    ).toBeNull();
  });
});
