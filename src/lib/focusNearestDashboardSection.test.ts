// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { highlightNeedsStartScroll } from "@/lib/focusNearestDashboardSection";

describe("highlightNeedsStartScroll", () => {
  it("is true when the tiles start in the lower part of the viewport", () => {
    expect(highlightNeedsStartScroll(500, 800)).toBe(true);
  });

  it("is false when the tiles already sit high on screen", () => {
    expect(highlightNeedsStartScroll(80, 800)).toBe(false);
  });
});
