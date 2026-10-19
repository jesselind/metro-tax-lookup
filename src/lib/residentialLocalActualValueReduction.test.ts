// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  residentialLocalActualValueReduction,
  residentialLocalActualValueReductionDollars,
  shouldTeachResidentialLocalActualValueReduction,
} from "@/lib/residentialLocalActualValueReduction";

describe("residentialLocalActualValueReduction", () => {
  it("subtracts 10% of appraised when under the $700k cap", () => {
    expect(residentialLocalActualValueReductionDollars(584_100)).toBe(58_410);
    expect(residentialLocalActualValueReduction(584_100)).toEqual({
      firstDollarsCap: 700_000,
      reductionRate: 0.1,
      reductionDollars: 58_410,
      adjustedActualDollars: 525_690,
    });
  });

  it("caps the reduction at 10% of $700,000", () => {
    expect(residentialLocalActualValueReductionDollars(900_000)).toBe(70_000);
    expect(residentialLocalActualValueReduction(900_000)?.adjustedActualDollars).toBe(
      830_000,
    );
  });

  it("matches demo local assessed after 6.8% on adjusted actual", () => {
    const r = residentialLocalActualValueReduction(584_100)!;
    expect(Math.round(r.adjustedActualDollars * 0.068)).toBe(35_747);
  });

  it("teaches only for residential dual from assessment year 2026", () => {
    expect(
      shouldTeachResidentialLocalActualValueReduction(2026, "residential_dual"),
    ).toBe(true);
    expect(
      shouldTeachResidentialLocalActualValueReduction(2025, "residential_dual"),
    ).toBe(false);
    expect(
      shouldTeachResidentialLocalActualValueReduction(2026, "single_rate"),
    ).toBe(false);
  });
});
