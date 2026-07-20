// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import type { LevyDistrictFromJson } from "@/lib/levyTypes";
import {
  levyPurposeRateChanged,
  listMetroLevyPurposeChanges,
  metroBillImpactCalloutForDistrictIds,
  metroDistrictDeltaDollarsFromRates,
  metroDistrictTileYoYSummary,
  metroLevyDistrictTotalChange,
  metroLgIdsWithPurposeMillChanges,
  metroPurposeChangeSummaryPhrase,
  metroYoYDirectionFromRateDelta,
} from "@/lib/metroLevyYearOverYear";
import type { CommittedLevyLine } from "@/lib/committedLevyLine";

function district(
  partial: Partial<LevyDistrictFromJson> &
    Pick<LevyDistrictFromJson, "districtId" | "name">,
): LevyDistrictFromJson {
  return {
    type: "metro",
    ...partial,
  };
}

describe("levyPurposeRateChanged", () => {
  it("is false when previous is missing", () => {
    expect(
      levyPurposeRateChanged({
        rateMillsCurrent: 0.05,
        rateMillsPrevious: null,
      }),
    ).toBe(false);
  });

  it("is false when current matches previous", () => {
    expect(
      levyPurposeRateChanged({
        rateMillsCurrent: 0.05,
        rateMillsPrevious: 0.05,
      }),
    ).toBe(false);
  });

  it("is true when current differs from previous", () => {
    expect(
      levyPurposeRateChanged({
        rateMillsCurrent: 0.06,
        rateMillsPrevious: 0.05,
      }),
    ).toBe(true);
  });
});

describe("listMetroLevyPurposeChanges", () => {
  it("lists every changed purpose and skips unchanged or missing previous", () => {
    const districts = [
      district({
        districtId: "a",
        name: "Alpha Metro",
        levies: [
          {
            purposeRaw: "General Operating",
            purposeCategory: "operations",
            rateMillsCurrent: 0.02,
            rateMillsPrevious: 0.01,
            taborExempt: null,
            rawRowIndex: 1,
          },
          {
            purposeRaw: "Debt Service",
            purposeCategory: "debt_service",
            rateMillsCurrent: 0.03,
            rateMillsPrevious: 0.03,
            taborExempt: null,
            rawRowIndex: 2,
          },
          {
            purposeRaw: "Other",
            purposeCategory: "other",
            rateMillsCurrent: 0.01,
            rateMillsPrevious: null,
            taborExempt: null,
            rawRowIndex: 3,
          },
        ],
      }),
    ];

    const changes = listMetroLevyPurposeChanges(districts);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      districtName: "Alpha Metro",
      purposeRaw: "General Operating",
      rateCurrent: 0.02,
      ratePrevious: 0.01,
      rateDelta: 0.01,
    });
  });
});

describe("metroLevyDistrictTotalChange", () => {
  it("sums part purposes when there is no summary Total row", () => {
    const d = district({
      districtId: "b",
      name: "Beta Metro",
      levies: [
        {
          purposeRaw: "General Operating",
          purposeCategory: "operations",
          rateMillsCurrent: 0.02,
          rateMillsPrevious: 0.01,
          taborExempt: null,
          rawRowIndex: 1,
        },
        {
          purposeRaw: "Debt Service",
          purposeCategory: "debt_service",
          rateMillsCurrent: 0.04,
          rateMillsPrevious: 0.05,
          taborExempt: null,
          rawRowIndex: 2,
        },
      ],
    });

    const total = metroLevyDistrictTotalChange(d);
    expect(total.totalBasis).toBe("sum_of_parts");
    expect(total.rateCurrentTotal).toBeCloseTo(0.06);
    expect(total.ratePreviousTotal).toBeCloseTo(0.06);
    expect(total.rateDelta).toBeCloseTo(0);
    expect(total.hasPurposeChanges).toBe(true);
  });

  it("uses the summary Total alone when Total and parts are both present", () => {
    const d = district({
      districtId: "murphy",
      name: "Murphy Creek Metropolitan District No. 2",
      levies: [
        {
          purposeRaw: "Total",
          purposeCategory: "other",
          rateMillsCurrent: 0.071105,
          rateMillsPrevious: 0.067209,
          taborExempt: null,
          rawRowIndex: 1,
        },
        {
          purposeRaw: "Bonds",
          purposeCategory: "debt_service",
          rateMillsCurrent: 0.058289,
          rateMillsPrevious: 0.055525,
          taborExempt: null,
          rawRowIndex: 2,
        },
        {
          purposeRaw: "Contractual Obligation",
          purposeCategory: "debt_service",
          rateMillsCurrent: 0.001165,
          rateMillsPrevious: 0.011684,
          taborExempt: null,
          rawRowIndex: 3,
        },
      ],
    });

    const total = metroLevyDistrictTotalChange(d);
    expect(total.totalBasis).toBe("summary_total_row");
    expect(total.rateCurrentTotal).toBeCloseTo(0.071105);
    expect(total.ratePreviousTotal).toBeCloseTo(0.067209);
    expect(total.rateDelta).toBeCloseTo(0.071105 - 0.067209);
    expect(total.hasPurposeChanges).toBe(true);
  });

  it("returns null previous total when any part purpose lacks a previous rate", () => {
    const d = district({
      districtId: "d",
      name: "Delta Metro",
      levies: [
        {
          purposeRaw: "General Operating",
          purposeCategory: "operations",
          rateMillsCurrent: 0.02,
          rateMillsPrevious: 0.01,
          taborExempt: null,
          rawRowIndex: 1,
        },
        {
          purposeRaw: "Debt Service",
          purposeCategory: "debt_service",
          rateMillsCurrent: 0.03,
          rateMillsPrevious: null,
          taborExempt: null,
          rawRowIndex: 2,
        },
      ],
    });

    const total = metroLevyDistrictTotalChange(d);
    expect(total.rateCurrentTotal).toBeCloseTo(0.05);
    expect(total.ratePreviousTotal).toBeNull();
    expect(total.rateDelta).toBeNull();
    expect(total.hasPurposeChanges).toBe(true);
  });
});

