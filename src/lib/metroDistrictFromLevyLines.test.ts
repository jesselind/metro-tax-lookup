// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  ARAPAHOE_COUNTY_CONFIG,
  DOUGLAS_COUNTY_CONFIG,
} from "@/lib/countyConfig";
import { shouldShowMetroPurposesSection } from "@/lib/metroDistrictFromLevyLines";

describe("shouldShowMetroPurposesSection", () => {
  const metroMatch = {
    kind: "match" as const,
    districtIds: ["1001-64903-0"],
  };

  it("shows when the resolved county has metroPurposes and the stack matched a metro LG ID", () => {
    expect(
      shouldShowMetroPurposesSection(ARAPAHOE_COUNTY_CONFIG, metroMatch),
    ).toBe(true);
  });

  it("omits when metroPurposes is off even if a shared metro LG ID matched the Arapahoe purpose JSON", () => {
    expect(
      shouldShowMetroPurposesSection(DOUGLAS_COUNTY_CONFIG, metroMatch),
    ).toBe(false);
  });

  it("omits when metroPurposes is on but the stack has no metro LG ID match", () => {
    expect(
      shouldShowMetroPurposesSection(ARAPAHOE_COUNTY_CONFIG, {
        kind: "no_metro_lgid_match",
      }),
    ).toBe(false);
  });

  it("omits when there is no stack hint yet", () => {
    expect(
      shouldShowMetroPurposesSection(ARAPAHOE_COUNTY_CONFIG, undefined),
    ).toBe(false);
  });
});
