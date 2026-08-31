// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { COUNTY_CONFIG_BY_ID } from "@/lib/countyConfig";
import {
  WIRED_COUNTIES,
  WIRED_COUNTY_IDS,
  dolaCertifyingCountyForWiredCounty,
} from "@/lib/wiredCounties";

describe("wiredCounties manifest", () => {
  it("lists every CountyConfig entry (wired app counties only)", () => {
    expect([...WIRED_COUNTY_IDS].sort()).toEqual(
      Object.keys(COUNTY_CONFIG_BY_ID).sort(),
    );
  });

  it("resolves DOLA certifying county names", () => {
    for (const row of WIRED_COUNTIES) {
      expect(dolaCertifyingCountyForWiredCounty(row.id)).toBe(row.dolaCertifyingCounty);
      expect(COUNTY_CONFIG_BY_ID[row.id]?.dolaCertifyingCounty).toBe(
        row.dolaCertifyingCounty,
      );
    }
  });
});