describe("metroDistrictDeltaDollarsFromRates", () => {
  it("matches assessed × mills / 1000 rounding", () => {
    expect(metroDistrictDeltaDollarsFromRates(100_000, 0.06, 0.05)).toBe(
      1000,
    );
  });
});

describe("metroBillImpactCalloutForDistrictIds", () => {
  it("returns null when any district lacks a prior total", () => {
    const districts = [
      district({
        districtId: "a",
        name: "Alpha",
        levies: [
          {
            purposeRaw: "General Operating",
            purposeCategory: "operations",
            rateMillsCurrent: 0.02,
            rateMillsPrevious: 0.01,
            taborExempt: null,
            rawRowIndex: 1,
          },
        ],
      }),
      district({
        districtId: "b",
        name: "Beta",
        levies: [
          {
            purposeRaw: "General Operating",
            purposeCategory: "operations",
            rateMillsCurrent: 0.03,
            rateMillsPrevious: null,
            taborExempt: null,
            rawRowIndex: 1,
          },
        ],
      }),
    ];

    expect(
      metroBillImpactCalloutForDistrictIds(["a", "b"], districts, 100_000),
    ).toBeNull();
  });

  it("returns a dollar callout when all districts have complete prior totals", () => {
    const districts = [
      district({
        districtId: "a",
        name: "Alpha",
        levies: [
          {
            purposeRaw: "General Operating",
            purposeCategory: "operations",
            rateMillsCurrent: 0.02,
            rateMillsPrevious: 0.01,
            taborExempt: null,
            rawRowIndex: 1,
          },
        ],
      }),
    ];

    const callout = metroBillImpactCalloutForDistrictIds(
      ["a"],
      districts,
      100_000,
    );
    expect(callout).toMatchObject({
      direction: "more",
      message:
        "You're paying $1,000 more than last year for your metro district.",
    });
  });
});

describe("metroPurposeChangeSummaryPhrase", () => {
  it("pluralizes change count and metro scope", () => {
    expect(metroPurposeChangeSummaryPhrase(2, true)).toBe(
      "2 mill rate changes for your metro districts from last year.",
    );
    expect(metroPurposeChangeSummaryPhrase(0, false)).toBe(
      "No mill rate changes from last year for your metro district.",
    );
  });
});

describe("metroYoYDirectionFromRateDelta", () => {
  it("returns neutral for no meaningful change", () => {
    expect(metroYoYDirectionFromRateDelta(0)).toBe("neutral");
  });

  it("returns more or less from sign", () => {
    expect(metroYoYDirectionFromRateDelta(0.001)).toBe("more");
    expect(metroYoYDirectionFromRateDelta(-0.001)).toBe("less");
  });
});

describe("metroDistrictTileYoYSummary", () => {
  it("prefers dollar headline when assessed delta is known", () => {
    expect(metroDistrictTileYoYSummary(4, 0.617, true)).toMatchObject({
      direction: "more",
      headline: "You're paying $4 more than last year.",
    });
  });

  it("uses neutral copy when only purpose rows changed", () => {
    expect(metroDistrictTileYoYSummary(null, null, true)).toMatchObject({
      direction: "neutral",
      headline: "Parts of this metro district rate changed from last year.",
    });
  });
});

describe("metroLgIdsWithPurposeMillChanges", () => {
  it("flags bundled metro LG IDs with published purpose changes", () => {
    const lines: CommittedLevyLine[] = [
      {
        id: "metro-line",
        authority: "E2E metro",
        mills: 50.804,
        dolaMatch: {
          method: "fuzzy",
          confidence: "high",
          lgId: "65214",
        },
      },
    ];
    expect(metroLgIdsWithPurposeMillChanges(lines).has("65214")).toBe(true);
  });

  it("omits LG IDs with no published previous rates", () => {
    const lines: CommittedLevyLine[] = [
      {
        id: "school-line",
        authority: "E2E school",
        mills: 20,
        dolaMatch: {
          method: "fuzzy",
          confidence: "high",
          lgId: "99999",
        },
      },
    ];
    expect(metroLgIdsWithPurposeMillChanges(lines).size).toBe(0);
  });
});
