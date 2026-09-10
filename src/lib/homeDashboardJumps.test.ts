// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { buildHomeDashboardJumps } from "@/lib/homeDashboardJumps";

describe("buildHomeDashboardJumps", () => {
  it("omits sections that are not on the page", () => {
    expect(
      buildHomeDashboardJumps({
        showLevies: true,
        showPropertyDetails: false,
        showCountyCompare: false,
        showInAppComps: false,
        showFeedback: true,
        countyDisplayName: "Arapahoe",
      }).map((j) => j.id),
    ).toEqual(["levies", "feedback"]);
  });

  it("includes county name in the compare label", () => {
    const jumps = buildHomeDashboardJumps({
      showLevies: false,
      showPropertyDetails: false,
      showCountyCompare: true,
      showInAppComps: false,
      showFeedback: false,
      countyDisplayName: "Douglas",
    });
    expect(jumps).toHaveLength(1);
    expect(jumps[0]?.label).toBe("See how Douglas displays your data");
  });

  it("keeps page order when all sections are present", () => {
    expect(
      buildHomeDashboardJumps({
        showLevies: true,
        showPropertyDetails: true,
        showCountyCompare: true,
        showInAppComps: true,
        showFeedback: true,
        countyDisplayName: "Arapahoe",
      }).map((j) => j.id),
    ).toEqual([
      "levies",
      "property-details",
      "county-compare",
      "comps",
      "feedback",
    ]);
  });
});
