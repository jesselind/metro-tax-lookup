// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  YOY_THEORETICAL_DOLLAR_POPOVER_BODY_ARAPAHOE,
  YOY_THEORETICAL_DOLLAR_POPOVER_BODY_DOUGLAS,
  YOY_THEORETICAL_DOLLAR_POPOVER_DOUGLAS_LINK_LABEL,
  yoyTheoreticalDollarPopoverCopy,
} from "@/content/levyYoYCopy";
import { DOUGLAS_COUNTY_CONFIG } from "@/lib/countyConfig";
import { SYNTHETIC_DOUGLAS_PIN } from "@/lib/syntheticTestIds";
import { safeCountyParcelRecordUrl } from "@/lib/safeExternalHref";

describe("yoyTheoreticalDollarPopoverCopy", () => {
  it("uses Arapahoe assessor guidance for Arapahoe and unknown counties", () => {
    expect(yoyTheoreticalDollarPopoverCopy("arapahoe").plainBody).toBe(
      YOY_THEORETICAL_DOLLAR_POPOVER_BODY_ARAPAHOE,
    );
    expect(yoyTheoreticalDollarPopoverCopy(null).kind).toBe("arapahoe");
    expect(yoyTheoreticalDollarPopoverCopy("elpaso").kind).toBe("arapahoe");
    expect(YOY_THEORETICAL_DOLLAR_POPOVER_BODY_ARAPAHOE).toMatch(
      /no historical information available on the public website/i,
    );
  });

  it("uses Douglas copy that points to on-site valuation history", () => {
    const copy = yoyTheoreticalDollarPopoverCopy("douglas");
    expect(copy.kind).toBe("douglas");
    expect(copy.plainBody).toBe(YOY_THEORETICAL_DOLLAR_POPOVER_BODY_DOUGLAS);
    expect(copy.plainBody).toMatch(/Assessed value above/i);
    expect(copy.plainBody).toMatch(/this year's assessed value/i);
    expect(copy.plainBody).not.toMatch(/still looking/i);
    expect(copy.plainBody).not.toMatch(/\$50/i);
    expect(copy.plainBody).not.toMatch(
      /no historical information available on the public website/i,
    );
  });

  it("builds a Douglas Assessor property-page href for the popover link", () => {
    expect(
      safeCountyParcelRecordUrl(SYNTHETIC_DOUGLAS_PIN, DOUGLAS_COUNTY_CONFIG),
    ).toBe(
      `https://apps.douglas.co.us/assessor/web/#/details/2026/${SYNTHETIC_DOUGLAS_PIN}`,
    );
    expect(YOY_THEORETICAL_DOLLAR_POPOVER_DOUGLAS_LINK_LABEL).toMatch(
      /property details/i,
    );
  });
});
