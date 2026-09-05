// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { buildValuationHistoryChartLayout } from "@/lib/valuationHistoryChartLayout";

describe("valuationHistoryChartLayout", () => {
  it("builds a line path for two or more points", () => {
    const layout = buildValuationHistoryChartLayout([
      { taxYear: 2024, value: 25000 },
      { taxYear: 2025, value: 26000 },
      { taxYear: 2026, value: 27170 },
    ]);
    expect(layout).not.toBeNull();
    expect(layout!.points).toHaveLength(3);
    expect(layout!.linePath).toMatch(/^M /);
    expect(layout!.points[0]!.showYearLabel).toBe(true);
    expect(layout!.points.at(-1)!.showYearLabel).toBe(true);
  });

  it("returns null for fewer than two points", () => {
    expect(
      buildValuationHistoryChartLayout([{ taxYear: 2026, value: 1 }]),
    ).toBeNull();
  });
});
