// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { formatWiredCountyNamesForSourcesIntro } from "./sourcesIntroCopy";

describe("formatWiredCountyNamesForSourcesIntro", () => {
  it("joins wired display names with commas for the page intro prefix", () => {
    expect(
      formatWiredCountyNamesForSourcesIntro([
        { displayName: "Arapahoe County" },
        { displayName: "Douglas County" },
      ]),
    ).toBe("Arapahoe County, Douglas County");
  });

  it("returns a single name without a trailing comma", () => {
    expect(
      formatWiredCountyNamesForSourcesIntro([
        { displayName: "Arapahoe County" },
      ]),
    ).toBe("Arapahoe County");
  });

  it("returns an empty string when no counties are wired", () => {
    expect(formatWiredCountyNamesForSourcesIntro([])).toBe("");
  });
});
