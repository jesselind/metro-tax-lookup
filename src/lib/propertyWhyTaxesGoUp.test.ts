// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  appraisedValueByTaxYear,
  formatAppraisedChangeFaceLine,
  formatAppraisedChangeFaceLines,
  formatMillsChangeFaceLine,
  formatMillsChangeFaceLines,
  parcelTotalMillsByTaxYear,
  resolvePropertyWhyTaxesGoUpModel,
} from "@/lib/propertyWhyTaxesGoUp";

describe("parcelTotalMillsByTaxYear", () => {
  it("sums published AUTH mills per tax year for Arapahoe codes", () => {
    const series = parcelTotalMillsByTaxYear(["0101"], "arapahoe");
    expect(series.length).toBeGreaterThanOrEqual(2);
    expect(series[0]?.taxYear).toBeLessThan(series.at(-1)!.taxYear);
    for (const point of series) {
      expect(point.value).toBeGreaterThan(0);
    }
  });

  it("includes a mid-window-only AUTH in later year totals", () => {
    const earlyOnly = parcelTotalMillsByTaxYear(["0101"], "arapahoe");
    const withSecond = parcelTotalMillsByTaxYear(["0101", "4026"], "arapahoe");
    expect(withSecond.length).toBeGreaterThanOrEqual(2);
    const lastEarly = earlyOnly.at(-1)!;
    const lastBoth = withSecond.find((p) => p.taxYear === lastEarly.taxYear)!;
    expect(lastBoth.value).toBeGreaterThan(lastEarly.value);
  });

  it("returns empty without county or codes", () => {
    expect(parcelTotalMillsByTaxYear(["0101"], null)).toEqual([]);
    expect(parcelTotalMillsByTaxYear([], "arapahoe")).toEqual([]);
  });
});

describe("appraisedValueByTaxYear", () => {
  it("keeps finite actual values sorted by tax year", () => {
    expect(
      appraisedValueByTaxYear([
        {
          taxYear: 2023,
          actualValue: 500_000,
          assessedValue: 30_000,
        },
        {
          taxYear: 2021,
          actualValue: 400_000,
          assessedValue: 28_000,
        },
      ]),
    ).toEqual([
      { taxYear: 2021, value: 400_000 },
      { taxYear: 2023, value: 500_000 },
    ]);
  });
});

