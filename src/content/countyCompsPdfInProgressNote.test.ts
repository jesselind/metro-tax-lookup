// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  COUNTY_COMPS_PDF_IN_PROGRESS_DASHBOARD_LEAD,
  COUNTY_COMPS_PDF_IN_PROGRESS_TILE_STATUS,
} from "@/content/countyCompsPdfInProgressNote";
import { IN_PROGRESS_CALLOUT_TITLE } from "@/content/inProgressGuidance";
import {
  ARAPAHOE_COUNTY_CONFIG,
  DOUGLAS_COUNTY_CONFIG,
} from "@/lib/countyConfig";

describe("countyCompsPdfInProgress copy", () => {
  it("uses Coming soon tile status and IN PROGRESS title", () => {
    expect(COUNTY_COMPS_PDF_IN_PROGRESS_TILE_STATUS).toMatch(/^Coming soon$/);
    expect(IN_PROGRESS_CALLOUT_TITLE).toBe("IN PROGRESS");
    expect(COUNTY_COMPS_PDF_IN_PROGRESS_DASHBOARD_LEAD).toMatch(
      /comparable properties PDF/i,
    );
    expect(COUNTY_COMPS_PDF_IN_PROGRESS_DASHBOARD_LEAD).toMatch(
      /not wired/i,
    );
    expect(COUNTY_COMPS_PDF_IN_PROGRESS_DASHBOARD_LEAD).not.toMatch(
      /COUNTY DATA GAP/i,
    );
    expect(COUNTY_COMPS_PDF_IN_PROGRESS_DASHBOARD_LEAD).not.toMatch(/\u2014/);
  });

  it("is on for Douglas and off for Arapahoe", () => {
    expect(DOUGLAS_COUNTY_CONFIG.features.compsPdfInProgress).toBe(true);
    expect(DOUGLAS_COUNTY_CONFIG.features.compsPdf).toBe(false);
    expect(ARAPAHOE_COUNTY_CONFIG.features.compsPdfInProgress).toBe(false);
  });
});
