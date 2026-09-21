// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  DASHBOARD_HSCROLL_TABLE_END_PAD_CLASS,
  DASHBOARD_HSCROLL_TABLE_FADE_RIGHT_CLASS,
} from "@/lib/toolFlowStyles";

describe("DashboardHScrollTable style contracts", () => {
  it("end pad grows with content without w-max preferred-width inflation", () => {
    expect(DASHBOARD_HSCROLL_TABLE_END_PAD_CLASS).toContain("inline-block");
    expect(DASHBOARD_HSCROLL_TABLE_END_PAD_CLASS).toContain("min-w-full");
    expect(DASHBOARD_HSCROLL_TABLE_END_PAD_CLASS).not.toMatch(/\bw-max\b/);
  });

  it("right-edge fade only (no left fade over sticky/first columns)", () => {
    expect(DASHBOARD_HSCROLL_TABLE_FADE_RIGHT_CLASS).toContain("from-slate-100");
    expect(DASHBOARD_HSCROLL_TABLE_FADE_RIGHT_CLASS).toContain(
      "pointer-events-none",
    );
    expect(DASHBOARD_HSCROLL_TABLE_FADE_RIGHT_CLASS).toContain("z-20");
    expect(DASHBOARD_HSCROLL_TABLE_FADE_RIGHT_CLASS).toContain("right-0");
    expect(DASHBOARD_HSCROLL_TABLE_FADE_RIGHT_CLASS).not.toContain("left-0");
  });
});
