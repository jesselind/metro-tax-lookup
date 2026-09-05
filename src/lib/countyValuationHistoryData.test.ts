// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import {
  lookupValuationHistorySeries,
  validateCountyValuationHistoryByAccountFile,
} from "@/lib/countyValuationHistoryData";
import { assessedValueDeltaFromHistory } from "@/lib/valuationHistoryYoY";
import { SYNTHETIC_DOUGLAS_PIN } from "@/lib/syntheticTestIds";

describe("countyValuationHistoryData", () => {
  it("validates shard shape", () => {
    expect(
      validateCountyValuationHistoryByAccountFile({
        byAccount: {
          R0100001: [{ taxYear: 2025, actualValue: 1, assessedValue: 2 }],
        },
      }),
    ).toBeNull();
    expect(
      validateCountyValuationHistoryByAccountFile({ byAccount: {} }),
    ).toBeNull();
    expect(
      validateCountyValuationHistoryByAccountFile({
        byAccount: { x: [{ taxYear: "2025", actualValue: 1, assessedValue: 2 }] },
      }),
    ).toMatch(/invalid point/);
  });

  it("looks up series and assessed delta", () => {
    const file = {
      byAccount: {
        [SYNTHETIC_DOUGLAS_PIN]: [
          { taxYear: 2025, actualValue: 360000, assessedValue: 25740 },
          { taxYear: 2026, actualValue: 380000, assessedValue: 27170 },
        ],
      },
      pinDigits: 8,
    };
    const series = lookupValuationHistorySeries(
      SYNTHETIC_DOUGLAS_PIN,
      file,
      "douglas",
    );
    expect(series).toHaveLength(2);
    expect(
      assessedValueDeltaFromHistory(series!, 27170, 2026),
    ).toBe(1430);
  });
});
