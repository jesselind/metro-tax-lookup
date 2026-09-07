// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import {
  assessedForLevyTaxYear,
  buildLevyDollarAssessedContext,
  levyDollarsPairForTaxYears,
  scaleLevyDollarAssessedContextPerUnit,
} from "@/lib/levyDollarAssessedContext";

describe("levyDollarAssessedContext", () => {
  const series = [
    { taxYear: 2024, actualValue: 350000, assessedValue: 25000 },
    { taxYear: 2025, actualValue: 360000, assessedValue: 25740 },
  ];

  it("pairs parcel assessed to bill tax year (not assessment year) for mill chart", () => {
    // Arapahoe: assessment year 2026, tax year 2025; mill AUTH series ends at 2025.
    const ctx = buildLevyDollarAssessedContext(null, 6800, 2025);
    expect(ctx).not.toBeNull();
    expect(assessedForLevyTaxYear(ctx, 2025)).toBe(6800);
    expect(assessedForLevyTaxYear(ctx, 2026)).toBeNull();
    expect(assessedForLevyTaxYear(ctx, 2018)).toBeNull();
  });

  it("does not place current assessed on assessment year when bill tax year is passed", () => {
    const ctx = buildLevyDollarAssessedContext(null, 6800, 2026);
    expect(assessedForLevyTaxYear(ctx, 2025)).toBeNull();
    expect(assessedForLevyTaxYear(ctx, 2026)).toBe(6800);
  });

  it("prefers loaded parcel assessed for the current tax year", () => {
    const ctx = buildLevyDollarAssessedContext(series, 27170, 2026);
    expect(ctx).not.toBeNull();
    expect(assessedForLevyTaxYear(ctx, 2026)).toBe(27170);
    expect(assessedForLevyTaxYear(ctx, 2025)).toBe(25740);
    expect(assessedForLevyTaxYear(ctx, 2010)).toBeNull();
  });

  it("uses per-year assessed in levy dollar pairs when prior year exists", () => {
    const ctx = buildLevyDollarAssessedContext(series, 27170, 2026);
    const pair = levyDollarsPairForTaxYears(50, 52, 2025, 2026, ctx);
    expect(pair.usesTheoreticalAssessed).toBe(false);
    expect(pair.previousDollars).toBe(Math.round((25740 * 50) / 1000));
    expect(pair.currentDollars).toBe(Math.round((27170 * 52) / 1000));
  });

  it("falls back to theoretical when prior-year assessed is missing", () => {
    const ctx = buildLevyDollarAssessedContext(null, 100_000, 2026);
    const pair = levyDollarsPairForTaxYears(50, 52, 2025, 2026, ctx);
    expect(pair.usesTheoreticalAssessed).toBe(true);
    expect(pair.previousDollars).toBe(5000);
    expect(pair.currentDollars).toBe(5200);
  });

  it("scales assessed context per rent unit", () => {
    const ctx = buildLevyDollarAssessedContext(series, 27170, 2026)!;
    const scaled = scaleLevyDollarAssessedContextPerUnit(ctx, 2);
    expect(scaled.currentAssessed).toBe(13585);
    expect(assessedForLevyTaxYear(scaled, 2025)).toBe(12870);
  });
});
