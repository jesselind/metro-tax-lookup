// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  DEMO_AIN,
  DEMO_DISPLAY_PIN,
  loadDemoProperty,
} from "@/lib/demoProperty";

describe("loadDemoProperty", () => {
  it("loads a PIN-less fixture with levy lines and fictional identity fields", () => {
    const demo = loadDemoProperty();
    expect(demo.levy.matchedPin).toBe(DEMO_DISPLAY_PIN);
    expect(demo.levy.ain).toBe(DEMO_AIN);
    expect(demo.levy.lines.length).toBeGreaterThan(0);
    expect(demo.parcelRecord.ownerList).toBe("John Doe, Jane Doe");
    expect(demo.parcelRecord.situsAddress).toBe("1234 EXAMPLE LANE");
    expect(JSON.stringify(demo)).not.toMatch(/035457397/);
  });
});