describe("resolvePropertyWhyTaxesGoUpModel", () => {
  it("falls back to generic when mills lack two years", () => {
    expect(
      resolvePropertyWhyTaxesGoUpModel({
        levyLineCodes: [],
        countyId: "arapahoe",
        valuationHistory: null,
        priorYearValuesGap: true,
      }),
    ).toEqual({ mode: "generic" });
  });

  it("Arapahoe: mill multi-year + county gap when no appraisal history", () => {
    const model = resolvePropertyWhyTaxesGoUpModel({
      levyLineCodes: ["0101"],
      countyId: "arapahoe",
      valuationHistory: null,
      priorYearValuesGap: true,
    });
    expect(model.mode).toBe("property");
    if (model.mode !== "property") return;
    expect(model.propertyValue).toEqual({ kind: "county_gap" });
    expect(model.millLevy.endValue - model.millLevy.startValue).toBe(
      model.millLevy.delta,
    );
    expect(model.millLevy.direction).toMatch(/higher|lower|unchanged/);
  });

  it("Douglas oddity: property_missing when gap flag off and no history", () => {
    const model = resolvePropertyWhyTaxesGoUpModel({
      levyLineCodes: ["4014"],
      countyId: "douglas",
      valuationHistory: [],
      priorYearValuesGap: false,
    });
    expect(model.mode).toBe("property");
    if (model.mode !== "property") return;
    expect(model.propertyValue).toEqual({ kind: "property_missing" });
  });

  it("uses overlapping years when both series exist", () => {
    const mills = parcelTotalMillsByTaxYear(["0101"], "arapahoe");
    expect(mills.length).toBeGreaterThanOrEqual(2);
    const startYear = mills[0]!.taxYear;
    const endYear = mills.at(-1)!.taxYear;
    const model = resolvePropertyWhyTaxesGoUpModel({
      levyLineCodes: ["0101"],
      countyId: "arapahoe",
      priorYearValuesGap: false,
      valuationHistory: [
        {
          taxYear: startYear,
          actualValue: 400_000,
          assessedValue: 28_000,
        },
        {
          taxYear: endYear,
          actualValue: 520_000,
          assessedValue: 35_000,
        },
      ],
    });
    expect(model.mode).toBe("property");
    if (model.mode !== "property") return;
    expect(model.propertyValue.kind).toBe("change");
    if (model.propertyValue.kind !== "change") return;
    expect(model.propertyValue.face.sinceYear).toBe(startYear);
    expect(model.millLevy.sinceYear).toBe(startYear);
    expect(model.propertyValue.face.delta).toBe(120_000);
    expect(model.propertyValue.face.direction).toBe("higher");
  });

  it("falls to county_gap when appraisal years do not overlap mill years", () => {
    const mills = parcelTotalMillsByTaxYear(["0101"], "arapahoe");
    expect(mills.length).toBeGreaterThanOrEqual(2);
    const firstMillYear = mills[0]!.taxYear;
    const model = resolvePropertyWhyTaxesGoUpModel({
      levyLineCodes: ["0101"],
      countyId: "arapahoe",
      priorYearValuesGap: true,
      valuationHistory: [
        {
          taxYear: firstMillYear - 10,
          actualValue: 100_000,
          assessedValue: 7_000,
        },
        {
          taxYear: firstMillYear - 9,
          actualValue: 110_000,
          assessedValue: 7_500,
        },
      ],
    });
    expect(model.mode).toBe("property");
    if (model.mode !== "property") return;
    expect(model.propertyValue).toEqual({ kind: "county_gap" });
    expect(model.millLevy.sinceYear).toBe(firstMillYear);
  });

  it("pending valuation uses teaching half, not property_missing", () => {
    const model = resolvePropertyWhyTaxesGoUpModel({
      levyLineCodes: ["4014"],
      countyId: "douglas",
      valuationHistory: null,
      priorYearValuesGap: false,
      valuationHistoryPending: true,
    });
    expect(model.mode).toBe("property");
    if (model.mode !== "property") return;
    expect(model.propertyValue).toEqual({ kind: "teaching" });
  });
});

describe("face lines", () => {
  it("formats dollar and mill-levy percent change lines", () => {
    expect(
      formatAppraisedChangeFaceLine({
        sinceYear: 2020,
        startValue: 100,
        endValue: 220,
        delta: 120,
        direction: "higher",
      }),
    ).toBe("$120 higher since 2020");
    expect(
      formatMillsChangeFaceLine({
        sinceYear: 2020,
        startValue: 90,
        endValue: 102.5,
        delta: 12.5,
        direction: "higher",
      }),
    ).toBe("14% higher since 2020");
    expect(
      formatMillsChangeFaceLines({
        sinceYear: 2020,
        startValue: 90,
        endValue: 102.5,
        delta: 12.5,
        direction: "higher",
      }),
    ).toEqual({
      amountLine: "14%",
      direction: "higher",
      sinceLine: "since 2020",
    });
    expect(
      formatAppraisedChangeFaceLines({
        sinceYear: 2020,
        startValue: 100,
        endValue: 220,
        delta: 120,
        direction: "higher",
      }),
    ).toEqual({
      amountLine: "$120",
      direction: "higher",
      sinceLine: "since 2020",
    });
  });

  it("formats mill face with mills when start is 0", () => {
    expect(
      formatMillsChangeFaceLine({
        sinceYear: 2020,
        startValue: 0,
        endValue: 12.5,
        delta: 12.5,
        direction: "higher",
      }),
    ).toBe("12.500 mills higher since 2020");
  });

  it("formats lower and unchanged", () => {
    expect(
      formatAppraisedChangeFaceLine({
        sinceYear: 2020,
        startValue: 100,
        endValue: 50,
        delta: -50,
        direction: "lower",
      }),
    ).toBe("$50 lower since 2020");
    expect(
      formatAppraisedChangeFaceLine({
        sinceYear: 2020,
        startValue: 100,
        endValue: 100,
        delta: 0,
        direction: "unchanged",
      }),
    ).toBe("Unchanged since 2020");
    expect(
      formatMillsChangeFaceLine({
        sinceYear: 2020,
        startValue: 100,
        endValue: 100,
        delta: 0,
        direction: "unchanged",
      }),
    ).toBe("Unchanged since 2020");
  });
});
