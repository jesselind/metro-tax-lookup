// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";

describe("formatLevyBundledAsOf", () => {
  it("formats YYYY-MM-DD as a long local date", () => {
    expect(formatLevyBundledAsOf("2026-08-03")).toBe("August 3, 2026");
  });

  it("formats YYYY-MM as month and year", () => {
    expect(formatLevyBundledAsOf("2026-08")).toBe("August 2026");
  });

  it("returns unparseable input unchanged", () => {
    expect(formatLevyBundledAsOf("not-a-date")).toBe("not-a-date");
  });
});
