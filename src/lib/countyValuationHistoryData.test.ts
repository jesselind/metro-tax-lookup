// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  lookupValuationHistorySeries,
  validateCountyValuationHistoryByAccountFile,
} from "@/lib/countyValuationHistoryData";
import { assessedValueDeltaFromHistory } from "@/lib/valuationHistoryYoY";
import { SYNTHETIC_DOUGLAS_PIN } from "@/lib/syntheticTestIds";

const SHIPPED_HISTORY_DIR = join(
  process.cwd(),
  "public/data/douglas-valuation-history-by-account",
);

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

  it("loads a shipped Douglas history shard (full-county extract)", () => {
    const shardNames = readdirSync(SHIPPED_HISTORY_DIR).filter((name) =>
      name.endsWith(".json"),
    );
    // Spot-check era had 367 shards; full retain ship is thousands.
    expect(shardNames.length).toBeGreaterThan(1000);

    const raw = JSON.parse(
      readFileSync(join(SHIPPED_HISTORY_DIR, "R03990.json"), "utf8"),
    ) as unknown;
    expect(validateCountyValuationHistoryByAccountFile(raw)).toBeNull();
    const series = lookupValuationHistorySeries("R0399058", raw as never, "douglas");
    expect(series).not.toBeNull();
    expect(series!.length).toBeGreaterThanOrEqual(2);
    expect(series![0]?.taxYear).toBeLessThan(series!.at(-1)!.taxYear);
  });
});
