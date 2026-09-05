// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD,
  COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD_DOUGLAS,
  COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LINK_LABEL,
} from "@/content/countyPriorYearValuesGapNote";
import { DOUGLAS_ASSESSOR_REAL_ESTATE_DATA_CENTER_URL } from "@/content/douglasCountyDataGapNote";
import {
  ARAPAHOE_COUNTY_CONFIG,
  DOUGLAS_COUNTY_CONFIG,
} from "@/lib/countyConfig";
import { SYNTHETIC_DOUGLAS_PIN } from "@/lib/syntheticTestIds";
import { safeCountyParcelRecordUrl } from "@/lib/safeExternalHref";

describe("countyPriorYearValuesGap copy", () => {
  it("keeps Arapahoe assessor guidance that the public site has no history", () => {
    expect(COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD).toMatch(
      /no historical information available on the public website/i,
    );
  });

  it("Douglas dashboard lead points to the property page and still-looking bulk tone", () => {
    expect(COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD_DOUGLAS).toMatch(
      /prior-year assessed values/i,
    );
    expect(COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD_DOUGLAS).toMatch(
      /property details/i,
    );
    expect(COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD_DOUGLAS).toMatch(
      /still looking/i,
    );
    expect(COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD_DOUGLAS).not.toMatch(
      /Property_Values\.txt/i,
    );
    expect(COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD_DOUGLAS).not.toMatch(/\$50/i);
    expect(COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD_DOUGLAS).not.toMatch(
      /does not appear to be available/i,
    );
    expect(COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD_DOUGLAS).not.toMatch(
      /no historical information available on the public website/i,
    );
    expect(COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LINK_LABEL).toMatch(
      /property details/i,
    );
  });

  it("Douglas custom-report URL stays available for last-resort cite", () => {
    expect(DOUGLAS_ASSESSOR_REAL_ESTATE_DATA_CENTER_URL).toBe(
      "https://www.douglasco.gov/assessor/real-estate-data-center/#:~:text=Assessor%20Custom%20Reports",
    );
  });

  it("builds a Douglas Assessor property-page href; prior-year gap chrome is off", () => {
    expect(
      safeCountyParcelRecordUrl(SYNTHETIC_DOUGLAS_PIN, DOUGLAS_COUNTY_CONFIG),
    ).toBe(
      `https://apps.douglas.co.us/assessor/web/#/details/2026/${SYNTHETIC_DOUGLAS_PIN}`,
    );
    expect(DOUGLAS_COUNTY_CONFIG.features.priorYearValuesGap).toBe(false);
    expect(DOUGLAS_COUNTY_CONFIG.features.priorYearValuesInProgress).toBe(true);
    expect(ARAPAHOE_COUNTY_CONFIG.features.priorYearValuesGap).toBe(true);
    expect(ARAPAHOE_COUNTY_CONFIG.features.priorYearValuesInProgress).toBe(
      false,
    );
  });
});
