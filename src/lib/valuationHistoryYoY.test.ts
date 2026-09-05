// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import {
  buildValuationYoYSummary,
  valuationYoYPairFromHistory,
  valueDeltaFromHistory,
} from "@/lib/valuationHistoryYoY";

const series = [
  { taxYear: 2025, actualValue: 360000, assessedValue: 25740 },
  { taxYear: 2026, actualValue: 380000, assessedValue: 27170 },
];

describe("valuationHistoryYoY", () => {
  it("computes assessed and actual deltas", () => {
    expect(valueDeltaFromHistory(series, 27170, 2026, "assessed")).toBe(1430);
    expect(valueDeltaFromHistory(series, 380000, 2026, "actual")).toBe(20000);
    expect(valueDeltaFromHistory(series, 25740, 2026, "assessed")).toBeNull();
  });

  it("builds YoY summary with tax impact for assessed", () => {
    const pair = valuationYoYPairFromHistory(series, 27170, 2026, "assessed");
    expect(pair).not.toBeNull();
    const summary = buildValuationYoYSummary(pair!, "assessed", 68.4);
    expect(summary.headline).toMatch(/higher than last year/);
    expect(summary.differenceLabel).toBe("+$1,430");
    expect(summary.taxImpactDollars).toBe(97);
  });
});
