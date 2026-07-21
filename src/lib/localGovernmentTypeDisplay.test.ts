// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { formatLocalGovernmentTypeForDisplay } from "@/lib/localGovernmentTypeDisplay";

describe("formatLocalGovernmentTypeForDisplay", () => {
  it("never surfaces bare State as a government type", () => {
    expect(formatLocalGovernmentTypeForDisplay("State")).toBe(
      "Local levy (state program)",
    );
    expect(formatLocalGovernmentTypeForDisplay("state")).toBe(
      "Local levy (state program)",
    );
  });

  it("keeps ordinary DOLA plurals as short singulars", () => {
    expect(formatLocalGovernmentTypeForDisplay("Counties")).toBe("County");
    expect(formatLocalGovernmentTypeForDisplay("Metropolitan Districts")).toBe(
      "Metropolitan district",
    );
  });
});
