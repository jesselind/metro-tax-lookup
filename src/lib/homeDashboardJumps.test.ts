// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { buildHomeDashboardJumps } from "@/lib/homeDashboardJumps";

const baseFlags = {
  showRentPressure: false,
  showLevies: false,
  showPropertyDetails: false,
  showAppraisedAssessed: false,
  showSaleHistory: false,
  showBuildings: false,
  showArea: false,
  showLandLine: false,
  showPermits: false,
  showCountyCompare: false,
  showInAppComps: false,
  showFeedback: false,
  countyDisplayName: "Arapahoe",
};

describe("buildHomeDashboardJumps", () => {
  it("omits sections that are not on the page", () => {
    expect(
      buildHomeDashboardJumps({
        ...baseFlags,
        showLevies: true,
        showFeedback: true,
      }).map((j) => j.id),
    ).toEqual(["levies", "feedback"]);
  });

  it("includes county name in the compare label", () => {
    const jumps = buildHomeDashboardJumps({
      ...baseFlags,
      showCountyCompare: true,
      countyDisplayName: "Douglas",
    });
    expect(jumps.map((j) => j.id)).toEqual(["county-compare"]);
    expect(jumps[0]?.label).toBe("See how Douglas displays your data");
  });

  it("keeps page order for Own Real with all subsections", () => {
    expect(
      buildHomeDashboardJumps({
        ...baseFlags,
        showLevies: true,
        showPropertyDetails: true,
        showAppraisedAssessed: true,
        showSaleHistory: true,
        showBuildings: true,
        showArea: true,
        showLandLine: true,
        showPermits: true,
        showCountyCompare: true,
        showInAppComps: true,
        showFeedback: true,
      }).map((j) => j.id),
    ).toEqual([
      "levies",
      "property-details",
      "appraised-assessed",
      "sale-history",
      "buildings",
      "area",
      "land-line",
      "permits",
      "comps",
      "county-compare",
      "feedback",
    ]);
  });

  it("leads with levy when present (no Summary jump)", () => {
    const jumps = buildHomeDashboardJumps({
      ...baseFlags,
      showLevies: true,
    });
    expect(jumps).toEqual([
      {
        id: "levies",
        label: "Where is your money going?",
        focusId: "home-levy-stack-subheading",
        highlightId: "home-levy-stack-tiles",
      },
    ]);
  });

  it("curates Rent jumps: pressure, levy, compare, feedback", () => {
    expect(
      buildHomeDashboardJumps({
        ...baseFlags,
        showRentPressure: true,
        showLevies: true,
        showCountyCompare: true,
        showFeedback: true,
      }).map((j) => j.id),
    ).toEqual(["rent-pressure", "levies", "county-compare", "feedback"]);
  });

  it("curates BPP jumps without real-property-only subsections", () => {
    expect(
      buildHomeDashboardJumps({
        ...baseFlags,
        showLevies: true,
        showPropertyDetails: true,
        showAppraisedAssessed: true,
        showCountyCompare: true,
        showFeedback: true,
      }).map((j) => j.id),
    ).toEqual([
      "levies",
      "property-details",
      "appraised-assessed",
      "county-compare",
      "feedback",
    ]);
  });

  it("returns an empty list when nothing is mounted", () => {
    expect(buildHomeDashboardJumps(baseFlags)).toEqual([]);
  });
});
