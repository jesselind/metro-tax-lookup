// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  AUTHORITY_MILLS_CURRENT_TAX_YEAR,
  AUTHORITY_MILLS_HISTORY_MIN_POINTS,
  AUTHORITY_MILLS_PREVIOUS_TAX_YEAR,
  authorityRateTablePageForParcel,
  authorityMillsForTaxYear,
  authorityMillsSeries,
  authorityTotalMillsChanged,
  authorityTotalMillsYoY,
  deepLinkLevyPercentageUrlForParcel,
  levyPercentageResidentLinkForTaxYear,
  levyPercentageResidentUrlForTaxYear,
  normalizeLevyPercentagePdfTag,
} from "@/lib/authorityMillsHistory";
import { COUNTY_MILLS_YOY_EPS } from "@/lib/metroLevyYearOverYear";

describe("authorityMillsHistory", () => {
  it("exposes Tax Year 2024 / 2025 from bundled meta", () => {
    expect(AUTHORITY_MILLS_PREVIOUS_TAX_YEAR).toBe(2024);
    expect(AUTHORITY_MILLS_CURRENT_TAX_YEAR).toBe(2025);
  });

  it("looks up AUTH mills without inventing missing years", () => {
    expect(authorityMillsForTaxYear("0101", 2025)).toBe(51.071);
    expect(authorityMillsForTaxYear("0101", 2024)).toBe(50.071);
    expect(authorityMillsForTaxYear("9999", 2025)).toBeNull();
  });

  it("reports YoY delta when both years exist", () => {
    const yoy = authorityTotalMillsYoY("0101");
    expect(yoy).toMatchObject({
      millsPrevious: 50.071,
      millsCurrent: 51.071,
      millsDelta: 1,
    });
    expect(authorityTotalMillsChanged("0101", COUNTY_MILLS_YOY_EPS)).toBe(true);
    expect(authorityTotalMillsChanged("9999", COUNTY_MILLS_YOY_EPS)).toBe(false);
  });

  it("returns a multi-year AUTH series for modal history chart", () => {
    const series = authorityMillsSeries("0101");
    expect(series.length).toBeGreaterThanOrEqual(AUTHORITY_MILLS_HISTORY_MIN_POINTS);
    expect(series[0]?.taxYear).toBe(2018);
    expect(series[series.length - 1]?.taxYear).toBe(2025);
  });

  it("bundles resident Levy % PDF urls for every tax year in meta", () => {
    for (const taxYear of [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]) {
      expect(levyPercentageResidentUrlForTaxYear(taxYear)).toMatch(/^https:\/\//);
      expect(levyPercentageResidentLinkForTaxYear(taxYear).text).toContain(
        String(taxYear),
      );
    }
  });

  it("normalizes parcel tax-area codes to four-digit PDF TAGs", () => {
    expect(normalizeLevyPercentagePdfTag("747")).toBe("0747");
    expect(normalizeLevyPercentagePdfTag("0747")).toBe("0747");
    expect(normalizeLevyPercentagePdfTag("E2E")).toBeNull();
  });

  it("maps one parcel TAG to the authority-specific page", () => {
    expect(authorityRateTablePageForParcel(2024, "0601", "747")).toBe(95);
    expect(authorityRateTablePageForParcel(2024, "4100", "747")).toBe(96);
  });

  it("deep-links known rate-table sources and preserves honest fallbacks", () => {
    const rateTable2024 = levyPercentageResidentUrlForTaxYear(2024);
    expect(
      deepLinkLevyPercentageUrlForParcel(rateTable2024, "0601", "747"),
    ).toBe(`${rateTable2024}#page=95`);
    expect(
      deepLinkLevyPercentageUrlForParcel(rateTable2024, "0601", "E2E"),
    ).toBe(rateTable2024);
    expect(
      deepLinkLevyPercentageUrlForParcel(
        "https://example.gov/not-a-rate-table.pdf",
        "0601",
        "747",
      ),
    ).toBe("https://example.gov/not-a-rate-table.pdf");
  });

  it("does not load another county's AUTH mills for Douglas stack codes", () => {
    const series = authorityMillsSeries("4014", "douglas");
    expect(series).toEqual([]);
    expect(authorityTotalMillsYoY("4014", "douglas")).toBeNull();
  });
});
