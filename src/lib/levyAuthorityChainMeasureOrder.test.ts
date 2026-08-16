// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { measureElectionChronologyKey } from "@/lib/levyAuthorityChainMeasureOrder";

describe("levyAuthorityChainMeasureOrder", () => {
  it("orders Month YYYY strings chronologically", () => {
    expect(measureElectionChronologyKey("November 2020")).toBeLessThan(
      measureElectionChronologyKey("August 2022"),
    );
  });

  it("rejects malformed electionMonthYear strings", () => {
    expect(() => measureElectionChronologyKey("2020")).toThrow(/Month YYYY/);
  });

  it("rejects unrecognized month names in Month YYYY strings", () => {
    expect(() => measureElectionChronologyKey("Smarch 2020")).toThrow(
      /month not recognized/i,
    );
  });
});
