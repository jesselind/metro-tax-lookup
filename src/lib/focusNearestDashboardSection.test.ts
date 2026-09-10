// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  highlightNeedsStartScroll,
  resolveDashboardJumpScrollBlock,
} from "@/lib/focusNearestDashboardSection";

describe("highlightNeedsStartScroll", () => {
  it("is true when the tiles start in the lower part of the viewport", () => {
    expect(highlightNeedsStartScroll(500, 800)).toBe(true);
  });

  it("is false when the tiles already sit high on screen", () => {
    expect(highlightNeedsStartScroll(80, 800)).toBe(false);
  });
});

describe("resolveDashboardJumpScrollBlock", () => {
  it("uses start when focus sits under the sticky bar", () => {
    expect(
      resolveDashboardJumpScrollBlock({
        focusTop: 20,
        highlightTop: 40,
        viewportHeight: 800,
        stickyInsetPx: 56,
      }),
    ).toBe("start");
  });

  it("uses nearest when the highlight is already high in the content area", () => {
    expect(
      resolveDashboardJumpScrollBlock({
        focusTop: 80,
        highlightTop: 100,
        viewportHeight: 800,
        stickyInsetPx: 56,
      }),
    ).toBe("nearest");
  });

  it("uses start when the highlight is mostly below the content fold", () => {
    expect(
      resolveDashboardJumpScrollBlock({
        focusTop: 80,
        highlightTop: 500,
        viewportHeight: 800,
        stickyInsetPx: 56,
      }),
    ).toBe("start");
  });
});
