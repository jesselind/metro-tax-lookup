// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import {
  ARAPAHOE_COUNTY_CONFIG,
  DOUGLAS_COUNTY_CONFIG,
  validateCountyConfig,
  validateWiredCountyAdjacency,
} from "@/lib/countyConfig";
import {
  adjacentSitusCountyIds,
  adjacentWiredCountyIds,
  countyIdsForPrefetch,
  DEFAULT_COUNTY_SEARCH_SCOPE,
  DEFAULT_SEARCH_COUNTY_ID,
  orderedCountyIdsForAccountLookup,
  situsResolveWaves,
} from "@/lib/countySearchScope";

describe("county search scope", () => {
  it("defaults to Arapahoe county scope", () => {
    expect(DEFAULT_SEARCH_COUNTY_ID).toBe("arapahoe");
    expect(DEFAULT_COUNTY_SEARCH_SCOPE).toEqual({
      kind: "county",
      countyId: "arapahoe",
    });
  });

  it("prefetches only the selected county (not adjacent)", () => {
    expect(countyIdsForPrefetch({ kind: "county", countyId: "arapahoe" })).toEqual([
      "arapahoe",
    ]);
    expect(countyIdsForPrefetch({ kind: "county", countyId: "douglas" })).toEqual([
      "douglas",
    ]);
  });

  it("prefetches all situs-enabled counties when unknown", () => {
    expect(countyIdsForPrefetch({ kind: "unknown" })).toEqual([
      "arapahoe",
      "douglas",
    ]);
  });

  it("builds selected then adjacent resolve waves", () => {
    expect(situsResolveWaves({ kind: "county", countyId: "arapahoe" })).toEqual([
      ["arapahoe"],
      ["douglas"],
    ]);
    expect(situsResolveWaves({ kind: "unknown" })).toEqual([
      ["arapahoe", "douglas"],
    ]);
  });

  it("lists Arapahoe ↔ Douglas adjacency from config", () => {
    expect(ARAPAHOE_COUNTY_CONFIG.adjacentCountyIds).toEqual(["douglas"]);
    expect(DOUGLAS_COUNTY_CONFIG.adjacentCountyIds).toEqual(["arapahoe"]);
    expect(adjacentWiredCountyIds("arapahoe")).toEqual(["douglas"]);
    expect(adjacentSitusCountyIds("douglas")).toEqual(["arapahoe"]);
    expect(validateWiredCountyAdjacency()).toBeNull();
  });

  it("rejects self-adjacent config", () => {
    expect(
      validateCountyConfig({
        ...ARAPAHOE_COUNTY_CONFIG,
        adjacentCountyIds: ["arapahoe"],
      }),
    ).toMatch(/must not include self/);
  });

  it("orders account lookup selected → adjacent among format matches", () => {
    expect(
      orderedCountyIdsForAccountLookup(["douglas", "arapahoe"], {
        kind: "county",
        countyId: "arapahoe",
      }),
    ).toEqual(["arapahoe", "douglas"]);
    expect(
      orderedCountyIdsForAccountLookup(["douglas", "arapahoe"], {
        kind: "unknown",
      }),
    ).toEqual(["douglas", "arapahoe"]);
  });
});
