// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  authorityMillsChartAriaLabel,
  authorityMillsChartYearLabelIndices,
  buildAuthorityMillsChartLayout,
} from "@/lib/authorityMillsChartLayout";

describe("authorityMillsChartLayout", () => {
  it("labels every year when the series is short", () => {
    expect(authorityMillsChartYearLabelIndices(4)).toEqual([0, 1, 2, 3]);
  });

  it("thins year labels for longer series while keeping endpoints", () => {
    expect(authorityMillsChartYearLabelIndices(8)).toEqual([0, 2, 4, 5, 7]);
  });

  it("builds a line path with ascending x coordinates", () => {
    const layout = buildAuthorityMillsChartLayout([
      { taxYear: 2023, mills: 50 },
      { taxYear: 2024, mills: 51 },
      { taxYear: 2025, mills: 52 },
    ]);
    expect(layout).not.toBeNull();
    expect(layout!.linePath.startsWith("M ")).toBe(true);
    expect(layout!.points[0]!.x).toBeLessThan(layout!.points[2]!.x);
    expect(layout!.points[0]!.y).toBeGreaterThan(layout!.points[2]!.y);
    expect(layout!.fillBaselineY).toBeGreaterThan(0);
  });

  it("summarizes endpoints for SVG aria-label", () => {
    expect(
      authorityMillsChartAriaLabel([
        { taxYear: 2018, mills: 50.071 },
        { taxYear: 2025, mills: 51.071 },
      ]),
    ).toContain("Tax Year 2018");
    expect(
      authorityMillsChartAriaLabel([
        { taxYear: 2018, mills: 50.071 },
        { taxYear: 2025, mills: 51.071 },
      ]),
    ).toContain("Tax Year 2025");
  });
});
