// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import {
  showMillsChartFooterLedger,
  showPriorYearGapOnMillsChartFooter,
} from "@/lib/authorityMillsChartFooter";

describe("authorityMillsChartFooter", () => {
  describe("showPriorYearGapOnMillsChartFooter", () => {
    it("is on when gap flag is set, oldest lacks dollars, and newest has dollars", () => {
      expect(
        showPriorYearGapOnMillsChartFooter({
          priorYearValuesGap: true,
          oldestEndpointHasDollars: false,
          newestEndpointHasDollars: true,
          countyId: "arapahoe",
        }),
      ).toBe(true);
    });

    it("is off when newest endpoint has no dollars (gap badge alone is noise)", () => {
      expect(
        showPriorYearGapOnMillsChartFooter({
          priorYearValuesGap: true,
          oldestEndpointHasDollars: false,
          newestEndpointHasDollars: false,
          countyId: "arapahoe",
        }),
      ).toBe(false);
    });

    it("is off when Douglas ships valuation history (gap flag false)", () => {
      expect(
        showPriorYearGapOnMillsChartFooter({
          priorYearValuesGap: false,
          oldestEndpointHasDollars: false,
          newestEndpointHasDollars: true,
          countyId: "douglas",
        }),
      ).toBe(false);
    });

    it("is off when oldest endpoint already has per-year assessed dollars", () => {
      expect(
        showPriorYearGapOnMillsChartFooter({
          priorYearValuesGap: true,
          oldestEndpointHasDollars: true,
          newestEndpointHasDollars: true,
          countyId: "arapahoe",
        }),
      ).toBe(false);
    });

    it("is off without a county id", () => {
      expect(
        showPriorYearGapOnMillsChartFooter({
          priorYearValuesGap: true,
          oldestEndpointHasDollars: false,
          newestEndpointHasDollars: true,
          countyId: null,
        }),
      ).toBe(false);
    });
  });

  describe("showMillsChartFooterLedger", () => {
    it("shows when prior-year gap badge or either endpoint has dollars", () => {
      expect(
        showMillsChartFooterLedger({
          showPriorYearGap: true,
          oldestEndpointHasDollars: false,
          newestEndpointHasDollars: false,
        }),
      ).toBe(true);
      expect(
        showMillsChartFooterLedger({
          showPriorYearGap: false,
          oldestEndpointHasDollars: true,
          newestEndpointHasDollars: false,
        }),
      ).toBe(true);
      expect(
        showMillsChartFooterLedger({
          showPriorYearGap: false,
          oldestEndpointHasDollars: false,
          newestEndpointHasDollars: true,
        }),
      ).toBe(true);
    });

    it("hides when neither endpoint has dollars and no gap badge", () => {
      expect(
        showMillsChartFooterLedger({
          showPriorYearGap: false,
          oldestEndpointHasDollars: false,
          newestEndpointHasDollars: false,
        }),
      ).toBe(false);
    });
  });
});
