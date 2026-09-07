// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_DASHBOARD_LEAD,
  COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_TILE_STATUS,
} from "@/content/countyPriorYearValuesInProgressNote";
import { IN_PROGRESS_CALLOUT_TITLE } from "@/content/inProgressGuidance";
import {
  ARAPAHOE_COUNTY_CONFIG,
  DOUGLAS_COUNTY_CONFIG,
} from "@/lib/countyConfig";

describe("countyPriorYearValuesInProgress copy", () => {
  it("uses working-soon tone without Custom Reports fees or gap claims", () => {
    expect(COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_TILE_STATUS).toMatch(
      /coming soon/i,
    );
    expect(IN_PROGRESS_CALLOUT_TITLE).toBe("IN PROGRESS");
    expect(COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_DASHBOARD_LEAD).toMatch(
      /working to get prior-year assessed values/i,
    );
    expect(COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_DASHBOARD_LEAD).toMatch(
      /soon/i,
    );
    expect(COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_DASHBOARD_LEAD).not.toMatch(
      /\$50/i,
    );
    expect(COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_DASHBOARD_LEAD).not.toMatch(
      /does not appear to be available/i,
    );
    expect(COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_DASHBOARD_LEAD).not.toMatch(
      /no historical information available on the public website/i,
    );
  });

  it("gates Douglas on valuation history and Arapahoe on gap", () => {
    expect(DOUGLAS_COUNTY_CONFIG.features.priorYearValuesInProgress).toBe(
      false,
    );
    expect(DOUGLAS_COUNTY_CONFIG.features.valuationHistoryShards).toBe(true);
    expect(DOUGLAS_COUNTY_CONFIG.features.priorYearValuesGap).toBe(false);
    expect(ARAPAHOE_COUNTY_CONFIG.features.priorYearValuesInProgress).toBe(
      false,
    );
    expect(ARAPAHOE_COUNTY_CONFIG.features.priorYearValuesGap).toBe(true);
  });
});
