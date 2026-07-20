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
  metroPurposeChangesWorthListingSeparately,
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

  it("omits summary Total when itemized parts exist; keeps part changes", () => {
    const districts = [
      district({
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
      }),
    ];

    const changes = listMetroLevyPurposeChanges(districts);
    expect(changes.map((c) => c.purposeRaw)).toEqual([
      "Bonds",
      "Contractual Obligation",
    ]);
  });

  it("includes Total when it is the only levy on the district", () => {
    const districts = [
      district({
        districtId: "solo",
        name: "Solo Metro",
        levies: [
          {
            purposeRaw: "Total",
            purposeCategory: "other",
            rateMillsCurrent: 0.05,
            rateMillsPrevious: 0.04,
            taborExempt: null,
            rawRowIndex: 1,
          },
        ],
      }),
    ];

    const changes = listMetroLevyPurposeChanges(districts);
    expect(changes).toHaveLength(1);
    expect(changes[0]?.purposeRaw).toBe("Total");
  });
});

describe("metroPurposeChangesWorthListingSeparately", () => {
  it("is false when there are no purpose changes", () => {
    expect(metroPurposeChangesWorthListingSeparately([], 0.01)).toBe(false);
  });

  it("hides a lone Total purpose that restates the district total", () => {
    expect(
      metroPurposeChangesWorthListingSeparately(
        [{ purposeRaw: "Total", rateDelta: 0.01 }],
        0.01,
      ),
    ).toBe(false);
  });

  it("hides a single part whose delta matches the district total", () => {
    expect(
      metroPurposeChangesWorthListingSeparately(
        [{ purposeRaw: "General Operating", rateDelta: 0.01 }],
        0.01,
      ),
    ).toBe(false);
  });

  it("keeps multiple part changes even when they net to the district total", () => {
    expect(
      metroPurposeChangesWorthListingSeparately(
        [
          { purposeRaw: "Bonds", rateDelta: 0.02 },
          { purposeRaw: "Contractual Obligation", rateDelta: -0.01 },
        ],
        0.01,
      ),
    ).toBe(true);
  });

  it("keeps parts when the district total delta is missing or near zero", () => {
    expect(
      metroPurposeChangesWorthListingSeparately(
        [{ purposeRaw: "Bonds", rateDelta: 0.02 }],
        null,
      ),
    ).toBe(true);
    expect(
      metroPurposeChangesWorthListingSeparately(
        [
          { purposeRaw: "Bonds", rateDelta: 0.02 },
          { purposeRaw: "Contractual Obligation", rateDelta: -0.02 },
        ],
        0,
      ),
    ).toBe(true);
  });

  it("keeps a single part when its delta differs from the district total", () => {
    expect(
      metroPurposeChangesWorthListingSeparately(
        [{ purposeRaw: "Bonds", rateDelta: 0.02 }],
        0.01,
      ),
    ).toBe(true);
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
  it("returns a neutral changed callout when any matched purpose moved", () => {
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
      metroBillImpactCalloutForDistrictIds(["a", "b"], districts),
    ).toMatchObject({
      message: "A metro district rate on your bill changed since last year.",
    });
  });

  it("returns the same neutral callout when priors are complete and dollars moved", () => {
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

    expect(metroBillImpactCalloutForDistrictIds(["a"], districts)).toMatchObject(
      {
        message: "A metro district rate on your bill changed since last year.",
      },
    );
  });

  it("returns null when no purpose rates changed", () => {
    const districts = [
      district({
        districtId: "a",
        name: "Alpha",
        levies: [
          {
            purposeRaw: "General Operating",
            purposeCategory: "operations",
            rateMillsCurrent: 0.02,
            rateMillsPrevious: 0.02,
            taborExempt: null,
            rawRowIndex: 1,
          },
        ],
      }),
    ];

    expect(metroBillImpactCalloutForDistrictIds(["a"], districts)).toBeNull();
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
      headline: "This levy changed from last year.",
    });
  });

  it("uses neutral copy for a tiny mills delta that would display as 0.000", () => {
    expect(metroDistrictTileYoYSummary(null, 0.0004, true)).toMatchObject({
      direction: "neutral",
      headline: "This levy changed from last year.",
    });
  });

  it("uses neutral copy when dollar delta is flat but purposes changed", () => {
    expect(metroDistrictTileYoYSummary(0, 0, true)).toMatchObject({
      direction: "neutral",
      headline: "This levy changed from last year.",
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
