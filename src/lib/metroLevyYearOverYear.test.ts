// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import type { LevyDistrictFromJson } from "@/lib/levyTypes";
import {
  billImpactCalloutForLevyLines,
  buildLevyLineYoYViewModel,
  levyLineHasMillRateChange,
  levyLineMillDelta,
  levyPurposeRateChanged,
  listMetroLevyPurposeChanges,
  metroBillImpactCalloutForDistrictIds,
  metroDistrictDeltaDollarsFromRates,
  metroDistrictForLgId,
  metroDistrictTileYoYSummary,
  metroLevyDistrictTotalChange,
  metroLgIdsWithPurposeMillChanges,
  metroPurposeChangesWorthListingSeparately,
  metroPurposeTotalsReconcileWithAuth,
  metroPurposeYoYTrustedForLine,
  metroYoYDirectionFromRateDelta,
  STACK_RATE_CHANGE_CALLOUT_MESSAGE,
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
      message: STACK_RATE_CHANGE_CALLOUT_MESSAGE,
      direction: "neutral",
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
        message: STACK_RATE_CHANGE_CALLOUT_MESSAGE,
        direction: "neutral",
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
  it("prefers mills headline with optional theoretical dollars", () => {
    expect(metroDistrictTileYoYSummary(0.617, 4, true)).toMatchObject({
      direction: "more",
      headline: "This part is 0.617 mills higher than last year.",
      theoreticalDeltaDollars: 4,
    });
  });

  it("uses neutral copy when only purpose rows changed", () => {
    expect(metroDistrictTileYoYSummary(null, null, true)).toMatchObject({
      direction: "neutral",
      headline: "This part of your bill changed from last year.",
      theoreticalDeltaDollars: null,
    });
  });

  it("uses neutral copy for a tiny mills delta that would display as 0.000", () => {
    expect(metroDistrictTileYoYSummary(0.0004, null, true)).toMatchObject({
      direction: "neutral",
      headline: "This part of your bill changed from last year.",
    });
  });

  it("omits theoretical dollars when the delta is flat", () => {
    expect(metroDistrictTileYoYSummary(0, 0, true)).toMatchObject({
      direction: "neutral",
      theoreticalDeltaDollars: null,
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

describe("levyLineHasMillRateChange / billImpactCalloutForLevyLines", () => {
  it("flags AUTH total mill changes from Levy % history", () => {
    const line: CommittedLevyLine = {
      id: "auth-line",
      authority: "Englewood School",
      mills: 51.071,
      levyLineCode: "0101",
    };
    expect(levyLineHasMillRateChange(line)).toBe(true);
    expect(billImpactCalloutForLevyLines([line])).toMatchObject({
      direction: "neutral",
      message: STACK_RATE_CHANGE_CALLOUT_MESSAGE,
    });
  });

  it("returns the same neutral callout when net mill deltas are down", () => {
    const line: CommittedLevyLine = {
      id: "fire",
      authority: "Bennett Fire",
      mills: 10.898,
      levyLineCode: "4060",
    };
    expect(billImpactCalloutForLevyLines([line])).toMatchObject({
      direction: "neutral",
      message: STACK_RATE_CHANGE_CALLOUT_MESSAGE,
    });
  });

  it("returns null callout when AUTH code is absent from history", () => {
    const line: CommittedLevyLine = {
      id: "unknown",
      authority: "Synthetic",
      mills: 10,
      levyLineCode: "9999",
    };
    expect(levyLineHasMillRateChange(line)).toBe(false);
    expect(billImpactCalloutForLevyLines([line])).toBeNull();
  });

  it("returns neutral callout when any line changed", () => {
    const line: CommittedLevyLine = {
      id: "auth-line",
      authority: "Englewood School",
      mills: 51.071,
      levyLineCode: "0101",
    };
    expect(billImpactCalloutForLevyLines([line])).toMatchObject({
      direction: "neutral",
      message: STACK_RATE_CHANGE_CALLOUT_MESSAGE,
    });
  });
});

describe("buildLevyLineYoYViewModel", () => {
  it("uses AUTH totals with Tax Year labels when metro purposes are absent", () => {
    const vm = buildLevyLineYoYViewModel(
      {
        levyLineCode: "0101",
        dolaMatch: null,
      },
      100_000,
    );
    expect(vm).not.toBeNull();
    expect(vm?.previousYearLabel).toBe("Tax Year 2024");
    expect(vm?.currentYearLabel).toBe("Tax Year 2025");
    expect(vm?.showPurposeDetails).toBe(false);
    expect(vm?.totalCompare?.previousMillsLabel).toBe("50.071");
    expect(vm?.totalCompare?.currentMillsLabel).toBe("51.071");
    expect(vm?.summary.headline).toMatch(/1\.000 mills higher/i);
    expect(vm?.summary.theoreticalDeltaDollars).toBe(100);
  });

  it("prefers metro purpose path when Public Info purposes changed", () => {
    const vm = buildLevyLineYoYViewModel(
      {
        levyLineCode: "8888",
        dolaMatch: {
          method: "fuzzy",
          confidence: "high",
          lgId: "65214",
        },
      },
      6800,
    );
    expect(vm).not.toBeNull();
    expect(vm?.showPurposeDetails || vm?.purposeChanges.length).toBeTruthy();
    expect(vm?.previousYearLabel).toBe("Tax Year 2024");
    expect(vm?.currentYearLabel).toBe("Tax Year 2025");
  });

  it("falls back to AUTH totals when Public Info parts do not reconcile", () => {
    const line = {
      levyLineCode: "4570",
      dolaMatch: {
        method: "fuzzy" as const,
        confidence: "high" as const,
        lgId: "65416",
      },
    };
    const skyRanch1 = metroDistrictForLgId("65416");
    expect(skyRanch1).not.toBeNull();
    expect(metroPurposeTotalsReconcileWithAuth(skyRanch1!)).toBe(false);
    expect(metroPurposeYoYTrustedForLine(line)).toBe(false);
    // 78.446 -> 76.08 = -2.366 mills (not the bogus -120 from bad prior ops).
    expect(levyLineMillDelta(line)).toBeCloseTo(-2.366, 3);

    const vm = buildLevyLineYoYViewModel(line, 500_000);
    expect(vm).not.toBeNull();
    expect(vm?.showPurposeDetails).toBe(false);
    expect(vm?.purposeChanges).toHaveLength(0);
    expect(vm?.totalCompare?.previousMillsLabel).toBe("78.446");
    expect(vm?.totalCompare?.currentMillsLabel).toBe("76.080");
    expect(vm?.totalCompare?.differenceMillsLabel).toBe("-2.366");
  });

  it("keeps metro purpose path when parts reconcile to AUTH (Sky Ranch #3)", () => {
    const line = {
      levyLineCode: "4571",
      dolaMatch: {
        method: "fuzzy" as const,
        confidence: "high" as const,
        lgId: "65417",
      },
    };
    const skyRanch3 = metroDistrictForLgId("65417");
    expect(skyRanch3).not.toBeNull();
    expect(metroPurposeTotalsReconcileWithAuth(skyRanch3!)).toBe(true);
    expect(metroPurposeYoYTrustedForLine(line)).toBe(true);
    expect(levyLineMillDelta(line)).toBeCloseTo(-0.431, 3);

    const vm = buildLevyLineYoYViewModel(line, 500_000);
    expect(vm).not.toBeNull();
    expect(vm?.totalCompare?.previousMillsLabel).toBe("119.387");
    expect(vm?.totalCompare?.currentMillsLabel).toBe("118.956");
    expect(vm?.purposeChanges.length).toBeGreaterThan(0);
  });
});