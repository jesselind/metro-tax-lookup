// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  districtCommonNameGloss,
  normalizeDistrictCommonNameLgId,
} from "@/content/districtCommonNames";

describe("normalizeDistrictCommonNameLgId", () => {
  it("pads short digit ids", () => {
    expect(normalizeDistrictCommonNameLgId("64907")).toBe("64907");
    expect(normalizeDistrictCommonNameLgId("907")).toBe("00907");
  });

  it("returns null for empty", () => {
    expect(normalizeDistrictCommonNameLgId("")).toBeNull();
    expect(normalizeDistrictCommonNameLgId(null)).toBeNull();
  });
});

describe("districtCommonNameGloss", () => {
  it("glosses Adams-Arapahoe 28J as Aurora Public Schools", () => {
    const result = districtCommonNameGloss({
      lgId: "64907",
      legalName: "Adams-Arapahoe 28J School District",
    });
    expect(result?.commonName).toBe("Aurora Public Schools");
    expect(result?.line).toContain("Also known as Aurora Public Schools.");
    expect(result?.line).toContain("J means joint");
    expect(result?.line).not.toMatch(/\u2014/);
  });

  it("is null when lgId has no curated row", () => {
    expect(
      districtCommonNameGloss({
        lgId: "64908",
        legalName: "Byers 32J School District",
      }),
    ).toBeNull();
  });

  it("is null when common name already matches legal name", () => {
    expect(
      districtCommonNameGloss({
        lgId: "64907",
        legalName: "Aurora Public Schools",
      }),
    ).toBeNull();
  });

  it("is null without a legal name", () => {
    expect(
      districtCommonNameGloss({ lgId: "64907", legalName: "  " }),
    ).toBeNull();
  });
});
